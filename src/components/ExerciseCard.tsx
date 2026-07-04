import React, { useState } from 'react';
import { Exercise, SetEntry } from '../data/types';
import { PROGRESSION_WEEKS } from '../data/workouts';
import { SetRow } from './SetRow';
import { ExerciseAnimation } from './ExerciseAnimation';
import { useWorkoutStore } from '../store/workoutStore';
import { ICON_SIZE_PRESETS } from '../data/iconPrefs';
import { getLastExerciseSets } from '../utils/training';

interface ExerciseCardProps {
  exercise: Exercise;
  setEntries: SetEntry[];
  currentSetIndex: number;
  isActive: boolean;
  currentWeek: number;
  onSetComplete: (setIndex: number, entry: SetEntry) => void;
  onEditSet?: (setIndex: number) => void;
  onSkipSet?: () => void;
  onSkipExercise?: () => void;
  onAddSet?: () => void;
  restBar?: React.ReactNode;
  restBarIndex?: number;
}

const formatRest = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise, setEntries, currentSetIndex, isActive, currentWeek, onSetComplete,
  onEditSet, onSkipSet, onSkipExercise, onAddSet, restBar, restBarIndex,
}) => {
  const [notesOpen, setNotesOpen] = useState(false);
  const iconSize = useWorkoutStore((s) => s.iconSize);
  const animSize = ICON_SIZE_PRESETS[iconSize].anim;
  const customRestSeconds = useWorkoutStore((s) => s.customRestSeconds);
  const history = useWorkoutStore((s) => s.history);
  const lastTimeSets = getLastExerciseSets(history, exercise.id);

  const weekIdx = currentWeek <= 2 ? 0 : currentWeek <= 4 ? 1 : currentWeek <= 6 ? 2 : currentWeek === 7 ? 3 : 4;
  const weekData = PROGRESSION_WEEKS[weekIdx];
  const completedCount = setEntries.filter((s) => s.completed).length;
  const totalSets = setEntries.length;
  const allDone = completedCount === totalSets && totalSets > 0;

  const effectiveRest = customRestSeconds[exercise.id] ?? exercise.restSeconds;
  const restLabel =
    exercise.restMode === 'superset' && exercise.supersetOrder === 1
      ? '↪ enchaîné'
      : exercise.restMode === 'bilateral'
      ? `${exercise.bilateralRestSeconds}s / ${exercise.restSeconds}s`
      : formatRest(effectiveRest);

  return (
    <div
      className={isActive ? 'exercise-active' : ''}
      style={{
        background: isActive ? 'var(--bg-card)' : 'var(--bg-surface)',
        borderRadius: 20, padding: '16px 14px', marginBottom: 10,
        border: isActive
          ? '1px solid rgba(var(--brand-1-rgb),0.4)'
          : allDone
          ? '1px solid #1e2a1e'
          : '1px solid var(--border)',
        opacity: allDone && !isActive ? 0.55 : 1,
        transition: 'border-color 0.3s, opacity 0.3s, background 0.3s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {exercise.muscleGroup}
          </span>
          {exercise.isSuperset && (
            <span style={{ background: 'rgba(224,48,48,0.12)', borderRadius: 6, padding: '2px 7px', border: '1px solid rgba(224,48,48,0.2)', color: '#e03030', fontSize: 10, fontWeight: 700 }}>⟳ SS</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {allDone && <span style={{ color: '#4CAF50', fontSize: 14 }} className="check-pop">✓</span>}
          <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{restLabel}</span>
        </div>
      </div>

      {/* Nom + Animation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <ExerciseAnimation exerciseId={exercise.id} size={animSize} />
        <p style={{
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontSize: 18, fontWeight: 800, lineHeight: '22px', letterSpacing: -0.3,
          transition: 'color 0.3s', margin: 0,
        }}>{exercise.name}</p>
      </div>

      {/* Badges cibles */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={targetBadge}>
          <span style={targetLabel}>REPS</span>
          <span style={targetValue}>{exercise.targetReps}</span>
        </div>
        <div style={targetBadge}>
          <span style={targetLabel}>SÉRIES</span>
          <span style={targetValue}>{totalSets}</span>
        </div>
        <div style={{ ...targetBadge, background: 'var(--bg-green-tint)', border: '1px solid var(--border-green-tint)' }}>
          <span style={{ ...targetLabel, color: '#3a8a3a' }}>RIR</span>
          <span style={{ ...targetValue, color: '#5dcc5d' }}>{weekData.rir.replace('RIR ', '')}</span>
        </div>
        {completedCount > 0 && (
          <div style={{
            ...targetBadge,
            background: allDone ? 'var(--bg-green-tint)' : 'var(--bg-gold-tint)',
            border: allDone ? '1px solid var(--border-green-tint)' : '1px solid var(--border-gold-tint)',
          }}>
            <span style={{ ...targetLabel, color: allDone ? '#3a8a3a' : '#a07030' }}>FAIT</span>
            <span style={{ ...targetValue, color: allDone ? '#4CAF50' : '#f5a623' }}>{completedCount}/{totalSets}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {exercise.notes && (
        <button onClick={() => setNotesOpen(!notesOpen)} style={{
          display: 'flex', alignItems: 'flex-start', width: '100%',
          background: 'var(--bg-base)', borderRadius: 10, padding: '8px 12px', marginBottom: 12,
          cursor: 'pointer', border: '1px solid var(--border)',
        }}>
          <span style={{ color: 'var(--text-dim)', marginRight: 6, fontSize: 11 }}>{notesOpen ? '▾' : '▸'}</span>
          <span style={{ flex: 1, textAlign: 'left', color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic', lineHeight: '17px' }}>
            {notesOpen ? exercise.notes : exercise.notes.slice(0, 70) + (exercise.notes.length > 70 ? '…' : '')}
          </span>
        </button>
      )}

      {/* Séries */}
      {(isActive || allDone) ? (
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
          {setEntries.map((entry, idx) => (
            <React.Fragment key={idx}>
              {restBarIndex === idx && restBar}
              <SetRow
                setNumber={idx + 1}
                targetReps={exercise.targetReps}
                defaultWeight={exercise.defaultWeight ?? ''}
                entry={entry}
                isCurrent={isActive && idx === currentSetIndex}
                onComplete={(e) => onSetComplete(idx, e)}
                onEdit={onEditSet ? () => onEditSet(idx) : undefined}
                lastTime={lastTimeSets?.[idx]}
              />
            </React.Fragment>
          ))}
          {restBarIndex === setEntries.length && restBar}
        </div>
      ) : (
        <div style={{ padding: '8px 0 12px', textAlign: 'center' }}>
          <span style={{ color: 'var(--text-micro)', fontSize: 13 }}>{totalSets} × {exercise.targetReps}</span>
        </div>
      )}

      {/* Actions skip/add — seulement si exercice actif */}
      {isActive && !allDone && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {onSkipSet && (
            <button onClick={onSkipSet} style={actionBtn}>⏭ Passer série</button>
          )}
          {onSkipExercise && (
            <button onClick={onSkipExercise} style={{ ...actionBtn, color: '#b84040' }}>⏩ Passer exercice</button>
          )}
          {onAddSet && (
            <button onClick={onAddSet} style={{ ...actionBtn, color: '#4CAF50' }}>＋ Série</button>
          )}
        </div>
      )}

      {/* Barre de progression */}
      <div style={{ display: 'flex', gap: 4 }}>
        {setEntries.map((entry, idx) => (
          <div key={idx} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: entry.completed ? (entry.reps === '—' ? '#555' : '#4CAF50') : (isActive && idx === currentSetIndex) ? '#3a1818' : 'var(--bg-elevated)',
            transition: 'background 0.4s ease',
            boxShadow: entry.completed && entry.reps !== '—' ? '0 0 6px rgba(76,175,80,0.35)' : 'none',
          }} />
        ))}
      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const targetBadge: React.CSSProperties = { flex: 1, background: 'var(--bg-higher)', borderRadius: 10, padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: '1px solid var(--border-strong)' };
const targetLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 9, fontWeight: 700, letterSpacing: 1 };
const targetValue: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 };
const actionBtn: React.CSSProperties = {
  flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  borderRadius: 10, padding: '8px 4px', color: 'var(--text-muted)',
  fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.2,
};
