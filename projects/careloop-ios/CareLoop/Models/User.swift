import Foundation

struct CareUser: Identifiable, Codable {
    let id: String
    let email: String
    let name: String
    let phone: String?
    var memberships: [CircleMembership]?
}

struct CircleMembership: Identifiable, Codable {
    let id: String
    let circleId: String
    let role: MemberRole
    var circle: CareCircle?
}
