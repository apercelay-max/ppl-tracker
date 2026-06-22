import React from 'react';
import { WORKOUTS, PROGRESSION_WEEKS } from '../data/workouts';
import { useWorkoutStore } from '../store/workoutStore';

const DAY_ACCENT: Record<string, string> = {
  'pull-a': '#7c6fcd', 'push-a': '#e03030', 'legs-a': '#e8a020',
  'pull-b': '#6a5fc0', 'push-b': '#cc2828', 'legs-b': '#d09018',
};
const DAY_TYPE_LABEL: Record<string, string> = {
  'pull-a': 'PULL', 'push-a': 'PUSH', 'legs-a': 'LEGS',
  'pull-b': 'PULL', 'push-b': 'PUSH', 'legs-b': 'LEGS',
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
  const resumeWorkout = session && !session.isComplete ? WORKOUTS.find((w) => w.id === session.dayId) : null;
  const cycleProgress = ((currentWeek - 1) / 7) * 100;

  return (
    <div style={container}>
      <div style={scroll}>

        <div style={headerSection}>
          <div style={logoRow}>
            <div style={logoBadge}><span style={{ fontSize: 22, lineHeight: 1 }}>⚡</span></div>
            <div>
              <h1 style={titleStyle}>PPL Tracker</h1>
              <p style={subtitleStyle}>Strict V10 · Hypertrophie</p>
            </div>
          </div>
        </div>

        <div style={weekCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={sectionLabel}>CYCLE EN COURS</p>
              <p style={weekPhase}>{weekData.phase}</p>
            </div>
            <div style={weekSelectorRow}>
              <button className="week-btn" style={weekBtn} onClick={() => setCurrentWeek(currentWeek - 1)} disabled={currentWeek <= 1}>‹</button>
              <div style={weekNumberBox}>
                <span style={{ color: '#555', fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>SEM.</span>
                <span style={weekNumber}>{currentWeek}</span>
              </div>
              <button className="week-btn" style={weekBtn} onClick={() => setCurrentWeek(currentWeek + 1)} disabled={currentWeek >= 8}>›</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={weekMetric}>
              <span style={weekMetricLabel}>RIR</span>
              <span style={{ ...weekMetricValue, color: '#4CAF50' }}>{weekData.rir.replace('RIR ', '')}</span>
            </div>
            <div style={weekMetric}>
              <span style={weekMetricLabel}>REPOS</span>
              <span style={{ ...weekMetricValue, color: '#e03030' }}>3:00</span>
            </div>
            <div style={{ ...weekMetric, flex: 2 }}>
              <span style={weekMetricLabel}>OBJECTIF</span>
              <span style={{ color: '#888', fontSize: 11, lineHeight: '14px' }}>{weekData.objective}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 6 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{
                flex: 1, height: i + 1 === currentWeek ? 6 : 4, borderRadius: 3,
                background: i + 1 < currentWeek ? '#e03030' : i + 1 === currentWeek ? '#ffffff' : '#242428',
                transition: 'background 0.3s, height 0.3s',
                boxShadow: i + 1 < currentWeek ? '0 0 6px rgba(224,48,48,0.4)' : 'none',
              }} />
            ))}
          </div>
          <p style={{ color: '#333', fontSize: 10 }}>Semaine {currentWeek} / 8 · {Math.round(cycleProgress)}% du cycle</p>
        </div>

        {resumeWorkout && (
          <button className="resume-btn" style={resumeCard} onClick={() => onSelectDay(resumeWorkout.id)}>
            <div style={resumeIcon}><span style={{ fontSize: 16 }}>▶</span></div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <p style={{ color: '#e03030', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>SÉANCE EN COURS</p>
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>{resumeWorkout.name}</p>
              <p style={{ color: '#555', fontSize: 11, marginTop: 2 }}>Appuie pour reprendre</p>
            </div>
            <span style={{ color: '#e03030', fontSize: 22, fontWeight: 200, flexShrink: 0, opacity: 0.8 }}>›</span>
          </button>
        )}

        <p style={{ ...sectionLabel, marginBottom: 10 }}>SÉANCES</p>
        <div>
          {WORKOUTS.map((workout, idx) => {
            const accent = DAY_ACCENT[workout.id];
            const typeLabel = DAY_TYPE_LABEL[workout.id];
            return (
              <button key={workout.id} className="workout-card slide-up"
                style={{ ...workoutCard, animationDelay: `${idx * 0.06}s` }}
                onClick={() => onSelectDay(workout.id)}
              >
                <div style={{
                  width: 48, alignSelf: 'stretch', flexShrink: 0,
                  background: `${accent}15`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                  borderRight: `1px solid ${accent}22`,
                }}>
                  <span style={{ color: accent, fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>{typeLabel}</span>
                  <span style={{ color: `${accent}60`, fontSize: 11, fontWeight: 700 }}>J{workout.dayNumber}</span>
                </div>
                <div style={{ flex: 1, padding: '14px 14px', textAlign: 'left' }}>
                  <p style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 3, letterSpacing: -0.3 }}>{workout.name}</p>
                  <p style={{ color: '#555', fontSize: 12, marginBottom: 2 }}>{workout.muscleGroups}</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                    <span style={{ background: `${accent}15`, border: `1px solid ${accent}25`, borderRadius: 6, padding: '2px 8px', color: accent, fontSize: 10, fontWeight: 700 }}>
                      {workout.exercises.length} exercices
                    </span>
                    <span style={{ color: '#3a3a44', fontSize: 11 }}>{workout.estimatedDuration}</span>
                  </div>
                </div>
                <span style={{ color: accent, fontSize: 22, fontWeight: 200, paddingRight: 14, flexShrink: 0, opacity: 0.6 }}>›</span>
              </button>
            );
          })}
        </div>

        <div style={nutritionCard}>
          <p style={{ color: '#7a5a1a', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>🥩 Nutrition post-training</p>
          <p style={{ color: '#4a3a10', fontSize: 12, lineHeight: '18px' }}>
            Dans les <strong style={{ color: '#a07030' }}>30 min</strong> après la séance : 30-40g protéines · 50-80g glucides.
          </p>
        </div>

        <div style={{ background: '#0f100d', borderRadius: 14, padding: 14, marginTop: 8, border: '1px solid #1a1e18' }}>
          <p style={{ color: '#3a5a3a', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>⟳ Règle Superset</p>
          <p style={{ color: '#2a3a2a', fontSize: 12, lineHeight: '17px' }}>
            Enchaîne les deux exercices SS sans repos. Le minuteur de 3 min démarre après la paire. Push A & B uniquement.
          </p>
        </div>

      </div>
    </div>
  );
};

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto', background: '#0d0d0f' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 80px' };
const headerSection: React.CSSProperties = { paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 18, borderBottom: '1px solid #161618', marginBottom: 18 };
const logoRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14 };
const logoBadge: React.CSSProperties = { width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #e03030, #9b27af)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(224,48,48,0.3)' };
const titleStyle: React.CSSProperties = { fontSize: 24, fontWeight: 800, letterSpacing: -0.5, background: 'linear-gradient(135deg, #ffffff 30%, #e03030 70%, #9b27af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' };
const subtitleStyle: React.CSSProperties = { color: '#444450', fontSize: 12, marginTop: 2 };
const sectionLabel: React.CSSProperties = { color: '#333340', fontSize: 10, fontWeight: 700, letterSpacing: 2 };
const weekCard: React.CSSProperties = { background: 'linear-gradient(135deg, #161618, #111113)', borderRadius: 20, padding: 18, marginBottom: 16, border: '1px solid #222228' };
const weekSelectorRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 4, background: '#18181b', borderRadius: 12, padding: '4px 8px', border: '1px solid #242428' };
const weekBtn: React.CSSProperties = { color: '#555560', fontSize: 20, fontWeight: 300, padding: '0 4px', borderRadius: 6 };
const weekNumberBox: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 28 };
const weekNumber: React.CSSProperties = { color: '#fff', fontWeight: 800, fontSize: 18, lineHeight: 1 };
const weekPhase: React.CSSProperties = { color: '#eee', fontSize: 15, fontWeight: 700, marginTop: 2 };
const weekMetric: React.CSSProperties = { flex: 1, background: '#111113', border: '1px solid #1e1e22', borderRadius: 10, padding: '8px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 };
const weekMetricLabel: React.CSSProperties = { color: '#333340', fontSize: 9, fontWeight: 700, letterSpacing: 1 };
const weekMetricValue: React.CSSProperties = { fontSize: 16, fontWeight: 800, letterSpacing: -0.5 };
const resumeCard: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg, #1a0a0a, #130808)', borderRadius: 18, padding: '14px 16px', marginBottom: 20, marginTop: 4, border: '1px solid rgba(224,48,48,0.2)', width: '100%', cursor: 'pointer' };
const resumeIcon: React.CSSProperties = { width: 40, height: 40, background: 'linear-gradient(135deg, #e03030, #b71c1c)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(224,48,48,0.35)' };
const workoutCard: React.CSSProperties = { display: 'flex', alignItems: 'center', borderRadius: 18, marginBottom: 8, border: '1px solid #1c1c20', overflow: 'hidden', width: '100%', cursor: 'pointer', background: '#111113' };
const nutritionCard: React.CSSProperties = { background: '#12100a', borderRadius: 14, padding: 14, marginTop: 10, border: '1px solid #2a2010' };
