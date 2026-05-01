import SwiftUI

struct CirclesView: View {
    @EnvironmentObject var appState: AppState
    @AppStorage("askedForPush") private var askedForPush = false
    @State private var tasks:        [CareTask] = []
    @State private var loading       = true
    @State private var error:        String?
    @State private var showNewTask   = false
    @State private var showMembers   = false
    @State private var showSettings  = false
    @State private var showPermissionSheet = false
    @State private var deepLinkedTask: CareTask?
    @State private var selectedRecipientFilter = "all"

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
            .navigationTitle(appState.activeCircle?.name ?? "Care Tasks")
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
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        appState.clearActiveCircleSelection()
                    } label: {
                        Image(systemName: "square.grid.2x2")
                    }
                }
            }
            .sheet(isPresented: $showNewTask, onDismiss: { Task { await loadTasks() } }) {
                if let circle = appState.activeCircle, let user = appState.currentUser {
                    NewTaskView(
                        circleId:   circle.id,
                        creatorId:  user.id,
                        members:    circle.members ?? [],
                        recipients: circle.recipients ?? [],
                        isAdmin:    appState.userRole == .admin,
                        onCreated:  { createdTask in
                            if createdTask.dueAt != nil && !askedForPush {
                                showPermissionSheet = true
                            }
                        }
                    )
                }
            }
            .sheet(isPresented: $showMembers) {
                MemberListView()
                    .environmentObject(appState)
            }
            .sheet(isPresented: $showSettings) {
                if let circle = appState.activeCircle {
                    CircleSettingsView(circle: circle)
                        .environmentObject(appState)
                }
            }
            .sheet(isPresented: $showPermissionSheet) {
                NotificationPermissionView { _ in
                    askedForPush = true
                }
            }
            .navigationDestination(isPresented: Binding(
                get: { deepLinkedTask != nil },
                set: { if !$0 { deepLinkedTask = nil } }
            )) {
                if let task = deepLinkedTask {
                    TaskDetailView(
                        task: task,
                        onUpdate: { updated in updateInList(updated) },
                        onDelete: { removeFromList(task) }
                    )
                }
            }
        }
        .careLoopBrandBanner()
        .task { await loadTasks() }
        .onAppear {
            if appState.shouldPromptNewTask {
                showNewTask = true
                appState.consumeNewTaskPrompt()
            }
        }
        .onChange(of: appState.shouldPromptNewTask) { shouldPrompt in
            if shouldPrompt {
                showNewTask = true
                appState.consumeNewTaskPrompt()
            }
        }
        .onChange(of: appState.pendingTaskId) { _ in
            syncPendingTaskNavigation()
        }
        .onChange(of: tasks) { _ in
            syncPendingTaskNavigation()
        }
        .onChange(of: appState.activeCircle?.id) { _ in
            selectedRecipientFilter = "all"
            Task { await loadTasks() }
        }
    }

    // MARK: — Task list

    private var taskList: some View {
        List {
            if let circle = appState.activeCircle {
                Section {
                    VStack(alignment: .leading, spacing: 14) {
                        activeCircleCard(circle)

                        if !recipientFilters.isEmpty {
                            recipientFilterRow
                        }
                    }
                }
                .listRowBackground(Color.clear)
            }

            if !activeTasks.isEmpty {
                Section("Active") {
                    ForEach(activeTasks) { task in
                        taskRow(task)
                    }
                }
            }

            if !completedTasks.isEmpty {
                Section("Completed") {
                    ForEach(completedTasks) { task in
                        taskRow(task)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .refreshable { await loadTasks() }
    }

    private var recipientFilters: [CareRecipient] {
        appState.activeCircle?.recipients ?? []
    }

    @ViewBuilder
    private func activeCircleCard(_ circle: CareCircle) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [Color(red: 0.16, green: 0.80, blue: 0.72), Color(red: 0.13, green: 0.56, blue: 0.87)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                Image("CareLoopIcon")
                    .resizable()
                    .scaledToFit()
                    .padding(12)
            }
            .frame(width: 52, height: 52)

            VStack(alignment: .leading, spacing: 4) {
                Text(circle.name)
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(red: 0.10, green: 0.16, blue: 0.24))
                Text(recipientSubtitle(for: circle))
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
                Text(appState.circleMemberships.count > 1 ? "Manage this circle or return to the list" : "Current active circle")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(Color(red: 0.13, green: 0.56, blue: 0.87))
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 6) {
                Text(appState.userRole == .admin ? "Admin" : "Member")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(appState.userRole == .admin ? Color(red: 0.13, green: 0.56, blue: 0.87) : Color(red: 0.23, green: 0.33, blue: 0.44))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 999, style: .continuous)
                            .fill(appState.userRole == .admin ? Color(red: 0.88, green: 0.95, blue: 1.0) : Color(red: 0.93, green: 0.95, blue: 0.98))
                    )

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(18)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
    }

    @ViewBuilder
    private var recipientFilterRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                filterChip(id: "all", title: "All recipients")
                ForEach(recipientFilters) { recipient in
                    filterChip(id: recipient.id, title: recipient.name)
                }
            }
            .padding(.horizontal, 2)
        }
    }

    @ViewBuilder
    private func filterChip(id: String, title: String) -> some View {
        Button {
            selectedRecipientFilter = id
        } label: {
            Text(title)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(selectedRecipientFilter == id ? .white : Color(red: 0.23, green: 0.33, blue: 0.44))
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    Group {
                        if selectedRecipientFilter == id {
                            LinearGradient(
                                colors: [Color(red: 0.16, green: 0.80, blue: 0.72), Color(red: 0.13, green: 0.56, blue: 0.87)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        } else {
                            Color.white
                        }
                    }
                )
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(Color(red: 0.84, green: 0.89, blue: 0.95), lineWidth: 1.5)
                )
        }
        .buttonStyle(.plain)
    }

    private var activeTasks: [CareTask] {
        filteredTasks
            .filter { $0.status != .done && $0.status != .skipped }
            .sorted {
                switch ($0.dueAt, $1.dueAt) {
                case let (lhs?, rhs?): return lhs < rhs
                case (_?, nil): return true
                case (nil, _?): return false
                case (nil, nil): return $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending
                }
            }
    }

    private var completedTasks: [CareTask] {
        filteredTasks
            .filter { $0.status == .done || $0.status == .skipped }
            .sorted {
                let lhs = $0.completedAt ?? .distantPast
                let rhs = $1.completedAt ?? .distantPast
                if lhs != rhs { return lhs > rhs }
                return $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending
            }
    }

    private var filteredTasks: [CareTask] {
        guard selectedRecipientFilter != "all" else { return tasks }
        return tasks.filter { $0.recipientId == selectedRecipientFilter }
    }

    private func recipientSubtitle(for circle: CareCircle) -> String {
        let names = circle.recipientNames
        switch names.count {
        case 0:
            return "Care group"
        case 1:
            return "Caring for \(names[0])"
        case 2:
            return "Caring for \(names[0]) and \(names[1])"
        default:
            return "Caring for \(names[0]) + \(names.count - 1) more"
        }
    }

    @ViewBuilder
    private func taskRow(_ task: CareTask) -> some View {
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

    // MARK: — Permissions

    private func canMutate(_ task: CareTask) -> Bool {
        appState.userRole == .admin || task.creatorId == appState.currentUser?.id
    }

    private func canSkip(_ task: CareTask) -> Bool {
        task.status != .skipped && canMutate(task)
    }

    // MARK: — Data operations

    private func loadTasks() async {
        guard let circleId = appState.activeCircle?.id else {
            tasks = []
            loading = false
            return
        }
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
        tasks = tasks.map { existing in
            existing.id == task.id ? task : existing
        }
    }

    private func removeFromList(_ task: CareTask) {
        tasks.removeAll { $0.id == task.id }
    }

    private func syncPendingTaskNavigation() {
        guard let pendingTaskId = appState.pendingTaskId,
              let task = tasks.first(where: { $0.id == pendingTaskId }) else { return }
        deepLinkedTask = task
        appState.consumePendingTask()
    }
}
