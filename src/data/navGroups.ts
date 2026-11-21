import type { NavTabKey } from './types';

// Les 5 onglets de la barre du bas et, pour chacun, la liste des rubriques qui
// s'ouvre quand on re-touche l'onglet déjà ouvert (voir components/NavBar.tsx).
//
// Le classement répond à une seule question : « que veut voir l'utilisateur en
// arrivant dans cet onglet ? ». Le premier écran de chaque liste est donc celui
// qui s'ouvre d'office quand on touche l'onglet.
//
//   Accueil → FAIRE        « Qu'est-ce que je fais aujourd'hui ? »   → la séance du jour
//   Séances → REVOIR       « Qu'est-ce que j'ai déjà fait ? »        → l'historique
//   Progrès → MESURER      « Est-ce que j'avance ? »                 → les stats
//   Coach   → SE GUIDER    « Que me conseille-t-on ? »               → le bilan du coach
//   Profil  → RÉGLER       « Moi et mon appli »                      → le profil
//
// Les 12 écrans d'avant n'ont pas changé : ils sont seulement rangés autrement,
// chacun dans un seul onglet. Les clés (`view`) sont celles de l'ancienne barre.

export type NavGroupId = 'accueil' | 'seances' | 'progres' | 'coach' | 'profil';

export interface NavSubTab {
  /** L'écran ouvert (même clé que dans l'ancienne barre à 12 onglets). */
  view: NavTabKey;
  label: string;
  /** Une phrase courte, affichée sous le libellé dans la liste. */
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
    tagline: 'Ta séance du jour',
    items: [
      { view: 'home', label: 'Aujourd’hui', hint: 'Ta séance du jour et ta semaine' },
      { view: 'cardio', label: 'Cardio', hint: 'Course, vélo, marche…' },
    ],
  },
  {
    id: 'seances',
    label: 'Séances',
    tagline: 'Ce que tu as fait',
    items: [
      { view: 'historique', label: 'Historique', hint: 'Toutes tes séances passées' },
      { view: 'tableur', label: 'Tableur', hint: 'Tes séances en grille, façon Excel' },
    ],
  },
  {
    id: 'progres',
    label: 'Progrès',
    tagline: 'Est-ce que tu avances ?',
    items: [
      { view: 'dashboard', label: 'Stats', hint: 'Volume, progression, graphiques' },
      { view: 'exercices', label: 'Exercices', hint: 'Tes exercices et tes records' },
      { view: 'poids', label: 'Poids', hint: 'Suivi du poids de corps' },
      { view: 'objectifs', label: 'Objectifs', hint: 'Ce que tu vises, où tu en es' },
    ],
  },
  {
    id: 'coach',
    label: 'Coach',
    tagline: 'Tes conseils',
    items: [
      { view: 'coach', label: 'Coach IA', hint: 'Ton bilan analysé par l’IA' },
      { view: 'catalogue', label: 'Catalogue', hint: 'Tous les mouvements' },
    ],
  },
  {
    id: 'profil',
    label: 'Profil',
    tagline: 'Toi et ton appli',
    items: [
      { view: 'profil', label: 'Profil', hint: 'Ton résumé, tes records et tes badges' },
      { view: 'settings', label: 'Réglages', hint: 'Apparence, barre de menus, compte…' },
    ],
  },
];

/** L'onglet qui contient cet écran (l'Accueil si l'écran n'est dans aucun). */
export const groupOfView = (view: NavTabKey): NavGroup =>
  NAV_GROUPS.find((g) => g.items.some((i) => i.view === view)) ?? NAV_GROUPS[0];
