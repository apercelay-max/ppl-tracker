import WidgetKit
import SwiftUI

struct ObjectivesView: View {
    @Environment(\.widgetFamily) private var family
    let entry: SessionEntry

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
        if let d = entry.data, d.weeklyGoal != nil {
            content(d).widgetURL(appLink("view/objectifs"))
        } else {
            EmptyWidgetView(message: "Ouvre l'appli pour afficher tes objectifs.")
        }
    }

    private func title(done: Int, goal: Int) -> String {
        done >= goal ? "Objectif atteint" : "Encore \(goal - done) séance\(goal - done > 1 ? "s" : "")"
    }

    private func dayBars(_ days: [Bool], accent: Color) -> some View {
        let letters = dayLetters()
        return HStack(spacing: 6) {
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
    }

    @ViewBuilder
    private func content(_ d: WidgetData) -> some View {
        let accent = Color(hex: d.accent)
        let done = d.sessionsThisWeek ?? 0
        let goal = max(d.weeklyGoal ?? 1, 1)
        let days = d.weekDays ?? Array(repeating: false, count: 7)
        let late = d.lateMuscles ?? []

        switch family {
        case .systemSmall:
            VStack(alignment: .leading, spacing: 6) {
                WidgetCaption(text: "OBJECTIF", color: accent)
                HStack {
                    Spacer(minLength: 0)
                    ProgressRing(done: done, goal: goal, color: accent, lineWidth: 8)
                        .frame(width: 78, height: 78)
                    Spacer(minLength: 0)
                }
                Spacer(minLength: 0)
                Text(title(done: done, goal: goal))
                    .font(.footnote.weight(.semibold)).foregroundColor(.white)
                    .lineLimit(1).minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetBackground()
        case .systemMedium:
            VStack(alignment: .leading, spacing: 10) {
                WidgetCaption(text: "OBJECTIFS DE LA SEMAINE", color: accent)
                HStack(spacing: 14) {
                    ProgressRing(done: done, goal: goal, color: accent, lineWidth: 8)
                        .frame(width: 72, height: 72)
                    VStack(alignment: .leading, spacing: 8) {
                        Text(title(done: done, goal: goal))
                            .font(.system(size: 17, weight: .bold)).foregroundColor(.white)
                        dayBars(days, accent: accent)
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetBackground()
        default:
            VStack(alignment: .leading, spacing: 14) {
                WidgetCaption(text: "OBJECTIFS DE LA SEMAINE", color: accent)

                HStack(spacing: 16) {
                    ProgressRing(done: done, goal: goal, color: accent)
                        .frame(width: 84, height: 84)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(title(done: done, goal: goal))
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

                dayBars(days, accent: accent)

                if !late.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        WidgetCaption(text: "À TRAVAILLER", color: .white.opacity(0.55))
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
            .widgetBackground()
        }
    }
}

struct PPLObjectivesWidget: Widget {
    let kind = "PPLObjectivesWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            ObjectivesView(entry: entry)
        }
        .configurationDisplayName("Objectifs")
        .description("Ton objectif de la semaine, tes 7 derniers jours et (en grand) les muscles à travailler.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
