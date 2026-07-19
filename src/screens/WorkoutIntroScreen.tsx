import React, { useState } from 'react';
import { getWorkout } from '../data/workouts';
import { Exercise } from '../data/types';
import { getMuscleRecoveryStatus } from '../utils/training';
import { useWorkoutStore } from '../store/workoutStore';

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

const formatRest = (seconds: number): string => {
  if (seconds === 0) return 'Enchaîné (superset)';
  if (seconds < 60) return `${seconds} s`;
  const min = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${min} min` : `${min} min ${rest} s`;
};

// Écran d'aperçu affiché avant de démarrer une séance (style "Forme" /
// Apple Fitness+) : on voit le programme du jour et on ne rentre dans le
// minuteur/les séries qu'après avoir appuyé sur Démarrer. Un tap sur un
// exercice ouvre une fiche détaillée (bottom sheet) avec toutes les infos
// utiles avant de commencer (repos, superset, poids de départ, notes).
export const WorkoutIntroScreen: React.FC<WorkoutIntroScreenProps> = ({ dayId, onBack, onStart }) => {
  const history = useWorkoutStore((s) => s.history);
  const workout = getWorkout(dayId);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);
  if (!workout) return null;

  const accent = DAY_ACCENT[dayId] ?? '#7a7a90';
  const typeLabel = DAY_TYPE_LABEL[dayId] ?? '';
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);

  // Groupes musculaires du programme du jour encore en récupération (voir
  // Objectifs → Récupération) — alerte non bloquante, juste informative.
  const dayMuscleGroups = new Set(workout.exercises.map((ex) => ex.muscleGroup));
  const unrecoveredGroups = getMuscleRecoveryStatus(history).filter(
    (s) => dayMuscleGroups.has(s.group) && s.hoursSince !== null && !s.recovered
  );

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

        {unrecoveredGroups.length > 0 && (
          <div style={recoveryWarning}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ color: '#f5a623', fontSize: 13, fontWeight: 700 }}>
                Pas totalement récupéré
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3, lineHeight: '16px' }}>
                {unrecoveredGroups.map((s, i) => (
                  <span key={s.group}>
                    {i > 0 && ', '}
                    {s.group} (encore {s.hoursRemaining >= 24 ? `${Math.round(s.hoursRemaining / 24 * 10) / 10} j` : `${s.hoursRemaining} h`})
                  </span>
                ))}
              </p>
            </div>
          </div>
        )}

        <p style={{ ...sectionLabel }}>AU PROGRAMME</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 100 }}>
          {workout.exercises.map((ex, i) => (
            <button key={ex.id} style={exerciseRow} onClick={() => setDetailExercise(ex)}>
              <span style={{ ...exerciseIndex, color: accent }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>{ex.name}</p>
                <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>{ex.muscleGroup}</p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {ex.sets} × {ex.targetReps}
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: 14, flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      </div>

      {detailExercise && (
        <div style={sheetBackdrop} onClick={() => setDetailExercise(null)}>
          <div style={sheetCard} onClick={(e) => e.stopPropagation()}>
            <div style={sheetHandle} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ color: accent, fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>{detailExercise.muscleGroup}</p>
                <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, marginTop: 4 }}>{detailExercise.name}</h2>
              </div>
              <button onClick={() => setDetailExercise(null)} style={closeBtn}>✕</button>
            </div>

            <div style={detailStatsRow}>
              <div style={detailStatItem}>
                <span style={statValue}>{detailExercise.sets}</span>
                <span style={statLabel}>SÉRIES</span>
              </div>
              <div style={{ ...detailStatItem, borderLeft: '1px solid var(--border-mid)', borderRight: '1px solid var(--border-mid)' }}>
                <span style={statValue}>{detailExercise.targetReps}</span>
                <span style={statLabel}>REPS</span>
              </div>
              <div style={detailStatItem}>
                <span style={statValue}>{formatRest(detailExercise.restSeconds)}</span>
                <span style={statLabel}>REPOS</span>
              </div>
            </div>

            {detailExercise.defaultWeight && (
              <div style={detailRow}>
                <span style={detailRowLabel}>Poids de départ</span>
                <span style={detailRowValue}>{detailExercise.defaultWeight}</span>
              </div>
            )}

            {detailExercise.isSuperset && (
              <div style={detailRow}>
                <span style={detailRowLabel}>Superset</span>
                <span style={detailRowValue}>
                  {detailExercise.supersetOrder === 1 ? 'Enchaîné avec l\'exercice suivant' : 'Repos après cette paire'}
                </span>
              </div>
            )}

            {detailExercise.notes && (
              <div style={{ marginTop: 14 }}>
                <p style={{ ...sectionLabel, marginBottom: 6 }}>NOTES</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: '20px' }}>{detailExercise.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

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
const recoveryWarning: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10,
  background: 'rgba(245, 166, 35, 0.1)', border: '1px solid rgba(245, 166, 35, 0.3)',
  borderRadius: 14, padding: '12px 14px', marginBottom: 20,
};
const exerciseRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 14, padding: '10px 14px', width: '100%', cursor: 'pointer',
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
const sheetBackdrop: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50,
};
const sheetCard: React.CSSProperties = {
  width: '100%', maxWidth: 480, background: 'var(--bg-card)',
  borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '10px 20px max(20px, env(safe-area-inset-bottom))',
  border: '1px solid var(--border-mid)', borderBottom: 'none',
  maxHeight: '75vh', overflowY: 'auto',
};
const sheetHandle: React.CSSProperties = {
  width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '4px auto 16px',
};
const closeBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 15, background: 'var(--bg-elevated)',
  color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', flexShrink: 0,
  border: '1px solid var(--border-strong)',
};
const detailStatsRow: React.CSSProperties = {
  display: 'flex', marginTop: 18, paddingTop: 14, paddingBottom: 14,
  borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)',
};
const detailStatItem: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '0 4px',
};
const detailRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14,
};
const detailRowLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 13, fontWeight: 600 };
const detailRowValue: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, textAlign: 'right' };
