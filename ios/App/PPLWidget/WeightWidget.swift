import WidgetKit
import SwiftUI

struct Sparkline: View {
    let points: [Double]
    let color: Color

    var body: some View {
        GeometryReader { geo in
            let lo = points.min() ?? 0
            let span = max((points.max() ?? 1) - lo, 0.5)
            let pts: [CGPoint] = points.enumerated().map { i, v in
                CGPoint(
                    x: points.count > 1 ? geo.size.width * CGFloat(i) / CGFloat(points.count - 1) : geo.size.width / 2,
                    y: geo.size.height * (1 - CGFloat((v - lo) / span)))
            }
            ZStack {
                Path { p in
                    for (i, pt) in pts.enumerated() {
                        if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
                    }
                }
                .stroke(color, style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
                if let last = pts.last {
                    Circle().fill(color).frame(width: 8, height: 8).position(last)
                }
            }
        }
    }
}

struct WeightView: View {
    let entry: SessionEntry

    var body: some View {
        if let d = entry.data {
            content(d).widgetURL(appLink("view/poids"))
        } else {
            EmptyWidgetView(message: "Ouvre l'appli pour afficher ton poids.")
        }
    }

    @ViewBuilder
    private func content(_ d: WidgetData) -> some View {
        let blue = Color(red: 0.35, green: 0.7, blue: 1.0)
        let unit = d.unit ?? "kg"
        if let bw = d.bodyWeight, let latest = bw.latest {
            HStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 2) {
                    WidgetCaption(text: "POIDS DE CORPS", color: blue)
                    Spacer(minLength: 0)
                    Text("\(fmt(latest)) \(unit)")
                        .font(.system(size: 30, weight: .heavy)).foregroundColor(.white)
                        .minimumScaleFactor(0.6).lineLimit(1)
                    if let delta = bw.delta {
                        // Pour une sèche ou une prise de masse, ni la baisse ni la hausse n'est « bonne » en soi : on reste neutre.
                        Text("\(delta > 0 ? "+" : delta < 0 ? "−" : "")\(fmt(abs(delta))) \(unit) en 30 j")
                            .font(.footnote.weight(.semibold)).foregroundColor(.white.opacity(0.75))
                    } else {
                        Text("Pèse-toi pour voir l'évolution").font(.footnote).foregroundColor(.white.opacity(0.6))
                    }
                }
                if let pts = bw.points, pts.count >= 2 {
                    Sparkline(points: pts, color: blue).frame(maxWidth: .infinity).padding(.vertical, 12)
                } else {
                    Spacer(minLength: 0)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .widgetBackground()
        } else {
            EmptyWidgetView(message: "Ajoute ton poids dans l'appli pour suivre ta courbe ici.")
        }
    }
}

struct PPLWeightWidget: Widget {
    let kind = "PPLWeightWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            WeightView(entry: entry)
        }
        .configurationDisplayName("Poids de corps")
        .description("Ton dernier poids et la courbe des 30 derniers jours.")
        .supportedFamilies([.systemMedium])
    }
}
