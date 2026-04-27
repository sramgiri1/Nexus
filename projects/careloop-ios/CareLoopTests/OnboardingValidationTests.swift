import XCTest
@testable import CareLoop

final class OnboardingValidationTests: XCTestCase {

    func test_signIn_requiresEmailAndPassword() {
        XCTAssertFalse(OnboardingValidation.signIn(email: "", password: ""))
        XCTAssertFalse(OnboardingValidation.signIn(email: "alex@example.com", password: "short"))
        XCTAssertTrue(OnboardingValidation.signIn(email: "alex@example.com", password: "password1"))
    }

    func test_join_requiresMatchingPasswords() {
        XCTAssertFalse(
            OnboardingValidation.join(
                name: "Alex",
                email: "alex@example.com",
                circleId: "circle-123",
                password: "password1",
                confirmPassword: "password2"
            )
        )

        XCTAssertTrue(
            OnboardingValidation.join(
                name: "Alex",
                email: "alex@example.com",
                circleId: "circle-123",
                password: "password1",
                confirmPassword: "password1"
            )
        )
    }

    func test_create_requiresMatchingPasswords() {
        XCTAssertFalse(
            OnboardingValidation.create(
                name: "Alex",
                email: "alex@example.com",
                circleName: "Family",
                recipientName: "Mom",
                password: "password1",
                confirmPassword: "mismatch1"
            )
        )

        XCTAssertTrue(
            OnboardingValidation.create(
                name: "Alex",
                email: "alex@example.com",
                circleName: "Family",
                recipientName: "Mom",
                password: "password1",
                confirmPassword: "password1"
            )
        )
    }

    func test_supportedCreateAccountProviders_includeEmailGoogleFacebookApple() {
        XCTAssertEqual(AuthProvider.allCases, [.email, .google, .facebook, .apple])
    }

    func test_socialProviderHelperText_mentionsConfiguredAuthUrl() {
        XCTAssertTrue(OnboardingValidation.helperText(for: .google).contains("auth URL"))
        XCTAssertTrue(OnboardingValidation.helperText(for: .facebook).contains("auth URL"))
        XCTAssertTrue(OnboardingValidation.helperText(for: .apple).contains("auth URL"))
    }

    func test_authCallbackParsing_readsEmailAndName() {
        let url = URL(string: "careloop://auth?email=alex%40example.com&name=Alex%20Caregiver")!
        let payload = AuthProviderConfiguration.parseCallback(url: url)
        XCTAssertEqual(payload.email, "alex@example.com")
        XCTAssertEqual(payload.name, "Alex Caregiver")
    }
}
