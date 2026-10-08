import WidgetKit
import SwiftUI

struct CoachView: View {
    @Environment(\.widgetFamily) private var family
    let entry: SessionEntry

    var body: some View {
        if let d = entry.data {
            content(d).widgetURL(appLink("view/home"))
        } else {
            EmptyWidgetView(message: "Ouvre l'appli pour afficher le point du coach.")
        }
    }

    @ViewBuilder
    private func content(_ d: WidgetData) -> some View {
        let purple = Color(red: 0.7, green: 0.55, blue: 1.0)
        VStack(alignment: .leading, spacing: 6) {
            WidgetCaption(text: "COACH", color: purple)
            if let c = d.coach, let recap = c.recap {
                if family == .systemSmall {
                    // Petit : seulement le conseil du jour, c'est ce qui sert au moment de s'entraîner.
                    Spacer(minLength: 0)
                    Text(c.action?.isEmpty == false ? (c.action ?? recap) : recap)
                        .font(.system(size: 13, weight: .semibold)).foregroundColor(.white)
                        .lineLimit(6).minimumScaleFactor(0.8)
                    Spacer(minLength: 0)
                } else {
                    Text(recap)
                        .font(.system(size: 13, weight: .semibold)).foregroundColor(.white)
                        .lineLimit(2).minimumScaleFactor(0.85)
                    if let focus = c.focus, !focus.isEmpty {
                        Text(focus).font(.system(size: 12)).foregroundColor(.white.opacity(0.7))
                            .lineLimit(2).minimumScaleFactor(0.85)
                    }
                    Spacer(minLength: 0)
                    if let action = c.action, !action.isEmpty {
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "arrow.right.circle.fill").foregroundColor(purple).font(.system(size: 13))
                            Text(action).font(.system(size: 12, weight: .semibold)).foregroundColor(.white)
                                .lineLimit(2).minimumScaleFactor(0.85)
                        }
                    }
                }
            } else {
                Text("Termine une première séance : le coach en fera le bilan ici.")
                    .font(.footnote).foregroundColor(.white.opacity(0.7))
                Spacer(minLength: 0)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .widgetBackground()
    }
}

struct PPLCoachWidget: Widget {
    let kind = "PPLCoachWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            ProGate(entry: entry) { CoachView(entry: entry) }
        }
        .configurationDisplayName("Coach du jour")
        .description("Le bilan de ta dernière séance et le conseil du jour.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
