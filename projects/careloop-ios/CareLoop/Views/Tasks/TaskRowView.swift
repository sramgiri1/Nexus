import SwiftUI

struct TaskRowView: View {
    let task: CareTask
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onToggle) {
                Image(systemName: task.status == .done ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundColor(task.status == .done ? .green : .secondary)
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 2) {
                Text(task.title)
                    .strikethrough(task.status == .done)
                    .foregroundColor(task.status == .done ? .secondary : .primary)
                if let recipient = task.recipient?.name {
                    Text(recipient)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                if let due = task.dueAt {
                    Text(due, style: .relative)
                        .font(.caption)
                        .foregroundColor(task.isOverdue ? .red : .secondary)
                }
                if let recurrence = task.recurrence {
                    Text(recurrence.summary)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            priorityBadge
        }
        .padding(.vertical, 4)
    }

    @ViewBuilder
    private var priorityBadge: some View {
        if task.priority == .urgent || task.priority == .high {
            Text(task.priority.label)
                .font(.caption2.bold())
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(task.priority == .urgent ? Color.red.opacity(0.15) : Color.orange.opacity(0.15))
                .foregroundColor(task.priority == .urgent ? .red : .orange)
                .cornerRadius(4)
        }
    }
}
