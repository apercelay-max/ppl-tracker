import SwiftUI

private let accent = Color(red: 1.0, green: 0.45, blue: 0.3)

struct ContentView: View {
    @EnvironmentObject var model: WatchModel

    var body: some View {
        Group {
            if let state = model.state {
                if state.pro == false {
                    LockedView()
                } else if let session = state.session {
                    if let restEnd = session.restEnd, session.restPaused != true {
                        RestView(session: session, endDate: Date(timeIntervalSince1970: restEnd / 1000))
                    } else if session.restPaused == true {
                        RestView(session: session, endDate: nil)
                    } else {
                        SetView(session: session, unit: state.unit ?? "kg")
                    }
                } else {
                    IdleView(state: state)
                }
            } else {
                MessageView(icon: "iphone", text: "Ouvre PPL Tracker sur ton iPhone pour commencer.")
            }
        }
        .overlay(alignment: .bottom) {
            if let notice = model.notice {
                Text(notice).font(.caption2).multilineTextAlignment(.center)
                    .padding(6).background(.black.opacity(0.8)).cornerRadius(8)
            }
        }
    }
}

// ─── Séance : exercice, poids, répétitions, valider ─────────────────────────

struct SetView: View {
    @EnvironmentObject var model: WatchModel
    let session: WatchSession
    let unit: String

    @State private var weight: Double = 0
    @State private var reps: Int = 0

    private var step: Double { unit == "lbs" ? 5 : 2.5 }
    private var key: String { "\(session.exercise ?? "")|\(session.setNumber ?? 0)" }

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                VStack(spacing: 1) {
                    Text(session.exercise ?? "Séance").font(.headline).multilineTextAlignment(.center).lineLimit(2).minimumScaleFactor(0.7)
                    Text("Série \(session.setNumber ?? 1)/\(session.setsInExercise ?? 1)").font(.caption).foregroundColor(.secondary)
                }

                if session.bodyweight != true {
                    stepper(label: unit, value: weight == weight.rounded() ? String(Int(weight)) : String(format: "%.1f", weight),
                            minus: { weight = max(0, weight - step) }, plus: { weight += step })
                }
                stepper(label: "reps", value: "\(reps)", minus: { reps = max(0, reps - 1) }, plus: { reps += 1 })

                Button {
                    model.completeSet(weight: session.bodyweight == true ? nil : weight, reps: reps)
                } label: {
                    Text("Valider").font(.headline).frame(maxWidth: .infinity)
                }
                .tint(accent)
                .disabled(reps <= 0)

                ProgressView(value: Double(session.setsDone ?? 0), total: Double(max(session.setsTotal ?? 1, 1))).tint(accent)
                Text("\(session.setsDone ?? 0)/\(session.setsTotal ?? 1) séries").font(.caption2).foregroundColor(.secondary)
            }
        }
        .onAppear(perform: load)
        .onChange(of: key) { _ in load() }
    }

    private func load() {
        weight = session.weight ?? 0
        reps = session.reps ?? 0
    }

    private func stepper(label: String, value: String, minus: @escaping () -> Void, plus: @escaping () -> Void) -> some View {
        HStack {
            Button(action: minus) { Image(systemName: "minus") }.frame(width: 38)
            VStack(spacing: 0) {
                Text(value).font(.system(size: 22, weight: .bold)).monospacedDigit()
                Text(label).font(.system(size: 10)).foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
            Button(action: plus) { Image(systemName: "plus") }.frame(width: 38)
        }
    }
}

// ─── Repos : décompte et « Passer » ─────────────────────────────────────────

struct RestView: View {
    @EnvironmentObject var model: WatchModel
    let session: WatchSession
    let endDate: Date?

    var body: some View {
        VStack(spacing: 6) {
            Text(session.restPaused == true ? "Repos en pause" : "Repos").font(.caption).foregroundColor(accent)
            if let end = endDate {
                // iOS fait tourner le décompte tout seul à partir de la date de fin.
                Text(timerInterval: Date.now...max(end, Date.now.addingTimeInterval(1)), countsDown: true)
                    .font(.system(size: 40, weight: .heavy)).monospacedDigit()
            } else {
                let secs = Int((session.restPausedRemaining ?? 0).rounded())
                Text(String(format: "%d:%02d", secs / 60, secs % 60)).font(.system(size: 40, weight: .heavy)).monospacedDigit().opacity(0.6)
            }
            Text(session.exercise ?? "").font(.caption2).foregroundColor(.secondary).lineLimit(1)
            Text("\(session.setsDone ?? 0)/\(session.setsTotal ?? 1) séries").font(.caption2).foregroundColor(.secondary)
            Button("Passer") { model.skipRest() }.tint(accent)
        }
    }
}

// ─── Pas de séance : prochaine séance et semaine ────────────────────────────

struct IdleView: View {
    let state: WatchState

    var body: some View {
        let done = state.week?.done ?? 0
        let goal = max(state.week?.goal ?? 1, 1)
        VStack(spacing: 6) {
            Text("PROCHAINE SÉANCE").font(.system(size: 10, weight: .bold)).foregroundColor(accent)
            Text(state.next?.name ?? "PPL Tracker").font(.title3.weight(.heavy)).multilineTextAlignment(.center).minimumScaleFactor(0.6)
            HStack(spacing: 4) {
                ForEach(0..<min(goal, 7), id: \.self) { i in
                    Circle().fill(i < done ? accent : Color.white.opacity(0.2)).frame(width: 9, height: 9)
                }
            }
            Text("\(done)/\(goal) cette semaine").font(.caption2).foregroundColor(.secondary)
            Text("Lance la séance depuis ton iPhone.").font(.system(size: 10)).foregroundColor(.secondary).multilineTextAlignment(.center)
        }
    }
}

struct LockedView: View {
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: "lock.fill").font(.title2).foregroundColor(accent)
            Text("PPL Pro").font(.headline)
            Text("L’Apple Watch fait partie de PPL Pro. Active-le sur ton iPhone.").font(.caption2).multilineTextAlignment(.center).foregroundColor(.secondary)
        }
    }
}

struct MessageView: View {
    let icon: String
    let text: String

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon).font(.title2).foregroundColor(accent)
            Text(text).font(.caption).multilineTextAlignment(.center)
        }
    }
}
