import ActivityKit
import WidgetKit
import SwiftUI

// Séance en cours sur l'écran verrouillé et dans la Dynamic Island : exercice, série,
// avancement, durée, et le décompte de repos quand il tourne. Les chiffres qui bougent
// (durée, repos) sont dessinés par iOS à partir de dates : l'appli peut être en
// arrière-plan, ils continuent de tourner juste sans qu'elle fasse rien.
private let accent = Color(red: 1.0, green: 0.45, blue: 0.3)

private typealias State = WorkoutActivityAttributes.ContentState

private func resting(_ s: State) -> Bool { s.restEndDate != nil }

private func restLabel(_ s: State) -> some View {
    Group {
        if s.restPaused {
            let secs = Int(s.restPausedRemaining.rounded())
            Text(String(format: "%d:%02d", secs / 60, secs % 60)).opacity(0.6)
        } else if let end = s.restEndDate {
            // Date.now...fin plante si la fin est déjà passée : on borne.
            Text(timerInterval: Date.now...max(end, Date.now.addingTimeInterval(1)), countsDown: true)
        }
    }
    .monospacedDigit()
}

private func elapsedLabel(_ s: State) -> some View {
    Group {
        if s.sessionPaused {
            Text("En pause").opacity(0.6)
        } else {
            Text(s.startDate, style: .timer)
        }
    }
    .monospacedDigit()
}

/// Le chiffre qui bouge à droite : le repos s'il y en a un, sinon la durée de la séance.
private func trailingLabel(_ s: State) -> some View {
    Group {
        if resting(s) { restLabel(s).foregroundColor(accent) } else { elapsedLabel(s) }
    }
}

private let heartColor = Color(red: 1.0, green: 0.27, blue: 0.35)

/// « 1 240 » à la française.
private func number(_ v: Double) -> String {
    let f = NumberFormatter()
    f.locale = Locale(identifier: "fr_FR")
    f.maximumFractionDigits = 0
    f.usesGroupingSeparator = true
    return f.string(from: NSNumber(value: v)) ?? "\(Int(v))"
}

/// Cœur et battements par minute ; un tiret tant qu'aucune mesure n'est arrivée.
private func heartLabel(_ s: State) -> some View {
    HStack(spacing: 4) {
        Image(systemName: "heart.fill").foregroundColor(heartColor)
        Text(s.heartRate.map { "\($0)" } ?? "–").font(.system(size: 20, weight: .heavy)).monospacedDigit()
        Text("bpm").font(.caption2).opacity(0.6)
    }
}

/// Une petite statistique : valeur en gras, légende dessous.
private func stat(_ value: String, _ caption: String) -> some View {
    VStack(spacing: 1) {
        Text(value).font(.system(size: 15, weight: .bold)).monospacedDigit()
        Text(caption).font(.system(size: 10)).opacity(0.6)
    }
    .frame(maxWidth: .infinity)
}

/// Les trois chiffres du résumé : séries faites, volume soulevé, durée.
private func statsRow(_ s: State) -> some View {
    HStack {
        VStack(spacing: 1) {
            HStack(spacing: 3) {
                Image(systemName: "heart.fill").font(.system(size: 11)).foregroundColor(heartColor)
                Text(s.heartRate.map { "\($0)" } ?? "–").font(.system(size: 15, weight: .bold)).monospacedDigit()
            }
            Text("bpm").font(.system(size: 10)).opacity(0.6)
        }
        .frame(maxWidth: .infinity)
        stat("\(s.setsDone)/\(s.setsTotal)", "séries")
        stat("\(number(s.volume)) \(s.unit)", "volume")
        VStack(spacing: 1) {
            elapsedLabel(s).font(.system(size: 15, weight: .bold))
            Text("durée").font(.system(size: 10)).opacity(0.6)
        }
        .frame(maxWidth: .infinity)
    }
}

private func progress(_ s: State) -> some View {
    VStack(spacing: 6) {
        if let end = s.restEndDate, !s.restPaused {
            let start = end.addingTimeInterval(-max(s.restTotalSeconds, 1))
            ProgressView(timerInterval: start...max(end, start.addingTimeInterval(1)), countsDown: true) { EmptyView() } currentValueLabel: { EmptyView() }
                .tint(accent)
        } else if resting(s) {
            ProgressView(value: 1 - min(1, s.restPausedRemaining / max(s.restTotalSeconds, 1))).tint(accent)
        } else {
            ProgressView(value: Double(min(s.setsDone, max(s.setsTotal, 1))), total: Double(max(s.setsTotal, 1))).tint(accent)
        }
    }
}

struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
            let s = context.state
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Image(systemName: resting(s) ? "timer" : "dumbbell.fill").foregroundColor(accent)
                    Text(resting(s) ? (s.restPaused ? "Repos en pause" : "Repos") : context.attributes.title)
                        .font(.headline)
                    Spacer()
                    if resting(s) { restLabel(s).font(.system(size: 26, weight: .heavy)).foregroundColor(accent) }
                }
                Text(s.exerciseName).font(.system(size: 17, weight: .bold)).lineLimit(1)
                Text("Série \(s.setNumber)/\(s.setsInExercise)").font(.caption).opacity(0.7)
                progress(s)
                statsRow(s)
            }
            .padding(16)
            .activityBackgroundTint(Color.black.opacity(0.85))
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            let s = context.state
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: resting(s) ? "timer" : "dumbbell.fill").foregroundColor(accent).font(.title2)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 0) {
                        trailingLabel(s).font(.system(size: 24, weight: .heavy)).lineLimit(1).minimumScaleFactor(0.7)
                        Text(resting(s) ? "repos" : "durée").font(.caption2).opacity(0.6).lineLimit(1).fixedSize()
                    }
                    .frame(width: 78, alignment: .trailing)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 1) {
                        Text(s.exerciseName).font(.subheadline.weight(.bold)).lineLimit(1).minimumScaleFactor(0.7)
                        Text("Série \(s.setNumber)/\(s.setsInExercise)").font(.caption).opacity(0.7)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 8) {
                        progress(s)
                        statsRow(s)
                    }
                }
            } compactLeading: {
                Image(systemName: resting(s) ? "timer" : "dumbbell.fill").foregroundColor(accent)
            } compactTrailing: {
                if resting(s) {
                    restLabel(s).frame(width: 52).foregroundColor(accent)
                } else {
                    Text("\(s.setsDone)/\(s.setsTotal)").font(.caption.weight(.semibold)).foregroundColor(accent)
                }
            } minimal: {
                Image(systemName: resting(s) ? "timer" : "dumbbell.fill").foregroundColor(accent)
            }
        }
    }
}
