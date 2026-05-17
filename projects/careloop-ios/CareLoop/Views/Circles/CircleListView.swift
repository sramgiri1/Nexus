import SwiftUI

// MARK: — Circle list

struct CircleListView: View {
    @EnvironmentObject private var appState: AppState
    @ObservedObject private var subscriptions = SubscriptionManager.shared

    @State private var loadingCircleId: String?
    @State private var loadingInviteId: String?
    @State private var error: String?
    @State private var circleSheetMode: CircleSheetMode? = nil
    @State private var showAccount = false
    @State private var showPaywall = false

    private var memberships: [CircleMembership] { appState.circleMemberships }
    private var pendingInvites: [GroupInvitation] { appState.currentUser?.pendingInvites ?? [] }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.95, green: 0.97, blue: 1.00).ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 0) {
                        header.padding(.horizontal, 22).padding(.top, 14)

                        titleBlock.padding(.horizontal, 22).padding(.top, 30)

                        if memberships.isEmpty && pendingInvites.isEmpty {
                            WelcomeCardsView(
                                onCreateCircle: { error = nil; circleSheetMode = .create },
                                onJoinCircle:   { error = nil; circleSheetMode = .join }
                            )
                            .padding(.horizontal, 22)
                            .padding(.top, 16)
                        }

                        if !memberships.isEmpty {
                            circlesSection.padding(.top, 26)
                        }

                        if !pendingInvites.isEmpty {
                            invitesSection.padding(.top, 22)
                        }

                        if !memberships.isEmpty {
                            if !subscriptions.isPremium {
                                upgradePrompt.padding(.horizontal, 22).padding(.top, 18)
                            }
                            addCircleRow.padding(.horizontal, 22).padding(.top, 14).padding(.bottom, 44)
                        } else {
                            Spacer(minLength: 40)
                        }

                        if let error {
                            Text(error)
                                .font(.footnote).foregroundStyle(.red)
                                .padding(.horizontal, 22).padding(.bottom, 16)
                        }
                    }
                }
                .refreshable {
                    do { try await appState.refreshMemberships() }
                    catch let loadError { error = loadError.localizedDescription }
                }
            }
            .navigationBarHidden(true)
            .sheet(item: $circleSheetMode) { mode in
                JoinCircleView(dismissOnSuccess: true, startInCreateMode: mode.startInCreateMode)
                    .environmentObject(appState)
            }
            .sheet(isPresented: $showAccount) {
                AccountSheet(onUpgrade: { showPaywall = true }).environmentObject(appState)
            }
            .sheet(isPresented: $showPaywall) {
                PaywallView()
            }
        }
    }

    // MARK: — Header

    private var header: some View {
        HStack(alignment: .center) {
            CareLoopBrandView(style: .wordmark, surface: .light, wordmarkHeight: 17)
            Spacer()
            HStack(spacing: 10) {
                if subscriptions.isPremium {
                    premiumBadge
                }
                Button { showAccount = true } label: { avatarView }
                    .accessibilityLabel("Account")
            }
        }
    }

    private var premiumBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "crown.fill")
                .font(.system(size: 9, weight: .bold))
            Text("Premium")
                .font(.system(size: 10, weight: .bold, design: .rounded))
        }
        .foregroundStyle(Color(red: 0.55, green: 0.22, blue: 0.97))
        .padding(.horizontal, 9).padding(.vertical, 5)
        .background(Capsule().fill(Color(red: 0.55, green: 0.22, blue: 0.97).opacity(0.10)))
        .overlay(Capsule().strokeBorder(Color(red: 0.55, green: 0.22, blue: 0.97).opacity(0.22), lineWidth: 1))
    }

    private var avatarView: some View {
        ZStack {
            Circle()
                .fill(LinearGradient(
                    colors: [Color(red: 0.16, green: 0.80, blue: 0.72), Color(red: 0.13, green: 0.56, blue: 0.87)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                ))
            Text(userInitials)
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
        }
        .frame(width: 38, height: 38)
    }

    private var userInitials: String {
        let raw = (appState.currentUser?.name ?? "")
            .split(separator: " ").prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined().uppercased()
        return raw.isEmpty ? "?" : raw
    }

    // MARK: — Title block

    private var titleBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            if let firstName = appState.currentUser?.name
                .split(separator: " ").first.map(String.init) {
                Text("Hi, \(firstName)")
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .foregroundStyle(Color(red: 0.13, green: 0.56, blue: 0.87))
            }
            Text("Your Care Circles")
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(Color(red: 0.09, green: 0.13, blue: 0.22))
            Text("Choose a care circle to continue.")
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(Color(red: 0.44, green: 0.52, blue: 0.64))

            if !memberships.isEmpty {
                HStack(spacing: 8) {
                    statPill("\(memberships.count)", label: memberships.count == 1 ? "care circle" : "care circles", icon: "circle.grid.2x2.fill")
                    if !pendingInvites.isEmpty {
                        statPill("\(pendingInvites.count)", label: pendingInvites.count == 1 ? "invite" : "invites", icon: "envelope.fill")
                    }
                }
                .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private func statPill(_ count: String, label: String, icon: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 10, weight: .semibold))
            Text("\(count) \(label)")
                .font(.system(size: 12, weight: .semibold, design: .rounded))
        }
        .foregroundStyle(Color(red: 0.35, green: 0.43, blue: 0.56))
        .padding(.horizontal, 10).padding(.vertical, 5)
        .background(Capsule().fill(Color(red: 0.88, green: 0.93, blue: 0.99)))
    }

    // MARK: — Circles

    private var circlesSection: some View {
        VStack(spacing: 10) {
            ForEach(memberships) { membership in
                let circle = membership.circle ?? CareCircle(
                    id: membership.circleId, name: "Care Circle", recipientName: "Family"
                )
                Button { Task { await openCircle(circle.id) } } label: {
                    circleCard(circle: circle, role: membership.role)
                }
                .buttonStyle(.plain)
                .disabled(loadingCircleId != nil || loadingInviteId != nil)
            }
        }
        .padding(.horizontal, 22)
    }

    @ViewBuilder
    private func circleCard(circle: CareCircle, role: MemberRole) -> some View {
        let isActive  = circle.id == appState.rememberedCircleId
        let isLoading = loadingCircleId == circle.id

        HStack(spacing: 14) {
            // Gradient icon
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(LinearGradient(
                        colors: [Color(red: 0.16, green: 0.80, blue: 0.72), Color(red: 0.13, green: 0.56, blue: 0.87)],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    ))
                Image("CareLoopIcon")
                    .resizable().scaledToFit().padding(10)
            }
            .frame(width: 52, height: 52)

            // Text
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 7) {
                    Text(circle.name)
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(red: 0.09, green: 0.13, blue: 0.22))
                        .lineLimit(1)
                    if isActive {
                        Text("Active")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(Color(red: 0.07, green: 0.68, blue: 0.48))
                            .padding(.horizontal, 7).padding(.vertical, 3)
                            .background(Capsule().fill(Color(red: 0.87, green: 0.97, blue: 0.93)))
                    }
                }
                Text(recipientSubtitle(for: circle, role: role))
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(Color(red: 0.44, green: 0.52, blue: 0.64))
                    .lineLimit(1)
            }

            Spacer(minLength: 8)

            // Right side
            VStack(alignment: .trailing, spacing: 7) {
                rolePill(role)
                if isLoading {
                    ProgressView().scaleEffect(0.75)
                } else {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Color(red: 0.65, green: 0.74, blue: 0.88))
                }
            }
        }
        .padding(15)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(.white)
                .shadow(
                    color: Color(red: 0.13, green: 0.22, blue: 0.45)
                        .opacity(isActive ? 0.11 : 0.06),
                    radius: isActive ? 14 : 8, x: 0, y: 3
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .strokeBorder(
                    isActive ? Color(red: 0.13, green: 0.56, blue: 0.87).opacity(0.18) : Color.clear,
                    lineWidth: 1.5
                )
        )
    }

    // MARK: — Pending invites

    private var invitesSection: some View {
        VStack(spacing: 10) {
            HStack(spacing: 8) {
                Text("Pending Invites")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(red: 0.44, green: 0.52, blue: 0.64))
                    .textCase(.uppercase).tracking(0.4)
                ZStack {
                    Circle().fill(Color(red: 0.98, green: 0.42, blue: 0.32))
                    Text("\(pendingInvites.count)")
                        .font(.system(size: 10, weight: .bold)).foregroundStyle(.white)
                }
                .frame(width: 18, height: 18)
                Spacer()
            }
            .padding(.horizontal, 22)

            ForEach(pendingInvites) { invite in
                inviteCard(invite).padding(.horizontal, 22)
            }
        }
    }

    @ViewBuilder
    private func inviteCard(_ invite: GroupInvitation) -> some View {
        let isRecipientInvite = invite.role == .recipient
        let rose = Color(red: 0.85, green: 0.30, blue: 0.50)
        let amber = Color(red: 0.96, green: 0.63, blue: 0.28)
        let accentColor = isRecipientInvite ? rose : amber

        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(isRecipientInvite
                              ? Color(red: 0.99, green: 0.91, blue: 0.94)
                              : Color(red: 0.99, green: 0.96, blue: 0.91))
                    Image(systemName: isRecipientInvite ? "heart.circle.fill" : "envelope.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(accentColor)
                }
                .frame(width: 46, height: 46)

                VStack(alignment: .leading, spacing: 3) {
                    Text(invite.circle.name)
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(red: 0.09, green: 0.13, blue: 0.22))
                    let inviteSubtitle: String = {
                        if isRecipientInvite { return "Your care is organized in this circle" }
                        let s = invite.circle.recipientDisplaySummary
                        return s.isEmpty ? "Care circle" : s
                    }()
                    Text(inviteSubtitle)
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary).lineLimit(1)
                    if let by = invite.invitedBy {
                        Text("From \(by.name)")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
                rolePill(invite.role)
            }

            HStack(spacing: 10) {
                Button { Task { await accept(invite) } } label: {
                    Group {
                        if loadingInviteId == invite.id {
                            ProgressView().tint(.white)
                        } else {
                            Text("Accept")
                                .font(.system(size: 14, weight: .bold, design: .rounded))
                        }
                    }
                    .frame(maxWidth: .infinity).frame(height: 40)
                    .background(RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(Color(red: 0.13, green: 0.56, blue: 0.87)))
                    .foregroundStyle(.white)
                }
                .disabled(loadingInviteId != nil || loadingCircleId != nil)

                Button { Task { await decline(invite) } } label: {
                    Text("Decline")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .frame(maxWidth: .infinity).frame(height: 40)
                        .background(RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(Color(red: 0.92, green: 0.95, blue: 0.99)))
                        .foregroundStyle(Color(red: 0.35, green: 0.43, blue: 0.56))
                }
                .disabled(loadingInviteId != nil || loadingCircleId != nil)
            }
        }
        .padding(15)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(.white)
                .shadow(color: Color(red: 0.13, green: 0.22, blue: 0.45).opacity(0.06), radius: 8, x: 0, y: 3)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .strokeBorder(accentColor.opacity(0.22), lineWidth: 1.5)
        )
    }

    // MARK: — Upgrade prompt

    private var upgradePrompt: some View {
        Button { showPaywall = true } label: {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(LinearGradient(
                            colors: [Color(red: 0.55, green: 0.22, blue: 0.97), Color(red: 0.24, green: 0.40, blue: 0.97)],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ))
                    Image(systemName: "crown.fill")
                        .font(.system(size: 17))
                        .foregroundStyle(.white)
                }
                .frame(width: 44, height: 44)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Unlock CareLoop Premium")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(red: 0.09, green: 0.13, blue: 0.22))
                    Text("Unlimited circles · Insights · Smart reminders")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(Color(red: 0.44, green: 0.52, blue: 0.64))
                        .lineLimit(1)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Color(red: 0.55, green: 0.22, blue: 0.97).opacity(0.6))
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(.white)
                    .shadow(color: Color(red: 0.55, green: 0.22, blue: 0.97).opacity(0.10), radius: 10, x: 0, y: 3)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(
                        LinearGradient(
                            colors: [Color(red: 0.55, green: 0.22, blue: 0.97).opacity(0.22), Color(red: 0.24, green: 0.40, blue: 0.97).opacity(0.22)],
                            startPoint: .leading, endPoint: .trailing
                        ),
                        lineWidth: 1.5
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: — Add circle

    private var addCircleRow: some View {
        Button { error = nil; circleSheetMode = .picker } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle().fill(Color(red: 0.88, green: 0.95, blue: 1.0)).frame(width: 34, height: 34)
                    Image(systemName: "plus")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Color(red: 0.13, green: 0.56, blue: 0.87))
                }
                Text("Join or Create a Care Circle")
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundStyle(Color(red: 0.13, green: 0.56, blue: 0.87))
                Spacer()
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(.white)
                    .shadow(color: Color(red: 0.13, green: 0.22, blue: 0.45).opacity(0.05), radius: 6, x: 0, y: 2)
            )
        }
    }

    // MARK: — Shared

    @ViewBuilder
    private func rolePill(_ role: MemberRole) -> some View {
        let (label, fg, bg): (String, Color, Color) = {
            switch role {
            case .admin:
                return ("Care Organizer", Color(red: 0.13, green: 0.56, blue: 0.87), Color(red: 0.88, green: 0.95, blue: 1.0))
            case .member:
                return ("Caregiver", Color(red: 0.35, green: 0.43, blue: 0.56), Color(red: 0.92, green: 0.95, blue: 0.99))
            case .recipient:
                return ("Care Receiver", Color(red: 0.85, green: 0.30, blue: 0.50), Color(red: 0.99, green: 0.91, blue: 0.94))
            }
        }()
        Text(label)
            .font(.system(size: 10, weight: .bold, design: .rounded))
            .foregroundStyle(fg)
            .padding(.horizontal, 9).padding(.vertical, 4)
            .background(Capsule().fill(bg))
    }

    private func recipientSubtitle(for circle: CareCircle, role: MemberRole) -> String {
        if role == .recipient { return "This care circle is organized for your care" }
        let names = circle.recipientNames
        switch names.count {
        case 0:  return "Invite care receivers to get started"
        case 1:  return "Caring for \(names[0])"
        case 2:  return "Caring for \(names[0]) and \(names[1])"
        default: return "Caring for \(names[0]) + \(names.count - 1) more"
        }
    }

    // MARK: — Actions

    private func openCircle(_ circleId: String) async {
        guard loadingCircleId == nil else { return }
        loadingCircleId = circleId; error = nil
        defer { loadingCircleId = nil }
        do { try await appState.activateCircle(id: circleId) }
        catch { self.error = error.localizedDescription }
    }

    private func accept(_ invite: GroupInvitation) async {
        guard appState.currentUser != nil, loadingInviteId == nil else { return }
        loadingInviteId = invite.id; error = nil
        defer { loadingInviteId = nil }
        do {
            _ = try await APIClient.shared.acceptInvitation(invitationId: invite.id)
            try await appState.refreshMemberships()
        } catch { self.error = error.localizedDescription }
    }

    private func decline(_ invite: GroupInvitation) async {
        guard appState.currentUser != nil, loadingInviteId == nil else { return }
        loadingInviteId = invite.id; error = nil
        defer { loadingInviteId = nil }
        do {
            try await APIClient.shared.declineInvitation(invitationId: invite.id)
            try await appState.refreshMemberships()
        } catch { self.error = error.localizedDescription }
    }
}

// MARK: — Sheet mode

private enum CircleSheetMode: Identifiable {
    case create, join, picker
    var id: Self { self }
    var startInCreateMode: Bool? {
        switch self {
        case .create: return true
        case .join:   return false
        case .picker: return nil
        }
    }
}

// MARK: — Account sheet

struct AccountSheet: View {
    @EnvironmentObject private var appState: AppState
    @ObservedObject private var subscriptions = SubscriptionManager.shared
    @Environment(\.dismiss) private var dismiss
    var onUpgrade: (() -> Void)? = nil

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(LinearGradient(
                                    colors: [Color(red: 0.16, green: 0.80, blue: 0.72), Color(red: 0.13, green: 0.56, blue: 0.87)],
                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                ))
                            Text(initials)
                                .font(.system(size: 20, weight: .bold, design: .rounded))
                                .foregroundStyle(.white)
                        }
                        .frame(width: 52, height: 52)

                        if let user = appState.currentUser {
                            VStack(alignment: .leading, spacing: 3) {
                                HStack(spacing: 8) {
                                    Text(user.name)
                                        .font(.system(size: 17, weight: .bold, design: .rounded))
                                    if subscriptions.isPremium {
                                        HStack(spacing: 3) {
                                            Image(systemName: "crown.fill")
                                                .font(.system(size: 9, weight: .bold))
                                            Text("Premium")
                                                .font(.system(size: 10, weight: .bold, design: .rounded))
                                        }
                                        .foregroundStyle(Color(red: 0.55, green: 0.22, blue: 0.97))
                                        .padding(.horizontal, 8).padding(.vertical, 3)
                                        .background(Capsule().fill(Color(red: 0.55, green: 0.22, blue: 0.97).opacity(0.10)))
                                    }
                                }
                                Text(user.email)
                                    .font(.system(size: 14, weight: .medium, design: .rounded))
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 6)
                }

                if let user = appState.currentUser {
                    Section("Profile") {
                        LabeledContent("Name",  value: user.name)
                        LabeledContent("Email", value: user.email)
                    }
                }

                Section("Subscription") {
                    if subscriptions.isPremium {
                        HStack {
                            Label("CareLoop Premium", systemImage: "crown.fill")
                                .foregroundStyle(Color(red: 0.55, green: 0.22, blue: 0.97))
                            Spacer()
                            Text("Active")
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                                .foregroundStyle(Color(red: 0.07, green: 0.68, blue: 0.48))
                        }
                        if let renewal = subscriptions.renewalDate {
                            LabeledContent("Renews", value: renewal, format: .dateTime.month().day().year())
                        }
                        Button("Manage Subscription") {
                            subscriptions.openSubscriptionManagement()
                        }
                        .foregroundStyle(Color(red: 0.13, green: 0.56, blue: 0.87))
                    } else {
                        Button {
                            dismiss()
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                                onUpgrade?()
                            }
                        } label: {
                            Label("Upgrade to Premium", systemImage: "crown.fill")
                                .foregroundStyle(Color(red: 0.55, green: 0.22, blue: 0.97))
                        }
                    }
                }

                Section {
                    Button("Sign Out", role: .destructive) {
                        dismiss()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            appState.signOut()
                        }
                    }
                }
            }
            .navigationTitle("Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }.fontWeight(.semibold)
                }
            }
        }
    }

    private var initials: String {
        let raw = (appState.currentUser?.name ?? "")
            .split(separator: " ").prefix(2)
            .compactMap { $0.first.map(String.init) }
            .joined().uppercased()
        return raw.isEmpty ? "?" : raw
    }
}
