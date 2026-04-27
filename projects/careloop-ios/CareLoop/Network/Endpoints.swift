import Foundation

// MARK: — Circles
extension APIClient {
    func fetchCircle(id: String) async throws -> CareCircle {
        try await get("/circles/\(id)")
    }

    func createCircle(name: String, recipientName: String, creatorId: String) async throws -> CareCircle {
        try await post("/circles", body: ["name": name, "recipientName": recipientName, "creatorId": creatorId])
    }

    func addMember(circleId: String, userId: String) async throws -> CircleMember {
        try await post("/circles/\(circleId)/members", body: ["userId": userId])
    }
}

// MARK: — Tasks
extension APIClient {
    func fetchTasks(circleId: String) async throws -> [CareTask] {
        try await get("/circles/\(circleId)/tasks")
    }

    func createTask(circleId: String, title: String, notes: String?, dueAt: Date?,
                    priority: TaskPriority, creatorId: String, assigneeId: String?) async throws -> CareTask {
        var body: [String: String?] = [
            "title": title, "notes": notes, "priority": priority.rawValue, "creatorId": creatorId,
        ]
        if let due = dueAt { body["dueAt"] = ISO8601DateFormatter().string(from: due) }
        body["assigneeId"] = assigneeId
        return try await post("/circles/\(circleId)/tasks", body: body)
    }

    func updateTaskStatus(circleId: String, taskId: String, userId: String, status: TaskStatus) async throws -> CareTask {
        try await patch("/circles/\(circleId)/tasks/\(taskId)", body: ["userId": userId, "status": status.rawValue])
    }

    func updateTask(circleId: String, taskId: String, userId: String,
                    title: String, notes: String?, dueAt: Date?,
                    priority: TaskPriority, isAdmin: Bool, assigneeId: String?) async throws -> CareTask {
        var body: [String: Any] = [
            "userId":   userId,
            "title":    title,
            "priority": priority.rawValue,
        ]
        body["notes"] = notes.map { $0 as Any } ?? NSNull()
        body["dueAt"]  = dueAt.map { ISO8601DateFormatter().string(from: $0) as Any } ?? NSNull()
        if isAdmin { body["assigneeId"] = assigneeId.map { $0 as Any } ?? NSNull() }
        return try await patchAny("/circles/\(circleId)/tasks/\(taskId)", body: body)
    }

    func deleteTask(circleId: String, taskId: String, userId: String) async throws {
        try await deleteVoid("/circles/\(circleId)/tasks/\(taskId)", body: ["userId": userId])
    }
}

// MARK: — Circles (admin mutations)
extension APIClient {
    func updateCircle(id: String, userId: String, name: String?, recipientName: String?) async throws -> CareCircle {
        var body: [String: Any] = ["userId": userId]
        if let n = name          { body["name"]          = n }
        if let r = recipientName { body["recipientName"] = r }
        return try await patchAny("/circles/\(id)", body: body)
    }
}

// MARK: — Users
extension APIClient {
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
