import { Capacitor, registerPlugin } from '@capacitor/core';
import { getProgram } from '../data/programs';
import { getMuscleGroupsStatus } from '../utils/training';
import { useWorkoutStore } from '../store/workoutStore';

// Pont vers le widget de l'écran d'accueil iOS (WidgetBridgePlugin.swift) :
// le widget est un petit programme séparé qui ne peut pas lire le localStorage
// de l'appli, on lui envoie donc un résumé prêt à afficher. Sur le web
// (navigateur, PWA) il n'y a pas de widget : tout ce fichier ne fait rien.
interface WidgetBridgePlugin {
  setData(options: { json: string }): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

const FALLBACK_ACCENT = '#7a7a90';

// Ce que le widget affiche. Tout champ ajouté ici doit aussi l'être dans
// WidgetData (ios/App/PPLWidget/PPLWidget.swift) en optionnel, sinon un widget
// plus ancien que l'appli (ou l'inverse) cesserait d'afficher quoi que ce soit.
interface WidgetPayload {
  nextName: string;
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
  updatedAt: number;
}

const buildPayload = (): WidgetPayload | null => {
  const s = useWorkoutStore.getState();
  const program = getProgram(s.activeProgramId, s.customPrograms);
  const next = program.workouts.find((w) => !s.cycleDoneIds.includes(w.id)) ?? program.workouts[0];
  if (!next) return null;
  // Même fenêtre glissante de 7 jours que le compteur de l'écran d'accueil,
  // pour que le widget et l'appli disent toujours la même chose.
  const now = Date.now();
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
  return {
    nextName: next.name,
    dayLabel: [program.dayTypeLabels[next.id], `J${next.dayNumber}`].filter(Boolean).join(' · '),
    exerciseCount: next.exercises.length,
    duration: next.estimatedDuration ?? '',
    accent: program.dayAccents[next.id] ?? FALLBACK_ACCENT,
    sessionsThisWeek: s.history.filter((e) => now - e.date < 7 * 86400000).length,
    weeklyGoal: s.weeklySessionGoal,
    weekDays,
    lateMuscles,
    totalSessions: s.totalSessionsCompleted,
    updatedAt: now,
  };
};

let lastSent = '';

const push = () => {
  const payload = buildPayload();
  if (!payload) return;
  // updatedAt change à chaque appel : on le retire pour ne renvoyer que si le
  // contenu a vraiment changé (sinon le widget serait rechargé à chaque action).
  const { updatedAt: _ignored, ...content } = payload;
  const key = JSON.stringify(content);
  if (key === lastSent) return;
  lastSent = key;
  WidgetBridge.setData({ json: JSON.stringify(payload) }).catch(() => {
    // Le widget est un bonus : s'il est indisponible, l'appli continue normalement.
    lastSent = '';
  });
};

export const startWidgetSync = () => {
  if (Capacitor.getPlatform() !== 'ios') return;
  push();
  useWorkoutStore.subscribe(push);
};
