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
        case 0:  return ""
        case 1:  return names[0]
        case 2:  return "\(names[0]) and \(names[1])"
        default: return "\(names[0]) + \(names.count - 1) more"
        }
    }

    var recipientNames: [String] {
        let explicit = orderedRecipients
            .map(\.name)
            .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        if !explicit.isEmpty { return explicit }
        let fallback = recipientName.trimmingCharacters(in: .whitespacesAndNewlines)
        return fallback.isEmpty ? [] : [fallback]
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
    case admin     = "ADMIN"
    case member    = "MEMBER"
    case recipient = "RECIPIENT"

    var displayLabel: String {
        switch self {
        case .admin:     return "Admin"
        case .member:    return "Member"
        case .recipient: return "Recipient"
        }
    }
}

struct CircleEvent: Identifiable, Codable {
    let id: String
    let type: CircleEventType
    let createdAt: Date
    let actorId: String?
    let actor: EventActor?

    var actorFirstName: String {
        guard let name = actor?.name else { return "Someone" }
        return name.split(separator: " ").first.map(String.init) ?? name
    }

    var feedDescription: String {
        let who = actorFirstName
        switch type {
        case .circleCreated:        return "\(who) created this circle"
        case .taskCreated:          return "\(who) added a task"
        case .taskSeriesCreated:    return "\(who) added a recurring task"
        case .taskCompleted:        return "\(who) completed a task"
        case .taskUpdated:          return "\(who) updated a task"
        case .taskDeleted:          return "\(who) deleted a task"
        case .inviteCreated:        return "\(who) sent an invitation"
        case .inviteAccepted:       return "\(who) joined the circle"
        case .inviteDeclined:       return "\(who) declined an invitation"
        case .inviteRevoked:        return "\(who) revoked an invitation"
        case .recipientAdded:       return "\(who) added a care receiver"
        case .recipientUpdated:     return "\(who) updated care receiver info"
        case .recipientRemoved:     return "\(who) removed a care receiver"
        case .memberJoined:         return "\(who) joined via circle code"
        case .memberRemoved:        return "\(who) removed a member"
        case .memberRoleUpdated:    return "\(who) updated a member's role"
        case .reminderSent,
             .reminderEscalated,
             .digestSent,
             .digestOpened,
             .appSession,
             .unknown:              return ""
        }
    }

    var isVisible: Bool { !feedDescription.isEmpty }

    var feedIcon: String {
        switch type {
        case .taskCreated, .taskSeriesCreated:  return "plus.circle.fill"
        case .taskCompleted:                    return "checkmark.circle.fill"
        case .taskUpdated:                      return "pencil.circle.fill"
        case .taskDeleted:                      return "trash.circle.fill"
        case .inviteCreated, .inviteAccepted,
             .inviteDeclined, .inviteRevoked,
             .memberJoined, .memberRemoved,
             .memberRoleUpdated:                return "person.circle.fill"
        case .recipientAdded, .recipientUpdated,
             .recipientRemoved:                 return "heart.circle.fill"
        case .circleCreated:                    return "star.circle.fill"
        default:                                return "circle.fill"
        }
    }

    var feedIconColor: (red: Double, green: Double, blue: Double) {
        switch type {
        case .taskCompleted:                    return (0.12, 0.68, 0.49)
        case .taskDeleted:                      return (0.85, 0.30, 0.30)
        case .taskCreated, .taskSeriesCreated,
             .taskUpdated:                      return (0.13, 0.56, 0.87)
        case .inviteAccepted, .memberJoined:    return (0.16, 0.80, 0.72)
        case .recipientAdded, .recipientUpdated,
             .recipientRemoved:                 return (0.85, 0.30, 0.50)
        default:                                return (0.43, 0.50, 0.60)
        }
    }
}

struct EventActor: Codable {
    let id: String
    let name: String
}

enum CircleEventType: String, Codable {
    case circleCreated       = "CIRCLE_CREATED"
    case inviteCreated       = "INVITE_CREATED"
    case inviteAccepted      = "INVITE_ACCEPTED"
    case inviteDeclined      = "INVITE_DECLINED"
    case inviteRevoked       = "INVITE_REVOKED"
    case recipientAdded      = "RECIPIENT_ADDED"
    case recipientUpdated    = "RECIPIENT_UPDATED"
    case recipientRemoved    = "RECIPIENT_REMOVED"
    case taskCreated         = "TASK_CREATED"
    case taskSeriesCreated   = "TASK_SERIES_CREATED"
    case taskUpdated         = "TASK_UPDATED"
    case taskCompleted       = "TASK_COMPLETED"
    case taskDeleted         = "TASK_DELETED"
    case memberJoined        = "MEMBER_JOINED"
    case memberRemoved       = "MEMBER_REMOVED"
    case memberRoleUpdated   = "MEMBER_ROLE_UPDATED"
    case reminderSent        = "REMINDER_SENT"
    case reminderEscalated   = "REMINDER_ESCALATED"
    case digestSent          = "DIGEST_SENT"
    case digestOpened        = "DIGEST_OPENED"
    case appSession          = "APP_SESSION"
    case unknown = "__unknown__"

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = CircleEventType(rawValue: raw) ?? .unknown
    }
}
