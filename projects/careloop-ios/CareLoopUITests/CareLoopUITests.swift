import XCTest

private struct DemoAuthResult: Decodable {
    let accessToken: String
}

private struct DemoMembershipCircle: Decodable {
    let id: String
    let name: String
}

private struct DemoMembershipSummary: Decodable {
    let circleId: String
    let circle: DemoMembershipCircle?
}

private struct DemoCurrentUser: Decodable {
    let id: String
    let memberships: [DemoMembershipSummary]?
}

private struct DemoRecipientSummary: Decodable {
    let id: String
    let name: String
}

final class CareLoopUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    private func launchApp(arguments: [String], environment: [String: String] = [:]) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments += arguments
        app.launchEnvironment.merge(environment) { _, new in new }
        app.launch()
        return app
    }

    private func typeText(into element: XCUIElement, text: String) {
        XCTAssertTrue(element.waitForExistence(timeout: 5))
        element.tap()
        element.typeText(text)
    }

    private func anyElement(in app: XCUIApplication, identifier: String) -> XCUIElement {
        app.descendants(matching: .any)
            .matching(NSPredicate(format: "identifier == %@", identifier))
            .firstMatch
    }

    private func waitForAnyElement(
        in app: XCUIApplication,
        identifier: String,
        timeout: TimeInterval = 5
    ) -> XCUIElement {
        let element = anyElement(in: app, identifier: identifier)
        XCTAssertTrue(element.waitForExistence(timeout: timeout), "Expected element '\(identifier)' to appear")
        return element
    }

    private func waitForDisappearance(of element: XCUIElement, timeout: TimeInterval = 5) {
        let predicate = NSPredicate(format: "exists == false")
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: timeout), .completed)
    }

    private func enableInviteActionByConfirmingAdult(in app: XCUIApplication) {
        let toggle = app.switches["invite-caregiver-adult-toggle"]
        let inviteButton = app.buttons["invite-caregiver-submit-button"]

        XCTAssertTrue(toggle.waitForExistence(timeout: 5))
        XCTAssertTrue(inviteButton.waitForExistence(timeout: 5))

        for _ in 0..<4 {
            if inviteButton.isEnabled {
                return
            }
            toggle.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.5)).tap()
            usleep(250_000)
        }

        XCTAssertTrue(inviteButton.isEnabled)
    }

    @MainActor
    private func tapQuickAction(_ identifier: String, in app: XCUIApplication) {
        let button = app.buttons[identifier]

        for _ in 0..<5 {
            if button.waitForExistence(timeout: 1), button.isHittable {
                button.tap()
                return
            }

            if app.scrollViews["organizer-dashboard"].exists {
                app.scrollViews["organizer-dashboard"].swipeUp()
            } else {
                app.swipeUp()
            }
        }

        XCTAssertTrue(button.waitForExistence(timeout: 5), "Expected quick action '\(identifier)' to appear")
        button.tap()
    }

    @MainActor
    private func reopenCircle(in app: XCUIApplication, named circleName: String) {
        _ = app.scrollViews["circle-directory-screen"].waitForExistence(timeout: 10)

        let title = app.staticTexts[circleName]
        if title.waitForExistence(timeout: 5), title.isHittable {
            title.tap()
        } else {
            let circleButton = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", circleName)).firstMatch
            if circleButton.waitForExistence(timeout: 5), circleButton.isHittable {
                circleButton.tap()
            }
        }

        _ = waitForAnyElement(in: app, identifier: "organizer-dashboard", timeout: 10)
    }

    @MainActor
    private func openCreateCircleFlow(in app: XCUIApplication) {
        let directory = app.scrollViews["circle-directory-screen"]
        XCTAssertTrue(directory.waitForExistence(timeout: 10))

        if app.buttons["create-circle-button"].waitForExistence(timeout: 2) {
            app.buttons["create-circle-button"].tap()
            return
        }

        for _ in 0..<6 {
            if app.buttons["welcome-start-circle-button"].waitForExistence(timeout: 1) {
                app.buttons["welcome-start-circle-button"].tap()
                return
            }
            if app.buttons["Next"].waitForExistence(timeout: 1) {
                app.buttons["Next"].tap()
            }
        }

        XCTFail("Unable to reach the create circle entry point from the circle directory")
    }

    private func waitForAPIHealth(timeout: TimeInterval = 30) async throws {
        let startedAt = Date()
        let healthURL = try XCTUnwrap(URL(string: "http://127.0.0.1:3000/health"))

        while Date().timeIntervalSince(startedAt) < timeout {
            do {
                let (_, response) = try await URLSession.shared.data(for: URLRequest(url: healthURL))
                if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                    return
                }
            } catch {
                // keep polling until timeout
            }
            try await Task.sleep(nanoseconds: 1_000_000_000)
        }

        XCTFail("CareLoop API was not healthy within \(timeout) seconds")
    }

    private func provisionDemoOrganizerSession() async throws -> DemoAuthResult {
        try await waitForAPIHealth()

        let emailToken = UUID().uuidString.replacingOccurrences(of: "-", with: "").lowercased()
        let payload: [String: String] = [
            "email": "video.demo.\(emailToken.prefix(10))@careloop.test",
            "name": "Video Demo Organizer",
            "password": "DemoCare123!"
        ]
        let body = try JSONSerialization.data(withJSONObject: payload)
        let url = try XCTUnwrap(URL(string: "http://127.0.0.1:3000/auth/signup"))
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: request)
        let http = try XCTUnwrap(response as? HTTPURLResponse)
        XCTAssertEqual(http.statusCode, 201)
        return try JSONDecoder().decode(DemoAuthResult.self, from: data)
    }

    private func authorizedRequest(
        path: String,
        method: String = "GET",
        accessToken: String,
        jsonBody: [String: Any]? = nil
    ) throws -> URLRequest {
        let url = try XCTUnwrap(URL(string: "http://127.0.0.1:3000\(path)"))
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        if let jsonBody {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: jsonBody)
        }

        return request
    }

    private func fetchDemoCurrentUser(accessToken: String) async throws -> DemoCurrentUser {
        let request = try authorizedRequest(path: "/users/me", accessToken: accessToken)
        let (data, response) = try await URLSession.shared.data(for: request)
        let http = try XCTUnwrap(response as? HTTPURLResponse)
        XCTAssertEqual(http.statusCode, 200)
        return try JSONDecoder().decode(DemoCurrentUser.self, from: data)
    }

    private func fetchDemoRecipients(circleId: String, accessToken: String) async throws -> [DemoRecipientSummary] {
        let request = try authorizedRequest(path: "/circles/\(circleId)/recipients", accessToken: accessToken)
        let (data, response) = try await URLSession.shared.data(for: request)
        let http = try XCTUnwrap(response as? HTTPURLResponse)
        XCTAssertEqual(http.statusCode, 200)
        return try JSONDecoder().decode([DemoRecipientSummary].self, from: data)
    }

    private func proxyActivateDemoRecipient(
        circleId: String,
        recipientId: String,
        userId: String,
        accessToken: String
    ) async throws {
        let request = try authorizedRequest(
            path: "/circles/\(circleId)/recipients/\(recipientId)/proxy-activate",
            method: "POST",
            accessToken: accessToken,
            jsonBody: [
                "userId": userId,
                "consentDocumentReference": "admin-demo-video-consent"
            ]
        )
        let (_, response) = try await URLSession.shared.data(for: request)
        let http = try XCTUnwrap(response as? HTTPURLResponse)
        XCTAssertEqual(http.statusCode, 200)
    }

    private func activateRecipientForDemo(
        accessToken: String,
        circleName: String,
        recipientName: String
    ) async throws {
        let user = try await fetchDemoCurrentUser(accessToken: accessToken)

        let membership = user.memberships?.first(where: { membership in
            membership.circle?.name == circleName
        }) ?? user.memberships?.first
        let circleId = try XCTUnwrap(membership?.circleId)

        for _ in 0..<10 {
            let recipients = try await fetchDemoRecipients(circleId: circleId, accessToken: accessToken)
            if let recipient = recipients.first(where: { $0.name == recipientName }) {
                try await proxyActivateDemoRecipient(
                    circleId: circleId,
                    recipientId: recipient.id,
                    userId: user.id,
                    accessToken: accessToken
                )
                return
            }
            try await Task.sleep(nanoseconds: 500_000_000)
        }

        XCTFail("Unable to locate recipient '\(recipientName)' in demo circle '\(circleName)'")
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
    func test_adminEndToEndDemoFlow() async throws {
        let session = try await provisionDemoOrganizerSession()
        let app = launchApp(
            arguments: ["-careloop-ui-reset-session", "-careloop-ui-simulate-premium-sync"],
            environment: ["CARELOOP_DEMO_ACCESS_TOKEN": session.accessToken]
        )

        let circleName = "Investor Demo Circle"
        let recipientName = "Jordan Wells"
        let recipientEmail = "recipient+\(UUID().uuidString.prefix(8))@careloop.test"
        let caregiverEmail = "caregiver+\(UUID().uuidString.prefix(8))@careloop.test"
        let oneTimeTaskTitle = "Confirm pharmacy pickup"
        let recurringTaskTitle = "Daily care check-in"

        openCreateCircleFlow(in: app)

        let circleNameField = app.textFields["create-circle-name-field"]
        typeText(into: circleNameField, text: circleName)
        app.typeText("\n")
        let recipientField = app.textFields["create-circle-recipient-field"]
        XCTAssertTrue(recipientField.waitForExistence(timeout: 5))
        app.typeText(recipientName)
        app.buttons["create-circle-submit-button"].tap()

        _ = waitForAnyElement(in: app, identifier: "organizer-dashboard", timeout: 10)
        tapQuickAction("quick-action-care-receivers", in: app)

        _ = waitForAnyElement(in: app, identifier: "receiver-management-screen")
        XCTAssertTrue(app.staticTexts[recipientName].waitForExistence(timeout: 5))
        print("STEP receiver management visible")

        let inviteButton = app.buttons["Send Invite"].firstMatch
        XCTAssertTrue(inviteButton.waitForExistence(timeout: 5))
        inviteButton.tap()
        print("STEP invite sheet opened")

        let recipientInviteField = app.textFields["recipient-invite-email-field"]
        typeText(into: recipientInviteField, text: recipientEmail)
        app.buttons["recipient-invite-send-button"].tap()
        waitForDisappearance(of: recipientInviteField, timeout: 8)
        XCTAssertTrue(
            app.buttons["Revoke"].waitForExistence(timeout: 8) ||
            app.buttons["Resend Invite"].waitForExistence(timeout: 8)
        )
        print("STEP recipient invite sent")

        try await activateRecipientForDemo(
            accessToken: session.accessToken,
            circleName: circleName,
            recipientName: recipientName
        )
        XCTAssertTrue(app.buttons["Done"].waitForExistence(timeout: 5))
        app.buttons["Done"].tap()
        waitForDisappearance(of: anyElement(in: app, identifier: "receiver-management-screen"), timeout: 8)
        print("STEP recipient proxy activated")

        tapQuickAction("quick-action-people-access", in: app)

        _ = waitForAnyElement(in: app, identifier: "people-access-screen")
        XCTAssertTrue(app.buttons["invite-caregiver-button"].waitForExistence(timeout: 5))
        app.buttons["invite-caregiver-button"].tap()
        let caregiverNameField = app.textFields["invite-caregiver-name-field"]
        typeText(into: caregiverNameField, text: "Nina Caregiver")
        typeText(into: app.textFields["invite-caregiver-email-field"], text: caregiverEmail)
        app.typeText("\n")
        enableInviteActionByConfirmingAdult(in: app)
        XCTAssertTrue(app.buttons["invite-caregiver-submit-button"].waitForExistence(timeout: 3))
        app.buttons["invite-caregiver-submit-button"].tap()
        waitForDisappearance(of: caregiverNameField, timeout: 8)
        app.buttons["Done"].tap()
        waitForDisappearance(of: anyElement(in: app, identifier: "people-access-screen"), timeout: 8)

        tapQuickAction("quick-action-task-board", in: app)

        XCTAssertTrue(app.scrollViews["task-board-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["add-task-button"].waitForExistence(timeout: 5))
        app.buttons["add-task-button"].tap()
        typeText(into: app.textFields["new-task-title-field"], text: oneTimeTaskTitle)
        app.buttons["new-task-submit-button"].tap()
        XCTAssertTrue(app.staticTexts[oneTimeTaskTitle].waitForExistence(timeout: 8))
        app.buttons["task-board-back-to-dashboard-button"].tap()
        reopenCircle(in: app, named: circleName)

        tapQuickAction("quick-action-upgrade-premium", in: app)

        _ = waitForAnyElement(in: app, identifier: "receiver-paywall-screen")
        XCTAssertTrue(app.staticTexts["Unlock Premium for \(recipientName)"].waitForExistence(timeout: 5))
        app.swipeUp()
        XCTAssertTrue(app.buttons["simulate-premium-success-button"].waitForExistence(timeout: 5))
        app.buttons["simulate-premium-success-button"].tap()
        XCTAssertTrue(app.staticTexts["Premium is active for \(recipientName)"].waitForExistence(timeout: 10))
        if app.buttons["premium-success-continue-button"].waitForExistence(timeout: 5) {
            app.buttons["premium-success-continue-button"].tap()
        }

        if app.buttons["circle-directory-button"].waitForExistence(timeout: 5) {
            app.buttons["circle-directory-button"].tap()
            reopenCircle(in: app, named: circleName)
        }

        tapQuickAction("quick-action-task-board", in: app)
        XCTAssertTrue(app.buttons["add-task-button"].waitForExistence(timeout: 5))
        app.buttons["add-task-button"].tap()
        typeText(into: app.textFields["new-task-title-field"], text: recurringTaskTitle)
        XCTAssertTrue(app.buttons["task-mode-repeating-button"].waitForExistence(timeout: 5))
        app.buttons["task-mode-repeating-button"].tap()
        XCTAssertFalse(app.staticTexts["Recurring schedules require premium"].exists)
        XCTAssertTrue(app.buttons["Cancel"].waitForExistence(timeout: 5))
        app.buttons["Cancel"].tap()
        app.buttons["task-board-back-to-dashboard-button"].tap()
        reopenCircle(in: app, named: circleName)

        tapQuickAction("quick-action-insights", in: app)
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
        app.swipeUp()
        XCTAssertTrue(app.buttons["simulate-premium-success-button"].waitForExistence(timeout: 3))
        app.buttons["simulate-premium-success-button"].tap()

        XCTAssertTrue(app.staticTexts["Premium is active for David"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Receiver-specific Premium"].exists)
        XCTAssertTrue(app.staticTexts["Recurring routines, insights, unlimited caregivers, and advanced coordination are now unlocked only for this care receiver."].exists)
    }

    @MainActor
    func test_organizerCanManagePremiumReceiverPlan() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "organizer-home"])
        let dashboard = app.scrollViews["organizer-dashboard"]

        XCTAssertTrue(dashboard.waitForExistence(timeout: 5))
        dashboard.swipeUp()
        XCTAssertTrue(app.buttons["quick-action-care-receivers"].waitForExistence(timeout: 3))
        app.buttons["quick-action-care-receivers"].tap()

        XCTAssertTrue(app.staticTexts["Care Receiver Management"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Premium plan active"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Premium receiver features active until"].exists || app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "Premium receiver features active until")).count > 0)

        XCTAssertTrue(app.buttons["manage-premium-top-button"].waitForExistence(timeout: 3))
        app.buttons["manage-premium-top-button"].tap()

        XCTAssertTrue(app.staticTexts["Manage Premium for Maya"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["Premium applies only to Maya's care workflow in this Care Circle."].exists)
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
    func test_organizerCanCreateRecurringTaskForPremiumReceiver() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "organizer-home"])
        let recurringTaskTitle = "Daily hydration check"

        XCTAssertTrue(app.scrollViews["organizer-dashboard"].waitForExistence(timeout: 5))
        tapQuickAction("quick-action-task-board", in: app)

        XCTAssertTrue(app.scrollViews["task-board-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["add-task-button"].waitForExistence(timeout: 5))
        app.buttons["add-task-button"].tap()

        typeText(into: app.textFields["new-task-title-field"], text: recurringTaskTitle)
        XCTAssertTrue(app.buttons["task-mode-repeating-button"].waitForExistence(timeout: 5))
        app.buttons["task-mode-repeating-button"].tap()

        XCTAssertFalse(app.staticTexts["Recurring schedules require premium"].exists)
        XCTAssertTrue(app.buttons["new-task-submit-button"].isEnabled)
        app.buttons["new-task-submit-button"].tap()

        XCTAssertTrue(app.staticTexts[recurringTaskTitle].waitForExistence(timeout: 5))
        let recurringTaskCard = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", recurringTaskTitle)).firstMatch
        XCTAssertTrue(recurringTaskCard.waitForExistence(timeout: 3))
        recurringTaskCard.tap()

        XCTAssertTrue(app.scrollViews["task-detail-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.textFields["task-detail-title-field"].waitForExistence(timeout: 3))
        XCTAssertEqual(app.textFields["task-detail-title-field"].value as? String, recurringTaskTitle)
        XCTAssertTrue(app.staticTexts["Repeats"].waitForExistence(timeout: 3))
        XCTAssertFalse(app.staticTexts["Recurring schedules require premium"].exists)
    }

    @MainActor
    func test_completingRecurringTaskCreatesNextOccurrence() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "organizer-home"])
        let recurringTaskTitle = "Daily mobility check"

        XCTAssertTrue(app.scrollViews["organizer-dashboard"].waitForExistence(timeout: 5))
        tapQuickAction("quick-action-task-board", in: app)

        XCTAssertTrue(app.scrollViews["task-board-screen"].waitForExistence(timeout: 5))
        app.buttons["add-task-button"].tap()
        typeText(into: app.textFields["new-task-title-field"], text: recurringTaskTitle)
        app.buttons["task-mode-repeating-button"].tap()
        app.buttons["new-task-submit-button"].tap()

        XCTAssertTrue(app.staticTexts[recurringTaskTitle].waitForExistence(timeout: 5))
        let recurringToggle = app.buttons.matching(
            NSPredicate(format: "identifier BEGINSWITH %@", "task-toggle-ui-task-")
        ).firstMatch
        XCTAssertTrue(recurringToggle.waitForExistence(timeout: 5))
        recurringToggle.tap()

        let nextOccurrence = app.buttons.matching(
            NSPredicate(format: "label CONTAINS %@ AND label CONTAINS %@", recurringTaskTitle, "Tomorrow")
        ).firstMatch
        XCTAssertTrue(nextOccurrence.waitForExistence(timeout: 5))
    }

    @MainActor
    func test_taskDetailCanChangeStatusToDone() throws {
        let app = launchApp(arguments: [
            "-careloop-ui-scenario", "organizer-home",
            "-careloop-ui-pending-task", "t2",
            "-careloop-ui-pending-circle", "c1"
        ])

        XCTAssertTrue(app.scrollViews["task-board-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["task-card-t2"].waitForExistence(timeout: 3))
        app.buttons["task-card-t2"].tap()

        XCTAssertTrue(app.scrollViews["task-detail-screen"].waitForExistence(timeout: 5))
        app.buttons["task-detail-status-done"].tap()
        XCTAssertEqual(app.buttons["task-detail-status-done"].value as? String, "Selected")
    }

    @MainActor
    func test_organizerCanEditTaskTitleFromDetail() throws {
        let app = launchApp(arguments: [
            "-careloop-ui-scenario", "organizer-home",
            "-careloop-ui-pending-task", "t2",
            "-careloop-ui-pending-circle", "c1"
        ])
        let updatedTitle = "Pick up prescriptions updated"

        XCTAssertTrue(app.scrollViews["task-board-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["task-card-t2"].waitForExistence(timeout: 3))
        app.buttons["task-card-t2"].tap()

        XCTAssertTrue(app.scrollViews["task-detail-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["task-detail-edit-button"].waitForExistence(timeout: 3))
        app.buttons["task-detail-edit-button"].tap()

        let titleField = app.textFields["task-detail-title-field"]
        XCTAssertTrue(titleField.waitForExistence(timeout: 3))
        titleField.tap()
        titleField.typeText(" updated")

        XCTAssertTrue(app.buttons["task-detail-save-button"].waitForExistence(timeout: 3))
        app.buttons["task-detail-save-button"].tap()

        XCTAssertTrue(app.staticTexts[updatedTitle].waitForExistence(timeout: 5))
    }

    @MainActor
    func test_organizerCanCancelAndConfirmTaskDeleteFromDetail() throws {
        let app = launchApp(arguments: [
            "-careloop-ui-scenario", "organizer-home",
            "-careloop-ui-pending-task", "t2",
            "-careloop-ui-pending-circle", "c1"
        ])

        XCTAssertTrue(app.scrollViews["task-board-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["task-card-t2"].waitForExistence(timeout: 3))
        app.buttons["task-card-t2"].tap()

        XCTAssertTrue(app.scrollViews["task-detail-screen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["task-detail-delete-button"].waitForExistence(timeout: 3))
        app.buttons["task-detail-delete-button"].tap()
        XCTAssertTrue(app.buttons["Cancel"].waitForExistence(timeout: 3))
        app.buttons["Cancel"].tap()
        XCTAssertTrue(app.scrollViews["task-detail-screen"].waitForExistence(timeout: 3))

        app.buttons["task-detail-delete-button"].tap()
        XCTAssertTrue(app.buttons["Delete"].waitForExistence(timeout: 3))
        app.buttons["Delete"].tap()
        waitForDisappearance(of: app.buttons["task-card-t2"], timeout: 5)
    }

    @MainActor
    func test_taskCommentsCanBeAddedAndDeleted() throws {
        let app = launchApp(arguments: [
            "-careloop-ui-scenario", "task-comments",
            "-careloop-ui-pending-task", "t2"
        ])
        let commentBody = "Confirm pickup window with pharmacy"

        let field = waitForAnyElement(in: app, identifier: "task-comment-field")
        typeText(into: field, text: commentBody)
        app.buttons["task-comment-send-button"].tap()

        XCTAssertTrue(app.staticTexts[commentBody].waitForExistence(timeout: 5))
        let deleteButton = app.buttons["Delete comment"]
        XCTAssertTrue(deleteButton.waitForExistence(timeout: 3))
        deleteButton.tap()
        waitForDisappearance(of: app.staticTexts[commentBody], timeout: 5)
    }

    @MainActor
    func test_insightsLockFreeReceiverBehindPremiumUpgrade() throws {
        let app = launchApp(arguments: ["-careloop-ui-scenario", "organizer-home"])
        let dashboard = app.scrollViews["organizer-dashboard"]

        XCTAssertTrue(dashboard.waitForExistence(timeout: 5))
        dashboard.swipeUp()
        if !app.buttons["quick-action-insights"].exists {
            dashboard.swipeUp()
        }
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
