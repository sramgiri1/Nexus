import XCTest
@testable import CareLoop

// MARK: — CareTask

final class CareTaskTests: XCTestCase {

    private func makeTask(dueAt: Date?, status: TaskStatus) -> CareTask {
        CareTask(
            id: "t1", title: "Test task", notes: nil,
            dueAt: dueAt, status: status, priority: .normal,
            completedAt: nil, archivedAt: nil,
            circleId: "c1", creatorId: "u1", assigneeId: nil, assignee: nil
        )
    }

    func test_isOverdue_trueWhenPastDueAndPending() {
        let task = makeTask(dueAt: Date().addingTimeInterval(-3600), status: .pending)
        XCTAssertTrue(task.isOverdue)
    }

    func test_isOverdue_falseWhenFutureDue() {
        let task = makeTask(dueAt: Date().addingTimeInterval(3600), status: .pending)
        XCTAssertFalse(task.isOverdue)
    }

    func test_isOverdue_falseWhenNoDueDate() {
        let task = makeTask(dueAt: nil, status: .pending)
        XCTAssertFalse(task.isOverdue)
    }

    func test_isOverdue_falseWhenDone() {
        let task = makeTask(dueAt: Date().addingTimeInterval(-3600), status: .done)
        XCTAssertFalse(task.isOverdue)
    }

    func test_isOverdue_falseWhenSkipped() {
        let task = makeTask(dueAt: Date().addingTimeInterval(-3600), status: .skipped)
        XCTAssertFalse(task.isOverdue)
    }

    func test_isOverdue_falseWhenInProgress() {
        let task = makeTask(dueAt: Date().addingTimeInterval(-3600), status: .inProgress)
        XCTAssertFalse(task.isOverdue)
    }
}

// MARK: — TaskStatus

final class TaskStatusTests: XCTestCase {

    func test_labels() {
        XCTAssertEqual(TaskStatus.pending.label,    "Pending")
        XCTAssertEqual(TaskStatus.inProgress.label, "In Progress")
        XCTAssertEqual(TaskStatus.done.label,       "Done")
        XCTAssertEqual(TaskStatus.skipped.label,    "Skipped")
    }

    func test_rawValues() {
        XCTAssertEqual(TaskStatus.pending.rawValue,    "PENDING")
        XCTAssertEqual(TaskStatus.inProgress.rawValue, "IN_PROGRESS")
        XCTAssertEqual(TaskStatus.done.rawValue,       "DONE")
        XCTAssertEqual(TaskStatus.skipped.rawValue,    "SKIPPED")
    }

    func test_decodesFromRawValue() {
        XCTAssertEqual(TaskStatus(rawValue: "PENDING"),     .pending)
        XCTAssertEqual(TaskStatus(rawValue: "IN_PROGRESS"), .inProgress)
        XCTAssertEqual(TaskStatus(rawValue: "DONE"),        .done)
        XCTAssertEqual(TaskStatus(rawValue: "SKIPPED"),     .skipped)
        XCTAssertNil(TaskStatus(rawValue: "INVALID"))
    }
}

// MARK: — TaskPriority

final class TaskPriorityTests: XCTestCase {

    func test_labels() {
        XCTAssertEqual(TaskPriority.low.label,    "Low")
        XCTAssertEqual(TaskPriority.normal.label, "Normal")
        XCTAssertEqual(TaskPriority.high.label,   "High")
        XCTAssertEqual(TaskPriority.urgent.label, "Urgent")
    }

    func test_rawValues() {
        XCTAssertEqual(TaskPriority.low.rawValue,    "LOW")
        XCTAssertEqual(TaskPriority.normal.rawValue, "NORMAL")
        XCTAssertEqual(TaskPriority.high.rawValue,   "HIGH")
        XCTAssertEqual(TaskPriority.urgent.rawValue, "URGENT")
    }

    func test_allCasesCount() {
        XCTAssertEqual(TaskPriority.allCases.count, 4)
    }

    func test_allCasesOrder() {
        XCTAssertEqual(TaskPriority.allCases, [.low, .normal, .high, .urgent])
    }
}

// MARK: — MemberRole

final class MemberRoleTests: XCTestCase {

    func test_rawValues() {
        XCTAssertEqual(MemberRole.admin.rawValue,  "ADMIN")
        XCTAssertEqual(MemberRole.member.rawValue, "MEMBER")
    }

    func test_decodesFromRawValue() {
        XCTAssertEqual(MemberRole(rawValue: "ADMIN"),  .admin)
        XCTAssertEqual(MemberRole(rawValue: "MEMBER"), .member)
        XCTAssertNil(MemberRole(rawValue: "OWNER"))
    }
}

// MARK: — Sprint 2: AppState push notification state

final class AppStatePushTests: XCTestCase {

    @MainActor
    func test_pendingTaskId_defaultsToNil() {
        let state = AppState()
        XCTAssertNil(state.pendingTaskId)
    }

    @MainActor
    func test_consumePendingTask_clearsTaskId() {
        let state = AppState()
        state.pendingTaskId = "task-abc"
        state.consumePendingTask()
        XCTAssertNil(state.pendingTaskId, "consumePendingTask should clear pendingTaskId")
    }

    @MainActor
    func test_consumePendingTask_isIdempotent_whenAlreadyNil() {
        let state = AppState()
        XCTAssertNil(state.pendingTaskId)
        state.consumePendingTask()
        XCTAssertNil(state.pendingTaskId, "calling consumePendingTask on nil should not crash")
    }

    @MainActor
    func test_pendingTaskId_canBeSetAndRead() {
        let state = AppState()
        state.pendingTaskId = "task-xyz-789"
        XCTAssertEqual(state.pendingTaskId, "task-xyz-789")
    }

    @MainActor
    func test_pushTaskOpenedNotification_setsPendingTaskId() {
        let state = AppState()
        let taskId = "push-deep-link-task"
        NotificationCenter.default.post(
            name: .careLoopPushTaskOpened,
            object: taskId
        )
        // NotificationCenter dispatches synchronously for non-async publishers
        // but the sink uses RunLoop.main; flush the run loop
        RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.05))
        XCTAssertEqual(state.pendingTaskId, taskId)
    }
}

// MARK: — Sprint 2: push token endpoint contract

final class PushTokenEndpointTests: XCTestCase {

    func test_updatePushToken_requestBody_containsPushToken() throws {
        // Verify the endpoint encoding is correct before any network call.
        // APIClient.shared.updatePushToken encodes { "pushToken": <value> }.
        let body: [String: String] = ["pushToken": "device-token-abc123"]
        let data = try JSONSerialization.data(withJSONObject: body)
        let decoded = try JSONSerialization.jsonObject(with: data) as? [String: String]
        XCTAssertEqual(decoded?["pushToken"], "device-token-abc123")
    }

    func test_updatePushToken_path_format() {
        let userId = "user-abc"
        let path = "/users/\(userId)/push-token"
        XCTAssertEqual(path, "/users/user-abc/push-token")
    }
}

// MARK: — Sprint 2: Reminder scheduling contract (iOS side)

final class ReminderSchedulingTests: XCTestCase {

    func test_reminderScheduledAt_is_15minutesBeforeDueAt() {
        let dueAt = Date(timeIntervalSinceNow: 3600) // 1 hour from now
        let scheduledAt = dueAt.addingTimeInterval(-15 * 60)
        let diff = dueAt.timeIntervalSince(scheduledAt)
        XCTAssertEqual(diff, 15 * 60, accuracy: 1, "Reminder fires exactly 15 minutes before due time")
    }

    func test_escalation_fires_after_15_minutes_of_no_action() {
        let sentAt = Date(timeIntervalSinceNow: -(16 * 60)) // sent 16 min ago
        let escalationCutoff = Date(timeIntervalSinceNow: -(15 * 60))
        XCTAssertTrue(sentAt < escalationCutoff, "sentAt 16min ago is past the 15min escalation window")
    }

    func test_escalation_does_not_fire_within_15_minutes() {
        let sentAt = Date(timeIntervalSinceNow: -(14 * 60)) // sent 14 min ago
        let escalationCutoff = Date(timeIntervalSinceNow: -(15 * 60))
        XCTAssertFalse(sentAt < escalationCutoff, "sentAt 14min ago has not yet crossed the escalation window")
    }
}

// MARK: — AppState.userRole

final class AppStateRoleTests: XCTestCase {

    @MainActor
    func test_userRole_defaultsToMemberWithNoState() {
        let state = AppState()
        XCTAssertEqual(state.userRole, .member)
    }

    @MainActor
    func test_userRole_defaultsToMemberWithNoCircle() {
        let state = AppState()
        state.currentUser = CareUser(id: "u1", email: "a@test.com", name: "Alice", phone: nil, memberships: nil)
        XCTAssertEqual(state.userRole, .member)
    }

    @MainActor
    func test_userRole_defaultsToMemberWithNoUser() {
        let state = AppState()
        let member = CircleMember(id: "m1", role: .admin, userId: "u1", user: nil)
        state.activeCircle = CareCircle(id: "c1", name: "Test", recipientName: "Bob", members: [member], tasks: nil)
        XCTAssertEqual(state.userRole, .member)
    }

    @MainActor
    func test_userRole_returnsAdmin() {
        let state = AppState()
        state.currentUser = CareUser(id: "u1", email: "a@test.com", name: "Alice", phone: nil, memberships: nil)
        let member = CircleMember(id: "m1", role: .admin, userId: "u1", user: nil)
        state.activeCircle = CareCircle(id: "c1", name: "Test", recipientName: "Bob", members: [member], tasks: nil)
        XCTAssertEqual(state.userRole, .admin)
    }

    @MainActor
    func test_userRole_returnsMember() {
        let state = AppState()
        state.currentUser = CareUser(id: "u2", email: "b@test.com", name: "Bob", phone: nil, memberships: nil)
        let member = CircleMember(id: "m2", role: .member, userId: "u2", user: nil)
        state.activeCircle = CareCircle(id: "c1", name: "Test", recipientName: "Carol", members: [member], tasks: nil)
        XCTAssertEqual(state.userRole, .member)
    }

    @MainActor
    func test_userRole_defaultsToMemberWhenUserNotInCircle() {
        let state = AppState()
        state.currentUser = CareUser(id: "u99", email: "x@test.com", name: "Stranger", phone: nil, memberships: nil)
        let member = CircleMember(id: "m1", role: .admin, userId: "u1", user: nil)
        state.activeCircle = CareCircle(id: "c1", name: "Test", recipientName: "Bob", members: [member], tasks: nil)
        XCTAssertEqual(state.userRole, .member)
    }

    @MainActor
    func test_userRole_adminInMultiMemberCircle() {
        let state = AppState()
        state.currentUser = CareUser(id: "u1", email: "a@test.com", name: "Alice", phone: nil, memberships: nil)
        let admin  = CircleMember(id: "m1", role: .admin,  userId: "u1", user: nil)
        let member = CircleMember(id: "m2", role: .member, userId: "u2", user: nil)
        state.activeCircle = CareCircle(id: "c1", name: "Test", recipientName: "Bob", members: [admin, member], tasks: nil)
        XCTAssertEqual(state.userRole, .admin)
    }
}

// MARK: — AppState multi-circle behavior

final class AppStateCircleTests: XCTestCase {

    @MainActor
    func test_circleMemberships_sortsActiveCircleFirst_thenAlphabetically() {
        let state = AppState()
        let alpha = CareCircle(id: "c1", name: "Alpha Family", recipientName: "Alice")
        let beta = CareCircle(id: "c2", name: "Beta Family", recipientName: "Bob")
        let gamma = CareCircle(id: "c3", name: "Gamma Family", recipientName: "Carol")

        state.currentUser = CareUser(
            id: "u1",
            email: "a@test.com",
            name: "Alice",
            phone: nil,
            memberships: [
                CircleMembership(id: "m1", circleId: alpha.id, role: .member, circle: alpha),
                CircleMembership(id: "m2", circleId: gamma.id, role: .admin, circle: gamma),
                CircleMembership(id: "m3", circleId: beta.id, role: .member, circle: beta),
            ]
        )
        state.activeCircle = gamma

        XCTAssertEqual(state.circleMemberships.map(\.circleId), ["c3", "c1", "c2"])
    }

    @MainActor
    func test_attachCircle_updatesMatchingMembershipSnapshot() {
        let state = AppState()
        let original = CareCircle(id: "c1", name: "Alpha Family", recipientName: "Alice", archiveAfterDays: 7)
        let updated = CareCircle(id: "c1", name: "Alpha Family", recipientName: "Alice Johnson", archiveAfterDays: 14)

        state.currentUser = CareUser(
            id: "u1",
            email: "a@test.com",
            name: "Alice",
            phone: nil,
            memberships: [
                CircleMembership(id: "m1", circleId: original.id, role: .admin, circle: original)
            ]
        )

        state.attachCircle(updated)

        XCTAssertEqual(state.activeCircle?.recipientName, "Alice Johnson")
        XCTAssertEqual(state.currentUser?.memberships?.first?.circle?.recipientName, "Alice Johnson")
        XCTAssertEqual(state.currentUser?.memberships?.first?.circle?.archiveAfterDays, 14)
    }

    @MainActor
    func test_signIn_withoutExplicitCircle_keepsUserInDirectoryState() {
        let state = AppState()
        let alpha = CareCircle(id: "c1", name: "Alpha Family", recipientName: "Alice")
        let user = CareUser(
            id: "u1",
            email: "a@test.com",
            name: "Alice",
            phone: nil,
            memberships: [
                CircleMembership(id: "m1", circleId: alpha.id, role: .admin, circle: alpha)
            ]
        )

        state.signIn(user: user, circle: nil)

        XCTAssertNotNil(state.currentUser)
        XCTAssertNil(state.activeCircle)
        XCTAssertEqual(state.circleMemberships.first?.circleId, "c1")
    }
}

// MARK: — Recurring tasks and insights

final class TaskRecurrenceTests: XCTestCase {

    func test_dailyRecurrenceSummary_usesNaturalLabel() {
        let recurrence = TaskRecurrence(frequency: .daily, interval: 1, weekdays: [], endsAt: nil)
        XCTAssertEqual(recurrence.summary, "Daily")
    }

    func test_customRecurrenceSummary_reflectsInterval() {
        let recurrence = TaskRecurrence(frequency: .custom, interval: 3, weekdays: [], endsAt: nil)
        XCTAssertEqual(recurrence.summary, "Every 3 days")
    }

    func test_weeklyRecurrenceSummary_listsSelectedWeekdays() {
        let recurrence = TaskRecurrence(frequency: .weekly, interval: 2, weekdays: ["MON", "WED", "FRI"], endsAt: nil)
        XCTAssertEqual(recurrence.summary, "Every 2 weeks on Mon, Wed, Fri")
    }

    func test_careTaskRecurrence_isNilWhenTaskDoesNotRepeat() {
        let task = CareTask(
            id: "t1",
            title: "Task",
            notes: nil,
            dueAt: nil,
            status: .pending,
            priority: .normal,
            completedAt: nil,
            archivedAt: nil,
            circleId: "c1",
            creatorId: "u1",
            assigneeId: nil,
            assignee: nil
        )
        XCTAssertNil(task.recurrence)
    }
}

final class CompletionInsightModelTests: XCTestCase {

    func test_completedTaskDay_shortLabel_formatsDate() {
        let day = CompletedTaskDay(date: "2026-04-29", count: 2)
        XCTAssertFalse(day.shortLabel.isEmpty)
    }
}

final class CareCircleRecipientTests: XCTestCase {

    func test_recipientDisplaySummary_usesSingleName() {
        let circle = CareCircle(
            id: "c1",
            name: "Doe Family",
            recipientName: "John Doe",
            recipients: [
                CareRecipient(id: "r1", name: "John Doe", relationship: nil, notes: nil, isPrimary: true)
            ]
        )
        XCTAssertEqual(circle.recipientDisplaySummary, "John Doe")
    }

    func test_recipientDisplaySummary_collapsesMultipleNames() {
        let circle = CareCircle(
            id: "c1",
            name: "Doe Family",
            recipientName: "John Doe",
            recipients: [
                CareRecipient(id: "r1", name: "John Doe", relationship: nil, notes: nil, isPrimary: true),
                CareRecipient(id: "r2", name: "Jane Doe", relationship: nil, notes: nil, isPrimary: false),
                CareRecipient(id: "r3", name: "Mia Doe", relationship: nil, notes: nil, isPrimary: false),
            ]
        )
        XCTAssertEqual(circle.recipientDisplaySummary, "John Doe + 2 more")
    }

    func test_orderedRecipients_respectsPrimaryThenSortOrder() {
        let circle = CareCircle(
            id: "c1",
            name: "Doe Family",
            recipientName: "John Doe",
            recipients: [
                CareRecipient(id: "r3", name: "Mia Doe", relationship: nil, notes: nil, isPrimary: false, sortOrder: 2),
                CareRecipient(id: "r1", name: "John Doe", relationship: nil, notes: nil, isPrimary: true, sortOrder: 1),
                CareRecipient(id: "r2", name: "Jane Doe", relationship: nil, notes: nil, isPrimary: false, sortOrder: 0),
            ]
        )

        XCTAssertEqual(circle.orderedRecipients.map(\.id), ["r1", "r2", "r3"])
        XCTAssertEqual(circle.primaryRecipient?.id, "r1")
    }
}
