import React, { useState } from 'react';
import { SetEntry } from '../data/types';

interface SetRowProps {
  setNumber: number;
  targetReps: string;
  defaultWeight: string;
  entry: SetEntry;
  isCurrent: boolean;
  onComplete: (entry: SetEntry) => void;
}

// Parse "8-10" → [8,10] | "10" → [10,10] | "10+" → [10,99] | otherwise → null
const parseTargetRange = (targetReps: string): [number, number] | null => {
  const rangeMatch = targetReps.match(/^(\d+)-(\d+)/);
  if (rangeMatch) return [parseInt(rangeMatch[1]), parseInt(rangeMatch[2])];
  const plusMatch = targetReps.match(/^(\d+)\+/);
  if (plusMatch) return [parseInt(plusMatch[1]), 99];
  const singleMatch = targetReps.match(/^(\d+)/);
  if (singleMatch) { const n = parseInt(singleMatch[1]); return [n, n]; }
  return null;
};

const isRepOutOfRange = (reps: string, targetReps: string): boolean => {
  const r = parseInt(reps);
  if (isNaN(r)) return false;
  const range = parseTargetRange(targetReps);
  if (!range) return false;
  return r < range[0] || r > range[1];
};

export const SetRow: React.FC<SetRowProps> = ({
  setNumber, targetReps, defaultWeight, entry, isCurrent, onComplete,
}) => {
  const [weight, setWeight] = useState(entry.weight || defaultWeight || '');
  const [reps, setReps] = useState(entry.reps || '');

  const handleValidate = () => {
    if (!reps) return;
    onComplete({ weight, reps, completed: true });
  };

  if (entry.completed) {
    const outOfRange = isRepOutOfRange(entry.reps, targetReps);
    return (
      <div style={rowDone}>
        <div style={doneNumBadge}>
          <span style={{ color: '#555', fontSize: 10 }}>S</span>
          <span style={{ color: outOfRange ? '#f5a623' : '#4CAF50', fontSize: 13, fontWeight: 800 }}>{setNumber}</span>
        </div>
        <div style={donePillWeight}>
          <span style={{ color: '#555', fontSize: 9, letterSpacing: 0.5 }}>KG</span>
          <span style={{ color: '#ccc', fontWeight: 700, fontSize: 15 }}>{entry.weight || '—'}</span>
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
      </div>
    );
  }

  if (!isCurrent) {
    return (
      <div style={rowPending}>
        <span style={{ color: '#252528', fontSize: 12, fontWeight: 700, width: 22, textAlign: 'center', flexShrink: 0 }}>{setNumber}</span>
        <span style={{ color: '#252528', fontSize: 13 }}>{targetReps} reps</span>
      </div>
    );
  }

  return (
    <div style={rowActive}>
      <div style={activeNumBadge}>
        <span style={{ color: '#e03030', fontSize: 14, fontWeight: 800 }}>{setNumber}</span>
      </div>
      <div className="input-field" style={inputWrapper}>
        <input style={inputField} type="text" inputMode="decimal" value={weight}
          onChange={(e) => setWeight(e.target.value)} placeholder="kg" onFocus={(e) => e.target.select()} />
        <span style={inputUnit}>kg</span>
      </div>
      <div className="input-field" style={inputWrapper}>
        <input style={inputField} type="text" inputMode="numeric" value={reps}
          onChange={(e) => setReps(e.target.value)} placeholder={targetReps}
          onFocus={(e) => e.target.select()} onKeyDown={(e) => e.key === 'Enter' && handleValidate()} />
        <span style={inputUnit}>{targetReps}</span>
      </div>
      <button className="validate-btn" style={{
        ...validateBtn,
        background: reps ? 'linear-gradient(135deg, #e03030, #b71c1c)' : '#1c1c1f',
        cursor: reps ? 'pointer' : 'not-allowed',
        boxShadow: reps ? '0 4px 14px rgba(224,48,48,0.35)' : 'none',
      }} onClick={handleValidate} disabled={!reps}>✓</button>
    </div>
  );
};

const rowDone: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 6px', borderBottom: '1px solid #18181b' };
const doneNumBadge: React.CSSProperties = { width: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flexShrink: 0 };
const donePillWeight: React.CSSProperties = { flex: 1, background: '#18181b', border: '1px solid #242428', borderRadius: 10, padding: '5px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 };
const donePillReps: React.CSSProperties = { flex: 1, borderRadius: 10, padding: '5px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, border: '1px solid' };
const rowPending: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 6px' };
const activeNumBadge: React.CSSProperties = { width: 28, height: 28, borderRadius: 8, background: 'rgba(224,48,48,0.12)', border: '1px solid rgba(224,48,48,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const rowActive: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px', background: 'linear-gradient(135deg, #1a0c0c, #160a0a)', borderRadius: 12, border: '1px solid #3a1818', marginBottom: 2 };
const inputWrapper: React.CSSProperties = { flex: 1, display: 'flex', alignItems: 'center', background: '#1e1010', borderRadius: 10, padding: '8px 10px', border: '1px solid #2e1818', transition: 'border-color 0.15s, box-shadow 0.15s' };
const inputField: React.CSSProperties = { flex: 1, background: 'none', color: '#fff', fontSize: 16, fontWeight: 600, width: 0 };
const inputUnit: React.CSSProperties = { color: '#5a3030', fontSize: 11, marginLeft: 4, flexShrink: 0 };
const validateBtn: React.CSSProperties = { width: 42, height: 42, borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 800, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s, box-shadow 0.2s, transform 0.1s' };
