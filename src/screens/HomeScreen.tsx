import React from 'react';
import { WORKOUTS, PROGRESSION_WEEKS } from '../data/workouts';
import { useWorkoutStore } from '../store/workoutStore';

const DAY_ACCENT: Record<string, string> = {
  'pull-a': '#4a9ade', 'push-a': '#de7a4a', 'legs-a': '#4ade7a',
  'pull-b': '#4a8ade', 'push-b': '#de5a4a', 'legs-b': '#4ace6a',
};
const DAY_EMOJI: Record<string, string> = {
  'pull-a': '🔵', 'push-a': '🔴', 'legs-a': '🟢',
  'pull-b': '🔵', 'push-b': '🔴', 'legs-b': '🟢',
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

        {/* Header */}
        <div style={headerSection}>
          <div style={logoRow}>
            <span style={{ fontSize: 36, lineHeight: 1 }}>⚡</span>
            <div>
              <h1 style={titleStyle}>PPL Tracker</h1>
              <p style={subtitleStyle}>Strict V10 · Cycle 8 semaines</p>
            </div>
          </div>
        </div>

        {/* Semaine courante */}
        <div style={weekCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={sectionLabel}>SEMAINE EN COURS</span>
            <div style={weekSelectorRow}>
              <button className="week-btn" style={weekBtn} onClick={() => setCurrentWeek(currentWeek - 1)} disabled={currentWeek <= 1}>‹</button>
              <span style={weekNumber}>S{currentWeek}</span>
              <button className="week-btn" style={weekBtn} onClick={() => setCurrentWeek(currentWeek + 1)} disabled={currentWeek >= 8}>›</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={weekPhase}>{weekData.phase}</p>
              <p style={weekObjective}>{weekData.objective}</p>
            </div>
            <div style={rirBadge}>
              <span style={rirLabel}>RIR</span>
              <span style={rirValue}>{weekData.rir.replace('RIR ', '')}</span>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i + 1 < currentWeek ? '#4CAF50' : i + 1 === currentWeek ? '#fff' : '#2a2a2a', transform: i + 1 === currentWeek ? 'scaleY(1.5)' : 'scaleY(1)', transition: 'background 0.3s, transform 0.3s' }} />
            ))}
          </div>
        </div>

        {resumeWorkout && (
          <button className="resume-btn" style={resumeCard} onClick={() => onSelectDay(resumeWorkout.id)}>
            <div style={{ width: 36, height: 36, background: '#4CAF50', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, flexShrink: 0 }}>▶</div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <p style={{ color: '#4CAF50', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>SÉANCE EN COURS</p>
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{resumeWorkout.name}</p>
            </div>
            <span style={{ color: '#4CAF50', fontSize: 22 }}>›</span>
          </button>
        )}

        <p style={sectionLabel}>SÉANCES</p>
        <div style={{ marginTop: 10 }}>
          {WORKOUTS.map((workout, idx) => {
            const accent = DAY_ACCENT[workout.id];
            const emoji = DAY_EMOJI[workout.id];
            return (
              <button key={workout.id} className="workout-card slide-up" style={{ ...workoutCard, borderColor: `${accent}22`, animationDelay: `${idx * 0.06}s` }} onClick={() => onSelectDay(workout.id)}>
                <div style={{ width: 3, alignSelf: 'stretch', background: `linear-gradient(to bottom, ${accent}, ${accent}44)`, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '14px 14px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ color: accent, fontSize: 11, fontWeight: 700 }}>{emoji} Jour {workout.dayNumber}</span>
                    <span style={{ color: '#444', fontSize: 11 }}>{workout.estimatedDuration}</span>
                  </div>
                  <p style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 3, letterSpacing: -0.3 }}>{workout.name}</p>
                  <p style={{ color: '#666', fontSize: 12, marginBottom: 2 }}>{workout.muscleGroups}</p>
                  <p style={{ color: '#444', fontSize: 11, fontStyle: 'italic' }}>{workout.focus}</p>
                </div>
                <span style={{ color: accent, fontSize: 24, fontWeight: 200, paddingRight: 14, flexShrink: 0, opacity: 0.7 }}>›</span>
              </button>
            );
          })}
        </div>

        <div style={{ background: '#0d1a0d', borderRadius: 14, padding: 14, marginTop: 8, border: '1px solid #1a2a1a' }}>
          <p style={{ color: '#4a7a4a', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>⟳ Règle Superset</p>
          <p style={{ color: '#3a5a3a', fontSize: 12, lineHeight: '17px' }}>Enchaîne les deux exercices SS sans repos entre eux. Le minuteur démarre uniquement après la paire. Push A &amp; B uniquement.</p>
        </div>

      </div>
    </div>
  );
};

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto', background: '#0a0a0a' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 80px' };
const headerSection: React.CSSProperties = { paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 20, borderBottom: '1px solid #141414', marginBottom: 20 };
const logoRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14 };
const titleStyle: React.CSSProperties = { fontSize: 26, fontWeight: 800, letterSpacing: -0.5, background: 'linear-gradient(135deg, #fff 30%, #4CAF50)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' };
const subtitleStyle: React.CSSProperties = { color: '#555', fontSize: 12, marginTop: 2 };
const sectionLabel: React.CSSProperties = { color: '#444', fontSize: 10, fontWeight: 700, letterSpacing: 2 };
const weekCard: React.CSSProperties = { background: 'linear-gradient(135deg, #141414, #111)', borderRadius: 18, padding: 18, marginBottom: 16, border: '1px solid #1e1e1e' };
const weekSelectorRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: '#1a1a1a', borderRadius: 10, padding: '4px 8px' };
const weekBtn: React.CSSProperties = { color: '#666', fontSize: 20, fontWeight: 300, padding: '0 4px', borderRadius: 6 };
const weekNumber: React.CSSProperties = { color: '#fff', fontWeight: 800, fontSize: 14, width: 26, textAlign: 'center' };
const weekPhase: React.CSSProperties = { color: '#eee', fontSize: 16, fontWeight: 700, marginBottom: 4 };
const weekObjective: React.CSSProperties = { color: '#666', fontSize: 12, lineHeight: '17px' };
const rirBadge: React.CSSProperties = { background: '#0d1f0d', borderRadius: 12, padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, border: '1px solid #1a3a1a', flexShrink: 0 };
const rirLabel: React.CSSProperties = { color: '#4CAF50', fontSize: 9, fontWeight: 700, letterSpacing: 1.5 };
const rirValue: React.CSSProperties = { color: '#6dcc6d', fontSize: 16, fontWeight: 800 };
const resumeCard: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg, #0d1f0d, #0a170a)', borderRadius: 16, padding: '14px 16px', marginBottom: 20, marginTop: 4, border: '1px solid #2a4a2a', width: '100%', cursor: 'pointer' };
const workoutCard: React.CSSProperties = { display: 'flex', alignItems: 'center', borderRadius: 16, marginBottom: 8, border: '1px solid #1e1e1e', overflow: 'hidden', width: '100%', cursor: 'pointer', background: '#0f0f0f' };
