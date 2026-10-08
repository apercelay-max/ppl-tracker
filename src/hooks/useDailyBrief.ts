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
  const retried = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rerunAfter = useRef(false);
  const inFlightKey = useRef('');
  // Dernière version de `generate` : la nouvelle tentative différée doit
  // utiliser l'historique du moment, pas celui du rendu qui l'a programmée.
  const generateRef = useRef<(auto?: boolean) => Promise<void>>(async () => {});

  const program = getProgram(activeProgramId, customPrograms);
  const plan = buildDailyPlan({
    history, program, cycleDoneIds, weeklySessionGoal, firstName: trainingProfile?.firstName,
  });

  const clearRetry = () => {
    if (retryTimer.current !== null) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  };

  const generate: (auto?: boolean) => Promise<void> = useCallback(async (auto = false) => {
    const key = `${history.length}|${plan.workoutId ?? ''}|${todayKey()}`;
    if (inFlight.current) {
      // Une séance (ou un nouveau jour) est arrivée pendant un appel : le résumé en
      // cours de rédaction sera déjà périmé, on en refera un juste après. Même
      // situation que l'appel en cours (double clic, effet rejoué) : rien à refaire.
      if (key !== inFlightKey.current) rerunAfter.current = true;
      return;
    }
    inFlight.current = true;
    inFlightKey.current = key;
    clearRetry();
    setLoading(true);
    setError(null);
    try {
      const digest = buildCoachDigest({
        history, resolveWorkout: getWorkout, profile: trainingProfile, bodyWeightHistory,
        programName: program.name, weeklySessionGoal,
      });
      // `auto` : préparé tout seul au lancement. Sans accord déjà donné, rien n'est envoyé
      // (voir askAiConsent) ; la question n'est posée que si la personne appuie sur « Actualiser ».
      const response = await requestCoachAi({
        mode: 'daily', digest, daily: plan.context, apiKey: readStoredApiKey() || undefined,
      }, { prompt: !auto });
      if (response.ok && response.mode === 'daily') {
        const fresh: CachedDaily = {
          daily: response.daily, day: todayKey(), sessions: history.length,
          workoutId: plan.workoutId, model: response.model,
        };
        setCached(fresh);
        writeCachedDaily(fresh);
        retried.current = false;
      } else if (!response.ok && response.code === 'CONSENTEMENT_REFUSE') {
        // Pas d'accord : ni erreur rouge ni nouvelle tentative, juste une invitation.
        setError(auto
          ? 'Le résumé du jour utilise le coach IA. Appuie sur « Actualiser » pour l’activer.'
          : response.message);
        retried.current = true;
      } else if (!response.ok) {
        setError(response.message);
        // Tous les modèles étaient occupés (le serveur a déjà essayé les modèles
        // de secours) : une seule nouvelle tentative, un peu plus tard.
        if (!retried.current && response.code !== 'CLE_MANQUANTE' && response.code !== 'CLE_INVALIDE') {
          retried.current = true;
          retryTimer.current = setTimeout(() => {
            retryTimer.current = null;
            void generateRef.current();
          }, 20_000);
        }
      }
    } catch {
      setError('Le résumé n’a pas pu être préparé.');
    } finally {
      setLoading(false);
      inFlight.current = false;
      if (rerunAfter.current) {
        rerunAfter.current = false;
        void generateRef.current(auto);
      }
    }
    // `plan` est recalculé à chaque rendu ; les entrées qui comptent sont listées ci-dessous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, trainingProfile, bodyWeightHistory, program.name, weeklySessionGoal, plan.workoutId]);
  generateRef.current = generate;

  // Pas de nouvelle tentative différée une fois l'appli démontée.
  useEffect(() => clearRetry, []);

  const upToDate = cached !== null && cached.day === todayKey()
    && cached.sessions === history.length && cached.workoutId === plan.workoutId;

  useEffect(() => {
    if (!enabled || upToDate || history.length === 0) return;
    // Nouvelle séance ou nouveau jour : une nouvelle tentative différée redevient permise.
    retried.current = false;
    void generate(true);
    // Une seule tentative automatique par changement de séance : pas de boucle si l'appel échoue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, history.length, plan.workoutId]);

  return { cached: cached?.day === todayKey() ? cached : null, plan, loading, error, refresh: () => { void generate(); } };
};
