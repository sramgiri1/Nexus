import SwiftUI

struct NewTaskView: View {
    let circleId:  String
    let creatorId: String
    let members:   [CircleMember]
    let isAdmin:   Bool
    let onCreated: (CareTask) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var title      = ""
    @State private var notes      = ""
    @State private var dueAt      = Date().addingTimeInterval(3600)
    @State private var hasDue     = false
    @State private var priority   = TaskPriority.normal
    @State private var assigneeId: String?
    @State private var loading    = false
    @State private var error:     String?

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
                Section("Due date") {
                    Toggle("Set due date", isOn: $hasDue)
                    if hasDue {
                        DatePicker("Due", selection: $dueAt, displayedComponents: [.date, .hourAndMinute])
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
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") { Task { await save() } }
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || loading)
                }
            }
        }
        .careLoopBrandBanner()
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
                assigneeId: isAdmin ? assigneeId : nil
            )
            onCreated(createdTask)
            dismiss()
        } catch { self.error = error.localizedDescription }
        loading = false
    }
}
