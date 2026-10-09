import Foundation
import WatchConnectivity
import WatchKit

// Ce que l'iPhone envoie (voir syncWatch dans src/lib/widgetSync.ts). Tous les champs sont
// optionnels : une montre et un téléphone de versions différentes doivent continuer de
// s'entendre, au pire la montre affiche moins de choses.
struct WatchSession: Codable {
    var title: String?
    var exercise: String?
    var setNumber: Int?
    var setsInExercise: Int?
    var setsDone: Int?
    var setsTotal: Int?
    var weight: Double?
    var reps: Int?
    var targetReps: String?
    var bodyweight: Bool?
    var restEnd: Double?          // millisecondes depuis 1970
    var restTotal: Double?
    var restPaused: Bool?
    var restPausedRemaining: Double?
}

struct WatchNext: Codable { var name: String? }
struct WatchWeek: Codable { var done: Int?; var goal: Int? }

struct WatchState: Codable {
    var pro: Bool?
    var unit: String?
    var session: WatchSession?
    var next: WatchNext?
    var week: WatchWeek?
}

/// Côté montre de la liaison WatchConnectivity : reçoit l'état du téléphone, lui envoie des commandes.
final class WatchModel: NSObject, ObservableObject, WCSessionDelegate {
    @Published var state: WatchState?
    @Published var phoneReachable = false
    @Published var notice: String?

    private var restHaptic: Timer?

    override init() {
        super.init()
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    // ── Réception ──────────────────────────────────────────────────────────

    private func apply(_ payload: [String: Any]) {
        guard let json = payload["state"] as? String,
              let data = json.data(using: .utf8),
              let decoded = try? JSONDecoder().decode(WatchState.self, from: data) else { return }
        DispatchQueue.main.async {
            self.state = decoded
            self.scheduleRestHaptic(decoded.session)
        }
    }

    /// Petite vibration à la fin du repos (montre allumée) : c'est le signal pour reprendre la barre.
    private func scheduleRestHaptic(_ session: WatchSession?) {
        restHaptic?.invalidate()
        guard let end = session?.restEnd, session?.restPaused != true else { return }
        let delay = Date(timeIntervalSince1970: end / 1000).timeIntervalSinceNow
        guard delay > 0 else { return }
        restHaptic = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { _ in
            WKInterfaceDevice.current().play(.notification)
        }
    }

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async { self.phoneReachable = session.isReachable }
        // L'état reçu pendant que l'appli dormait : on le relit au réveil.
        if !session.receivedApplicationContext.isEmpty { apply(session.receivedApplicationContext) }
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async { self.phoneReachable = session.isReachable }
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) { apply(applicationContext) }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) { apply(message) }

    // ── Commandes vers le téléphone ────────────────────────────────────────

    private func send(_ message: [String: Any]) {
        let session = WCSession.default
        guard session.isReachable else {
            notice = "iPhone injoignable. Ouvre PPL Tracker sur ton téléphone."
            WKInterfaceDevice.current().play(.failure)
            return
        }
        notice = nil
        session.sendMessage(message, replyHandler: nil) { [weak self] _ in
            DispatchQueue.main.async { self?.notice = "La commande n’a pas abouti. Réessaie." }
        }
    }

    func completeSet(weight: Double?, reps: Int) {
        var msg: [String: Any] = ["cmd": "completeSet", "reps": reps]
        if let w = weight { msg["weight"] = w }
        send(msg)
        WKInterfaceDevice.current().play(.success)
    }

    func skipRest() {
        send(["cmd": "skipRest"])
        WKInterfaceDevice.current().play(.click)
    }
}
