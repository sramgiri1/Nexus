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
    func test_organizerHomeShowsReceiverCardsAndQuickActions() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "organizer-home"])
        let dashboard = app.scrollViews["organizer-dashboard"]

        XCTAssertTrue(dashboard.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Care Receivers"].exists)
        XCTAssertTrue(app.staticTexts["Maya"].exists)
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
        XCTAssertTrue(app.staticTexts["David"].exists)
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
            "-careloop-ui-pending-task", "t2"
        ])

        XCTAssertTrue(app.scrollViews["task-board-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Pick up prescriptions"].waitForExistence(timeout: 3))
    }

    @MainActor
    func test_receiverHomeShowsNextDueTaskExperience() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "receiver-home"])

        XCTAssertTrue(app.scrollViews["care-receiver-home"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Take lunchtime medication"].exists)
        XCTAssertTrue(app.buttons["View All My Tasks"].exists)
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
