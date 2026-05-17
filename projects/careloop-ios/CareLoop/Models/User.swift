import Foundation

struct CareUser: Identifiable, Codable {
    let id: String
    let email: String
    let name: String
    let phone: String?
    var pushToken: String?
    var timezone: String?
    var notifAssignments: Bool?
    var notifEscalations: Bool?
    var notifDigest: Bool?
    var memberships: [CircleMembership]?
    var pendingInvites: [GroupInvitation]?
}

struct AuthResult: Codable {
    let method: String
    let accessToken: String
    let user: CareUser
}

struct ForgotPasswordRequestResult: Codable {
    let sent: Bool
    let expiresInMinutes: Int
    let debugCode: String?
}

struct ForgotPasswordVerifyResult: Codable {
    let verified: Bool
}

struct ForgotPasswordResetResult: Codable {
    let reset: Bool
}

struct CircleMembership: Identifiable, Codable {
    let id: String
    let circleId: String
    let role: MemberRole
    var circle: CareCircle?
}

struct InvitationSender: Identifiable, Codable {
    let id: String
    let name: String
    let email: String
}

struct GroupInvitation: Identifiable, Codable {
    let id: String
    let email: String
    let name: String
    let role: MemberRole
    let status: InvitationStatus
    let expiresAt: Date?
    let circle: CareCircle
    let recipient: CareRecipient?
    let invitedBy: InvitationSender?
}

extension GroupInvitation {
    var expirationSummary: String? {
        guard let expiresAt else { return nil }
        if status == .expired || Date() >= expiresAt {
            return "Expired"
        }
        return "Expires \(expiresAt.formatted(.dateTime.month().day().year()))"
    }
}

enum InvitationStatus: String, Codable {
    case pending = "PENDING"
    case accepted = "ACCEPTED"
    case declined = "DECLINED"
    case revoked = "REVOKED"
    case expired = "EXPIRED"
}
