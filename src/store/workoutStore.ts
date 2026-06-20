/**
 * workoutStore.ts — Web version
 *
 * Différences vs. version React Native :
 *   - Persist via localStorage (zustand par défaut sur web — pas besoin d'AsyncStorage)
 *   - Notifications : Web Notifications API + setTimeout (pas expo-notifications)
 *   - Vibration : navigator.vibrate() (pas expo-haptics)
 *
 * Stratégie timer background (même principe) :
 *   On stocke endTimestamp = Date.now() + durée*1000.
 *   Sur visibilitychange (onglet revient au premier plan), on recalcule
 *   remaining = endTimestamp - Date.now() → toujours exact.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  WorkoutSession,
  ExerciseProgress,
  SetEntry,
  HistoryEntry,
  TimerState,
} from '../data/types';
import { getWorkout } from '../data/workouts';

// ─── Notifications Web ────────────────────────────────────────────────────────

let notifTimeoutId: ReturnType<typeof setTimeout> | null = null;

const scheduleRestNotification = (seconds: number) => {
  if (notifTimeoutId) clearTimeout(notifTimeoutId);
  notifTimeoutId = setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('💪 Repos terminé !', {
        body: "C'est reparti — série suivante.",
        silent: false,
      });
    }
  }, seconds * 1000);
};

const cancelRestNotification = () => {
  if (notifTimeoutId) {
    clearTimeout(notifTimeoutId);
    notifTimeoutId = null;
  }
};

const vibrate = () => {
  if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
};

// ─── Types du store ───────────────────────────────────────────────────────────

interface WorkoutStore {
  session: WorkoutSession | null;
  timer: TimerState;
  currentWeek: number;
  history: HistoryEntry[];

  startSession: (dayId: string) => void;
  completeSet: (exerciseId: string, setIndex: number, entry: SetEntry) => void;
  finishSession: () => void;
  abandonSession: () => void;

  startTimer: (seconds: number) => void;
  skipTimer: () => void;
  reduceTimer: (secondsToRemove: number) => void;

  setCurrentWeek: (week: number) => void;
  advanceSession: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      session: null,
      timer: { isRunning: false, endTimestamp: null, totalSeconds: 0 },
      currentWeek: 1,
      history: [],

      // ── Démarrer une séance ──────────────────────────────────────────────
      startSession: (dayId) => {
        const workout = getWorkout(dayId);
        if (!workout) return;

        // Demande permission notifications au premier lancement
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }

        const exerciseProgress: ExerciseProgress = {};
        for (const ex of workout.exercises) {
          exerciseProgress[ex.id] = Array.from({ length: ex.sets }, () => ({
            weight: ex.defaultWeight ?? '',
            reps: '',
            completed: false,
          }));
        }

        set({
          session: {
            dayId,
            startTime: Date.now(),
            exerciseProgress,
            currentExerciseIndex: 0,
            currentSetIndex: 0,
            isComplete: false,
          },
        });
      },

      // ── Valider une série ────────────────────────────────────────────────
      completeSet: (exerciseId, setIndex, entry) => {
        const { session } = get();
        if (!session) return;
        const updated = { ...session.exerciseProgress };
        updated[exerciseId] = [...updated[exerciseId]];
        updated[exerciseId][setIndex] = { ...entry, completed: true };
        set({ session: { ...session, exerciseProgress: updated } });
      },

      // ── Avancer dans la séance (série ou exercice suivant) ───────────────
      advanceSession: () => {
        const { session } = get();
        if (!session) return;
        const workout = getWorkout(session.dayId);
        if (!workout) return;
        const currentEx = workout.exercises[session.currentExerciseIndex];
        const isLastSet = session.currentSetIndex === currentEx.sets - 1;

        if (isLastSet) {
          const nextIdx = session.currentExerciseIndex + 1;
          if (nextIdx >= workout.exercises.length) {
            get().finishSession();
          } else {
            set({ session: { ...session, currentExerciseIndex: nextIdx, currentSetIndex: 0 } });
          }
        } else {
          set({ session: { ...session, currentSetIndex: session.currentSetIndex + 1 } });
        }
      },

      // ── Terminer la séance ───────────────────────────────────────────────
      finishSession: () => {
        const { session, history } = get();
        if (!session) return;
        const entry: HistoryEntry = {
          id: `${session.dayId}-${session.startTime}`,
          dayId: session.dayId,
          date: session.startTime,
          exerciseProgress: session.exerciseProgress,
          durationMs: Date.now() - session.startTime,
        };
        set({
          session: { ...session, isComplete: true },
          history: [entry, ...history].slice(0, 50),
        });
        cancelRestNotification();
      },

      // ── Abandonner la séance ─────────────────────────────────────────────
      abandonSession: () => {
        set({ session: null, timer: { isRunning: false, endTimestamp: null, totalSeconds: 0 } });
        cancelRestNotification();
      },

      // ── Timer : démarrer ─────────────────────────────────────────────────
      startTimer: (seconds) => {
        if (seconds <= 0) return;
        const endTimestamp = Date.now() + seconds * 1000;
        set({ timer: { isRunning: true, endTimestamp, totalSeconds: seconds } });
        scheduleRestNotification(seconds);
        vibrate();
      },

      // ── Timer : passer ───────────────────────────────────────────────────
      skipTimer: () => {
        set({ timer: { isRunning: false, endTimestamp: null, totalSeconds: 0 } });
        cancelRestNotification();
      },

      // ── Timer : raccourcir de N secondes ─────────────────────────────────
      reduceTimer: (secondsToRemove) => {
        const { timer } = get();
        if (!timer.endTimestamp) return;
        const newEnd = Math.max(Date.now() + 1000, timer.endTimestamp - secondsToRemove * 1000);
        set({ timer: { ...timer, endTimestamp: newEnd } });
        // Reprogramme la notification
        const remaining = Math.ceil((newEnd - Date.now()) / 1000);
        scheduleRestNotification(remaining);
      },

      setCurrentWeek: (week) => set({ currentWeek: Math.min(8, Math.max(1, week)) }),
    }),
    {
      name: 'ppl-tracker-store',
      // localStorage par défaut sur web — pas besoin d'AsyncStorage
      partialize: (state) => ({
        session: state.session,
        currentWeek: state.currentWeek,
        history: state.history,
      }),
    }
  )
);
