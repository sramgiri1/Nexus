import SwiftUI
import StoreKit

struct PaywallView: View {
    let circleId: String
    let recipient: CareRecipient

    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var store = SubscriptionManager.shared

    @State private var isYearly = true
    @State private var isSyncingEntitlement = false
    @State private var syncError: String?

    private let features: [(icon: String, title: String)] = [
        ("arrow.clockwise", "Recurring routines for this care receiver"),
        ("chart.bar.fill", "Receiver-scoped completion insights"),
        ("person.3.fill", "Unlimited caregiver access"),
        ("bell.badge.fill", "Advanced coordination and reminders"),
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                background
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 24) {
                        heroSection
                            .padding(.top, 24)
                        featuresSection
                        planSelectorSection
                            .padding(.horizontal, 22)
                        ctaSection
                            .padding(.horizontal, 22)
                        footerSection
                            .padding(.horizontal, 22)
                            .padding(.bottom, 44)
                    }
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.65))
                            .frame(width: 30, height: 30)
                            .background(Circle().fill(.white.opacity(0.10)))
                    }
                    .accessibilityLabel("Close")
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
        .accessibilityIdentifier("receiver-paywall-screen")
    }

    private var background: some View {
        LinearGradient(
            stops: [
                .init(color: Color(red: 0.04, green: 0.08, blue: 0.20), location: 0),
                .init(color: Color(red: 0.06, green: 0.14, blue: 0.30), location: 0.55),
                .init(color: Color(red: 0.04, green: 0.10, blue: 0.22), location: 1),
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .ignoresSafeArea()
    }

    private var heroSection: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color(red: 0.16, green: 0.80, blue: 0.72), Color(red: 0.13, green: 0.56, blue: 0.87)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 78, height: 78)
                    .shadow(color: Color(red: 0.16, green: 0.80, blue: 0.72).opacity(0.50), radius: 22, x: 0, y: 6)
                Image(systemName: "crown.fill")
                    .font(.system(size: 30))
                    .foregroundStyle(.white)
            }

            VStack(spacing: 8) {
                Text(ReceiverPremiumPolicy.upgradePromptTitle(for: recipient))
                    .font(.system(size: 26, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                Text("Premium applies only to \(recipient.name)’s care workflow inside this Care Circle.")
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(.white.opacity(0.68))
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
            }

            HStack(spacing: 8) {
                statusChip(title: recipient.name, tint: Color(red: 0.16, green: 0.80, blue: 0.72))
                statusChip(title: recipient.caregiverAccessSummary, tint: Color(red: 0.13, green: 0.56, blue: 0.87))
            }
        }
        .padding(.horizontal, 28)
    }

    private func statusChip(title: String, tint: Color) -> some View {
        Text(title)
            .font(.system(size: 11, weight: .bold, design: .rounded))
            .foregroundStyle(tint)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Capsule().fill(tint.opacity(0.15)))
    }

    private var featuresSection: some View {
        VStack(spacing: 0) {
            ForEach(Array(features.enumerated()), id: \.offset) { index, item in
                HStack(spacing: 14) {
                    Image(systemName: item.icon)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Color(red: 0.16, green: 0.80, blue: 0.72))
                        .frame(width: 24, alignment: .center)
                    Text(item.title)
                        .font(.system(size: 15, weight: .medium, design: .rounded))
                        .foregroundStyle(.white.opacity(0.85))
                    Spacer()
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 15))
                        .foregroundStyle(Color(red: 0.16, green: 0.80, blue: 0.72).opacity(0.90))
                }
                .padding(.vertical, 11)
                .padding(.horizontal, 24)

                if index < features.count - 1 {
                    Rectangle()
                        .fill(.white.opacity(0.07))
                        .frame(height: 1)
                        .padding(.horizontal, 24)
                }
            }
        }
    }

    private var planSelectorSection: some View {
        VStack(spacing: 10) {
            Text("Choose a plan")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(.white.opacity(0.45))
                .frame(maxWidth: .infinity, alignment: .leading)
                .textCase(.uppercase)
                .tracking(0.6)

            HStack(spacing: 12) {
                planCard(yearly: false)
                planCard(yearly: true)
            }
        }
    }

    @ViewBuilder
    private func planCard(yearly: Bool) -> some View {
        let selected = isYearly == yearly
        let product = store.product(yearly: yearly)
        let price = product?.displayPrice ?? (yearly ? "$39.99" : "$4.99")
        let period = yearly ? "/ year" : "/ month"

        Button { isYearly = yearly } label: {
            VStack(spacing: 6) {
                if yearly {
                    Text("Best Value")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundStyle(selected ? Color(red: 0.04, green: 0.08, blue: 0.20) : Color(red: 0.16, green: 0.80, blue: 0.72))
                        .padding(.horizontal, 9)
                        .padding(.vertical, 3)
                        .background(Capsule().fill(selected ? Color(red: 0.16, green: 0.80, blue: 0.72) : Color(red: 0.16, green: 0.80, blue: 0.72).opacity(0.18)))
                } else {
                    Spacer().frame(height: 20)
                }

                Text(yearly ? "Yearly" : "Monthly")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(selected ? .white : .white.opacity(0.55))
                Text(price)
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(selected ? .white : .white.opacity(0.70))
                Text(period)
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(selected ? .white.opacity(0.65) : .white.opacity(0.35))
            }
            .padding(.vertical, 16)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(
                        selected
                        ? AnyShapeStyle(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.16, green: 0.80, blue: 0.72).opacity(0.20),
                                    Color(red: 0.13, green: 0.56, blue: 0.87).opacity(0.20),
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        : AnyShapeStyle(Color.white.opacity(0.05))
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(
                        selected
                        ? Color(red: 0.16, green: 0.80, blue: 0.72).opacity(0.65)
                        : Color.white.opacity(0.10),
                        lineWidth: selected ? 1.5 : 1
                    )
            )
        }
        .buttonStyle(.plain)
    }

    private var ctaSection: some View {
        VStack(spacing: 12) {
            let product = store.product(yearly: isYearly)
            let hasOffer = store.introOffer(yearly: isYearly) != nil
            let ctaLabel = hasOffer ? "Start Free Trial" : "Unlock Premium"
            let isProductLoading = store.isLoading || isSyncingEntitlement || (product == nil && store.storeError == nil)

            Button {
                if let product {
                    Task { await purchaseAndSync(product) }
                }
            } label: {
                Group {
                    if isProductLoading {
                        ProgressView().tint(.white)
                    } else {
                        Text(ctaLabel)
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.16, green: 0.80, blue: 0.72),
                                    Color(red: 0.13, green: 0.56, blue: 0.87),
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .shadow(color: Color(red: 0.16, green: 0.80, blue: 0.72).opacity(0.38), radius: 14, x: 0, y: 5)
                )
                .foregroundStyle(.white)
                .opacity(isProductLoading ? 0.75 : 1.0)
            }
            .disabled(isProductLoading || product == nil)

            if let syncError {
                Text(syncError)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(Color(red: 1.0, green: 0.45, blue: 0.45))
                    .multilineTextAlignment(.center)
            } else if let storeError = store.storeError {
                Text(storeError)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(Color(red: 1.0, green: 0.45, blue: 0.45))
                    .multilineTextAlignment(.center)
            }
        }
    }

    private var footerSection: some View {
        VStack(spacing: 16) {
            Text(disclosureText)
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundStyle(.white.opacity(0.38))
                .multilineTextAlignment(.center)
                .lineSpacing(2)

            if let msg = store.restoreMessage {
                Text(msg)
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(store.isPremium ? Color(red: 0.16, green: 0.80, blue: 0.72) : .white.opacity(0.55))
                    .multilineTextAlignment(.center)
            }

            Button {
                Task { await restoreAndSync() }
            } label: {
                Text("Restore Purchases")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white.opacity(store.isLoading || isSyncingEntitlement ? 0.30 : 0.50))
                    .underline()
            }
            .disabled(store.isLoading || isSyncingEntitlement)

            Text("Premium is managed per care receiver. Unlocking \(recipient.name) does not automatically upgrade other care receivers in this Care Circle.")
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundStyle(.white.opacity(0.32))
                .multilineTextAlignment(.center)
        }
    }

    private var disclosureText: String {
        let product = store.product(yearly: isYearly)
        let price = product?.displayPrice ?? (isYearly ? "$39.99" : "$4.99")
        let period = isYearly ? "year" : "month"

        if let offer = store.introOffer(yearly: isYearly) {
            let n = offer.period.value
            let unit: String
            switch offer.period.unit {
            case .day: unit = n == 1 ? "day" : "days"
            case .week: unit = n == 1 ? "week" : "weeks"
            case .month: unit = n == 1 ? "month" : "months"
            case .year: unit = n == 1 ? "year" : "years"
            @unknown default: unit = "period"
            }
            return "\(n)-\(unit) free trial, then \(price)/\(period). Auto-renews unless cancelled at least 24 hours before the period ends. Cancel anytime in App Store Settings › Subscriptions."
        }
        return "Billed \(price)/\(period). Auto-renews unless cancelled at least 24 hours before the period ends. Cancel anytime in App Store Settings › Subscriptions."
    }

    private func purchaseAndSync(_ product: Product) async {
        syncError = nil
        await store.purchase(product)
        guard let purchase = store.latestPurchaseSnapshot else {
            return
        }
        await syncEntitlement(
            productId: purchase.productId,
            originalTransactionId: String(purchase.originalTransactionId),
            expiresAt: purchase.expirationDate
        )
    }

    private func restoreAndSync() async {
        syncError = nil
        await store.restorePurchases()
        guard let purchase = store.latestPurchaseSnapshot else {
            return
        }
        await syncEntitlement(
            productId: purchase.productId,
            originalTransactionId: String(purchase.originalTransactionId),
            expiresAt: purchase.expirationDate
        )
    }

    private func syncEntitlement(productId: String, originalTransactionId: String, expiresAt: Date?) async {
        isSyncingEntitlement = true
        defer { isSyncingEntitlement = false }

        do {
            _ = try await APIClient.shared.syncRecipientPremium(
                circleId: circleId,
                recipientId: recipient.id,
                expiresAt: expiresAt,
                appleOriginalTransactionId: originalTransactionId,
                appleProductId: productId
            )
            try await appState.activateCircle(id: circleId)
            dismiss()
        } catch {
            syncError = error.localizedDescription
        }
    }
}
