import SwiftUI

struct CircleSettingsView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var name:          String
    @State private var recipientName: String
    @State private var loading        = false
    @State private var error:         String?

    init(circle: CareCircle) {
        _name          = State(initialValue: circle.name)
        _recipientName = State(initialValue: circle.recipientName)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Circle") {
                    TextField("Circle name", text: $name)
                    TextField("Who you're caring for", text: $recipientName)
                }
                if let error {
                    Section { Text(error).foregroundColor(.red).font(.caption) }
                }
            }
            .navigationTitle("Circle Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await save() } }
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty
                                  || recipientName.trimmingCharacters(in: .whitespaces).isEmpty
                                  || loading)
                }
            }
        }
        .careLoopBrandBanner()
    }

    private func save() async {
        guard let circle = appState.activeCircle,
              let userId = appState.currentUser?.id else { return }
        loading = true
        error   = nil
        do {
            let updated = try await APIClient.shared.updateCircle(
                id:            circle.id,
                userId:        userId,
                name:          name.trimmingCharacters(in: .whitespaces),
                recipientName: recipientName.trimmingCharacters(in: .whitespaces)
            )
            appState.activeCircle = updated
            dismiss()
        } catch { self.error = error.localizedDescription }
        loading = false
    }
}
