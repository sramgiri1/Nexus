import SwiftUI

struct JoinCircleView: View {
    @EnvironmentObject var appState: AppState

    @State private var circleId = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var loading = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 24) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Join Circle")
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                        Text("Enter the circle ID from your admin to connect your account.")
                            .font(.system(size: 16, weight: .medium, design: .rounded))
                            .foregroundStyle(.secondary)
                    }

                    VStack(alignment: .leading, spacing: 14) {
                        field("Circle ID", text: $circleId)
                        secureField("Password", text: $password)
                        secureField("Re-enter password", text: $confirmPassword)
                    }
                    .padding(20)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))

                    if let error {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }

                    Button(action: submit) {
                        HStack {
                            Spacer()
                            if loading {
                                ProgressView().tint(.white)
                            } else {
                                Text("Join Circle")
                                    .font(.system(size: 18, weight: .bold, design: .rounded))
                            }
                            Spacer()
                        }
                        .padding(.vertical, 18)
                        .background(Color.green)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .disabled(loading || !isValid)
                    .opacity(loading || !isValid ? 0.6 : 1)
                }
                .padding(22)
            }
            .background(Color(red: 0.95, green: 0.95, blue: 0.97).ignoresSafeArea())
            .navigationTitle("Join Circle")
            .navigationBarTitleDisplayMode(.inline)
        }
        .careLoopBrandBanner()
    }

    private var isValid: Bool {
        guard let user = appState.currentUser else { return false }
        return OnboardingValidation.join(
            name: user.name,
            email: user.email,
            circleId: circleId,
            password: password,
            confirmPassword: confirmPassword
        )
    }

    private func submit() {
        guard let user = appState.currentUser else { return }
        loading = true
        error = nil

        Task {
            do {
                _ = try await APIClient.shared.addMember(
                    circleId: circleId.trimmingCharacters(in: .whitespacesAndNewlines),
                    userId: user.id
                )
                let circle = try await APIClient.shared.fetchCircle(
                    id: circleId.trimmingCharacters(in: .whitespacesAndNewlines)
                )
                appState.attachCircle(circle)
            } catch {
                self.error = error.localizedDescription
            }
            loading = false
        }
    }

    private func field(_ title: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(.secondary)
            TextField("", text: text)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .font(.system(size: 20, weight: .medium, design: .rounded))
                .padding(.horizontal, 18)
                .padding(.vertical, 18)
                .background(Color(red: 0.97, green: 0.97, blue: 0.98))
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        }
    }

    private func secureField(_ title: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(.secondary)
            SecureField("", text: text)
                .font(.system(size: 20, weight: .medium, design: .rounded))
                .padding(.horizontal, 18)
                .padding(.vertical, 18)
                .background(Color(red: 0.97, green: 0.97, blue: 0.98))
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        }
    }
}
