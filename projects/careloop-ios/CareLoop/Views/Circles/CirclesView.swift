import SwiftUI

struct CirclesView: View {
    @EnvironmentObject var appState: AppState
    @State private var tasks:        [CareTask] = []
    @State private var loading       = true
    @State private var error:        String?
    @State private var showNewTask   = false
    @State private var showMembers   = false
    @State private var showSettings  = false

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    ProgressView()
                } else if let error {
                    Text(error).foregroundColor(.secondary)
                } else {
                    taskList
                }
            }
            .navigationTitle(appState.activeCircle?.recipientName ?? "Care Tasks")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button { showNewTask = true } label: { Image(systemName: "plus") }
                }
                ToolbarItem(placement: .topBarLeading) {
                    HStack(spacing: 16) {
                        Button { showMembers = true } label: {
                            Image(systemName: "person.2")
                        }
                        if appState.userRole == .admin {
                            Button { showSettings = true } label: {
                                Image(systemName: "gearshape")
                            }
                        }
                    }
                }
            }
            .sheet(isPresented: $showNewTask, onDismiss: { Task { await loadTasks() } }) {
                if let circle = appState.activeCircle, let user = appState.currentUser {
                    NewTaskView(
                        circleId:   circle.id,
                        creatorId:  user.id,
                        members:    circle.members ?? [],
                        isAdmin:    appState.userRole == .admin
                    )
                }
            }
            .sheet(isPresented: $showMembers) {
                MemberListView(members: appState.activeCircle?.members ?? [])
            }
            .sheet(isPresented: $showSettings) {
                if let circle = appState.activeCircle {
                    CircleSettingsView(circle: circle)
                        .environmentObject(appState)
                }
            }
        }
        .task { await loadTasks() }
    }

    // MARK: — Task list

    private var taskList: some View {
        List {
            ForEach(tasks) { task in
                NavigationLink {
                    TaskDetailView(
                        task:     task,
                        onUpdate: { updated in updateInList(updated) },
                        onDelete: { removeFromList(task) }
                    )
                } label: {
                    TaskRowView(task: task) {
                        Task { await toggle(task) }
                    }
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                    if canMutate(task) {
                        Button(role: .destructive) {
                            Task { await deleteTask(task) }
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                }
                .swipeActions(edge: .leading) {
                    if canSkip(task) {
                        Button {
                            Task { await setStatus(task, .skipped) }
                        } label: {
                            Label("Skip", systemImage: "forward.fill")
                        }
                        .tint(.orange)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .refreshable { await loadTasks() }
    }

    // MARK: — Permissions

    private func canMutate(_ task: CareTask) -> Bool {
        appState.userRole == .admin || task.creatorId == appState.currentUser?.id
    }

    private func canSkip(_ task: CareTask) -> Bool {
        task.status != .skipped && canMutate(task)
    }

    // MARK: — Data operations

    private func loadTasks() async {
        guard let circleId = appState.activeCircle?.id else { return }
        loading = true
        do {
            tasks = try await APIClient.shared.fetchTasks(circleId: circleId)
            error = nil
        } catch { self.error = error.localizedDescription }
        loading = false
    }

    private func toggle(_ task: CareTask) async {
        guard let circleId = appState.activeCircle?.id,
              let userId   = appState.currentUser?.id else { return }
        let next: TaskStatus = task.status == .done ? .pending : .done
        if let updated = try? await APIClient.shared.updateTaskStatus(
            circleId: circleId, taskId: task.id, userId: userId, status: next
        ) { updateInList(updated) }
    }

    private func setStatus(_ task: CareTask, _ status: TaskStatus) async {
        guard let circleId = appState.activeCircle?.id,
              let userId   = appState.currentUser?.id else { return }
        if let updated = try? await APIClient.shared.updateTaskStatus(
            circleId: circleId, taskId: task.id, userId: userId, status: status
        ) { updateInList(updated) }
    }

    private func deleteTask(_ task: CareTask) async {
        guard let circleId = appState.activeCircle?.id,
              let userId   = appState.currentUser?.id else { return }
        try? await APIClient.shared.deleteTask(circleId: circleId, taskId: task.id, userId: userId)
        removeFromList(task)
    }

    private func updateInList(_ task: CareTask) {
        if let idx = tasks.firstIndex(where: { $0.id == task.id }) { tasks[idx] = task }
    }

    private func removeFromList(_ task: CareTask) {
        tasks.removeAll { $0.id == task.id }
    }
}
