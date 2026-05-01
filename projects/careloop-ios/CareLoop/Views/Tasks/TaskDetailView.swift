import SwiftUI

struct TaskDetailView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var task: CareTask
    let onUpdate: (CareTask) -> Void
    let onDelete: () -> Void

    @State private var editTitle:      String
    @State private var editNotes:      String
    @State private var editHasDue:     Bool
    @State private var editDueAt:      Date
    @State private var editPriority:   TaskPriority
    @State private var editStatus:     TaskStatus
    @State private var editAssigneeId: String?
    @State private var editRecipientId: String
    @State private var editRepeatsTask: Bool
    @State private var editRecurrenceFrequency: TaskRecurrenceFrequency
    @State private var editRecurrenceInterval: Int
    @State private var editRecurrenceWeekdays: Set<TaskWeekday>
    @State private var editRecurrenceHasEnd: Bool
    @State private var editRecurrenceEndsAt: Date
    @State private var loading         = false
    @State private var error:          String?
    @State private var showDeleteAlert = false
    @State private var showSeriesScopeDialog = false

    init(task: CareTask, onUpdate: @escaping (CareTask) -> Void, onDelete: @escaping () -> Void) {
        _task          = State(initialValue: task)
        self.onUpdate  = onUpdate
        self.onDelete  = onDelete
        _editTitle     = State(initialValue: task.title)
        _editNotes     = State(initialValue: task.notes ?? "")
        _editHasDue    = State(initialValue: task.dueAt != nil)
        _editDueAt     = State(initialValue: task.dueAt ?? Date().addingTimeInterval(3600))
        _editPriority  = State(initialValue: task.priority)
        _editStatus    = State(initialValue: task.status)
        _editAssigneeId = State(initialValue: task.assigneeId)
        _editRecipientId = State(initialValue: task.recipientId ?? "")
        _editRepeatsTask = State(initialValue: task.recurrence != nil)
        _editRecurrenceFrequency = State(initialValue: task.recurrence?.frequency ?? .daily)
        _editRecurrenceInterval = State(initialValue: max(1, task.recurrence?.interval ?? 1))
        _editRecurrenceWeekdays = State(initialValue: Set(task.recurrence?.normalizedWeekdays ?? []))
        _editRecurrenceHasEnd = State(initialValue: task.recurrence?.endsAt != nil)
        _editRecurrenceEndsAt = State(initialValue: task.recurrence?.endsAt ?? Date().addingTimeInterval(60 * 60 * 24 * 30))
    }

    private var userId:   String { appState.currentUser?.id ?? "" }
    private var circleId: String { appState.activeCircle?.id ?? "" }
    private var isAdmin:  Bool   { appState.userRole == .admin }
    private var isOwn:    Bool   { task.creatorId == userId }
    private var canEdit:  Bool   { isAdmin || isOwn }

    var body: some View {
        Form {
            detailSection
            recipientSection
            recurrenceSection
            statusSection
            if isAdmin { assigneeSection }
            if canEdit {
                Section {
                    Button("Delete task", role: .destructive) {
                        showDeleteAlert = true
                    }
                    .disabled(loading)
                }
            }
            if let error {
                Section { Text(error).foregroundColor(.red).font(.caption) }
            }
        }
        .navigationTitle("Task")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button("Save") { handleSaveTapped() }
                    .disabled(editTitle.trimmingCharacters(in: .whitespaces).isEmpty || loading || !canEdit || (editRepeatsTask && !editHasDue) || editRecipientId.isEmpty)
            }
        }
        .onChange(of: editRepeatsTask) { repeats in
            if repeats && !editHasDue {
                editHasDue = true
            }
            ensureWeeklyDefaultWeekday()
        }
        .onChange(of: editRecurrenceFrequency) { _ in
            ensureWeeklyDefaultWeekday()
        }
        .onChange(of: editDueAt) { _ in
            ensureWeeklyDefaultWeekday()
        }
        .confirmationDialog("Delete this task?", isPresented: $showDeleteAlert, titleVisibility: .visible) {
            Button("Delete", role: .destructive) { Task { await performDelete() } }
        }
        .confirmationDialog("Apply changes to", isPresented: $showSeriesScopeDialog, titleVisibility: .visible) {
            Button("This occurrence only") { Task { await save(seriesScope: .occurrence) } }
            Button("Whole series") { Task { await save(seriesScope: .series) } }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Update only this task occurrence, or apply the task detail changes to the whole recurring series.")
        }
    }

    // MARK: — Sections

    @ViewBuilder
    private var detailSection: some View {
        Section("Task") {
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
        }
    }

    @ViewBuilder
    private var recipientSection: some View {
        let recipients = appState.activeCircle?.recipients ?? []
        Section("Care recipient") {
            if recipients.isEmpty {
                Text("Add a care recipient to this group before assigning tasks.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else if recipients.count == 1, let recipient = recipients.first {
                LabeledContent("For", value: recipient.name)
            } else {
                Picker("For", selection: $editRecipientId) {
                    ForEach(recipients) { recipient in
                        Text(recipient.name).tag(recipient.id)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var recurrenceSection: some View {
        Section("Recurrence") {
            Toggle("Repeat task", isOn: $editRepeatsTask)
            if editRepeatsTask {
                Picker("Repeats", selection: $editRecurrenceFrequency) {
                    Text(TaskRecurrenceFrequency.daily.label).tag(TaskRecurrenceFrequency.daily)
                    Text(TaskRecurrenceFrequency.weekly.label).tag(TaskRecurrenceFrequency.weekly)
                    Text(TaskRecurrenceFrequency.monthly.label).tag(TaskRecurrenceFrequency.monthly)
                    Text(TaskRecurrenceFrequency.custom.label).tag(TaskRecurrenceFrequency.custom)
                }

                if editRecurrenceFrequency == .weekly {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Days")
                            .font(.subheadline.weight(.semibold))
                        TaskWeekdayPicker(selection: $editRecurrenceWeekdays)
                        Text("Choose the weekdays when this task should recur.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }

                Stepper(value: $editRecurrenceInterval, in: 1...30) {
                    Text(recurrenceIntervalLabel)
                }

                Toggle("Ends on a date", isOn: $editRecurrenceHasEnd)
                if editRecurrenceHasEnd {
                    DatePicker("Ends", selection: $editRecurrenceEndsAt, displayedComponents: [.date])
                }

                Text("Recurring tasks require a due date. Saving a completed recurring task will create the next occurrence automatically.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }

    @ViewBuilder
    private var statusSection: some View {
        Section("Status") {
            Picker("Status", selection: $editStatus) {
                Text(TaskStatus.pending.label).tag(TaskStatus.pending)
                Text(TaskStatus.inProgress.label).tag(TaskStatus.inProgress)
                Text(TaskStatus.done.label).tag(TaskStatus.done)
                if isAdmin || isOwn {
                    Text(TaskStatus.skipped.label).tag(TaskStatus.skipped)
                }
            }
            .pickerStyle(.inline)
        }
    }

    @ViewBuilder
    private var assigneeSection: some View {
        let members = appState.activeCircle?.members ?? []
        Section("Assignee") {
            Picker("Assign to", selection: Binding(
                get: { editAssigneeId ?? "" },
                set: { editAssigneeId = $0.isEmpty ? nil : $0 }
            )) {
                Text("Unassigned").tag("")
                ForEach(members) { m in
                    Text(m.user?.name ?? "Unknown").tag(m.userId)
                }
            }
        }
    }

    private var recurrenceIntervalLabel: String {
        switch editRecurrenceFrequency {
        case .daily:
            return editRecurrenceInterval == 1 ? "Every day" : "Every \(editRecurrenceInterval) days"
        case .weekly:
            return editRecurrenceInterval == 1 ? "Every week" : "Every \(editRecurrenceInterval) weeks"
        case .monthly:
            return editRecurrenceInterval == 1 ? "Every month" : "Every \(editRecurrenceInterval) months"
        case .custom:
            return "Every \(editRecurrenceInterval) days"
        case .none:
            return "Does not repeat"
        }
    }

    private var recurrence: TaskRecurrence? {
        guard editRepeatsTask else { return nil }
        let weekdays = editRecurrenceFrequency == .weekly ? normalizedRecurrenceWeekdays : []
        return TaskRecurrence(
            frequency: editRecurrenceFrequency,
            interval: editRecurrenceInterval,
            weekdays: weekdays,
            endsAt: editRecurrenceHasEnd ? editRecurrenceEndsAt : nil
        )
    }

    private var normalizedRecurrenceWeekdays: [String] {
        let selected = editRecurrenceWeekdays.sorted { $0.sortOrder < $1.sortOrder }
        if !selected.isEmpty {
            return selected.map(\.rawValue)
        }
        let referenceDate = editHasDue ? editDueAt : Date()
        return [TaskWeekday.from(date: referenceDate).rawValue]
    }

    private func ensureWeeklyDefaultWeekday() {
        guard editRepeatsTask, editRecurrenceFrequency == .weekly, editRecurrenceWeekdays.isEmpty else { return }
        let referenceDate = editHasDue ? editDueAt : Date()
        editRecurrenceWeekdays = [TaskWeekday.from(date: referenceDate)]
    }

    private var hasSeriesEditableChanges: Bool {
        editTitle != task.title
        || editNotes != (task.notes ?? "")
        || editHasDue != (task.dueAt != nil)
        || (editHasDue && editDueAt != (task.dueAt ?? editDueAt))
        || editPriority != task.priority
        || editAssigneeId != task.assigneeId
        || editRecipientId != (task.recipientId ?? "")
        || recurrence != task.recurrence
    }

    private var shouldPromptForSeriesScope: Bool {
        task.recurrence != nil && hasSeriesEditableChanges && editStatus == task.status
    }

    // MARK: — Actions

    private func handleSaveTapped() {
        if shouldPromptForSeriesScope {
            showSeriesScopeDialog = true
            return
        }
        Task { await save() }
    }

    private func save(seriesScope: TaskSeriesScope = .occurrence) async {
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
                status:     editStatus,
                isAdmin:    isAdmin,
                assigneeId: editAssigneeId,
                recipientId: editRecipientId,
                recurrence: recurrence,
                seriesScope: seriesScope
            )
            task      = updated
            onUpdate(updated)
            dismiss()
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
