/**
 * useRestTimer.ts â Web version
 *
 * MÃªme logique endTimestamp que la version RN, mais :
 *   - AppState â document.visibilitychange
 *   - setInterval reste le moteur du countdown foreground
 *
 * Robustesse background :
 *   Les navigateurs throttlent les setInterval en arriÃ¨re-plan (ex: Chrome les
 *   limite Ã  1 Hz). En stockant endTimestamp, la valeur recalculÃ©e au retour
 *   sur l'onglet est toujours exacte â pas de dÃ©rive.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
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

  // State local pour forcer le re-render Ã  chaque tick
  const [secondsLeft, setSecondsLeft] = useState(() => calcRemaining());

  const handleComplete = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    skipTimer();
    // Vibration courte de fin
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
    onComplete();
  }, [skipTimer, onComplete]);

  // ââ setInterval principal (foreground) ââââââââââââââââââââââââââââââââââ
  useEffect(() => {
    if (!timer.isRunning || !timer.endTimestamp) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSecondsLeft(0);
      return;
    }

    hasCompletedRef.current = false;

    const tick = () => {
      const remaining = calcRemaining();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        handleComplete();
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timer.isRunning, timer.endTimestamp]);

  // ââ visibilitychange : recalcul au retour sur l'onglet ââââââââââââââââââ
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && timer.isRunning && timer.endTimestamp) {
        const remaining = calcRemaining();
        setSecondsLeft(remaining);
        if (remaining <= 0) handleComplete();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [timer.isRunning, timer.endTimestamp, calcRemaining, handleComplete]);

  // Sync si le endTimestamp change (addTimer / reduceTimer)
  useEffect(() => {
    if (timer.isRunning && timer.endTimestamp) {
      setSecondsLeft(calcRemaining());
    }
  }, [timer.endTimestamp]);

  return {
    secondsLeft,
    totalSeconds: timer.totalSeconds,
    isRunning: timer.isRunning,
    progress: timer.totalSeconds > 0 ? secondsLeft / timer.totalSeconds : 0,
    formattedTime: formatTime(secondsLeft),
  };
};
