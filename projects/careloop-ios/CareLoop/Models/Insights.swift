import Foundation

struct CircleCompletionInsights: Codable {
    let periodDays: Int
    let selectedRecipientId: String?
    let completedByDay: [CompletedTaskDay]
    let topCaregivers: [TopCaregiverInsight]
    let recipientBreakdown: [RecipientCompletionInsight]
    let totals: CompletionInsightTotals
}

struct RecipientCompletionInsight: Codable, Identifiable {
    let recipientId: String
    let name: String
    let completed: Int
    let active: Int
    let overdue: Int

    var id: String { recipientId }
}

struct CompletedTaskDay: Codable, Identifiable {
    let date: String
    let count: Int

    var id: String { date }

    var shortLabel: String {
        Self.displayFormatter.string(from: parsedDate ?? Date())
    }

    private var parsedDate: Date? {
        Self.sourceFormatter.date(from: date)
    }

    private static let sourceFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .iso8601)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    private static let displayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.setLocalizedDateFormatFromTemplate("MMM d")
        return formatter
    }()
}

struct TopCaregiverInsight: Codable, Identifiable {
    let userId: String
    let name: String
    let email: String
    let completedCount: Int

    var id: String { userId }
}

struct CompletionInsightTotals: Codable {
    let completed: Int
    let active: Int
    let overdue: Int
}
