import SwiftUI

struct MemberListView: View {
    let members: [CircleMember]

    var body: some View {
        NavigationStack {
            List(members) { m in
                HStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(m.user?.name ?? "Unknown")
                            .font(.body)
                        if let email = m.user?.email {
                            Text(email)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    Spacer()
                    roleBadge(m.role)
                }
                .padding(.vertical, 2)
            }
            .navigationTitle("Circle Members")
            .navigationBarTitleDisplayMode(.inline)
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
}
