import { ExerciseProgress, HistoryEntry } from '../data/types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Tonnage = somme (poids × reps) sur toutes les séries complétées où le
 * poids et les reps sont numériques. Les séries au poids du corps ("PDC")
 * ou sautées ne comptent pas dans le tonnage (convention classique).
 */
export const computeTonnage = (exerciseProgress: ExerciseProgress): number => {
  let total = 0;
  for (const entries of Object.values(exerciseProgress)) {
    for (const e of entries) {
      if (!e.completed) continue;
      const w = parseFloat(e.weight);
      const r = parseInt(e.reps, 10);
      if (!isNaN(w) && !isNaN(r)) total += w * r;
    }
  }
  return Math.round(total);
};

/**
 * Charge d'entraînement (méthode session-RPE de Foster) :
 * charge = RPE (1-10) × durée de la séance en minutes.
 */
export const computeTrainingLoad = (rpe: number, durationMs: number): number => {
  const minutes = durationMs / 60000;
  return Math.round(rpe * minutes);
};

export interface WeekBucket {
  label: string;
  weeksAgo: number;
  tonnage: number;
  trainingLoad: number;
  sessionCount: number;
  hasLoad: boolean;
}

/**
 * Regroupe l'historique par semaine glissante (0 = semaine en cours).
 * Retourné du plus ancien au plus récent, prêt pour un graphique en barres.
 */
export const bucketByWeek = (history: HistoryEntry[], weeks = 8): WeekBucket[] => {
  const now = Date.now();
  const buckets: WeekBucket[] = Array.from({ length: weeks }, (_, i) => ({
    label: i === 0 ? 'Cette sem.' : `S-${i}`,
    weeksAgo: i,
    tonnage: 0,
    trainingLoad: 0,
    sessionCount: 0,
    hasLoad: false,
  }));

  for (const entry of history) {
    const weeksAgo = Math.floor((now - entry.date) / WEEK_MS);
    if (weeksAgo < 0 || weeksAgo >= weeks) continue;
    const bucket = buckets[weeksAgo];
    bucket.tonnage += entry.tonnage ?? computeTonnage(entry.exerciseProgress);
    bucket.sessionCount += 1;
    if (typeof entry.trainingLoad === 'number') {
      bucket.trainingLoad += entry.trainingLoad;
      bucket.hasLoad = true;
    }
  }

  return buckets.slice().reverse(); // plus ancien → plus récent
};

export type LoadStatus = {
  level: 'up' | 'stable' | 'down' | 'spike';
  label: string;
  detail: string;
};

/**
 * Statut de charge simplifié, inspiré du ratio charge aiguë / charge
 * chronique (ACWR) : compare la charge de la semaine en cours à la
 * moyenne des 3 semaines précédentes. Renvoie null si pas assez de
 * données pour être honnête plutôt que d'inventer un statut.
 */
export const computeLoadStatus = (buckets: WeekBucket[]): LoadStatus | null => {
  const thisWeek = buckets[buckets.length - 1];
  const prevWeeks = buckets.slice(0, buckets.length - 1).filter((b) => b.hasLoad);
  if (!thisWeek?.hasLoad || prevWeeks.length < 2) return null;

  const avgPrev = prevWeeks.reduce((s, b) => s + b.trainingLoad, 0) / prevWeeks.length;
  if (avgPrev === 0) return null;

  const ratio = thisWeek.trainingLoad / avgPrev;
  if (ratio > 1.5) {
    return { level: 'spike', label: '⚠️ Pic de charge', detail: 'Cette semaine est bien plus intense que la moyenne récente. Pense à bien récupérer.' };
  }
  if (ratio > 1.15) {
    return { level: 'up', label: '📈 Charge en hausse', detail: 'Tu pousses un peu plus fort que la moyenne récente.' };
  }
  if (ratio < 0.7) {
    return { level: 'down', label: '📉 Charge en baisse', detail: 'Moins de charge que la moyenne récente (deload ou séances manquées ?).' };
  }
  return { level: 'stable', label: '✅ Charge stable', detail: 'Ta charge d\'entraînement est régulière ces dernières semaines.' };
};
