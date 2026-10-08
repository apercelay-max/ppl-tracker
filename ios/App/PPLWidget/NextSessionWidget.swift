import WidgetKit
import SwiftUI

struct NextSessionView: View {
    @Environment(\.widgetFamily) private var family
    let entry: SessionEntry

    var body: some View {
        if let d = entry.data, let name = d.nextName {
            content(d, name: name)
                .widgetURL(appLink("session/\(d.nextDayId ?? "")"))
        } else {
            EmptyWidgetView(message: "Ouvre l'appli pour afficher ta prochaine séance.")
        }
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
            WidgetCaption(text: "PROCHAINE SÉANCE", color: accent)
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
        .widgetBackground()
    }
}

struct PPLWidget: Widget {
    let kind = "PPLWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            NextSessionView(entry: entry)
        }
        .configurationDisplayName("Prochaine séance")
        .description("Ta prochaine séance et ta progression de la semaine. Un appui la démarre.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
