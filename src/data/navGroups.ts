import type { NavTabKey } from './types';

// Les 5 onglets de la barre du bas et, pour chacun, la liste des rubriques qui
// s'ouvre quand on re-touche l'onglet déjà ouvert (voir components/NavBar.tsx).
//
// Le classement répond à une seule question : « que veut faire ou voir l'utilisateur
// en arrivant dans cet onglet ? ». Le premier écran de chaque liste est donc celui
// qui s'ouvre d'office quand on touche l'onglet.
//
//   Accueil → FAIRE        « Qu'est-ce que je fais aujourd'hui ? »   → la séance du jour, un cardio
//   Séances → REVOIR       « Qu'est-ce que j'ai déjà fait ? »        → l'historique, puis les exercices
//   Progrès → MESURER      « Est-ce que j'avance ? »                 → les stats, puis objectifs et poids
//   Coach   → SE GUIDER    « Que faire pour progresser ? »           → le bilan du coach, puis le catalogue
//   Profil  → RÉGLER       « Moi et mon appli »                      → le profil, puis les réglages
//
// Les 11 écrans de l'appli sont les mêmes qu'avant : chacun est rangé dans UN seul
// onglet (aucun perdu, aucun en double) et garde sa clé (`view`). Chaque onglet a au
// moins 2 rubriques : une liste d'une seule ligne n'aurait aucun sens. Les rangements
// qui ont demandé un choix :
//  - Cardio est dans Accueil : on y LANCE une sortie (vélo, course, marche) ou on la
//    note ; la liste des sorties passées n'est que le bas de la page. C'est du « faire »,
//    comme « Aujourd'hui ».
//  - Exercices et Catalogue : même mot, deux choses. Exercices = TON passé, exercice par
//    exercice (records, courbes) → Séances. Catalogue = la bibliothèque (fiches d'exercices,
//    programmes, générateur) qui sert à préparer la suite → Coach.
//  - Objectifs décrit (la semaine, les muscles en retard, la récupération, les records)
//    mais ne dit pas quoi faire : c'est un état des lieux → Progrès. Conseiller, c'est le
//    travail du Coach.
//  - Stats mesure (volume, charge) ; Profil récompense (résumé à vie, badges) et reste
//    avec Réglages, sous « Toi et ton appli ».

export type NavGroupId = 'accueil' | 'seances' | 'progres' | 'coach' | 'profil';

export interface NavSubTab {
  /** L'écran ouvert (même clé que dans l'ancienne barre). */
  view: NavTabKey;
  label: string;
  /** Une phrase courte (40 caractères environ), affichée sous le libellé dans la liste. */
  hint: string;
}

export interface NavGroup {
  id: NavGroupId;
  /** Libellé sous l'icône : court (7 lettres environ), il doit tenir dans 52 px. */
  label: string;
  /** Ce que l'utilisateur vient y chercher, affiché en tête de la liste. */
  tagline: string;
  /** Le premier est l'écran d'arrivée de l'onglet. */
  items: NavSubTab[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'accueil',
    label: 'Accueil',
    tagline: 'Ce que tu fais aujourd’hui',
    items: [
      { view: 'home', label: 'Aujourd’hui', hint: 'Ta séance du jour et ta semaine' },
      { view: 'cardio', label: 'Cardio', hint: 'Vélo, course, marche : lance ou note' },
    ],
  },
  {
    id: 'seances',
    label: 'Séances',
    tagline: 'Ce que tu as fait',
    items: [
      { view: 'historique', label: 'Historique', hint: 'Tes séances, jour par jour' },
      { view: 'exercices', label: 'Exercices', hint: 'Tes records et courbes, par exercice' },
    ],
  },
  {
    id: 'progres',
    label: 'Progrès',
    tagline: 'Est-ce que tu avances ?',
    items: [
      { view: 'dashboard', label: 'Stats', hint: 'Volume, charge, graphiques' },
      { view: 'objectifs', label: 'Objectifs', hint: 'Ta semaine, tes muscles, ta récupération' },
      { view: 'poids', label: 'Poids', hint: 'Ton poids de corps et sa courbe' },
    ],
  },
  {
    id: 'coach',
    label: 'Coach',
    tagline: 'Tes conseils et ton programme',
    items: [
      { view: 'coach', label: 'Coach IA', hint: 'Ton bilan analysé par l’IA' },
      { view: 'catalogue', label: 'Catalogue', hint: 'Programmes et fiches d’exercices' },
    ],
  },
  {
    id: 'profil',
    label: 'Profil',
    tagline: 'Toi et ton appli',
    items: [
      { view: 'profil', label: 'Profil', hint: 'Ton résumé et tes badges' },
      { view: 'settings', label: 'Réglages', hint: 'Séance, apparence, compte, données' },
    ],
  },
];

/** L'onglet qui contient cet écran (l'Accueil si l'écran n'est dans aucun). */
export const groupOfView = (view: NavTabKey): NavGroup =>
  NAV_GROUPS.find((g) => g.items.some((i) => i.view === view)) ?? NAV_GROUPS[0];
