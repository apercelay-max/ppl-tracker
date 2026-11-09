// ─── Anneau « Charge » de l'accueil ─────────────────────────────────────────
// Transforme la charge de la semaine en un remplissage d'anneau (0 à 1).
// On compare à la moyenne des semaines d'avant, comme le fait déjà le statut
// d'entraînement (utils/trainingStatus.ts) : seuls les ratios comptent, pas
// les valeurs brutes, qui n'ont pas de sens pour l'utilisateur.
//
// Règle « zone idéale » : l'anneau est PLEIN quand la charge est bien dosée (entre
// 0,8 et 1,3 fois l'habituel, les mêmes seuils que le statut d'entraînement), et il se
// vide des deux côtés : trop peu (il se remplit à mesure qu'on s'approche de la zone)
// comme beaucoup trop (pic de charge, il redescend jusqu'à la moitié). Un anneau plein
// veut donc dire « bien dosé », pas « le plus possible » : en musculation, trop de
// charge est un risque, pas un exploit.
import { THRESHOLDS } from './trainingStatus';

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
  const low = THRESHOLDS.ratioLow;            // 0,8
  const high = THRESHOLDS.ratioHighFrom;      // 1,3
  const veryHigh = THRESHOLDS.ratioVeryHighFrom; // 1,5
  let fill: number;
  if (ratio < low) fill = ratio / low;                                   // trop peu : monte jusqu'à la zone
  else if (ratio <= high) fill = 1;                                      // dans la zone : plein
  else fill = Math.max(0.5, 1 - (0.5 * (ratio - high)) / (veryHigh - high)); // trop : redescend jusqu'à 0,5
  return Math.min(1, Math.max(0, fill));
};
