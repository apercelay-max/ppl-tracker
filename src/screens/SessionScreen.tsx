import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { getWorkout, PROGRESSION_WEEKS } from '../data/workouts';
import { ExerciseCard } from '../components/ExerciseCard';
import { InlineRestBar } from '../components/InlineRestBar';
import { StatsPanel } from '../components/StatsPanel';
import { useRestTimer } from '../hooks/useRestTimer';
import { computeTonnage, computeTrainingLoad, compareSessionToHistory } from '../utils/training';
import { SetEntry, Exercise, ExerciseProgress, HistoryEntry } from '../data/types';

interface SessionScreenProps { dayId: string; onBack: () => void; onOpenSettings: () => void; }

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

export const SessionScreen: React.FC<SessionScreenProps> = ({ dayId, onBack, onOpenSettings }) => {
  const workout = getWorkout(dayId);
  const session = useWorkoutStore((s) => s.session);
  const currentWeek = useWorkoutStore((s) => s.currentWeek);
  const customRestSeconds = useWorkoutStore((s) => s.customRestSeconds);
  const defaultRestSeconds = useWorkoutStore((s) => s.defaultRestSeconds);
  const history = useWorkoutStore((s) => s.history);
  const timer = useWorkoutStore((s) => s.timer);
  const startSession = useWorkoutStore((s) => s.startSession);
  const completeSet = useWorkoutStore((s) => s.completeSet);
  const editSet = useWorkoutStore((s) => s.editSet);
  const skipSet = useWorkoutStore((s) => s.skipSet);
  const skipExercise = useWorkoutStore((s) => s.skipExercise);
  const addSet = useWorkoutStore((s) => s.addSet);
  const abandonSession = useWorkoutStore((s) => s.abandonSession);
  const advanceSession = useWorkoutStore((s) => s.advanceSession);
  const startTimer = useWorkoutStore((s) => s.startTimer);
  const skipTimer = useWorkoutStore((s) => s.skipTimer);
  const reduceTimer = useWorkoutStore((s) => s.reduceTimer);
  const addTimer = useWorkoutStore((s) => s.addTimer);
  const saveCustomRest = useWorkoutStore((s) => s.saveCustomRest);
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 700);

  // Track which exercise triggered the timer (for saving custom rest)
  const timerExerciseRef = useRef<string | null>(null);

  // ── Échauffement cardio 3 min, en tout début de séance ──────────────────
  const [cardioVisible, setCardioVisible] = useState(true);
  const [cardioRunning, setCardioRunning] = useState(false);
  const [cardioSeconds, setCardioSeconds] = useState(180);

  useEffect(() => {
    if (!cardioRunning || cardioSeconds <= 0) return;
    const id = setTimeout(() => setCardioSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [cardioRunning, cardioSeconds]);

  useEffect(() => {
    if (cardioRunning && cardioSeconds === 0 && 'vibrate' in navigator) navigator.vibrate([150, 80, 150]);
  }, [cardioRunning, cardioSeconds]);

  useEffect(() => {
    const h = () => setIsWide(window.innerWidth >= 700);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (!session || session.dayId !== dayId || session.isComplete) startSession(dayId);
  }, [dayId]);

  const handleTimerComplete = useCallback(() => {
    // Sauvegarder le temps réel restant comme nouveau temps custom
    if (timerExerciseRef.current) {
      const store = useWorkoutStore.getState();
      const t = store.timer;
      if (t.endTimestamp) {
        const remaining = Math.max(0, Math.ceil((t.endTimestamp - Date.now()) / 1000));
        const used = (t.totalSeconds ?? defaultRestSeconds) - remaining;
        if (Math.abs(used - (t.totalSeconds ?? defaultRestSeconds)) > 15) {
          saveCustomRest(timerExerciseRef.current, used > 0 ? used : t.totalSeconds ?? defaultRestSeconds);
        }
      }
    }
    advanceSession();
  }, [advanceSession, saveCustomRest, defaultRestSeconds]);

  const { secondsLeft, isRunning: timerIsRunning, progress, formattedTime } = useRestTimer(handleTimerComplete);

  const handleSkipRest = useCallback(() => {
    if (timerExerciseRef.current && timer.totalSeconds) {
      const used = timer.totalSeconds - Math.max(0, secondsLeft);
      if (used > 30) saveCustomRest(timerExerciseRef.current, used);
    }
    skipTimer();
    handleTimerComplete();
  }, [skipTimer, handleTimerComplete, timer.totalSeconds, secondsLeft, saveCustomRest]);

  const handleReduceRest = useCallback(() => {
    reduceTimer(30);
    if (timerExerciseRef.current && timer.totalSeconds) {
      saveCustomRest(timerExerciseRef.current, Math.max(30, (timer.totalSeconds ?? 0) - 30));
    }
  }, [reduceTimer, timer.totalSeconds, saveCustomRest]);

  const handleAddRest = useCallback(() => {
    addTimer(30);
    if (timerExerciseRef.current && timer.totalSeconds) {
      saveCustomRest(timerExerciseRef.current, (timer.totalSeconds ?? 0) + 30);
    }
  }, [addTimer, timer.totalSeconds, saveCustomRest]);

  // IMPORTANT : ce hook doit rester AVANT les "return" conditionnels
  // ci-dessous (règle des hooks React — sinon erreur #300 "rendered fewer
  // hooks than expected" dès qu'on atteint la fin d'une séance).
  const handleSetComplete = useCallback(async (exerciseId: string, setIndex: number, entry: SetEntry) => {
    completeSet(exerciseId, setIndex, entry);
    const exercise = workout?.exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;
    // Superset order 1 → pas de timer, on enchaîne
    if (exercise.restMode === 'superset' && exercise.supersetOrder === 1) {
      advanceSession();
      return;
    }
    // Priorité : temps custom (auto-appris ou réglé à la main dans la
    // liste "Temps de repos par exercice") → temps propre à l'exercice
    // (workouts.ts) → défaut global des réglages.
    const restSecs = customRestSeconds[exerciseId] ?? exercise.restSeconds ?? defaultRestSeconds;
    timerExerciseRef.current = exerciseId;
    startTimer(restSecs);
  }, [workout, completeSet, advanceSession, startTimer, customRestSeconds, defaultRestSeconds]);

  if (!workout || !session || session.dayId !== dayId) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-dim)' }}>Chargement…</p>
      </div>
    );
  }

  if (session.isComplete) return <CompletionScreen workout={workout} session={session} onBack={onBack} history={history} />;

  const exercises = workout.exercises;
  const weekIdx = currentWeek <= 2 ? 0 : currentWeek <= 4 ? 1 : currentWeek <= 6 ? 2 : currentWeek === 7 ? 3 : 4;
  const weekData = PROGRESSION_WEEKS[weekIdx];
  const currentExIdx = session.currentExerciseIndex;
  const currentSetIdx = session.currentSetIndex;
  const currentEx = exercises[currentExIdx];

  const getNextInfo = (): { exercise?: Exercise; setNumber?: number } => {
    if (!currentEx) return {};
    const totalSets = session.exerciseProgress[currentEx.id]?.length ?? currentEx.sets;
    const setsLeft = totalSets - (currentSetIdx + 1);
    if (setsLeft > 0) return { exercise: currentEx, setNumber: currentSetIdx + 2 };
    const nextEx = exercises[currentExIdx + 1];
    if (nextEx) return { exercise: nextEx, setNumber: 1 };
    return {};
  };
  const nextInfo = getNextInfo();

  const handleAbandon = () => {
    if (window.confirm('Abandonner la séance ?')) { abandonSession(); onBack(); }
  };

  const totalSets = exercises.reduce((sum, ex) => sum + (session.exerciseProgress[ex.id]?.length ?? ex.sets), 0);
  const completedSets = Object.values(session.exerciseProgress).flat().filter((s) => s.completed).length;
  const progressPct = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  // Grouper les exercices en superset pairs
  const groupedExercises: (Exercise | Exercise[])[] = [];
  let i = 0;
  while (i < exercises.length) {
    const ex = exercises[i];
    if (ex.restMode === 'superset' && ex.supersetGroupId) {
      const pair = exercises.filter(e => e.supersetGroupId === ex.supersetGroupId);
      groupedExercises.push(pair);
      i += pair.length;
    } else {
      groupedExercises.push(ex);
      i++;
    }
  }

  // ── Barre de repos inline : toujours injectée dans la carte de l'exercice
  // actuellement actif (garanti visible), soit entre deux séries du même
  // exercice, soit après la dernière série avant de passer au suivant.
  const stayingSameExercise = currentEx && nextInfo.exercise?.id === currentEx.id;
  const restBarTargetExerciseId = currentEx?.id;
  const restBarTargetIndex = currentEx
    ? (stayingSameExercise
        ? (nextInfo.setNumber ?? 1) - 1
        : (session.exerciseProgress[currentEx.id]?.length ?? 0))
    : undefined;
  const restBarLabel = nextInfo.exercise
    ? (stayingSameExercise ? `Série ${nextInfo.setNumber}` : `Ensuite : ${nextInfo.exercise.name}`)
    : undefined;
  // Quand on change d'exercice, on affiche la note technique du prochain
  // exercice pendant le repos, pour que Léo la lise avant d'attaquer.
  const restBarNote = !stayingSameExercise ? nextInfo.exercise?.notes : undefined;

  const restBarNode = timerIsRunning ? (
    <InlineRestBar
      secondsLeft={secondsLeft}
      formattedTime={formattedTime}
      progress={progress}
      finished={secondsLeft <= 0}
      nextLabel={restBarLabel}
      nextNote={restBarNote}
      onSkip={handleSkipRest}
      onReduce={handleReduceRest}
      onAdd={handleAddRest}
    />
  ) : null;

  return (
    <div style={{ ...container, flexDirection: isWide ? 'row' : 'column' }}>
      <div style={isWide ? mainArea : { display: 'contents' }}>
        <div style={headerBar}>
          <button onClick={handleAbandon} style={backBtn}>←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800, lineHeight: '20px', letterSpacing: -0.3 }}>{workout.name}</p>
            <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>
              {completedSets}/{totalSets} séries · SEM. {currentWeek} · RIR {weekData.rir.replace('RIR ', '')}
            </p>
          </div>
          <button onClick={onOpenSettings} style={settingsBtn} title="Réglages (sans quitter la séance)">⚙️</button>
          <div style={{ width: 52, height: 5, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--brand-1), var(--brand-2))', borderRadius: 3, transition: 'width 0.3s', boxShadow: '0 0 8px rgba(var(--brand-1-rgb),0.4)' }} />
          </div>
          <span style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{Math.round(progressPct)}%</span>
        </div>

        <div style={scrollArea}>
          <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 80px' }}>
            {cardioVisible && completedSets === 0 && currentExIdx === 0 && currentSetIdx === 0 && (
              <div style={cardioCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: cardioRunning ? 10 : 6 }}>
                  <span style={{ fontSize: 20 }}>🏃</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#5560cc', fontSize: 12, fontWeight: 800, letterSpacing: 0.5 }}>ÉCHAUFFEMENT CARDIO</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>3 minutes avant d'attaquer, pour monter en température.</p>
                  </div>
                </div>
                {cardioRunning ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: cardioSeconds === 0 ? '#4CAF50' : '#5560cc', flex: 1, textAlign: 'center' }}>
                      {cardioSeconds === 0 ? "C'est bon 💪" : `${Math.floor(cardioSeconds / 60)}:${(cardioSeconds % 60).toString().padStart(2, '0')}`}
                    </span>
                    <button onClick={() => setCardioVisible(false)} style={cardioBtnPrimary}>
                      {cardioSeconds === 0 ? 'Commencer la séance' : 'Passer'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setCardioRunning(true)} style={cardioBtnPrimary}>▶ Démarrer</button>
                    <button onClick={() => setCardioVisible(false)} style={cardioBtnGhost}>Passer</button>
                  </div>
                )}
              </div>
            )}
            {groupedExercises.map((item) => {
              if (Array.isArray(item)) {
                // Groupe superset → encadré rouge foncé
                return (
                  <div key={item[0].supersetGroupId} style={ssGroup}>
                    <div style={ssLabel}><span style={{ fontSize: 10 }}>⟳</span> SUPERSET</div>
                    {item.map((exercise, idx) => {
                      const exIdx = exercises.indexOf(exercise);
                      const isRestTarget = exercise.id === restBarTargetExerciseId;
                      return (
                        <ExerciseCard
                          key={exercise.id}
                          exercise={exercise}
                          setEntries={session.exerciseProgress[exercise.id] ?? []}
                          currentSetIndex={exIdx === currentExIdx ? currentSetIdx : 0}
                          isActive={exIdx === currentExIdx}
                          currentWeek={currentWeek}
                          onSetComplete={(setIndex, entry) => handleSetComplete(exercise.id, setIndex, entry)}
                          onEditSet={(setIndex) => editSet(exercise.id, setIndex)}
                          onSkipSet={exIdx === currentExIdx ? skipSet : undefined}
                          onSkipExercise={exIdx === currentExIdx ? skipExercise : undefined}
                          onAddSet={() => addSet(exercise.id)}
                          restBar={isRestTarget ? restBarNode : null}
                          restBarIndex={isRestTarget ? restBarTargetIndex : undefined}
                        />
                      );
                    })}
                  </div>
                );
              }
              // Exercice normal
              const exercise = item;
              const exIdx = exercises.indexOf(exercise);
              const isRestTarget = exercise.id === restBarTargetExerciseId;
              return (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  setEntries={session.exerciseProgress[exercise.id] ?? []}
                  currentSetIndex={exIdx === currentExIdx ? currentSetIdx : 0}
                  isActive={exIdx === currentExIdx}
                  currentWeek={currentWeek}
                  onSetComplete={(setIndex, entry) => handleSetComplete(exercise.id, setIndex, entry)}
                  onEditSet={(setIndex) => editSet(exercise.id, setIndex)}
                  onSkipSet={exIdx === currentExIdx ? skipSet : undefined}
                  onSkipExercise={exIdx === currentExIdx ? skipExercise : undefined}
                  onAddSet={() => addSet(exercise.id)}
                  restBar={isRestTarget ? restBarNode : null}
                  restBarIndex={isRestTarget ? restBarTargetIndex : undefined}
                />
              );
            })}
          </div>
        </div>
      </div>

      <StatsPanel startTime={session.startTime} compact={!isWide} />
    </div>
  );
};

// ─── Échauffement cardio ─────────────────────────────────────────────────

const cardioCard: React.CSSProperties = {
  background: 'var(--bg-blue-tint)', border: '1px solid var(--border-blue-tint)',
  borderRadius: 18, padding: '14px 14px', marginBottom: 14,
};
const cardioBtnPrimary: React.CSSProperties = {
  flex: 1, background: 'linear-gradient(135deg, #5560cc, #3d47a0)', color: '#fff',
  borderRadius: 12, padding: '10px 8px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  boxShadow: '0 3px 12px rgba(85,96,204,0.3)',
};
const cardioBtnGhost: React.CSSProperties = {
  flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  color: 'var(--text-muted)', borderRadius: 12, padding: '10px 8px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};

// ─── Styles groupes SS ─────────────────────────────────────────────────────

const ssGroup: React.CSSProperties = {
  border: '2px solid #7a1010',
  borderRadius: 22,
  padding: '4px 6px 6px',
  marginBottom: 10,
  background: 'rgba(122,16,16,0.06)',
};
const ssLabel: React.CSSProperties = {
  color: '#b83030',
  fontSize: 10, fontWeight: 800, letterSpacing: 2,
  padding: '4px 8px 6px',
  display: 'flex', alignItems: 'center', gap: 4,
};

// ─── Écran de fin ────────────────────────────────────────────────────────────

const RPE_LABELS: Record<number, string> = {
  1: 'Très facile', 2: 'Très facile', 3: 'Facile', 4: 'Facile',
  5: 'Modéré', 6: 'Modéré', 7: 'Dur', 8: 'Dur', 9: 'Très dur', 10: 'Maximal',
};

const CompletionScreen: React.FC<{
  workout: NonNullable<ReturnType<typeof getWorkout>>;
  session: { startTime: number; exerciseProgress: ExerciseProgress; dayId: string; isComplete: boolean; currentExerciseIndex: number; currentSetIndex: number };
  onBack: () => void;
  history: HistoryEntry[];
}> = ({ workout, session, onBack, history }) => {
  const updateLastSessionRPE = useWorkoutStore((s) => s.updateLastSessionRPE);
  const [rpe, setRpe] = useState<number | null>(null);

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const durationMs = Date.now() - session.startTime;
  const durationMin = Math.round(durationMs / 60000);
  const cal = Math.round(5.5 * durationMin);
  const tonnage = computeTonnage(session.exerciseProgress);
  const comparison = compareSessionToHistory(history, session.dayId, tonnage);

  const allEntries = workout.exercises.flatMap((ex) =>
    (session.exerciseProgress[ex.id] ?? []).filter((e) => e.completed && e.reps !== '—').map((e) => ({ reps: e.reps, targetReps: ex.targetReps }))
  );
  const outOfRangeCount = allEntries.filter((e) => isRepOutOfRange(e.reps, e.targetReps)).length;
  const pct = allEntries.length > 0 ? outOfRangeCount / allEntries.length : 0;

  const getRec = () => {
    if (pct > 0.35) return { emoji: '⚖️', title: 'Calibration poids requise', detail: `${outOfRangeCount} série(s) hors plage cible. Ajuste les charges de ±2.5 kg.`, color: '#f5a623' };
    if (pct > 0.1) return { emoji: '👍', title: 'Bonne séance, quelques ajustements', detail: `${outOfRangeCount} série(s) légèrement hors cible. Surveille la semaine prochaine.`, color: '#e8a020' };
    return { emoji: '🎯', title: 'Exécution parfaite !', detail: 'Toutes les séries dans la plage cible. +2.5 kg envisageable la semaine prochaine.', color: '#4CAF50' };
  };
  const rec = getRec();

  const handleSelectRpe = (value: number) => {
    setRpe(value);
    const trainingLoad = computeTrainingLoad(value, durationMs);
    updateLastSessionRPE(value, tonnage, trainingLoad);
  };

  return (
    <div style={completeScreen}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={trophyBadge}><span style={{ fontSize: 44 }}>🏆</span></div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: -0.5 }}>Séance terminée !</h2>
          <p style={{ color: 'var(--brand-1)', fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{workout.name}</p>
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
          {tonnage > 0 && (
            <div style={statBlock}>
              <span style={{ fontSize: 22 }}>🏋️</span>
              <span style={{ color: '#5560cc', fontSize: 20, fontWeight: 200 }}>{tonnage}<span style={{ fontSize: 11 }}> kg</span></span>
              <span style={{ color: 'var(--text-dim)', fontSize: 9, letterSpacing: 1 }}>TONNAGE</span>
            </div>
          )}
        </div>

        {(comparison.tonnagePctVsPrevious !== undefined || comparison.tonnagePctVsFirst !== undefined) && tonnage > 0 && (
          <div style={progressionCard}>
            <p style={{ color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>
              📈 ÉVOLUTION DU TONNAGE
            </p>
            {comparison.tonnagePctVsPrevious !== undefined && comparison.previous && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: '19px', marginBottom: comparison.tonnagePctVsFirst !== undefined ? 6 : 0 }}>
                vs {workout.name} précédente ({comparison.previous.tonnage} kg) :{' '}
                <strong style={{ color: comparison.tonnagePctVsPrevious >= 0 ? '#4CAF50' : '#f5a623' }}>
                  {comparison.tonnagePctVsPrevious >= 0 ? '+' : ''}{comparison.tonnagePctVsPrevious}%
                </strong>
              </p>
            )}
            {comparison.tonnagePctVsFirst !== undefined && comparison.first && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: '19px' }}>
                vs ta 1ère {workout.name} ({comparison.first.tonnage} kg) :{' '}
                <strong style={{ color: comparison.tonnagePctVsFirst >= 0 ? '#4CAF50' : '#f5a623' }}>
                  {comparison.tonnagePctVsFirst >= 0 ? '+' : ''}{comparison.tonnagePctVsFirst}%
                </strong>
              </p>
            )}
          </div>
        )}

        <div style={rpeCard}>
          <p style={{ color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 }}>
            RESSENTI DE LA SÉANCE (RPE)
          </p>
          <div style={{ display: 'flex', gap: 5, marginBottom: rpe ? 8 : 0 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => handleSelectRpe(n)}
                style={{
                  ...rpeBtn,
                  background: rpe === n ? 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' : 'var(--bg-elevated)',
                  color: rpe === n ? '#fff' : 'var(--text-muted)',
                  border: rpe === n ? '1px solid transparent' : '1px solid var(--border-strong)',
                }}
              >{n}</button>
            ))}
          </div>
          {rpe && (
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              {RPE_LABELS[rpe]} · charge : <strong style={{ color: 'var(--text-secondary)' }}>{computeTrainingLoad(rpe, durationMs)}</strong>
            </p>
          )}
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
  width: 36, height: 36, background: 'var(--bg-elevated)', borderRadius: 'var(--icon-radius)',
  color: 'var(--text-muted)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, border: '1px solid var(--border-strong)',
};
const settingsBtn: React.CSSProperties = {
  width: 32, height: 32, background: 'var(--bg-elevated)', borderRadius: 'var(--icon-radius)',
  fontSize: 14, cursor: 'pointer',
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
const progressionCard: React.CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 16, padding: 14, marginBottom: 12,
};
const rpeCard: React.CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 16, padding: 14, marginBottom: 12,
};
const rpeBtn: React.CSSProperties = {
  flex: 1, height: 34, borderRadius: 9,
  fontSize: 13, fontWeight: 700, cursor: 'pointer',
  transition: 'background 0.15s, border-color 0.15s',
};
const completeBtnStyle: React.CSSProperties = {
  width: '100%', background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  borderRadius: 16, padding: '16px 32px',
  color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(var(--brand-1-rgb),0.3)',
};
