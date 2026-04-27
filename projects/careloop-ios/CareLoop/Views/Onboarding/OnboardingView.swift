import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var socialAuth = SocialAuthSession()

    @State private var signInEmail = ""
    @State private var signInPassword = ""

    @State private var createName = ""
    @State private var createEmail = ""
    @State private var createCircleName = ""
    @State private var createRecipient = ""
    @State private var createPassword = ""
    @State private var createConfirmPassword = ""
    @State private var selectedProvider: AuthProvider = .email

    @State private var error: String?
    @State private var loading = false
    @State private var showSignUp = false

    private let pageBackground = Color(red: 0.96, green: 0.97, blue: 0.99)
    private let inputBorder = Color(red: 0.84, green: 0.89, blue: 0.94)
    private let secondaryText = Color(red: 0.61, green: 0.69, blue: 0.77)
    private let accent = Color(red: 0.11, green: 0.76, blue: 0.72)
    private let accent2 = Color(red: 0.10, green: 0.53, blue: 0.83)

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                VStack(spacing: 0) {
                    heroSection

                    VStack(spacing: 0) {
                        signInFields
                        forgotPassword
                        loginButton
                        continueDivider
                        socialRow

                        if let error {
                            Text(error)
                                .font(.system(size: 13, weight: .medium, design: .rounded))
                                .foregroundStyle(.red)
                                .multilineTextAlignment(.center)
                                .padding(.top, 12)
                                .padding(.horizontal, 24)
                        }
                    }
                    .padding(.horizontal, 34)
                    .padding(.top, 26)
                }

                Spacer(minLength: 0)
                footer
            }
            .background(pageBackground.ignoresSafeArea())
            .sheet(isPresented: $showSignUp) {
                signUpSheet
            }
        }
    }

    private var heroSection: some View {
        ZStack(alignment: .bottomLeading) {
            LinearGradient(
                colors: [accent, accent2],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(alignment: .leading, spacing: 24) {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(Color.white.opacity(0.10))
                    .frame(width: 66, height: 66)
                    .overlay(
                        CareLoopBrandView(style: .icon, iconSize: 54)
                    )

                VStack(alignment: .leading, spacing: 8) {
                    Text("Welcome back")
                        .font(.system(size: 42, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                    Text("Continue your care journey")
                        .font(.system(size: 19, weight: .medium, design: .rounded))
                        .foregroundStyle(.white.opacity(0.75))
                }
            }
            .padding(.horizontal, 40)
            .padding(.bottom, 38)
        }
        .frame(height: 240)
        .clipShape(HeroShape())
    }

    private var signInFields: some View {
        VStack(spacing: 18) {
            roundedInput("Email address", text: $signInEmail, contentType: .emailAddress, keyboardType: .emailAddress)
            roundedInput("Password", text: $signInPassword, secure: true, contentType: .password)
        }
    }

    private var forgotPassword: some View {
        HStack {
            Spacer()
            Button("Forgot password?") { }
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(accent)
        }
        .padding(.top, 12)
        .padding(.bottom, 14)
    }

    private var loginButton: some View {
        Button(action: submitSignInTapped) {
            HStack {
                Spacer()
                if loading {
                    ProgressView().tint(.white)
                } else {
                    Text("Log in")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                }
                Spacer()
            }
            .frame(height: 60)
            .background(
                LinearGradient(
                    colors: [accent, accent2],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .shadow(color: accent.opacity(0.22), radius: 18, y: 10)
        }
        .buttonStyle(.plain)
        .disabled(loading || !canSignIn)
        .opacity(loading || !canSignIn ? 0.6 : 1)
    }

    private var continueDivider: some View {
        HStack(spacing: 14) {
            Rectangle()
                .fill(inputBorder)
                .frame(height: 1)
            Text("or continue with")
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(secondaryText)
            Rectangle()
                .fill(inputBorder)
                .frame(height: 1)
        }
        .padding(.top, 16)
        .padding(.bottom, 14)
    }

    private var socialRow: some View {
        HStack(spacing: 14) {
            socialButton(.google)
            socialButton(.facebook)
            socialButton(.apple)
        }
    }

    private var footer: some View {
        HStack(spacing: 4) {
            Text("Don't have an account?")
                .foregroundStyle(secondaryText)
            Button("Sign up") {
                error = nil
                selectedProvider = .email
                showSignUp = true
            }
            .foregroundStyle(accent)
            .fontWeight(.bold)
        }
        .font(.system(size: 17, weight: .medium, design: .rounded))
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(pageBackground)
    }

    private func roundedInput(
        _ placeholder: String,
        text: Binding<String>,
        secure: Bool = false,
        contentType: UITextContentType? = nil,
        keyboardType: UIKeyboardType = .default
    ) -> some View {
        Group {
            if secure {
                SecureField(placeholder, text: text)
                    .textContentType(contentType)
            } else {
                TextField(placeholder, text: text)
                    .textContentType(contentType)
                    .keyboardType(keyboardType)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
        }
        .font(.system(size: 18, weight: .medium, design: .rounded))
        .padding(.horizontal, 24)
        .frame(height: 52)
        .background(Color.white)
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(inputBorder, lineWidth: 2)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private func socialButton(_ provider: AuthProvider) -> some View {
        Button {
            handleProviderTap(provider)
        } label: {
            ZStack {
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(Color.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(inputBorder, lineWidth: 2)
                    )

                switch provider {
                case .google:
                    Image("GoogleLogo")
                        .resizable()
                        .interpolation(.high)
                        .scaledToFit()
                        .frame(width: 28, height: 28)
                case .facebook:
                    Image("FacebookLogo")
                        .resizable()
                        .interpolation(.high)
                        .scaledToFit()
                        .frame(width: 28, height: 28)
                case .apple:
                    Image(systemName: "apple.logo")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(.black)
                case .email:
                    Image(systemName: "envelope.fill")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(accent2)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 60)
        }
        .buttonStyle(.plain)
        .disabled(loading)
    }

    private var signUpSheet: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Create account")
                        .font(.system(size: 34, weight: .bold, design: .rounded))

                    Text("Choose email or connect an auth provider.")
                        .font(.system(size: 16, weight: .medium, design: .rounded))
                        .foregroundStyle(secondaryText)

                    HStack(spacing: 16) {
                        signUpProviderButton(.email, label: "Email", systemImage: "envelope.fill")
                        signUpProviderButton(.google, label: "Google")
                    }

                    HStack(spacing: 16) {
                        signUpProviderButton(.facebook, label: "Facebook")
                        signUpProviderButton(.apple, label: "Apple", systemImage: "apple.logo")
                    }

                    Text(OnboardingValidation.helperText(for: selectedProvider))
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(secondaryText)

                    VStack(spacing: 16) {
                        signUpField("Your name", text: $createName)
                        signUpField("Email", text: $createEmail, contentType: .emailAddress, keyboardType: .emailAddress)
                        signUpField("Circle name", text: $createCircleName)
                        signUpField("Care recipient's name", text: $createRecipient)
                        signUpField("Password", text: $createPassword, secure: true, contentType: .newPassword)
                        signUpField("Re-enter password", text: $createConfirmPassword, secure: true, contentType: .newPassword)
                    }

                    if let error {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }

                    Button(action: submitCreateTapped) {
                        HStack {
                            Spacer()
                            if loading {
                                ProgressView().tint(.white)
                            } else {
                                Text("Create Circle")
                                    .font(.system(size: 19, weight: .bold, design: .rounded))
                            }
                            Spacer()
                        }
                        .frame(height: 62)
                        .background(
                            LinearGradient(
                                colors: [accent, accent2],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .disabled(loading || !canCreate)
                    .opacity(loading || !canCreate ? 0.6 : 1)
                }
                .padding(24)
            }
            .background(pageBackground.ignoresSafeArea())
        }
    }

    private func signUpProviderButton(
        _ provider: AuthProvider,
        label: String,
        systemImage: String? = nil
    ) -> some View {
        Button {
            handleProviderTap(provider)
        } label: {
            HStack(spacing: 10) {
                if provider == .google {
                    Image("GoogleLogo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 18, height: 18)
                } else if provider == .facebook {
                    Image("FacebookLogo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 18, height: 18)
                } else if let systemImage {
                    Image(systemName: systemImage)
                        .font(.system(size: 18, weight: .semibold))
                }

                Text(label)
                    .font(.system(size: 16, weight: .semibold, design: .rounded))
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(Color.white)
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(selectedProvider == provider ? accent : inputBorder, lineWidth: 2)
            )
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func signUpField(
        _ title: String,
        text: Binding<String>,
        secure: Bool = false,
        contentType: UITextContentType? = nil,
        keyboardType: UIKeyboardType = .default
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(secondaryText)

            Group {
                if secure {
                    SecureField("", text: text)
                        .textContentType(contentType)
                } else {
                    TextField("", text: text)
                        .textContentType(contentType)
                        .keyboardType(keyboardType)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }
            }
            .font(.system(size: 18, weight: .medium, design: .rounded))
            .padding(.horizontal, 20)
            .frame(height: 58)
            .background(Color.white)
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(inputBorder, lineWidth: 2)
            )
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
    }

    private var canSignIn: Bool {
        OnboardingValidation.signIn(email: signInEmail, password: signInPassword)
    }

    private var canCreate: Bool {
        OnboardingValidation.create(
            name: createName,
            email: createEmail,
            circleName: createCircleName,
            recipientName: createRecipient,
            password: createPassword,
            confirmPassword: createConfirmPassword
        )
    }

    private func handleProviderTap(_ provider: AuthProvider) {
        error = nil
        selectedProvider = provider

        guard provider != .email else {
            showSignUp = true
            return
        }

        loading = true
        Task {
            defer { loading = false }
            do {
                let payload = try await socialAuth.signIn(with: provider)
                showSignUp = true
                if let email = payload.email, !email.isEmpty {
                    createEmail = email
                }
                if let name = payload.name, !name.isEmpty {
                    createName = name
                }
            } catch let authError as SocialAuthError {
                error = authError.errorDescription
            } catch {
                self.error = error.localizedDescription
            }
        }
    }

    private func submitSignInTapped() {
        loading = true
        error = nil
        Task {
            do {
                try await submitSignIn()
            } catch let apiError as APIError {
                error = apiError.errorDescription
            } catch {
                self.error = error.localizedDescription
            }
            loading = false
        }
    }

    private func submitCreateTapped() {
        loading = true
        error = nil
        Task {
            do {
                try await submitCreate()
                showSignUp = false
            } catch let apiError as APIError {
                error = apiError.errorDescription
            } catch {
                self.error = error.localizedDescription
            }
            loading = false
        }
    }

    private func submitSignIn() async throws {
        guard OnboardingValidation.signIn(email: signInEmail, password: signInPassword) else {
            error = "Enter your email and a password with at least \(OnboardingValidation.minimumPasswordLength) characters."
            return
        }

        let user = try await APIClient.shared.fetchUserByEmail(signInEmail.trimmingCharacters(in: .whitespaces))
        let timezone = TimeZone.current.identifier
        _ = try? await APIClient.shared.updateTimezone(userId: user.id, timezone: timezone)
        appState.signIn(user: user, circle: user.memberships?.first?.circle)
    }

    private func submitCreate() async throws {
        guard OnboardingValidation.create(
            name: createName,
            email: createEmail,
            circleName: createCircleName,
            recipientName: createRecipient,
            password: createPassword,
            confirmPassword: createConfirmPassword
        ) else {
            error = "Create Circle requires all fields plus matching passwords."
            return
        }

        let user = try await APIClient.shared.createUser(
            email: createEmail.trimmingCharacters(in: .whitespaces),
            name: createName.trimmingCharacters(in: .whitespaces),
            phone: nil
        )
        let timezone = TimeZone.current.identifier
        _ = try? await APIClient.shared.updateTimezone(userId: user.id, timezone: timezone)
        let circle = try await APIClient.shared.createCircle(
            name: createCircleName.trimmingCharacters(in: .whitespaces),
            recipientName: createRecipient.trimmingCharacters(in: .whitespaces),
            creatorId: user.id
        )
        appState.signIn(user: user, circle: circle)
    }
}

private struct HeroShape: Shape {
    func path(in rect: CGRect) -> Path {
        let rounded = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: [.bottomLeft, .bottomRight],
            cornerRadii: CGSize(width: 48, height: 48)
        )
        return Path(rounded.cgPath)
    }
}
