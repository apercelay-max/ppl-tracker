// Nouveautés affichées au démarrage (voir components/WhatsNewSheet.tsx).
//
// Pour annoncer une nouveauté : ajouter une entrée EN TÊTE de la liste, avec
// un `id` jamais utilisé. L'écran s'ouvre une seule fois par appareil pour
// toutes les entrées arrivées depuis la dernière visite ; un tout nouvel
// utilisateur (quiz de démarrage pas encore fait) ne voit rien.

export interface ChangelogEntry {
  /** Identifiant unique et stable, ex. « 2026-09-26 ». */
  id: string;
  title: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: '2026-09-26',
    title: 'Coach, statut et sauvegardes',
    items: [
      'Statut d’entraînement façon Garmin dans le Dashboard : statut, charge aiguë, aptitude.',
      'Importe ton historique depuis Strong, Hevy ou Fitbod, et exporte-le en CSV.',
      'Copies de secours locales automatiques et rappel d’export.',
      'Le coach IA bascule tout seul sur un autre modèle quand Google est saturé.',
    ],
  },
  {
    id: '2026-09-24',
    title: 'Accueil et coach',
    items: [
      'Accueil : série de semaines, récap « Cette semaine » et invitation à former un binôme.',
      'Dès la 1re séance, le coach te dit quoi faire « La prochaine fois ».',
      'Série active : les reps sont préremplies avec ta dernière fois.',
    ],
  },
];
