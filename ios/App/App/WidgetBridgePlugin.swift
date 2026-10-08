import Capacitor
import WidgetKit
import ActivityKit

// Pont entre l'appli web et iOS pour deux choses : les widgets (le résumé que
// l'appli leur envoie, voir src/lib/widgetSync.ts) et le minuteur de repos de
// l'écran verrouillé (Live Activity). L'identifiant de l'App Group doit rester
// identique dans App.entitlements, PPLWidget.entitlements et Shared.swift.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startRestTimer", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endRestTimer", returnType: CAPPluginReturnPromise),
    ]

    static let appGroup = "group.com.ppltracker.app"
    static let dataKey = "widgetData"

    // Le résumé est rangé dans l'« App Group » : un espace de stockage que
    // l'appli et les widgets ont le droit de lire tous les deux (le
    // localStorage de l'appli, lui, est invisible pour un widget).
    @objc func setData(_ call: CAPPluginCall) {
        guard let json = call.getString("json") else {
            call.reject("json manquant")
            return
        }
        guard let defaults = UserDefaults(suiteName: Self.appGroup) else {
            call.reject("App Group introuvable")
            return
        }
        defaults.set(json, forKey: Self.dataKey)
        // Sans ça, iOS garde l'ancien affichage jusqu'à sa prochaine mise à jour planifiée.
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }

    // Démarre le minuteur de repos, ou le met à jour s'il tourne déjà (pause,
    // temps ajouté ou retiré).
    @objc func startRestTimer(_ call: CAPPluginCall) {
        guard let end = call.getDouble("endTimestamp"), let total = call.getDouble("totalSeconds") else {
            call.reject("endTimestamp / totalSeconds manquants")
            return
        }
        let state = RestTimerAttributes.ContentState(
            endDate: Date(timeIntervalSince1970: end / 1000),
            totalSeconds: total,
            paused: call.getBool("paused") ?? false,
            pausedRemaining: call.getDouble("pausedRemaining") ?? 0)
        let content = ActivityContent(state: state, staleDate: nil)

        if let running = Activity<RestTimerAttributes>.activities.first {
            Task { await running.update(content) }
            call.resolve()
            return
        }
        // L'utilisateur peut avoir coupé les activités en direct dans les réglages : ce n'est pas une erreur.
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.resolve()
            return
        }
        do {
            _ = try Activity.request(
                attributes: RestTimerAttributes(title: call.getString("title") ?? "Séance"),
                content: content)
            call.resolve()
        } catch {
            call.reject("Minuteur de repos indisponible : \(error.localizedDescription)")
        }
    }

    @objc func endRestTimer(_ call: CAPPluginCall) {
        Task {
            for activity in Activity<RestTimerAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
        }
        call.resolve()
    }
}
