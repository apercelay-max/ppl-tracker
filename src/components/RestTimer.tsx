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

export const RestTimer: React.FC<RestTimerProps> = ({
  nextExercise,
  nextSetNumber,
  onTimerComplete,
}) => {
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

  return (
    <div style={overlay}>
      <div className="fade-in" style={card}>

        <p style={label}>REPOS</p>

        {/* Arc SVG */}
        <div style={{ position: 'relative', width: CIRCLE_SIZE, height: CIRCLE_SIZE, margin: '0 auto 20px' }}>
          <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            {/* Piste grise */}
            <circle
              cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS}
              fill="none" stroke="#2a2a2a" strokeWidth={12}
            />
            {/* Arc de progression */}
            <circle
              cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS}
              fill="none"
              stroke={arcColor}
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
              style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
            />
          </svg>
          {/* Temps centré */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="tabular" style={{ fontSize: 52, fontWeight: 200, color: arcColor, letterSpacing: -2 }}>
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Prochain exercice */}
        {nextExercise && (
          <div style={nextBox}>
            <p style={nextLabel}>PROCHAIN</p>
            <p style={nextName}>{nextExercise.name}</p>
            <p style={nextSub}>
              Série {nextSetNumber} / {nextExercise.sets} · {nextExercise.targetReps} reps
            </p>
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btnReduce} onClick={() => reduceTimer(30)}>−30 s</button>
          <button style={btnSkip} onClick={handleSkip}>Passer →</button>
        </div>

      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.88)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
  padding: 20,
};
const card: React.CSSProperties = {
  width: '100%', maxWidth: 380,
  background: '#111',
  borderRadius: 24,
  padding: '28px 24px',
  border: '1px solid #222',
  textAlign: 'center',
};
const label: React.CSSProperties = {
  color: '#666', fontSize: 12, fontWeight: 700, letterSpacing: 3, marginBottom: 16,
};
const nextBox: React.CSSProperties = {
  background: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 20,
};
const nextLabel: React.CSSProperties = {
  color: '#555', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 4,
};
const nextName: React.CSSProperties = {
  color: '#ddd', fontSize: 15, fontWeight: 600, marginBottom: 2,
};
const nextSub: React.CSSProperties = { color: '#777', fontSize: 13 };
const btnReduce: React.CSSProperties = {
  flex: 1, background: '#1e1e1e', borderRadius: 12, padding: '13px 0',
  color: '#aaa', fontSize: 15, fontWeight: 600,
  border: '1px solid #333', cursor: 'pointer',
};
const btnSkip: React.CSSProperties = {
  flex: 1, background: '#2a2a2a', borderRadius: 12, padding: '13px 0',
  color: '#fff', fontSize: 15, fontWeight: 700,
  border: '1px solid #444', cursor: 'pointer',
};
