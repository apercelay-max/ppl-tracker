import React from 'react';
import { getWorkout } from '../data/workouts';

interface WorkoutIntroScreenProps {
  dayId: string;
  onBack: () => void;
  onStart: () => void;
}

const DAY_ACCENT: Record<string, string> = {
  'pull-a': '#7c6fcd', 'push-a': '#e03030', 'legs-a': '#e8a020',
  'pull-b': '#6a5fc0', 'push-b': '#cc2828', 'legs-b': '#d09018',
};
const DAY_TYPE_LABEL: Record<string, string> = {
  'pull-a': 'PULL', 'push-a': 'PUSH', 'legs-a': 'LEGS',
  'pull-b': 'PULL', 'push-b': 'PUSH', 'legs-b': 'LEGS',
};

// Écran d'aperçu affiché avant de démarrer une séance (style "Forme" /
// Apple Fitness+) : on voit le programme du jour et on ne rentre dans le
// minuteur/les séries qu'après avoir appuyé sur Démarrer.
export const WorkoutIntroScreen: React.FC<WorkoutIntroScreenProps> = ({ dayId, onBack, onStart }) => {
  const workout = getWorkout(dayId);
  if (!workout) return null;

  const accent = DAY_ACCENT[dayId] ?? '#7a7a90';
  const typeLabel = DAY_TYPE_LABEL[dayId] ?? '';
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);

  return (
    <div style={container}>
      <div style={scroll}>
        <div style={headerRow}>
          <button onClick={onBack} style={backBtn}>←</button>
          <span style={{ ...typeBadge, background: `${accent}20`, color: accent }}>{typeLabel} · J{workout.dayNumber}</span>
        </div>

        <div style={{ ...heroCard, borderColor: `${accent}40` }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>{workout.name}</h1>
          <p style={{ color: accent, fontSize: 13, fontWeight: 700, marginTop: 4 }}>{workout.focus}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 10 }}>{workout.muscleGroups}</p>
          <div style={statsRow}>
            <div style={statItem}>
              <span style={statValue}>{workout.exercises.length}</span>
              <span style={statLabel}>EXERCICES</span>
            </div>
            <div style={{ ...statItem, borderLeft: '1px solid var(--border-mid)', borderRight: '1px solid var(--border-mid)' }}>
              <span style={statValue}>{totalSets}</span>
              <span style={statLabel}>SÉRIES</span>
            </div>
            <div style={statItem}>
              <span style={statValue}>{workout.estimatedDuration.replace('≈ ', '')}</span>
              <span style={statLabel}>DURÉE</span>
            </div>
          </div>
        </div>

        <p style={{ ...sectionLabel }}>AU PROGRAMME</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 100 }}>
          {workout.exercises.map((ex, i) => (
            <div key={ex.id} style={exerciseRow}>
              <span style={{ ...exerciseIndex, color: accent }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>{ex.name}</p>
                <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>{ex.muscleGroup}</p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {ex.sets} × {ex.targetReps}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={startBar}>
        <button onClick={onStart} style={{ ...startBtn, background: `linear-gradient(135deg, ${accent}, var(--brand-2))` }}>
          Démarrer
        </button>
      </div>
    </div>
  );
};

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto', background: 'var(--bg-base)', position: 'relative' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px' };
const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 16,
};
const backBtn: React.CSSProperties = {
  width: 36, height: 36, background: 'var(--bg-elevated)', borderRadius: 'var(--icon-radius)',
  color: 'var(--text-muted)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, border: '1px solid var(--border-strong)',
};
const typeBadge: React.CSSProperties = {
  fontSize: 11, fontWeight: 800, letterSpacing: 1, padding: '6px 12px', borderRadius: 20,
};
const heroCard: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 20, padding: 20, marginBottom: 24,
  border: '1px solid var(--border-mid)',
};
const statsRow: React.CSSProperties = {
  display: 'flex', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-subtle)',
};
const statItem: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '0 4px',
};
const statValue: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 17, fontWeight: 800 };
const statLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 8, fontWeight: 700, letterSpacing: 1 };
const sectionLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 };
const exerciseRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 14, padding: '10px 14px',
};
const exerciseIndex: React.CSSProperties = { fontSize: 13, fontWeight: 800, width: 16, flexShrink: 0 };
const startBar: React.CSSProperties = {
  position: 'fixed', bottom: 0, left: 0, right: 0,
  padding: '14px 16px max(14px, env(safe-area-inset-bottom))',
  background: 'linear-gradient(to top, var(--bg-base) 60%, transparent)',
};
const startBtn: React.CSSProperties = {
  width: '100%', maxWidth: 480, margin: '0 auto', display: 'block',
  padding: '16px', borderRadius: 18, color: '#fff', fontSize: 16, fontWeight: 800,
  cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
};
