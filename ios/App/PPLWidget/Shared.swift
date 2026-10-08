import WidgetKit
import SwiftUI

// Les widgets n'ont pas accès aux données de l'appli : celle-ci leur envoie un
// résumé (src/lib/widgetSync.ts) rangé dans l'App Group, que l'on relit ici.
// Tous les champs sont optionnels pour qu'un widget et une appli de versions
// différentes continuent de s'entendre.
let appGroup = "group.com.ppltracker.app"
let dataKey = "widgetData"
let widgetBg = Color(red: 0.07, green: 0.07, blue: 0.09)

struct LateMuscle: Codable { var name: String?; var daysSince: Int? }
struct RecordInfo: Codable { var exercise: String?; var weight: Double?; var daysAgo: Int? }
struct BodyWeightInfo: Codable { var latest: Double?; var delta: Double?; var points: [Double]? }
struct BinomeInfo: Codable {
    var name: String?; var week: Int?; var goal: Int?
    var myWeek: Int?; var myGoal: Int?; var lastSessionDaysAgo: Int?
}
struct RecoveryItem: Codable { var name: String?; var pct: Double?; var hoursRemaining: Int? }
struct CoachInfo: Codable { var recap: String?; var focus: String?; var action: String? }

struct WidgetData: Codable {
    var nextName: String?
    var nextDayId: String?
    var dayLabel: String?
    var exerciseCount: Int?
    var duration: String?
    var accent: String?
    var sessionsThisWeek: Int?
    var weeklyGoal: Int?
    var weekDays: [Bool]?
    var lateMuscles: [LateMuscle]?
    var totalSessions: Int?
    var streak: Int?
    var bestStreak: Int?
    var unit: String?
    var lastRecord: RecordInfo?
    var bodyWeight: BodyWeightInfo?
    var binome: BinomeInfo?
    var recovery: [RecoveryItem]?
    var coach: CoachInfo?
    var updatedAt: Double?
}

struct SessionEntry: TimelineEntry {
    let date: Date
    let data: WidgetData?
}

struct Provider: TimelineProvider {
    private func load() -> WidgetData? {
        guard let json = UserDefaults(suiteName: appGroup)?.string(forKey: dataKey),
              let raw = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(WidgetData.self, from: raw)
    }

    // Données d'exemple de la galerie des widgets.
    func placeholder(in context: Context) -> SessionEntry {
        SessionEntry(date: Date(), data: WidgetData(
            nextName: "Pull A", nextDayId: "pull-a", dayLabel: "Pull · J1", exerciseCount: 7, duration: "~60 min",
            accent: "#7c6fcd", sessionsThisWeek: 2, weeklyGoal: 4,
            weekDays: [false, true, false, true, false, false, false],
            lateMuscles: [LateMuscle(name: "Mollets", daysSince: 12), LateMuscle(name: "Épaules", daysSince: 9), LateMuscle(name: "Biceps", daysSince: 6)],
            totalSessions: 38, streak: 5, bestStreak: 8, unit: "kg",
            lastRecord: RecordInfo(exercise: "Développé couché", weight: 85, daysAgo: 3),
            bodyWeight: BodyWeightInfo(latest: 78.4, delta: -0.6, points: [79.0, 78.8, 78.9, 78.6, 78.7, 78.5, 78.4]),
            binome: BinomeInfo(name: "Antoine", week: 3, goal: 4, myWeek: 2, myGoal: 4, lastSessionDaysAgo: 1),
            recovery: [
                RecoveryItem(name: "Pecs", pct: 0.3, hoursRemaining: 34), RecoveryItem(name: "Dos", pct: 0.55, hoursRemaining: 32),
                RecoveryItem(name: "Épaules", pct: 0.8, hoursRemaining: 10), RecoveryItem(name: "Biceps", pct: 1, hoursRemaining: 0),
            ],
            coach: CoachInfo(recap: "Push B, hier : 18 séries, 6 240 kg (+4 % vs la fois d'avant).",
                             focus: "Tes épaules sont les plus sollicitées de la semaine.",
                             action: "Aujourd'hui : garde 2 reps en réserve sur le développé."),
            updatedAt: nil))
    }

    func getSnapshot(in context: Context, completion: @escaping (SessionEntry) -> Void) {
        completion(context.isPreview ? placeholder(in: context) : SessionEntry(date: Date(), data: load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SessionEntry>) -> Void) {
        let entry = SessionEntry(date: Date(), data: load())
        // L'appli demande un rechargement dès que les données changent ; ce
        // rafraîchissement-ci n'est qu'un filet de sécurité (le compteur de la
        // semaine glisse avec le temps même si l'appli reste fermée).
        let next = Calendar.current.date(byAdding: .hour, value: 6, to: Date()) ?? Date().addingTimeInterval(21600)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// ─── Aides communes ──────────────────────────────────────────────────────────

extension Color {
    init(hex: String?) {
        let fallback = Color(red: 0.48, green: 0.48, blue: 0.56)
        guard var s = hex?.trimmingCharacters(in: .whitespaces), !s.isEmpty else { self = fallback; return }
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6, let v = UInt32(s, radix: 16) else { self = fallback; return }
        self = Color(red: Double((v >> 16) & 0xFF) / 255, green: Double((v >> 8) & 0xFF) / 255, blue: Double(v & 0xFF) / 255)
    }
}

extension View {
    // containerBackground n'existe qu'à partir d'iOS 17 ; avant, on dessine le fond à la main.
    @ViewBuilder func widgetBackground(_ color: Color = widgetBg) -> some View {
        if #available(iOS 17.0, *) {
            containerBackground(color, for: .widget)
        } else {
            background(color)
        }
    }
}

/// Lien ouvert par la pression sur le widget (géré par App.tsx).
func appLink(_ path: String) -> URL { URL(string: "ppltracker://\(path)")! }

/// Nombre à la française : 82,5 (une décimale au plus).
func fmt(_ v: Double) -> String {
    let f = NumberFormatter()
    f.locale = Locale(identifier: "fr_FR")
    f.maximumFractionDigits = 1
    f.minimumFractionDigits = 0
    return f.string(from: NSNumber(value: v)) ?? String(v)
}

func daysAgoText(_ d: Int?) -> String {
    guard let d = d else { return "" }
    if d == 0 { return "aujourd'hui" }
    if d == 1 { return "hier" }
    return "il y a \(d) j"
}

struct WidgetCaption: View {
    let text: String
    let color: Color
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .bold)).tracking(1)
            .foregroundColor(color)
    }
}

struct EmptyWidgetView: View {
    let message: String
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("PPL Tracker").font(.headline).foregroundColor(.white)
            Text(message).font(.caption).foregroundColor(.white.opacity(0.65))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .widgetBackground()
    }
}

struct WeekDots: View {
    let done: Int
    let goal: Int
    let accent: Color

    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<max(1, min(goal, 7)), id: \.self) { i in
                Circle()
                    .fill(i < done ? accent : Color.white.opacity(0.18))
                    .frame(width: 9, height: 9)
            }
        }
    }
}

struct ProgressRing: View {
    let done: Int
    let goal: Int
    let color: Color
    var lineWidth: CGFloat = 9

    var body: some View {
        ZStack {
            Circle().stroke(Color.white.opacity(0.12), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: min(1, Double(done) / Double(max(goal, 1))))
                .stroke(done >= goal ? Color.green : color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Text("\(done)/\(goal)")
                .font(.system(size: 20, weight: .heavy)).foregroundColor(.white)
                .minimumScaleFactor(0.6)
        }
    }
}
