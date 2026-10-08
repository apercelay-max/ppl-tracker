import Capacitor
import WidgetKit
import ActivityKit

// Pont entre l'appli web et iOS pour deux choses : les widgets (le résumé que
// l'appli leur envoie, voir src/lib/widgetSync.ts) et le séance en cours sur
// l'écran verrouillé (Live Activity). L'identifiant de l'App Group doit rester
// identique dans App.entitlements, PPLWidget.entitlements et Shared.swift.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "consumePendingLink", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateWorkout", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endWorkout", returnType: CAPPluginReturnPromise),
    ]

    // Quand Siri lance une action, l'appli passe au premier plan : on prévient le web tout de suite
    // (au démarrage à froid, c'est le web qui vient lire le lien lui-même, voir consumePendingLink).
    public override func load() {
        NotificationCenter.default.addObserver(forName: .pplPendingLink, object: nil, queue: .main) { [weak self] _ in
            self?.notifyListeners("pendingLink", data: [:])
        }
    }

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

    // Lien laissé par Siri (« session/pull-a », « view/pro »…). Lu une seule fois : on l'efface.
    @objc func consumePendingLink(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: Self.appGroup),
              let link = defaults.string(forKey: "pendingLink") else {
            call.resolve([:])
            return
        }
        defaults.removeObject(forKey: "pendingLink")
        call.resolve(["link": link])
    }

    // Démarre la séance en cours sur l'écran verrouillé, ou la met à jour si elle y est déjà
    // (série validée, exercice suivant, repos lancé, en pause ou terminé).
    @objc func updateWorkout(_ call: CAPPluginCall) {
        guard let start = call.getDouble("startTimestamp") else {
            call.reject("startTimestamp manquant")
            return
        }
        var restEnd: Date? = nil
        if let end = call.getDouble("restEndTimestamp") { restEnd = Date(timeIntervalSince1970: end / 1000) }
        let state = WorkoutActivityAttributes.ContentState(
            exerciseName: call.getString("exerciseName") ?? "",
            setNumber: call.getInt("setNumber") ?? 1,
            setsInExercise: call.getInt("setsInExercise") ?? 1,
            setsDone: call.getInt("setsDone") ?? 0,
            setsTotal: call.getInt("setsTotal") ?? 1,
            startDate: Date(timeIntervalSince1970: start / 1000),
            sessionPaused: call.getBool("sessionPaused") ?? false,
            restEndDate: restEnd,
            restTotalSeconds: call.getDouble("restTotalSeconds") ?? 0,
            restPaused: call.getBool("restPaused") ?? false,
            restPausedRemaining: call.getDouble("restPausedRemaining") ?? 0,
            volume: call.getDouble("volume") ?? 0,
            unit: call.getString("unit") ?? "kg",
            heartRate: call.getInt("heartRate"))
        let content = ActivityContent(state: state, staleDate: nil)

        if let running = Activity<WorkoutActivityAttributes>.activities.first {
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
                attributes: WorkoutActivityAttributes(title: call.getString("title") ?? "Séance"),
                content: content)
            call.resolve()
        } catch {
            call.reject("Séance en direct indisponible : \(error.localizedDescription)")
        }
    }

    @objc func endWorkout(_ call: CAPPluginCall) {
        Task {
            for activity in Activity<WorkoutActivityAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
        }
        call.resolve()
    }
}
