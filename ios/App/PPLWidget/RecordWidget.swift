import WidgetKit
import SwiftUI

struct RecordView: View {
    @Environment(\.widgetFamily) private var family
    let entry: SessionEntry

    var body: some View {
        if let d = entry.data {
            content(d).widgetURL(appLink("view/exercices"))
        } else {
            EmptyWidgetView(message: "Ouvre l'appli pour afficher ton dernier record.")
        }
    }

    @ViewBuilder
    private func content(_ d: WidgetData) -> some View {
        let gold = Color(red: 1.0, green: 0.78, blue: 0.2)
        if family == .systemSmall {
            VStack(alignment: .leading, spacing: 2) {
                WidgetCaption(text: "DERNIER RECORD", color: gold)
                Spacer(minLength: 0)
                if let r = d.lastRecord, let w = r.weight {
                    Image(systemName: "trophy.fill").font(.system(size: 20)).foregroundColor(gold)
                    Text("\(fmt(w)) \(d.unit ?? "kg")")
                        .font(.system(size: 30, weight: .heavy)).foregroundColor(.white)
                        .minimumScaleFactor(0.6).lineLimit(1)
                    Text(r.exercise ?? "")
                        .font(.footnote.weight(.semibold)).foregroundColor(.white.opacity(0.85))
                        .lineLimit(2).minimumScaleFactor(0.8)
                    Text(daysAgoText(r.daysAgo)).font(.caption2).foregroundColor(.white.opacity(0.55))
                } else {
                    Image(systemName: "trophy").font(.system(size: 22)).foregroundColor(.white.opacity(0.3))
                    Text("Pas encore de record. Bats un de tes poids pour qu'il s'affiche ici.")
                        .font(.footnote).foregroundColor(.white.opacity(0.7))
                        .lineLimit(4).minimumScaleFactor(0.8)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetBackground()
        } else {
            HStack(spacing: 18) {
                ZStack {
                    Circle().fill(gold.opacity(0.16))
                    Image(systemName: d.lastRecord == nil ? "trophy" : "trophy.fill")
                        .font(.system(size: 38)).foregroundColor(d.lastRecord == nil ? .white.opacity(0.3) : gold)
                }
                .frame(width: 84, height: 84)

                VStack(alignment: .leading, spacing: 3) {
                    WidgetCaption(text: "DERNIER RECORD", color: gold)
                    Spacer(minLength: 0)
                    if let r = d.lastRecord, let w = r.weight {
                        Text("\(fmt(w)) \(d.unit ?? "kg")")
                            .font(.system(size: 38, weight: .heavy)).foregroundColor(.white)
                            .minimumScaleFactor(0.6).lineLimit(1)
                        Text(r.exercise ?? "")
                            .font(.subheadline.weight(.semibold)).foregroundColor(.white.opacity(0.9))
                            .lineLimit(2).minimumScaleFactor(0.8)
                        Text(daysAgoText(r.daysAgo)).font(.footnote).foregroundColor(.white.opacity(0.6))
                    } else {
                        Text("Pas encore de record. Bats un de tes poids pour qu'il s'affiche ici.")
                            .font(.footnote).foregroundColor(.white.opacity(0.7))
                            .lineLimit(4).minimumScaleFactor(0.8)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetBackground()
        }
    }
}

struct PPLRecordWidget: Widget {
    let kind = "PPLRecordWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            ProGate(entry: entry) { RecordView(entry: entry) }
        }
        .configurationDisplayName("Dernier record")
        .description("Ton dernier poids record, avec l'exercice et la date.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
