import React, { useState, useEffect, useRef } from 'react';
import { SetEntry } from '../data/types';
import { useWorkoutStore } from '../store/workoutStore';
import { formatWeightForDisplay, parseWeightInputToKg, weightUnitLabel } from '../utils/weight';

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
}) => {
  const weightUnit = useWorkoutStore((s) => s.weightUnit);
  const setWeightUnit = useWorkoutStore((s) => s.setWeightUnit);
  const [weight, setWeight] = useState(formatWeightForDisplay(entry.weight || defaultWeight || '', weightUnit));
  const [reps, setReps] = useState(entry.reps || '');
  // Ne déclenche onWeightStart qu'une fois par série active (reset dès
  // qu'on quitte la série active, ex. après validation ou passage suivant).
  const weightStartFiredRef = useRef(false);

  useEffect(() => {
    if (!entry.completed) {
      setWeight(formatWeightForDisplay(entry.weight || defaultWeight || '', weightUnit));
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

  const handleWeightChange = (value: string) => {
    setWeight(value);
    if (isCurrent && value.trim() !== '' && !weightStartFiredRef.current) {
      weightStartFiredRef.current = true;
      onWeightStart?.();
    }
  };

  const handleValidate = () => { if (!reps) return; onComplete({ weight: parseWeightInputToKg(weight, weightUnit), reps, completed: true }); };

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

  // ── Série sautée ──────────────────────────────────────────────────────
  if (entry.completed && entry.reps === '—') {
    return (
      <div style={rowWrap}>
        <div style={{ ...rowDone, opacity: 0.45 }}>
          <div style={doneNumBadge}>
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>S</span>
            <span style={{ color: 'var(--text-dim)', fontSize: 13, fontWeight: 800 }}>{setNumber}</span>
          </div>
          <span style={{ flex: 1, color: 'var(--text-dim)', fontSize: 13, fontStyle: 'italic' }}>passée</span>
          {onEdit && <button onClick={onEdit} style={editBtn} title="Modifier">✎</button>}
        </div>
        {lastTimeHint && <p style={lastTimeText}>{lastTimeHint}</p>}
      </div>
    );
  }

  // ── Série validée ─────────────────────────────────────────────────────
  if (entry.completed) {
    const outOfRange = isRepOutOfRange(entry.reps, targetReps);
    return (
      <div style={rowWrap}>
        <div style={rowDone}>
          <div style={doneNumBadge}>
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>S</span>
            <span style={{ color: outOfRange ? '#f5a623' : '#4CAF50', fontSize: 13, fontWeight: 800 }}>{setNumber}</span>
          </div>
          <div style={donePillWeight}>
            <span style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: 0.5 }}>{weightUnitLabel(weightUnit).toUpperCase()}</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: 15 }}>{entry.weight ? formatWeightForDisplay(entry.weight, weightUnit) : '—'}</span>
          </div>
          <div style={{
            ...donePillReps,
            borderColor: outOfRange ? 'rgba(245,166,35,0.3)' : 'rgba(76,175,80,0.2)',
            background: outOfRange ? 'rgba(245,166,35,0.08)' : 'rgba(76,175,80,0.06)',
          }}>
            <span style={{ color: outOfRange ? '#a06a00' : '#3a7a3a', fontSize: 9, letterSpacing: 0.5 }}>REPS</span>
            <span className={outOfRange ? 'amber-pulse' : ''} style={{ color: outOfRange ? '#f5a623' : '#4CAF50', fontWeight: 700, fontSize: 15 }}>
              {entry.reps}
              {outOfRange && <span style={{ fontSize: 9, marginLeft: 2, verticalAlign: 'super' }}>⚠</span>}
            </span>
          </div>
          <span className="check-pop" style={{ color: outOfRange ? '#f5a623' : '#4CAF50', fontSize: 13, width: 20, textAlign: 'center', flexShrink: 0, fontWeight: 700 }}>
            {outOfRange ? '!' : '✓'}
          </span>
          {onEdit && <button onClick={onEdit} style={editBtn} title="Modifier cette série">✎</button>}
        </div>
        {lastTimeHint && <p style={lastTimeText}>{lastTimeHint}</p>}
      </div>
    );
  }

  // ── Série future ─────────────────────────────────────────────────────
  if (!isCurrent) {
    return (
      <div style={rowWrap}>
        <div style={rowPending}>
          <span style={{ color: 'var(--text-micro)', fontSize: 12, fontWeight: 700, width: 22, textAlign: 'center', flexShrink: 0 }}>{setNumber}</span>
          <span style={{ color: 'var(--text-micro)', fontSize: 13 }}>{targetReps} reps</span>
        </div>
        {lastTimeHint && <p style={{ ...lastTimeText, marginLeft: 32 }}>{lastTimeHint}</p>}
      </div>
    );
  }

  // ── Série active ─────────────────────────────────────────────────────
  return (
    <div style={{ ...rowWrap, marginBottom: 2 }}>
      <div style={rowActive}>
        <div style={activeNumBadge}>
          <span style={{ color: 'var(--brand-1)', fontSize: 14, fontWeight: 800 }}>{setNumber}</span>
        </div>
        <div className="input-field" style={inputWrapper}>
          <input style={inputField} type="text" inputMode="decimal" value={weight}
            onChange={(e) => handleWeightChange(e.target.value)} placeholder={weightUnitLabel(weightUnit)} onFocus={(e) => e.target.select()} />
          <button type="button" onClick={handleToggleWeightUnit} style={inputUnitBtn} title="Changer l'unité">{weightUnitLabel(weightUnit)}</button>
        </div>
        <div className="input-field" style={inputWrapper}>
          <input style={inputField} type="text" inputMode="numeric" value={reps}
            onChange={(e) => setReps(e.target.value)} placeholder="Reps" onFocus={(e) => e.target.select()}
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()} />
          <span style={inputUnit}>{targetReps}</span>
        </div>
        <button className={'validate-btn' + (isLivePR ? ' validate-btn-pr' : '')} style={{
          ...validateBtn,
          background: isLivePR
            ? 'linear-gradient(120deg, #ffb21d, #ff7a1d, #ffd93d, #ff9d1d)'
            : reps ? 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' : 'var(--bg-elevated)',
          backgroundSize: isLivePR ? '300% 300%' : undefined,
          cursor: reps ? 'pointer' : 'not-allowed',
          boxShadow: isLivePR ? undefined : (reps ? '0 4px 14px rgba(var(--brand-1-rgb),0.35)' : 'none'),
        }} onClick={handleValidate} disabled={!reps} title={isLivePR ? 'Nouveau record en vue !' : undefined}>✓</button>
      </div>
      {lastTimeHint && <p style={{ ...lastTimeText, marginLeft: 8, marginTop: 4 }}>{lastTimeHint}</p>}
    </div>
  );
};

const rowWrap: React.CSSProperties = { borderBottom: '1px solid var(--border-subtle)', paddingBottom: 4, marginBottom: 2 };
const lastTimeText: React.CSSProperties = { color: 'var(--text-micro)', fontSize: 10, marginTop: 2, marginBottom: 2 };
const rowDone: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 6px 2px' };
const doneNumBadge: React.CSSProperties = { width: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flexShrink: 0 };
const donePillWeight: React.CSSProperties = { flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '5px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 };
const donePillReps: React.CSSProperties = { flex: 1, borderRadius: 10, padding: '5px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, border: '1px solid' };
const editBtn: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-dim)', fontSize: 19, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const rowPending: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 6px 2px' };
const activeNumBadge: React.CSSProperties = { width: 28, height: 28, borderRadius: 8, background: 'rgba(var(--brand-1-rgb),0.12)', border: '1px solid rgba(var(--brand-1-rgb),0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const rowActive: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px', background: 'var(--bg-red-tint)', borderRadius: 12, border: '1px solid #3a1818' };
const inputWrapper: React.CSSProperties = { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', background: 'var(--bg-red-input)', borderRadius: 10, padding: '8px 10px', border: '1px solid rgba(var(--brand-1-rgb),0.2)', transition: 'border-color 0.15s, box-shadow 0.15s', overflow: 'hidden' };
const inputField: React.CSSProperties = { flex: 1, background: 'none', color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, width: 0 };
const inputUnit: React.CSSProperties = { color: 'rgba(var(--brand-1-rgb),0.5)', fontSize: 11, marginLeft: 4, flexShrink: 0, display: 'inline-block', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const inputUnitBtn: React.CSSProperties = { color: 'rgba(var(--brand-1-rgb),0.85)', fontSize: 10, fontWeight: 800, letterSpacing: 0.4, marginLeft: 4, flexShrink: 0, background: 'rgba(var(--brand-1-rgb),0.14)', border: '1px solid rgba(var(--brand-1-rgb),0.35)', borderRadius: 6, padding: '4px 7px', textTransform: 'uppercase' };
const validateBtn: React.CSSProperties = { width: 42, height: 42, borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 800, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s, box-shadow 0.2s, transform 0.1s' };
