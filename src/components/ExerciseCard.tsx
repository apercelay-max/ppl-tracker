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
    <div
      className={isActive ? 'exercise-active' : ''}
      style={{
        background: isActive ? '#131313' : '#0f0f0f',
        borderRadius: 18, padding: 16, marginBottom: 10,
        border: isActive ? '1px solid rgba(76,175,80,0.45)' : allDone ? '1px solid #1a2a1a' : '1px solid #161616',
        opacity: allDone && !isActive ? 0.5 : 1,
        transition: 'border-color 0.3s, opacity 0.3s, background 0.3s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#444', fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>{exercise.muscleGroup}</span>
          {exercise.isSuperset && (
            <span style={{ background: '#1a2a1a', borderRadius: 6, padding: '2px 7px', border: '1px solid #2a4a2a', color: '#5a9a5a', fontSize: 10, fontWeight: 700 }}>⟳ SS</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {allDone && <span className="check-pop" style={{ color: '#4CAF50', fontSize: 14 }}>✓</span>}
          <span style={{ color: '#333', fontSize: 12 }}>{restLabel}</span>
        </div>
      </div>

      <p style={{ color: isActive ? '#fff' : '#ccc', fontSize: 17, fontWeight: 700, marginBottom: 12, lineHeight: '22px', transition: 'color 0.3s' }}>{exercise.name}</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={targetBadge}>
          <span style={targetLabel}>REPS</span>
          <span style={targetValue}>{exercise.targetReps}</span>
        </div>
        <div style={targetBadge}>
          <span style={targetLabel}>SÉRIES</span>
          <span style={targetValue}>{exercise.sets}</span>
        </div>
        <div style={{ ...targetBadge, background: '#0d1f0d', border: '1px solid #1a3a1a' }}>
          <span style={{ ...targetLabel, color: '#4CAF50' }}>RIR</span>
          <span style={{ ...targetValue, color: '#6dcc6d' }}>{weekData.rir.replace('RIR ', '')}</span>
        </div>
        {completedCount > 0 && (
          <div style={{ ...targetBadge, background: '#0d1f0d', border: '1px solid #1a3a1a' }}>
            <span style={{ ...targetLabel, color: '#4CAF50' }}>FAIT</span>
            <span style={{ ...targetValue, color: '#4CAF50' }}>{completedCount}/{exercise.sets}</span>
          </div>
        )}
      </div>

      {exercise.notes && (
        <button onClick={() => setNotesOpen(!notesOpen)} style={{ display: 'flex', alignItems: 'flex-start', width: '100%', background: '#0d0d0d', borderRadius: 10, padding: '8px 12px', marginBottom: 12, cursor: 'pointer', border: '1px solid #1a1a1a' }}>
          <span style={{ color: '#333', marginRight: 6, fontSize: 11 }}>{notesOpen ? '▾' : '▸'}</span>
          <span style={{ flex: 1, textAlign: 'left', color: '#555', fontSize: 12, fontStyle: 'italic', lineHeight: '17px' }}>
            {notesOpen ? exercise.notes : exercise.notes.slice(0, 70) + (exercise.notes.length > 70 ? '…' : '')}
          </span>
        </button>
      )}

      {(isActive || allDone) ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
          {setEntries.map((entry, idx) => (
            <SetRow key={idx} setNumber={idx + 1} targetReps={exercise.targetReps} defaultWeight={exercise.defaultWeight ?? ''} entry={entry} isCurrent={isActive && idx === currentSetIndex} onComplete={(e) => onSetComplete(idx, e)} />
          ))}
        </div>
      ) : (
        <div style={{ padding: '8px 0 12px', textAlign: 'center' }}>
          <span style={{ color: '#333', fontSize: 13 }}>{exercise.sets} × {exercise.targetReps}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4 }}>
        {setEntries.map((entry, idx) => (
          <div key={idx} style={{ flex: 1, height: 3, borderRadius: 2, background: entry.completed ? '#4CAF50' : (isActive && idx === currentSetIndex) ? '#3a3a3a' : '#1a1a1a', transition: 'background 0.4s ease', boxShadow: entry.completed ? '0 0 6px rgba(76,175,80,0.4)' : 'none' }} />
        ))}
      </div>
    </div>
  );
};

const targetBadge: React.CSSProperties = { flex: 1, background: '#171717', borderRadius: 10, padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: '1px solid #222' };
const targetLabel: React.CSSProperties = { color: '#444', fontSize: 9, fontWeight: 700, letterSpacing: 1 };
const targetValue: React.CSSProperties = { color: '#ccc', fontSize: 14, fontWeight: 700 };
