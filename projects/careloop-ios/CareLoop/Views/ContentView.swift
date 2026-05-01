import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        if appState.activeCircle == nil {
            CircleListView()
                .environmentObject(appState)
        } else {
            CircleHomeView()
                .environmentObject(appState)
        }
    }
}
