import Foundation

struct CareUser: Identifiable, Codable {
    let id: String
    let email: String
    let name: String
    let phone: String?
    var pushToken: String?
    var timezone: String?
    var memberships: [CircleMembership]?
}

struct AuthResult: Codable {
    let method: String
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
