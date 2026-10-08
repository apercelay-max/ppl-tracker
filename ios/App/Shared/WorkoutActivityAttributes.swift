import ActivityKit
import Foundation

// Décrit la séance en cours affichée sur l'écran verrouillé et dans la Dynamic Island.
// Ce fichier est compilé dans l'appli (qui démarre et met à jour l'activité) ET dans le
// widget (qui la dessine) : les deux doivent voir exactement la même structure.
struct WorkoutActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var exerciseName: String
        /// Série en cours (à partir de 1) et nombre de séries de cet exercice.
        var setNumber: Int
        var setsInExercise: Int
        /// Avancement de toute la séance.
        var setsDone: Int
        var setsTotal: Int
        /// Début de la séance : iOS fait tourner la durée tout seul à partir de cette date.
        var startDate: Date
        var sessionPaused: Bool
        /// Repos en cours (nil entre deux repos). iOS fait tourner le décompte tout seul.
        var restEndDate: Date?
        var restTotalSeconds: Double
        var restPaused: Bool
        /// Secondes restantes figées quand le repos est en pause.
        var restPausedRemaining: Double
        /// Volume soulevé depuis le début (poids × répétitions), dans l'unité `unit`.
        var volume: Double
        var unit: String
        /// Fréquence cardiaque en battements par minute. Nil tant qu'aucune mesure n'arrive
        /// (elle viendra de HealthKit : Apple Watch ou ceinture cardiaque).
        var heartRate: Int?
    }

    /// Nom de la séance (« Pull A »).
    var title: String
}
