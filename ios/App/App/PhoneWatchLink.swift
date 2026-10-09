import Foundation
import WatchConnectivity

// Côté iPhone de la liaison avec l'Apple Watch (WatchConnectivity).
//  • iPhone → montre : le dernier état à afficher (séance, repos, prochaine séance),
//    envoyé en « contexte » : seule la dernière version compte, même si la montre dormait.
//  • montre → iPhone : des commandes (valider la série, passer le repos), relayées au web
//    par WidgetBridgePlugin. Le téléphone reste le seul maître des données.
extension Notification.Name {
    static let pplWatchCommand = Notification.Name("PPLWatchCommand")
}

final class PhoneWatchLink: NSObject, WCSessionDelegate {
    static let shared = PhoneWatchLink()

    private var latest: [String: Any]?

    func start() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    /// `json` : l'état complet déjà prêt à afficher par la montre (voir syncWatch dans widgetSync.ts).
    func push(json: String) {
        latest = ["state": json]
        deliver()
    }

    private func deliver() {
        guard WCSession.isSupported(), let latest = latest else { return }
        let session = WCSession.default
        guard session.activationState == .activated, session.isPaired, session.isWatchAppInstalled else { return }
        try? session.updateApplicationContext(latest)
        // En plus du contexte : message immédiat si la montre est allumée (le repos se compte à la seconde).
        if session.isReachable { session.sendMessage(latest, replyHandler: nil, errorHandler: nil) }
    }

    // ── WCSessionDelegate ──────────────────────────────────────────────────

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if activationState == .activated { deliver() }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}

    func sessionDidDeactivate(_ session: WCSession) { session.activate() }

    func sessionReachabilityDidChange(_ session: WCSession) { if session.isReachable { deliver() } }

    func sessionWatchStateDidChange(_ session: WCSession) { deliver() }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        guard let cmd = message["cmd"] as? String else { return }
        var info: [String: Any] = ["cmd": cmd]
        if let w = message["weight"] as? Double { info["weight"] = w }
        if let r = message["reps"] as? Int { info["reps"] = r }
        NotificationCenter.default.post(name: .pplWatchCommand, object: nil, userInfo: info)
    }
}
