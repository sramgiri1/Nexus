import Foundation

struct CareCircle: Identifiable, Codable {
    let id: String
    let name: String
    let recipientName: String
    let archiveAfterDays: Int
    var members: [CircleMember]?
    var recipients: [CareRecipient]?
    var tasks: [CareTask]?

    init(id: String, name: String, recipientName: String, archiveAfterDays: Int = 7, members: [CircleMember]? = nil, recipients: [CareRecipient]? = nil, tasks: [CareTask]? = nil) {
        self.id = id
        self.name = name
        self.recipientName = recipientName
        self.archiveAfterDays = archiveAfterDays
        self.members = members
        self.recipients = recipients
        self.tasks = tasks
    }

    var orderedRecipients: [CareRecipient] {
        (recipients ?? []).sorted { lhs, rhs in
            if lhs.isPrimary != rhs.isPrimary { return lhs.isPrimary && !rhs.isPrimary }
            if lhs.sortOrder != rhs.sortOrder { return lhs.sortOrder < rhs.sortOrder }
            return lhs.name.localizedCaseInsensitiveCompare(rhs.name) == .orderedAscending
        }
    }

    var primaryRecipient: CareRecipient? {
        orderedRecipients.first
    }

    var recipientDisplaySummary: String {
        let names = recipientNames
        switch names.count {
        case 0:
            return recipientName
        case 1:
            return names[0]
        case 2:
            return "\(names[0]) and \(names[1])"
        default:
            return "\(names[0]) + \(names.count - 1) more"
        }
    }

    var recipientNames: [String] {
        let explicit = orderedRecipients
            .map(\.name)
            .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        return explicit.isEmpty ? [recipientName] : explicit
    }
}

struct CareRecipient: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let relationship: String?
    let notes: String?
    let isPrimary: Bool
    let sortOrder: Int

    init(
        id: String,
        name: String,
        relationship: String? = nil,
        notes: String? = nil,
        isPrimary: Bool = false,
        sortOrder: Int = 0
    ) {
        self.id = id
        self.name = name
        self.relationship = relationship
        self.notes = notes
        self.isPrimary = isPrimary
        self.sortOrder = sortOrder
    }
}

struct CircleMember: Identifiable, Codable {
    let id: String
    let role: MemberRole
    let userId: String
    var user: CareUser?
}

enum MemberRole: String, Codable, CaseIterable {
    case admin  = "ADMIN"
    case member = "MEMBER"
}
