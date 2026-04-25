import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            CirclesView()
                .tabItem { Label("Tasks", systemImage: "checklist") }
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape") }
        }
    }
}
