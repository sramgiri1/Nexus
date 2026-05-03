import SwiftUI

struct MemberListView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var showInvite = false
    @State private var loadingMemberId: String?
    @State private var error: String?
    @State private var pendingInvitations: [GroupInvitation] = []

    private var members: [CircleMember] {
        (appState.activeCircle?.members ?? []).sorted { lhs, rhs in
            let leftName = lhs.user?.name ?? lhs.userId
            let rightName = rhs.user?.name ?? rhs.userId
            return leftName.localizedCaseInsensitiveCompare(rightName) == .orderedAscending
        }
    }

    private var admins:     [CircleMember] { members.filter { $0.role == .admin } }
    private var caregivers: [CircleMember] { members.filter { $0.role == .member } }
    private var receivers:  [CircleMember] { members.filter { $0.role == .recipient } }

    var body: some View {
        NavigationStack {
            List {
                if appState.userRole == .admin && !pendingInvitations.isEmpty {
                    Section("Pending Invites") {
                        ForEach(pendingInvitations) { invite in
                            pendingInviteRow(invite)
                        }
                    }
                }

                if !admins.isEmpty {
                    Section("Admins") {
                        ForEach(admins) { member in memberRow(member) }
                    }
                }

                if !caregivers.isEmpty {
                    Section("Members") {
                        ForEach(caregivers) { member in memberRow(member) }
                    }
                }

                if !receivers.isEmpty {
                    Section("Care Receivers") {
                        ForEach(receivers) { member in memberRow(member) }
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
            .navigationTitle("Circle Members")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
                if appState.userRole == .admin {
                    ToolbarItem(placement: .primaryAction) {
                        Button {
                            error = nil
                            showInvite = true
                        } label: {
                            Image(systemName: "person.badge.plus")
                        }
                    }
                    if let circle = appState.activeCircle {
                        ToolbarItem(placement: .topBarTrailing) {
                            ShareLink(
                                item: "Join \(circle.name) on CareLoop!\nCircle code: \(circle.id)",
                                subject: Text("Join my CareLoop circle")
                            ) {
                                Image(systemName: "square.and.arrow.up")
                            }
                        }
                    }
                }
            }
            .sheet(isPresented: $showInvite, onDismiss: {
                Task {
                    await loadInvitations()
                    if let id = appState.activeCircle?.id {
                        try? await appState.activateCircle(id: id)
                    }
                }
            }) {
                InviteMemberView()
                    .environmentObject(appState)
            }
            .task {
                await loadInvitations()
            }
        }
        .careLoopBrandBanner()
    }

    @ViewBuilder
    private func memberRow(_ member: CircleMember) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(member.user?.name ?? "Unknown")
                    .font(.body)
                if let email = member.user?.email {
                    Text(email)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            Spacer()
            if loadingMemberId == member.id {
                ProgressView().scaleEffect(0.8)
            } else {
                HStack(spacing: 10) {
                    roleBadge(member.role)
                    if canManage(member) {
                        Menu {
                            if member.role == .member {
                                Button("Make Admin") {
                                    Task { await updateRole(member, role: .admin) }
                                }
                            } else if member.role == .admin {
                                Button("Make Member") {
                                    Task { await updateRole(member, role: .member) }
                                }
                            }
                            Button("Remove", role: .destructive) {
                                Task { await remove(member) }
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .padding(.vertical, 2)
    }

    private func canManage(_ member: CircleMember) -> Bool {
        guard appState.userRole == .admin,
              let currentUserId = appState.currentUser?.id
        else { return false }
        return member.userId != currentUserId
    }

    private func loadInvitations() async {
        guard appState.userRole == .admin,
              let circleId = appState.activeCircle?.id else {
            pendingInvitations = []
            return
        }

        do {
            pendingInvitations = try await APIClient.shared.fetchInvitations(circleId: circleId)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func remove(_ member: CircleMember) async {
        guard let circleId = appState.activeCircle?.id else { return }

        loadingMemberId = member.id
        error = nil
        defer { loadingMemberId = nil }

        do {
            try await APIClient.shared.removeMember(
                circleId: circleId,
                memberId: member.id
            )
            try await appState.activateCircle(id: circleId)
            await loadInvitations()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func updateRole(_ member: CircleMember, role: MemberRole) async {
        guard let circleId = appState.activeCircle?.id else { return }

        loadingMemberId = member.id
        error = nil
        defer { loadingMemberId = nil }

        do {
            _ = try await APIClient.shared.updateMemberRole(
                circleId: circleId,
                memberId: member.id,
                role: role
            )
            try await appState.activateCircle(id: circleId)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func revoke(_ invite: GroupInvitation) async {
        guard let circleId = appState.activeCircle?.id else { return }

        loadingMemberId = invite.id
        error = nil
        defer { loadingMemberId = nil }

        do {
            try await APIClient.shared.revokeInvitation(
                circleId: circleId,
                invitationId: invite.id
            )
            await loadInvitations()
        } catch {
            self.error = error.localizedDescription
        }
    }

    @ViewBuilder
    private func roleBadge(_ role: MemberRole) -> some View {
        let (label, fg, bg): (String, Color, Color) = {
            switch role {
            case .admin:
                return ("Admin", .blue, Color.blue.opacity(0.15))
            case .member:
                return ("Member", .secondary, Color.secondary.opacity(0.12))
            case .recipient:
                return ("Receiver", Color(red: 0.85, green: 0.30, blue: 0.50), Color(red: 0.85, green: 0.30, blue: 0.50).opacity(0.12))
            }
        }()
        Text(label)
            .font(.caption.bold())
            .padding(.horizontal, 8).padding(.vertical, 3)
            .background(bg)
            .foregroundColor(fg)
            .cornerRadius(4)
    }

    @ViewBuilder
    private func pendingInviteRow(_ invite: GroupInvitation) -> some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(invite.name)
                    .font(.body)
                Text(invite.email)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text({
                        switch invite.role {
                        case .admin:     return "Admin access on acceptance"
                        case .member:    return "Member access on acceptance"
                        case .recipient: return "Care Receiver access on acceptance"
                        }
                    }())
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            if loadingMemberId == invite.id {
                ProgressView()
                    .scaleEffect(0.8)
            } else {
                Button("Revoke", role: .destructive) {
                    Task { await revoke(invite) }
                }
                .font(.caption.bold())
            }
        }
        .padding(.vertical, 2)
    }
}

private struct InviteMemberView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var name:           String      = ""
    @State private var email:          String      = ""
    @State private var role:           MemberRole  = .member
    @State private var confirmedAdult: Bool        = false
    @State private var loading:        Bool        = false
    @State private var error:          String?

    private var canInvite: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        isValidEmail(email) &&
        confirmedAdult &&
        !loading
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Invite Person") {
                    TextField("Full name", text: $name)
                    TextField("Email address", text: $email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Picker("Role", selection: $role) {
                        Text("Member").tag(MemberRole.member)
                        Text("Admin").tag(MemberRole.admin)
                        Text("Receiver").tag(MemberRole.recipient)
                    }
                    .pickerStyle(.segmented)
                    Text(roleInviteDescription)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section {
                    Toggle(isOn: $confirmedAdult) {
                        Text("I confirm this person is 18 years or older")
                            .font(.system(size: 14, weight: .medium, design: .rounded))
                    }
                } footer: {
                    Text("CareLoop is for adults only. Invite flows for minors will be supported in a future update.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                if let error {
                    Section {
                        Text(error).foregroundStyle(.red).font(.caption)
                    }
                }
            }
            .navigationTitle("Invite Member")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Invite") {
                        Task { await sendInvite() }
                    }
                    .disabled(!canInvite)
                }
            }
        }
    }

    private func sendInvite() async {
        guard let circleId = appState.activeCircle?.id else { return }
        loading = true
        error = nil
        do {
            _ = try await APIClient.shared.inviteMember(
                circleId: circleId,
                name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                role: role
            )
            dismiss()
        } catch {
            self.error = error.localizedDescription
            loading = false
        }
    }

    private var roleInviteDescription: String {
        switch role {
        case .admin:
            return "Admin: can manage tasks, members, and all circle settings."
        case .member:
            return "Member: can create, assign, and complete tasks for the circle."
        case .recipient:
            return "Care Receiver: sees all care activity, gets personal reminders for their tasks, and can mark their own tasks done. They need to install CareLoop and accept this invite."
        }
    }

    private func isValidEmail(_ value: String) -> Bool {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.contains("@") && trimmed.contains(".")
    }
}
