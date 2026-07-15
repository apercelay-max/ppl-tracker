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
  onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectDay, onOpenSettings }) => {
  const currentWeek = useWorkoutStore((s) => s.currentWeek);
  const setCurrentWeek = useWorkoutStore((s) => s.setCurrentWeek);
  const session = useWorkoutStore((s) => s.session);

  const weekIdx = currentWeek <= 2 ? 0 : currentWeek <= 4 ? 1 : currentWeek <= 6 ? 2 : currentWeek === 7 ? 3 : 4;
  const weekData = PROGRESSION_WEEKS[weekIdx];
  const resumeWorkout = session && !session.isComplete
    ? WORKOUTS.find((w) => w.id === session.dayId)
    : null;
  const cycleProgress = ((currentWeek - 1) / 7) * 100;

  return (
    <div style={container}>
      <div style={scroll}>

        {/* Header */}
        <div style={headerSection}>
          <div style={logoRow}>
            <div style={logoBadge}><span style={{ fontSize: 22, lineHeight: 1 }}>⚡</span></div>
            <div>
              <h1 style={titleStyle}>PPL Tracker</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Strict V10 · Hypertrophie</p>
            </div>
            <button
              onClick={onOpenSettings}
              style={settingsBtn}
              title="Réglages"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Semaine courante */}
        <div style={weekCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={sectionLabel}>CYCLE EN COURS</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 700, marginTop: 2 }}>{weekData.phase}</p>
            </div>
            <div style={weekSelectorRow}>
              <button className="week-btn" style={weekBtn} onClick={() => setCurrentWeek(currentWeek - 1)} disabled={currentWeek <= 1}>‹</button>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 28 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>SEM.</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 18, lineHeight: '1' }}>{currentWeek}</span>
              </div>
              <button className="week-btn" style={weekBtn} onClick={() => setCurrentWeek(currentWeek + 1)} disabled={currentWeek >= 8}>›</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={weekMetric}>
              <span style={weekMetricLabel}>RIR</span>
              <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: '#4CAF50' }}>{weekData.rir.replace('RIR ', '')}</span>
            </div>
            <div style={weekMetric}>
              <span style={weekMetricLabel}>REPOS</span>
              <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: 'var(--accent)' }}>3:00</span>
            </div>
            <div style={{ ...weekMetric, flex: 2 }}>
              <span style={weekMetricLabel}>OBJECTIF</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: '14px' }}>{weekData.objective}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 6 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{
                flex: 1, height: i + 1 === currentWeek ? 6 : 4, borderRadius: 3,
                background: i + 1 < currentWeek ? 'var(--accent)' : i + 1 === currentWeek ? 'var(--text-primary)' : 'var(--border-strong)',
                transition: 'background 0.3s, height 0.3s',
                boxShadow: i + 1 < currentWeek ? '0 0 6px color-mix(in srgb, var(--accent) 40%, transparent)' : 'none',
              }} />
            ))}
          </div>
          <p style={{ color: 'var(--text-micro)', fontSize: 10 }}>Semaine {currentWeek} / 8 · {Math.round(cycleProgress)}% du cycle</p>
        </div>

        {/* Reprise */}
        {resumeWorkout && (
          <button className="resume-btn" style={resumeCard} onClick={() => onSelectDay(resumeWorkout.id)}>
            <div style={resumeIcon}><span style={{ fontSize: 16 }}>▶</span></div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <p style={{ color: 'var(--accent)', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>SÉANCE EN COURS</p>
              <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800 }}>{resumeWorkout.name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Appuie pour reprendre</p>
            </div>
            <span style={{ color: 'var(--accent)', fontSize: 22, fontWeight: 200, flexShrink: 0, opacity: 0.8 }}>›</span>
          </button>
        )}

        {/* Séances */}
        <p style={{ ...sectionLabel, marginBottom: 10 }}>SÉANCES</p>
        <div>
          {WORKOUTS.map((workout, idx) => {
            const accent = DAY_ACCENT[workout.id];
            const typeLabel = DAY_TYPE_LABEL[workout.id];
            return (
              <button
                key={workout.id}
                className="workout-card slide-up"
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
                  <p style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 800, marginBottom: 3, letterSpacing: -0.3 }}>{workout.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>{workout.muscleGroups}</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                    <span style={{
                      background: `${accent}15`, border: `1px solid ${accent}25`,
                      borderRadius: 6, padding: '2px 8px',
                      color: accent, fontSize: 10, fontWeight: 700,
                    }}>{workout.exercises.length} exercices</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{workout.estimatedDuration}</span>
                  </div>
                </div>
                <span style={{ color: accent, fontSize: 22, fontWeight: 200, paddingRight: 14, flexShrink: 0, opacity: 0.6 }}>›</span>
              </button>
            );
          })}
        </div>

        {/* Nutrition */}
        <div style={nutritionCard}>
          <p style={{ color: 'var(--text-gold-label)', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>🥩 Nutrition post-training</p>
          <p style={{ color: 'var(--text-gold-body)', fontSize: 12, lineHeight: '18px' }}>
            Dans les <strong style={{ color: 'var(--text-gold-label)' }}>30 min</strong> après la séance :
            30-40g protéines · 50-80g glucides.
          </p>
        </div>

        {/* Superset */}
        <div style={{ background: 'var(--bg-green-tint)', borderRadius: 14, padding: 14, marginTop: 8, border: '1px solid var(--border-ss-tint)' }}>
          <p style={{ color: 'var(--text-ss-label)', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>⟳ Règle Superset</p>
          <p style={{ color: 'var(--text-ss-body)', fontSize: 12, lineHeight: '17px' }}>
            Enchaîne les deux exercices SS sans repos. Le minuteur de 3 min démarre uniquement après la paire. Push A & B uniquement.
          </p>
        </div>

      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto', background: 'var(--bg-gradient, var(--bg-base))', backgroundAttachment: 'fixed' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 80px' };
const headerSection: React.CSSProperties = {
  paddingTop: 'max(24px, env(safe-area-inset-top))',
  paddingBottom: 18,
  borderBottom: '1px solid var(--border-subtle)',
  marginBottom: 18,
};
const logoRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14 };
const logoBadge: React.CSSProperties = {
  width: 48, height: 48, borderRadius: 14,
  background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)',
};
const titleStyle: React.CSSProperties = {
  fontSize: 24, fontWeight: 800, letterSpacing: -0.5,
  background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--accent) 70%, var(--accent-2))',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};
const settingsBtn: React.CSSProperties = {
  marginLeft: 'auto',
  width: 36, height: 36,
  background: 'var(--bg-elevated)', borderRadius: 10,
  border: '1px solid var(--border)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 16, cursor: 'pointer', flexShrink: 0,
};
const sectionLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 2 };
const weekCard: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 20, padding: 18, marginBottom: 16,
  border: '1px solid var(--border-mid)',
};
const weekSelectorRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4,
  background: 'var(--bg-higher)', borderRadius: 12, padding: '4px 8px',
  border: '1px solid var(--border-strong)',
};
const weekBtn: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 20, fontWeight: 300, padding: '0 4px', borderRadius: 6 };
const weekMetric: React.CSSProperties = {
  flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '8px 6px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
};
const weekMetricLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 9, fontWeight: 700, letterSpacing: 1 };
const resumeCard: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  background: 'var(--bg-red-tint)',
  borderRadius: 18, padding: '14px 16px',
  marginBottom: 20, marginTop: 4,
  border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
  width: '100%', cursor: 'pointer',
};
const resumeIcon: React.CSSProperties = {
  width: 40, height: 40, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
  borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--accent-contrast)', flexShrink: 0, boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 35%, transparent)',
};
const workoutCard: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  borderRadius: 18, marginBottom: 8,
  border: '1px solid var(--border)',
  overflow: 'hidden', width: '100%', cursor: 'pointer',
  background: 'var(--bg-surface)',
};
const nutritionCard: React.CSSProperties = {
  background: 'var(--bg-gold-tint)', borderRadius: 14, padding: 14, marginTop: 10,
  border: '1px solid var(--border-gold-tint)',
};
