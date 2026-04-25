import SwiftUI

@main
struct CareLoopApp: App {
    @StateObject private var appState = AppState()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            if appState.currentUser == nil {
                OnboardingView()
                    .environmentObject(appState)
            } else {
                ContentView()
                    .environmentObject(appState)
            }
        }
        .onChange(of: scenePhase) { phase in
            guard phase == .active,
                  let user   = appState.currentUser,
                  let circle = appState.activeCircle
            else { return }
            Task { try? await APIClient.shared.logSession(userId: user.id, circleId: circle.id) }
        }
    }
}
