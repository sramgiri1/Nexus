import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @State private var showCircleSwitcher  = false
    @State private var showInsights        = false
    @State private var showDeleteAlert     = false
    @State private var showLeaveAlert      = false
    @State private var dangerLoading       = false
    @State private var error:              String?
    @State private var notifAssignments    = true
    @State private var notifEscalations    = true
    @State private var notifDigest         = true
    @State private var savingPrefs         = false
    @State private var prefsLoaded         = false
    @State private var saveTask:           Task<Void, Never>? = nil

    private var role: MemberRole { appState.userRole }
    private var isAdmin: Bool { role == .admin }
    private var activeCircle: CareCircle? { appState.activeCircle }

    var body: some View {
        NavigationStack {
            List {
                // MARK: Account
                if let user = appState.currentUser {
                    Section("Account") {
                        LabeledContent("Name",  value: user.name)
                        LabeledContent("Email", value: user.email)
                    }
                }

                // MARK: Care Circle (read-only info)
                if let circle = activeCircle {
                    Section("Care Circle") {
                        LabeledContent("Circle", value: circle.name)
                        if !circle.recipientDisplaySummary.isEmpty {
                            LabeledContent("For", value: circle.recipientDisplaySummary)
                        }
                        LabeledContent("Archive completed tasks",
                                       value: "\(circle.archiveAfterDays) day\(circle.archiveAfterDays == 1 ? "" : "s")")
                        if isAdmin {
                            LabeledContent("Circle ID", value: circle.id)
                                .font(.caption)
                            ShareLink("Share Circle ID", item: circle.id)
                            Button("Completion Insights") { showInsights = true }
                        }
                    }
                }

                // MARK: Your Circles
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
                                Text(membership.role.displayLabel)
                                    .font(.system(size: 12, weight: .bold, design: .rounded))
                                    .foregroundStyle(membership.circleId == activeCircle?.id
                                                     ? Color(red: 0.12, green: 0.68, blue: 0.49)
                                                     : .secondary)
                            }
                        }
                        Button("Manage Circles") { showCircleSwitcher = true }
                    }
                }

                // MARK: Danger Zone
                if let circle = activeCircle {
                    Section {
                        if isAdmin {
                            Button(role: .destructive) {
                                showDeleteAlert = true
                            } label: {
                                HStack {
                                    if dangerLoading {
                                        ProgressView().tint(.red)
                                    } else {
                                        Label("Delete \"\(circle.name)\"", systemImage: "trash.fill")
                                    }
                                }
                            }
                            .disabled(dangerLoading)
                        } else {
                            Button(role: .destructive) {
                                showLeaveAlert = true
                            } label: {
                                HStack {
                                    if dangerLoading {
                                        ProgressView().tint(.red)
                                    } else {
                                        Label("Leave \"\(circle.name)\"", systemImage: "rectangle.portrait.and.arrow.right")
                                    }
                                }
                            }
                            .disabled(dangerLoading)
                        }
                    } header: {
                        Text("Danger Zone")
                    } footer: {
                        if isAdmin {
                            Text("Permanently deletes this circle, all tasks, and removes all members. This cannot be undone.")
                        } else {
                            Text("You'll be removed from this circle. Admins can re-invite you if needed.")
                        }
                    }
                }

                // MARK: Notifications
                if let user = appState.currentUser {
                    Section("Notifications") {
                        Toggle("Task assignments", isOn: $notifAssignments)
                            .onChange(of: notifAssignments) { _ in guard prefsLoaded else { return }; saveNotifPrefs(userId: user.id) }
                        Toggle("Escalation alerts", isOn: $notifEscalations)
                            .onChange(of: notifEscalations) { _ in guard prefsLoaded else { return }; saveNotifPrefs(userId: user.id) }
                        Toggle("Daily digest", isOn: $notifDigest)
                            .onChange(of: notifDigest) { _ in guard prefsLoaded else { return }; saveNotifPrefs(userId: user.id) }
                        if savingPrefs {
                            HStack {
                                Spacer()
                                ProgressView().scaleEffect(0.8)
                                Spacer()
                            }
                        }
                    }
                }

                // MARK: Sign Out
                if let err = error {
                    Section {
                        Text(err).font(.footnote).foregroundStyle(.red)
                    }
                }

                Section {
                    Button("Join or Create Another Circle") { showCircleSwitcher = true }
                    Button("Sign Out", role: .destructive) { appState.signOut() }
                }
            }
            .navigationTitle("Settings")
            .onAppear {
                if let user = appState.currentUser {
                    notifAssignments = user.notifAssignments ?? true
                    notifEscalations = user.notifEscalations ?? true
                    notifDigest      = user.notifDigest      ?? true
                }
                // Set prefsLoaded after onChange handlers have processed the initial state mutations
                Task { @MainActor in prefsLoaded = true }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        appState.clearActiveCircleSelection()
                    } label: {
                        Image(systemName: "square.grid.2x2")
                    }
                }
            }
            // Delete alert — admin only
            .alert("Delete \"\(activeCircle?.name ?? "this circle")\"?",
                   isPresented: $showDeleteAlert) {
                Button("Delete", role: .destructive) { Task { await deleteCircle() } }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This will permanently delete the circle, all tasks, and remove every member. This cannot be undone.")
            }
            // Leave alert — member + recipient
            .alert("Leave \"\(activeCircle?.name ?? "this circle")\"?",
                   isPresented: $showLeaveAlert) {
                Button("Leave", role: .destructive) { Task { await leaveCircle() } }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("You'll be removed from this circle. Admins can re-invite you if you change your mind.")
            }
            .sheet(isPresented: $showCircleSwitcher) {
                CircleSwitcherView().environmentObject(appState)
            }
            .sheet(isPresented: $showInsights) {
                NavigationStack {
                    AdminInsightsView().environmentObject(appState)
                }
            }
        }
        .careLoopBrandBanner()
    }

    // MARK: – Actions

    private func saveNotifPrefs(userId: String) {
        saveTask?.cancel()
        saveTask = Task {
            try? await Task.sleep(for: .milliseconds(300))
            guard !Task.isCancelled else { return }
            savingPrefs = true
            do {
                let updated = try await APIClient.shared.updateNotificationPreferences(
                    userId: userId,
                    notifAssignments: notifAssignments,
                    notifEscalations: notifEscalations,
                    notifDigest: notifDigest
                )
                if appState.currentUser != nil { appState.currentUser = updated }
            } catch {
                self.error = error.localizedDescription
            }
            savingPrefs = false
        }
    }

    private func deleteCircle() async {
        guard let circleId = activeCircle?.id else { return }
        dangerLoading = true; error = nil
        do {
            try await APIClient.shared.deleteCircle(id: circleId)
            appState.clearActiveCircleSelection()
            try await appState.refreshMemberships()
        } catch {
            self.error = error.localizedDescription
            dangerLoading = false
        }
    }

    private func leaveCircle() async {
        guard let circleId = activeCircle?.id else { return }
        dangerLoading = true; error = nil
        do {
            try await APIClient.shared.leaveCircle(circleId: circleId)
            appState.clearActiveCircleSelection()
            try await appState.refreshMemberships()
        } catch {
            self.error = error.localizedDescription
            dangerLoading = false
        }
    }
}
