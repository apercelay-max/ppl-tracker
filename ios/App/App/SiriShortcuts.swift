import AppIntents
import Foundation

// Raccourcis Siri et app Raccourcis. Ils lisent le même résumé que les widgets
// (App Group), donc répondent sans ouvrir l'appli quand la question ne demande
// que de l'information. Ils font partie de PPL Pro : sans abonnement, Siri renvoie
// vers l'écran d'offre.

private enum SiriData {
    static let group = "group.com.ppltracker.app"

    struct Snapshot: Decodable {
        var pro: Bool?
        var nextName: String?
        var nextDayId: String?
        var sessionsThisWeek: Int?
        var weeklyGoal: Int?
        var streak: Int?
    }

    static func load() -> Snapshot? {
        guard let json = UserDefaults(suiteName: group)?.string(forKey: "widgetData"),
              let raw = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(Snapshot.self, from: raw)
    }

    /// Range un lien à ouvrir (ex. « session/pull-a »). L'appli le lit au démarrage ou
    /// dès qu'elle revient au premier plan : voir WidgetBridgePlugin.consumePendingLink.
    static func queue(_ link: String) {
        UserDefaults(suiteName: group)?.set(link, forKey: "pendingLink")
        NotificationCenter.default.post(name: .pplPendingLink, object: nil)
    }

    static let needsApp = "Ouvre PPL Tracker une fois pour que je puisse te répondre."
    static let needsPro = "Les raccourcis Siri font partie de PPL Plus et PPL Pro."
}

extension Notification.Name {
    static let pplPendingLink = Notification.Name("PPLPendingLink")
}

// ─── Démarrer ma séance ──────────────────────────────────────────────────────

struct StartWorkoutIntent: AppIntent {
    static var title: LocalizedStringResource = "Démarrer ma séance"
    static var description = IntentDescription("Ouvre PPL Tracker sur ta prochaine séance.")
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let s = SiriData.load() else {
            SiriData.queue("view/home")
            return .result(dialog: IntentDialog(stringLiteral: "J’ouvre PPL Tracker."))
        }
        if s.pro != true {
            SiriData.queue("view/pro")
            return .result(dialog: IntentDialog(stringLiteral: SiriData.needsPro))
        }
        if let id = s.nextDayId, !id.isEmpty {
            SiriData.queue("session/\(id)")
            return .result(dialog: IntentDialog(stringLiteral: "C’est parti : \(s.nextName ?? "ta séance")."))
        }
        SiriData.queue("view/home")
        return .result(dialog: IntentDialog(stringLiteral: "J’ouvre PPL Tracker."))
    }
}

// ─── Où j'en suis cette semaine ──────────────────────────────────────────────

struct WeekProgressIntent: AppIntent {
    static var title: LocalizedStringResource = "Où j’en suis cette semaine"
    static var description = IntentDescription("Dit combien de séances tu as faites sur ton objectif de la semaine.")

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let s = SiriData.load() else { return .result(dialog: IntentDialog(stringLiteral: SiriData.needsApp)) }
        if s.pro != true { return .result(dialog: IntentDialog(stringLiteral: SiriData.needsPro)) }
        let done = s.sessionsThisWeek ?? 0
        let goal = s.weeklyGoal ?? 0
        let plural = done > 1 ? "séances" : "séance"
        var text = "Tu as fait \(done) \(plural) sur \(goal) cette semaine."
        if goal > 0 {
            text += done >= goal
                ? " Objectif atteint, bravo !"
                : " Encore \(goal - done) pour ton objectif."
        }
        return .result(dialog: IntentDialog(stringLiteral: text))
    }
}

// ─── Ma prochaine séance ─────────────────────────────────────────────────────

struct NextWorkoutIntent: AppIntent {
    static var title: LocalizedStringResource = "Ma prochaine séance"
    static var description = IntentDescription("Dit quelle est ta prochaine séance.")

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let s = SiriData.load() else { return .result(dialog: IntentDialog(stringLiteral: SiriData.needsApp)) }
        if s.pro != true { return .result(dialog: IntentDialog(stringLiteral: SiriData.needsPro)) }
        guard let name = s.nextName, !name.isEmpty else { return .result(dialog: IntentDialog(stringLiteral: SiriData.needsApp)) }
        return .result(dialog: IntentDialog(stringLiteral: "Ta prochaine séance : \(name)."))
    }
}

// ─── Ma série ────────────────────────────────────────────────────────────────

struct StreakIntent: AppIntent {
    static var title: LocalizedStringResource = "Ma série"
    static var description = IntentDescription("Dit depuis combien de semaines tu atteins ton objectif.")

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let s = SiriData.load() else { return .result(dialog: IntentDialog(stringLiteral: SiriData.needsApp)) }
        if s.pro != true { return .result(dialog: IntentDialog(stringLiteral: SiriData.needsPro)) }
        let n = s.streak ?? 0
        let text = n == 0
            ? "Pas encore de série : atteins ton objectif cette semaine pour la lancer."
            : "Tu es sur une série de \(n) semaine\(n > 1 ? "s" : "") d’affilée."
        return .result(dialog: IntentDialog(stringLiteral: text))
    }
}

// ─── Phrases que Siri reconnaît ──────────────────────────────────────────────
// Apple exige le nom de l'appli dans chaque phrase : « … avec PPL Tracker ».

struct PPLShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: StartWorkoutIntent(),
            phrases: [
                "Démarre ma séance avec \(.applicationName)",
                "Lance ma séance avec \(.applicationName)",
                "Commence ma séance avec \(.applicationName)",
            ],
            shortTitle: "Démarrer ma séance",
            systemImageName: "dumbbell.fill")
        AppShortcut(
            intent: WeekProgressIntent(),
            phrases: [
                "Où j’en suis cette semaine avec \(.applicationName)",
                "Mon objectif de la semaine avec \(.applicationName)",
            ],
            shortTitle: "Ma semaine",
            systemImageName: "target")
        AppShortcut(
            intent: NextWorkoutIntent(),
            phrases: [
                "Quelle est ma prochaine séance avec \(.applicationName)",
                "Ma prochaine séance avec \(.applicationName)",
            ],
            shortTitle: "Prochaine séance",
            systemImageName: "calendar")
        AppShortcut(
            intent: StreakIntent(),
            phrases: [
                "Ma série avec \(.applicationName)",
                "Combien de semaines d’affilée avec \(.applicationName)",
            ],
            shortTitle: "Ma série",
            systemImageName: "flame.fill")
    }
}
