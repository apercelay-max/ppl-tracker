import ActivityKit
import WidgetKit
import SwiftUI

// Minuteur de repos sur l'écran verrouillé et dans la Dynamic Island. Le décompte
// est dessiné par iOS à partir de la date de fin : l'appli peut être en
// arrière-plan, le chiffre continue de tourner juste.
private let rest = Color(red: 1.0, green: 0.45, blue: 0.3)

private func timerLabel(_ s: RestTimerAttributes.ContentState) -> some View {
    Group {
        if s.paused {
            let secs = Int(s.pausedRemaining.rounded())
            Text(String(format: "%d:%02d", secs / 60, secs % 60)).opacity(0.6)
        } else {
            // Date.now...fin plante si la fin est déjà passée : on borne.
            Text(timerInterval: Date.now...max(s.endDate, Date.now.addingTimeInterval(1)), countsDown: true)
        }
    }
    .monospacedDigit()
}

private func bar(_ s: RestTimerAttributes.ContentState) -> some View {
    Group {
        if s.paused {
            ProgressView(value: 1 - min(1, s.pausedRemaining / max(s.totalSeconds, 1)))
        } else {
            let start = s.endDate.addingTimeInterval(-max(s.totalSeconds, 1))
            ProgressView(timerInterval: start...max(s.endDate, start.addingTimeInterval(1)), countsDown: true) { EmptyView() } currentValueLabel: { EmptyView() }
        }
    }
    .tint(rest)
}

struct RestTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RestTimerAttributes.self) { context in
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "timer").foregroundColor(rest)
                    Text(context.state.paused ? "Repos en pause" : "Repos").font(.headline)
                    Spacer()
                    timerLabel(context.state).font(.system(size: 30, weight: .heavy))
                }
                bar(context.state)
                Text(context.attributes.title).font(.caption).opacity(0.7)
            }
            .padding(16)
            .activityBackgroundTint(Color.black.opacity(0.85))
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "timer").foregroundColor(rest).font(.title2)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    timerLabel(context.state).font(.system(size: 28, weight: .heavy))
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.paused ? "Repos en pause" : "Repos").font(.headline)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    bar(context.state)
                }
            } compactLeading: {
                Image(systemName: "timer").foregroundColor(rest)
            } compactTrailing: {
                timerLabel(context.state).frame(width: 52).foregroundColor(rest)
            } minimal: {
                Image(systemName: "timer").foregroundColor(rest)
            }
        }
    }
}
