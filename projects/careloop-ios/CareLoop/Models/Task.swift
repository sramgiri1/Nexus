import Foundation

struct CareTask: Identifiable, Codable {
    let id: String
    let title: String
    let notes: String?
    let dueAt: Date?
    var status: TaskStatus
    let priority: TaskPriority
    let circleId: String
    let creatorId: String
    let assigneeId: String?
    var assignee: CareUser?

    var isOverdue: Bool {
        guard let due = dueAt else { return false }
        return due < Date() && status == .pending
    }
}

enum TaskStatus: String, Codable {
    case pending    = "PENDING"
    case inProgress = "IN_PROGRESS"
    case done       = "DONE"
    case skipped    = "SKIPPED"

    var label: String {
        switch self {
        case .pending:    return "Pending"
        case .inProgress: return "In Progress"
        case .done:       return "Done"
        case .skipped:    return "Skipped"
        }
    }
}

enum TaskPriority: String, Codable, CaseIterable {
    case low    = "LOW"
    case normal = "NORMAL"
    case high   = "HIGH"
    case urgent = "URGENT"

    var label: String { rawValue.capitalized }
}
