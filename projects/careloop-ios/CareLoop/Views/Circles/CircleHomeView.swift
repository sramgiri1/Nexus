import SwiftUI

struct CircleHomeView: View {
    @EnvironmentObject private var appState: AppState

    @State private var tasks: [CareTask] = []
    @State private var loading = true
    @State private var error: String?
    @State private var showRecipients = false

    private let columns = [
        GridItem(.flexible(), spacing: 14),
        GridItem(.flexible(), spacing: 14)
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    if let circle = appState.activeCircle {
                        hero(circle: circle)
                        summaryGrid(circle: circle)
                        operationsGrid
                        upcomingSection
                    } else {
                        ProgressView()
                            .frame(maxWidth: .infinity, alignment: .center)
                            .padding(.top, 60)
                    }

                    if let error {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                }
                .padding(20)
            }
            .background(Color(red: 0.95, green: 0.96, blue: 0.99).ignoresSafeArea())
            .navigationTitle(appState.activeCircle?.name ?? "CareLoop")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        appState.clearActiveCircleSelection()
                    } label: {
                        Image(systemName: "square.grid.2x2")
                    }
                }
            }
            .sheet(isPresented: $showRecipients) {
                RecipientManagementView()
                    .environmentObject(appState)
            }
            .task { await loadTasks() }
            .onChange(of: appState.activeCircle?.id) { _ in
                Task { await loadTasks() }
            }
            .refreshable {
                if let circleId = appState.activeCircle?.id {
                    try? await appState.activateCircle(id: circleId)
                }
                await loadTasks()
            }
        }
        .careLoopBrandBanner()
    }

    @ViewBuilder
    private func hero(circle: CareCircle) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(circle.name)
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundStyle(Color(red: 0.10, green: 0.16, blue: 0.24))
            Text("Open the parts of this circle you want to manage: tasks, caregivers, recipients, settings, and progress.")
                .font(.system(size: 16, weight: .medium, design: .rounded))
                .foregroundStyle(Color(red: 0.43, green: 0.50, blue: 0.60))
            HStack(spacing: 10) {
                labelChip(circle.recipientDisplaySummary, tint: Color(red: 0.13, green: 0.56, blue: 0.87), fill: Color(red: 0.88, green: 0.95, blue: 1.0))
                labelChip(appState.userRole == .admin ? "Admin" : "Member", tint: appState.userRole == .admin ? Color(red: 0.12, green: 0.68, blue: 0.49) : Color(red: 0.23, green: 0.33, blue: 0.44), fill: Color.white)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private func summaryGrid(circle: CareCircle) -> some View {
        LazyVGrid(columns: columns, spacing: 14) {
            metricCard(title: "Active tasks", value: "\(tasks.filter { $0.status != .done && $0.status != .skipped }.count)", tint: Color(red: 0.13, green: 0.56, blue: 0.87))
            metricCard(title: "Completed", value: "\(tasks.filter { $0.status == .done || $0.status == .skipped }.count)", tint: Color(red: 0.12, green: 0.68, blue: 0.49))
            metricCard(title: "Members", value: "\((circle.members ?? []).count)", tint: Color(red: 0.23, green: 0.33, blue: 0.44))
            metricCard(title: "Recipients", value: "\(circle.recipientNames.count)", tint: Color(red: 0.16, green: 0.80, blue: 0.72))
        }
    }

    @ViewBuilder
    private var operationsGrid: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Circle Operations")
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(Color(red: 0.10, green: 0.16, blue: 0.24))

            LazyVGrid(columns: columns, spacing: 14) {
                operationLink(
                    title: "Task Board",
                    subtitle: "Add, edit, and complete tasks",
                    systemImage: "checklist"
                ) {
                    CirclesView()
                        .environmentObject(appState)
                }
                operationLink(
                    title: "Members",
                    subtitle: "Invite, remove, and manage access",
                    systemImage: "person.2.fill"
                ) {
                    MemberListView()
                        .environmentObject(appState)
                }

                if appState.userRole == .admin {
                    operationButton(
                        title: "Recipients",
                        subtitle: "Manage people being cared for",
                        systemImage: "heart.text.square.fill"
                    ) {
                        showRecipients = true
                    }
                    operationLink(
                        title: "Insights",
                        subtitle: "Review completion patterns",
                        systemImage: "chart.bar.xaxis"
                    ) {
                        AdminInsightsView()
                            .environmentObject(appState)
                    }
                }

                operationLink(
                    title: "Settings",
                    subtitle: "Archive rules and circle info",
                    systemImage: "gearshape.fill"
                ) {
                    SettingsView()
                        .environmentObject(appState)
                }
            }
        }
    }

    @ViewBuilder
    private var upcomingSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Next Up")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(red: 0.10, green: 0.16, blue: 0.24))
                Spacer()
                NavigationLink {
                    CirclesView()
                        .environmentObject(appState)
                } label: {
                    Text("Open task board")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(red: 0.13, green: 0.56, blue: 0.87))
                }
            }

            if loading {
                roundedPanel {
                    HStack {
                        Spacer()
                        ProgressView()
                        Spacer()
                    }
                    .padding(.vertical, 16)
                }
            } else if upcomingTasks.isEmpty {
                roundedPanel {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("No upcoming tasks yet")
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                        Text("Use the Task Board to add the first task for this circle.")
                            .font(.system(size: 14, weight: .medium, design: .rounded))
                            .foregroundStyle(.secondary)
                    }
                }
            } else {
                roundedPanel {
                    VStack(spacing: 0) {
                        ForEach(Array(upcomingTasks.enumerated()), id: \.element.id) { index, task in
                            upcomingTaskRow(task)
                            if index < upcomingTasks.count - 1 {
                                Divider()
                                    .padding(.leading, 54)
                            }
                        }
                    }
                }
            }
        }
    }

    private var upcomingTasks: [CareTask] {
        tasks
            .filter { $0.status != .done && $0.status != .skipped }
            .sorted {
                switch ($0.dueAt, $1.dueAt) {
                case let (lhs?, rhs?):
                    return lhs < rhs
                case (_?, nil):
                    return true
                case (nil, _?):
                    return false
                case (nil, nil):
                    return $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending
                }
            }
            .prefix(3)
            .map { $0 }
    }

    @ViewBuilder
    private func metricCard(title: String, value: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(Color(red: 0.43, green: 0.50, blue: 0.60))
            Text(value)
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(tint)
        }
        .frame(maxWidth: .infinity, minHeight: 112, alignment: .leading)
        .padding(18)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    @ViewBuilder
    private func operationLink<Destination: View>(
        title: String,
        subtitle: String,
        systemImage: String,
        @ViewBuilder destination: () -> Destination
    ) -> some View {
        NavigationLink(destination: destination) {
            operationCard(title: title, subtitle: subtitle, systemImage: systemImage)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func operationButton(title: String, subtitle: String, systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            operationCard(title: title, subtitle: subtitle, systemImage: systemImage)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func operationCard(title: String, subtitle: String, systemImage: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(Color(red: 0.13, green: 0.56, blue: 0.87))
                .frame(width: 42, height: 42)
                .background(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(Color(red: 0.88, green: 0.95, blue: 1.0))
                )
            Text(title)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(Color(red: 0.10, green: 0.16, blue: 0.24))
            Text(subtitle)
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundStyle(Color(red: 0.43, green: 0.50, blue: 0.60))
                .multilineTextAlignment(.leading)
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, minHeight: 158, alignment: .leading)
        .padding(18)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    @ViewBuilder
    private func upcomingTaskRow(_ task: CareTask) -> some View {
        HStack(spacing: 14) {
            Circle()
                .fill(task.isOverdue ? Color.red.opacity(0.18) : Color(red: 0.88, green: 0.95, blue: 1.0))
                .frame(width: 40, height: 40)
                .overlay(
                    Image(systemName: task.isOverdue ? "exclamationmark" : "checklist")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(task.isOverdue ? .red : Color(red: 0.13, green: 0.56, blue: 0.87))
                )

            VStack(alignment: .leading, spacing: 5) {
                Text(task.title)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(red: 0.10, green: 0.16, blue: 0.24))
                    .lineLimit(1)
                Text(taskMetaLine(task))
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            Spacer()
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 18)
    }

    @ViewBuilder
    private func roundedPanel<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    @ViewBuilder
    private func labelChip(_ title: String, tint: Color, fill: Color) -> some View {
        Text(title)
            .font(.system(size: 12, weight: .bold, design: .rounded))
            .foregroundStyle(tint)
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(
                Capsule(style: .continuous)
                    .fill(fill)
            )
    }

    private func taskMetaLine(_ task: CareTask) -> String {
        var parts: [String] = []
        if let recipient = task.recipient?.name ?? appState.activeCircle?.primaryRecipient?.name {
            parts.append(recipient)
        }
        if let dueAt = task.dueAt {
            parts.append(dueAt.formatted(date: .abbreviated, time: .shortened))
        } else {
            parts.append("No due date")
        }
        return parts.joined(separator: " • ")
    }

    private func loadTasks() async {
        guard let circleId = appState.activeCircle?.id else {
            tasks = []
            loading = false
            return
        }

        loading = true
        error = nil
        do {
            tasks = try await APIClient.shared.fetchTasks(circleId: circleId)
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}
