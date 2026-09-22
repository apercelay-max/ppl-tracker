import React, { useState, useEffect, useRef } from 'react';
import { IconCheck } from './Icons';
import { SetEntry } from '../data/types';
import { useWorkoutStore, useActiveGym } from '../store/workoutStore';
import { formatWeightForDisplay, parseWeightInputToKg, weightUnitLabel, cleanWeightInput, cleanRepsInput, isValidSetInput } from '../utils/weight';
import { solvePlates, nearestAchievable, describePlates, formatKg } from '../utils/plates';
import type { CoachTip } from '../utils/coach';

interface SetRowProps {
  setNumber: number;
  targetReps: string;
  defaultWeight: string;
  entry: SetEntry;
  isCurrent: boolean;
  onComplete: (entry: SetEntry) => void;
  onEdit?: () => void;
  lastTime?: SetEntry;
  // Meilleur poids jamais soulevé sur cet exercice (kg), toutes séances
  // confondues (avant la séance en cours) — sert à animer le bouton
  // valider quand la saisie en cours dépasserait ce record.
  previousMaxWeight?: number;
  // Appelé la 1ère fois que l'utilisateur modifie le poids de la série
  // active, pour démarrer le repos dès la saisie plutôt que d'attendre
  // la validation (✓) — voir SessionScreen.handleWeightEntered.
  onWeightStart?: () => void;
  // Poids de la barre (kg) quand l'exercice se charge sur une barre : active
  // l'aide au chargement des disques sous la série en cours.
  barKg?: number | null;
  // Incrémenté par SessionScreen quand une secousse du téléphone doit valider
  // la série en cours (mains prises) — voir useShakeToValidate.
  validateSignal?: number;
  // Conseil du coach calculé sur la série PRÉCÉDENTE de cet exercice, affiché
  // sur la série en cours — c'est le retour qu'on veut lire juste après avoir
  // reposé la barre. Calculé par ExerciseCard, voir utils/coach.ts.
  coachHint?: CoachTip | null;
}

const parseTargetRange = (targetReps: string): [number, number] | null => {
  const r = targetReps.match(/^(\d+)-(\d+)/); if (r) return [parseInt(r[1]), parseInt(r[2])];
  const p = targetReps.match(/^(\d+)\+/); if (p) return [parseInt(p[1]), 99];
  const s = targetReps.match(/^(\d+)/); if (s) { const n = parseInt(s[1]); return [n, n]; }
  return null;
};

const isRepOutOfRange = (reps: string, targetReps: string): boolean => {
  const r = parseInt(reps); if (isNaN(r)) return false;
  const range = parseTargetRange(targetReps); if (!range) return false;
  return r < range[0] || r > range[1];
};

export const SetRow: React.FC<SetRowProps> = ({
  setNumber, targetReps, defaultWeight, entry, isCurrent, onComplete, onEdit, lastTime, previousMaxWeight, onWeightStart,
  barKg, validateSignal, coachHint,
}) => {
  const weightUnit = useWorkoutStore((s) => s.weightUnit);
  const setWeightUnit = useWorkoutStore((s) => s.setWeightUnit);
  const [weight, setWeight] = useState(formatWeightForDisplay(entry.weight || defaultWeight || (lastTime && lastTime.completed && lastTime.reps !== '—' ? lastTime.weight : '') || '', weightUnit));
  const [reps, setReps] = useState(entry.reps || '');
  // Ne déclenche onWeightStart qu'une fois par série active (reset dès
  // qu'on quitte la série active, ex. après validation ou passage suivant).
  const weightStartFiredRef = useRef(false);
  // Pas d'incrément rapide (boutons − / +) : 2,5 kg est le plus petit
  // saut courant en salle (1,25 kg par côté) ; 5 lbs est l'équivalent
  // usuel côté lbs plutôt qu'une conversion exacte de 2,5 kg.
  const weightStep = weightUnit === 'kg' ? 2.5 : 5;

  useEffect(() => {
    if (!entry.completed) {
      setWeight(formatWeightForDisplay(entry.weight || defaultWeight || (lastTime && lastTime.completed && lastTime.reps !== '—' ? lastTime.weight : '') || '', weightUnit));
      setReps(entry.reps || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.completed, entry.weight, entry.reps, defaultWeight]);

  // Bascule kg/lbs déclenchée depuis ce champ (ou ailleurs, ex. Réglages) :
  // convertit le texte actuellement affiché (même une saisie pas encore
  // validée) au lieu de le re-dériver de `entry`, sinon on perdrait ce que
  // l'utilisateur est en train de taper.
  const prevWeightUnitRef = useRef(weightUnit);
  useEffect(() => {
    if (prevWeightUnitRef.current === weightUnit) return;
    const oldUnit = prevWeightUnitRef.current;
    prevWeightUnitRef.current = weightUnit;
    if (entry.completed) return;
    setWeight((w) => (w.trim() === '' ? w : formatWeightForDisplay(parseWeightInputToKg(w, oldUnit), weightUnit)));
  }, [weightUnit, entry.completed]);

  const handleToggleWeightUnit = () => setWeightUnit(weightUnit === 'kg' ? 'lbs' : 'kg');

  useEffect(() => {
    if (!isCurrent) weightStartFiredRef.current = false;
  }, [isCurrent]);

  const maybeFireWeightStart = () => {
    if (isCurrent && !weightStartFiredRef.current) {
      weightStartFiredRef.current = true;
      onWeightStart?.();
    }
  };

  const handleWeightChange = (value: string) => {
    const cleaned = cleanWeightInput(value);
    setWeight(cleaned);
    if (cleaned.trim() !== '') maybeFireWeightStart();
  };

  // Boutons − / + à côté du champ poids : évite d'ouvrir le clavier pour un
  // ajustement de charge classique pendant une série (mains prises/moites).
  // Part de la valeur actuellement affichée (déjà pré-remplie avec le poids
  // cible), donc marche aussi bien pour affiner que pour partir de zéro.
  const handleWeightStep = (delta: number) => {
    const current = parseFloat((weight || '0').replace(',', '.'));
    const base = isNaN(current) ? 0 : current;
    const next = Math.max(0, Math.round((base + delta) * 10) / 10);
    setWeight(Number.isInteger(next) ? String(next) : next.toFixed(1));
    maybeFireWeightStart();
  };

  const setIsValid = isValidSetInput(weight, reps, weightUnit);
  const handleValidate = () => { if (!setIsValid) return; onComplete({ weight: parseWeightInputToKg(weight, weightUnit), reps, completed: true }); };

  // ── Validation « mains libres » (secousse du téléphone) ────────────────
  // Le champ reps peut être vide : dans ce cas on prend le bas de la
  // fourchette cible, sinon la fonctionnalité serait inutilisable sans
  // toucher l'écran (ce qui est justement le but).
  const firstSignalRef = useRef(validateSignal);
  // Une série pas encore active reçoit validateSignal=undefined ; quand elle
  // le devient (ex. juste après la fin du repos précédent), la prop passe
  // d'un coup à un vrai nombre. Sans ce recalage, l'effet ci-dessous prenait
  // cette simple activation pour une secousse et validait la série toute
  // seule (poids reporté de la précédente) — ce qui relançait aussitôt un
  // nouveau repos en cascade. On réarme donc la référence à chaque passage
  // à l'état actif, avant que l'effet de secousse ne compare.
  useEffect(() => {
    if (isCurrent) firstSignalRef.current = validateSignal;
  }, [isCurrent]);
  useEffect(() => {
    if (validateSignal === undefined || validateSignal === firstSignalRef.current) return;
    firstSignalRef.current = validateSignal;
    if (!isCurrent || entry.completed) return;
    const range = parseTargetRange(targetReps);
    const effectiveReps = reps || (range ? String(range[0]) : '');
    if (!isValidSetInput(weight, effectiveReps, weightUnit)) return;
    onComplete({ weight: parseWeightInputToKg(weight, weightUnit), reps: effectiveReps, completed: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validateSignal]);

  // ── Aide au chargement de la barre ────────────────────────────────────
  // Calculée à partir du matériel réellement présent dans la salle : sans
  // ça, « 42,5 kg » peut être infaisable et on s'en aperçoit devant le rack.
  const gym = useActiveGym();
  const plateHelperEnabled = useWorkoutStore((s) => s.plateHelperEnabled);
  let plateHint: { text: string; warn: boolean } | null = null;
  if (barKg && plateHelperEnabled && isCurrent && !entry.completed) {
    const kg = parseFloat(parseWeightInputToKg(weight, weightUnit));
    if (!isNaN(kg) && kg >= barKg) {
      const solved = solvePlates(kg, barKg, gym.plates);
      if (solved && solved.exact) {
        plateHint = {
          text: solved.perSide.length === 0
            ? `Barre à vide (${formatKg(barKg)} kg)`
            : `Par côté : ${describePlates(solved)}`,
          warn: false,
        };
      } else {
        const { below, above } = nearestAchievable(kg, barKg, gym.plates);
        const options = [below, above].filter((v): v is number => v !== null).map((v) => `${formatKg(v)} kg`);
        plateHint = {
          text: options.length > 0
            ? `${formatKg(kg)} kg impossible ici → ${options.join(' ou ')}`
            : `${formatKg(kg)} kg impossible avec tes disques`,
          warn: true,
        };
      }
    }
  }

  // ── Pulsation "record en vue" sur le bouton valider ─────────────────────
  // Compare en direct (avant validation) le poids en cours de saisie au
  // record perso existant, pour donner un retour visuel immédiat pendant
  // la frappe — indépendant du "Nouveau record !" (bandeau + confettis)
  // qui, lui, se déclenche après validation dans SessionScreen.
  const currentWeightKg = parseFloat(parseWeightInputToKg(weight, weightUnit));
  const isLivePR = isCurrent && !entry.completed && !!reps && !isNaN(currentWeightKg)
    && typeof previousMaxWeight === 'number' && previousMaxWeight > 0 && currentWeightKg > previousMaxWeight;

  // Petit rappel "Dernière fois" affiché sous chaque série, quand on a
  // une donnée exploitable de la séance précédente pour cet exercice.
  const lastTimeHint = lastTime && lastTime.completed && lastTime.reps !== '—'
    ? `Dernière fois : ${lastTime.weight ? formatWeightForDisplay(lastTime.weight, weightUnit) : 'PDC'} ${weightUnitLabel(weightUnit)} × ${lastTime.reps}`
    : null;

  // Badge delta "en direct" vs la dernière fois (comparaison "ghost set") :
  // se met à jour pendant la saisie, avant même de valider la série.
  // Priorité au poids (le signal le plus lu au moment de charger la barre),
  // sinon on retombe sur les reps si le poids est identique.
  let liveDeltaBadge: { text: string; positive: boolean } | null = null;
  if (isCurrent && !entry.completed && reps && lastTime && lastTime.completed && lastTime.reps !== '—' && lastTime.weight) {
    const lastKg = parseFloat(lastTime.weight);
    if (!isNaN(lastKg) && !isNaN(currentWeightKg) && Math.abs(currentWeightKg - lastKg) >= 0.01) {
      const diffKg = currentWeightKg - lastKg;
      const diffDisplay = formatWeightForDisplay(Math.abs(diffKg).toFixed(2), weightUnit);
      liveDeltaBadge = { text: `${diffKg > 0 ? '+' : '−'}${diffDisplay} ${weightUnitLabel(weightUnit)}`, positive: diffKg > 0 };
    } else {
      const lastReps = parseInt(lastTime.reps);
      const curReps = parseInt(reps);
      if (!isNaN(lastReps) && !isNaN(curReps) && curReps !== lastReps) {
        const diffReps = curReps - lastReps;
        liveDeltaBadge = { text: `${diffReps > 0 ? '+' : '−'}${Math.abs(diffReps)} rep${Math.abs(diffReps) > 1 ? 's' : ''}`, positive: diffReps > 0 };
      }
    }
  }

  // Reps − / + : même idée que pour le poids, sans ouvrir le clavier. Un
  // champ vide part du bas de la fourchette cible (la valeur la plus probable).
  const handleRepsStep = (delta: number) => {
    const current = parseInt(reps);
    if (isNaN(current)) {
      const range = parseTargetRange(targetReps);
      setReps(String(range ? range[0] : Math.max(0, delta)));
      return;
    }
    setReps(String(Math.max(0, current + delta)));
  };

  const weightDisplay = (w: string) => (w ? formatWeightForDisplay(w, weightUnit).replace('.', ',') : null);

  // ── Série sautée ──────────────────────────────────────────────────────
  if (entry.completed && entry.reps === '—') {
    return (
      <div className="sv2-setwrap">
        <div className="sv2-set skipped">
          <span className="n">{setNumber}</span>
          <span className="v" style={{ fontStyle: 'italic' }}>Passée</span>
          {onEdit ? <button onClick={onEdit} className="sv2-edit" title="Modifier">Modifier</button> : <span />}
        </div>
      </div>
    );
  }

  // ── Série validée ─────────────────────────────────────────────────────
  if (entry.completed) {
    const outOfRange = isRepOutOfRange(entry.reps, targetReps);
    const w = weightDisplay(entry.weight);
    return (
      <div className="sv2-setwrap">
        <div className={`sv2-set done${outOfRange ? ' warn' : ''}`}>
          <span className="n check-pop">{outOfRange ? '!' : '✓'}</span>
          <span className="v">
            {w ? `${w} ${weightUnitLabel(weightUnit)}` : 'PDC'} × <b className={outOfRange ? 'amber-pulse' : undefined}>{entry.reps}</b>
            {outOfRange && <span style={{ color: 'var(--h-warn)', fontSize: 12, fontWeight: 500 }}> · hors fourchette</span>}
          </span>
          {onEdit ? <button onClick={onEdit} className="sv2-edit" title="Modifier cette série">Modifier</button> : <span />}
        </div>
        {lastTimeHint && <p className="sv2-hint">{lastTimeHint}</p>}
      </div>
    );
  }

  // ── Série future ─────────────────────────────────────────────────────
  if (!isCurrent) {
    return (
      <div className="sv2-setwrap">
        <div className="sv2-set">
          <span className="n">{setNumber}</span>
          <span className="v">À faire</span>
          <span className="t">{targetReps} reps</span>
        </div>
        {/* Pendant le repos, la prochaine série n'est pas encore active : c'est
            pourtant LE moment où le conseil sert, tant qu'on peut encore aller
            changer la charge. */}
        {coachHint && (
          <p className="sv2-hint" style={{ color: COACH_TONE_COLOR[coachHint.tone], fontWeight: 600 }}>
            <span style={{ fontWeight: 800, marginRight: 4 }}>{COACH_TONE_MARK[coachHint.tone]}</span>{coachHint.text}
          </p>
        )}
        {lastTimeHint && <p className="sv2-hint">{lastTimeHint}</p>}
      </div>
    );
  }

  // ── Série active ─────────────────────────────────────────────────────
  // Deux grands blocs Poids / Reps avec − / + au pouce, puis un seul gros
  // bouton pour valider. Les champs restent tapables au clavier.
  return (
    <div className="sv2-setwrap">
      <div className="sv2-set now">
        <span className="n">{setNumber}</span>
        <span className="v">En cours</span>
        <span className="t">{targetReps} reps</span>
      </div>
      <div className="sv2-entry">
        <div className="sv2-steppers">
          <div className="sv2-stepper">
            <span className="sv2-stepper-label">
              <label htmlFor={`sv2-weight-${setNumber}`}>Poids</label>
              <button type="button" onClick={handleToggleWeightUnit} className="sv2-unit" title="Changer l'unité">{weightUnitLabel(weightUnit)}</button>
            </span>
            <input id={`sv2-weight-${setNumber}`} type="text" inputMode="decimal" value={weight}
              onChange={(e) => handleWeightChange(e.target.value)} placeholder="0" onFocus={(e) => e.target.select()} />
            <div className="sv2-stepper-btns">
              <button type="button" onClick={() => handleWeightStep(-weightStep)} aria-label={`Moins ${weightStep} ${weightUnitLabel(weightUnit)}`}>−</button>
              <button type="button" onClick={() => handleWeightStep(weightStep)} aria-label={`Plus ${weightStep} ${weightUnitLabel(weightUnit)}`}>+</button>
            </div>
          </div>
          <div className="sv2-stepper">
            <span className="sv2-stepper-label"><label htmlFor={`sv2-reps-${setNumber}`}>Reps</label></span>
            <input id={`sv2-reps-${setNumber}`} type="text" inputMode="numeric" value={reps}
              onChange={(e) => setReps(cleanRepsInput(e.target.value))} placeholder="–" onFocus={(e) => e.target.select()}
              onKeyDown={(e) => e.key === 'Enter' && handleValidate()} />
            <div className="sv2-stepper-btns">
              <button type="button" onClick={() => handleRepsStep(-1)} aria-label="Une rep de moins">−</button>
              <button type="button" onClick={() => handleRepsStep(1)} aria-label="Une rep de plus">+</button>
            </div>
          </div>
        </div>
        <button
          className={'sv2-validate' + (isLivePR ? ' validate-btn-pr' : '')}
          onClick={handleValidate} disabled={!setIsValid}
          title={isLivePR ? 'Nouveau record en vue !' : undefined}
        >
          <IconCheck size={18} />
          {isLivePR ? 'Valider · record en vue' : reps ? `Valider la série ${setNumber}` : 'Indique tes reps'}
        </button>
        {coachHint && (
          <p style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, color: COACH_TONE_COLOR[coachHint.tone] }}>
            <span style={{ fontWeight: 800, marginRight: 4 }}>{COACH_TONE_MARK[coachHint.tone]}</span>{coachHint.text}
          </p>
        )}
        {plateHint && (
          <p style={{ fontSize: 12, fontWeight: 600, color: plateHint.warn ? 'var(--h-warn)' : 'var(--h-muted)' }}>
            {plateHint.warn ? '⚠ ' : '⚖ '}{plateHint.text}
          </p>
        )}
        {(lastTimeHint || liveDeltaBadge) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            {lastTimeHint && <p style={{ fontSize: 12, color: 'var(--h-muted)' }}>{lastTimeHint}</p>}
            {liveDeltaBadge && (
              <span className="sv2-delta" style={{
                color: liveDeltaBadge.positive ? 'var(--h-good)' : 'var(--h-warn)',
                border: '1px solid ' + (liveDeltaBadge.positive ? 'rgba(108,203,148,0.4)' : 'rgba(232,163,61,0.4)'),
              }}>{liveDeltaBadge.text}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const COACH_TONE_COLOR: Record<CoachTip['tone'], string> = {
  up: 'var(--h-good)', good: 'var(--h-good)', down: 'var(--h-warn)', warn: 'var(--h-warn)', hold: 'var(--h-muted)',
};
const COACH_TONE_MARK: Record<CoachTip['tone'], string> = {
  up: '↑', good: '✓', down: '↓', warn: '⚠', hold: '→',
};
