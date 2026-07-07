// ─── Badges de progression ─────────────────────────────────────────────
// Système générique à paliers : chaque catégorie a une valeur numérique
// réelle (compteur du store) et une liste de paliers croissants. Rien
// n'est inventé — un badge ne se débloque que si la valeur réelle
// atteint le seuil, et reste acquis même si la valeur redescend ensuite
// (ex : régularité), comme un vrai trophée.

export interface BadgeTierDef {
  threshold: number;
  label: string;
}

export interface BadgeCategoryDef {
  id: string;
  emoji: string;
  title: string;
  unitLabel: (n: number) => string;
  tiers: BadgeTierDef[];
}

export const BADGE_CATEGORIES: BadgeCategoryDef[] = [
  {
    id: 'sessions',
    emoji: '💪',
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
    emoji: '🔥',
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
    emoji: '🏃',
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
    emoji: '⚖️',
    title: 'Suivi du poids',
    unitLabel: (n) => `${n} pesée${n > 1 ? 's' : ''} enregistrée${n > 1 ? 's' : ''}`,
    tiers: [
      { threshold: 10, label: 'Premier suivi' },
      { threshold: 30, label: 'Suivi assidu' },
    ],
  },
  {
    id: 'records',
    emoji: '🏆',
    title: 'Records personnels',
    unitLabel: (n) => (n > 0 ? 'Au moins un record chiffré' : 'Aucun record chiffré pour l\'instant'),
    tiers: [
      { threshold: 1, label: 'Premier record personnel' },
    ],
  },
];

export interface BadgeProgress {
  category: BadgeCategoryDef;
  value: number;
  currentTier: BadgeTierDef | null;
  nextTier: BadgeTierDef | null;
  progressToNext: number; // 0-1, toujours 1 si tous les paliers sont acquis
}

export const computeBadgeProgress = (category: BadgeCategoryDef, value: number): BadgeProgress => {
  let currentTier: BadgeTierDef | null = null;
  let nextTier: BadgeTierDef | null = null;
  for (const tier of category.tiers) {
    if (value >= tier.threshold) currentTier = tier;
    else { nextTier = tier; break; }
  }
  const prevThreshold = currentTier?.threshold ?? 0;
  const progressToNext = nextTier
    ? Math.max(0, Math.min(1, (value - prevThreshold) / (nextTier.threshold - prevThreshold)))
    : 1;
  return { category, value, currentTier, nextTier, progressToNext };
};
