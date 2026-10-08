import Capacitor
import StoreKit
import UIKit

// Abonnements PPL Pro (StoreKit 2). Tout se passe sur l'appareil : Apple signe les
// achats, StoreKit vérifie la signature (`.verified`), et l'état Pro se relit à
// chaque démarrage depuis `Transaction.currentEntitlements`. Aucun serveur, aucune
// clé : rien de sensible dans le dépôt. Les identifiants de produits sont dans
// src/lib/subscriptions.ts et ios/App/PPLTracker.storekit (test local).
@objc(SubscriptionsPlugin)
public class SubscriptionsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SubscriptionsPlugin"
    public let jsName = "Subscriptions"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getEntitlements", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manage", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestReview", returnType: CAPPluginReturnPromise),
    ]

    private var updatesTask: Task<Void, Never>?

    // Renouvellement, remboursement, achat fait sur un autre appareil ou depuis les
    // réglages d'iOS : StoreKit nous le signale ici, même quand l'écran d'achat est fermé.
    public override func load() {
        updatesTask = Task {
            for await result in Transaction.updates {
                if case .verified(let transaction) = result { await transaction.finish() }
                await publishEntitlements()
            }
        }
    }

    deinit { updatesTask?.cancel() }

    // ─── Conversion vers du JSON simple pour le web ──────────────────────────

    private static func unitName(_ unit: Product.SubscriptionPeriod.Unit) -> String {
        switch unit {
        case .day: return "day"
        case .week: return "week"
        case .month: return "month"
        case .year: return "year"
        @unknown default: return "day"
        }
    }

    private static func periodDict(_ period: Product.SubscriptionPeriod) -> [String: Any] {
        ["unit": unitName(period.unit), "value": period.value]
    }

    private static func productDict(_ product: Product) async -> [String: Any] {
        var d: [String: Any] = [
            "id": product.id,
            "displayName": product.displayName,
            "description": product.description,
            "displayPrice": product.displayPrice,
            "price": NSDecimalNumber(decimal: product.price).doubleValue,
            "currencyCode": product.priceFormatStyle.currencyCode,
        ]
        if let sub = product.subscription {
            d["period"] = periodDict(sub.subscriptionPeriod)
            if let intro = sub.introductoryOffer {
                let mode: String
                switch intro.paymentMode {
                case .freeTrial: mode = "freeTrial"
                case .payAsYouGo: mode = "payAsYouGo"
                case .payUpFront: mode = "payUpFront"
                default: mode = "other"
                }
                d["introOffer"] = [
                    "paymentMode": mode,
                    "period": periodDict(intro.period),
                    "periodCount": intro.periodCount,
                    "displayPrice": intro.displayPrice,
                ] as [String: Any]
                // Un essai gratuit n'est proposé qu'une fois par personne : si elle l'a déjà
                // utilisé, l'écran d'achat ne doit plus l'annoncer.
                d["introEligible"] = await sub.isEligibleForIntroOffer
            }
        }
        return d
    }

    private func currentEntitlements() async -> [[String: Any]] {
        var out: [[String: Any]] = []
        for await result in Transaction.currentEntitlements {
            guard case .verified(let t) = result, t.productType == .autoRenewable, t.revocationDate == nil else { continue }
            var e: [String: Any] = ["productId": t.productID, "isTrial": t.offerType == .introductory]
            if let exp = t.expirationDate { e["expirationDate"] = exp.timeIntervalSince1970 * 1000 }
            if let group = t.subscriptionGroupID,
               let statuses = try? await Product.SubscriptionInfo.status(for: group),
               let active = statuses.first(where: { $0.state == .subscribed || $0.state == .inGracePeriod }),
               case .verified(let renewal) = active.renewalInfo {
                e["willRenew"] = renewal.willAutoRenew
            }
            out.append(e)
        }
        return out
    }

    private func publishEntitlements() async {
        notifyListeners("entitlementsChanged", data: ["entitlements": await currentEntitlements()])
    }

    // ─── Méthodes appelées depuis le web ─────────────────────────────────────

    @objc func getProducts(_ call: CAPPluginCall) {
        let ids = call.getArray("ids", String.self) ?? []
        Task {
            do {
                let products = try await Product.products(for: ids)
                var list: [[String: Any]] = []
                for p in products { list.append(await Self.productDict(p)) }
                call.resolve(["products": list])
            } catch {
                call.reject("Produits indisponibles : \(error.localizedDescription)")
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("id manquant"); return }
        Task { @MainActor in
            do {
                guard let product = try await Product.products(for: [id]).first else {
                    call.reject("Produit introuvable")
                    return
                }
                switch try await product.purchase() {
                case .success(let verification):
                    guard case .verified(let transaction) = verification else {
                        call.reject("Achat non vérifié par Apple")
                        return
                    }
                    await transaction.finish()
                    let entitlements = await currentEntitlements()
                    notifyListeners("entitlementsChanged", data: ["entitlements": entitlements])
                    call.resolve(["status": "success", "entitlements": entitlements])
                case .userCancelled:
                    call.resolve(["status": "cancelled"])
                case .pending:
                    // Validation parentale (« Demander à acheter ») : l'achat arrivera plus tard par `Transaction.updates`.
                    call.resolve(["status": "pending"])
                @unknown default:
                    call.resolve(["status": "unknown"])
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                let entitlements = await currentEntitlements()
                notifyListeners("entitlementsChanged", data: ["entitlements": entitlements])
                call.resolve(["entitlements": entitlements])
            } catch {
                call.reject("Restauration impossible : \(error.localizedDescription)")
            }
        }
    }

    @objc func getEntitlements(_ call: CAPPluginCall) {
        Task { call.resolve(["entitlements": await currentEntitlements()]) }
    }

    @objc func manage(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene else {
                call.resolve()
                return
            }
            do {
                try await AppStore.showManageSubscriptions(in: scene)
                call.resolve()
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    // Fenêtre d'avis officielle d'Apple. iOS décide seul s'il l'affiche (3 fois par an
    // au plus) : on ne sait jamais si la personne a noté, et on ne doit donc rien
    // promettre en échange (règle 5.6.1 de l'App Store).
    @objc func requestReview(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
                SKStoreReviewController.requestReview(in: scene)
            }
            call.resolve()
        }
    }
}
