import SwiftUI

struct RecipientManagementView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var showEditor = false
    @State private var editingRecipient: CareRecipient?
    @State private var error: String?
    @State private var loadingRecipientId: String?
    @State private var reorderingRecipientId: String?

    private var recipients: [CareRecipient] {
        appState.activeCircle?.orderedRecipients ?? []
    }

    var body: some View {
        NavigationStack {
            List {
                Section("Care Recipients") {
                    ForEach(recipients) { recipient in
                        recipientRow(recipient)
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button {
                                    editingRecipient = recipient
                                    showEditor = true
                                } label: {
                                    Label("Edit", systemImage: "pencil")
                                }
                                .tint(.blue)

                                Button(role: .destructive) {
                                    Task { await removeRecipient(recipient) }
                                } label: {
                                    Label("Remove", systemImage: "trash")
                                }
                            }
                    }
                }

                if let error {
                    Section {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("Care Recipients")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        editingRecipient = nil
                        showEditor = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showEditor) {
                RecipientEditorView(recipient: editingRecipient) { name, relationship, notes in
                    Task { await saveRecipient(name: name, relationship: relationship, notes: notes) }
                }
            }
        }
        .careLoopBrandBanner()
    }

    @ViewBuilder
    private func recipientRow(_ recipient: CareRecipient) -> some View {
        let index = recipients.firstIndex(where: { $0.id == recipient.id }) ?? 0
        let canMoveUp = index > 0
        let canMoveDown = index < recipients.count - 1

        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text(recipient.name)
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                    if recipient.isPrimary {
                        Text("Primary")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundStyle(Color(red: 0.13, green: 0.56, blue: 0.87))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                Capsule()
                                    .fill(Color(red: 0.88, green: 0.95, blue: 1.0))
                            )
                    }
                }

                if let relationship = recipient.relationship, !relationship.isEmpty {
                    Text(relationship)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Text(recipient.isPrimary ? "Primary care recipient" : "Additional care recipient")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if loadingRecipientId == recipient.id || reorderingRecipientId == recipient.id {
                ProgressView()
                    .scaleEffect(0.85)
            } else {
                VStack(spacing: 8) {
                    Button {
                        Task { await makePrimary(recipient) }
                    } label: {
                        Image(systemName: recipient.isPrimary ? "star.fill" : "star")
                            .foregroundStyle(recipient.isPrimary ? .yellow : .secondary)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(recipient.isPrimary ? "Primary recipient" : "Make primary recipient")

                    HStack(spacing: 10) {
                        Button {
                            Task { await moveRecipient(recipient, offset: -1) }
                        } label: {
                            Image(systemName: "arrow.up")
                        }
                        .buttonStyle(.plain)
                        .disabled(!canMoveUp)

                        Button {
                            Task { await moveRecipient(recipient, offset: 1) }
                        } label: {
                            Image(systemName: "arrow.down")
                        }
                        .buttonStyle(.plain)
                        .disabled(!canMoveDown)
                    }
                    .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }

    private func saveRecipient(name: String, relationship: String?, notes: String?) async {
        guard let circle = appState.activeCircle,
              let userId = appState.currentUser?.id else { return }

        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty else { return }

        loadingRecipientId = editingRecipient?.id ?? "new"
        error = nil
        defer { loadingRecipientId = nil }

        do {
            if let editingRecipient {
                _ = try await APIClient.shared.updateRecipient(
                    circleId: circle.id,
                    recipientId: editingRecipient.id,
                    userId: userId,
                    name: trimmedName,
                    relationship: relationship?.trimmingCharacters(in: .whitespacesAndNewlines),
                    notes: notes?.trimmingCharacters(in: .whitespacesAndNewlines)
                )
            } else {
                _ = try await APIClient.shared.createRecipient(
                    circleId: circle.id,
                    userId: userId,
                    name: trimmedName,
                    relationship: relationship?.trimmingCharacters(in: .whitespacesAndNewlines),
                    notes: notes?.trimmingCharacters(in: .whitespacesAndNewlines)
                )
            }
            try await appState.activateCircle(id: circle.id)
            showEditor = false
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func makePrimary(_ recipient: CareRecipient) async {
        guard let circle = appState.activeCircle,
              let userId = appState.currentUser?.id,
              !recipient.isPrimary else { return }

        loadingRecipientId = recipient.id
        error = nil
        defer { loadingRecipientId = nil }

        do {
            _ = try await APIClient.shared.updateRecipient(
                circleId: circle.id,
                recipientId: recipient.id,
                userId: userId,
                name: recipient.name,
                relationship: recipient.relationship,
                notes: recipient.notes,
                isPrimary: true
            )
            try await appState.activateCircle(id: circle.id)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func moveRecipient(_ recipient: CareRecipient, offset: Int) async {
        guard let circle = appState.activeCircle,
              let userId = appState.currentUser?.id,
              let index = recipients.firstIndex(where: { $0.id == recipient.id }) else { return }

        let destination = index + offset
        guard destination >= 0, destination < recipients.count else { return }

        var orderedIds = recipients.map(\.id)
        let movedId = orderedIds.remove(at: index)
        orderedIds.insert(movedId, at: destination)

        reorderingRecipientId = recipient.id
        error = nil
        defer { reorderingRecipientId = nil }

        do {
            _ = try await APIClient.shared.reorderRecipients(
                circleId: circle.id,
                userId: userId,
                recipientIds: orderedIds,
                primaryRecipientId: recipients.first(where: { $0.isPrimary })?.id
            )
            try await appState.activateCircle(id: circle.id)
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func removeRecipient(_ recipient: CareRecipient) async {
        guard let circle = appState.activeCircle,
              let userId = appState.currentUser?.id else { return }

        loadingRecipientId = recipient.id
        error = nil
        defer { loadingRecipientId = nil }

        do {
            try await APIClient.shared.deleteRecipient(circleId: circle.id, recipientId: recipient.id, userId: userId)
            try await appState.activateCircle(id: circle.id)
        } catch {
            self.error = error.localizedDescription
        }
    }
}

private struct RecipientEditorView: View {
    let recipient: CareRecipient?
    let onSave: (_ name: String, _ relationship: String?, _ notes: String?) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var name: String
    @State private var relationship: String
    @State private var notes: String

    init(recipient: CareRecipient?, onSave: @escaping (_ name: String, _ relationship: String?, _ notes: String?) -> Void) {
        self.recipient = recipient
        self.onSave = onSave
        _name = State(initialValue: recipient?.name ?? "")
        _relationship = State(initialValue: recipient?.relationship ?? "")
        _notes = State(initialValue: recipient?.notes ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(recipient == nil ? "New Recipient" : "Recipient") {
                    TextField("Name", text: $name)
                    TextField("Relationship (optional)", text: $relationship)
                    TextField("Notes (optional)", text: $notes, axis: .vertical)
                        .lineLimit(2...4)
                }
            }
            .navigationTitle(recipient == nil ? "Add Recipient" : "Edit Recipient")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onSave(
                            name,
                            relationship.isEmpty ? nil : relationship,
                            notes.isEmpty ? nil : notes
                        )
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}
