import React, { useState, useEffect } from 'react';
import { SetEntry } from '../data/types';

interface SetRowProps {
  setNumber: number;
  targetReps: string;
  defaultWeight: string;
  entry: SetEntry;
  isCurrent: boolean;
  onComplete: (entry: SetEntry) => void;
  onEdit?: () => void;
  lastTime?: SetEntry;
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
  setNumber, targetReps, defaultWeight, entry, isCurrent, onComplete, onEdit, lastTime,
}) => {
  const [weight, setWeight] = useState(entry.weight || defaultWeight || '');
  const [reps, setReps] = useState(entry.reps || '');

  useEffect(() => {
    if (!entry.completed) {
      setWeight(entry.weight || defaultWeight || '');
      setReps(entry.reps || '');
    }
  }, [entry.completed, entry.weight, entry.reps, defaultWeight]);

  const handleValidate = () => { if (!reps) return; onComplete({ weight, reps, completed: true }); };

  // Petit rappel "Dernière fois" affiché sous chaque série, quand on a
  // une donnée exploitable de la séance précédente pour cet exercice.
  const lastTimeHint = lastTime && lastTime.completed && lastTime.reps !== '—'
    ? `Dernière fois : ${lastTime.weight || 'PDC'} kg × ${lastTime.reps}`
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
            <span style={{ color: 'var(--text-muted)', fontSize: 9, letterSpacing: 0.5 }}>KG</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: 15 }}>{entry.weight || '—'}</span>
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
            onChange={(e) => setWeight(e.target.value)} placeholder="kg" onFocus={(e) => e.target.select()} />
          <span style={inputUnit}>kg</span>
        </div>
        <div className="input-field" style={inputWrapper}>
          <input style={inputField} type="text" inputMode="numeric" value={reps}
            onChange={(e) => setReps(e.target.value)} placeholder={targetReps} onFocus={(e) => e.target.select()}
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()} />
          <span style={inputUnit}>{targetReps}</span>
        </div>
        <button className="validate-btn" style={{
          ...validateBtn,
          background: reps ? 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' : 'var(--bg-elevated)',
          cursor: reps ? 'pointer' : 'not-allowed',
          boxShadow: reps ? '0 4px 14px rgba(var(--brand-1-rgb),0.35)' : 'none',
        }} onClick={handleValidate} disabled={!reps}>✓</button>
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
const inputWrapper: React.CSSProperties = { flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-red-input)', borderRadius: 10, padding: '8px 10px', border: '1px solid rgba(var(--brand-1-rgb),0.2)', transition: 'border-color 0.15s, box-shadow 0.15s' };
const inputField: React.CSSProperties = { flex: 1, background: 'none', color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, width: 0 };
const inputUnit: React.CSSProperties = { color: 'rgba(var(--brand-1-rgb),0.5)', fontSize: 11, marginLeft: 4, flexShrink: 0 };
const validateBtn: React.CSSProperties = { width: 42, height: 42, borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 800, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s, box-shadow 0.2s, transform 0.1s' };
