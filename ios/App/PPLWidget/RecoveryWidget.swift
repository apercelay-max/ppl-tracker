import WidgetKit
import SwiftUI

struct RecoveryView: View {
    @Environment(\.widgetFamily) private var family
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

    // Une ligne : nom, état et barre. `compact` retire l'état pour tenir dans un petit widget.
    private func row(_ m: RecoveryItem, compact: Bool) -> some View {
        let pct = min(1, max(0, m.pct ?? 1))
        return VStack(alignment: .leading, spacing: compact ? 2 : 4) {
            HStack {
                Text((m.name ?? "").capitalized)
                    .font(compact ? .caption.weight(.semibold) : .subheadline.weight(.semibold))
                    .foregroundColor(.white).lineLimit(1)
                Spacer(minLength: 4)
                if !compact {
                    Text(pct >= 1 ? "Prêt" : "encore \(m.hoursRemaining ?? 0) h")
                        .font(.footnote).foregroundColor(color(pct))
                }
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.12))
                    Capsule().fill(color(pct)).frame(width: max(6, geo.size.width * CGFloat(pct)))
                }
            }
            .frame(height: compact ? 5 : 7)
        }
    }

    @ViewBuilder
    private func content(_ d: WidgetData) -> some View {
        let items = d.recovery ?? []
        let red = Color(red: 0.95, green: 0.4, blue: 0.4)
        VStack(alignment: .leading, spacing: family == .systemSmall ? 6 : 10) {
            WidgetCaption(text: family == .systemSmall ? "RÉCUPÉRATION" : "RÉCUPÉRATION MUSCULAIRE", color: red)
            if items.isEmpty {
                Text("Fais une première séance : tes muscles apparaîtront ici avec leur temps de récupération.")
                    .font(.footnote).foregroundColor(.white.opacity(0.7))
            } else if family == .systemSmall {
                ForEach(Array(items.prefix(3).enumerated()), id: \.offset) { _, m in row(m, compact: true) }
            } else if family == .systemMedium {
                // Deux colonnes de trois : les muscles les moins récupérés d'abord.
                let shown = Array(items.prefix(6))
                HStack(alignment: .top, spacing: 16) {
                    VStack(spacing: 8) {
                        ForEach(Array(shown.enumerated().filter { $0.offset % 2 == 0 }), id: \.offset) { _, e in row(e, compact: true) }
                    }
                    VStack(spacing: 8) {
                        ForEach(Array(shown.enumerated().filter { $0.offset % 2 == 1 }), id: \.offset) { _, e in row(e, compact: true) }
                    }
                }
            } else {
                ForEach(Array(items.enumerated()), id: \.offset) { _, m in row(m, compact: false) }
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
            ProGate(entry: entry) { RecoveryView(entry: entry) }
        }
        .configurationDisplayName("Récupération")
        .description("Où en est chaque muscle de sa récupération : lesquels sont prêts, lesquels non.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
