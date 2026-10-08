import { Capacitor, registerPlugin } from '@capacitor/core';
import { getProgram } from '../data/programs';
import { getWorkout } from '../data/workouts';
import { getAllExercises, getMuscleGroupsStatus, getMuscleRecoveryStatus, getRecoveryPct } from '../utils/training';
import { getCoachBrief } from '../utils/coach';
import { kgToLbs } from '../utils/weight';
import { computeCurrentWeekStreak, useWorkoutStore } from '../store/workoutStore';
import { getBinomeState, subscribeBinome } from '../hooks/useBinome';

// Pont vers les widgets iOS et le minuteur de repos de l'écran verrouillé
// (WidgetBridgePlugin.swift). Les widgets sont de petits programmes séparés
// qui ne peuvent pas lire le localStorage de l'appli : on leur envoie donc un
// résumé prêt à afficher. Sur le web (navigateur, PWA) il n'y a ni widget ni
// écran verrouillé : tout ce fichier ne fait rien.
interface WidgetBridgePlugin {
  setData(options: { json: string }): Promise<void>;
  startRestTimer(options: { endTimestamp: number; totalSeconds: number; title: string; paused: boolean; pausedRemaining: number }): Promise<void>;
  endRestTimer(): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

const FALLBACK_ACCENT = '#7a7a90';
const DAY_MS = 86400000;

// Ce que les widgets affichent. Tout champ ajouté ici doit aussi l'être dans
// WidgetData (ios/App/PPLWidget/Shared.swift) en optionnel, sinon un widget
// plus ancien que l'appli (ou l'inverse) cesserait d'afficher quoi que ce soit.
interface WidgetPayload {
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

// ─── Minuteur de repos sur l'écran verrouillé ──────────────────────────────
// Reflète le minuteur du store : démarrage, pause, ajout de temps, arrêt.
// Contrairement aux widgets, ça doit suivre immédiatement (pas d'attente).
let lastTimerKey = '';

const syncRestTimer = () => {
  const { timer, session } = useWorkoutStore.getState();
  const active = timer.isRunning && timer.endTimestamp !== null;
  const paused = active && !!timer.isPaused;
  const key = active ? `${timer.endTimestamp}|${paused}|${timer.pausedRemainingSeconds ?? ''}|${timer.totalSeconds}` : 'off';
  if (key === lastTimerKey) return;
  lastTimerKey = key;
  if (!active) {
    WidgetBridge.endRestTimer().catch(() => undefined);
    return;
  }
  WidgetBridge.startRestTimer({
    endTimestamp: timer.endTimestamp as number,
    totalSeconds: timer.totalSeconds,
    title: (session && getWorkout(session.dayId)?.name) || 'Séance',
    paused,
    pausedRemaining: timer.pausedRemainingSeconds ?? 0,
  }).catch(() => undefined);
};

export const startWidgetSync = () => {
  if (Capacitor.getPlatform() !== 'ios') return;
  schedulePush();
  syncRestTimer();
  useWorkoutStore.subscribe(() => {
    schedulePush();
    syncRestTimer();
  });
  // Le binôme est chargé depuis le serveur, après le démarrage de l'appli.
  subscribeBinome(schedulePush);
};
