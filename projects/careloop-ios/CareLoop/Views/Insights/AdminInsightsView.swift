import SwiftUI
import Charts

struct AdminInsightsView: View {
    @EnvironmentObject private var appState: AppState

    @State private var selectedPeriod = 7
    @State private var selectedRecipientId = "all"
    @State private var insights: CircleCompletionInsights?
    @State private var loading = true
    @State private var error: String?

    private let periodOptions = [7, 14, 30]

    var body: some View {
        List {
            if let circle = appState.activeCircle {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(circle.name)
                            .font(.system(size: 22, weight: .bold, design: .rounded))
                        Text(circle.recipientDisplaySummary.isEmpty
                             ? "Task completion overview for this circle."
                             : "Completion insight for \(circle.recipientDisplaySummary)'s care group.")
                            .font(.system(size: 14, weight: .medium, design: .rounded))
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                }
            }

            Section("Window") {
                Picker("Window", selection: $selectedPeriod) {
                    ForEach(periodOptions, id: \.self) { days in
                        Text("\(days) days").tag(days)
                    }
                }
                .pickerStyle(.segmented)
            }

            if recipientOptions.count > 1 {
                Section("Recipient") {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            recipientChip(id: "all", title: "All recipients")
                            ForEach(recipientOptions) { recipient in
                                recipientChip(id: recipient.id, title: recipient.name)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                }
            }

            if loading {
                Section {
                    HStack {
                        Spacer()
                        ProgressView()
                        Spacer()
                    }
                }
            } else if let error {
                Section {
                    Text(error)
                        .foregroundStyle(.red)
                        .font(.caption)
                }
            } else if let insights {
                Section("Overview") {
                    insightCard(title: "Completed", value: "\(insights.totals.completed)", tint: Color(red: 0.12, green: 0.68, blue: 0.49))
                    insightCard(title: "Active", value: "\(insights.totals.active)", tint: Color(red: 0.13, green: 0.56, blue: 0.87))
                    insightCard(title: "Overdue", value: "\(insights.totals.overdue)", tint: insights.totals.overdue > 0 ? .red : .secondary)
                }

                Section("Completed by day") {
                    Chart(insights.completedByDay) { day in
                        BarMark(
                            x: .value("Day", day.shortLabel),
                            y: .value("Completed", day.count)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color(red: 0.16, green: 0.80, blue: 0.72), Color(red: 0.13, green: 0.56, blue: 0.87)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .cornerRadius(6)
                    }
                    .chartYAxis {
                        AxisMarks(position: .leading)
                    }
                    .frame(height: 220)

                    if insights.completedByDay.allSatisfy({ $0.count == 0 }) {
                        Text("No completed tasks in this window yet.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }

                Section("Top caregivers") {
                    if insights.topCaregivers.isEmpty {
                        Text("No completions recorded yet.")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(insights.topCaregivers) { caregiver in
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(caregiver.name)
                                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                                    Text(caregiver.email)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text("\(caregiver.completedCount)")
                                    .font(.system(size: 18, weight: .bold, design: .rounded))
                                    .foregroundStyle(Color(red: 0.13, green: 0.56, blue: 0.87))
                            }
                            .padding(.vertical, 2)
                        }
                    }
                }

                if !insights.recipientBreakdown.isEmpty {
                    Section("By recipient") {
                        ForEach(insights.recipientBreakdown) { recipient in
                            VStack(alignment: .leading, spacing: 8) {
                                Text(recipient.name)
                                    .font(.system(size: 16, weight: .bold, design: .rounded))
                                HStack {
                                    insightMini(label: "Done", value: recipient.completed, tint: Color(red: 0.12, green: 0.68, blue: 0.49))
                                    insightMini(label: "Active", value: recipient.active, tint: Color(red: 0.13, green: 0.56, blue: 0.87))
                                    insightMini(label: "Overdue", value: recipient.overdue, tint: recipient.overdue > 0 ? .red : .secondary)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
        }
        .navigationTitle("Completion Insights")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadInsights() }
        .onChange(of: selectedPeriod) { _ in
            Task { await loadInsights() }
        }
        .onChange(of: selectedRecipientId) { _ in
            Task { await loadInsights() }
        }
        .careLoopBrandBanner()
    }

    private var recipientOptions: [CareRecipient] {
        appState.activeCircle?.recipients ?? []
    }

    @ViewBuilder
    private func insightCard(title: String, value: String, tint: Color) -> some View {
        HStack {
            Text(title)
                .font(.system(size: 15, weight: .semibold, design: .rounded))
            Spacer()
            Text(value)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(tint)
        }
        .padding(.vertical, 4)
    }

    @ViewBuilder
    private func insightMini(label: String, value: Int, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("\(value)")
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(tint)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private func recipientChip(id: String, title: String) -> some View {
        let isSelected = selectedRecipientId == id
        Button {
            selectedRecipientId = id
        } label: {
            Text(title)
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(isSelected ? .white : Color(red: 0.23, green: 0.33, blue: 0.44))
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    Capsule(style: .continuous)
                        .fill(
                            isSelected
                            ? LinearGradient(
                                colors: [Color(red: 0.16, green: 0.80, blue: 0.72), Color(red: 0.13, green: 0.56, blue: 0.87)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                            : LinearGradient(
                                colors: [Color.white],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                )
                .overlay(
                    Capsule(style: .continuous)
                        .stroke(Color(red: 0.84, green: 0.89, blue: 0.94), lineWidth: isSelected ? 0 : 1.5)
                )
        }
        .buttonStyle(.plain)
    }

    private func loadInsights() async {
        guard let circleId = appState.activeCircle?.id else {
            loading = false
            insights = nil
            return
        }

        loading = true
        error = nil
        do {
            insights = try await APIClient.shared.fetchCompletionInsights(
                circleId: circleId,
                days: selectedPeriod,
                recipientId: selectedRecipientId == "all" ? nil : selectedRecipientId
            )
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}
