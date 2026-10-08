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
    id: '2026-10-08',
    title: 'Programme Strict V4.3',
    items: [
      'Le programme passe en V4.3 : la sèche court jusqu’au 21/10, avec les semaines 12 et 13.',
      'Deltoïde latéral en tête : élévations latérales ajoutées au Pull A, 5 séries au Push A, poulie basse au Push B.',
      'Push B : élévations frontales et pompes prise large retirées, triceps en prise pronation.',
      'Progression à un cran à la fois : la charge ne monte que si toutes les séries atteignent leurs reps.',
    ],
  },
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
