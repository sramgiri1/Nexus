import Foundation

// MARK: — Circles
extension APIClient {
    func fetchCircle(id: String) async throws -> CareCircle {
        try await get("/circles/\(id)")
    }

    func createCircle(name: String, recipientName: String) async throws -> CareCircle {
        try await post("/circles", body: ["name": name, "recipientName": recipientName])
    }

    func addMember(circleId: String, userId: String, role: MemberRole = .member) async throws -> CircleMember {
        try await post("/circles/\(circleId)/members", body: ["userId": userId, "role": role.rawValue])
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

    func updateTaskStatus(circleId: String, taskId: String, status: TaskStatus) async throws -> CareTask {
        try await patch("/circles/\(circleId)/tasks/\(taskId)", body: ["status": status.rawValue])
    }
}

// MARK: — Users
extension APIClient {
    func createUser(email: String, name: String, phone: String?) async throws -> CareUser {
        try await post("/users", body: ["email": email, "name": name, "phone": phone as Any])
    }

    func fetchUser(id: String) async throws -> CareUser {
        try await get("/users/\(id)")
    }
}
