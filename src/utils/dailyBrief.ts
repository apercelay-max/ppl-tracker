// ─── Résumé du jour (préparé en arrière-plan) ──────────────────────────────
//
// Même répartition des rôles que le bilan du Coach : l'appli calcule (séance
// conseillée, charges, stats de la semaine), Gemini rédige. Le résumé est
// préparé au démarrage et gardé pour la journée, pour qu'un tap sur le
// prénom l'ouvre instantanément.

import type { HistoryEntry } from '../data/types';
import type { Program } from '../data/programs';
import type { CoachAiDaily, DailyContext } from './coachDigest';
import { bucketByWeek, getLastExerciseSets, suggestNextLoad } from './training';

const DAILY_STORAGE = 'ppl-daily-brief';

/** Incrément de charge par défaut quand on ne connaît pas le matériel. */
const DEFAULT_INCREMENT_KG = 2.5;

export interface CachedDaily {
  daily: CoachAiDaily;
  /** Jour calendaire de génération (AAAA-MM-JJ). */
  day: string;
  /** Séances de l'historique à la génération : une nouvelle séance périme le résumé. */
  sessions: number;
  /** Séance conseillée au moment de la génération. */
  workoutId?: string;
  model: string;
}

export interface DailyPlanExercise {
  name: string;
  sets: number;
  reps: string;
  suggestedKg?: number;
  advice?: string;
}

export const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const readCachedDaily = (): CachedDaily | null => {
  try {
    const raw = localStorage.getItem(DAILY_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedDaily;
    return parsed?.daily?.resume ? parsed : null;
  } catch {
    return null;
  }
};

export const writeCachedDaily = (cached: CachedDaily | null): void => {
  try {
    if (cached) localStorage.setItem(DAILY_STORAGE, JSON.stringify(cached));
    else localStorage.removeItem(DAILY_STORAGE);
  } catch {
    // Pas de cache : un appel de plus, sans conséquence.
  }
};

export interface DailyPlan {
  context: DailyContext;
  workoutId?: string;
  exercises: DailyPlanExercise[];
}

/** Construit tout ce que l'appli sait calculer seule pour aujourd'hui. */
export const buildDailyPlan = (input: {
  history: HistoryEntry[];
  program: Program;
  cycleDoneIds: string[];
  weeklySessionGoal?: number;
  firstName?: string;
}): DailyPlan => {
  const { history, program, cycleDoneIds, weeklySessionGoal, firstName } = input;
  const buckets = bucketByWeek(history, 2); // plus ancien → plus récent
  const current = buckets[1];
  const previous = buckets[0];
  // `sessions` doit compter la semaine calendaire (lundi → aujourd'hui), pas
  // la fenêtre glissante de `bucketByWeek` (7×24h depuis l'instant présent) :
  // c'est ce même calcul calendaire que components/DailySummarySheet.tsx
  // utilise pour ses pastilles jour par jour, et les deux doivent concorder
  // (voir PR « weekly-goal-count-window-mismatch » pour le même bug ailleurs).
  const now = new Date();
  const mondayThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)).getTime();
  const sessionsThisWeek = history.filter((e) => e.date >= mondayThisWeek).length;

  const next = program.workouts.find((w) => !cycleDoneIds.includes(w.id)) ?? program.workouts[0];
  const exercises: DailyPlanExercise[] = (next?.exercises ?? []).map((ex) => {
    const last = getLastExerciseSets(history, ex.id);
    const suggestion = last ? suggestNextLoad(last, ex.targetReps, ex.sets, DEFAULT_INCREMENT_KG) : null;
    return {
      name: ex.name,
      sets: ex.sets,
      reps: ex.targetReps,
      suggestedKg: suggestion ? Math.round(suggestion.weight * 100) / 100 : undefined,
      advice: suggestion?.reason,
    };
  });

  const lastSession = history[0];
  const context: DailyContext = {
    firstName: firstName?.trim() || undefined,
    weekday: new Date().toLocaleDateString('fr-FR', { weekday: 'long' }),
    week: {
      sessions: sessionsThisWeek,
      goal: weeklySessionGoal,
      tonnageKg: Math.round(current?.tonnage ?? 0),
      previousTonnageKg: Math.round(previous?.tonnage ?? 0),
    },
    session: next
      ? {
          name: next.name,
          focus: next.focus,
          // Les `advice` restent côté appli : le modèle n'a besoin que des charges.
          exercises: exercises.slice(0, 8).map(({ advice: _a, ...rest }) => rest),
        }
      : undefined,
    hoursSinceLastSession: lastSession
      ? Math.round((Date.now() - lastSession.date - lastSession.durationMs) / 3_600_000)
      : undefined,
  };

  return { context, workoutId: next?.id, exercises };
};
