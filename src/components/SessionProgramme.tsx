import React from 'react';
import { WorkoutDay, WorkoutSession } from '../data/types';

interface SessionProgrammeProps {
  workout: WorkoutDay;
  session: WorkoutSession;
  onSwitchTo: (exerciseId: string) => void;
}

export const SessionProgramme: React.FC<SessionProgrammeProps> = ({ workout, session, onSwitchTo }) => {
  return (
    <div style={scrollArea}>
      <div style={inner}>
        <p style={screenTitle}>{workout.name} - Programme de la seance</p>
        {workout.exercises.map((ex, idx) => {
          const entries = session.exerciseProgress[ex.id] ?? [];
          const doneCount = entries.filter((e) => e.completed).length;
          const totalCount = Math.max(ex.sets, entries.length);
          const isDone = totalCount > 0 && doneCount >= totalCount;
          const isCurrent = idx === session.currentExerciseIndex && !isDone;
          const statusLabel = isDone ? 'Termine' : isCurrent ? 'En cours' : doneCount > 0 ? 'En cours' : 'A venir';
          const statusColor = isDone ? '#4CAF50' : isCurrent ? 'var(--brand-1)' : doneCount > 0 ? '#FF9800' : 'var(--text-dim)';
          return (
            <button
              key={ex.id}
              onClick={() => onSwitchTo(ex.id)}
              style={{
                ...row,
                borderColor: isCurrent ? 'var(--brand-1)' : 'var(--border-mid)',
                background: isCurrent ? 'var(--bg-elevated)' : 'var(--bg-card)',
              }}
            >
              <div style={rowLeft}>
                <span style={{ ...indexBadge, color: isDone ? '#4CAF50' : 'var(--text-dim)' }}>
                  {isDone ? 'OK' : idx + 1}
                </span>
                <div style={rowInfo}>
                  <p style={rowName}>{ex.name}</p>
                  <p style={rowMeta}>{ex.muscleGroup} - {doneCount}/{totalCount} series</p>
                </div>
              </div>
              <span style={{ ...statusPill, color: statusColor, borderColor: statusColor + '55' }}>
                {statusLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const scrollArea: React.CSSProperties = { flex: 1, overflowY: 'auto' };
const inner: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '16px 16px 100px' };
const screenTitle: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 12, fontWeight: 700, letterSpacing: 0.3, marginBottom: 14, textAlign: 'center' };
const row: React.CSSProperties = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, border: '1px solid var(--border-mid)', borderRadius: 16, padding: '14px 14px', marginBottom: 10, cursor: 'pointer', textAlign: 'left' };
const rowLeft: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 };
const indexBadge: React.CSSProperties = { width: 28, height: 28, borderRadius: 14, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 };
const rowInfo: React.CSSProperties = { minWidth: 0 };
const rowName: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const rowMeta: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12 };
const statusPill: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: 0.3, padding: '4px 10px', borderRadius: 20, border: '1px solid', flexShrink: 0, whiteSpace: 'nowrap' };
