import Foundation

enum UITestScenario: String {
    case organizerHome = "organizer-home"
    case caregiverHome = "caregiver-home"
    case receiverHome = "receiver-home"

    private static let launchArgument = "-careloop-ui-scenario"

    static var current: UITestScenario? {
        parse(ProcessInfo.processInfo.arguments)
    }

    static func parse(_ arguments: [String]) -> UITestScenario? {
        guard let index = arguments.firstIndex(of: launchArgument),
              arguments.indices.contains(index + 1) else {
            return nil
        }
        return UITestScenario(rawValue: arguments[index + 1])
    }
}

extension AppState {
    convenience init(uiTestScenario scenario: UITestScenario) {
        self.init(shouldRestoreSession: false)

        let fixture = UITestScenarioFixture.make(scenario)
        currentUser = fixture.user
        activeCircle = fixture.circle
        uiTestInvitations = fixture.invitations
        uiTestRecipientAccessByMemberId = fixture.recipientAccessByMemberId
        shouldPromptNewTask = false
    }
}

private struct UITestScenarioFixture {
    let user: CareUser
    let circle: CareCircle
    let invitations: [GroupInvitation]
    let recipientAccessByMemberId: [String: [RecipientAccessSummary]]

    static func make(_ scenario: UITestScenario) -> UITestScenarioFixture {
        let organizer = CareUser(id: "u1", email: "organizer@careloop.test", name: "Olivia Organizer", phone: nil, memberships: nil)
        let caregiver = CareUser(id: "u2", email: "caregiver@careloop.test", name: "Carlos Caregiver", phone: nil, memberships: nil)
        let backupCaregiver = CareUser(id: "u3", email: "backup@careloop.test", name: "Bianca Backup", phone: nil, memberships: nil)
        let mom = CareUser(id: "u4", email: "mom@careloop.test", name: "Maya Receiver", phone: nil, memberships: nil)
        let dad = CareUser(id: "u5", email: "dad@careloop.test", name: "David Receiver", phone: nil, memberships: nil)

        let allMembers = [
            CircleMember(id: "m1", role: .admin, userId: organizer.id, user: organizer),
            CircleMember(id: "m2", role: .member, userId: caregiver.id, user: caregiver),
            CircleMember(id: "m3", role: .member, userId: backupCaregiver.id, user: backupCaregiver),
            CircleMember(id: "m4", role: .recipient, userId: mom.id, user: mom),
            CircleMember(id: "m5", role: .recipient, userId: dad.id, user: dad),
        ]

        let momRecipient = CareRecipient(
            id: "r1",
            name: "Maya",
            relationship: "Mom",
            notes: nil,
            isPrimary: true,
            sortOrder: 0,
            activationStatus: .active,
            receiverUserId: mom.id,
            eligibleAssigneeIds: [organizer.id, caregiver.id, backupCaregiver.id, mom.id]
        )
        let dadRecipient = CareRecipient(
            id: "r2",
            name: "David",
            relationship: "Dad",
            notes: nil,
            isPrimary: false,
            sortOrder: 1,
            activationStatus: .invited,
            receiverUserId: nil,
            eligibleAssigneeIds: [organizer.id, backupCaregiver.id]
        )

        let organizerTasks = [
            CareTask(
                id: "t1",
                title: "Morning medication",
                notes: "Blood pressure meds after breakfast.",
                dueAt: Date().addingTimeInterval(45 * 60),
                status: .pending,
                priority: .high,
                completedAt: nil,
                archivedAt: nil,
                circleId: "c1",
                recipientId: momRecipient.id,
                recipient: momRecipient,
                creatorId: organizer.id,
                assigneeId: mom.id,
                assignee: mom,
                capabilities: CareTaskCapabilities(canEdit: true, canDelete: true, canAssign: true, canChangeRecipient: true, canChangeStatus: true, canMarkDone: true, canSkip: true, canComment: true)
            ),
            CareTask(
                id: "t2",
                title: "Pick up prescriptions",
                notes: nil,
                dueAt: Date().addingTimeInterval(-30 * 60),
                status: .pending,
                priority: .urgent,
                completedAt: nil,
                archivedAt: nil,
                circleId: "c1",
                recipientId: momRecipient.id,
                recipient: momRecipient,
                creatorId: organizer.id,
                assigneeId: caregiver.id,
                assignee: caregiver,
                capabilities: CareTaskCapabilities(canEdit: true, canDelete: true, canAssign: true, canChangeRecipient: true, canChangeStatus: true, canMarkDone: true, canSkip: true, canComment: true)
            ),
            CareTask(
                id: "t3",
                title: "Evening walk check-in",
                notes: nil,
                dueAt: Date().addingTimeInterval(2 * 60 * 60),
                status: .pending,
                priority: .normal,
                completedAt: nil,
                archivedAt: nil,
                circleId: "c1",
                recipientId: momRecipient.id,
                recipient: momRecipient,
                creatorId: organizer.id,
                assigneeId: backupCaregiver.id,
                assignee: backupCaregiver,
                capabilities: CareTaskCapabilities(canEdit: true, canDelete: true, canAssign: true, canChangeRecipient: true, canChangeStatus: true, canMarkDone: true, canSkip: true, canComment: true)
            ),
            CareTask(
                id: "t4",
                title: "Evening check-in",
                notes: nil,
                dueAt: Date().addingTimeInterval(-3 * 60 * 60),
                status: .done,
                priority: .normal,
                completedAt: Date().addingTimeInterval(-90 * 60),
                archivedAt: nil,
                circleId: "c1",
                recipientId: momRecipient.id,
                recipient: momRecipient,
                creatorId: organizer.id,
                assigneeId: organizer.id,
                assignee: organizer,
                capabilities: CareTaskCapabilities(canEdit: true, canDelete: true, canAssign: true, canChangeRecipient: true, canChangeStatus: true, canMarkDone: true, canSkip: true, canComment: true)
            ),
        ]

        switch scenario {
        case .organizerHome:
            let circle = CareCircle(
                id: "c1",
                name: "Ramgiri Care Circle",
                recipientName: "Maya",
                members: allMembers,
                recipients: [momRecipient, dadRecipient],
                tasks: organizerTasks
            )
            let pendingInvites = [
                GroupInvitation(
                    id: "invite-caregiver",
                    email: "newcaregiver@careloop.test",
                    name: "Nina Caregiver",
                    role: .member,
                    status: .pending,
                    circle: circle,
                    recipient: nil,
                    invitedBy: InvitationSender(id: organizer.id, name: organizer.name, email: organizer.email)
                ),
                GroupInvitation(
                    id: "invite-receiver",
                    email: "dad@careloop.test",
                    name: "David Receiver",
                    role: .recipient,
                    status: .pending,
                    circle: circle,
                    recipient: dadRecipient,
                    invitedBy: InvitationSender(id: organizer.id, name: organizer.name, email: organizer.email)
                ),
            ]
            var user = organizer
            user.memberships = [CircleMembership(id: "cm1", circleId: circle.id, role: .admin, circle: circle)]
            return UITestScenarioFixture(
                user: user,
                circle: circle,
                invitations: pendingInvites,
                recipientAccessByMemberId: [
                    "m2": [
                        RecipientAccessSummary(
                            recipientId: momRecipient.id,
                            name: momRecipient.name,
                            activationStatus: momRecipient.activationStatus,
                            hasAccess: true,
                            grantedAt: Date().addingTimeInterval(-2 * 60 * 60)
                        ),
                        RecipientAccessSummary(
                            recipientId: dadRecipient.id,
                            name: dadRecipient.name,
                            activationStatus: dadRecipient.activationStatus,
                            hasAccess: false,
                            grantedAt: nil
                        ),
                    ],
                    "m3": [
                        RecipientAccessSummary(
                            recipientId: momRecipient.id,
                            name: momRecipient.name,
                            activationStatus: momRecipient.activationStatus,
                            hasAccess: true,
                            grantedAt: Date().addingTimeInterval(-60 * 60)
                        ),
                        RecipientAccessSummary(
                            recipientId: dadRecipient.id,
                            name: dadRecipient.name,
                            activationStatus: dadRecipient.activationStatus,
                            hasAccess: true,
                            grantedAt: Date().addingTimeInterval(-30 * 60)
                        ),
                    ],
                ]
            )

        case .caregiverHome:
            let visibleTasks = organizerTasks.filter { task in
                task.recipientId == momRecipient.id && (task.assigneeId == caregiver.id || task.assigneeId == mom.id || task.creatorId == caregiver.id)
            }
            let circle = CareCircle(
                id: "c1",
                name: "Ramgiri Care Circle",
                recipientName: "Maya",
                members: allMembers,
                recipients: [momRecipient],
                tasks: visibleTasks
            )
            var user = caregiver
            user.memberships = [CircleMembership(id: "cm2", circleId: circle.id, role: .member, circle: circle)]
            return UITestScenarioFixture(user: user, circle: circle, invitations: [], recipientAccessByMemberId: [:])

        case .receiverHome:
            let receiverTasks = [
                CareTask(
                    id: "t5",
                    title: "Take lunchtime medication",
                    notes: "Use the blue pill organizer after lunch.",
                    dueAt: Date().addingTimeInterval(20 * 60),
                    status: .pending,
                    priority: .high,
                    completedAt: nil,
                    archivedAt: nil,
                    circleId: "c1",
                    recipientId: momRecipient.id,
                    recipient: momRecipient,
                    creatorId: organizer.id,
                    assigneeId: mom.id,
                    assignee: mom,
                    capabilities: CareTaskCapabilities(canEdit: false, canDelete: false, canAssign: false, canChangeRecipient: false, canChangeStatus: false, canMarkDone: true, canSkip: false, canComment: true)
                ),
                CareTask(
                    id: "t6",
                    title: "Drink water",
                    notes: nil,
                    dueAt: Date().addingTimeInterval(90 * 60),
                    status: .pending,
                    priority: .normal,
                    completedAt: nil,
                    archivedAt: nil,
                    circleId: "c1",
                    recipientId: momRecipient.id,
                    recipient: momRecipient,
                    creatorId: organizer.id,
                    assigneeId: mom.id,
                    assignee: mom,
                    capabilities: CareTaskCapabilities(canEdit: false, canDelete: false, canAssign: false, canChangeRecipient: false, canChangeStatus: false, canMarkDone: true, canSkip: false, canComment: true)
                ),
            ]
            let circle = CareCircle(
                id: "c1",
                name: "Ramgiri Care Circle",
                recipientName: "Maya",
                members: allMembers,
                recipients: [momRecipient],
                tasks: receiverTasks
            )
            var user = mom
            user.memberships = [CircleMembership(id: "cm3", circleId: circle.id, role: .recipient, circle: circle)]
            return UITestScenarioFixture(user: user, circle: circle, invitations: [], recipientAccessByMemberId: [:])
        }
    }
}
