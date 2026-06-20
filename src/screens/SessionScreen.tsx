import React, { useCallback, useEffect } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { getWorkout } from '../data/workouts';
import { ExerciseCard } from '../components/ExerciseCard';
import { RestTimer } from '../components/RestTimer';
import { SetEntry, Exercise } from '../data/types';

interface SessionScreenProps {
  dayId: string;
  onBack: () => void;
}

export const SessionScreen: React.FC<SessionScreenProps> = ({ dayId, onBack }) => {
  const workout = getWorkout(dayId);
  const session = useWorkoutStore((s) => s.session);
  const currentWeek = useWorkoutStore((s) => s.currentWeek);
  const startSession = useWorkoutStore((s) => s.startSession);
  const completeSet = useWorkoutStore((s) => s.completeSet);
  const abandonSession = useWorkoutStore((s) => s.abandonSession);
  const advanceSession = useWorkoutStore((s) => s.advanceSession);
  const startTimer = useWorkoutStore((s) => s.startTimer);
  const timerIsRunning = useWorkoutStore((s) => s.timer.isRunning);

  // Démarre la séance si nécessaire
  useEffect(() => {
    if (!session || session.dayId !== dayId || session.isComplete) {
      startSession(dayId);
    }
  }, [dayId]);

  if (!workout || !session || session.dayId !== dayId) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <p style={{ color: '#555' }}>Chargement…</p>
      </div>
    );
  }

  if (session.isComplete) {
    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
    return (
      <div style={completeScreen}>
        <p style={{ fontSize: 56, marginBottom: 16 }}>🏆</p>
        <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Séance terminée !</h2>
        <p style={{ color: '#4CAF50', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{workout.name}</p>
        <p style={{ color: '#555', fontSize: 14, marginBottom: 40 }}>{totalSets} séries · {workout.estimatedDuration}</p>
        <button style={completeBtnStyle} onClick={onBack}>Retour à l'accueil</button>
      </div>
    );
  }

  const exercises = workout.exercises;
  const currentExIdx = session.currentExerciseIndex;
  const currentSetIdx = session.currentSetIndex;
  const currentEx = exercises[currentExIdx];

  // ── Info pour le RestTimer ────────────────────────────────────────────────
  const getNextInfo = (): { exercise?: Exercise; setNumber?: number } => {
    if (!currentEx) return {};
    const setsLeft = currentEx.sets - (currentSetIdx + 1);
    if (setsLeft > 0) return { exercise: currentEx, setNumber: currentSetIdx + 2 };
    const nextEx = exercises[currentExIdx + 1];
    if (nextEx) return { exercise: nextEx, setNumber: 1 };
    return {};
  };
  const nextInfo = getNextInfo();

  // ── Validation d'une série ────────────────────────────────────────────────
  const handleSetComplete = useCallback(async (
    exerciseId: string, setIndex: number, entry: SetEntry
  ) => {
    completeSet(exerciseId, setIndex, entry);

    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const isLastSet = setIndex === exercise.sets - 1;

    // 1. Superset order 1 → enchaîner sans repos
    if (exercise.restMode === 'superset' && exercise.supersetOrder === 1) {
      advanceSession();
      return;
    }

    // 2. Bilatéral inter-jambes (pas la dernière série)
    if (exercise.restMode === 'bilateral' && !isLastSet) {
      startTimer(exercise.bilateralRestSeconds ?? 45);
      return;
    }

    // 3. Dernière série → repos plein puis avancer
    if (isLastSet && exercise.restSeconds > 0) {
      startTimer(exercise.restSeconds);
      return;
    }

    // 4. Série intermédiaire sans repos défini → avancer directement
    if (!isLastSet) {
      advanceSession();
    }
  }, [exercises, completeSet, advanceSession, startTimer]);

  // ── Abandon ───────────────────────────────────────────────────────────────
  const handleAbandon = () => {
    if (window.confirm('Abandonner la séance ? Les séries saisies seront perdues.')) {
      abandonSession();
      onBack();
    }
  };

  // ── Progression ───────────────────────────────────────────────────────────
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const completedSets = Object.values(session.exerciseProgress)
    .flat().filter((s) => s.completed).length;
  const progressPct = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <div style={container}>

      {/* ── Header fixe ── */}
      <div style={headerBar}>
        <button onClick={handleAbandon} style={backBtn}>✕</button>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', fontSize: 17, fontWeight: 800, lineHeight: '20px' }}>{workout.name}</p>
          <p style={{ color: '#555', fontSize: 12 }}>{completedSets} / {totalSets} séries</p>
        </div>
        {/* Mini progress bar */}
        <div style={{ width: 48, height: 6, background: '#1e1e1e', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: '#4CAF50', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* ── Liste des exercices ── */}
      <div style={scrollArea}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 60px' }}>
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

      {/* ── Timer de repos ── */}
      <RestTimer
        nextExercise={nextInfo.exercise}
        nextSetNumber={nextInfo.setNumber}
        onTimerComplete={advanceSession}
      />

    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const container: React.CSSProperties = {
  height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0a0a0a',
};
const headerBar: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '12px 16px',
  background: '#0a0a0a', borderBottom: '1px solid #1a1a1a',
  flexShrink: 0,
  paddingTop: 'max(12px, env(safe-area-inset-top))',
};
const backBtn: React.CSSProperties = {
  width: 36, height: 36, background: '#1a1a1a', borderRadius: 10,
  color: '#aaa', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};
const scrollArea: React.CSSProperties = {
  flex: 1, overflowY: 'auto',
};
const completeScreen: React.CSSProperties = {
  height: '100dvh', background: '#0a0a0a',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: 24, textAlign: 'center',
};
const completeBtnStyle: React.CSSProperties = {
  background: '#1e1e1e', borderRadius: 14, padding: '16px 32px',
  color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
  border: '1px solid #333',
};
