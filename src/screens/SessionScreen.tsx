import React, { useState, useCallback, useEffect } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { getWorkout } from '../data/workouts';
import { ExerciseCard } from '../components/ExerciseCard';
import { RestTimer } from '../components/RestTimer';
import { StatsPanel } from '../components/StatsPanel';
import { SetEntry, Exercise } from '../data/types';

const REST_SECONDS = 180;

interface SessionScreenProps { dayId: string; onBack: () => void; }

const parseTargetRange = (t: string): [number, number] | null => {
  const r = t.match(/^(\d+)-(\d+)/); if (r) return [parseInt(r[1]), parseInt(r[2])];
  const p = t.match(/^(\d+)\+/); if (p) return [parseInt(p[1]), 99];
  const s = t.match(/^(\d+)/); if (s) { const n = parseInt(s[1]); return [n, n]; }
  return null;
};
const isRepOutOfRange = (reps: string, targetReps: string): boolean => {
  const r = parseInt(reps); if (isNaN(r)) return false;
  const range = parseTargetRange(targetReps); if (!range) return false;
  return r < range[0] || r > range[1];
};

export const SessionScreen: React.FC<SessionScreenProps> = ({ dayId, onBack }) => {
  const workout = getWorkout(dayId);
  const session = useWorkoutStore((s) => s.session);
  const currentWeek = useWorkoutStore((s) => s.currentWeek);
  const startSession = useWorkoutStore((s) => s.startSession);
  const completeSet = useWorkoutStore((s) => s.completeSet);
  const abandonSession = useWorkoutStore((s) => s.abandonSession);
  const advanceSession = useWorkoutStore((s) => s.advanceSession);
  const startTimer = useWorkoutStore((s) => s.startTimer);
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 700);

  useEffect(() => {
    const h = () => setIsWide(window.innerWidth >= 700);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (!session || session.dayId !== dayId || session.isComplete) startSession(dayId);
  }, [dayId]);

  if (!workout || !session || session.dayId !== dayId) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-dim)' }}>Chargement…</p>
      </div>
    );
  }

  if (session.isComplete) return <CompletionScreen workout={workout} session={session} onBack={onBack} />;

  const exercises = workout.exercises;
  const currentExIdx = session.currentExerciseIndex;
  const currentSetIdx = session.currentSetIndex;
  const currentEx = exercises[currentExIdx];

  const getNextInfo = (): { exercise?: Exercise; setNumber?: number } => {
    if (!currentEx) return {};
    const setsLeft = currentEx.sets - (currentSetIdx + 1);
    if (setsLeft > 0) return { exercise: currentEx, setNumber: currentSetIdx + 2 };
    const nextEx = exercises[currentExIdx + 1];
    if (nextEx) return { exercise: nextEx, setNumber: 1 };
    return {};
  };
  const nextInfo = getNextInfo();

  const handleSetComplete = useCallback(async (exerciseId: string, setIndex: number, entry: SetEntry) => {
    completeSet(exerciseId, setIndex, entry);
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;
    if (exercise.restMode === 'superset' && exercise.supersetOrder === 1) { advanceSession(); return; }
    startTimer(REST_SECONDS);
  }, [exercises, completeSet, advanceSession, startTimer]);

  const handleAbandon = () => {
    if (window.confirm('Abandonner la séance ?')) { abandonSession(); onBack(); }
  };

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const completedSets = Object.values(session.exerciseProgress).flat().filter((s) => s.completed).length;
  const progressPct = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <div style={{ ...container, flexDirection: isWide ? 'row' : 'column' }}>
      <div style={isWide ? mainArea : { display: 'contents' }}>
        <div style={headerBar}>
          <button onClick={handleAbandon} style={backBtn}>✕</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800, lineHeight: '20px', letterSpacing: -0.3 }}>{workout.name}</p>
            <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>{completedSets}/{totalSets} séries</p>
          </div>
          <div style={{ width: 52, height: 5, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #e03030, #9b27af)', borderRadius: 3, transition: 'width 0.3s', boxShadow: '0 0 8px rgba(224,48,48,0.4)' }} />
          </div>
          <span style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{Math.round(progressPct)}%</span>
        </div>

        <div style={scrollArea}>
          <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 80px' }}>
            {exercises.map((exercise, idx) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                setEntries={session.exerciseProgress[exercise.id] ?? []}
                currentSetIndex={idx === currentExIdx ? currentSetIdx : 0}
                isActive={idx === currentExIdx}
                currentWeek={currentWeek}
                onSetComplete={(setIndex, entry) => handleSetComplete(exercise.id, setIndex, entry)}
              />
            ))}
          </div>
        </div>
      </div>

      <StatsPanel startTime={session.startTime} compact={!isWide} />
      <RestTimer nextExercise={nextInfo.exercise} nextSetNumber={nextInfo.setNumber} onTimerComplete={advanceSession} />
    </div>
  );
};

// ── Écran de fin ──────────────────────────────────────────────────────────────

const CompletionScreen: React.FC<{
  workout: NonNullable<ReturnType<typeof getWorkout>>;
  session: { startTime: number; exerciseProgress: Record<string, { reps: string; completed: boolean }[]>; dayId: string; isComplete: boolean; currentExerciseIndex: number; currentSetIndex: number };
  onBack: () => void;
}> = ({ workout, session, onBack }) => {
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const durationMin = Math.round((Date.now() - session.startTime) / 60000);
  const cal = Math.round(5.5 * durationMin);

  const allEntries = workout.exercises.flatMap((ex) =>
    (session.exerciseProgress[ex.id] ?? []).filter((e) => e.completed).map((e) => ({ reps: e.reps, targetReps: ex.targetReps }))
  );
  const outOfRangeCount = allEntries.filter((e) => isRepOutOfRange(e.reps, e.targetReps)).length;
  const pct = allEntries.length > 0 ? outOfRangeCount / allEntries.length : 0;

  const getRec = () => {
    if (pct > 0.35) return { emoji: '⚖️', title: 'Calibration poids requise', detail: `${outOfRangeCount} série(s) hors plage cible. Ajuste les charges de ±2.5 kg.`, color: '#f5a623' };
    if (pct > 0.1) return { emoji: '📊', title: 'Bonne séance, quelques ajustements', detail: `${outOfRangeCount} série(s) légèrement hors cible. Surveille la semaine prochaine.`, color: '#e8a020' };
    return { emoji: '🏆', title: 'Exécution parfaite !', detail: 'Toutes les séries dans la plage cible. +2.5 kg envisageable la semaine prochaine.', color: '#4CAF50' };
  };
  const rec = getRec();

  return (
    <div style={completeScreen}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={trophyBadge}><span style={{ fontSize: 44 }}>🏆</span></div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: -0.5 }}>Séance terminée !</h2>
          <p style={{ color: '#e03030', fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{workout.name}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{totalSets} séries · {durationMin} min</p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={statBlock}>
            <span style={{ fontSize: 22 }}>⏱</span>
            <span style={{ color: '#4CAF50', fontSize: 20, fontWeight: 200 }}>{durationMin}<span style={{ fontSize: 11 }}> min</span></span>
            <span style={{ color: 'var(--text-dim)', fontSize: 9, letterSpacing: 1 }}>DURÉE</span>
          </div>
          <div style={statBlock}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <span style={{ color: '#e8a020', fontSize: 20, fontWeight: 200 }}>{cal}<span style={{ fontSize: 11 }}> kcal</span></span>
            <span style={{ color: 'var(--text-dim)', fontSize: 9, letterSpacing: 1 }}>CALORIES</span>
          </div>
          <div style={statBlock}>
            <span style={{ fontSize: 22 }}>💪</span>
            <span style={{ color: '#9b27af', fontSize: 20, fontWeight: 200 }}>{totalSets}</span>
            <span style={{ color: 'var(--text-dim)', fontSize: 9, letterSpacing: 1 }}>SÉRIES</span>
          </div>
        </div>

        <div style={{ borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${rec.color}30`, background: `${rec.color}08` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{rec.emoji}</span>
            <p style={{ color: rec.color, fontSize: 13, fontWeight: 700 }}>{rec.title}</p>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: '18px' }}>{rec.detail}</p>
        </div>

        <div style={{ background: 'var(--bg-gold-tint)', borderRadius: 14, padding: 14, marginBottom: 20, border: '1px solid var(--border-gold-tint)' }}>
          <p style={{ color: 'var(--text-gold-label)', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>🥩 Nutrition maintenant</p>
          <p style={{ color: 'var(--text-gold-body)', fontSize: 13, lineHeight: '19px' }}>
            <strong style={{ color: '#e8a020' }}>30-40g</strong> protéines + <strong style={{ color: '#e8a020' }}>50-80g</strong> glucides dans les <strong style={{ color: '#e8a020' }}>30 minutes</strong>.
          </p>
          <p style={{ color: 'var(--text-gold-footer)', fontSize: 11, marginTop: 6 }}>~{cal} kcal dépensées · hydrate-toi !</p>
        </div>

        <button style={completeBtnStyle} onClick={onBack}>Retour à l'accueil</button>
      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const container: React.CSSProperties = { height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' };
const mainArea: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const headerBar: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
  background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)',
  flexShrink: 0, paddingTop: 'max(12px, env(safe-area-inset-top))',
};
const backBtn: React.CSSProperties = {
  width: 36, height: 36, background: 'var(--bg-elevated)', borderRadius: 10,
  color: 'var(--text-muted)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, border: '1px solid var(--border-strong)',
};
const scrollArea: React.CSSProperties = { flex: 1, overflowY: 'auto' };
const completeScreen: React.CSSProperties = {
  height: '100dvh', background: 'var(--bg-base)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: '24px 20px', overflowY: 'auto',
};
const trophyBadge: React.CSSProperties = {
  width: 90, height: 90, borderRadius: 24,
  background: 'var(--bg-gold-tint)',
  border: '1px solid var(--border-gold-tint)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(232,160,32,0.15)',
};
const statBlock: React.CSSProperties = {
  flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 16, padding: '14px 8px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
};
const completeBtnStyle: React.CSSProperties = {
  width: '100%', background: 'linear-gradient(135deg, #e03030, #9b27af)',
  borderRadius: 16, padding: '16px 32px',
  color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(224,48,48,0.3)',
};
