import React from 'react';
import { WORKOUTS, PROGRESSION_WEEKS } from '../data/workouts';
import { useWorkoutStore } from '../store/workoutStore';

const DAY_COLORS: Record<string, string> = {
  'pull-a': '#1a4a6e', 'push-a': '#4e2a1e', 'legs-a': '#1e4a2a',
  'pull-b': '#1a3a5e', 'push-b': '#3e1e1a', 'legs-b': '#1a3e22',
};
const DAY_ACCENT: Record<string, string> = {
  'pull-a': '#4a9ade', 'push-a': '#de7a4a', 'legs-a': '#4ade7a',
  'pull-b': '#4a8ade', 'push-b': '#de5a4a', 'legs-b': '#4ace6a',
};

interface HomeScreenProps {
  onSelectDay: (dayId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectDay }) => {
  const currentWeek = useWorkoutStore((s) => s.currentWeek);
  const setCurrentWeek = useWorkoutStore((s) => s.setCurrentWeek);
  const session = useWorkoutStore((s) => s.session);

  const weekIdx = currentWeek <= 2 ? 0 : currentWeek <= 4 ? 1 : currentWeek <= 6 ? 2 : currentWeek === 7 ? 3 : 4;
  const weekData = PROGRESSION_WEEKS[weekIdx];
  const resumeWorkout = session && !session.isComplete
    ? WORKOUTS.find((w) => w.id === session.dayId)
    : null;

  return (
    <div style={container}>
      <div style={scroll}>

        {/* ── En-tête ── */}
        <div style={{ marginBottom: 24, paddingTop: 8 }}>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
            PPL Strict V10
          </h1>
          <p style={{ color: '#555', fontSize: 14, marginTop: 2 }}>Cycle glissant · 8 jours</p>
        </div>

        {/* ── Semaine courante ── */}
        <div style={weekCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: '#555', fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>SEMAINE EN COURS</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                style={weekBtn} onClick={() => setCurrentWeek(currentWeek - 1)}
                disabled={currentWeek <= 1}
              >‹</button>
              <span style={{ color: '#fff', fontWeight: 700, width: 24, textAlign: 'center' }}>S{currentWeek}</span>
              <button
                style={weekBtn} onClick={() => setCurrentWeek(currentWeek + 1)}
                disabled={currentWeek >= 8}
              >›</button>
            </div>
          </div>
          <p style={{ color: '#ddd', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{weekData.phase}</p>
          <span style={rirBadge}>{weekData.rir}</span>
          <p style={{ color: '#666', fontSize: 12, lineHeight: '17px', marginTop: 8 }}>{weekData.objective}</p>
        </div>

        {/* ── Reprise de séance ── */}
        {resumeWorkout && (
          <button style={resumeCard} onClick={() => onSelectDay(resumeWorkout.id)}>
            <span style={{ fontSize: 20, color: '#4CAF50' }}>▶</span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ color: '#4CAF50', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>SÉANCE EN COURS</p>
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{resumeWorkout.name}</p>
            </div>
          </button>
        )}

        {/* ── Séances ── */}
        <p style={{ color: '#444', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>SÉANCES</p>
        {WORKOUTS.map((workout) => (
          <button
            key={workout.id}
            style={{
              ...workoutCard,
              background: DAY_COLORS[workout.id] + '33',
            }}
            onClick={() => onSelectDay(workout.id)}
          >
            <div style={{ width: 4, alignSelf: 'stretch', background: DAY_ACCENT[workout.id], flexShrink: 0 }} />
            <div style={{ flex: 1, padding: '14px 14px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: DAY_ACCENT[workout.id], fontSize: 11, fontWeight: 700 }}>
                  Jour {workout.dayNumber}
                </span>
                <span style={{ color: '#555', fontSize: 11 }}>{workout.estimatedDuration}</span>
              </div>
              <p style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{workout.name}</p>
              <p style={{ color: '#777', fontSize: 12, marginBottom: 2 }}>{workout.muscleGroups}</p>
              <p style={{ color: '#555', fontSize: 11, fontStyle: 'italic' }}>{workout.focus}</p>
            </div>
            <span style={{ color: DAY_ACCENT[workout.id], fontSize: 26, fontWeight: 300, paddingRight: 14, flexShrink: 0 }}>›</span>
          </button>
        ))}

        {/* ── Règle superset ── */}
        <div style={ruleCard}>
          <p style={{ color: '#4a7a4a', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>⟳ Règle Superset</p>
          <p style={{ color: '#4a6a4a', fontSize: 12, lineHeight: '17px' }}>
            Enchaîne les deux exercices SS sans repos entre eux. Le minuteur démarre uniquement après la paire. Push A & B uniquement.
          </p>
        </div>

      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const container: React.CSSProperties = {
  height: '100dvh', overflowY: 'auto', background: '#0a0a0a',
};
const scroll: React.CSSProperties = {
  maxWidth: 480, margin: '0 auto', padding: '20px 20px 60px',
};
const weekCard: React.CSSProperties = {
  background: '#111', borderRadius: 16, padding: 16,
  marginBottom: 16, border: '1px solid #1e1e1e',
};
const weekBtn: React.CSSProperties = {
  color: '#aaa', fontSize: 22, fontWeight: 300, background: 'none',
  padding: '2px 6px', cursor: 'pointer',
};
const rirBadge: React.CSSProperties = {
  background: '#1a2a1a', borderRadius: 6, padding: '3px 10px',
  color: '#5a9a5a', fontSize: 12, fontWeight: 700,
};
const resumeCard: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: '#1a2a1a', borderRadius: 12, padding: 14,
  marginBottom: 16, border: '1px solid #2a4a2a',
  width: '100%', cursor: 'pointer',
};
const workoutCard: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  borderRadius: 14, marginBottom: 8, border: '1px solid #1e1e1e',
  overflow: 'hidden', width: '100%', cursor: 'pointer',
};
const ruleCard: React.CSSProperties = {
  background: '#0d1a0d', borderRadius: 12, padding: 14,
  marginTop: 8, border: '1px solid #1a2a1a',
};
