import SwiftUI

struct CirclesView: View {
    @EnvironmentObject var appState: AppState
    @State private var tasks: [CareTask] = []
    @State private var loading = true
    @State private var error: String?
    @State private var showNewTask = false

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
            }
            .sheet(isPresented: $showNewTask, onDismiss: { Task { await loadTasks() } }) {
                if let circle = appState.activeCircle, let user = appState.currentUser {
                    NewTaskView(circleId: circle.id, creatorId: user.id)
                }
            }
        }
        .task { await loadTasks() }
    }

    private var taskList: some View {
        List {
            ForEach(tasks) { task in
                TaskRowView(task: task) {
                    Task { await toggle(task) }
                }
            }
        }
        .listStyle(.insetGrouped)
        .refreshable { await loadTasks() }
    }

    private func loadTasks() async {
        guard let circleId = appState.activeCircle?.id else { return }
        loading = true
        do {
            tasks   = try await APIClient.shared.fetchTasks(circleId: circleId)
            error   = nil
        } catch { self.error = error.localizedDescription }
        loading = false
    }

    private func toggle(_ task: CareTask) async {
        guard let circleId = appState.activeCircle?.id else { return }
        let next: TaskStatus = task.status == .done ? .pending : .done
        if let updated = try? await APIClient.shared.updateTaskStatus(circleId: circleId, taskId: task.id, status: next),
           let idx = tasks.firstIndex(where: { $0.id == task.id }) {
            tasks[idx] = updated
        }
    }
}
