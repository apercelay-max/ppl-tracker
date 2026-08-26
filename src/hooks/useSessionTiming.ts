import { useState, useEffect } from 'react';
import { WorkoutDay, WorkoutSession } from '../data/types';

// Mêmes constantes que utils/workoutGenerator.ts (estimation "≈ X min" des
// séances) : le temps de travail réel par série n'est pas mesurable à
// l'avance, 45 s est le forfait déjà utilisé ailleurs dans l'appli, donc on
// le réutilise pour rester cohérent avec les durées affichées ailleurs.
const SECONDS_PER_SET = 45;
const WARMUP_SECONDS = 6 * 60;

export interface SessionTiming {
  /** > 0 = en retard, < 0 = en avance, en secondes. */
  deltaSeconds: number;
  remainingSeconds: number;
  estimatedFinishTimestamp: number;
  /** Reste-t-il un exercice non essentiel pas encore entamé à couper ? */
  hasDroppableExercises: boolean;
}

/**
 * Estime, à partir du plan (séries × (45 s + repos)) et de la progression
 * réelle, le temps qu'il reste et si la séance est en avance ou en retard
 * sur son propre planning. C'est une estimation — les tri-sets/supersets
 * sont comptés comme des exercices normaux (comme le fait déjà
 * workoutGenerator.ts pour le "≈ X min" affiché avant de démarrer).
 */
export const useSessionTiming = (
  workout: WorkoutDay,
  session: WorkoutSession,
  customRestSeconds: Record<string, number>,
): SessionTiming => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  let plannedUpToNowSeconds = WARMUP_SECONDS;
  let totalPlannedSeconds = WARMUP_SECONDS;
  let hasDroppableExercises = false;

  for (const ex of workout.exercises) {
    const entries = session.exerciseProgress[ex.id] ?? [];
    const totalSets = Math.max(ex.sets, entries.length);
    const doneCount = entries.filter((e) => e.completed).length;
    const perSetSeconds = SECONDS_PER_SET + (customRestSeconds[ex.id] ?? ex.restSeconds);
    plannedUpToNowSeconds += doneCount * perSetSeconds;
    totalPlannedSeconds += totalSets * perSetSeconds;
    if (ex.essential !== true && doneCount === 0) hasDroppableExercises = true;
  }

  const elapsedSeconds = (now - session.startTime) / 1000;
  const remainingSeconds = Math.max(0, totalPlannedSeconds - plannedUpToNowSeconds);

  return {
    deltaSeconds: elapsedSeconds - plannedUpToNowSeconds,
    remainingSeconds,
    estimatedFinishTimestamp: now + remainingSeconds * 1000,
    hasDroppableExercises,
  };
};
