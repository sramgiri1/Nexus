import StoreKit
import UIKit

@MainActor
final class SubscriptionManager: ObservableObject {

    static let shared = SubscriptionManager()

    static let monthlyID = "com.careloop.ios.premium.monthly"
    static let yearlyID  = "com.careloop.ios.premium.yearly"

    @Published private(set) var products: [Product] = []
    @Published private(set) var isPremium = false
    @Published private(set) var activeTransaction: Transaction?
    @Published private(set) var isLoading  = false
    @Published private(set) var storeError: String?
    @Published private(set) var restoreMessage: String?

    private var transactionTask: Task<Void, Never>?

    private init() {
        transactionTask = observeTransactionUpdates()
        Task {
            isLoading = true
            await loadProducts()
            await refreshEntitlements()
            isLoading = false
        }
    }

    deinit { transactionTask?.cancel() }

    // MARK: – Convenience

    var monthlyProduct: Product? { products.first { $0.id == Self.monthlyID } }
    var yearlyProduct:  Product? { products.first { $0.id == Self.yearlyID  } }
    var renewalDate:    Date?    { activeTransaction?.expirationDate }

    func product(yearly: Bool) -> Product? { yearly ? yearlyProduct : monthlyProduct }

    func introOffer(yearly: Bool) -> Product.SubscriptionOffer? {
        product(yearly: yearly)?.subscription?.introductoryOffer
    }

    // MARK: – Actions

    func purchase(_ product: Product) async {
        storeError = nil
        isLoading = true
        defer { isLoading = false }
        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                let tx = try verified(verification)
                await tx.finish()
                await refreshEntitlements()
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            case .userCancelled, .pending:
                break
            @unknown default:
                break
            }
        } catch {
            storeError = error.localizedDescription
        }
    }

    func restorePurchases() async {
        storeError = nil
        restoreMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            try await AppStore.sync()
            await refreshEntitlements()
            restoreMessage = isPremium
                ? "Your subscription has been restored."
                : "No active subscription found on this Apple ID."
        } catch {
            storeError = error.localizedDescription
        }
    }

    func openSubscriptionManagement() {
        Task { [weak self] in
            guard let self else { return }
            guard let scene = UIApplication.shared
                .connectedScenes.compactMap({ $0 as? UIWindowScene }).first
            else { return }
            do {
                try await AppStore.showManageSubscriptions(in: scene)
            } catch {
                storeError = error.localizedDescription
            }
        }
    }

    // MARK: – Private

    private func loadProducts() async {
        do {
            products = try await Product.products(for: [Self.monthlyID, Self.yearlyID])
                .sorted { $0.price < $1.price }
        } catch {
            storeError = "Unable to load subscription options."
        }
    }

    private func refreshEntitlements() async {
        var hasPremium = false
        var latest: Transaction?

        for await result in Transaction.currentEntitlements {
            guard let tx = try? verified(result) else { continue }
            guard tx.productID == Self.monthlyID || tx.productID == Self.yearlyID else { continue }
            guard tx.revocationDate == nil else { continue }
            if let exp = tx.expirationDate, exp <= Date() { continue }
            hasPremium = true
            if latest.map({ tx.purchaseDate > $0.purchaseDate }) ?? true {
                latest = tx
            }
        }

        isPremium = hasPremium
        activeTransaction = latest
    }

    private func verified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .verified(let value): return value
        case .unverified(_, let error): throw error
        }
    }

    // Always finish every transaction — verified or not — per StoreKit requirements.
    private func observeTransactionUpdates() -> Task<Void, Never> {
        Task(priority: .utility) { [weak self] in
            for await result in Transaction.updates {
                switch result {
                case .verified(let tx):
                    await tx.finish()
                    await self?.refreshEntitlements()
                case .unverified(let tx, _):
                    await tx.finish()
                }
            }
        }
    }
}
