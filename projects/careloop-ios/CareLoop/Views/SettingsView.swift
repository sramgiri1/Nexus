import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @State private var showJoinCircle = false

    var body: some View {
        NavigationStack {
            List {
                if let user = appState.currentUser {
                    Section("Account") {
                        LabeledContent("Name",  value: user.name)
                        LabeledContent("Email", value: user.email)
                    }
                }
                if let circle = appState.activeCircle {
                    Section("Care Circle") {
                        LabeledContent("Circle", value: circle.name)
                        LabeledContent("For",    value: circle.recipientName)
                        if appState.userRole == .admin {
                            LabeledContent("Circle ID", value: circle.id)
                                .font(.caption)
                            ShareLink("Share Circle ID", item: circle.id)
                        }
                    }
                }
                Section {
                    Button("Join Another Circle") { showJoinCircle = true }
                    Button("Sign Out", role: .destructive) { appState.signOut() }
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $showJoinCircle) {
                JoinCircleView()
                    .environmentObject(appState)
            }
        }
        .careLoopBrandBanner()
    }
}
