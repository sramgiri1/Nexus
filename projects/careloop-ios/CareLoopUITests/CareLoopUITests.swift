import XCTest

final class CareLoopUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    private func launchApp(arguments: [String]) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments += arguments
        app.launch()
        return app
    }

    @MainActor
    func test_launchesIntoOnboardingWhenSessionIsReset() throws {
        let app = launchApp(arguments: ["-careloop-ui-reset-session"])

        XCTAssertTrue(app.staticTexts["Welcome back"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Log in"].exists)
        XCTAssertTrue(app.buttons["Sign up"].exists)
    }

    @MainActor
    func test_circleDirectoryShowsSeparateCreateAndJoinActions() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "circle-directory"])
        let directory = app.scrollViews["circle-directory-screen"]

        XCTAssertTrue(directory.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Your Care Circles"].exists)
        XCTAssertTrue(app.buttons["create-circle-button"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.buttons["join-circle-button"].waitForExistence(timeout: 3))
    }

    @MainActor
    func test_organizerHomeShowsReceiverCardsAndQuickActions() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "organizer-home"])
        let dashboard = app.scrollViews["organizer-dashboard"]

        XCTAssertTrue(dashboard.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Care Receivers"].exists)
        XCTAssertTrue(app.staticTexts["Maya"].exists)
        XCTAssertTrue(app.images["receiver-plan-badge-r1"].exists)
        XCTAssertTrue(app.images["receiver-plan-badge-r2"].exists)
        XCTAssertTrue(app.staticTexts["Task Board"].exists)
        dashboard.swipeUp()
        XCTAssertTrue(app.staticTexts["People & Access"].waitForExistence(timeout: 3))
    }

    @MainActor
    func test_organizerCanOpenPeopleAndAccess() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "organizer-home"])
        let dashboard = app.scrollViews["organizer-dashboard"]

        XCTAssertTrue(dashboard.waitForExistence(timeout: 5))
        dashboard.swipeUp()
        XCTAssertTrue(app.buttons["quick-action-people-access"].waitForExistence(timeout: 3))
        app.buttons["quick-action-people-access"].tap()

        XCTAssertTrue(app.staticTexts["People & Access"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Carlos Caregiver"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Nina Caregiver"].exists)
    }

    @MainActor
    func test_organizerCanOpenCareReceiverManagement() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "organizer-home"])
        let dashboard = app.scrollViews["organizer-dashboard"]

        XCTAssertTrue(dashboard.waitForExistence(timeout: 5))
        dashboard.swipeUp()
        XCTAssertTrue(app.buttons["quick-action-care-receivers"].waitForExistence(timeout: 3))
        app.buttons["quick-action-care-receivers"].tap()

        XCTAssertTrue(app.staticTexts["Care Receiver Management"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Activation controls task access"].exists)
        XCTAssertTrue(app.staticTexts["UPGRADE REQUESTS"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["2 caregivers requested Premium for David"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Latest request from Bianca Backup."].exists)
        XCTAssertTrue(app.staticTexts["David"].exists)
        XCTAssertTrue(app.staticTexts["Premium plan active"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Basic plan"].exists)
        XCTAssertTrue(app.buttons["Upgrade David"].exists)
        XCTAssertFalse(app.buttons["premium-request-r2"].exists)
    }

    @MainActor
    func test_addSecondReceiverShowsPremiumGateBeforeForm() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "organizer-home"])
        let dashboard = app.scrollViews["organizer-dashboard"]

        XCTAssertTrue(dashboard.waitForExistence(timeout: 5))
        dashboard.swipeUp()
        XCTAssertTrue(app.buttons["quick-action-care-receivers"].waitForExistence(timeout: 3))
        app.buttons["quick-action-care-receivers"].tap()

        XCTAssertTrue(app.buttons["add-care-receiver-button"].waitForExistence(timeout: 5))
        app.buttons["add-care-receiver-button"].tap()

        XCTAssertTrue(app.staticTexts["Premium is required to add another care receiver"].waitForExistence(timeout: 3))
        XCTAssertFalse(app.staticTexts["Add Care Receiver"].waitForExistence(timeout: 1))
        app.buttons["Upgrade and add receiver"].tap()
        XCTAssertTrue(app.staticTexts["Add Care Receiver"].waitForExistence(timeout: 3))
    }

    @MainActor
    func test_organizerCanOpenReceiverPremiumPaywall() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "organizer-home"])
        let dashboard = app.scrollViews["organizer-dashboard"]

        XCTAssertTrue(dashboard.waitForExistence(timeout: 5))
        dashboard.swipeUp()
        XCTAssertTrue(app.buttons["quick-action-upgrade-premium"].waitForExistence(timeout: 3))
        app.buttons["quick-action-upgrade-premium"].tap()

        XCTAssertTrue(app.otherElements["receiver-paywall-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Unlock Premium for David"].waitForExistence(timeout: 3))
    }

    @MainActor
    func test_caregiverHomeShowsScopedDashboard() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "caregiver-home"])

        XCTAssertTrue(app.scrollViews["caregiver-dashboard"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Maya"].exists)
        XCTAssertFalse(app.staticTexts["David"].exists)
        XCTAssertTrue(app.images["receiver-plan-badge-r1"].exists)
        XCTAssertFalse(app.buttons["quick-action-upgrade-premium"].exists)
        XCTAssertTrue(app.staticTexts["My Task Board"].exists)
    }

    @MainActor
    func test_caregiverCanOpenReceiverProgress() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "caregiver-home"])
        let dashboard = app.scrollViews["caregiver-dashboard"]

        XCTAssertTrue(dashboard.waitForExistence(timeout: 5))
        dashboard.swipeUp()
        XCTAssertTrue(app.buttons["quick-action-activity"].waitForExistence(timeout: 3))
        app.buttons["quick-action-activity"].tap()

        XCTAssertTrue(app.staticTexts["Overview"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Maya"].exists)
        XCTAssertTrue(app.staticTexts["A task was completed"].exists)
    }

    @MainActor
    func test_caregiverCanRequestUpgradeButCannotPurchase() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "caregiver-home"])

        XCTAssertTrue(app.scrollViews["caregiver-dashboard"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["quick-action-my-task-board"].waitForExistence(timeout: 3))
        app.buttons["quick-action-my-task-board"].tap()

        XCTAssertTrue(app.scrollViews["task-board-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["add-task-button"].waitForExistence(timeout: 3))
        app.buttons["add-task-button"].tap()

        XCTAssertTrue(app.staticTexts["New Task"].waitForExistence(timeout: 5))
        app.buttons["Repeating"].tap()

        XCTAssertTrue(app.staticTexts["Recurring schedules are premium for Maya"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.buttons["task-recurring-request-upgrade-button"].exists)
        XCTAssertFalse(app.buttons["task-recurring-upgrade-button"].exists)
        app.buttons["task-recurring-request-upgrade-button"].tap()
        XCTAssertTrue(app.buttons["Request sent"].waitForExistence(timeout: 3))
    }

    @MainActor
    func test_insightsLockFreeReceiverBehindPremiumUpgrade() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "organizer-home"])
        let dashboard = app.scrollViews["organizer-dashboard"]

        XCTAssertTrue(dashboard.waitForExistence(timeout: 5))
        dashboard.swipeUp()
        XCTAssertTrue(app.buttons["quick-action-insights"].waitForExistence(timeout: 3))
        app.buttons["quick-action-insights"].tap()

        XCTAssertTrue(app.staticTexts["Overview"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["David"].waitForExistence(timeout: 3))
        app.buttons["David"].tap()

        XCTAssertTrue(app.staticTexts["Premium is required for David"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["insights-upgrade-button"].exists)
    }

    @MainActor
    func test_organizerPendingTaskDeepLinkOpensTaskBoard() throws {
        let app = launchApp(arguments: [
            "-careloop-ui-scenario", "organizer-home",
            "-careloop-ui-pending-task", "t2",
            "-careloop-ui-pending-circle", "c1"
        ])

        XCTAssertTrue(app.scrollViews["task-board-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Pick up prescriptions"].waitForExistence(timeout: 3))
    }

    @MainActor
    func test_taskDetailCanSnoozeReminder() throws {
        let app = launchApp(arguments: [
            "-careloop-ui-scenario", "organizer-home",
            "-careloop-ui-pending-task", "t2",
            "-careloop-ui-pending-circle", "c1"
        ])

        XCTAssertTrue(app.scrollViews["task-board-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["task-card-t2"].waitForExistence(timeout: 3))
        app.buttons["task-card-t2"].tap()

        XCTAssertTrue(app.scrollViews["task-detail-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Need more time?"].waitForExistence(timeout: 3))
        app.buttons["snooze-15-button"].tap()
        XCTAssertTrue(app.staticTexts["Snoozed for 15 minutes."].waitForExistence(timeout: 3))
    }

    @MainActor
    func test_pendingTaskDeepLinkWaitsForOwningCircle() throws {
        let app = launchApp(arguments: [
            "-careloop-ui-scenario", "organizer-home",
            "-careloop-ui-pending-task", "t2",
            "-careloop-ui-pending-circle", "other-circle"
        ])

        XCTAssertTrue(app.scrollViews["organizer-dashboard"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.scrollViews["task-board-screen"].waitForExistence(timeout: 1))
    }

    @MainActor
    func test_receiverHomeShowsNextDueTaskExperience() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "receiver-home"])

        XCTAssertTrue(app.scrollViews["care-receiver-home"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.images["receiver-home-plan-badge"].exists)
        XCTAssertFalse(app.buttons["quick-action-upgrade-premium"].exists)
        XCTAssertTrue(app.staticTexts["Take lunchtime medication"].exists)
        XCTAssertTrue(app.buttons["View All My Tasks"].exists)
    }

    @MainActor
    func test_receiverCanCompleteNextTaskFromHome() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "receiver-home"])

        XCTAssertTrue(app.scrollViews["care-receiver-home"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Take lunchtime medication"].exists)

        app.buttons["receiver-next-task-primary"].tap()

        XCTAssertTrue(app.staticTexts["Drink water"].waitForExistence(timeout: 3))
        XCTAssertFalse(app.staticTexts["Take lunchtime medication"].exists)
    }

    @MainActor
    func test_receiverPendingTaskDeepLinkOpensPersonalBoard() throws {
        let app = launchApp(arguments: [
            "-careloop-ui-scenario", "receiver-home",
            "-careloop-ui-pending-task", "t5"
        ])

        XCTAssertTrue(app.scrollViews["recipient-task-board-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Take lunchtime medication"].waitForExistence(timeout: 3))
    }
}
