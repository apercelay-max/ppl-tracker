import WidgetKit
import SwiftUI

struct StreakView: View {
    @Environment(\.widgetFamily) private var family
    let entry: SessionEntry

    var body: some View {
        if let d = entry.data, let streak = d.streak {
            content(d, streak: streak).widgetURL(appLink("view/profil"))
        } else {
            EmptyWidgetView(message: "Ouvre l'appli pour afficher ta série.")
        }
    }

    @ViewBuilder
    private func content(_ d: WidgetData, streak: Int) -> some View {
        let flame = Color(red: 1.0, green: 0.55, blue: 0.1)
        let label = streak == 0 ? "Atteins ton objectif cette semaine pour lancer ta série."
            : "semaine\(streak > 1 ? "s" : "") d'affilée"

        if family == .systemSmall {
            VStack(alignment: .leading, spacing: 2) {
                WidgetCaption(text: "SÉRIE", color: flame)
                Spacer(minLength: 0)
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Image(systemName: "flame.fill").font(.system(size: 28)).foregroundColor(streak > 0 ? flame : .white.opacity(0.25))
                    Text("\(streak)").font(.system(size: 48, weight: .heavy)).foregroundColor(.white)
                }
                Text(label)
                    .font(.footnote).foregroundColor(.white.opacity(0.7))
                    .lineLimit(3).minimumScaleFactor(0.8)
                if let best = d.bestStreak, best > streak {
                    Text("Record : \(best)").font(.caption2.weight(.semibold)).foregroundColor(.white.opacity(0.55))
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetBackground()
        } else {
            let done = d.sessionsThisWeek ?? 0
            let goal = max(d.weeklyGoal ?? 1, 1)
            HStack(spacing: 18) {
                VStack(alignment: .leading, spacing: 2) {
                    WidgetCaption(text: "SÉRIE", color: flame)
                    Spacer(minLength: 0)
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Image(systemName: "flame.fill").font(.system(size: 34)).foregroundColor(streak > 0 ? flame : .white.opacity(0.25))
                        Text("\(streak)").font(.system(size: 58, weight: .heavy)).foregroundColor(.white)
                    }
                    Text(label).font(.footnote).foregroundColor(.white.opacity(0.7))
                        .lineLimit(2).minimumScaleFactor(0.8)
                }
                VStack(alignment: .leading, spacing: 8) {
                    Spacer(minLength: 0)
                    Text("Cette semaine").font(.caption.weight(.semibold)).foregroundColor(.white.opacity(0.6))
                    HStack(spacing: 8) {
                        WeekDots(done: done, goal: goal, accent: flame)
                        Text("\(done)/\(goal)").font(.caption.weight(.semibold)).foregroundColor(.white.opacity(0.85))
                    }
                    if let best = d.bestStreak, best > 0 {
                        Text("Record : \(best) semaine\(best > 1 ? "s" : "")")
                            .font(.caption.weight(.semibold)).foregroundColor(.white.opacity(0.6))
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetBackground()
        }
    }
}

struct PPLStreakWidget: Widget {
    let kind = "PPLStreakWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            ProGate(entry: entry) { StreakView(entry: entry) }
        }
        .configurationDisplayName("Série")
        .description("Le nombre de semaines d'affilée où tu atteins ton objectif.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
