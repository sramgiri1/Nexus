import XCTest
@testable import CareLoop

// MARK: — CareTask

final class CareTaskTests: XCTestCase {

    private func makeTask(dueAt: Date?, status: TaskStatus) -> CareTask {
        CareTask(
            id: "t1", title: "Test task", notes: nil,
            dueAt: dueAt, status: status, priority: .normal,
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
