import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { getProgram } from '../data/programs';
import { getWorkout } from '../data/workouts';
import { buildCoachDigest } from '../utils/coachDigest';
import { readStoredApiKey, requestCoachAi } from '../utils/coachAi';
import {
  buildDailyPlan, readCachedDaily, todayKey, writeCachedDaily,
  type CachedDaily, type DailyPlan,
} from '../utils/dailyBrief';

export interface DailyBriefState {
  cached: CachedDaily | null;
  plan: DailyPlan;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Prépare le résumé du jour en arrière-plan : au démarrage (quand `enabled`),
 * puis dès qu'une séance est enregistrée. Un résumé déjà généré aujourd'hui,
 * avec le même nombre de séances, est réutilisé tel quel — zéro appel réseau.
 */
export const useDailyBrief = (enabled: boolean): DailyBriefState => {
  const history = useWorkoutStore((s) => s.history);
  const trainingProfile = useWorkoutStore((s) => s.trainingProfile);
  const bodyWeightHistory = useWorkoutStore((s) => s.bodyWeightHistory);
  const activeProgramId = useWorkoutStore((s) => s.activeProgramId);
  const customPrograms = useWorkoutStore((s) => s.customPrograms);
  const cycleDoneIds = useWorkoutStore((s) => s.cycleDoneIds);
  const weeklySessionGoal = useWorkoutStore((s) => s.weeklySessionGoal);

  const [cached, setCached] = useState<CachedDaily | null>(readCachedDaily);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const program = getProgram(activeProgramId, customPrograms);
  const plan = buildDailyPlan({
    history, program, cycleDoneIds, weeklySessionGoal, firstName: trainingProfile?.firstName,
  });

  const generate = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    const digest = buildCoachDigest({
      history, resolveWorkout: getWorkout, profile: trainingProfile, bodyWeightHistory,
      programName: program.name, weeklySessionGoal,
    });
    const response = await requestCoachAi({
      mode: 'daily', digest, daily: plan.context, apiKey: readStoredApiKey() || undefined,
    });
    if (response.ok && response.mode === 'daily') {
      const fresh: CachedDaily = {
        daily: response.daily, day: todayKey(), sessions: history.length,
        workoutId: plan.workoutId, model: response.model,
      };
      setCached(fresh);
      writeCachedDaily(fresh);
    } else if (!response.ok) {
      setError(response.message);
    }
    setLoading(false);
    inFlight.current = false;
    // `plan` est recalculé à chaque rendu ; les entrées qui comptent sont listées ci-dessous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, trainingProfile, bodyWeightHistory, program.name, weeklySessionGoal, plan.workoutId]);

  const upToDate = cached !== null && cached.day === todayKey()
    && cached.sessions === history.length && cached.workoutId === plan.workoutId;

  useEffect(() => {
    if (!enabled || upToDate || history.length === 0) return;
    void generate();
    // Une seule tentative automatique par changement de séance : pas de boucle si l'appel échoue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, history.length, plan.workoutId]);

  return { cached: cached?.day === todayKey() ? cached : null, plan, loading, error, refresh: () => { void generate(); } };
};
