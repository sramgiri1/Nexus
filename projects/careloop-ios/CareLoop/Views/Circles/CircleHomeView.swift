import SwiftUI

struct CircleHomeView: View {
    @EnvironmentObject private var appState: AppState

    @State private var tasks:              [CareTask] = []
    @State private var loading             = true
    @State private var error:              String?
    @State private var deepLinkToTaskBoard = false

    // MARK: – Design tokens
    private let teal  = Color(red: 0.16, green: 0.80, blue: 0.72)
    private let blue  = Color(red: 0.13, green: 0.56, blue: 0.87)
    private let green = Color(red: 0.12, green: 0.68, blue: 0.49)
    private let dark  = Color(red: 0.10, green: 0.16, blue: 0.24)
    private let mid   = Color(red: 0.43, green: 0.50, blue: 0.60)
    private let bg    = Color(red: 0.95, green: 0.96, blue: 0.99)
    private let rose  = Color(red: 0.85, green: 0.30, blue: 0.50)

    private let twoColumns = [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)]

    // MARK: – Role helpers
    private var role: MemberRole { appState.userRole }
    private var isAdmin:     Bool { role == .admin }
    private var isMember:    Bool { role == .member }
    private var isRecipient: Bool { role == .recipient }

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                if let circle = appState.activeCircle {
                    VStack(alignment: .leading, spacing: 22) {
                        heroCard(circle: circle)
                        statsRow(circle: circle)
                        actionsSection(circle: circle)
                        previewSection
                        if let err = error {
                            Text(err).font(.footnote).foregroundStyle(.red)
                        }
                        Spacer(minLength: 32)
                    }
                    .padding(18)
                } else {
                    ProgressView()
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.top, 80)
                }
            }
            .background(bg.ignoresSafeArea())
            .navigationTitle(appState.activeCircle?.name ?? "CareLoop")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button { appState.clearActiveCircleSelection() } label: {
                        Image(systemName: "square.grid.2x2")
                    }
                }
            }
            .navigationDestination(isPresented: $deepLinkToTaskBoard) {
                if isRecipient {
                    RecipientBoardView().environmentObject(appState)
                } else {
                    CirclesView().environmentObject(appState)
                }
            }
            .task { await loadTasks() }
            .onChange(of: appState.pendingTaskId) { id in
                if id != nil, !deepLinkToTaskBoard { deepLinkToTaskBoard = true }
            }
            .onChange(of: appState.activeCircle?.id) { _ in Task { await loadTasks() } }
            .refreshable {
                if let id = appState.activeCircle?.id {
                    try? await appState.activateCircle(id: id)
                }
                await loadTasks()
            }
        }
        .careLoopBrandBanner()
    }

    // MARK: – Hero card

    @ViewBuilder
    private func heroCard(circle: CareCircle) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                // Role icon
                ZStack {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(LinearGradient(
                            colors: [roleGradientStart, roleGradientEnd],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ))
                    Image(systemName: roleIcon)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                }
                .frame(width: 48, height: 48)

                VStack(alignment: .leading, spacing: 3) {
                    Text(circle.name)
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundStyle(dark)
                    Text(roleTagline)
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(mid)
                }
                Spacer()
            }

            HStack(spacing: 8) {
                roleBadge
                if !isRecipient && !circle.recipientDisplaySummary.isEmpty {
                    labelChip(
                        circle.recipientDisplaySummary,
                        icon: "heart.fill",
                        tint: rose,
                        fill: rose.opacity(0.08)
                    )
                }
            }
        }
        .padding(18)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 3)
    }

    private var roleIcon: String {
        switch role {
        case .admin:     return "star.fill"
        case .member:    return "hands.and.sparkles.fill"
        case .recipient: return "heart.fill"
        }
    }

    private var roleGradientStart: Color {
        switch role {
        case .admin:     return blue
        case .member:    return teal
        case .recipient: return rose
        }
    }

    private var roleGradientEnd: Color {
        switch role {
        case .admin:     return Color(red: 0.08, green: 0.40, blue: 0.75)
        case .member:    return blue
        case .recipient: return Color(red: 0.95, green: 0.55, blue: 0.30)
        }
    }

    private var roleTagline: String {
        switch role {
        case .admin:     return "You manage this care circle"
        case .member:    return "You're a caregiver in this circle"
        case .recipient: return "This circle is organized for your care"
        }
    }

    @ViewBuilder
    private var roleBadge: some View {
        HStack(spacing: 5) {
            Image(systemName: roleIcon).font(.system(size: 10, weight: .bold))
            Text(role.displayLabel)
                .font(.system(size: 12, weight: .bold, design: .rounded))
        }
        .foregroundStyle(roleGradientStart)
        .padding(.horizontal, 10).padding(.vertical, 5)
        .background(roleGradientStart.opacity(0.10), in: Capsule())
    }

    private func labelChip(_ title: String, icon: String, tint: Color, fill: Color) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 9, weight: .bold))
            Text(title).font(.system(size: 12, weight: .bold, design: .rounded))
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 10).padding(.vertical, 5)
        .background(fill, in: Capsule())
    }

    // MARK: – Stats row (role-specific)

    @ViewBuilder
    private func statsRow(circle: CareCircle) -> some View {
        switch role {
        case .admin:
            LazyVGrid(columns: twoColumns, spacing: 14) {
                statCard("Active tasks",
                         value: "\(tasks.filter { $0.status != .done && $0.status != .skipped }.count)",
                         icon: "checklist", tint: blue)
                statCard("Completed",
                         value: "\(tasks.filter { $0.status == .done || $0.status == .skipped }.count)",
                         icon: "checkmark.circle.fill", tint: green)
                statCard("Caregivers",
                         value: "\((circle.members ?? []).filter { $0.role != .recipient }.count)",
                         icon: "person.2.fill", tint: mid)
                statCard("Recipients",
                         value: "\(circle.recipientNames.count)",
                         icon: "heart.fill", tint: rose)
            }

        case .member:
            let myId = appState.currentUser?.id ?? ""
            LazyVGrid(columns: twoColumns, spacing: 14) {
                statCard("Active tasks",
                         value: "\(tasks.filter { $0.status != .done && $0.status != .skipped }.count)",
                         icon: "checklist", tint: blue)
                statCard("Assigned to me",
                         value: "\(tasks.filter { $0.assigneeId == myId && $0.status != .done && $0.status != .skipped }.count)",
                         icon: "person.badge.clock.fill", tint: teal)
            }

        case .recipient:
            LazyVGrid(columns: twoColumns, spacing: 14) {
                statCard("Today's tasks",
                         value: "\(tasks.filter { t in t.dueAt.map { Calendar.current.isDateInToday($0) } ?? false && t.status != .done && t.status != .skipped }.count)",
                         icon: "sun.max.fill", tint: rose)
                statCard("Caregivers",
                         value: "\((circle.members ?? []).filter { $0.role != .recipient }.count)",
                         icon: "person.2.fill", tint: blue)
            }
        }
    }

    @ViewBuilder
    private func statCard(_ title: String, value: String, icon: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(tint)
                Spacer()
            }
            Text(value)
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(tint)
            Text(title)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundStyle(mid)
        }
        .frame(maxWidth: .infinity, minHeight: 110, alignment: .leading)
        .padding(16)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }

    // MARK: – Actions section (role-specific)

    @ViewBuilder
    private func actionsSection(circle: CareCircle) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader(role == .recipient ? "Your Care" : "Actions")

            switch role {
            case .admin:   adminActions
            case .member:  memberActions
            case .recipient: recipientActions
            }
        }
    }

    // Admin: Featured task board + 2×2 grid
    @ViewBuilder
    private var adminActions: some View {
        featuredActionLink(
            title: "Task Board",
            subtitle: "Add, assign, and track all care tasks",
            icon: "checklist.checked",
            badge: overdueCount > 0 ? "\(overdueCount) overdue" : nil,
            badgeColor: .red
        ) { CirclesView().environmentObject(appState) }

        LazyVGrid(columns: twoColumns, spacing: 14) {
            secondaryActionLink(title: "Members",    icon: "person.2.fill",          tint: blue,  subtitle: "Invite & manage caregivers") { MemberListView().environmentObject(appState) }
            secondaryActionLink(title: "Insights",   icon: "chart.bar.fill",          tint: green, subtitle: "Completion patterns")           { AdminInsightsView().environmentObject(appState) }
            secondaryActionLink(title: "Activity",   icon: "clock.fill",              tint: teal,  subtitle: "Circle timeline")               { ActivityFeedView().environmentObject(appState) }
            secondaryActionLink(title: "Settings",   icon: "gearshape.fill",          tint: mid,   subtitle: "Archive & circle preferences")  { SettingsView().environmentObject(appState) }
            if let circle = appState.activeCircle {
                ShareLink(
                    item: "Join \(circle.name) on CareLoop!\nCircle code: \(circle.id)",
                    subject: Text("Join my CareLoop circle")
                ) {
                    secondaryCard(title: "Share Circle", icon: "square.and.arrow.up", tint: blue, subtitle: "Invite via message or link")
                }
                .buttonStyle(.plain)
            }
        }
    }

    // Member: Featured task board + Members + Settings
    @ViewBuilder
    private var memberActions: some View {
        featuredActionLink(
            title: "Task Board",
            subtitle: "View and complete tasks for this circle",
            icon: "checklist",
            badge: myAssignedCount > 0 ? "\(myAssignedCount) assigned to me" : nil,
            badgeColor: teal
        ) { CirclesView().environmentObject(appState) }

        LazyVGrid(columns: twoColumns, spacing: 14) {
            secondaryActionLink(title: "Members",  icon: "person.2.fill",  tint: blue, subtitle: "See who's in this circle") { MemberListView().environmentObject(appState) }
            secondaryActionLink(title: "Activity", icon: "clock.fill",     tint: mid,  subtitle: "Circle timeline")          { ActivityFeedView().environmentObject(appState) }
            secondaryActionLink(title: "Settings", icon: "gearshape.fill", tint: mid,  subtitle: "Circle preferences")       { SettingsView().environmentObject(appState) }
        }
    }

    // Recipient: My Care featured card only
    @ViewBuilder
    private var recipientActions: some View {
        featuredActionLink(
            title: "My Care",
            subtitle: "See all tasks being done for you today and coming up",
            icon: "heart.text.square.fill",
            badge: todayForRecipientCount > 0 ? "\(todayForRecipientCount) today" : nil,
            badgeColor: rose
        ) { CirclesView().environmentObject(appState) }
    }

    // MARK: – Featured action card (full-width gradient)

    @ViewBuilder
    private func featuredActionLink<Destination: View>(
        title: String,
        subtitle: String,
        icon: String,
        badge: String?,
        badgeColor: Color,
        @ViewBuilder destination: () -> Destination
    ) -> some View {
        NavigationLink(destination: destination) {
            featuredCard(title: title, subtitle: subtitle, icon: icon, badge: badge, badgeColor: badgeColor)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func featuredCard(title: String, subtitle: String, icon: String, badge: String?, badgeColor: Color) -> some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(LinearGradient(
                        colors: [roleGradientStart.opacity(0.18), roleGradientEnd.opacity(0.10)],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    ))
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(roleGradientStart)
            }
            .frame(width: 52, height: 52)

            VStack(alignment: .leading, spacing: 5) {
                HStack(spacing: 8) {
                    Text(title)
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(dark)
                    if let badge {
                        Text(badge)
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundStyle(badgeColor)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(badgeColor.opacity(0.10), in: Capsule())
                    }
                }
                Text(subtitle)
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(mid)
                    .lineLimit(2)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.tertiary)
        }
        .padding(18)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 3)
    }

    // MARK: – Secondary action cards

    @ViewBuilder
    private func secondaryActionLink<Destination: View>(
        title: String, icon: String, tint: Color, subtitle: String,
        @ViewBuilder destination: () -> Destination
    ) -> some View {
        NavigationLink(destination: destination) {
            secondaryCard(title: title, icon: icon, tint: tint, subtitle: subtitle)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func secondaryActionButton(
        title: String, icon: String, tint: Color, subtitle: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            secondaryCard(title: title, icon: icon, tint: tint, subtitle: subtitle)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func secondaryCard(title: String, icon: String, tint: Color, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(tint.opacity(0.10))
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(tint)
            }
            .frame(width: 42, height: 42)
            Text(title)
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(dark)
            Text(subtitle)
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(mid)
                .multilineTextAlignment(.leading)
                .lineLimit(2)
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, minHeight: 140, alignment: .leading)
        .padding(16)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }

    // MARK: – Preview section (role-specific)

    @ViewBuilder
    private var previewSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                sectionHeader(isRecipient ? "Today's Care" : "Next Up")
                Spacer()
                NavigationLink {
                    CirclesView().environmentObject(appState)
                } label: {
                    Text(isRecipient ? "View all" : "Open task board")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(isRecipient ? rose : blue)
                }
            }

            if loading {
                previewShell {
                    HStack { Spacer(); ProgressView(); Spacer() }.padding(.vertical, 18)
                }
            } else if previewTasks.isEmpty {
                previewShell {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(isRecipient ? "Nothing scheduled for today" : "No upcoming tasks")
                            .font(.system(size: 15, weight: .bold, design: .rounded)).foregroundStyle(dark)
                        Text(isRecipient
                             ? "Your caregivers haven't scheduled tasks for today yet."
                             : "Tap 'Open task board' to add the first task.")
                            .font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(mid)
                    }
                    .padding(18)
                }
            } else {
                previewShell {
                    VStack(spacing: 0) {
                        ForEach(Array(previewTasks.enumerated()), id: \.element.id) { idx, task in
                            previewRow(task)
                            if idx < previewTasks.count - 1 {
                                Divider().padding(.leading, 54)
                            }
                        }
                    }
                }
            }
        }
    }

    private var previewTasks: [CareTask] {
        let base = tasks
            .filter { $0.status != .done && $0.status != .skipped }
            .sorted {
                switch ($0.dueAt, $1.dueAt) {
                case let (l?, r?): return l < r
                case (_?, nil): return true
                case (nil, _?): return false
                case (nil, nil): return $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending
                }
            }

        if isRecipient {
            return base.filter { t in t.dueAt.map { Calendar.current.isDateInToday($0) } ?? false }.prefix(4).map { $0 }
        }
        if isMember {
            let myId = appState.currentUser?.id ?? ""
            let mine = base.filter { $0.assigneeId == myId }
            return mine.isEmpty ? Array(base.prefix(3)) : Array(mine.prefix(3))
        }
        return Array(base.prefix(3))
    }

    @ViewBuilder
    private func previewRow(_ task: CareTask) -> some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(task.isOverdue ? Color.red.opacity(0.12) : roleGradientStart.opacity(0.10))
                    .frame(width: 40, height: 40)
                Image(systemName: task.isOverdue ? "exclamationmark" : previewRowIcon)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(task.isOverdue ? .red : roleGradientStart)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(task.title)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(dark).lineLimit(1)

                HStack(spacing: 5) {
                    if isRecipient, let assignee = task.assignee?.name {
                        let first = assignee.split(separator: " ").first.map(String.init) ?? assignee
                        Text(first).font(.system(size: 12, weight: .medium, design: .rounded)).foregroundStyle(blue)
                        Text("·").foregroundStyle(.quaternary)
                    }
                    if let due = task.dueAt {
                        Text(previewDueLabel(due))
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(task.isOverdue ? .red : mid)
                    } else if let recipient = task.recipient?.name, !isRecipient {
                        Text(recipient)
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(mid)
                    }
                }
            }
            Spacer()
        }
        .padding(.vertical, 12).padding(.horizontal, 18)
    }

    private var previewRowIcon: String {
        switch role {
        case .admin, .member: return "checklist"
        case .recipient:      return "heart"
        }
    }

    private func previewDueLabel(_ date: Date) -> String {
        if date < Date() { return "Overdue" }
        if Calendar.current.isDateInToday(date) { return date.formatted(date: .omitted, time: .shortened) }
        if Calendar.current.isDateInTomorrow(date) { return "Tomorrow" }
        return date.formatted(date: .abbreviated, time: .omitted)
    }

    private func previewShell<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .background(Color.white, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }

    // MARK: – Section header

    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 18, weight: .bold, design: .rounded))
            .foregroundStyle(dark)
    }

    // MARK: – Counts

    private var overdueCount: Int {
        tasks.filter { $0.isOverdue }.count
    }

    private var myAssignedCount: Int {
        let myId = appState.currentUser?.id ?? ""
        return tasks.filter { $0.assigneeId == myId && $0.status != .done && $0.status != .skipped }.count
    }

    private var todayForRecipientCount: Int {
        tasks.filter { t in
            guard t.status != .done, t.status != .skipped else { return false }
            return t.dueAt.map { Calendar.current.isDateInToday($0) } ?? false
        }.count
    }

    // MARK: – Data

    private func loadTasks() async {
        guard let circleId = appState.activeCircle?.id else {
            tasks = []; loading = false; return
        }
        loading = true; error = nil
        do { tasks = try await APIClient.shared.fetchTasks(circleId: circleId) }
        catch { self.error = error.localizedDescription }
        loading = false
    }
}
