import ActivityKit
import Foundation

// Décrit le minuteur de repos affiché sur l'écran verrouillé et dans la Dynamic
// Island. Ce fichier est compilé dans l'appli (qui démarre l'activité) ET dans
// le widget (qui la dessine) : les deux doivent voir exactement la même structure.
struct RestTimerAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        /// Fin du repos. Le décompte tourne tout seul côté iOS, sans que l'appli ait à le mettre à jour.
        var endDate: Date
        var totalSeconds: Double
        var paused: Bool
        /// Secondes restantes figées quand le repos est en pause.
        var pausedRemaining: Double
    }

    var title: String
}
