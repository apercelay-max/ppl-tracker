import React, { useState } from 'react';
import { IconCheck } from './Icons';
import { Exercise, SetEntry } from '../data/types';
import { getProgressionWeek } from '../data/workouts';
import { SetRow } from './SetRow';
import { ExerciseAnimation } from './ExerciseAnimation';
import { useWorkoutStore, useActiveGym } from '../store/workoutStore';
import { ICON_SIZE_PRESETS } from '../data/iconPrefs';
import { getLastExerciseSets, getMaxWeightEver, suggestNextLoad } from '../utils/training';
import { getSetCoaching } from '../utils/coach';
import { formatWeightForDisplay, weightUnitLabel } from '../utils/weight';
import { usesBarbell } from '../utils/gymAdapt';

interface ExerciseCardProps {
  exercise: Exercise;
  setEntries: SetEntry[];
  currentSetIndex: number;
  isActive: boolean;
  currentWeek: number;
  onSetComplete: (setIndex: number, entry: SetEntry) => void;
  onEditSet?: (setIndex: number) => void;
  onSkipSet?: () => void;
  onSkipExercise?: () => void;
  onSwitchTo?: () => void;
  onAddSet?: () => void;
  onWeightStart?: (setIndex: number) => void;
  restBar?: React.ReactNode;
  restBarIndex?: number;
  // Vrai si cet exercice fait partie d'un superset/tri-set dont un AUTRE
  // membre est actuellement l'exercice actif (isActive=false ici). Sans ça,
  // un membre qui a déjà fait sa série du tour mais n'a pas encore fini
  // toutes ses séries (donc allDone=false) repasse en carte repliée dès que
  // la main passe au membre suivant — masquant au passage sa propre barre
  // de repos (voir SessionScreen : le repos réel du tour est rattaché au
  // dernier membre du groupe). Voir SessionScreen.groupedExercises.
  groupActive?: boolean;
  // Incrémenté quand une secousse du téléphone doit valider la série en cours
  // (transmis à la SetRow active) — voir useShakeToValidate.
  validateSignal?: number;
}

const formatRest = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const bestCompletedSet = (sets: SetEntry[] | null | undefined): { weight: number; reps: string } | null => {
  if (!sets) return null;
  let best: { weight: number; reps: string } | null = null;
  for (const s of sets) {
    if (!s.completed) continue;
    const w = parseFloat(s.weight);
    if (isNaN(w)) continue;
    if (!best || w > best.weight) best = { weight: w, reps: s.reps };
  }
  return best;
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise, setEntries, currentSetIndex, isActive, currentWeek, onSetComplete,
  onEditSet, onSkipSet, onSkipExercise, onAddSet, onSwitchTo, onWeightStart, restBar, restBarIndex,
  validateSignal, groupActive,
}) => {
  const [notesOpen, setNotesOpen] = useState(false);
  const iconSize = useWorkoutStore((s) => s.iconSize);
  const animSize = ICON_SIZE_PRESETS[iconSize].anim;
  const customRestSeconds = useWorkoutStore((s) => s.customRestSeconds);
  const history = useWorkoutStore((s) => s.history);
  const lastTimeSets = getLastExerciseSets(history, exercise.id);
  const weightUnit = useWorkoutStore((s) => s.weightUnit);
  const previousMaxWeight = getMaxWeightEver(history, exercise.id);
  const lastBestSet = bestCompletedSet(lastTimeSets);
  const currentBestSet = bestCompletedSet(setEntries);
  let exerciseDeltaLabel: string | null = null;
  if (lastBestSet && currentBestSet) {
    const diffKg = currentBestSet.weight - lastBestSet.weight;
    if (Math.abs(diffKg) < 0.01) {
      exerciseDeltaLabel = 'Même charge que la dernière fois (' + lastBestSet.reps + ' reps)';
    } else {
      const sign = diffKg > 0 ? '+' : '-';
      const diffDisplay = formatWeightForDisplay(Math.abs(diffKg).toFixed(2), weightUnit).replace('.', ',');
      exerciseDeltaLabel = sign + diffDisplay + ' ' + weightUnitLabel(weightUnit) + ' vs dernière fois';
    }
  } else if (lastBestSet) {
    const lastDisplay = formatWeightForDisplay(String(lastBestSet.weight), weightUnit);
    exerciseDeltaLabel = 'Derniere fois : ' + lastDisplay + ' ' + weightUnitLabel(weightUnit) + ' x ' + lastBestSet.reps;
  }

  const weekData = getProgressionWeek(currentWeek);
  const completedCount = setEntries.filter((s) => s.completed).length;
  const totalSets = setEntries.length;
  const allDone = completedCount === totalSets && totalSets > 0;

  // Barre utilisée par cet exercice (null sinon) : conditionne l'aide au
  // chargement des disques affichée sous la série en cours.
  const barType = usesBarbell(exercise);
  const gym = useActiveGym();
  const barKg = barType === 'Barre' ? gym.barKg : barType === 'Barre EZ' ? gym.ezBarKg : null;

  // Suggestion de charge en double progression : ce que la plupart des apps
  // concurrentes automatisent — « la dernière fois tu as tout passé en haut de
  // la fourchette, monte d'un cran ». Affichée seulement AVANT la première
  // série validée : une fois la séance lancée, la charge est déjà choisie.
  // L'incrément est celui de la salle si l'exercice se fait à la barre
  // (2 disques de 1,25 = 2,5 kg), sinon l'incrément fin (haltères, goupille).
  const loadSuggestion = completedCount === 0
    ? suggestNextLoad(
        lastTimeSets ?? [],
        exercise.targetReps,
        exercise.sets,
        barKg !== null ? Math.min(...gym.plates) * 2 : gym.otherIncrementKg
      )
    : null;

  // Incrément réellement disponible dans la salle : le plus petit disque
  // compte double (un de chaque côté de la barre), sinon l'incrément fin.
  const incrementKg = barKg !== null && gym.plates.length > 0
    ? Math.min(...gym.plates) * 2
    : gym.otherIncrementKg;

  // Conseil du coach sur la prochaine série, lu depuis la dernière série faite
  // (voir utils/coach.ts). Uniquement sur l'exercice actif : ailleurs ce serait
  // un conseil qu'on ne peut pas appliquer tout de suite.
  const coachHint = isActive
    ? getSetCoaching(
        setEntries,
        exercise.targetReps,
        incrementKg,
        // La virgule décimale est celle qu'on lit partout ailleurs dans l'app —
        // formatWeightForDisplay garde le point parce qu'il sert aussi aux champs
        // de saisie, où la virgule serait rejetée.
        (kg) => `${formatWeightForDisplay(String(kg), weightUnit).replace('.', ',')} ${weightUnitLabel(weightUnit)}`
      )
    : null;
  // La série qui reçoit le conseil : la première pas encore faite. Pendant le
  // repos elle n'est pas encore « courante », d'où l'index calculé à part.
  const coachHintSetIdx = setEntries.findIndex((s) => !s.completed);

  const effectiveRest = customRestSeconds[exercise.id] ?? exercise.restSeconds;
  const restLabel =
    exercise.restMode === 'superset' && exercise.supersetOrder === 1
      ? '↪ enchaîné'
      : exercise.restMode === 'bilateral'
      ? `${exercise.bilateralRestSeconds}s / ${exercise.restSeconds}s`
      : formatRest(effectiveRest);

  const expanded = isActive || allDone || groupActive;
  const stateClass = isActive ? ' is-active exercise-active' : allDone ? ' is-done' : '';

  // Exercice pas encore commencé (ni actif, ni en cours dans un superset) :
  // une ligne compacte, pour que l'exercice en cours reste le seul gros bloc.
  if (!expanded) {
    return (
      <div className={`glass-card sv2-card is-compact${stateClass}`} style={{ padding: '12px 14px', gap: 0, marginBottom: 10, opacity: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ExerciseAnimation exerciseId={exercise.id} size={Math.min(animSize, 40)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="sv2-card-name">{exercise.name}</p>
            <p style={{ fontSize: 12, color: 'var(--h-muted)', marginTop: 2 }}>
              {exercise.muscleGroup.toLowerCase()} · {totalSets} × {exercise.targetReps}
              {completedCount > 0 ? ` · ${completedCount}/${totalSets} faites` : ''}
            </p>
          </div>
          {onSwitchTo && (
            <button onClick={onSwitchTo} className="sv2-switch" title="Faire cet exercice maintenant" aria-label="Faire cet exercice maintenant">Faire</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`glass-card sv2-card${stateClass}`}
      style={{ marginBottom: 12, opacity: allDone && !isActive ? 0.6 : 1 }}
    >
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span className="sv2-eyebrow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exercise.muscleGroup}</span>
          {exercise.isSuperset && (
            <span style={{ borderRadius: 999, padding: '2px 8px', border: '1px solid rgba(var(--brand-1-rgb),0.4)', color: 'var(--brand-1)', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>⟳ {exercise.supersetGroupId?.startsWith('ts-') ? 'TS' : 'SS'}</span>
          )}
        </div>
        {allDone && <span style={{ color: 'var(--h-good)', display: 'inline-flex' }} className="check-pop"><IconCheck size={16} /></span>}
      </div>

      {/* Nom + Animation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ExerciseAnimation exerciseId={exercise.id} size={animSize} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
          <p className="sv2-card-name">{exercise.name}</p>
          {exerciseDeltaLabel && (
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, color: 'var(--h-muted)' }}>{exerciseDeltaLabel}</p>
          )}
          {loadSuggestion && (
            <p style={{
              margin: 0, fontSize: 12.5, fontWeight: 600, lineHeight: 1.35,
              color: loadSuggestion.kind === 'up' ? 'var(--h-good)' : 'var(--h-muted)',
            }}>
              {loadSuggestion.kind === 'up' ? '↑ ' : ''}{loadSuggestion.reason}
            </p>
          )}
        </div>
      </div>

      {/* Objectif, lisible d'un coup d'œil */}
      <div className="sv2-pills">
        {isActive && !allDone && <span className="key">Série {Math.min(completedCount + 1, totalSets)} sur {totalSets}</span>}
        <span className={isActive && !allDone ? 'key' : undefined}>{exercise.targetReps} reps</span>
        <span>{weekData.rir}</span>
        <span>Repos {restLabel}</span>
        {completedCount > 0 && <span className={allDone ? 'good' : undefined}>Fait {completedCount}/{totalSets}</span>}
      </div>

      {/* Séries */}
      <div className="sv2-sets" style={{ display: 'flex', flexDirection: 'column' }}>
        {setEntries.map((entry, idx) => (
          <React.Fragment key={idx}>
            {restBarIndex === idx && restBar}
            <SetRow
              setNumber={idx + 1}
              targetReps={exercise.targetReps}
              defaultWeight={exercise.defaultWeight ?? ''}
              entry={entry}
              isCurrent={isActive && idx === currentSetIndex}
              onComplete={(e) => onSetComplete(idx, e)}
              onEdit={onEditSet ? () => onEditSet(idx) : undefined}
              onWeightStart={onWeightStart ? () => onWeightStart(idx) : undefined}
              lastTime={lastTimeSets?.[idx]}
              previousMaxWeight={previousMaxWeight}
              barKg={barKg}
              coachHint={idx === coachHintSetIdx ? coachHint : null}
              validateSignal={isActive && idx === currentSetIndex ? validateSignal : undefined}
            />
          </React.Fragment>
        ))}
        {restBarIndex === setEntries.length && restBar}
      </div>

      {/* Actions secondaires — seulement si exercice actif */}
      {isActive && !allDone && (onSkipSet || onSkipExercise || onAddSet) && (
        <div className="sv2-secondary">
          {onSkipSet && <button onClick={onSkipSet}>Passer la série</button>}
          {onAddSet && <button onClick={onAddSet} className="plus">+ Série</button>}
          {onSkipExercise && <button onClick={onSkipExercise}>Passer l'exercice</button>}
        </div>
      )}

      {/* Note du coach, repliée par défaut */}
      {exercise.notes && (
        <>
          <button onClick={() => setNotesOpen(!notesOpen)} className="sv2-note-btn" aria-expanded={notesOpen}>
            {notesOpen ? 'Masquer la note' : 'Note du coach'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: notesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {notesOpen && <p className="sv2-note">{exercise.notes}</p>}
        </>
      )}

      {/* Barre de progression des séries */}
      <div className="sv2-setbar">
        {setEntries.map((entry, idx) => (
          <div key={idx} style={{
            background: entry.completed
              ? (entry.reps === '—' ? 'var(--h-hero-line)' : 'var(--h-good)')
              : (isActive && idx === currentSetIndex) ? 'var(--brand-1)' : undefined,
          }} />
        ))}
      </div>
    </div>
  );
};
