import SwiftUI

struct NewTaskView: View {
    let circleId:  String
    let creatorId: String
    let members:   [CircleMember]
    let recipients: [CareRecipient]
    let isAdmin:   Bool
    let onCreated: (CareTask) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var title      = ""
    @State private var notes      = ""
    @State private var dueAt      = Date().addingTimeInterval(3600)
    @State private var hasDue     = false
    @State private var priority   = TaskPriority.normal
    @State private var assigneeId: String?
    @State private var recipientId: String
    @State private var repeatsTask = false
    @State private var recurrenceFrequency = TaskRecurrenceFrequency.daily
    @State private var recurrenceInterval = 1
    @State private var recurrenceWeekdays = Set<TaskWeekday>()
    @State private var recurrenceHasEnd = false
    @State private var recurrenceEndsAt = Date().addingTimeInterval(60 * 60 * 24 * 30)
    @State private var loading    = false
    @State private var error:     String?

    init(circleId: String, creatorId: String, members: [CircleMember], recipients: [CareRecipient], isAdmin: Bool, onCreated: @escaping (CareTask) -> Void) {
        self.circleId = circleId
        self.creatorId = creatorId
        self.members = members
        self.recipients = recipients
        self.isAdmin = isAdmin
        self.onCreated = onCreated
        _recipientId = State(initialValue: recipients.first?.id ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Task") {
                    TextField("Title", text: $title)
                    TextField("Notes (optional)", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                    Text("Don't include medical details — use task titles like \"Doctor appointment\", not diagnoses.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Section("Care recipient") {
                    if recipients.isEmpty {
                        Text("Add a care recipient before creating tasks.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    } else if recipients.count == 1, let recipient = recipients.first {
                        LabeledContent("For", value: recipient.name)
                    } else {
                        Picker("For", selection: $recipientId) {
                            ForEach(recipients) { recipient in
                                Text(recipient.name).tag(recipient.id)
                            }
                        }
                    }
                }
                Section("Due date") {
                    Toggle("Set due date", isOn: $hasDue)
                    if hasDue {
                        DatePicker("Due", selection: $dueAt, displayedComponents: [.date, .hourAndMinute])
                    }
                }
                Section("Recurrence") {
                    Toggle("Repeat task", isOn: $repeatsTask)
                    if repeatsTask {
                        Picker("Repeats", selection: $recurrenceFrequency) {
                            Text(TaskRecurrenceFrequency.daily.label).tag(TaskRecurrenceFrequency.daily)
                            Text(TaskRecurrenceFrequency.weekly.label).tag(TaskRecurrenceFrequency.weekly)
                            Text(TaskRecurrenceFrequency.monthly.label).tag(TaskRecurrenceFrequency.monthly)
                            Text(TaskRecurrenceFrequency.custom.label).tag(TaskRecurrenceFrequency.custom)
                        }

                        if recurrenceFrequency == .weekly {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Days")
                                    .font(.subheadline.weight(.semibold))
                                TaskWeekdayPicker(selection: $recurrenceWeekdays)
                                Text("Choose the weekdays when this task should appear.")
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        Stepper(value: $recurrenceInterval, in: 1...30) {
                            Text(recurrenceIntervalLabel)
                        }

                        Toggle("Ends on a date", isOn: $recurrenceHasEnd)
                        if recurrenceHasEnd {
                            DatePicker("Ends", selection: $recurrenceEndsAt, displayedComponents: [.date])
                        }

                        Text("Recurring tasks require a due date. CareLoop will create the next occurrence automatically.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }
                Section("Priority") {
                    Picker("Priority", selection: $priority) {
                        ForEach(TaskPriority.allCases, id: \.self) { Text($0.label) }
                    }
                    .pickerStyle(.segmented)
                }
                if isAdmin && !members.isEmpty {
                    Section("Assign to") {
                        Picker("Assignee", selection: Binding(
                            get: { assigneeId ?? "" },
                            set: { assigneeId = $0.isEmpty ? nil : $0 }
                        )) {
                            Text("Unassigned").tag("")
                            ForEach(members) { m in
                                Text(m.user?.name ?? "Unknown").tag(m.userId)
                            }
                        }
                    }
                }
                if let error { Text(error).foregroundColor(.red).font(.caption) }
            }
            .navigationTitle("New Task")
            .navigationBarTitleDisplayMode(.inline)
            .scrollContentBackground(.hidden)
            .background(Color(red: 0.95, green: 0.96, blue: 0.99).ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") { Task { await save() } }
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || loading || (repeatsTask && !hasDue) || recipientId.isEmpty)
                }
            }
            .onChange(of: repeatsTask) { repeats in
                if repeats && !hasDue {
                    hasDue = true
                }
                ensureWeeklyDefaultWeekday()
            }
            .onChange(of: recurrenceFrequency) { _ in
                ensureWeeklyDefaultWeekday()
            }
            .onChange(of: dueAt) { _ in
                ensureWeeklyDefaultWeekday()
            }
        }
    }

    private var recurrenceIntervalLabel: String {
        switch recurrenceFrequency {
        case .daily:
            return recurrenceInterval == 1 ? "Every day" : "Every \(recurrenceInterval) days"
        case .weekly:
            return recurrenceInterval == 1 ? "Every week" : "Every \(recurrenceInterval) weeks"
        case .monthly:
            return recurrenceInterval == 1 ? "Every month" : "Every \(recurrenceInterval) months"
        case .custom:
            return "Every \(recurrenceInterval) days"
        case .none:
            return "Does not repeat"
        }
    }

    private var recurrence: TaskRecurrence? {
        guard repeatsTask else { return nil }
        let weekdays = recurrenceFrequency == .weekly ? normalizedRecurrenceWeekdays : []
        return TaskRecurrence(
            frequency: recurrenceFrequency,
            interval: recurrenceInterval,
            weekdays: weekdays,
            endsAt: recurrenceHasEnd ? recurrenceEndsAt : nil
        )
    }

    private var normalizedRecurrenceWeekdays: [String] {
        let selected = recurrenceWeekdays.sorted { $0.sortOrder < $1.sortOrder }
        if !selected.isEmpty {
            return selected.map(\.rawValue)
        }
        let referenceDate = hasDue ? dueAt : Date()
        return [TaskWeekday.from(date: referenceDate).rawValue]
    }

    private func ensureWeeklyDefaultWeekday() {
        guard repeatsTask, recurrenceFrequency == .weekly, recurrenceWeekdays.isEmpty else { return }
        let referenceDate = hasDue ? dueAt : Date()
        recurrenceWeekdays = [TaskWeekday.from(date: referenceDate)]
    }

    private func save() async {
        loading = true
        do {
            let createdTask = try await APIClient.shared.createTask(
                circleId:   circleId,
                title:      title.trimmingCharacters(in: .whitespaces),
                notes:      notes.isEmpty ? nil : notes,
                dueAt:      hasDue ? dueAt : nil,
                priority:   priority,
                creatorId:  creatorId,
                assigneeId: isAdmin ? assigneeId : nil,
                recipientId: recipientId,
                recurrence: recurrence
            )
            onCreated(createdTask)
            dismiss()
        } catch { self.error = error.localizedDescription }
        loading = false
    }
}
