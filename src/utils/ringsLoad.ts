// ─── Anneau « Charge » de l'accueil ─────────────────────────────────────────
// Transforme la charge de la semaine en un remplissage d'anneau (0 à 1).
// On compare à la moyenne des semaines d'avant, comme le fait déjà le statut
// d'entraînement (utils/trainingStatus.ts) : seuls les ratios comptent, pas
// les valeurs brutes, qui n'ont pas de sens pour l'utilisateur.

/**
 * @param thisWeek     charge de la semaine en cours (RPE × minutes)
 * @param previousWeeks charge des semaines précédentes, de la plus récente à la plus ancienne
 * @returns remplissage entre 0 et 1, ou null s'il n'y a pas assez de recul pour comparer
 */
export const loadRingFill = (thisWeek: number, previousWeeks: number[]): number | null => {
  const past = previousWeeks.filter((v) => v > 0);
  // Moins de deux semaines de recul : un ratio serait du bruit, on masque l'anneau.
  if (past.length < 2) return null;
  const average = past.reduce((sum, v) => sum + v, 0) / past.length;
  const ratio = thisWeek / average;
  // TODO(human): transformer `ratio` (1 = autant que d'habitude) en remplissage entre 0 et 1.
  return Math.min(1, Math.max(0, ratio * 0));
};
