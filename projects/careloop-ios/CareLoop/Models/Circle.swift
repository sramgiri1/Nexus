import Foundation

struct CareCircle: Identifiable, Codable {
    let id: String
    let name: String
    let recipientName: String
    var members: [CircleMember]?
    var tasks: [CareTask]?
}

struct CircleMember: Identifiable, Codable {
    let id: String
    let role: MemberRole
    let userId: String
    var user: CareUser?
}

enum MemberRole: String, Codable {
    case admin  = "ADMIN"
    case member = "MEMBER"
}
