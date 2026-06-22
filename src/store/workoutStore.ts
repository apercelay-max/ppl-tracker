/**
 * workoutStore.ts — Web version
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

let notifTimeoutId: ReturnType<typeof setTimeout> | null = null;

const scheduleRestNotification = (seconds: number) => {
  if (notifTimeoutId) clearTimeout(notifTimeoutId);
  notifTimeoutId = setTimeout(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('💪 Repos terminé !', {
        body: "C'est reparti — série suivante.",
        silent: false,
      });
    }
  }, seconds * 1000);
};

const cancelRestNotification = () => {
  if (notifTimeoutId) { clearTimeout(notifTimeoutId); notifTimeoutId = null; }
};

const vibrate = () => {
  if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
};
