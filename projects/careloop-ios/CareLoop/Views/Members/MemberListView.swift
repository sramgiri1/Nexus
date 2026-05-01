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

                ForEach(members) { member in
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
                            ProgressView()
                                .scaleEffect(0.8)
                        } else {
                            HStack(spacing: 10) {
                                roleBadge(member.role)
                                if canManage(member) {
                                    Menu {
                                        if member.role == .member {
                                            Button("Make Admin") {
                                                Task { await updateRole(member, role: .admin) }
                                            }
                                        } else {
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
                }
            }
            .sheet(isPresented: $showInvite) {
                InviteMemberView { name, email, role in
                    Task { await invite(name: name, email: email, role: role) }
                }
            }
            .task {
                await loadInvitations()
            }
        }
        .careLoopBrandBanner()
    }

    private func canManage(_ member: CircleMember) -> Bool {
        guard appState.userRole == .admin,
              let currentUserId = appState.currentUser?.id
        else { return false }
        return member.userId != currentUserId
    }

    private func loadInvitations() async {
        guard appState.userRole == .admin,
              let circleId = appState.activeCircle?.id,
              let adminUserId = appState.currentUser?.id else {
            pendingInvitations = []
            return
        }

        do {
            pendingInvitations = try await APIClient.shared.fetchInvitations(circleId: circleId, adminUserId: adminUserId)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func invite(name: String, email: String, role: MemberRole) async {
        guard let circleId = appState.activeCircle?.id,
              let adminUserId = appState.currentUser?.id else { return }

        loadingMemberId = "invite"
        error = nil
        defer { loadingMemberId = nil }

        do {
            _ = try await APIClient.shared.inviteMember(
                circleId: circleId,
                adminUserId: adminUserId,
                name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                role: role
            )
            try await appState.activateCircle(id: circleId)
            await loadInvitations()
            showInvite = false
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func remove(_ member: CircleMember) async {
        guard let circleId = appState.activeCircle?.id,
              let adminUserId = appState.currentUser?.id else { return }

        loadingMemberId = member.id
        error = nil
        defer { loadingMemberId = nil }

        do {
            try await APIClient.shared.removeMember(
                circleId: circleId,
                memberId: member.id,
                adminUserId: adminUserId
            )
            try await appState.activateCircle(id: circleId)
            await loadInvitations()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func updateRole(_ member: CircleMember, role: MemberRole) async {
        guard let circleId = appState.activeCircle?.id,
              let adminUserId = appState.currentUser?.id else { return }

        loadingMemberId = member.id
        error = nil
        defer { loadingMemberId = nil }

        do {
            _ = try await APIClient.shared.updateMemberRole(
                circleId: circleId,
                memberId: member.id,
                adminUserId: adminUserId,
                role: role
            )
            try await appState.activateCircle(id: circleId)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func revoke(_ invite: GroupInvitation) async {
        guard let circleId = appState.activeCircle?.id,
              let adminUserId = appState.currentUser?.id else { return }

        loadingMemberId = invite.id
        error = nil
        defer { loadingMemberId = nil }

        do {
            try await APIClient.shared.revokeInvitation(
                circleId: circleId,
                invitationId: invite.id,
                adminUserId: adminUserId
            )
            await loadInvitations()
        } catch {
            self.error = error.localizedDescription
        }
    }

    @ViewBuilder
    private func roleBadge(_ role: MemberRole) -> some View {
        Text(role == .admin ? "Admin" : "Member")
            .font(.caption.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(role == .admin ? Color.blue.opacity(0.15) : Color.secondary.opacity(0.12))
            .foregroundColor(role == .admin ? .blue : .secondary)
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
                Text(invite.role == .admin ? "Admin access on acceptance" : "Member access on acceptance")
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
    let onInvite: (_ name: String, _ email: String, _ role: MemberRole) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var email = ""
    @State private var role: MemberRole = .member

    var body: some View {
        NavigationStack {
            Form {
                Section("Invite Person") {
                    TextField("Full name", text: $name)
                    TextField("Email address", text: $email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Picker("Access", selection: $role) {
                        Text("Member").tag(MemberRole.member)
                        Text("Admin").tag(MemberRole.admin)
                    }
                    .pickerStyle(.segmented)
                    Text("The invite stays pending until the person signs in with the same email and accepts it inside CareLoop.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
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
                        onInvite(name, email, role)
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || !isValidEmail(email))
                }
            }
        }
    }

    private func isValidEmail(_ value: String) -> Bool {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.contains("@") && trimmed.contains(".")
    }
}
