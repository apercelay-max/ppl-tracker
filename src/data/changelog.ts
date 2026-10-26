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
    id: '2026-10-26',
    title: 'Séance sur iPad : nouveaux gestes',
    items: [
      'Les stats s’ouvrent en glissant vers le bas depuis tout en haut de l’écran, la liste des exercices en glissant vers le haut depuis tout en bas. Au milieu, le glissement vertical fait seulement défiler la carte.',
      'Nouveau : glisse depuis le coin haut-gauche vers le milieu pour ouvrir une barre latérale avec toutes les stats de la séance. Touche à côté, « Fermer » ou glisse-la vers la gauche pour la refermer.',
      'La vue iPad ne bascule plus vers l’ancienne liste en pleine séance, même si l’iPad zoome ou si le clavier apparaît.',
    ],
  },
  {
    id: '2026-10-25',
    title: 'Séance sur iPad',
    items: [
      'Sur iPad en paysage, la série en cours est au centre, avec l’exercice précédent et le suivant en cartes inclinées derrière.',
      'Glisse à gauche ou à droite pour changer d’exercice, vers le bas pour les stats, vers le haut pour voir tous les exercices.',
      'La barre du bas disparaît : durée et poids soulevé sont sous la carte « précédent », pause et stop sous la carte « suivant ».',
    ],
  },
  {
    id: '2026-10-12',
    title: 'Mode Tableur',
    items: [
      'Nouveau : « Tableur », dans le menu Plus. Tes séances en grille façon Excel, une colonne par séance faite.',
      'Elle se remplit toute seule : termine une séance et elle apparaît, série par série.',
      'Export Excel (.xlsx) de la grille, un onglet par séance.',
    ],
  },
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
