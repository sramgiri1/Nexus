import SwiftUI

struct RecipientManagementView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var showInvite        = false
    @State private var loadingMemberId:  String?
    @State private var loadingInviteId:  String?
    @State private var error:            String?
    @State private var pendingInvites:   [GroupInvitation] = []

    // MARK: – Design tokens
    private let rose  = Color(red: 0.85, green: 0.30, blue: 0.50)
    private let blue  = Color(red: 0.13, green: 0.56, blue: 0.87)
    private let teal  = Color(red: 0.16, green: 0.80, blue: 0.72)
    private let dark  = Color(red: 0.10, green: 0.16, blue: 0.24)
    private let mid   = Color(red: 0.43, green: 0.50, blue: 0.60)
    private let bg    = Color(red: 0.95, green: 0.96, blue: 0.99)

    private var activeRecipients: [CircleMember] {
        (appState.activeCircle?.members ?? [])
            .filter { $0.role == .recipient }
            .sorted {
                ($0.user?.name ?? $0.userId)
                    .localizedCaseInsensitiveCompare($1.user?.name ?? $1.userId) == .orderedAscending
            }
    }

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    infoBanner
                        .padding(.horizontal, 20)

                    if let err = error {
                        Text(err)
                            .font(.footnote).foregroundStyle(.red)
                            .padding(.horizontal, 20)
                    }

                    if !pendingInvites.isEmpty {
                        pendingSection
                            .padding(.horizontal, 20)
                    }

                    if !activeRecipients.isEmpty {
                        activeSection
                            .padding(.horizontal, 20)
                    }

                    if activeRecipients.isEmpty && pendingInvites.isEmpty {
                        emptyState
                            .padding(.horizontal, 20)
                    }

                    Spacer(minLength: 40)
                }
                .padding(.top, 20)
            }
            .background(bg.ignoresSafeArea())
            .navigationTitle("Care Receivers")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        error = nil
                        showInvite = true
                    } label: {
                        Image(systemName: "person.badge.plus")
                    }
                }
            }
            .sheet(isPresented: $showInvite, onDismiss: { Task { await loadPendingInvites() } }) {
                InviteRecipientSheet()
                    .environmentObject(appState)
            }
            .task { await loadPendingInvites() }
            .refreshable {
                if let id = appState.activeCircle?.id {
                    try? await appState.activateCircle(id: id)
                }
                await loadPendingInvites()
            }
        }
    }

    // MARK: – Info banner

    private var infoBanner: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(rose.opacity(0.10))
                Image(systemName: "heart.circle.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(rose)
            }
            .frame(width: 44, height: 44)

            VStack(alignment: .leading, spacing: 3) {
                Text("Invite care receivers")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(dark)
                Text("They'll install CareLoop, see all care activity, and get personal reminders for tasks assigned to them.")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(mid)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(16)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }

    // MARK: – Pending invites section

    private var pendingSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionLabel("Pending Invites", icon: "envelope.fill", color: Color(red: 0.96, green: 0.63, blue: 0.28))

            VStack(spacing: 0) {
                ForEach(Array(pendingInvites.enumerated()), id: \.element.id) { idx, invite in
                    pendingRow(invite)
                    if idx < pendingInvites.count - 1 {
                        Divider().padding(.leading, 56)
                    }
                }
            }
            .background(Color.white, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
        }
    }

    private func pendingRow(_ invite: GroupInvitation) -> some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(Color(red: 0.96, green: 0.63, blue: 0.28).opacity(0.12))
                Image(systemName: "clock.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(Color(red: 0.96, green: 0.63, blue: 0.28))
            }
            .frame(width: 36, height: 36)

            VStack(alignment: .leading, spacing: 2) {
                Text(invite.name)
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundStyle(dark)
                Text(invite.email)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(mid)
            }

            Spacer()

            if loadingInviteId == invite.id {
                ProgressView().scaleEffect(0.8)
            } else {
                Button(role: .destructive) {
                    Task { await revokeInvite(invite) }
                } label: {
                    Text("Revoke")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(.red)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    // MARK: – Active recipients section

    private var activeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionLabel("Active", icon: "heart.fill", color: rose)

            VStack(spacing: 0) {
                ForEach(Array(activeRecipients.enumerated()), id: \.element.id) { idx, member in
                    activeRow(member)
                    if idx < activeRecipients.count - 1 {
                        Divider().padding(.leading, 56)
                    }
                }
            }
            .background(Color.white, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
        }
    }

    private func activeRow(_ member: CircleMember) -> some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(LinearGradient(
                        colors: [rose.opacity(0.25), Color(red: 0.95, green: 0.55, blue: 0.30).opacity(0.20)],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    ))
                Text(initials(for: member.user?.name ?? "?"))
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(rose)
            }
            .frame(width: 36, height: 36)

            VStack(alignment: .leading, spacing: 2) {
                Text(member.user?.name ?? "Care Receiver")
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundStyle(dark)
                if let email = member.user?.email {
                    Text(email)
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(mid)
                }
            }

            Spacer()

            HStack(spacing: 10) {
                Text("Active")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(red: 0.07, green: 0.68, blue: 0.48))
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(Capsule().fill(Color(red: 0.87, green: 0.97, blue: 0.93)))

                if loadingMemberId == member.id {
                    ProgressView().scaleEffect(0.8)
                } else {
                    Menu {
                        Button("Remove", role: .destructive) {
                            Task { await removeMember(member) }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    // MARK: – Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(rose.opacity(0.10))
                    .frame(width: 72, height: 72)
                Image(systemName: "heart.circle")
                    .font(.system(size: 32, weight: .semibold))
                    .foregroundStyle(rose)
            }
            VStack(spacing: 6) {
                Text("No care receivers yet")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(dark)
                Text("Invite them to see all care activity and receive personal reminders for tasks assigned to them.")
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(mid)
                    .multilineTextAlignment(.center)
            }
            Button {
                error = nil
                showInvite = true
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "person.badge.plus")
                    Text("Send Invite")
                }
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .padding(.horizontal, 28).padding(.vertical, 14)
                .background(
                    LinearGradient(colors: [rose, Color(red: 0.95, green: 0.55, blue: 0.30)],
                                   startPoint: .leading, endPoint: .trailing),
                    in: Capsule()
                )
            }
            .buttonStyle(.plain)
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 40)
    }

    // MARK: – Helpers

    private func sectionLabel(_ title: String, icon: String, color: Color) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 11, weight: .semibold))
            Text(title.uppercased())
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .tracking(0.7)
        }
        .foregroundStyle(color)
    }

    private func initials(for name: String) -> String {
        let parts = name.split(separator: " ")
        let raw = parts.prefix(2).compactMap { $0.first.map(String.init) }.joined().uppercased()
        return raw.isEmpty ? "?" : raw
    }

    // MARK: – Actions

    private func loadPendingInvites() async {
        guard let circleId = appState.activeCircle?.id else { return }
        do {
            let all = try await APIClient.shared.fetchInvitations(circleId: circleId)
            pendingInvites = all.filter { $0.role == .recipient }
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func revokeInvite(_ invite: GroupInvitation) async {
        guard let circleId = appState.activeCircle?.id else { return }
        loadingInviteId = invite.id
        error = nil
        defer { loadingInviteId = nil }
        do {
            try await APIClient.shared.revokeInvitation(circleId: circleId, invitationId: invite.id)
            await loadPendingInvites()
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func removeMember(_ member: CircleMember) async {
        guard let circleId = appState.activeCircle?.id else { return }
        loadingMemberId = member.id
        error = nil
        defer { loadingMemberId = nil }
        do {
            try await APIClient.shared.removeMember(circleId: circleId, memberId: member.id)
            try await appState.activateCircle(id: circleId)
        } catch {
            self.error = error.localizedDescription
        }
    }
}

// MARK: – Invite sheet

private struct InviteRecipientSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var name           = ""
    @State private var email          = ""
    @State private var confirmedAdult = false
    @State private var loading        = false
    @State private var error:         String?

    private let rose = Color(red: 0.85, green: 0.30, blue: 0.50)
    private let dark = Color(red: 0.10, green: 0.16, blue: 0.24)
    private let mid  = Color(red: 0.43, green: 0.50, blue: 0.60)
    private let bg   = Color(red: 0.95, green: 0.96, blue: 0.99)

    private var isValid: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        email.contains("@") && email.contains(".") &&
        confirmedAdult && !loading
    }

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 28) {

                    // Header
                    VStack(alignment: .leading, spacing: 10) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .fill(LinearGradient(
                                    colors: [rose.opacity(0.20), Color(red: 0.95, green: 0.55, blue: 0.30).opacity(0.12)],
                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                ))
                            Image(systemName: "heart.circle.fill")
                                .font(.system(size: 28))
                                .foregroundStyle(rose)
                        }
                        .frame(width: 56, height: 56)

                        Text("Invite a Care Receiver")
                            .font(.system(size: 26, weight: .bold, design: .rounded))
                            .foregroundStyle(dark)

                        Text("They'll receive an email to download CareLoop, see all care activity, and get reminders for tasks assigned to them — like medication or appointments.")
                            .font(.system(size: 15, weight: .medium, design: .rounded))
                            .foregroundStyle(mid)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    // Form card
                    VStack(alignment: .leading, spacing: 18) {
                        field("Full name", text: $name,
                              placeholder: "e.g. Margaret Chen",
                              keyboard: .default,
                              capitalize: .words)

                        field("Email address", text: $email,
                              placeholder: "margaret@example.com",
                              keyboard: .emailAddress,
                              capitalize: .never)
                    }
                    .padding(22)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
                    .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 3)

                    // Role info card
                    HStack(spacing: 12) {
                        Image(systemName: "lock.open.fill")
                            .font(.system(size: 15))
                            .foregroundStyle(rose)
                        Text("Care Receiver access — they see all tasks, receive personal reminders, and can mark their own assigned tasks as done. They cannot create or edit tasks.")
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(mid)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(16)
                    .background(rose.opacity(0.06), in: RoundedRectangle(cornerRadius: 16, style: .continuous))

                    // Age confirmation
                    Button {
                        confirmedAdult.toggle()
                    } label: {
                        HStack(spacing: 12) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 6, style: .continuous)
                                    .fill(confirmedAdult ? rose : Color(red: 0.86, green: 0.90, blue: 0.95))
                                    .frame(width: 22, height: 22)
                                if confirmedAdult {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundStyle(.white)
                                }
                            }
                            Text("I confirm this person is 18 years or older")
                                .font(.system(size: 14, weight: .medium, design: .rounded))
                                .foregroundStyle(dark)
                                .multilineTextAlignment(.leading)
                            Spacer()
                        }
                    }
                    .buttonStyle(.plain)

                    if let error {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    // Send button
                    Button {
                        Task { await sendInvite() }
                    } label: {
                        HStack {
                            Spacer()
                            if loading {
                                ProgressView().tint(.white)
                            } else {
                                Image(systemName: "paperplane.fill")
                                Text("Send Invite")
                                    .font(.system(size: 17, weight: .bold, design: .rounded))
                            }
                            Spacer()
                        }
                        .padding(.vertical, 18)
                        .background(
                            LinearGradient(
                                colors: [rose, Color(red: 0.95, green: 0.55, blue: 0.30)],
                                startPoint: .leading, endPoint: .trailing
                            ),
                            in: Capsule()
                        )
                        .foregroundStyle(.white)
                    }
                    .buttonStyle(.plain)
                    .disabled(!isValid)
                    .opacity(isValid ? 1 : 0.50)
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)
                .padding(.bottom, 40)
            }
            .background(bg.ignoresSafeArea())
            .navigationBarHidden(true)
            .overlay(alignment: .topLeading) {
                Button { dismiss() } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 28))
                        .foregroundStyle(Color(red: 0.70, green: 0.76, blue: 0.86))
                        .symbolRenderingMode(.hierarchical)
                }
                .padding(.top, 20)
                .padding(.leading, 20)
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
                role: .recipient
            )
            dismiss()
        } catch {
            self.error = error.localizedDescription
            loading = false
        }
    }

    private func field(
        _ label: String, text: Binding<String>,
        placeholder: String,
        keyboard: UIKeyboardType,
        capitalize: TextInputAutocapitalization
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(mid)
            TextField(placeholder, text: text)
                .keyboardType(keyboard)
                .textInputAutocapitalization(capitalize)
                .autocorrectionDisabled()
                .font(.system(size: 18, weight: .medium, design: .rounded))
                .padding(.horizontal, 18)
                .padding(.vertical, 16)
                .background(Color(red: 0.97, green: 0.98, blue: 0.99))
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(Color(red: 0.86, green: 0.90, blue: 0.95), lineWidth: 1.5)
                )
        }
    }
}
