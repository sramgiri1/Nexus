import SwiftUI
import Combine

extension Notification.Name {
    static let careLoopPushTokenRegistered = Notification.Name("CareLoopPushTokenRegistered")
    static let careLoopPushTaskOpened = Notification.Name("CareLoopPushTaskOpened")
}

@MainActor
final class AppState: ObservableObject {
    @Published var currentUser: CareUser?
    @Published var activeCircle: CareCircle?
    @Published var pendingTaskId: String?

    private let userKey   = "careloop.userId"
    private let circleKey = "careloop.circleId"
    private var cancellables: Set<AnyCancellable> = []
    private var pendingPushToken: String?

    init() {
        NotificationCenter.default.publisher(for: .careLoopPushTokenRegistered)
            .compactMap { $0.object as? String }
            .receive(on: RunLoop.main)
            .sink { [weak self] token in
                self?.handlePushToken(token)
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: .careLoopPushTaskOpened)
            .compactMap { $0.object as? String }
            .receive(on: RunLoop.main)
            .sink { [weak self] taskId in
                self?.pendingTaskId = taskId
            }
            .store(in: &cancellables)

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
        Task { await flushPendingPushTokenIfNeeded() }
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
            await flushPendingPushTokenIfNeeded()
        } catch { signOut() }
    }

    func consumePendingTask() {
        pendingTaskId = nil
    }

    private func handlePushToken(_ token: String) {
        pendingPushToken = token
        Task { await flushPendingPushTokenIfNeeded() }
    }

    private func flushPendingPushTokenIfNeeded() async {
        guard let token = pendingPushToken,
              let userId = currentUser?.id else { return }
        do {
            currentUser = try await APIClient.shared.updatePushToken(userId: userId, pushToken: token)
            pendingPushToken = nil
        } catch {
            // Keep the token cached; the next session restore or sign-in will retry.
        }
    }
}
