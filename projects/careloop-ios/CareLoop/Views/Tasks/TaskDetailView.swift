import SwiftUI

struct TaskDetailView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var task: CareTask
    let onUpdate: (CareTask) -> Void
    let onDelete: () -> Void

    @State private var isEditing       = false
    @State private var editTitle:      String
    @State private var editNotes:      String
    @State private var editHasDue:     Bool
    @State private var editDueAt:      Date
    @State private var editPriority:   TaskPriority
    @State private var editAssigneeId: String?
    @State private var loading         = false
    @State private var error:          String?
    @State private var showDeleteAlert = false

    init(task: CareTask, onUpdate: @escaping (CareTask) -> Void, onDelete: @escaping () -> Void) {
        _task          = State(initialValue: task)
        self.onUpdate  = onUpdate
        self.onDelete  = onDelete
        _editTitle     = State(initialValue: task.title)
        _editNotes     = State(initialValue: task.notes ?? "")
        _editHasDue    = State(initialValue: task.dueAt != nil)
        _editDueAt     = State(initialValue: task.dueAt ?? Date().addingTimeInterval(3600))
        _editPriority  = State(initialValue: task.priority)
        _editAssigneeId = State(initialValue: task.assigneeId)
    }

    private var userId:   String { appState.currentUser?.id ?? "" }
    private var circleId: String { appState.activeCircle?.id ?? "" }
    private var isAdmin:  Bool   { appState.userRole == .admin }
    private var isOwn:    Bool   { task.creatorId == userId }
    private var canEdit:  Bool   { isAdmin || isOwn }

    var body: some View {
        Form {
            detailSection
            statusSection
            if isAdmin { assigneeSection }
            if canEdit {
                Section {
                    Button("Delete Task", role: .destructive) { showDeleteAlert = true }
                        .disabled(loading)
                }
            }
            if let error {
                Section { Text(error).foregroundColor(.red).font(.caption) }
            }
        }
        .navigationTitle(isEditing ? "Edit Task" : "Task Detail")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if canEdit {
                ToolbarItem(placement: .primaryAction) {
                    if isEditing {
                        Button("Save") { Task { await save() } }
                            .disabled(editTitle.trimmingCharacters(in: .whitespaces).isEmpty || loading)
                    } else {
                        Button("Edit") { startEditing() }
                    }
                }
            }
            if isEditing {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { cancelEdit() }
                }
            }
        }
        .confirmationDialog("Delete this task?", isPresented: $showDeleteAlert, titleVisibility: .visible) {
            Button("Delete", role: .destructive) { Task { await performDelete() } }
        }
        .careLoopBrandBanner()
    }

    // MARK: — Sections

    @ViewBuilder
    private var detailSection: some View {
        Section("Task") {
            if isEditing {
                TextField("Title", text: $editTitle)
                TextField("Notes (optional)", text: $editNotes, axis: .vertical)
                    .lineLimit(3...6)
                Toggle("Set due date", isOn: $editHasDue)
                if editHasDue {
                    DatePicker("Due", selection: $editDueAt, displayedComponents: [.date, .hourAndMinute])
                }
                Picker("Priority", selection: $editPriority) {
                    ForEach(TaskPriority.allCases, id: \.self) { Text($0.label) }
                }
                .pickerStyle(.segmented)
            } else {
                LabeledContent("Title", value: task.title)
                if let notes = task.notes, !notes.isEmpty {
                    LabeledContent("Notes", value: notes)
                }
                if let due = task.dueAt {
                    LabeledContent("Due") {
                        Text(due, style: .date) + Text(" ") + Text(due, style: .time)
                    }
                }
                LabeledContent("Priority", value: task.priority.label)
            }
        }
    }

    @ViewBuilder
    private var statusSection: some View {
        Section("Status") {
            ForEach([TaskStatus.pending, .inProgress, .done, .skipped], id: \.self) { s in
                let allowed = s == .skipped ? (isAdmin || isOwn) : true
                Button {
                    guard allowed, !loading else { return }
                    Task { await changeStatus(s) }
                } label: {
                    HStack {
                        Image(systemName: task.status == s ? "checkmark.circle.fill" : "circle")
                            .foregroundColor(task.status == s ? .accentColor : .secondary)
                        Text(s.label)
                            .foregroundColor(allowed ? .primary : .secondary)
                    }
                }
                .disabled(!allowed || loading)
            }
        }
    }

    @ViewBuilder
    private var assigneeSection: some View {
        let members = appState.activeCircle?.members ?? []
        Section("Assignee") {
            if isEditing {
                Picker("Assign to", selection: Binding(
                    get: { editAssigneeId ?? "" },
                    set: { editAssigneeId = $0.isEmpty ? nil : $0 }
                )) {
                    Text("Unassigned").tag("")
                    ForEach(members) { m in
                        Text(m.user?.name ?? "Unknown").tag(m.userId)
                    }
                }
            } else {
                let name = members.first(where: { $0.userId == task.assigneeId })?.user?.name
                LabeledContent("Assignee", value: name ?? "Unassigned")
            }
        }
    }

    // MARK: — Actions

    private func startEditing() {
        editTitle      = task.title
        editNotes      = task.notes ?? ""
        editHasDue     = task.dueAt != nil
        editDueAt      = task.dueAt ?? Date().addingTimeInterval(3600)
        editPriority   = task.priority
        editAssigneeId = task.assigneeId
        isEditing      = true
    }

    private func cancelEdit() {
        isEditing = false
        error     = nil
    }

    private func save() async {
        loading = true
        error   = nil
        do {
            let updated = try await APIClient.shared.updateTask(
                circleId:   circleId,
                taskId:     task.id,
                userId:     userId,
                title:      editTitle.trimmingCharacters(in: .whitespaces),
                notes:      editNotes.isEmpty ? nil : editNotes,
                dueAt:      editHasDue ? editDueAt : nil,
                priority:   editPriority,
                isAdmin:    isAdmin,
                assigneeId: editAssigneeId
            )
            task      = updated
            isEditing = false
            onUpdate(updated)
        } catch { self.error = error.localizedDescription }
        loading = false
    }

    private func changeStatus(_ newStatus: TaskStatus) async {
        guard task.status != newStatus else { return }
        loading = true
        do {
            let updated = try await APIClient.shared.updateTaskStatus(
                circleId: circleId,
                taskId:   task.id,
                userId:   userId,
                status:   newStatus
            )
            task = updated
            onUpdate(updated)
        } catch { self.error = error.localizedDescription }
        loading = false
    }

    private func performDelete() async {
        loading = true
        do {
            try await APIClient.shared.deleteTask(circleId: circleId, taskId: task.id, userId: userId)
            onDelete()
            dismiss()
        } catch { self.error = error.localizedDescription }
        loading = false
    }
}
