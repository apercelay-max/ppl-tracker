import { ExerciseProgress, HistoryEntry, SetEntry, WorkoutDay } from '../data/types';
import { WORKOUTS } from '../data/workouts';
import { primaryGroupOf, resolveExerciseMuscles, volumeGroupOf } from './muscleMap';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Tonnage = somme (poids × reps) sur toutes les séries complétées où le
 * poids et les reps sont numériques. Les séries au poids du corps ("PDC")
 * ou sautées ne comptent pas dans le tonnage (convention classique).
 */
/**
 * Vrai si, ce jour-là, l'exercice avait été REMPLACÉ par un autre mouvement.
 * Les séries sont enregistrées sous l'id de l'exercice prévu au programme :
 * sans ce filtre, une perf faite sur un autre mouvement viendrait gonfler la
 * courbe, le record et le 1RM estimé de l'exercice qu'on n'a pas fait.
 */
export const wasSubstituted = (entry: HistoryEntry, exerciseId: string): boolean =>
  !!entry.exerciseNameOverrides?.[exerciseId];

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
    if (wasSubstituted(entry, exerciseId)) continue;
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
    if (wasSubstituted(entry, exerciseId)) continue;
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
    if (wasSubstituted(entry, exerciseId)) continue;
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
    if (wasSubstituted(entry, exerciseId)) continue;
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
    if (wasSubstituted(entry, exerciseId)) continue;
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

export interface PersonalRecordEvent {
  exerciseId: string;
  exerciseName: string;
  weight: number;       // nouveau poids max (numérique) atteint
  previousMax: number;  // poids max d'avant ce record
  date: number;
}

/**
 * Retrouve le dernier record personnel (PR) chiffré battu, tous exercices
 * confondus — même définition que la détection en direct pendant une
 * séance (voir handleSetComplete dans SessionScreen.tsx) : un nouveau poids
 * qui dépasse le max précédent, à condition qu'il y ait bien un max
 * précédent à battre (sinon la toute première fois qu'un exercice est fait
 * compterait à tort comme un "record"). Parcourt l'historique du plus
 * ancien au plus récent en gardant le max courant par exercice, et retient
 * le dernier dépassement rencontré. Renvoie null si aucun record trouvé.
 */
export const getMostRecentPersonalRecord = (history: HistoryEntry[]): PersonalRecordEvent | null => {
  const chronological = [...history].reverse(); // plus ancien → plus récent
  const runningMax: Record<string, number> = {};
  let lastPR: PersonalRecordEvent | null = null;

  for (const entry of chronological) {
    for (const [exerciseId, sets] of Object.entries(entry.exerciseProgress)) {
      if (wasSubstituted(entry, exerciseId)) continue;
      let entryMax = 0;
      for (const s of sets) {
        if (!s.completed) continue;
        const w = parseFloat(s.weight);
        if (!isNaN(w) && w > entryMax) entryMax = w;
      }
      if (entryMax <= 0) continue;

      const previousMax = runningMax[exerciseId] ?? 0;
      if (previousMax > 0 && entryMax > previousMax) {
        const exerciseName = ALL_EXERCISES.find((e) => e.id === exerciseId)?.name ?? exerciseId;
        lastPR = { exerciseId, exerciseName, weight: entryMax, previousMax, date: entry.date };
      }
      if (entryMax > previousMax) runningMax[exerciseId] = entryMax;
    }
  }

  return lastPR;
};

export interface FeaturedExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  e1rmHistory: E1RMPoint[]; // fenêtre des `weeks` dernières semaines uniquement
  currentE1RM: number;
  deltaKg: number; // progression sur la fenêtre (toujours > 0)
  weeksSpan: number;
}

/**
 * Choisit automatiquement l'exercice à mettre en avant dans le widget
 * "Progression sur un exercice" de l'accueil : celui dont le 1RM estimé a
 * le plus progressé sur les `weeks` dernières semaines, parmi les
 * exercices encore pratiqués récemment (dernier passage dans les
 * `recentDays` derniers jours) — pour ne pas mettre en avant un exercice
 * abandonné qui progressait il y a longtemps. Renvoie null si aucun
 * exercice n'a une vraie progression récente à montrer, plutôt que
 * d'inventer un exercice au hasard.
 */
export const getFeaturedExerciseProgress = (
  history: HistoryEntry[],
  weeks = 8,
  recentDays = 21
): FeaturedExerciseProgress | null => {
  const cutoff = Date.now() - weeks * WEEK_MS;
  const recentCutoff = Date.now() - recentDays * 86400000;
  let best: FeaturedExerciseProgress | null = null;

  for (const ex of ALL_EXERCISES) {
    const windowed = getExerciseE1RMHistory(history, ex.id).filter((p) => p.date >= cutoff);
    if (windowed.length < 2) continue;
    const last = windowed[windowed.length - 1];
    if (last.date < recentCutoff) continue; // pas fait récemment, on ne le met pas en avant

    const first = windowed[0];
    const deltaKg = Math.round((last.e1rm - first.e1rm) * 10) / 10;
    if (deltaKg <= 0) continue; // on ne met en avant qu'une vraie progression

    if (!best || deltaKg > best.deltaKg) {
      best = { exerciseId: ex.id, exerciseName: ex.name, e1rmHistory: windowed, currentE1RM: last.e1rm, deltaKg, weeksSpan: weeks };
    }
  }

  return best;
};

// ─── Plateaux ───────────────────────────────────────────────────────────────

export interface PlateauExercise {
  exerciseId: string;
  exerciseName: string;
  /** Meilleur 1RM estimé sur la fenêtre observée. */
  bestE1RM: number;
  /** Depuis combien de semaines ce meilleur n'a pas été battu. */
  weeksStuck: number;
  /** Nombre de séances faites sur cet exercice pendant la fenêtre. */
  sessions: number;
}

/**
 * Exercices qui stagnent : le 1RM estimé n'a pas progressé de plus de
 * `toleranceKg` depuis au moins `minWeeks` semaines, alors que l'exercice est
 * toujours travaillé.
 *
 * Trois garde-fous, parce qu'un « plateau » annoncé à tort est pire que pas
 * d'alerte du tout :
 *  - il faut au moins `minSessions` séances sur la fenêtre — deux points ne
 *    font pas une stagnation, juste deux points ;
 *  - l'exercice doit avoir été fait récemment, sinon ce n'est pas un plateau
 *    mais un exercice abandonné ;
 *  - les séances où l'exercice a été remplacé sont déjà exclues en amont, par
 *    getExerciseE1RMHistory.
 *
 * Le 1RM estimé est une ESTIMATION (formule d'Epley) : à lire comme une
 * tendance, pas comme une mesure de force.
 */
export const detectPlateaus = (
  history: HistoryEntry[],
  { minWeeks = 4, toleranceKg = 1, minSessions = 4, recentDays = 21 } = {}
): PlateauExercise[] => {
  const now = Date.now();
  const recentCutoff = now - recentDays * 86400000;
  const out: PlateauExercise[] = [];

  for (const ex of ALL_EXERCISES) {
    const points = getExerciseE1RMHistory(history, ex.id);
    if (points.length < minSessions) continue;

    const last = points[points.length - 1];
    if (last.date < recentCutoff) continue; // abandonné, pas en plateau

    // Meilleur de tous les temps sur cet exercice, et depuis quand il tient.
    let bestE1RM = 0;
    let bestDate = 0;
    for (const p of points) {
      if (p.e1rm > bestE1RM) { bestE1RM = p.e1rm; bestDate = p.date; }
    }
    if (bestE1RM <= 0) continue;

    const weeksStuck = Math.floor((now - bestDate) / WEEK_MS);
    if (weeksStuck < minWeeks) continue;

    // Il faut aussi que rien n'ait approché ce record depuis : si la dernière
    // séance est à 1 kg près du meilleur, c'est de la stagnation ; si elle est
    // très en dessous, c'est une décharge ou une mauvaise passe, pas un plateau.
    if (bestE1RM - last.e1rm > toleranceKg * 4) continue;

    const sessions = points.filter((p) => p.date >= bestDate).length;
    if (sessions < 2) continue; // le record est la dernière séance : rien à dire

    out.push({ exerciseId: ex.id, exerciseName: ex.name, bestE1RM, weeksStuck, sessions });
  }

  // Le plus long plateau d'abord : c'est celui sur lequel agir en priorité.
  return out.sort((a, b) => b.weeksStuck - a.weeksStuck);
};

// ─── Groupes musculaires pas travaillés récemment ───────────────────────────

// Liste ordonnée des groupes musculaires du programme Strict — c'est l'ordre
// d'affichage historique, on ne le change pas.
export const ALL_MUSCLE_GROUPS: string[] = Array.from(new Set(WORKOUTS.flatMap((w) => w.exercises.map((e) => e.muscleGroup))));

/**
 * Groupes à afficher pour un historique donné : ceux du programme Strict
 * (toujours, même à zéro), plus ceux réellement rencontrés dans l'historique.
 *
 * Sans ça, s'entraîner sur un autre programme faisait disparaître le travail
 * des groupes que Strict ne nomme pas (ÉPAULES, ISCHIO-JAMBIERS, LOMBAIRES,
 * TRAPÈZES…) : les séries étaient enregistrées mais n'apparaissaient nulle
 * part. Les nouveaux groupes n'apparaissent qu'une fois vraiment travaillés,
 * donc l'affichage ne bouge pas tant qu'on reste sur Strict.
 */
export const groupsForHistory = (history: HistoryEntry[]): string[] => {
  const extra: string[] = [];
  for (const entry of history) {
    for (const [exId, sets] of Object.entries(entry.exerciseProgress)) {
      if (!sets.some((s) => s.completed)) continue;
      const group = primaryGroupOf(exId);
      if (group && !ALL_MUSCLE_GROUPS.includes(group) && !extra.includes(group)) {
        extra.push(group);
      }
    }
  }
  return [...ALL_MUSCLE_GROUPS, ...extra];
};

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
  return groupsForHistory(history).map((group) => {
    let lastDate: number | null = null;
    for (const entry of history) {
      const worked = Object.entries(entry.exerciseProgress).some(
        ([exId, sets]) => primaryGroupOf(exId) === group && sets.some((s) => s.completed)
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
  'ISCHIO-JAMBIERS': 72, // nom utilisé depuis Strict V11 (ex "ISCHIOS & FESSIERS")
  'FESSIERS': 72,
  'MOLLETS': 72,
  'ABDOS': 24,
  'ABDOS & LOMBAIRES': 24,
  'BICEPS': 24,
  'ÉPAULES': 48,
  'DELTOÏDE POSTÉRIEUR': 48, // nom utilisé depuis Strict V11, même délai que ÉPAULES
  'TRICEPS': 48,
  'AVANT-BRAS': 24,
  // Noms utilisés par le programme Strict et par les programmes bâtis sur le
  // catalogue, qui n'avaient aucune entrée ici et retombaient donc en silence
  // sur les 48 h par défaut.
  'DELTOÏDE ANTÉRIEUR': 48,
  'DELTOÏDE LATÉRAL': 48,
  'AVANT-BRAS / BRACHIAL': 24,
  'ISCHIOS': 72,
  'LOMBAIRES': 72,
  'TRAPÈZES': 48,
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
  return groupsForHistory(history).map((group) => {
    let lastDate: number | null = null;
    for (const entry of history) {
      const worked = Object.entries(entry.exerciseProgress).some(
        ([exId, sets]) => primaryGroupOf(exId) === group && sets.some((s) => s.completed)
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

/** Pourcentage de récupération (0 = vient d'être travaillé, 1 = totalement récupéré). */
export const getRecoveryPct = (s: Pick<MuscleRecoveryStatus, 'hoursRemaining' | 'recoveryHours'>): number =>
  Math.min(1, Math.max(0, 1 - s.hoursRemaining / s.recoveryHours));

export interface MuscleRecoverySummary {
  /** Groupe musculaire le moins récupéré parmi ceux déjà travaillés au moins une fois (null si aucun historique). */
  leastRecovered: (MuscleRecoveryStatus & { pct: number }) | null;
  /** Moyenne de récupération (0-1) sur tous les groupes musculaires du programme, jamais travaillés compris (comptés à 100 %). */
  averagePct: number;
}

/**
 * Résumé de récupération musculaire pour le widget d'accueil : quel groupe
 * a le plus besoin de récupérer, et la moyenne de récupération tous
 * groupes confondus. Basé sur getMuscleRecoveryStatus ci-dessus.
 */
export const getMuscleRecoverySummary = (history: HistoryEntry[]): MuscleRecoverySummary => {
  const statuses = getMuscleRecoveryStatus(history);
  const withPct = statuses.map((s) => ({ ...s, pct: getRecoveryPct(s) }));
  const trained = withPct.filter((s) => s.hoursSince !== null);
  const leastRecovered = trained.length
    ? trained.reduce((worst, s) => (s.pct < worst.pct ? s : worst))
    : null;
  const averagePct = withPct.length
    ? withPct.reduce((sum, s) => sum + s.pct, 0) / withPct.length
    : 1;
  return { leastRecovered, averagePct };
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
      const group = primaryGroupOf(exId);
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
  return groupsForHistory(history)
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
  'DELTOÏDE POSTÉRIEUR': ['back-shoulder'], // nom utilisé depuis Strict V11
  'TRICEPS': ['back-triceps'],
  'QUADRICEPS': ['front-quad'],
  'ISCHIOS & FESSIERS': ['back-hamstring', 'back-glute'],
  'ISCHIO-JAMBIERS': ['back-hamstring'], // nom utilisé depuis Strict V11 (fessiers déjà séparés ci-dessous)
  'MOLLETS': ['front-calf', 'back-calf'],
  'ABDOS & LOMBAIRES': ['front-abs', 'back-lowerback'],
  'AVANT-BRAS': ['front-forearm', 'back-forearm'],
  'FESSIERS': ['back-glute'],
  'ABDOS': ['front-abs'],
  // Ces groupes-là étaient absents de la table : le travail des deltoïdes,
  // des avant-bras et des ischios du programme Strict n'allumait donc
  // strictement rien sur le schéma. LOMBAIRES et TRAPÈZES viennent des
  // programmes bâtis sur le catalogue.
  'DELTOÏDE ANTÉRIEUR': ['front-shoulder'],
  'DELTOÏDE LATÉRAL': ['front-shoulder', 'back-shoulder'],
  'AVANT-BRAS / BRACHIAL': ['front-forearm', 'back-forearm'],
  'ISCHIOS': ['back-hamstring'],
  'LOMBAIRES': ['back-lowerback'],
  // Pas de zone dédiée aux trapèzes sur le schéma : le haut du dos est la
  // zone visible la plus proche.
  'TRAPÈZES': ['back-shoulder'],
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
 * Même principe que getWorkoutBodyIntensity, mais agrégé sur TOUTES les
 * séances d'un programme (plutôt qu'une seule) — utilisé par le catalogue de
 * programmes pour montrer d'un coup d'œil quels muscles un programme entier
 * fait travailler sur une rotation complète.
 */
export const getProgramBodyIntensity = (workouts: WorkoutDay[]): Partial<Record<BodyRegionKey, number>> => {
  const setsByGroup: Record<string, number> = {};
  for (const w of workouts) {
    for (const ex of w.exercises) {
      setsByGroup[ex.muscleGroup] = (setsByGroup[ex.muscleGroup] ?? 0) + ex.sets;
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
      const group = primaryGroupOf(exId);
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

// ─── Volume effectif par muscle (séries effectives) ─────────────────────────
//
// Le tonnage (kg × reps) dit combien tu as déplacé, pas si un muscle reçoit
// assez de travail : 4 séries de mollets pèsent plus lourd que 4 séries
// d'élévations latérales sans qu'aucune épaule n'ait été mieux servie. La
// mesure utilisée dans la littérature — et par Liftosaur, cf. l'analyse
// comparative des apps — c'est le nombre de SÉRIES EFFECTIVES par muscle et
// par semaine, avec les synergistes comptés pour une demi-série.
//
// Repère courant : 10 à 20 séries effectives par semaine et par muscle. En
// dessous de 10 on entretient plus qu'on ne développe, au-dessus de 20 la
// récupération devient le facteur limitant. Ce sont des repères, pas des
// règles : un débutant progresse très bien plus bas.

export const EFFECTIVE_SETS_MIN = 10;
export const EFFECTIVE_SETS_MAX = 20;

export interface EffectiveVolume {
  group: string;
  /** Séries effectives par semaine (principal ×1 + synergiste ×0,5). */
  perWeek: number;
  /** Séries où ce muscle est le muscle principal, par semaine. */
  directPerWeek: number;
  /** Total de séries effectives sur toute la fenêtre observée. */
  total: number;
}

/**
 * Séries effectives par muscle et par semaine sur les `weeks` dernières
 * semaines. Compte toutes les séries validées, quel que soit le programme
 * qui les a produites (voir muscleMap).
 *
 * Une série non chiffrée (poids du corps, gainage au temps) compte comme
 * n'importe quelle autre : ici on compte des séries, pas des kilos.
 */
export const getEffectiveWeeklySets = (history: HistoryEntry[], weeks = 1): EffectiveVolume[] => {
  const cutoff = Date.now() - weeks * WEEK_MS;
  const effective: Record<string, number> = {};
  const direct: Record<string, number> = {};

  for (const entry of history) {
    if (entry.date < cutoff) continue;
    for (const [exId, sets] of Object.entries(entry.exerciseProgress)) {
      const done = sets.filter((s) => s.completed).length;
      if (done === 0) continue;
      const overrideName = entry.exerciseNameOverrides?.[exId];
      // Un exercice peut créditer deux fois le même groupe une fois les alias
      // appliqués (ex. DELTOÏDE LATÉRAL en principal et « Épaules » en
      // synergiste, tous deux ramenés à ÉPAULES) : on garde alors le poids le
      // plus fort, sans additionner les deux.
      const perGroup = new Map<string, number>();
      for (const { group, weight } of resolveExerciseMuscles(exId, overrideName)) {
        const canonical = volumeGroupOf(group);
        perGroup.set(canonical, Math.max(perGroup.get(canonical) ?? 0, weight));
      }
      for (const [group, weight] of perGroup) {
        effective[group] = (effective[group] ?? 0) + done * weight;
        if (weight === 1) direct[group] = (direct[group] ?? 0) + done;
      }
    }
  }

  const round = (n: number) => Math.round(n * 10) / 10;
  return Object.keys(effective)
    .map((group) => ({
      group,
      perWeek: round(effective[group] / weeks),
      directPerWeek: round((direct[group] ?? 0) / weeks),
      total: round(effective[group]),
    }))
    .sort((a, b) => b.perWeek - a.perWeek);
};

// ─── Échelle RPE / RIR ↔ charge ─────────────────────────────────────────────
//
// Un RPE (effort perçu sur 10) ou un RIR (répétitions gardées en réserve) ne
// devient utile que si on sait quelle charge mettre sur la barre. La table
// classique donne, pour un nombre de répétitions MENÉES JUSQU'À L'ÉCHEC, le
// pourcentage du maximum que ça représente.
//
// Le reste s'en déduit : à RPE 8, il te reste 2 répétitions en réserve, donc
// 5 répétitions à RPE 8 sollicitent le même pourcentage que 7 répétitions à
// l'échec. Pas besoin d'une table à deux entrées : une seule ligne suffit.

/** % du 1RM tenable pour N répétitions menées à l'échec (index = N). */
const PCT_AT_FAILURE: number[] = [
  0,
  1.000, 0.955, 0.922, 0.892, 0.863, 0.837, 0.811, 0.786,
  0.762, 0.739, 0.707, 0.680, 0.653, 0.626, 0.599,
];

/**
 * Part du 1RM correspondant à `reps` répétitions à l'effort `rpe` (6 à 10,
 * demi-points acceptés). Renvoie null hors de la plage couverte par la table
 * — au-delà d'une quinzaine de répétitions à l'échec, l'estimation ne vaut
 * plus rien et il vaut mieux ne rien afficher qu'un chiffre inventé.
 */
export const percentOf1RM = (reps: number, rpe: number): number | null => {
  if (!isFinite(reps) || !isFinite(rpe) || reps < 1 || rpe < 6 || rpe > 10) return null;
  const equivalent = reps + (10 - rpe); // reps + répétitions gardées en réserve
  const low = Math.floor(equivalent);
  const high = Math.ceil(equivalent);
  if (low < 1 || high >= PCT_AT_FAILURE.length) return null;
  if (low === high) return PCT_AT_FAILURE[low];
  const t = equivalent - low;
  return PCT_AT_FAILURE[low] + (PCT_AT_FAILURE[high] - PCT_AT_FAILURE[low]) * t;
};

/** RIR (répétitions en réserve) ↔ RPE : RPE 8 = 2 en réserve. */
export const rirToRpe = (rir: number): number => 10 - rir;
export const rpeToRir = (rpe: number): number => 10 - rpe;

/**
 * Charge à mettre sur la barre pour faire `reps` répétitions à l'effort
 * `rpe`, à partir d'un 1RM estimé. Renvoie null si l'estimation sort de la
 * table.
 */
export const loadForRpe = (e1rm: number, reps: number, rpe: number): number | null => {
  const pct = percentOf1RM(reps, rpe);
  if (pct === null || !isFinite(e1rm) || e1rm <= 0) return null;
  return e1rm * pct;
};

/**
 * L'inverse : quel effort représente une série déjà faite, compte tenu du
 * 1RM estimé. Sert à relire une séance (« tes 5×80 étaient à RPE 8,5 »).
 */
export const rpeOfSet = (weight: number, reps: number, e1rm: number): number | null => {
  if (!isFinite(weight) || !isFinite(reps) || weight <= 0 || reps < 1 || e1rm <= 0) return null;
  const pct = weight / e1rm;
  // Tolérance : 81,1 / 100 vaut 0,8109999999999999 en virgule flottante, donc
  // une comparaison stricte renvoyait RPE 7,5 là où la table dit exactement 8.
  const EPSILON = 1e-6;
  for (let rpe = 10; rpe >= 6; rpe -= 0.5) {
    const p = percentOf1RM(reps, rpe);
    if (p !== null && p <= pct + EPSILON) return rpe;
  }
  return null;
};

// ─── Suggestion de charge (double progression) ──────────────────────────────
//
// La règle appliquée par la plupart des programmes de l'appli, et celle que
// les apps concurrentes automatisent : tant que tu n'atteins pas le haut de
// la fourchette de répétitions sur TOUTES tes séries, tu gardes la charge ;
// quand tu y arrives, tu montes d'un cran et tu repars du bas.
//
// Volontairement conservateur : on ne propose de monter que si toutes les
// séries prévues ont été faites, et on ne propose jamais de baisser sur une
// seule mauvaise série (un mauvais jour n'est pas une régression).

export interface LoadSuggestion {
  weight: number;
  kind: 'up' | 'hold' | 'down';
  reason: string;
}

/** « 6-10 » → { min: 6, max: 10 }. « 5 » → { min: 5, max: 5 }. */
export const parseRepRange = (targetReps: string): { min: number; max: number } | null => {
  const match = targetReps.match(/(\d+)\s*(?:[-–à]\s*(\d+))?/);
  if (!match) return null;
  const min = parseInt(match[1], 10);
  const max = match[2] ? parseInt(match[2], 10) : min;
  if (!isFinite(min) || !isFinite(max) || min <= 0) return null;
  return { min, max: Math.max(min, max) };
};

export const suggestNextLoad = (
  lastSets: SetEntry[],
  targetReps: string,
  plannedSets: number,
  incrementKg: number
): LoadSuggestion | null => {
  const range = parseRepRange(targetReps);
  if (!range) return null;

  const done = lastSets.filter((s) => s.completed);
  if (done.length === 0) return null;

  const weights = done.map((s) => parseFloat(s.weight)).filter((w) => isFinite(w) && w > 0);
  const reps = done.map((s) => parseInt(s.reps, 10)).filter((r) => isFinite(r) && r > 0);
  if (weights.length === 0 || reps.length !== done.length) return null;

  const weight = Math.max(...weights);
  const allSetsDone = done.length >= plannedSets;
  const everySetAtTop = reps.every((r) => r >= range.max);
  const worstSet = Math.min(...reps);

  if (allSetsDone && everySetAtTop) {
    // Sur une cible à répétitions fixes (5×5), il n'y a pas de « repars en bas
    // de fourchette » : la consigne s'arrête à la montée de charge.
    const cible = range.min === range.max
      ? `Toutes tes séries à la cible de ${range.max} reps la dernière fois`
      : `Toutes tes séries en haut de la fourchette (${range.max}) la dernière fois`;
    const suite = range.min === range.max ? '' : ` et repars à ${range.min}`;
    return {
      weight: weight + incrementKg,
      kind: 'up',
      reason: `${cible} : monte de ${formatIncrement(incrementKg)} kg${suite}.`,
    };
  }
  if (worstSet < range.min) {
    return {
      weight,
      kind: 'down',
      reason: `Une série était descendue à ${worstSet} reps, sous la cible de ${range.min} : garde la même charge et vise d'abord ${range.min} partout.`,
    };
  }
  return {
    weight,
    kind: 'hold',
    reason: `Tu es dans la fourchette sans être en haut : même charge, cherche ${range.max} reps sur toutes les séries.`,
  };
};

const formatIncrement = (n: number): string =>
  (Math.round(n * 100) / 100).toString().replace('.', ',');
