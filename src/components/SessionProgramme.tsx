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
  const [modalExerciseId, setModalExerciseId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const overrides = session.exerciseNameOverrides ?? {};
  const disabledGroups = session.disabledSupersetGroupIds ?? [];

  const modalExercise = workout.exercises.find((e) => e.id === modalExerciseId) ?? null;
  const modalGroupDisabled = modalExercise?.supersetGroupId
    ? disabledGroups.includes(modalExercise.supersetGroupId)
    : false;

  const openModal = (exerciseId: string) => {
    setModalExerciseId(exerciseId);
    setDraft(overrides[exerciseId] ?? '');
  };

  const closeModal = () => {
    setModalExerciseId(null);
    setDraft('');
  };

  const saveDraft = () => {
    if (!modalExerciseId) return;
    onSetNameOverride(modalExerciseId, draft.trim() ? draft.trim() : null);
    closeModal();
  };

  const resetOverride = () => {
    if (!modalExerciseId) return;
    onSetNameOverride(modalExerciseId, null);
    closeModal();
  };

  const goToExercise = () => {
    if (!modalExerciseId) return;
    onSwitchTo(modalExerciseId);
    closeModal();
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
          return (
            <div key={ex.id} style={rowWrap}>
              <button
                onClick={() => openModal(ex.id)}
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
                    <p style={rowMeta}>
                      {ex.muscleGroup} - {doneCount}/{totalCount} series
                      {groupDisabled && ' - Repos ajoute'}
                    </p>
                  </div>
                </div>
                <span style={{ ...statusPill, color: statusColor, borderColor: statusColor + '55' }}>
                  {statusLabel}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {modalExercise && (
        <div style={modalBackdrop} onClick={closeModal}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <p style={modalTitle}>{modalExercise.name}</p>
            <p style={modalMeta}>{modalExercise.muscleGroup}</p>

            <label style={modalLabel}>Nom pour cette seance</label>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={modalExercise.name}
              style={modalInput}
              autoFocus
            />

            <div style={modalBtnRow}>
              {overrides[modalExercise.id] && (
                <button onClick={resetOverride} style={modalSecondaryBtn}>Reinitialiser</button>
              )}
              <button onClick={saveDraft} style={modalPrimaryBtn}>Enregistrer</button>
            </div>

            {modalExercise.isSuperset && modalExercise.supersetOrder === 1 && modalExercise.supersetGroupId && (
              <button
                onClick={() => onToggleSupersetRest(modalExercise.supersetGroupId as string, !modalGroupDisabled)}
                style={{ ...modalToggleBtn, color: modalGroupDisabled ? '#FF9800' : 'var(--text-muted)' }}
              >
                {modalGroupDisabled ? 'Repos ajoute - remettre le superset' : 'Machine occupee - ajouter du repos'}
              </button>
            )}

            <button onClick={goToExercise} style={modalGoBtn}>Aller a cet exercice</button>
            <button onClick={closeModal} style={modalCloseBtn}>Fermer</button>
          </div>
        </div>
      )}
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

const modalBackdrop: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 };
const modalCard: React.CSSProperties = { width: '100%', maxWidth: 480, background: 'var(--bg-card)', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: '20px 18px 28px', display: 'flex', flexDirection: 'column', gap: 10 };
const modalTitle: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 17, fontWeight: 800 };
const modalMeta: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12, marginTop: -6, marginBottom: 4 };
const modalLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, letterSpacing: 0.3, marginTop: 4 };
const modalInput: React.CSSProperties = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '12px 14px', color: 'var(--text-primary)', fontSize: 15, boxSizing: 'border-box' };
const modalBtnRow: React.CSSProperties = { display: 'flex', gap: 8 };
const modalPrimaryBtn: React.CSSProperties = { flex: 1, background: 'var(--brand-1)', border: '1px solid transparent', borderRadius: 12, padding: '12px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const modalSecondaryBtn: React.CSSProperties = { flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '12px', color: 'var(--text-muted)', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const modalToggleBtn: React.CSSProperties = { background: 'var(--bg-elevated)', border: '1px dashed var(--border-strong)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center' };
const modalGoBtn: React.CSSProperties = { background: 'transparent', border: '1px solid var(--border-mid)', borderRadius: 12, padding: '12px', color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 };
const modalCloseBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px', textAlign: 'center' };
