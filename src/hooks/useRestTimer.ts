/**
 * useRestTimer.ts — Web version
 *
 * Même logique endTimestamp que la version RN, mais :
 *   - AppState → document.visibilitychange
 *   - setInterval reste le moteur du countdown foreground
 *
 * Robustesse background :
 *   Les navigateurs throttlent les setInterval en arrière-plan (ex: Chrome les
 *   limite à 1 Hz). En stockant endTimestamp, la valeur recalculée au retour
 *   sur l'onglet est toujours exacte — pas de dérive.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useWorkoutStore } from '../store/workoutStore';

interface UseRestTimerReturn {
  secondsLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  progress: number;
  formattedTime: string;
}

const formatTime = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const useRestTimer = (onComplete: () => void): UseRestTimerReturn => {
  const timer = useWorkoutStore((s) => s.timer);
  const skipTimer = useWorkoutStore((s) => s.skipTimer);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);

  const calcRemaining = useCallback((): number => {
    if (!timer.endTimestamp) return 0;
    return Math.max(0, Math.ceil((timer.endTimestamp - Date.now()) / 1000));
  }, [timer.endTimestamp]);

  const handleComplete = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    skipTimer();
    // Vibration courte de fin
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
    onComplete();
  }, [skipTimer, onComplete]);

  // ── setInterval principal (foreground) ──────────────────────────────────
  useEffect(() => {
    if (!timer.isRunning || !timer.endTimestamp) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    hasCompletedRef.current = false;

    const tick = () => {
      if (calcRemaining() <= 0) {
        clearInterval(intervalRef.current!);
        handleComplete();
      }
      // Force re-render via store subscription (calcRemaining lu dans le rendu)
    };

    tick();
    intervalRef.current = setInterval(tick, 500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timer.isRunning, timer.endTimestamp]);

  // ── visibilitychange : recalcul au retour sur l'onglet ──────────────────
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && timer.isRunning && timer.endTimestamp) {
        if (calcRemaining() <= 0) handleComplete();
        // L'interval reprend automatiquement (il était throttlé, pas arrêté)
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [timer.isRunning, timer.endTimestamp, calcRemaining, handleComplete]);

  const secondsLeft = timer.isRunning && timer.endTimestamp ? calcRemaining() : 0;

  return {
    secondsLeft,
    totalSeconds: timer.totalSeconds,
    isRunning: timer.isRunning,
    progress: timer.totalSeconds > 0 ? secondsLeft / timer.totalSeconds : 0,
    formattedTime: formatTime(secondsLeft),
  };
};
