import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @State private var showCircleSwitcher = false
    @State private var showInsights = false

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
                        LabeledContent("For",    value: circle.recipientDisplaySummary)
                        LabeledContent("Archive completed tasks", value: "\(circle.archiveAfterDays) day\(circle.archiveAfterDays == 1 ? "" : "s")")
                        if appState.userRole == .admin {
                            LabeledContent("Circle ID", value: circle.id)
                                .font(.caption)
                            ShareLink("Share Circle ID", item: circle.id)
                            Button("Completion Insights") { showInsights = true }
                        }
                    }
                }
                if !appState.circleMemberships.isEmpty {
                    Section("Your Circles") {
                        ForEach(appState.circleMemberships) { membership in
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(membership.circle?.name ?? "Care Circle")
                                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                                    Text(membership.circle?.recipientDisplaySummary ?? "")
                                        .font(.system(size: 13, weight: .medium, design: .rounded))
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text(membership.role == .admin ? "Admin" : "Member")
                                    .font(.system(size: 12, weight: .bold, design: .rounded))
                                    .foregroundStyle(membership.circleId == appState.activeCircle?.id ? Color(red: 0.12, green: 0.68, blue: 0.49) : .secondary)
                            }
                        }

                        Button("Manage Circles") { showCircleSwitcher = true }
                    }
                }
                Section {
                    Button("Join or Create Another Circle") { showCircleSwitcher = true }
                    Button("Sign Out", role: .destructive) { appState.signOut() }
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        appState.clearActiveCircleSelection()
                    } label: {
                        Image(systemName: "square.grid.2x2")
                    }
                }
            }
            .sheet(isPresented: $showCircleSwitcher) {
                CircleSwitcherView()
                    .environmentObject(appState)
            }
            .sheet(isPresented: $showInsights) {
                NavigationStack {
                    AdminInsightsView()
                        .environmentObject(appState)
                }
            }
        }
        .careLoopBrandBanner()
    }
}
