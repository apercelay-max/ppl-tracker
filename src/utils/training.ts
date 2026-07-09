import { ExerciseProgress, HistoryEntry, SetEntry, WorkoutDay } from '../data/types';
import { WORKOUTS } from '../data/workouts';

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

export interface SessionComparison {
  previous?: { tonnage: number; trainingLoad?: number; date: number };
  first?: { tonnage: number; trainingLoad?: number; date: number };
  tonnagePctVsPrevious?: number;
  tonnagePctVsFirst?: number;
}

/**
 * Compare le tonnage (et la charge d'entraînement si dispo) de la séance
 * qu'on vient de terminer à la séance précédente du même jour (dayId) et
 * à la toute première séance de ce jour jamais enregistrée. `history`
 * doit déjà contenir la séance courante en position 0 (c'est le cas juste
 * après finishSession()).
 */
export const compareSessionToHistory = (
  history: HistoryEntry[],
  dayId: string,
  currentTonnage: number
): SessionComparison => {
  const sameDay = history.filter((h) => h.dayId === dayId);
  if (sameDay.length < 2) return {};

  const previous = sameDay[1];
  const first = sameDay[sameDay.length - 1];
  const previousTonnage = previous.tonnage ?? computeTonnage(previous.exerciseProgress);
  const result: SessionComparison = {
    previous: { tonnage: previousTonnage, trainingLoad: previous.trainingLoad, date: previous.date },
  };
  if (previousTonnage) {
    result.tonnagePctVsPrevious = Math.round(((currentTonnage - previousTonnage) / previousTonnage) * 100);
  }
  if (first !== previous) {
    const firstTonnage = first.tonnage ?? computeTonnage(first.exerciseProgress);
    result.first = { tonnage: firstTonnage, trainingLoad: first.trainingLoad, date: first.date };
    if (firstTonnage) {
      result.tonnagePctVsFirst = Math.round(((currentTonnage - firstTonnage) / firstTonnage) * 100);
    }
  }
  return result;
};

/**
 * Retrouve les séries de la dernière séance où cet exercice a été fait
 * (peu importe le jour PPL), pour afficher "Dernière fois : Xkg × Y" sur
 * chaque ligne de série. `history` est déjà trié du plus récent au plus
 * ancien (unshift à chaque fin de séance).
 */
export const getLastExerciseSets = (history: HistoryEntry[], exerciseId: string): SetEntry[] | null => {
  for (const entry of history) {
    const sets = entry.exerciseProgress[exerciseId];
    if (sets && sets.some((s) => s.completed)) return sets;
  }
  return null;
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
}

// ─── Progression par exercice ────────────────────────────────────────────────

export interface ExerciseHistoryPoint {
  date: number;
  maxWeight: number; // poids numérique max soulevé ce jour-là sur cet exercice
}

/**
 * Reconstruit la liste "nom d'exercice" → id, une seule fois, pour les
 * sélecteurs (dashboard). Ordre = ordre de définition dans workouts.ts.
 */
export const ALL_EXERCISES = WORKOUTS.flatMap((w) => w.exercises).reduce(
  (acc, ex) => (acc.some((e) => e.id === ex.id) ? acc : [...acc, { id: ex.id, name: ex.name, muscleGroup: ex.muscleGroup }]),
  [] as { id: string; name: string; muscleGroup: string }[]
);

/**
 * Historique du poids max (numérique) soulevé sur un exercice donné,
 * du plus ancien au plus récent (prêt pour un graphique). Ignore les
 * séries au poids du corps ("PDC") ou non numériques — seule la charge
 * chiffrée est comparable dans le temps.
 */
/**
 * Poids max (numérique) jamais soulevé sur un exercice, toutes séances
 * confondues. Sert à détecter les records personnels (PR) en direct
 * pendant une séance — 0 si l'exercice n'a encore jamais été fait avec un
 * poids chiffré (pas de "record" à annoncer dans ce cas).
 */
export const getMaxWeightEver = (history: HistoryEntry[], exerciseId: string): number => {
  let max = 0;
  for (const entry of history) {
    const sets = entry.exerciseProgress[exerciseId];
    if (!sets) continue;
    for (const s of sets) {
      if (!s.completed) continue;
      const w = parseFloat(s.weight);
      if (!isNaN(w) && w > max) max = w;
    }
  }
  return max;
};

export const getExerciseWeightHistory = (history: HistoryEntry[], exerciseId: string): ExerciseHistoryPoint[] => {
  const points: ExerciseHistoryPoint[] = [];
  for (const entry of history) {
    const sets = entry.exerciseProgress[exerciseId];
    if (!sets) continue;
    let max = 0;
    for (const s of sets) {
      if (!s.completed) continue;
      const w = parseFloat(s.weight);
      if (!isNaN(w) && w > max) max = w;
    }
    if (max > 0) points.push({ date: entry.date, maxWeight: max });
  }
  return points.reverse(); // plus ancien → plus récent
};

export interface E1RMPoint {
  date: number;
  e1rm: number; // 1RM estimé (formule d'Epley), arrondi à 0.1 kg
}

/**
 * 1RM estimé (formule d'Epley : poids × (1 + reps/30)) pour un exercice,
 * jour par jour — on garde la meilleure estimation de la séance. Séries au
 * poids du corps ("PDC") ou non chiffrées ignorées (pas de poids numérique
 * = pas d'estimation fiable).
 *
 * C'est une ESTIMATION, pas une vraie mesure de force maximale — Epley
 * reste la formule la plus utilisée mais devient moins fiable au-delà
 * d'une dizaine de répétitions. À lire comme une tendance, pas un chiffre
 * exact.
 */
export const getExerciseE1RMHistory = (history: HistoryEntry[], exerciseId: string): E1RMPoint[] => {
  const points: E1RMPoint[] = [];
  for (const entry of history) {
    const sets = entry.exerciseProgress[exerciseId];
    if (!sets) continue;
    let best = 0;
    for (const s of sets) {
      if (!s.completed) continue;
      const w = parseFloat(s.weight);
      const r = parseInt(s.reps, 10);
      if (isNaN(w) || isNaN(r) || r <= 0) continue;
      const e1rm = w * (1 + r / 30);
      if (e1rm > best) best = e1rm;
    }
    if (best > 0) points.push({ date: entry.date, e1rm: Math.round(best * 10) / 10 });
  }
  return points.reverse(); // plus ancien → plus récent
};

/** Meilleur 1RM estimé jamais atteint sur un exercice (formule d'Epley). */
export const getMaxE1RMEver = (history: HistoryEntry[], exerciseId: string): number => {
  let max = 0;
  for (const entry of history) {
    const sets = entry.exerciseProgress[exerciseId];
    if (!sets) continue;
    for (const s of sets) {
      if (!s.completed) continue;
      const w = parseFloat(s.weight);
      const r = parseInt(s.reps, 10);
      if (isNaN(w) || isNaN(r) || r <= 0) continue;
      const e1rm = w * (1 + r / 30);
      if (e1rm > max) max = e1rm;
    }
  }
  return Math.round(max * 10) / 10;
};

// ─── Groupes musculaires pas travaillés récemment ───────────────────────────

// Table exerciceId → groupe musculaire (construite une fois depuis workouts.ts).
const EXERCISE_MUSCLE_GROUP: Record<string, string> = {};
for (const w of WORKOUTS) {
  for (const ex of w.exercises) EXERCISE_MUSCLE_GROUP[ex.id] = ex.muscleGroup;
}

// Liste ordonnée de tous les groupes musculaires distincts du programme.
export const ALL_MUSCLE_GROUPS: string[] = Array.from(new Set(WORKOUTS.flatMap((w) => w.exercises.map((e) => e.muscleGroup))));

export interface MuscleGroupStatus {
  group: string;
  daysSince: number | null; // null = jamais travaillé
}

/**
 * Pour chaque groupe musculaire du programme, calcule le nombre de jours
 * écoulés depuis la dernière séance où il a été travaillé (au moins une
 * série complétée). Se base sur l'historique réel, pas sur le cycle
 * théorique — reflète donc aussi les séances manquées.
 */
export const getMuscleGroupsStatus = (history: HistoryEntry[]): MuscleGroupStatus[] => {
  const now = Date.now();
  return ALL_MUSCLE_GROUPS.map((group) => {
    let lastDate: number | null = null;
    for (const entry of history) {
      const worked = Object.entries(entry.exerciseProgress).some(
        ([exId, sets]) => EXERCISE_MUSCLE_GROUP[exId] === group && sets.some((s) => s.completed)
      );
      if (worked) { lastDate = entry.date; break; } // history triée du + récent au + ancien
    }
    return {
      group,
      daysSince: lastDate === null ? null : Math.floor((now - lastDate) / 86400000),
    };
  });
};

// ─── Temps de récupération par muscle ────────────────────────────────────────

// Heures de récupération recommandées par groupe musculaire (source: image
// envoyée par Léo — "Temps de récupération par muscle"). Les groupes "jambes"
// du programme (quadriceps / ischios-fessiers / fessiers / mollets) partagent
// tous la valeur "Jambes" de l'image, qui ne les détaille pas séparément.
const RECOVERY_HOURS_BY_GROUP: Record<string, number> = {
  'PECS': 48,
  'DOS': 72,
  'QUADRICEPS': 72,
  'ISCHIOS & FESSIERS': 72,
  'FESSIERS': 72,
  'MOLLETS': 72,
  'ABDOS': 24,
  'ABDOS & LOMBAIRES': 24,
  'BICEPS': 24,
  'ÉPAULES': 48,
  'TRICEPS': 48,
  'AVANT-BRAS': 24,
};
const DEFAULT_RECOVERY_HOURS = 48;

export interface MuscleRecoveryStatus {
  group: string;
  recoveryHours: number; // temps de récup recommandé pour ce groupe
  hoursSince: number | null; // heures écoulées depuis la dernière fois travaillé (null = jamais)
  hoursRemaining: number; // 0 si récupéré ou jamais travaillé
  recovered: boolean; // true si jamais travaillé (rien à récupérer) ou délai écoulé
}

/**
 * Pour chaque groupe musculaire du programme, calcule où il en est dans son
 * cycle de récupération par rapport aux durées recommandées (RECOVERY_HOURS_BY_GROUP),
 * en se basant sur la dernière séance réelle où il a été travaillé.
 */
export const getMuscleRecoveryStatus = (history: HistoryEntry[]): MuscleRecoveryStatus[] => {
  const now = Date.now();
  return ALL_MUSCLE_GROUPS.map((group) => {
    let lastDate: number | null = null;
    for (const entry of history) {
      const worked = Object.entries(entry.exerciseProgress).some(
        ([exId, sets]) => EXERCISE_MUSCLE_GROUP[exId] === group && sets.some((s) => s.completed)
      );
      if (worked) { lastDate = entry.date; break; } // history triée du + récent au + ancien
    }
    const recoveryHours = RECOVERY_HOURS_BY_GROUP[group] ?? DEFAULT_RECOVERY_HOURS;
    if (lastDate === null) {
      return { group, recoveryHours, hoursSince: null, hoursRemaining: 0, recovered: true };
    }
    const hoursSince = (now - lastDate) / 3600000;
    const hoursRemaining = Math.max(0, Math.ceil(recoveryHours - hoursSince));
    return { group, recoveryHours, hoursSince, hoursRemaining, recovered: hoursRemaining === 0 };
  });
};

// ─── Récupération : régions du schéma corporel ───────────────────────────────
// Note: MUSCLE_GROUP_TO_REGIONS est défini plus bas (section "Schéma corps
// humain") — cette fonction est volontairement placée après pour pouvoir s'y
// référer sans dupliquer le mapping. Voir plus bas dans ce fichier.

export interface MuscleGroupVolume {
  group: string;
  tonnage: number; // kg (poids × reps cumulés)
  totalReps: number; // nombre de répétitions cumulées (séries chiffrées en reps)
}

/**
 * Tonnage ET nombre de reps total par groupe musculaire sur les `weeks`
 * dernières semaines (4 par défaut), pour voir en un coup d'œil quels
 * groupes sont les plus (ou les moins) travaillés récemment.
 *
 * Renvoie TOUJOURS tous les groupes du programme (voir ALL_MUSCLE_GROUPS),
 * même à 0 — un groupe pas travaillé dans la période doit rester visible
 * (ex: jambes si tu n'as pas fait de séance Legs récemment), pas disparaître
 * du graphique comme s'il n'existait pas.
 */
export const getMuscleGroupVolume = (history: HistoryEntry[], weeks = 4): MuscleGroupVolume[] => {
  const cutoff = Date.now() - weeks * WEEK_MS;
  const tonnageByGroup: Record<string, number> = {};
  const repsByGroup: Record<string, number> = {};
  for (const entry of history) {
    if (entry.date < cutoff) continue;
    for (const [exId, sets] of Object.entries(entry.exerciseProgress)) {
      const group = EXERCISE_MUSCLE_GROUP[exId];
      if (!group) continue;
      for (const s of sets) {
        if (!s.completed) continue;
        const w = parseFloat(s.weight);
        const r = parseInt(s.reps, 10);
        if (!isNaN(r)) {
          repsByGroup[group] = (repsByGroup[group] ?? 0) + r;
          if (!isNaN(w)) {
            tonnageByGroup[group] = (tonnageByGroup[group] ?? 0) + w * r;
          }
        }
      }
    }
  }
  return ALL_MUSCLE_GROUPS
    .map((group) => ({
      group,
      tonnage: Math.round(tonnageByGroup[group] ?? 0),
      totalReps: repsByGroup[group] ?? 0,
    }))
    .sort((a, b) => b.tonnage - a.tonnage);
};

// ─── Schéma corps humain (muscles sollicités) ───────────────────────────────

export type BodyRegionKey =
  | 'front-chest' | 'front-shoulder' | 'front-biceps' | 'front-forearm' | 'front-abs' | 'front-quad' | 'front-calf'
  | 'back-lats' | 'back-shoulder' | 'back-triceps' | 'back-forearm' | 'back-lowerback' | 'back-glute' | 'back-hamstring' | 'back-calf';

// Un groupe musculaire du programme peut allumer plusieurs zones du schéma
// (ex: ÉPAULES est visible de face ET de dos).
const MUSCLE_GROUP_TO_REGIONS: Record<string, BodyRegionKey[]> = {
  'DOS': ['back-lats'],
  'BICEPS': ['front-biceps'],
  'PECS': ['front-chest'],
  'ÉPAULES': ['front-shoulder', 'back-shoulder'],
  'TRICEPS': ['back-triceps'],
  'QUADRICEPS': ['front-quad'],
  'ISCHIOS & FESSIERS': ['back-hamstring', 'back-glute'],
  'MOLLETS': ['front-calf', 'back-calf'],
  'ABDOS & LOMBAIRES': ['front-abs', 'back-lowerback'],
  'AVANT-BRAS': ['front-forearm', 'back-forearm'],
  'FESSIERS': ['back-glute'],
  'ABDOS': ['front-abs'],
};

/**
 * Calcule, pour une séance donnée, l'intensité (0-1) de chaque zone du
 * schéma corporel — basée sur le nombre de séries par groupe musculaire,
 * normalisé par rapport au groupe le plus travaillé de la séance.
 */
export const getWorkoutBodyIntensity = (workout: WorkoutDay): Partial<Record<BodyRegionKey, number>> => {
  const setsByGroup: Record<string, number> = {};
  for (const ex of workout.exercises) {
    setsByGroup[ex.muscleGroup] = (setsByGroup[ex.muscleGroup] ?? 0) + ex.sets;
  }
  const maxSets = Math.max(1, ...Object.values(setsByGroup));
  const result: Partial<Record<BodyRegionKey, number>> = {};
  for (const [group, sets] of Object.entries(setsByGroup)) {
    const regions = MUSCLE_GROUP_TO_REGIONS[group] ?? [];
    const t = sets / maxSets;
    for (const r of regions) result[r] = Math.max(result[r] ?? 0, t);
  }
  return result;
};

/**
 * Même principe que getWorkoutBodyIntensity, mais basé sur l'historique réel
 * des `days` derniers jours plutôt que sur une séance planifiée — pour
 * l'écran "Corps" qui montre ce qui a vraiment été travaillé récemment.
 */
export const getBodyIntensityFromHistory = (history: HistoryEntry[], days = 9): Partial<Record<BodyRegionKey, number>> => {
  const cutoff = Date.now() - days * 86400000;
  const setsByGroup: Record<string, number> = {};
  for (const entry of history) {
    if (entry.date < cutoff) continue;
    for (const [exId, sets] of Object.entries(entry.exerciseProgress)) {
      const group = EXERCISE_MUSCLE_GROUP[exId];
      if (!group) continue;
      const completedCount = sets.filter((s) => s.completed).length;
      if (completedCount > 0) setsByGroup[group] = (setsByGroup[group] ?? 0) + completedCount;
    }
  }
  const maxSets = Math.max(1, ...Object.values(setsByGroup));
  const result: Partial<Record<BodyRegionKey, number>> = {};
  for (const [group, sets] of Object.entries(setsByGroup)) {
    const regions = MUSCLE_GROUP_TO_REGIONS[group] ?? [];
    const t = sets / maxSets;
    for (const r of regions) result[r] = Math.max(result[r] ?? 0, t);
  }
  return result;
};

export interface RegionRecoveryStatus {
  pct: number; // 0 = juste travaillé (pas récupéré), 1 = totalement récupéré
  recovered: boolean;
}

/**
 * Statut de récupération par région du schéma corporel — dérivé de
 * getMuscleRecoveryStatus (voir plus haut) via MUSCLE_GROUP_TO_REGIONS.
 * Utilisé pour colorer le schéma (rouge = en cours, vert = récupéré) dans
 * la section "Récupération" des Objectifs, et pour l'alerte au lancement
 * d'une séance (voir WorkoutIntroScreen).
 *
 * Si une région est couverte par plusieurs groupes musculaires (rare), on
 * garde le pire des deux (le pct le plus bas = le moins récupéré).
 */
export const getRecoveryRegionStatus = (history: HistoryEntry[]): Partial<Record<BodyRegionKey, RegionRecoveryStatus>> => {
  const statuses = getMuscleRecoveryStatus(history).filter((s) => s.hoursSince !== null);
  const result: Partial<Record<BodyRegionKey, RegionRecoveryStatus>> = {};
  for (const s of statuses) {
    const regions = MUSCLE_GROUP_TO_REGIONS[s.group] ?? [];
    const pct = Math.min(1, Math.max(0, 1 - s.hoursRemaining / s.recoveryHours));
    for (const r of regions) {
      const existing = result[r];
      if (!existing || pct < existing.pct) result[r] = { pct, recovered: pct >= 1 };
    }
  }
  return result;
};
