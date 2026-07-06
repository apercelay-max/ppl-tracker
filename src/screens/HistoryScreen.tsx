import React from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { getWorkout } from '../data/workouts';
import { computeTonnage } from '../utils/training';

interface HistoryScreenProps { onBack: () => void; }

const DAY_ACCENT: Record<string, string> = {
  'pull-a': '#7c6fcd', 'push-a': '#e03030', 'legs-a': '#e8a020',
  'pull-b': '#6a5fc0', 'push-b': '#cc2828', 'legs-b': '#d09018',
};
const DAY_TYPE_LABEL: Record<string, string> = {
  'pull-a': 'PULL', 'push-a': 'PUSH', 'legs-a': 'LEGS',
  'pull-b': 'PULL', 'push-b': 'PUSH', 'legs-b': 'LEGS',
};

const formatDate = (ts: number): string => {
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

// L'historique est déjà stocké du plus récent au plus ancien (voir
// finishSession dans workoutStore.ts) — pas besoin de re-trier ici.
export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const history = useWorkoutStore((s) => s.history);

  return (
    <div style={container}>
      <div style={scroll}>

        <div style={headerRow}>
          <button onClick={onBack} style={backBtn} aria-label="Retour">←</button>
          <div>
            <h1 style={title}>🗓️ Historique</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{history.length} séance{history.length > 1 ? 's' : ''} enregistrée{history.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div style={card}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: '18px', textAlign: 'center' }}>
              Pas encore de séance terminée. Ton journal d'entraînement apparaîtra ici au fil du temps.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((entry) => {
              const workout = getWorkout(entry.dayId);
              const accent = DAY_ACCENT[entry.dayId] ?? 'var(--brand-1)';
              const tonnage = entry.tonnage ?? computeTonnage(entry.exerciseProgress);
              const minutes = Math.round(entry.durationMs / 60000);
              return (
                <div key={entry.id} style={{ ...row, borderLeft: `3px solid ${accent}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ color: accent, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{DAY_TYPE_LABEL[entry.dayId] ?? ''}</p>
                      <p style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 800, marginTop: 2 }}>{workout?.name ?? entry.dayId}</p>
                    </div>
                    <p style={{ color: 'var(--text-dim)', fontSize: 11, whiteSpace: 'nowrap' }}>{formatDate(entry.date)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={statChip}>⏱ {minutes} min</span>
                    <span style={statChip}>🏋️ {Math.round(tonnage)} kg</span>
                    {entry.rpe && <span style={statChip}>💥 RPE {entry.rpe}</span>}
                  </div>
                  {entry.note && (
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8, lineHeight: '17px', fontStyle: 'italic' }}>
                      "{entry.note}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
const card: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14, padding: 20,
  border: '1px solid var(--border-mid)',
};
const row: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14, padding: 14,
  border: '1px solid var(--border-mid)',
};
const statChip: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 11.5, fontWeight: 600,
};
