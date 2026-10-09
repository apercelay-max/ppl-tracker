import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { getProgram } from '../data/programs';
import { getWorkout } from '../data/workouts';
import { getAllExercises, getLastExerciseSets, getMuscleGroupsStatus, getMuscleRecoveryStatus, getRecoveryPct } from '../utils/training';
import { getCoachBrief } from '../utils/coach';
import { kgToLbs, lbsToKg } from '../utils/weight';
import { getWatchHandlers } from './watchBridge';
import { computeCurrentWeekStreak, useWorkoutStore } from '../store/workoutStore';
import { getBinomeState, subscribeBinome } from '../hooks/useBinome';
import { currentTier, hasTier, useSubscriptionStore } from './subscriptions';
import { useReferralStore } from './referral';

// Pont vers les widgets iOS et le minuteur de repos de l'écran verrouillé
// (WidgetBridgePlugin.swift). Les widgets sont de petits programmes séparés
// qui ne peuvent pas lire le localStorage de l'appli : on leur envoie donc un
// résumé prêt à afficher. Sur le web (navigateur, PWA) il n'y a ni widget ni
// écran verrouillé : tout ce fichier ne fait rien.
interface WidgetBridgePlugin {
  setData(options: { json: string }): Promise<void>;
  consumePendingLink(): Promise<{ link?: string }>;
  updateWatch(options: { json: string }): Promise<void>;
  addListener(event: 'watchCommand', cb: (data: { cmd: string; weight?: number; reps?: number }) => void): Promise<PluginListenerHandle>;
  addListener(event: 'pendingLink', cb: () => void): Promise<PluginListenerHandle>;
  updateWorkout(options: {
    title: string; exerciseName: string; setNumber: number; setsInExercise: number;
    setsDone: number; setsTotal: number; startTimestamp: number; sessionPaused: boolean;
    restEndTimestamp?: number; restTotalSeconds: number; restPaused: boolean; restPausedRemaining: number;
    volume: number; unit: string; heartRate?: number;
  }): Promise<void>;
  endWorkout(): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

const FALLBACK_ACCENT = '#7a7a90';
const DAY_MS = 86400000;

// Ce que les widgets affichent. Tout champ ajouté ici doit aussi l'être dans
// WidgetData (ios/App/PPLWidget/Shared.swift) en optionnel, sinon un widget
// plus ancien que l'appli (ou l'inverse) cesserait d'afficher quoi que ce soit.
interface WidgetPayload {
  // Faux = widgets verrouillés. PPL Plus, PPL Pro et le mois offert du parrainage l'ouvrent.
  pro: boolean;
  // Formule active : les grands widgets demandent PPL Pro.
  tier: 'free' | 'plus' | 'pro';
  nextName: string;
  nextDayId: string;
  dayLabel: string;
  exerciseCount: number;
  duration: string;
  accent: string;
  sessionsThisWeek: number;
  weeklyGoal: number;
  // 7 derniers jours, aujourd'hui en dernier : true = au moins une séance ce jour-là.
  weekDays: boolean[];
  // Muscles travaillés le moins récemment (les 3 plus en retard).
  lateMuscles: { name: string; daysSince: number }[];
  totalSessions: number;
  streak: number;
  bestStreak: number;
  unit: 'kg' | 'lbs';
  lastRecord: { exercise: string; weight: number; daysAgo: number } | null;
  bodyWeight: { latest: number; delta: number | null; points: number[] } | null;
  binome: { name: string; week: number; goal: number; myWeek: number; myGoal: number; lastSessionDaysAgo: number | null } | null;
  // Muscles déjà travaillés, du moins récupéré au plus récupéré (pct : 0 à 1).
  recovery: { name: string; pct: number; hoursRemaining: number }[];
  coach: { recap: string; focus: string; action: string } | null;
  updatedAt: number;
}

// Le dernier exercice où le poids max a battu tout ce qui avait été fait avant.
// La toute première fois qu'on fait un exercice n'est pas un record : il faut
// un point de comparaison.
const findLastRecord = (history: ReturnType<typeof useWorkoutStore.getState>['history'], now: number) => {
  const names = new Map(getAllExercises(history).map((e) => [e.id, e.name]));
  const bestBefore = new Map<string, number>();
  let record: { exercise: string; weight: number; date: number } | null = null;
  for (let i = history.length - 1; i >= 0; i--) { // history est triée du plus récent au plus ancien
    const entry = history[i];
    for (const [id, sets] of Object.entries(entry.exerciseProgress)) {
      let max = 0;
      for (const set of sets) {
        const w = parseFloat(set.weight);
        if (set.completed && !isNaN(w) && w > max) max = w;
      }
      if (max <= 0) continue;
      const before = bestBefore.get(id) ?? 0;
      if (before > 0 && max > before) record = { exercise: names.get(id) ?? id, weight: max, date: entry.date };
      if (max > before) bestBefore.set(id, max);
    }
  }
  return record && { exercise: record.exercise, weight: record.weight, daysAgo: Math.max(0, Math.floor((now - record.date) / DAY_MS)) };
};

const buildPayload = (): WidgetPayload | null => {
  const s = useWorkoutStore.getState();
  const program = getProgram(s.activeProgramId, s.customPrograms);
  const next = program.workouts.find((w) => !s.cycleDoneIds.includes(w.id)) ?? program.workouts[0];
  if (!next) return null;
  const now = Date.now();
  const toUnit = (kg: number) => Math.round((s.weightUnit === 'lbs' ? kgToLbs(kg) : kg) * 10) / 10;

  // Jours calendaires (setDate) et non multiples de 24 h : un jour de changement
  // d'heure dure 23 ou 25 h, ce qui décalerait les cases d'un jour.
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (6 - i));
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return s.history.some((e) => e.date >= start.getTime() && e.date < end.getTime());
  });
  const lateMuscles = getMuscleGroupsStatus(s.history)
    .filter((m): m is { group: string; daysSince: number } => m.daysSince !== null)
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, 3)
    .map((m) => ({ name: m.group, daysSince: m.daysSince }));

  const record = findLastRecord(s.history, now);

  // Courbe du poids de corps sur 30 jours (bodyWeightHistory : du plus récent au plus ancien).
  const recentWeights = s.bodyWeightHistory.filter((e) => now - e.date <= 30 * DAY_MS).reverse();
  const bodyWeight = s.bodyWeightHistory.length === 0 ? null : {
    latest: toUnit(s.bodyWeightHistory[0].weightKg),
    delta: recentWeights.length >= 2 ? toUnit(recentWeights[recentWeights.length - 1].weightKg - recentWeights[0].weightKg) : null,
    points: recentWeights.map((e) => toUnit(e.weightKg)),
  };

  const binomeState = getBinomeState();
  const binome = binomeState && binomeState.connecte && binomeState.en_binome && binomeState.partenaire ? {
    name: binomeState.partenaire.nom,
    week: binomeState.partenaire.semaine,
    goal: binomeState.partenaire.objectif,
    myWeek: binomeState.moi.semaine,
    myGoal: binomeState.moi.objectif,
    lastSessionDaysAgo: binomeState.partenaire.derniere_seance
      ? Math.max(0, Math.floor((now - new Date(binomeState.partenaire.derniere_seance).getTime()) / DAY_MS))
      : null,
  } : null;

  const recovery = getMuscleRecoveryStatus(s.history)
    .filter((m) => m.hoursSince !== null)
    .map((m) => ({ name: m.group, pct: Math.round(getRecoveryPct(m) * 100) / 100, hoursRemaining: m.hoursRemaining }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 8);

  const brief = getCoachBrief(s.history, getWorkout);

  return {
    pro: hasTier('plus'),
    tier: currentTier(),
    nextName: next.name,
    nextDayId: next.id,
    dayLabel: [program.dayTypeLabels[next.id], `J${next.dayNumber}`].filter(Boolean).join(' · '),
    exerciseCount: next.exercises.length,
    duration: next.estimatedDuration ?? '',
    accent: program.dayAccents[next.id] ?? FALLBACK_ACCENT,
    // Même fenêtre glissante de 7 jours que le compteur de l'écran d'accueil,
    // pour que le widget et l'appli disent toujours la même chose.
    sessionsThisWeek: s.history.filter((e) => now - e.date < 7 * DAY_MS).length,
    weeklyGoal: s.weeklySessionGoal,
    weekDays,
    lateMuscles,
    totalSessions: s.totalSessionsCompleted,
    streak: computeCurrentWeekStreak(s.history, s.weeklySessionGoal),
    bestStreak: s.bestWeekStreak,
    unit: s.weightUnit,
    lastRecord: record && { ...record, weight: toUnit(record.weight) },
    bodyWeight,
    binome,
    recovery,
    coach: brief && { recap: brief.recap, focus: brief.focus, action: brief.action },
    updatedAt: now,
  };
};

let lastSent = '';

const pushData = () => {
  // Tant que l'état de l'abonnement n'est pas lu, « non Pro » serait faux : les widgets afficheraient « verrouillé » à tort.
  if (!useSubscriptionStore.getState().ready) return;
  const payload = buildPayload();
  if (!payload) return;
  // updatedAt change à chaque appel : on le retire pour ne renvoyer que si le
  // contenu a vraiment changé (sinon les widgets seraient rechargés à chaque action).
  const { updatedAt: _ignored, ...content } = payload;
  const key = JSON.stringify(content);
  if (key === lastSent) return;
  lastSent = key;
  WidgetBridge.setData({ json: JSON.stringify(payload) }).catch(() => {
    // Les widgets sont un bonus : s'ils sont indisponibles, l'appli continue normalement.
    lastSent = '';
  });
};

// Le calcul parcourt tout l'historique : on attend que les modifications se
// calment (saisie d'un poids, séries validées à la suite) avant de le refaire.
let pushTimer: ReturnType<typeof setTimeout> | undefined;
const schedulePush = () => {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(pushData, 800);
};

// ─── Séance en cours sur l'écran verrouillé ─────────────────────────────────
// Reflète la séance du store : exercice et série en cours, avancement, durée, et le
// minuteur de repos quand il tourne. Contrairement aux widgets, ça doit suivre
// immédiatement (pas d'attente) : on compare juste une clé, c'est très léger.
let lastWorkoutKey = '';

const syncWorkoutActivity = () => {
  const { session, timer, sessionPausedAt } = useWorkoutStore.getState();
  // La séance en direct fait partie de PPL Plus et de PPL Pro.
  const workout = session && !session.isComplete && hasTier('plus') ? getWorkout(session.dayId) : undefined;
  const current = workout?.exercises[session!.currentExerciseIndex];
  if (!session || !workout || !current) {
    if (lastWorkoutKey !== 'off') {
      lastWorkoutKey = 'off';
      WidgetBridge.endWorkout().catch(() => undefined);
    }
    return;
  }

  // Avancement de toute la séance : séries validées sur séries prévues.
  let setsDone = 0;
  let setsTotal = 0;
  let volumeKg = 0;
  for (const ex of workout.exercises) {
    const sets = session.exerciseProgress[ex.id];
    setsTotal += sets?.length ?? ex.sets;
    for (const x of sets ?? []) {
      if (!x.completed) continue;
      setsDone++;
      const w = parseFloat(x.weight);
      const r = parseInt(x.reps, 10);
      if (!isNaN(w) && !isNaN(r)) volumeKg += w * r; // « PDC » ou « AMRAP » : pas de charge chiffrée, on ne compte pas
    }
  }
  const unit = useWorkoutStore.getState().weightUnit;
  const restActive = timer.isRunning && timer.endTimestamp !== null;
  const restPaused = restActive && !!timer.isPaused;
  const payload = {
    title: workout.name,
    exerciseName: session.exerciseNameOverrides?.[current.id] ?? current.name,
    setNumber: Math.min(session.currentSetIndex + 1, session.exerciseProgress[current.id]?.length ?? current.sets),
    setsInExercise: session.exerciseProgress[current.id]?.length ?? current.sets,
    setsDone,
    setsTotal: Math.max(setsTotal, 1),
    startTimestamp: session.startTime,
    sessionPaused: sessionPausedAt !== null,
    restEndTimestamp: restActive ? (timer.endTimestamp as number) : undefined,
    restTotalSeconds: restActive ? timer.totalSeconds : 0,
    restPaused,
    restPausedRemaining: timer.pausedRemainingSeconds ?? 0,
    volume: Math.round(unit === 'lbs' ? kgToLbs(volumeKg) : volumeKg),
    unit,
    // heartRate : à brancher sur HealthKit (Apple Watch / ceinture cardiaque).
  };
  const key = JSON.stringify(payload);
  if (key === lastWorkoutKey) return;
  lastWorkoutKey = key;
  WidgetBridge.updateWorkout(payload).catch(() => undefined);
};

// ─── Apple Watch ───────────────────────────────────────────────────────────
// Envoie à la montre ce qu'elle affiche (séance en cours, repos, prochaine séance) et
// reçoit ses commandes (valider la série, passer le repos). Le téléphone reste le seul
// maître des données : la montre ne calcule rien, elle affiche et demande.
let lastWatchKey = '';

const syncWatch = () => {
  if (!useSubscriptionStore.getState().ready) return;
  const s = useWorkoutStore.getState();
  // L'Apple Watch fait partie de PPL Pro (pas de PPL Plus).
  const pro = hasTier('pro');
  const program = getProgram(s.activeProgramId, s.customPrograms);
  const next = program.workouts.find((w) => !s.cycleDoneIds.includes(w.id)) ?? program.workouts[0];
  const now = Date.now();
  const live = s.session && !s.session.isComplete ? s.session : null;
  const workout = live ? getWorkout(live.dayId) : undefined;
  const ex = live && workout ? workout.exercises[live.currentExerciseIndex] : undefined;
  const toDisplay = (kg: number) => Math.round((s.weightUnit === 'lbs' ? kgToLbs(kg) : kg) * 10) / 10;

  let session: Record<string, unknown> | null = null;
  if (pro && live && workout && ex) {
    const sets = live.exerciseProgress[ex.id] ?? [];
    const total = sets.length || ex.sets;
    const setIdx = Math.min(live.currentSetIndex, Math.max(total - 1, 0));
    // Valeurs de départ proposées sur la montre : série déjà saisie, sinon la série précédente
    // de la séance, sinon la dernière fois, sinon la suggestion du programme.
    const previous = [...sets].slice(0, setIdx).reverse().find((x) => x.completed && x.reps !== '—');
    const lastTime = getLastExerciseSets(s.history, ex.id)?.[setIdx];
    const weightStr = sets[setIdx]?.weight || previous?.weight || lastTime?.weight || ex.defaultWeight || '';
    const weightKg = parseFloat(weightStr);
    const repsStr = sets[setIdx]?.reps || previous?.reps || lastTime?.reps || (ex.targetReps.match(/\d+/)?.[0] ?? '');
    let done = 0;
    let all = 0;
    for (const e of workout.exercises) {
      const ps = live.exerciseProgress[e.id];
      all += ps?.length ?? e.sets;
      done += ps?.filter((x) => x.completed).length ?? 0;
    }
    const restActive = s.timer.isRunning && s.timer.endTimestamp !== null;
    session = {
      title: workout.name,
      exercise: live.exerciseNameOverrides?.[ex.id] ?? ex.name,
      setNumber: setIdx + 1,
      setsInExercise: total,
      setsDone: done,
      setsTotal: Math.max(all, 1),
      weight: isNaN(weightKg) ? null : toDisplay(weightKg),
      reps: parseInt(repsStr, 10) || 0,
      targetReps: ex.targetReps,
      // « PDC » (poids du corps) ou charge non numérique : la montre ne propose pas de poids.
      bodyweight: isNaN(weightKg),
      restEnd: restActive ? s.timer.endTimestamp : null,
      restTotal: restActive ? s.timer.totalSeconds : 0,
      restPaused: restActive && !!s.timer.isPaused,
      restPausedRemaining: s.timer.pausedRemainingSeconds ?? 0,
    };
  }

  const payload = {
    pro,
    unit: s.weightUnit,
    session,
    next: next ? { name: next.name } : null,
    week: {
      done: s.history.filter((e) => now - e.date < 7 * DAY_MS).length,
      goal: s.weeklySessionGoal,
    },
  };
  const key = JSON.stringify(payload);
  if (key === lastWatchKey) return;
  lastWatchKey = key;
  WidgetBridge.updateWatch({ json: key }).catch(() => undefined);
};

/** Commande reçue de la montre. Le poids revient dans l'unité affichée ; le store, lui, est en kg. */
const handleWatchCommand = (data: { cmd: string; weight?: number; reps?: number }) => {
  const handlers = getWatchHandlers();
  const unit = useWorkoutStore.getState().weightUnit;
  if (data.cmd === 'completeSet') {
    if (!handlers) return; // l'écran de séance n'est pas affiché : rien n'est validé à l'aveugle
    const w = typeof data.weight === 'number' ? (unit === 'lbs' ? lbsToKg(data.weight) : data.weight) : NaN;
    const reps = typeof data.reps === 'number' && data.reps > 0 ? String(Math.round(data.reps)) : '';
    if (!reps) return;
    const weightKg = isNaN(w) ? '' : String(Math.round(w * 100) / 100);
    handlers.completeSet(weightKg, reps);
  } else if (data.cmd === 'skipRest') {
    handlers?.skipRest();
  }
};

export const startWidgetSync = () => {
  if (Capacitor.getPlatform() !== 'ios') return;
  schedulePush();
  syncWorkoutActivity();
  syncWatch();
  useWorkoutStore.subscribe(() => {
    schedulePush();
    syncWorkoutActivity();
    syncWatch();
  });
  void WidgetBridge.addListener('watchCommand', handleWatchCommand);
  // Le binôme est chargé depuis le serveur, après le démarrage de l'appli.
  subscribeBinome(schedulePush);
  // Abonnement ou mois offert qui change : widgets et séance en direct se verrouillent / se déverrouillent.
  useSubscriptionStore.subscribe(() => { schedulePush(); syncWorkoutActivity(); syncWatch(); });
  useReferralStore.subscribe(() => { schedulePush(); syncWorkoutActivity(); syncWatch(); });
};

// ─── Liens laissés par Siri ────────────────────────────────────────────────
// Un raccourci Siri (« Démarre ma séance ») range un lien dans l'App Group puis ouvre l'appli.
// On le lit au démarrage, quand l'appli revient au premier plan, et dès que le natif nous prévient.
/** Renvoie le lien en attente (« session/pull-a »), une seule fois, ou null. */
export const consumePendingLink = async (): Promise<string | null> => {
  if (Capacitor.getPlatform() !== 'ios') return null;
  try { return (await WidgetBridge.consumePendingLink()).link ?? null; } catch { return null; }
};

export const onPendingLink = (cb: () => void): (() => void) => {
  if (Capacitor.getPlatform() !== 'ios') return () => undefined;
  const handle = WidgetBridge.addListener('pendingLink', cb);
  return () => { void handle.then((h) => h.remove()); };
};
