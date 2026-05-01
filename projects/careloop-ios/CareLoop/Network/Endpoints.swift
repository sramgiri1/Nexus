import Foundation

// MARK: — Circles
extension APIClient {
    func fetchCircle(id: String) async throws -> CareCircle {
        try await get("/circles/\(id)")
    }

    func createCircle(name: String, recipientName: String, creatorId: String, archiveAfterDays: Int = 7) async throws -> CareCircle {
        try await postAny("/circles", body: [
            "name": name,
            "recipientName": recipientName,
            "creatorId": creatorId,
            "archiveAfterDays": archiveAfterDays
        ])
    }

    func fetchRecipients(circleId: String, userId: String) async throws -> [CareRecipient] {
        try await get("/circles/\(circleId)/recipients?userId=\(userId)")
    }

    func createRecipient(circleId: String, userId: String, name: String, relationship: String?, notes: String? = nil) async throws -> CareRecipient {
        var body: [String: Any] = [
            "userId": userId,
            "name": name
        ]
        if let relationship { body["relationship"] = relationship }
        if let notes { body["notes"] = notes }
        return try await postAny("/circles/\(circleId)/recipients", body: body)
    }

    func updateRecipient(
        circleId: String,
        recipientId: String,
        userId: String,
        name: String,
        relationship: String?,
        notes: String? = nil,
        isPrimary: Bool? = nil
    ) async throws -> CareRecipient {
        var body: [String: Any] = [
            "userId": userId,
            "name": name
        ]
        body["relationship"] = relationship.map { $0 as Any } ?? NSNull()
        body["notes"] = notes.map { $0 as Any } ?? NSNull()
        if let isPrimary {
            body["isPrimary"] = isPrimary
        }
        return try await patchAny("/circles/\(circleId)/recipients/\(recipientId)", body: body)
    }

    func deleteRecipient(circleId: String, recipientId: String, userId: String) async throws {
        try await deleteVoid("/circles/\(circleId)/recipients/\(recipientId)", body: ["userId": userId])
    }

    func reorderRecipients(circleId: String, userId: String, recipientIds: [String], primaryRecipientId: String? = nil) async throws -> [CareRecipient] {
        var body: [String: Any] = [
            "userId": userId,
            "recipientIds": recipientIds,
        ]
        if let primaryRecipientId {
            body["primaryRecipientId"] = primaryRecipientId
        }
        return try await postAny("/circles/\(circleId)/recipients/reorder", body: body)
    }

    func addMember(circleId: String, userId: String) async throws -> CircleMember {
        try await post("/circles/\(circleId)/members", body: ["userId": userId])
    }

    func inviteMember(circleId: String, adminUserId: String, name: String, email: String, role: MemberRole, phone: String? = nil) async throws -> GroupInvitation {
        var body: [String: Any] = [
            "userId": adminUserId,
            "name": name,
            "email": email,
            "role": role.rawValue,
        ]
        if let phone { body["phone"] = phone }
        return try await postAny("/circles/\(circleId)/members/invite", body: body)
    }

    func fetchInvitations(circleId: String, adminUserId: String, status: InvitationStatus = .pending) async throws -> [GroupInvitation] {
        try await get("/circles/\(circleId)/invitations?userId=\(adminUserId)&status=\(status.rawValue)")
    }

    func revokeInvitation(circleId: String, invitationId: String, adminUserId: String) async throws {
        try await deleteVoid("/circles/\(circleId)/invitations/\(invitationId)", body: ["userId": adminUserId])
    }

    func acceptInvitation(invitationId: String, userId: String) async throws -> CircleMember {
        try await post("/invitations/\(invitationId)/accept", body: ["userId": userId])
    }

    func declineInvitation(invitationId: String, userId: String) async throws {
        _ = try await postAny("/invitations/\(invitationId)/decline", body: ["userId": userId]) as InvitationDeclineResult
    }

    func removeMember(circleId: String, memberId: String, adminUserId: String) async throws {
        try await deleteVoid("/circles/\(circleId)/members/\(memberId)", body: ["userId": adminUserId])
    }

    func updateMemberRole(circleId: String, memberId: String, adminUserId: String, role: MemberRole) async throws -> CircleMember {
        try await patch("/circles/\(circleId)/members/\(memberId)/role", body: ["userId": adminUserId, "role": role.rawValue])
    }
}

// MARK: — Tasks
extension APIClient {
    func fetchTasks(circleId: String) async throws -> [CareTask] {
        try await get("/circles/\(circleId)/tasks")
    }

    func createTask(circleId: String, title: String, notes: String?, dueAt: Date?,
                    priority: TaskPriority, creatorId: String, assigneeId: String?,
                    recipientId: String?,
                    recurrence: TaskRecurrence?) async throws -> CareTask {
        var body: [String: Any] = [
            "title": title,
            "priority": priority.rawValue,
            "creatorId": creatorId,
        ]
        body["notes"] = notes.map { $0 as Any } ?? NSNull()
        body["assigneeId"] = assigneeId.map { $0 as Any } ?? NSNull()
        body["recipientId"] = recipientId.map { $0 as Any } ?? NSNull()
        if let due = dueAt {
            body["dueAt"] = ISO8601DateFormatter().string(from: due)
        }
        body["recurrence"] = recurrencePayload(from: recurrence)
        return try await postAny("/circles/\(circleId)/tasks", body: body)
    }

    func updateTaskStatus(circleId: String, taskId: String, userId: String, status: TaskStatus) async throws -> CareTask {
        try await patch("/circles/\(circleId)/tasks/\(taskId)", body: ["userId": userId, "status": status.rawValue])
    }

    func updateTask(circleId: String, taskId: String, userId: String,
                    title: String, notes: String?, dueAt: Date?,
                    priority: TaskPriority, status: TaskStatus, isAdmin: Bool, assigneeId: String?,
                    recipientId: String?,
                    recurrence: TaskRecurrence?,
                    seriesScope: TaskSeriesScope = .occurrence) async throws -> CareTask {
        var body: [String: Any] = [
            "userId":   userId,
            "title":    title,
            "priority": priority.rawValue,
            "status":   status.rawValue,
            "seriesScope": seriesScope.rawValue,
        ]
        body["notes"] = notes.map { $0 as Any } ?? NSNull()
        body["dueAt"]  = dueAt.map { ISO8601DateFormatter().string(from: $0) as Any } ?? NSNull()
        body["recurrence"] = recurrencePayload(from: recurrence)
        body["recipientId"] = recipientId.map { $0 as Any } ?? NSNull()
        if isAdmin { body["assigneeId"] = assigneeId.map { $0 as Any } ?? NSNull() }
        return try await patchAny("/circles/\(circleId)/tasks/\(taskId)", body: body)
    }

    func deleteTask(circleId: String, taskId: String, userId: String) async throws {
        try await deleteVoid("/circles/\(circleId)/tasks/\(taskId)", body: ["userId": userId])
    }
}

private func recurrencePayload(from recurrence: TaskRecurrence?) -> [String: Any] {
    guard let recurrence else {
        return ["frequency": TaskRecurrenceFrequency.none.rawValue]
    }

    var payload: [String: Any] = [
        "frequency": recurrence.frequency.rawValue,
    ]
    if let interval = recurrence.interval {
        payload["interval"] = interval
    }
    if !recurrence.weekdays.isEmpty {
        payload["weekdays"] = recurrence.weekdays
    }
    if let endsAt = recurrence.endsAt {
        payload["endsAt"] = ISO8601DateFormatter().string(from: endsAt)
    }
    return payload
}

// MARK: — Circles (admin mutations)
extension APIClient {
    func updateCircle(id: String, userId: String, name: String?, recipientName: String?, archiveAfterDays: Int? = nil) async throws -> CareCircle {
        var body: [String: Any] = ["userId": userId]
        if let n = name          { body["name"]          = n }
        if let r = recipientName { body["recipientName"] = r }
        if let d = archiveAfterDays { body["archiveAfterDays"] = d }
        return try await patchAny("/circles/\(id)", body: body)
    }

    func fetchCompletionInsights(circleId: String, userId: String, days: Int = 7, recipientId: String? = nil) async throws -> CircleCompletionInsights {
        var path = "/circles/\(circleId)/insights/completion?userId=\(userId)&days=\(days)"
        if let recipientId, !recipientId.isEmpty {
            path += "&recipientId=\(recipientId)"
        }
        return try await get(path)
    }
}

// MARK: — Users
extension APIClient {
    func signUp(email: String, name: String, password: String, phone: String?) async throws -> AuthResult {
        try await post("/auth/signup", body: [
            "email": email,
            "name": name,
            "password": password,
            "phone": phone
        ])
    }

    func logIn(email: String, password: String) async throws -> AuthResult {
        try await post("/auth/login", body: [
            "email": email,
            "password": password
        ])
    }

    func socialAuth(
        provider: AuthProvider,
        idToken: String?,
        accessToken: String?,
        providerUserId: String?,
        email: String?,
        name: String?
    ) async throws -> AuthResult {
        try await post("/auth/social", body: [
            "provider": provider.apiValue,
            "idToken": idToken,
            "accessToken": accessToken,
            "providerUserId": providerUserId,
            "email": email,
            "name": name
        ])
    }

    func requestPasswordReset(email: String) async throws -> ForgotPasswordRequestResult {
        try await post("/auth/forgot-password/request", body: ["email": email])
    }

    func verifyPasswordResetCode(email: String, code: String) async throws -> ForgotPasswordVerifyResult {
        try await post("/auth/forgot-password/verify", body: ["email": email, "code": code])
    }

    func resetPassword(email: String, code: String, password: String) async throws -> ForgotPasswordResetResult {
        try await post("/auth/forgot-password/reset", body: [
            "email": email,
            "code": code,
            "password": password
        ])
    }

    func createUser(email: String, name: String, phone: String?) async throws -> CareUser {
        try await post("/users", body: ["email": email, "name": name, "phone": phone])
    }

    func fetchUser(id: String) async throws -> CareUser {
        try await get("/users/\(id)")
    }

    func fetchUserByEmail(_ email: String) async throws -> CareUser {
        let encoded = email.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? email
        return try await get("/users/by-email?email=\(encoded)")
    }

    func updateTimezone(userId: String, timezone: String) async throws -> CareUser {
        try await patch("/users/\(userId)/timezone", body: ["timezone": timezone])
    }

    func updatePushToken(userId: String, pushToken: String) async throws -> CareUser {
        try await patch("/users/\(userId)/push-token", body: ["pushToken": pushToken])
    }

    @discardableResult
    func logSession(userId: String, circleId: String) async throws -> LogResult {
        try await post("/users/\(userId)/session", body: ["circleId": circleId])
    }
}

struct LogResult: Decodable { let logged: Bool }
struct InvitationDeclineResult: Decodable { let declined: Bool }

enum TaskSeriesScope: String {
    case occurrence = "THIS_OCCURRENCE"
    case series = "SERIES"
}
