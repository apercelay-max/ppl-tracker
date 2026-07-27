import React, { useState } from 'react';
import { WorkoutDay, WorkoutSession } from '../data/types';

interface SessionProgrammeProps {
  workout: WorkoutDay;
  session: WorkoutSession;
  onSwitchTo: (exerciseId: string) => void;
  onToggleSupersetRest: (groupId: string, disabled: boolean) => void;
  onSetNameOverride: (exerciseId: string, name: string | null) => void;
}

export const SessionProgramme: React.FC<SessionProgrammeProps> = ({
  workout, session, onSwitchTo, onToggleSupersetRest, onSetNameOverride,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const overrides = session.exerciseNameOverrides ?? {};
  const disabledGroups = session.disabledSupersetGroupIds ?? [];

  const startEdit = (exerciseId: string, current: string) => {
    setEditingId(exerciseId);
    setDraft(current);
  };

  const confirmEdit = (exerciseId: string) => {
    onSetNameOverride(exerciseId, draft.trim().length > 0 ? draft.trim() : null);
    setEditingId(null);
    setDraft('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft('');
  };

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
          const overrideName = overrides[ex.id];
          const displayName = overrideName ?? ex.name;
          const groupDisabled = ex.supersetGroupId ? disabledGroups.includes(ex.supersetGroupId) : false;
          const isEditing = editingId === ex.id;
          return (
            <div key={ex.id} style={rowWrap}>
              <button
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
                    <p style={rowName}>
                      {displayName}
                      {overrideName && <span style={substTag}> (remplace {ex.name})</span>}
                    </p>
                    <p style={rowMeta}>{ex.muscleGroup} - {doneCount}/{totalCount} series</p>
                  </div>
                </div>
                <span style={{ ...statusPill, color: statusColor, borderColor: statusColor + '55' }}>
                  {statusLabel}
                </span>
              </button>
              {ex.isSuperset && (
                <div style={ssControls}>
                  {ex.supersetOrder === 1 && ex.supersetGroupId && (
                    <button
                      onClick={() => onToggleSupersetRest(ex.supersetGroupId as string, !groupDisabled)}
                      style={{ ...ssBtn, color: groupDisabled ? '#FF9800' : 'var(--text-muted)' }}
                    >
                      {groupDisabled ? '⟳ Repos ajoute - remettre le superset' : '⏸ Machine occupee - ajouter du repos'}
                    </button>
                  )}
                  {!isEditing && (
                    <button onClick={() => startEdit(ex.id, overrideName ?? '')} style={ssBtn}>
                      {overrideName ? 'Modifier le remplacant' : 'Remplacer cet exercice'}
                    </button>
                  )}
                  {overrideName && !isEditing && (
                    <button onClick={() => onSetNameOverride(ex.id, null)} style={{ ...ssBtn, color: 'var(--text-dim)' }}>
                      Annuler le remplacement
                    </button>
                  )}
                  {isEditing && (
                    <div style={editRow}>
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder='Exercice de remplacement'
                        style={editInput}
                        autoFocus
                      />
                      <button onClick={() => confirmEdit(ex.id)} style={editConfirmBtn}>OK</button>
                      <button onClick={cancelEdit} style={editCancelBtn}>Annuler</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const scrollArea: React.CSSProperties = { flex: 1, overflowY: 'auto' };
const inner: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '16px 16px 100px' };
const screenTitle: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 12, fontWeight: 700, letterSpacing: 0.3, marginBottom: 14, textAlign: 'center' };
const rowWrap: React.CSSProperties = { marginBottom: 10 };
const row: React.CSSProperties = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, border: '1px solid var(--border-mid)', borderRadius: 16, padding: '14px 14px', cursor: 'pointer', textAlign: 'left' };
const rowLeft: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 };
const indexBadge: React.CSSProperties = { width: 28, height: 28, borderRadius: 14, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 };
const rowInfo: React.CSSProperties = { minWidth: 0 };
const rowName: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const substTag: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, fontWeight: 500 };
const rowMeta: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12 };
const statusPill: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: 0.3, padding: '4px 10px', borderRadius: 20, border: '1px solid', flexShrink: 0, whiteSpace: 'nowrap' };
const ssControls: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, paddingLeft: 4 };
const ssBtn: React.CSSProperties = { background: 'var(--bg-elevated)', border: '1px dashed var(--border-strong)', borderRadius: 10, padding: '6px 10px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer' };
const editRow: React.CSSProperties = { display: 'flex', gap: 6, width: '100%', marginTop: 2, alignItems: 'center' };
const editInput: React.CSSProperties = { flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 13 };
const editConfirmBtn: React.CSSProperties = { background: 'var(--brand-1)', border: '1px solid transparent', borderRadius: 10, padding: '8px 12px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const editCancelBtn: React.CSSProperties = { background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '8px 12px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
