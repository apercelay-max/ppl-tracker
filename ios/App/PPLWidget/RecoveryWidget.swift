import WidgetKit
import SwiftUI

struct RecoveryView: View {
    let entry: SessionEntry

    var body: some View {
        if let d = entry.data {
            content(d).widgetURL(appLink("view/objectifs"))
        } else {
            EmptyWidgetView(message: "Ouvre l'appli pour afficher ta récupération.")
        }
    }

    private func color(_ pct: Double) -> Color {
        if pct >= 1 { return Color(red: 0.3, green: 0.8, blue: 0.4) }
        if pct >= 0.6 { return Color(red: 0.95, green: 0.75, blue: 0.2) }
        return Color(red: 0.95, green: 0.35, blue: 0.35)
    }

    @ViewBuilder
    private func content(_ d: WidgetData) -> some View {
        let items = d.recovery ?? []
        VStack(alignment: .leading, spacing: 10) {
            WidgetCaption(text: "RÉCUPÉRATION MUSCULAIRE", color: Color(red: 0.95, green: 0.4, blue: 0.4))
            if items.isEmpty {
                Text("Fais une première séance : tes muscles apparaîtront ici avec leur temps de récupération.")
                    .font(.footnote).foregroundColor(.white.opacity(0.7))
            } else {
                ForEach(Array(items.enumerated()), id: \.offset) { _, m in
                    let pct = min(1, max(0, m.pct ?? 1))
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text((m.name ?? "").capitalized).font(.subheadline.weight(.semibold)).foregroundColor(.white)
                            Spacer()
                            Text(pct >= 1 ? "Prêt" : "encore \(m.hoursRemaining ?? 0) h")
                                .font(.footnote).foregroundColor(color(pct))
                        }
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(Color.white.opacity(0.12))
                                Capsule().fill(color(pct)).frame(width: max(6, geo.size.width * CGFloat(pct)))
                            }
                        }
                        .frame(height: 7)
                    }
                }
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .widgetBackground()
    }
}

struct PPLRecoveryWidget: Widget {
    let kind = "PPLRecoveryWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            RecoveryView(entry: entry)
        }
        .configurationDisplayName("Récupération")
        .description("Où en est chaque muscle de sa récupération : lesquels sont prêts, lesquels non.")
        .supportedFamilies([.systemLarge])
    }
}
