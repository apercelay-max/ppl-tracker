import React, { useState } from 'react';
import { Exercise, SetEntry } from '../data/types';
import { PROGRESSION_WEEKS } from '../data/workouts';
import { SetRow } from './SetRow';

interface ExerciseCardProps {
  exercise: Exercise;
  setEntries: SetEntry[];
  currentSetIndex: number;
  isActive: boolean;
  currentWeek: number;
  onSetComplete: (setIndex: number, entry: SetEntry) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise, setEntries, currentSetIndex, isActive, currentWeek, onSetComplete,
}) => {
  const [notesOpen, setNotesOpen] = useState(false);

  const weekIdx = currentWeek <= 2 ? 0 : currentWeek <= 4 ? 1 : currentWeek <= 6 ? 2 : currentWeek === 7 ? 3 : 4;
  const weekData = PROGRESSION_WEEKS[weekIdx];
  const completedCount = setEntries.filter((s) => s.completed).length;
  const allDone = completedCount === exercise.sets;

  const restLabel =
    exercise.restMode === 'superset' && exercise.supersetOrder === 1
      ? '↪ enchaîné'
      : exercise.restMode === 'bilateral'
      ? `${exercise.bilateralRestSeconds}s / ${exercise.restSeconds}s`
      : `${exercise.restSeconds}s`;

  return (
    <div style={{
      ...card,
      ...(isActive ? cardActive : {}),
      ...(allDone ? cardDone : {}),
    }}>
      {/* ── Header ── */}
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={muscleGroupStyle}>{exercise.muscleGroup}</span>
          {exercise.isSuperset && <span style={ssBadge}>⟳ SS</span>}
        </div>
        <span style={restBadge}>{restLabel}</span>
      </div>

      {/* ── Nom ── */}
      <p style={name}>{exercise.name}</p>

      {/* ── Cibles ── */}
      <div style={targets}>
        <div style={targetBadge}>
          <span style={targetLabel}>REPS</span>
          <span style={targetValue}>{exercise.targetReps}</span>
        </div>
        <div style={targetBadge}>
          <span style={targetLabel}>SÉRIES</span>
          <span style={targetValue}>{exercise.sets}</span>
        </div>
        <div style={{ ...targetBadge, background: '#1a1f1a', border: '1px solid #2a3a2a' }}>
          <span style={targetLabel}>RIR</span>
          <span style={{ ...targetValue, color: '#5a9a5a' }}>
            {weekData.rir.replace('RIR ', '')}
          </span>
        </div>
      </div>

      {/* ── Notes (collapse) ── */}
      {exercise.notes && (
        <button
          onClick={() => setNotesOpen(!notesOpen)}
          style={notesBtn}
        >
          <span style={{ color: '#444', marginRight: 6 }}>{notesOpen ? '▾' : '▸'}</span>
          <span style={{ flex: 1, textAlign: 'left', color: '#666', fontSize: 12, fontStyle: 'italic', lineHeight: '17px' }}>
            {notesOpen ? exercise.notes : exercise.notes.slice(0, 70) + (exercise.notes.length > 70 ? '…' : '')}
          </span>
        </button>
      )}

      {/* ── Séries ── */}
      {(isActive || allDone) ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
          {setEntries.map((entry, idx) => (
            <SetRow
              key={idx}
              setNumber={idx + 1}
              targetReps={exercise.targetReps}
              defaultWeight={exercise.defaultWeight ?? ''}
              entry={entry}
              isCurrent={isActive && idx === currentSetIndex}
              onComplete={(e) => onSetComplete(idx, e)}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: '8px 0 10px', textAlign: 'center' }}>
          <span style={{ color: '#444', fontSize: 13 }}>
            {exercise.sets} × {exercise.targetReps}
          </span>
        </div>
      )}

      {/* ── Barre de progression ── */}
      <div style={{ display: 'flex', gap: 4 }}>
        {setEntries.map((entry, idx) => (
          <div
            key={idx}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: entry.completed
                ? '#4CAF50'
                : (isActive && idx === currentSetIndex) ? '#555' : '#222',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#111', borderRadius: 16, padding: 16,
  marginBottom: 12, border: '1px solid #1e1e1e',
};
const cardActive: React.CSSProperties = {
  border: '1px solid #3a3a3a', background: '#131313',
};
const cardDone: React.CSSProperties = { opacity: 0.55 };
const header: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
};
const muscleGroupStyle: React.CSSProperties = {
  color: '#555', fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
};
const ssBadge: React.CSSProperties = {
  background: '#1a2a1a', borderRadius: 6, padding: '2px 7px',
  border: '1px solid #2a4a2a', color: '#5a9a5a', fontSize: 10, fontWeight: 700,
};
const restBadge: React.CSSProperties = { color: '#444', fontSize: 12 };
const name: React.CSSProperties = {
  color: '#f0f0f0', fontSize: 17, fontWeight: 700, marginBottom: 10, lineHeight: '22px',
};
const targets: React.CSSProperties = {
  display: 'flex', gap: 8, marginBottom: 10,
};
const targetBadge: React.CSSProperties = {
  flex: 1, background: '#1a1a1a', borderRadius: 8, padding: '7px 4px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
};
const targetLabel: React.CSSProperties = {
  color: '#555', fontSize: 9, fontWeight: 700, letterSpacing: 1,
};
const targetValue: React.CSSProperties = {
  color: '#ccc', fontSize: 14, fontWeight: 700,
};
const notesBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', width: '100%',
  background: '#0d0d0d', borderRadius: 8, padding: 10, marginBottom: 10,
  cursor: 'pointer', border: 'none',
};
