import XCTest

final class CareLoopUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func test_launchesIntoOnboardingWhenSessionIsReset() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-careloop-ui-reset-session"]
        app.launch()

        XCTAssertTrue(app.staticTexts["Welcome back"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Log in"].exists)
        XCTAssertTrue(app.buttons["Sign up"].exists)
    }
}
