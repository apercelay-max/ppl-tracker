import React, { useCallback } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { useRestTimer } from '../hooks/useRestTimer';
import { Exercise } from '../data/types';

const CIRCLE_SIZE = 210;
const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface RestTimerProps {
  nextExercise?: Exercise;
  nextSetNumber?: number;
  onTimerComplete: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({ nextExercise, nextSetNumber, onTimerComplete }) => {
  const skipTimer = useWorkoutStore((s) => s.skipTimer);
  const reduceTimer = useWorkoutStore((s) => s.reduceTimer);
  const addTimer = useWorkoutStore((s) => s.addTimer);
  const { secondsLeft, isRunning, progress, formattedTime } = useRestTimer(onTimerComplete);

  const handleSkip = useCallback(() => {
    skipTimer();
    onTimerComplete();
  }, [skipTimer, onTimerComplete]);

  if (!isRunning) return null;

  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const arcColor = secondsLeft > 120 ? '#4CAF50' : secondsLeft > 60 ? '#FF9800' : '#e03030';
  const glowColor = secondsLeft > 120 ? 'rgba(76,175,80,0.3)' : secondsLeft > 60 ? 'rgba(255,152,0,0.3)' : 'rgba(224,48,48,0.3)';

  return (
    <div style={overlay}>
      <div className="fade-in" style={card}>
        <p style={label}>⏸ RÉCUPÉRATION</p>

        <div style={{ position: 'relative', width: CIRCLE_SIZE, height: CIRCLE_SIZE, margin: '0 auto 20px' }}>
          <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={{ position: 'absolute', inset: 0 }}>
            <circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} fill="none" stroke="#1c1c1f" strokeWidth={10} />
            <circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} fill="none"
              stroke={arcColor} strokeWidth={10} strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
              style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s', filter: `drop-shadow(0 0 8px ${arcColor})` }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="tabular" style={{ fontSize: 50, fontWeight: 200, color: arcColor, letterSpacing: -2, textShadow: `0 0 24px ${glowColor}` }}>
              {formattedTime}
            </span>
            <span style={{ color: '#333340', fontSize: 10, letterSpacing: 1.5, marginTop: 4, fontWeight: 700 }}>REPOS</span>
          </div>
        </div>

        {nextExercise && (
          <div style={nextBox}>
            <p style={{ color: '#2a2a38', fontSize: 9, fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>PROCHAIN</p>
            <p style={{ color: '#d0d0e0', fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{nextExercise.name}</p>
            <p style={{ color: '#44445a', fontSize: 12 }}>Série {nextSetNumber} · {nextExercise.targetReps} reps</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="timer-btn" style={btnAdjust} onClick={() => reduceTimer(30)}>−30s</button>
          <button className="timer-btn" style={btnSkip} onClick={handleSkip}>Passer →</button>
          <button className="timer-btn" style={btnAdjust} onClick={() => addTimer(30)}>+30s</button>
        </div>
      </div>
    </div>
  );
};

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 };
const card: React.CSSProperties = { width: '100%', maxWidth: 370, background: 'linear-gradient(160deg, #161618, #111113)', borderRadius: 28, padding: '26px 22px', border: '1px solid #242428', textAlign: 'center', boxShadow: '0 40px 80px rgba(0,0,0,0.9)' };
const label: React.CSSProperties = { color: '#333340', fontSize: 11, fontWeight: 700, letterSpacing: 3, marginBottom: 18 };
const nextBox: React.CSSProperties = { background: '#111113', borderRadius: 14, padding: 14, marginBottom: 18, border: '1px solid #1c1c20' };
const btnAdjust: React.CSSProperties = { flex: 1, background: '#1c1c1f', borderRadius: 12, padding: '13px 0', color: '#555560', fontSize: 13, fontWeight: 600, border: '1px solid #242428', cursor: 'pointer' };
const btnSkip: React.CSSProperties = { flex: 2, background: 'linear-gradient(135deg, #e03030, #b71c1c)', borderRadius: 12, padding: '13px 0', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(224,48,48,0.3)' };
