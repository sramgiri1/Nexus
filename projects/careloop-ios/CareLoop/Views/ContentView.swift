import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        if appState.activeCircle == nil {
            JoinCircleView()
                .environmentObject(appState)
        } else {
            TabView {
                CirclesView()
                    .tabItem { Label("Tasks", systemImage: "checklist") }
                SettingsView()
                    .tabItem { Label("Settings", systemImage: "gearshape") }
            }
        }
    }
}
