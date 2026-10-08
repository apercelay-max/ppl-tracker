import WidgetKit
import SwiftUI

// Widget « Prochaine séance » de l'écran d'accueil. Il n'a pas accès aux données
// de l'appli : celle-ci lui envoie un résumé (src/lib/widgetSync.ts) rangé dans
// l'App Group, que l'on relit ici. Tous les champs sont optionnels pour qu'un
// widget et une appli de versions différentes continuent de s'entendre.
private let appGroup = "group.com.ppltracker.app"
private let dataKey = "widgetData"

struct LateMuscle: Codable {
    var name: String?
    var daysSince: Int?
}

struct WidgetData: Codable {
    var nextName: String?
    var dayLabel: String?
    var exerciseCount: Int?
    var duration: String?
    var accent: String?
    var sessionsThisWeek: Int?
    var weeklyGoal: Int?
    var weekDays: [Bool]?
    var lateMuscles: [LateMuscle]?
    var totalSessions: Int?
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

    func placeholder(in context: Context) -> SessionEntry {
        SessionEntry(date: Date(), data: WidgetData(
            nextName: "Pull A", dayLabel: "Pull · J1", exerciseCount: 7, duration: "~60 min",
            accent: "#7c6fcd", sessionsThisWeek: 2, weeklyGoal: 4,
            weekDays: [false, true, false, true, false, false, false],
            lateMuscles: [LateMuscle(name: "Mollets", daysSince: 12), LateMuscle(name: "Épaules", daysSince: 9), LateMuscle(name: "Biceps", daysSince: 6)],
            totalSessions: 38, updatedAt: nil))
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
    @ViewBuilder func widgetBackground(_ color: Color) -> some View {
        if #available(iOS 17.0, *) {
            containerBackground(color, for: .widget)
        } else {
            background(color)
        }
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

struct PPLWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: SessionEntry

    private let bg = Color(red: 0.07, green: 0.07, blue: 0.09)

    var body: some View {
        Group {
            if let d = entry.data, let name = d.nextName {
                content(d, name: name)
            } else {
                VStack(alignment: .leading, spacing: 6) {
                    Text("PPL Tracker").font(.headline).foregroundColor(.white)
                    Text("Ouvre l'appli pour afficher ta prochaine séance.")
                        .font(.caption).foregroundColor(.white.opacity(0.65))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            }
        }
        .widgetBackground(bg)
    }

    @ViewBuilder
    private func content(_ d: WidgetData, name: String) -> some View {
        let accent = Color(hex: d.accent)
        let done = d.sessionsThisWeek ?? 0
        let goal = d.weeklyGoal ?? 0
        let details = [
            d.exerciseCount.map { "\($0) exercices" },
            (d.duration?.isEmpty == false) ? d.duration : nil,
        ].compactMap { $0 }.joined(separator: " · ")

        VStack(alignment: .leading, spacing: 4) {
            Text("PROCHAINE SÉANCE")
                .font(.system(size: 10, weight: .bold)).tracking(1)
                .foregroundColor(accent)
            Text(name)
                .font(.system(size: family == .systemSmall ? 22 : 28, weight: .heavy))
                .foregroundColor(.white)
                .lineLimit(2).minimumScaleFactor(0.7)
            if let label = d.dayLabel, !label.isEmpty {
                Text(label).font(.footnote).foregroundColor(.white.opacity(0.7))
            }
            if family != .systemSmall, !details.isEmpty {
                Text(details).font(.footnote).foregroundColor(.white.opacity(0.7))
            }
            Spacer(minLength: 0)
            if goal > 0 {
                HStack(spacing: 8) {
                    WeekDots(done: done, goal: goal, accent: accent)
                    Text("\(done)/\(goal)").font(.caption.weight(.semibold)).foregroundColor(.white.opacity(0.8))
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct PPLWidget: Widget {
    let kind = "PPLWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            PPLWidgetView(entry: entry)
        }
        .configurationDisplayName("Prochaine séance")
        .description("Ta prochaine séance et ta progression de la semaine.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// ─── Grand widget « Objectifs » ───────────────────────────────────────────────

struct ObjectivesView: View {
    let entry: SessionEntry

    private let bg = Color(red: 0.07, green: 0.07, blue: 0.09)

    // Lettre du jour pour chacune des 7 cases (aujourd'hui en dernier), calculée
    // en jours calendaires pour rester juste lors d'un changement d'heure.
    private func dayLetters() -> [String] {
        // L'appli est en français quelle que soit la langue du téléphone.
        var cal = Calendar.current
        cal.locale = Locale(identifier: "fr_FR")
        let symbols = cal.veryShortWeekdaySymbols
        return (0..<7).map { i in
            let date = cal.date(byAdding: .day, value: -(6 - i), to: Date()) ?? Date()
            return symbols[cal.component(.weekday, from: date) - 1].uppercased()
        }
    }

    var body: some View {
        Group {
            if let d = entry.data, d.weeklyGoal != nil {
                content(d)
            } else {
                VStack(alignment: .leading, spacing: 6) {
                    Text("PPL Tracker").font(.headline).foregroundColor(.white)
                    Text("Ouvre l'appli pour afficher tes objectifs.")
                        .font(.caption).foregroundColor(.white.opacity(0.65))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            }
        }
        .widgetBackground(bg)
    }

    @ViewBuilder
    private func content(_ d: WidgetData) -> some View {
        let accent = Color(hex: d.accent)
        let done = d.sessionsThisWeek ?? 0
        let goal = max(d.weeklyGoal ?? 1, 1)
        let reached = done >= goal
        let days = d.weekDays ?? Array(repeating: false, count: 7)
        let letters = dayLetters()
        let late = d.lateMuscles ?? []

        VStack(alignment: .leading, spacing: 14) {
            Text("OBJECTIFS DE LA SEMAINE")
                .font(.system(size: 10, weight: .bold)).tracking(1)
                .foregroundColor(accent)

            HStack(spacing: 16) {
                ZStack {
                    Circle().stroke(Color.white.opacity(0.12), lineWidth: 9)
                    Circle()
                        .trim(from: 0, to: min(1, Double(done) / Double(goal)))
                        .stroke(reached ? Color.green : accent, style: StrokeStyle(lineWidth: 9, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    Text("\(done)/\(goal)")
                        .font(.system(size: 20, weight: .heavy)).foregroundColor(.white)
                }
                .frame(width: 84, height: 84)

                VStack(alignment: .leading, spacing: 4) {
                    Text(reached ? "Objectif atteint" : "Encore \(goal - done) séance\(goal - done > 1 ? "s" : "")")
                        .font(.system(size: 18, weight: .bold)).foregroundColor(.white)
                    Text("sur 7 jours glissants")
                        .font(.footnote).foregroundColor(.white.opacity(0.65))
                    if let total = d.totalSessions, total > 0 {
                        Text("\(total) séances au total")
                            .font(.footnote).foregroundColor(.white.opacity(0.65))
                    }
                }
                Spacer(minLength: 0)
            }

            HStack(spacing: 6) {
                ForEach(0..<7, id: \.self) { i in
                    VStack(spacing: 5) {
                        RoundedRectangle(cornerRadius: 5)
                            .fill(i < days.count && days[i] ? accent : Color.white.opacity(0.14))
                            .frame(height: 10)
                        Text(letters[i]).font(.system(size: 10, weight: .semibold))
                            .foregroundColor(i == 6 ? .white : .white.opacity(0.55))
                    }
                }
            }

            if !late.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("À TRAVAILLER")
                        .font(.system(size: 10, weight: .bold)).tracking(1)
                        .foregroundColor(.white.opacity(0.55))
                    ForEach(Array(late.enumerated()), id: \.offset) { _, m in
                        HStack {
                            Text((m.name ?? "").capitalized).font(.subheadline.weight(.semibold)).foregroundColor(.white)
                            Spacer()
                            Text("il y a \(m.daysSince ?? 0) j").font(.footnote).foregroundColor(.white.opacity(0.65))
                        }
                    }
                }
            }

            Spacer(minLength: 0)

            if let next = d.nextName {
                Text("Prochaine séance : \(next)")
                    .font(.footnote.weight(.semibold)).foregroundColor(.white.opacity(0.8))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct PPLObjectivesWidget: Widget {
    let kind = "PPLObjectivesWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            ObjectivesView(entry: entry)
        }
        .configurationDisplayName("Objectifs")
        .description("Ton objectif de la semaine, tes 7 derniers jours et les muscles à travailler.")
        .supportedFamilies([.systemLarge])
    }
}

@main
struct PPLWidgets: WidgetBundle {
    var body: some Widget {
        PPLWidget()
        PPLObjectivesWidget()
    }
}
