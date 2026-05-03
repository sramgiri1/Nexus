import SwiftUI

struct ActivityFeedView: View {
    @EnvironmentObject private var appState: AppState

    @State private var events:  [CircleEvent] = []
    @State private var loading  = true
    @State private var error:   String?

    private let mid  = Color(red: 0.43, green: 0.50, blue: 0.60)
    private let dark = Color(red: 0.10, green: 0.16, blue: 0.24)
    private let bg   = Color(red: 0.95, green: 0.96, blue: 0.99)

    private var visibleEvents: [CircleEvent] {
        events.filter(\.isVisible)
    }

    private var grouped: [(String, [CircleEvent])] {
        let fmt = DateFormatter()
        fmt.dateStyle = .medium
        fmt.timeStyle = .none
        // Sort descending so newest section appears first
        let sorted = visibleEvents.sorted { $0.createdAt > $1.createdAt }
        var result: [(String, [CircleEvent])] = []
        var seen: [String: Int] = [:]
        for event in sorted {
            let key = Calendar.current.isDateInToday(event.createdAt)     ? "Today"
                    : Calendar.current.isDateInYesterday(event.createdAt) ? "Yesterday"
                    : fmt.string(from: event.createdAt)
            if let idx = seen[key] {
                result[idx].1.append(event)
            } else {
                seen[key] = result.count
                result.append((key, [event]))
            }
        }
        return result
    }

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error {
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.circle")
                            .font(.system(size: 36))
                            .foregroundStyle(.red)
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                        Button("Retry") { Task { await load() } }
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .padding(40)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if visibleEvents.isEmpty {
                    emptyState
                } else {
                    List {
                        ForEach(grouped, id: \.0) { section, sectionEvents in
                            Section(section) {
                                ForEach(sectionEvents) { event in
                                    eventRow(event)
                                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                                }
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Activity")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await load() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .background(bg.ignoresSafeArea())
            .task { await load() }
        }
        .careLoopBrandBanner()
    }

    private var emptyState: some View {
        VStack(spacing: 14) {
            Image(systemName: "clock.badge.checkmark")
                .font(.system(size: 44))
                .foregroundStyle(mid)
            Text("No activity yet")
                .font(.system(size: 17, weight: .semibold, design: .rounded))
                .foregroundStyle(dark)
            Text("Actions taken in this circle will appear here.")
                .font(.system(size: 14))
                .foregroundStyle(mid)
                .multilineTextAlignment(.center)
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    @ViewBuilder
    private func eventRow(_ event: CircleEvent) -> some View {
        let c = event.feedIconColor
        let iconColor = Color(red: c.red, green: c.green, blue: c.blue)
        HStack(alignment: .center, spacing: 12) {
            Image(systemName: event.feedIcon)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(iconColor)
                .frame(width: 28)

            VStack(alignment: .leading, spacing: 3) {
                Text(event.feedDescription)
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(dark)
                    .lineLimit(2)
                Text(timeLabel(event.createdAt))
                    .font(.system(size: 12))
                    .foregroundStyle(mid)
            }
        }
    }

    private func timeLabel(_ date: Date) -> String {
        if Calendar.current.isDateInToday(date) {
            return date.formatted(date: .omitted, time: .shortened)
        }
        if Calendar.current.isDateInYesterday(date) {
            return "Yesterday at \(date.formatted(date: .omitted, time: .shortened))"
        }
        return date.formatted(date: .abbreviated, time: .shortened)
    }

    private func load() async {
        guard let circleId = appState.activeCircle?.id else {
            loading = false
            return
        }
        loading = true
        error = nil
        do {
            events = try await APIClient.shared.fetchEvents(circleId: circleId)
        } catch {
            self.error = error.localizedDescription
        }
        loading = false
    }
}
