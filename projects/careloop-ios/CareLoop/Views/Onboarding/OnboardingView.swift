import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    @State private var name     = ""
    @State private var email    = ""
    @State private var mode: Mode = .join
    @State private var circleId        = ""
    @State private var circleName      = ""
    @State private var recipientName   = ""
    @State private var error: String?
    @State private var loading  = false

    enum Mode { case join, create }

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

                Picker("Mode", selection: $mode) {
                    Text("Join a Circle").tag(Mode.join)
                    Text("Create a Circle").tag(Mode.create)
                }
                .pickerStyle(.segmented)

                VStack(spacing: 12) {
                    TextField("Your name", text: $name)
                        .textFieldStyle(.roundedBorder)
                    TextField("Email", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)

                    if mode == .join {
                        TextField("Circle ID (ask your Admin)", text: $circleId)
                            .textFieldStyle(.roundedBorder)
                            .autocapitalization(.none)
                    } else {
                        TextField("Circle name (e.g. \"Smith Family\")", text: $circleName)
                            .textFieldStyle(.roundedBorder)
                        TextField("Care recipient's name", text: $recipientName)
                            .textFieldStyle(.roundedBorder)
                    }
                }

                if let error { Text(error).foregroundColor(.red).font(.caption) }

                Button(action: submit) {
                    Group {
                        if loading { ProgressView() }
                        else { Text(mode == .join ? "Join Circle" : "Create Circle").bold() }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(loading || !isValid)

                Spacer()
            }
            .padding()
        }
    }

    private var isValid: Bool {
        guard !name.isEmpty && !email.isEmpty else { return false }
        if mode == .join  { return !circleId.isEmpty }
        if mode == .create { return !circleName.isEmpty && !recipientName.isEmpty }
        return false
    }

    private func submit() {
        loading = true; error = nil
        Task {
            do {
                let user = try await APIClient.shared.createUser(email: email, name: name, phone: nil)
                let tz = TimeZone.current.identifier.isEmpty ? "America/New_York" : TimeZone.current.identifier
                _ = try? await APIClient.shared.updateTimezone(userId: user.id, timezone: tz)
                let circle: CareCircle
                if mode == .create {
                    circle = try await APIClient.shared.createCircle(name: circleName, recipientName: recipientName, creatorId: user.id)
                } else {
                    _ = try await APIClient.shared.addMember(circleId: circleId, userId: user.id)
                    circle = try await APIClient.shared.fetchCircle(id: circleId)
                }
                appState.signIn(user: user, circle: circle)
            } catch {
                self.error = error.localizedDescription
            }
            loading = false
        }
    }
}
