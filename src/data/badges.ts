// ─── Badges de progression ─────────────────────────────────────────────
// Système générique à paliers : chaque catégorie a une valeur numérique
// réelle (compteur du store ou calcul sur l'historique) et une liste de
// paliers croissants. Rien n'est inventé — un badge ne se débloque que si
// la valeur réelle atteint le seuil, et reste acquis même si la valeur
// redescend ensuite (ex : régularité), comme un vrai trophée.
//
// Chaque catégorie porte aussi un `motif` : le dessin décoratif affiché
// derrière l'icône dans le médaillon (voir components/BadgeMedallion.tsx),
// pour que chaque badge ait une identité visuelle propre.

export type BadgeMotif =
  | 'rays' | 'spikes' | 'track' | 'dots' | 'starburst' | 'hex' | 'rings' | 'diamonds'
  | 'sunrise' | 'stars' | 'grid' | 'pulse' | 'quad' | 'bars' | 'pins' | 'lines';

export interface BadgeTierDef {
  threshold: number;
  label: string;
}

export interface BadgeCategoryDef {
  id: string;
  /** Clé d'icône, traduite en SVG par components/DataIcon.tsx. */
  icon: string;
  /** Dessin décoratif du médaillon, voir components/BadgeMedallion.tsx. */
  motif: BadgeMotif;
  title: string;
  unitLabel: (n: number) => string;
  tiers: BadgeTierDef[];
}

export const BADGE_CATEGORIES: BadgeCategoryDef[] = [
  {
    id: 'sessions',
    icon: 'biceps',
    motif: 'rays',
    title: 'Séances complétées',
    unitLabel: (n) => `${n} séance${n > 1 ? 's' : ''}`,
    tiers: [
      { threshold: 10, label: 'Débutant motivé' },
      { threshold: 25, label: 'Habitué de la salle' },
      { threshold: 50, label: 'Assidu' },
      { threshold: 100, label: 'Vétéran' },
      { threshold: 200, label: 'Centurion' },
    ],
  },
  {
    id: 'streak',
    icon: 'flame',
    motif: 'spikes',
    title: 'Régularité (semaines d\'affilée)',
    unitLabel: (n) => `${n} semaine${n > 1 ? 's' : ''} d'affilée`,
    tiers: [
      { threshold: 4, label: 'Un mois solide' },
      { threshold: 8, label: 'Deux mois de suite' },
      { threshold: 12, label: 'Trois mois de suite' },
      { threshold: 26, label: 'Une demi-année sans lâcher' },
    ],
  },
  {
    id: 'cardio',
    icon: 'run',
    motif: 'track',
    title: 'Séances cardio',
    unitLabel: (n) => `${n} séance${n > 1 ? 's' : ''} cardio`,
    tiers: [
      { threshold: 10, label: 'Premiers pas' },
      { threshold: 25, label: 'Cardio régulier' },
      { threshold: 50, label: 'Endurance de fer' },
    ],
  },
  {
    id: 'bodyweight',
    icon: 'scale',
    motif: 'dots',
    title: 'Suivi du poids',
    unitLabel: (n) => `${n} pesée${n > 1 ? 's' : ''} enregistrée${n > 1 ? 's' : ''}`,
    tiers: [
      { threshold: 10, label: 'Premier suivi' },
      { threshold: 30, label: 'Suivi assidu' },
    ],
  },
  {
    id: 'records',
    icon: 'trophy',
    motif: 'starburst',
    title: 'Records personnels',
    unitLabel: (n) => `${n} record${n > 1 ? 's' : ''} personnel${n > 1 ? 's' : ''}`,
    tiers: [
      { threshold: 1, label: 'Premier record personnel' },
      { threshold: 5, label: 'Chasseur de records' },
      { threshold: 15, label: 'Collectionneur de records' },
      { threshold: 30, label: 'Légende du PR' },
    ],
  },
  {
    id: 'tonnage',
    icon: 'plate',
    motif: 'hex',
    title: 'Tonnage soulevé',
    unitLabel: (n) => `${n.toLocaleString('fr-FR')} kg soulevés`,
    tiers: [
      { threshold: 10000, label: 'Première tonne' },
      { threshold: 50000, label: 'Force montante' },
      { threshold: 150000, label: 'Mur de fonte' },
      { threshold: 500000, label: 'Titan' },
    ],
  },
  {
    id: 'duration',
    icon: 'clock',
    motif: 'rings',
    title: 'Temps d\'entraînement',
    unitLabel: (n) => `${n}h d'entraînement cumulées`,
    tiers: [
      { threshold: 10, label: 'Premières heures' },
      { threshold: 50, label: 'Habitué du chrono' },
      { threshold: 150, label: 'Grinder' },
      { threshold: 400, label: 'Marathonien de la salle' },
    ],
  },
  {
    id: 'variety',
    icon: 'book',
    motif: 'diamonds',
    title: 'Exercices différents',
    unitLabel: (n) => `${n} exercice${n > 1 ? 's' : ''} différent${n > 1 ? 's' : ''} pratiqué${n > 1 ? 's' : ''}`,
    tiers: [
      { threshold: 10, label: 'Explorateur' },
      { threshold: 20, label: 'Polyvalent' },
      { threshold: 30, label: 'Encyclopédie du mouvement' },
    ],
  },
  {
    id: 'earlyBird',
    icon: 'sun',
    motif: 'sunrise',
    title: 'Séances matinales (avant 7h)',
    unitLabel: (n) => `${n} séance${n > 1 ? 's' : ''} avant 7h`,
    tiers: [
      { threshold: 5, label: 'Lève-tôt occasionnel' },
      { threshold: 15, label: 'Habitué du réveil' },
      { threshold: 40, label: 'Moine du matin' },
    ],
  },
  {
    id: 'nightOwl',
    icon: 'moon',
    motif: 'stars',
    title: 'Séances nocturnes (après 21h)',
    unitLabel: (n) => `${n} séance${n > 1 ? 's' : ''} après 21h`,
    tiers: [
      { threshold: 5, label: 'Oiseau de nuit occasionnel' },
      { threshold: 15, label: 'Noctambule' },
      { threshold: 40, label: 'Insomniaque de la fonte' },
    ],
  },
  {
    id: 'weekend',
    icon: 'calendar',
    motif: 'grid',
    title: 'Séances le week-end',
    unitLabel: (n) => `${n} séance${n > 1 ? 's' : ''} le week-end`,
    tiers: [
      { threshold: 10, label: 'Guerrier du week-end' },
      { threshold: 30, label: 'Week-ends sacrés' },
      { threshold: 60, label: 'Jamais de pause' },
    ],
  },
  {
    id: 'cardioCalories',
    icon: 'heart',
    motif: 'pulse',
    title: 'Calories cardio brûlées',
    unitLabel: (n) => `${n.toLocaleString('fr-FR')} kcal brûlées en cardio`,
    tiers: [
      { threshold: 1000, label: 'Premières calories' },
      { threshold: 5000, label: 'Brûleur régulier' },
      { threshold: 15000, label: 'Fournaise' },
      { threshold: 40000, label: 'Moteur thermique' },
    ],
  },
  {
    id: 'cardioVariety',
    icon: 'activity',
    motif: 'quad',
    title: 'Types de cardio essayés',
    unitLabel: (n) => `${n} type${n > 1 ? 's' : ''} de cardio différent${n > 1 ? 's' : ''}`,
    tiers: [
      { threshold: 2, label: 'Touche-à-tout' },
      { threshold: 3, label: 'Polyvalent cardio' },
      { threshold: 4, label: 'Expert multi-sport' },
    ],
  },
  {
    id: 'marathon',
    icon: 'gauge',
    motif: 'bars',
    title: 'Longues séances (75 min et +)',
    unitLabel: (n) => `${n} séance${n > 1 ? 's' : ''} de 75 min ou plus`,
    tiers: [
      { threshold: 5, label: 'Séances marathon' },
      { threshold: 15, label: 'Habitué des longues séances' },
      { threshold: 40, label: 'Ultra-endurant' },
    ],
  },
  {
    id: 'gyms',
    icon: 'home',
    motif: 'pins',
    title: 'Salles différentes',
    unitLabel: (n) => `${n} salle${n > 1 ? 's' : ''} différente${n > 1 ? 's' : ''} fréquentée${n > 1 ? 's' : ''}`,
    tiers: [
      { threshold: 2, label: 'Globe-trotter' },
      { threshold: 4, label: 'Habitué de plusieurs salles' },
      { threshold: 6, label: 'Nomade de la fonte' },
    ],
  },
  {
    id: 'journal',
    icon: 'star',
    motif: 'lines',
    title: 'Notes de séance',
    unitLabel: (n) => `${n} séance${n > 1 ? 's' : ''} avec une note écrite`,
    tiers: [
      { threshold: 5, label: 'Premières notes' },
      { threshold: 20, label: 'Carnet assidu' },
      { threshold: 50, label: 'Journal complet' },
    ],
  },
];

export interface BadgeProgress {
  category: BadgeCategoryDef;
  value: number;
  currentTier: BadgeTierDef | null;
  currentTierIndex: number; // -1 si aucun palier atteint
  nextTier: BadgeTierDef | null;
  progressToNext: number; // 0-1, toujours 1 si tous les paliers sont acquis
}

export const computeBadgeProgress = (category: BadgeCategoryDef, value: number): BadgeProgress => {
  let currentTier: BadgeTierDef | null = null;
  let currentTierIndex = -1;
  let nextTier: BadgeTierDef | null = null;
  for (let i = 0; i < category.tiers.length; i++) {
    const tier = category.tiers[i];
    if (value >= tier.threshold) { currentTier = tier; currentTierIndex = i; }
    else { nextTier = tier; break; }
  }
  const prevThreshold = currentTier?.threshold ?? 0;
  const progressToNext = nextTier
    ? Math.max(0, Math.min(1, (value - prevThreshold) / (nextTier.threshold - prevThreshold)))
    : 1;
  return { category, value, currentTier, currentTierIndex, nextTier, progressToNext };
};
