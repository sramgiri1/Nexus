import Foundation

enum AuthProvider: String, CaseIterable {
    case email = "Email"
    case google = "Google"
    case facebook = "Facebook"
    case apple = "Apple"
}

enum OnboardingValidation {
    static let minimumPasswordLength = 8

    static func signIn(email: String, password: String) -> Bool {
        isEmailLike(email) && isStrongEnough(password)
    }

    static func join(name: String, email: String, circleId: String, password: String, confirmPassword: String) -> Bool {
        !trimmed(name).isEmpty &&
        !trimmed(circleId).isEmpty &&
        isEmailLike(email) &&
        isStrongEnough(password) &&
        password == confirmPassword
    }

    static func create(name: String, email: String, circleName: String, recipientName: String, password: String, confirmPassword: String) -> Bool {
        !trimmed(name).isEmpty &&
        !trimmed(circleName).isEmpty &&
        !trimmed(recipientName).isEmpty &&
        isEmailLike(email) &&
        isStrongEnough(password) &&
        password == confirmPassword
    }

    static func helperText(for provider: AuthProvider) -> String {
        switch provider {
        case .email:
            return "Create an account with your email and password."
        case .google:
            return "Google can prefill your CareLoop account once its auth URL is configured."
        case .facebook:
            return "Facebook can prefill your CareLoop account once its auth URL is configured."
        case .apple:
            return "Apple can prefill your CareLoop account once its auth URL is configured."
        }
    }

    private static func isEmailLike(_ value: String) -> Bool {
        let email = trimmed(value)
        return email.contains("@") && email.contains(".")
    }

    private static func isStrongEnough(_ value: String) -> Bool {
        trimmed(value).count >= minimumPasswordLength
    }

    private static func trimmed(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
