import SwiftUI

struct CircleListView: View {
    @EnvironmentObject private var appState: AppState

    @State private var loadingCircleId: String?
    @State private var loadingInviteId: String?
    @State private var error: String?
    @State private var showJoinCreate = false

    private var memberships: [CircleMembership] {
        appState.circleMemberships
    }

    private var pendingInvites: [GroupInvitation] {
        appState.currentUser?.pendingInvites ?? []
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 10) {
                        CareLoopBrandView(style: .wordmark, surface: .light, wordmarkHeight: 34)
                            .frame(maxWidth: .infinity, alignment: .center)
                        Text("Your CareLoops")
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundStyle(Color(red: 0.10, green: 0.16, blue: 0.24))
                        Text("Choose a group to manage its tasks, members, recipients, settings, and progress.")
                            .font(.system(size: 16, weight: .medium, design: .rounded))
                            .foregroundStyle(Color(red: 0.43, green: 0.50, blue: 0.60))
                    }
                    .padding(.vertical, 8)
                }
                .listRowBackground(Color.clear)

                if memberships.isEmpty && pendingInvites.isEmpty {
                    Section {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("No circles yet")
                                .font(.system(size: 20, weight: .bold, design: .rounded))
                            Text("Join an existing circle with an invite or ID, or create a new one for your family.")
                                .font(.system(size: 15, weight: .medium, design: .rounded))
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 8)
                    }
                }

                if !memberships.isEmpty {
                    Section("Your Circles") {
                        ForEach(memberships) { membership in
                            let circle = membership.circle ?? CareCircle(
                                id: membership.circleId,
                                name: "CareLoop Group",
                                recipientName: "Family"
                            )
                            Button {
                                Task { await openCircle(circle.id) }
                            } label: {
                                circleRow(circle: circle, role: membership.role)
                            }
                            .buttonStyle(.plain)
                            .disabled(loadingCircleId != nil || loadingInviteId != nil)
                        }
                    }
                }

                if !pendingInvites.isEmpty {
                    Section("Pending Invites") {
                        ForEach(pendingInvites) { invite in
                            pendingInviteRow(invite)
                        }
                    }
                }

                Section {
                    Button {
                        error = nil
                        showJoinCreate = true
                    } label: {
                        Label("Join or Create a Circle", systemImage: "plus.circle.fill")
                    }
                }

                Section("Account") {
                    if let user = appState.currentUser {
                        LabeledContent("Name", value: user.name)
                        LabeledContent("Email", value: user.email)
                    }

                    Button("Sign Out", role: .destructive) {
                        appState.signOut()
                    }
                }

                if let error {
                    Section {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("Circles")
            .navigationBarTitleDisplayMode(.inline)
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(Color(red: 0.95, green: 0.96, blue: 0.99).ignoresSafeArea())
            .refreshable {
                try? await appState.refreshMemberships()
            }
            .sheet(isPresented: $showJoinCreate) {
                JoinCircleView(dismissOnSuccess: true)
                    .environmentObject(appState)
            }
        }
    }

    @ViewBuilder
    private func circleRow(circle: CareCircle, role: MemberRole) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [Color(red: 0.16, green: 0.80, blue: 0.72), Color(red: 0.13, green: 0.56, blue: 0.87)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                Image("CareLoopIcon")
                    .resizable()
                    .scaledToFit()
                    .padding(12)
            }
            .frame(width: 52, height: 52)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text(circle.name)
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(red: 0.10, green: 0.16, blue: 0.24))
                    if circle.id == appState.rememberedCircleId {
                        Text("Last opened")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundStyle(Color(red: 0.13, green: 0.56, blue: 0.87))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                Capsule()
                                    .fill(Color(red: 0.88, green: 0.95, blue: 1.0))
                            )
                    }
                }
                Text(recipientSubtitle(for: circle))
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
                Text("Open this circle")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(Color(red: 0.13, green: 0.56, blue: 0.87))
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 6) {
                Text(role == .admin ? "Admin" : "Member")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(role == .admin ? Color(red: 0.13, green: 0.56, blue: 0.87) : Color(red: 0.23, green: 0.33, blue: 0.44))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 999, style: .continuous)
                            .fill(role == .admin ? Color(red: 0.88, green: 0.95, blue: 1.0) : Color(red: 0.93, green: 0.95, blue: 0.98))
                    )

                if loadingCircleId == circle.id {
                    ProgressView()
                        .scaleEffect(0.8)
                } else {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .padding(.vertical, 6)
    }

    private func recipientSubtitle(for circle: CareCircle) -> String {
        let names = circle.recipientNames
        switch names.count {
        case 0:
            return "Care group"
        case 1:
            return "Caring for \(names[0])"
        case 2:
            return "Caring for \(names[0]) and \(names[1])"
        default:
            return "Caring for \(names[0]) + \(names.count - 1) more"
        }
    }

    @ViewBuilder
    private func pendingInviteRow(_ invite: GroupInvitation) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(invite.circle.name)
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                    Text(invite.circle.recipientDisplaySummary)
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                    if let invitedBy = invite.invitedBy {
                        Text("Invited by \(invitedBy.name)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
                roleBadge(invite.role)
            }

            HStack(spacing: 10) {
                Button {
                    Task { await accept(invite) }
                } label: {
                    if loadingInviteId == invite.id {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Accept")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(Color(red: 0.13, green: 0.56, blue: 0.87))
                .disabled(loadingInviteId != nil || loadingCircleId != nil)

                Button("Decline") {
                    Task { await decline(invite) }
                }
                .buttonStyle(.bordered)
                .disabled(loadingInviteId != nil || loadingCircleId != nil)
            }
        }
        .padding(.vertical, 4)
    }

    @ViewBuilder
    private func roleBadge(_ role: MemberRole) -> some View {
        Text(role == .admin ? "Admin access" : "Member access")
            .font(.system(size: 12, weight: .bold, design: .rounded))
            .foregroundStyle(role == .admin ? Color(red: 0.13, green: 0.56, blue: 0.87) : Color(red: 0.23, green: 0.33, blue: 0.44))
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                Capsule(style: .continuous)
                    .fill(role == .admin ? Color(red: 0.88, green: 0.95, blue: 1.0) : Color(red: 0.93, green: 0.95, blue: 0.98))
            )
    }

    private func openCircle(_ circleId: String) async {
        loadingCircleId = circleId
        error = nil
        defer { loadingCircleId = nil }

        do {
            try await appState.activateCircle(id: circleId)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func accept(_ invite: GroupInvitation) async {
        guard let userId = appState.currentUser?.id else { return }
        loadingInviteId = invite.id
        error = nil
        defer { loadingInviteId = nil }

        do {
            _ = try await APIClient.shared.acceptInvitation(invitationId: invite.id, userId: userId)
            try await appState.refreshMemberships()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func decline(_ invite: GroupInvitation) async {
        guard let userId = appState.currentUser?.id else { return }
        loadingInviteId = invite.id
        error = nil
        defer { loadingInviteId = nil }

        do {
            try await APIClient.shared.declineInvitation(invitationId: invite.id, userId: userId)
            try await appState.refreshMemberships()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
