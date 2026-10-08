import WidgetKit
import SwiftUI

// Widgets de l'écran verrouillé : monochromes, iOS choisit lui-même la teinte.
struct LockScreenView: View {
    @Environment(\.widgetFamily) private var family
    let entry: SessionEntry

    var body: some View {
        let d = entry.data
        let done = d?.sessionsThisWeek ?? 0
        let goal = max(d?.weeklyGoal ?? 1, 1)
        let name = d?.nextName ?? "PPL Tracker"

        switch family {
        case .accessoryCircular:
            Gauge(value: Double(min(done, goal)), in: 0...Double(goal)) {
                Image(systemName: "dumbbell.fill")
            } currentValueLabel: {
                Text("\(done)/\(goal)")
            }
            .gaugeStyle(.accessoryCircular)
            .widgetBackground(.clear)
        case .accessoryInline:
            Text("\(name) · \(done)/\(goal)")
                .widgetBackground(.clear)
        default: // accessoryRectangular
            VStack(alignment: .leading, spacing: 2) {
                Text("Prochaine : \(name)").font(.headline).lineLimit(1)
                Text("\(done)/\(goal) séances cette semaine").font(.caption)
                ProgressView(value: Double(min(done, goal)), total: Double(goal))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .widgetBackground(.clear)
        }
    }
}

struct PPLLockWidget: Widget {
    let kind = "PPLLockWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            ProGate(entry: entry) { LockScreenView(entry: entry).widgetURL(appLink("session/\(entry.data?.nextDayId ?? "")")) }
        }
        .configurationDisplayName("Écran verrouillé")
        .description("Ta prochaine séance et ta progression de la semaine, sans déverrouiller.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}
