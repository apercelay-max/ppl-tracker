import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkoutSession, ExerciseProgress, SetEntry, HistoryEntry, TimerState } from '../data/types';
import { getWorkout } from '../data/workouts';

const notifSupported = typeof Notification !== 'undefined';
let notifTimeoutId: ReturnType<typeof setTimeout> | null = null;

const scheduleRestNotification = (seconds: number) => {
  if (!notifSupported) return;
  if (notifTimeoutId) clearTimeout(notifTimeoutId);
  notifTimeoutId = setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('\u{1F4AA} Repos terminé !', { body: "C'est reparti — série suivante.", silent: false });
    }
  }, seconds * 1000);
};

const cancelRestNotification = () => {
  if (notifTimeoutId) { clearTimeout(notifTimeoutId); notifTimeoutId = null; }
};

const vibrate = () => {
  try { if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]); } catch (_) {}
};

interface WorkoutStore {
  session: WorkoutSession | null;
  timer: TimerState;
  currentWeek: number;
  history: HistoryEntry[];
  /** ThemeId partagé avec Repas & Courses, ou "system" (les anciens "dark"/"light" sont migrés) */
  theme: string;
  startSession: (dayId: string) => void;
  completeSet: (exerciseId: string, setIndex: number, entry: SetEntry) => void;
  finishSession: () => void;
  abandonSession: () => void;
  startTimer: (seconds: number) => void;
  skipTimer: () => void;
  reduceTimer: (secondsToRemove: number) => void;
  addTimer: (secondsToAdd: number) => void;
  setCurrentWeek: (week: number) => void;
  setTheme: (t: string) => void;
  advanceSession: () => void;
  resetAll: () => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      session: null,
      timer: { isRunning: false, endTimestamp: null, totalSeconds: 0 },
      currentWeek: 1,
      history: [],
      theme: 'classicDark',

      startSession: (dayId) => {
        const workout = getWorkout(dayId);
        if (!workout) return;
        try {
          if (notifSupported && Notification.permission === 'default') Notification.requestPermission();
        } catch (_) {}
        const exerciseProgress: ExerciseProgress = {};
        for (const ex of workout.exercises) {
          exerciseProgress[ex.id] = Array.from({ length: ex.sets }, () => ({
            weight: ex.defaultWeight ?? '', reps: '', completed: false,
          }));
        }
        set({
          session: {
            dayId, startTime: Date.now(), exerciseProgress,
            currentExerciseIndex: 0, currentSetIndex: 0, isComplete: false,
          },
        });
      },

      completeSet: (exerciseId, setIndex, entry) => {
        const { session } = get();
        if (!session) return;
        const updated = { ...session.exerciseProgress };
        updated[exerciseId] = [...updated[exerciseId]];
        updated[exerciseId][setIndex] = { ...entry, completed: true };
        set({ session: { ...session, exerciseProgress: updated } });
      },

      advanceSession: () => {
        const { session } = get();
        if (!session) return;
        const workout = getWorkout(session.dayId);
        if (!workout) return;
        const currentEx = workout.exercises[session.currentExerciseIndex];
        if (!currentEx) return;
        const isLastSet = session.currentSetIndex === currentEx.sets - 1;
        if (isLastSet) {
          const nextIdx = session.currentExerciseIndex + 1;
          if (nextIdx >= workout.exercises.length) { get().finishSession(); }
          else { set({ session: { ...session, currentExerciseIndex: nextIdx, currentSetIndex: 0 } }); }
        } else {
          set({ session: { ...session, currentSetIndex: session.currentSetIndex + 1 } });
        }
      },

      finishSession: () => {
        const { session, history } = get();
        if (!session) return;
        const entry: HistoryEntry = {
          id: `${session.dayId}-${session.startTime}`,
          dayId: session.dayId, date: session.startTime,
          exerciseProgress: session.exerciseProgress,
          durationMs: Date.now() - session.startTime,
        };
        set({ session: { ...session, isComplete: true }, history: [entry, ...history].slice(0, 50) });
        cancelRestNotification();
      },

      abandonSession: () => {
        set({ session: null, timer: { isRunning: false, endTimestamp: null, totalSeconds: 0 } });
        cancelRestNotification();
      },

      startTimer: (seconds) => {
        if (seconds <= 0) return;
        const endTimestamp = Date.now() + seconds * 1000;
        set({ timer: { isRunning: true, endTimestamp, totalSeconds: seconds } });
        scheduleRestNotification(seconds);
        vibrate();
      },

      skipTimer: () => {
        set({ timer: { isRunning: false, endTimestamp: null, totalSeconds: 0 } });
        cancelRestNotification();
      },

      reduceTimer: (secondsToRemove) => {
        const { timer } = get();
        if (!timer.endTimestamp) return;
        const newEnd = Math.max(Date.now() + 1000, timer.endTimestamp - secondsToRemove * 1000);
        set({ timer: { ...timer, endTimestamp: newEnd } });
        scheduleRestNotification(Math.ceil((newEnd - Date.now()) / 1000));
      },

      addTimer: (secondsToAdd) => {
        const { timer } = get();
        if (!timer.endTimestamp) return;
        const newEnd = timer.endTimestamp + secondsToAdd * 1000;
        set({ timer: { ...timer, endTimestamp: newEnd } });
        scheduleRestNotification(Math.ceil((newEnd - Date.now()) / 1000));
      },

      setCurrentWeek: (week) => set({ currentWeek: Math.min(8, Math.max(1, week)) }),
      setTheme: (t) => set({ theme: t }),

      resetAll: () => {
        set({
          session: null,
          timer: { isRunning: false, endTimestamp: null, totalSeconds: 0 },
          currentWeek: 1,
          history: [],
        });
        cancelRestNotification();
      },
    }),
    {
      name: 'ppl-tracker-store',
      partialize: (state) => ({
        session: state.session, currentWeek: state.currentWeek,
        history: state.history, theme: state.theme,
      }),
    }
  )
);
