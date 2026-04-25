import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    @State private var name     = ""
    @State private var email    = ""
    @State private var circleId = ""
    @State private var error: String?
    @State private var loading  = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()
                Image(systemName: "heart.circle.fill")
                    .font(.system(size: 64))
                    .foregroundColor(.green)
                Text("CareLoop")
                    .font(.largeTitle.bold())
                Text("Coordinate care without the chaos.")
                    .foregroundColor(.secondary)

                Spacer()

                VStack(spacing: 12) {
                    TextField("Your name", text: $name)
                        .textFieldStyle(.roundedBorder)
                    TextField("Email", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    TextField("Care circle ID (ask your admin)", text: $circleId)
                        .textFieldStyle(.roundedBorder)
                        .autocapitalization(.none)
                }

                if let error { Text(error).foregroundColor(.red).font(.caption) }

                Button(action: join) {
                    Group {
                        if loading { ProgressView() }
                        else { Text("Join Circle").bold() }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(loading || name.isEmpty || email.isEmpty || circleId.isEmpty)

                Spacer()
            }
            .padding()
        }
    }

    private func join() {
        loading = true; error = nil
        Task {
            do {
                let user   = try await APIClient.shared.createUser(email: email, name: name, phone: nil)
                let _      = try await APIClient.shared.addMember(circleId: circleId, userId: user.id)
                let circle = try await APIClient.shared.fetchCircle(id: circleId)
                appState.signIn(user: user, circle: circle)
            } catch {
                self.error = error.localizedDescription
            }
            loading = false
        }
    }
}
