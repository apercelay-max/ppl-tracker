import React, { useCallback } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { useRestTimer } from '../hooks/useRestTimer';
import { Exercise } from '../data/types';

const CIRCLE_SIZE = 220;
const RADIUS = 95;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface RestTimerProps {
  nextExercise?: Exercise;
  nextSetNumber?: number;
  onTimerComplete: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({ nextExercise, nextSetNumber, onTimerComplete }) => {
  const skipTimer = useWorkoutStore((s) => s.skipTimer);
  const reduceTimer = useWorkoutStore((s) => s.reduceTimer);
  const { secondsLeft, isRunning, progress, formattedTime } = useRestTimer(onTimerComplete);

  const handleSkip = useCallback(() => {
    skipTimer();
    onTimerComplete();
  }, [skipTimer, onTimerComplete]);

  if (!isRunning) return null;

  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const arcColor = secondsLeft > 60 ? '#4CAF50' : secondsLeft > 30 ? '#FF9800' : '#F44336';
  const glowColor = secondsLeft > 60 ? 'rgba(76,175,80,0.3)' : secondsLeft > 30 ? 'rgba(255,152,0,0.3)' : 'rgba(244,67,54,0.3)';

  return (
    <div style={overlay}>
      <div className="fade-in" style={card}>

        <p style={label}>⏱ REPOS</p>

        <div style={{ position: 'relative', width: CIRCLE_SIZE, height: CIRCLE_SIZE, margin: '0 auto 20px' }}>
          <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            <circle cx={CIRCLE_SIZE/2} cy={CIRCLE_SIZE/2} r={RADIUS} fill="none" stroke="#1e1e1e" strokeWidth={10} />
            <circle cx={CIRCLE_SIZE/2} cy={CIRCLE_SIZE/2} r={RADIUS} fill="none" stroke={arcColor} strokeWidth={10} strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} transform={`rotate(-90 ${CIRCLE_SIZE/2} ${CIRCLE_SIZE/2})`} style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s', filter: `drop-shadow(0 0 8px ${arcColor})` }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="tabular" style={{ fontSize: 52, fontWeight: 200, color: arcColor, letterSpacing: -2, textShadow: `0 0 20px ${glowColor}` }}>{formattedTime}</span>
            <span style={{ color: '#444', fontSize: 11, letterSpacing: 1, marginTop: 4 }}>secondes</span>
          </div>
        </div>

        {nextExercise && (
          <div style={{ background: '#111', borderRadius: 14, padding: 14, marginBottom: 20, border: '1px solid #1e1e1e' }}>
            <p style={{ color: '#444', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 5 }}>PROCHAIN</p>
            <p style={{ color: '#ddd', fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{nextExercise.name}</p>
            <p style={{ color: '#666', fontSize: 13 }}>Série {nextSetNumber} / {nextExercise.sets} · {nextExercise.targetReps} reps</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="timer-btn" style={btnReduce} onClick={() => reduceTimer(30)}>−30 s</button>
          <button className="timer-btn" style={btnSkip} onClick={handleSkip}>Passer →</button>
        </div>

      </div>
    </div>
  );
};

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 };
const card: React.CSSProperties = { width: '100%', maxWidth: 380, background: 'linear-gradient(135deg, #141414, #0f0f0f)', borderRadius: 28, padding: '28px 24px', border: '1px solid #222', textAlign: 'center', boxShadow: '0 40px 80px rgba(0,0,0,0.8)' };
const label: React.CSSProperties = { color: '#555', fontSize: 12, fontWeight: 700, letterSpacing: 3, marginBottom: 16 };
const btnReduce: React.CSSProperties = { flex: 1, background: '#1a1a1a', borderRadius: 14, padding: '14px 0', color: '#888', fontSize: 15, fontWeight: 600, border: '1px solid #2a2a2a', cursor: 'pointer' };
const btnSkip: React.CSSProperties = { flex: 1, background: '#222', borderRadius: 14, padding: '14px 0', color: '#fff', fontSize: 15, fontWeight: 700, border: '1px solid #333', cursor: 'pointer' };
