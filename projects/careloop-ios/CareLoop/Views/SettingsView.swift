import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState

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
                        LabeledContent("Circle",    value: circle.name)
                        LabeledContent("For",       value: circle.recipientName)
                        LabeledContent("Circle ID", value: circle.id)
                            .font(.caption)
                    }
                }
                Section {
                    Button("Sign Out", role: .destructive) { appState.signOut() }
                }
            }
            .navigationTitle("Settings")
        }
    }
}
