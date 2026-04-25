import SwiftUI

@MainActor
final class AppState: ObservableObject {
    @Published var currentUser: CareUser?
    @Published var activeCircle: CareCircle?

    private let userKey   = "careloop.userId"
    private let circleKey = "careloop.circleId"

    init() {
        Task { await restoreSession() }
    }

    var userRole: MemberRole {
        guard let userId = currentUser?.id,
              let members = activeCircle?.members
        else { return .member }
        return members.first(where: { $0.userId == userId })?.role ?? .member
    }

    func signIn(user: CareUser, circle: CareCircle) {
        currentUser  = user
        activeCircle = circle
        UserDefaults.standard.set(user.id,   forKey: userKey)
        UserDefaults.standard.set(circle.id, forKey: circleKey)
    }

    func signOut() {
        currentUser  = nil
        activeCircle = nil
        UserDefaults.standard.removeObject(forKey: userKey)
        UserDefaults.standard.removeObject(forKey: circleKey)
    }

    private func restoreSession() async {
        guard
            let userId   = UserDefaults.standard.string(forKey: userKey),
            let circleId = UserDefaults.standard.string(forKey: circleKey)
        else { return }
        do {
            let user   = try await APIClient.shared.fetchUser(id: userId)
            let circle = try await APIClient.shared.fetchCircle(id: circleId)
            currentUser  = user
            activeCircle = circle
        } catch { signOut() }
    }
}
