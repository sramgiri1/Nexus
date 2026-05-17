import Foundation

enum UITestScenario: String {
    case circleDirectory = "circle-directory"
    case organizerHome = "organizer-home"
    case caregiverHome = "caregiver-home"
    case receiverHome = "receiver-home"

    private static let launchArgument = "-careloop-ui-scenario"
    private static let pendingTaskLaunchArgument = "-careloop-ui-pending-task"
    private static let pendingTaskCircleLaunchArgument = "-careloop-ui-pending-circle"

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

    static func pendingTaskId(_ arguments: [String]) -> String? {
        guard let index = arguments.firstIndex(of: pendingTaskLaunchArgument),
              arguments.indices.contains(index + 1) else {
            return nil
        }
        return arguments[index + 1]
    }

    static func pendingTaskCircleId(_ arguments: [String]) -> String? {
        guard let index = arguments.firstIndex(of: pendingTaskCircleLaunchArgument),
              arguments.indices.contains(index + 1) else {
            return nil
        }
        return arguments[index + 1]
    }
}

extension AppState {
    convenience init(uiTestScenario scenario: UITestScenario) {
        self.init(shouldRestoreSession: false)

        let fixture = UITestScenarioFixture.make(scenario)
        currentUser = fixture.user
        activeCircle = scenario == .circleDirectory ? nil : fixture.circle
        uiTestInvitations = fixture.invitations
        uiTestRecipientAccessByMemberId = fixture.recipientAccessByMemberId
        uiTestEvents = fixture.events
        uiTestCompletionInsights = fixture.completionInsights
        pendingTaskId = UITestScenario.pendingTaskId(ProcessInfo.processInfo.arguments) ?? fixture.pendingTaskId
        pendingTaskCircleId = UITestScenario.pendingTaskCircleId(ProcessInfo.processInfo.arguments)
        shouldPromptNewTask = false
    }
}

private struct UITestScenarioFixture {
    let user: CareUser
    let circle: CareCircle
    let invitations: [GroupInvitation]
    let recipientAccessByMemberId: [String: [RecipientAccessSummary]]
    let events: [CircleEvent]
    let completionInsights: CircleCompletionInsights?
    let pendingTaskId: String?

    static func make(_ scenario: UITestScenario) -> UITestScenarioFixture {
        let organizer = CareUser(id: "u1", email: "organizer@careloop.test", name: "Olivia Organizer", phone: nil, memberships: nil)
        let caregiver = CareUser(id: "u2", email: "caregiver@careloop.test", name: "Carlos Caregiver", phone: nil, memberships: nil)
        let backupCaregiver = CareUser(id: "u3", email: "backup@careloop.test", name: "Bianca Backup", phone: nil, memberships: nil)
        let mom = CareUser(id: "u4", email: "mom@careloop.test", name: "Maya Receiver", phone: nil, memberships: nil)
        let dad = CareUser(id: "u5", email: "dad@careloop.test", name: "David Receiver", phone: nil, memberships: nil)
        let organizerActor = EventActor(id: organizer.id, name: organizer.name)
        let caregiverActor = EventActor(id: caregiver.id, name: caregiver.name)
        let premiumCapabilities = CareRecipientPremiumCapabilities(
            hasPremium: true,
            canUseAdvancedReminders: true,
            canUseInsights: true,
            canUseUnlimitedCaregivers: true,
            canUseAdvancedCoordination: true
        )

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
            eligibleAssigneeIds: [organizer.id, caregiver.id, backupCaregiver.id, mom.id],
            premium: CareRecipientPremium(
                status: .active,
                source: .appStore,
                startsAt: Date().addingTimeInterval(-14 * 24 * 60 * 60),
                expiresAt: Date().addingTimeInterval(14 * 24 * 60 * 60),
                appleOriginalTransactionId: "ui-premium-maya",
                appleProductId: "com.careloop.ios.premium.yearly",
                hasPremium: true,
                capabilities: premiumCapabilities
            )
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
            eligibleAssigneeIds: [organizer.id, backupCaregiver.id],
            premium: .free
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
        case .circleDirectory:
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
                    expiresAt: nil,
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
                    expiresAt: nil,
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
                recipientAccessByMemberId: [:],
                events: [],
                completionInsights: nil,
                pendingTaskId: nil
            )

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
                    expiresAt: nil,
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
                    expiresAt: nil,
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
                ,
                events: [
                    CircleEvent(id: "e1", type: .taskCompleted, createdAt: Date().addingTimeInterval(-45 * 60), actorId: caregiver.id, actor: caregiverActor),
                    CircleEvent(id: "e2", type: .recipientUpdated, createdAt: Date().addingTimeInterval(-90 * 60), actorId: organizer.id, actor: organizerActor),
                    CircleEvent(id: "e3", type: .taskCreated, createdAt: Date().addingTimeInterval(-4 * 60 * 60), actorId: organizer.id, actor: organizerActor),
                ],
                completionInsights: CircleCompletionInsights(
                    periodDays: 7,
                    selectedRecipientId: nil,
                    completedByDay: [
                        CompletedTaskDay(date: "2026-05-14", count: 1),
                        CompletedTaskDay(date: "2026-05-15", count: 0),
                        CompletedTaskDay(date: "2026-05-16", count: 1),
                    ],
                    topCaregivers: [
                        TopCaregiverInsight(userId: caregiver.id, name: caregiver.name, email: caregiver.email, completedCount: 1),
                    ],
                    recipientBreakdown: [
                        RecipientCompletionInsight(recipientId: momRecipient.id, name: momRecipient.name, completed: 1, active: 2, overdue: 1),
                        RecipientCompletionInsight(recipientId: dadRecipient.id, name: dadRecipient.name, completed: 0, active: 0, overdue: 0),
                    ],
                    totals: CompletionInsightTotals(completed: 1, active: 2, overdue: 1)
                ),
                pendingTaskId: nil
            )

        case .caregiverHome:
            let caregiverMomRecipient = CareRecipient(
                id: momRecipient.id,
                name: momRecipient.name,
                relationship: momRecipient.relationship,
                notes: momRecipient.notes,
                isPrimary: momRecipient.isPrimary,
                sortOrder: momRecipient.sortOrder,
                activationStatus: momRecipient.activationStatus,
                receiverUserId: momRecipient.receiverUserId,
                eligibleAssigneeIds: momRecipient.eligibleAssigneeIds,
                premium: .free
            )
            let visibleTasks = organizerTasks.filter { task in
                task.recipientId == momRecipient.id && (task.assigneeId == caregiver.id || task.assigneeId == mom.id || task.creatorId == caregiver.id)
            }
            let circle = CareCircle(
                id: "c1",
                name: "Ramgiri Care Circle",
                recipientName: "Maya",
                members: allMembers,
                recipients: [caregiverMomRecipient],
                tasks: visibleTasks
            )
            var user = caregiver
            user.memberships = [CircleMembership(id: "cm2", circleId: circle.id, role: .member, circle: circle)]
            return UITestScenarioFixture(
                user: user,
                circle: circle,
                invitations: [],
                recipientAccessByMemberId: [:],
                events: [
                    CircleEvent(id: "e4", type: .taskCompleted, createdAt: Date().addingTimeInterval(-30 * 60), actorId: organizer.id, actor: organizerActor),
                    CircleEvent(id: "e5", type: .taskUpdated, createdAt: Date().addingTimeInterval(-2 * 60 * 60), actorId: organizer.id, actor: organizerActor),
                ],
                completionInsights: CircleCompletionInsights(
                    periodDays: 7,
                    selectedRecipientId: nil,
                    completedByDay: [
                        CompletedTaskDay(date: "2026-05-14", count: 0),
                        CompletedTaskDay(date: "2026-05-15", count: 1),
                        CompletedTaskDay(date: "2026-05-16", count: 0),
                    ],
                    topCaregivers: [],
                    recipientBreakdown: [
                        RecipientCompletionInsight(recipientId: momRecipient.id, name: momRecipient.name, completed: 1, active: 2, overdue: 1),
                    ],
                    totals: CompletionInsightTotals(completed: 1, active: 2, overdue: 1)
                ),
                pendingTaskId: nil
            )

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
            return UITestScenarioFixture(
                user: user,
                circle: circle,
                invitations: [],
                recipientAccessByMemberId: [:],
                events: [],
                completionInsights: nil,
                pendingTaskId: nil
            )
        }
    }
}
