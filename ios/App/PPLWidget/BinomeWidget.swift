import WidgetKit
import SwiftUI

struct BinomeView: View {
    @Environment(\.widgetFamily) private var family
    let entry: SessionEntry

    var body: some View {
        if let d = entry.data {
            content(d).widgetURL(appLink("view/home"))
        } else {
            EmptyWidgetView(message: "Ouvre l'appli pour afficher ton binôme.")
        }
    }

    @ViewBuilder
    private func content(_ d: WidgetData) -> some View {
        let green = Color(red: 0.3, green: 0.85, blue: 0.55)
        if let b = d.binome {
            if family == .systemSmall {
                VStack(alignment: .leading, spacing: 8) {
                    WidgetCaption(text: "BINÔME", color: green)
                    HStack(spacing: 10) {
                        smallPerson(name: "Moi", done: b.myWeek ?? 0, goal: b.myGoal ?? 1, color: Color(hex: d.accent))
                        smallPerson(name: b.name ?? "Binôme", done: b.week ?? 0, goal: b.goal ?? 1, color: green)
                    }
                    Spacer(minLength: 0)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                .widgetBackground()
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    WidgetCaption(text: "BINÔME", color: green)
                    HStack(spacing: 18) {
                        person(name: "Moi", done: b.myWeek ?? 0, goal: b.myGoal ?? 1, color: Color(hex: d.accent))
                        person(name: b.name ?? "Binôme", done: b.week ?? 0, goal: b.goal ?? 1, color: green)
                        Spacer(minLength: 0)
                    }
                    Spacer(minLength: 0)
                    Text(footer(b)).font(.footnote.weight(.semibold)).foregroundColor(.white.opacity(0.8))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                .widgetBackground()
            }
        } else {
            EmptyWidgetView(message: "Pas encore de binôme. Invite un pote depuis l'appli pour voir vos semaines côte à côte.")
        }
    }

    // Version compacte : l'anneau au-dessus, le prénom dessous.
    private func smallPerson(name: String, done: Int, goal: Int, color: Color) -> some View {
        VStack(spacing: 5) {
            ProgressRing(done: done, goal: goal, color: color, lineWidth: 5)
                .frame(width: 54, height: 54)
            Text(name).font(.caption2.weight(.semibold)).foregroundColor(.white)
                .lineLimit(1).minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
    }

    private func person(name: String, done: Int, goal: Int, color: Color) -> some View {
        HStack(spacing: 10) {
            ProgressRing(done: done, goal: goal, color: color, lineWidth: 6)
                .frame(width: 54, height: 54)
            Text(name).font(.subheadline.weight(.semibold)).foregroundColor(.white).lineLimit(1)
        }
    }

    // Phrases sans accord (« entraîné » / « entraînée ») : on ne devine pas le genre du binôme.
    private func footer(_ b: BinomeInfo) -> String {
        let name = b.name ?? "Ton binôme"
        guard let ago = b.lastSessionDaysAgo else { return "\(name) n'a pas encore partagé de séance." }
        if ago >= 4 { return "Dernière séance de \(name) : il y a \(ago) jours. Un petit message ?" }
        return "Dernière séance de \(name) : \(daysAgoText(ago))."
    }
}

struct PPLBinomeWidget: Widget {
    let kind = "PPLBinomeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            ProGate(entry: entry) { BinomeView(entry: entry) }
        }
        .configurationDisplayName("Binôme")
        .description("Où en est ton binôme cette semaine, face à toi.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
