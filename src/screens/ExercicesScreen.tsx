import React, { useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { ALL_EXERCISES, ALL_MUSCLE_GROUPS, getExerciseWeightHistory, getMaxWeightEver } from '../utils/training';
import { MiniLineChart } from '../components/MiniLineChart';

interface ExercicesScreenProps { onBack: () => void; }

const formatLastDate = (ts: number): string => {
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays <= 0) return "aujourd'hui";
  if (diffDays === 1) return 'hier';
  if (diffDays < 7) return `il y a ${diffDays} j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export const ExercicesScreen: React.FC<ExercicesScreenProps> = ({ onBack }) => {
  const history = useWorkoutStore((s) => s.history);
  const [openId, setOpenId] = useState<string | null>(null);

  const groups = ALL_MUSCLE_GROUPS
    .map((group) => ({ group, exercises: ALL_EXERCISES.filter((ex) => ex.muscleGroup === group) }))
    .filter((g) => g.exercises.length > 0);

  return (
    <div style={container}>
      <div style={scroll}>

        <div style={headerRow}>
          <button onClick={onBack} style={backBtn} aria-label="Retour">←</button>
          <div>
            <h1 style={title}>🏋️ Exercices</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Ta progression, exercice par exercice</p>
          </div>
        </div>

        {groups.map(({ group, exercises }) => (
          <div key={group} style={{ marginBottom: 18 }}>
            <p style={sectionLabel}>{group}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {exercises.map((ex) => {
                const isOpen = openId === ex.id;
                const max = getMaxWeightEver(history, ex.id);
                const points = getExerciseWeightHistory(history, ex.id);
                const lastPoint = points[points.length - 1];
                return (
                  <div key={ex.id} style={card}>
                    <button onClick={() => setOpenId(isOpen ? null : ex.id)} style={exRow}>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>{ex.name}</p>
                        <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>
                          {max > 0 ? `Record : ${max} kg` : 'Pas encore testé'}
                          {lastPoint ? ` · dernière fois ${formatLastDate(lastPoint.date)}` : ''}
                        </p>
                      </div>
                      <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{isOpen ? '▴' : '▾'}</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '4px 2px 2px' }}>
                        <MiniLineChart
                          points={points.map((p) => ({ date: p.date, value: p.maxWeight }))}
                          unit="kg"
                          emptyMessage="Pas encore assez de séances chiffrées sur cet exercice pour voir une courbe."
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
};

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto', background: 'var(--bg-base)' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 112px' };
const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 18,
  borderBottom: '1px solid var(--border-subtle)', marginBottom: 18,
};
const backBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12, background: 'var(--bg-elevated)',
  border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 18, flexShrink: 0,
};
const title: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 };
const sectionLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 };
const card: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14,
  border: '1px solid var(--border-mid)', overflow: 'hidden',
};
const exRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', width: '100%', padding: '12px 14px', cursor: 'pointer',
};
