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

export const SetRow: React.FC<SetRowProps> = ({
  setNumber, targetReps, defaultWeight, entry, isCurrent, onComplete,
}) => {
  const [weight, setWeight] = useState(entry.weight || defaultWeight || '');
  const [reps, setReps] = useState(entry.reps || '');

  const handleValidate = () => {
    if (!reps) return;
    onComplete({ weight, reps, completed: true });
  };

  // ── Série validée ────────────────────────────────────────────────────────
  if (entry.completed) {
    return (
      <div style={{ ...rowBase, opacity: 0.45 }}>
        <span style={setNum}>{setNumber}</span>
        <span style={valuePill}>{entry.weight || '—'} kg</span>
        <span style={valuePill}>{entry.reps} reps</span>
        <span style={{ color: '#4CAF50', fontSize: 16, fontWeight: 800, width: 28, textAlign: 'center' }}>✓</span>
      </div>
    );
  }

  // ── Série future ─────────────────────────────────────────────────────────
  if (!isCurrent) {
    return (
      <div style={{ ...rowBase, opacity: 0.25 }}>
        <span style={{ ...setNum, color: '#666' }}>{setNumber}</span>
        <span style={{ color: '#555', fontSize: 13 }}>{targetReps} reps</span>
      </div>
    );
  }

  // ── Série active ─────────────────────────────────────────────────────────
  return (
    <div style={rowActive}>
      <span style={{ ...setNum, color: '#fff' }}>{setNumber}</span>

      {/* Poids */}
      <div style={inputWrapper}>
        <input
          style={inputField}
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="kg"
          onFocus={(e) => e.target.select()}
        />
        <span style={inputUnit}>kg</span>
      </div>

      {/* Reps */}
      <div style={inputWrapper}>
        <input
          style={inputField}
          type="text"
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder={targetReps}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
        />
        <span style={inputUnit}>reps</span>
      </div>

      {/* Valider */}
      <button
        style={{ ...validateBtn, ...(reps ? {} : validateBtnDisabled) }}
        onClick={handleValidate}
        disabled={!reps}
      >
        ✓
      </button>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const rowBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '8px 4px',
};
const setNum: React.CSSProperties = {
  width: 22, textAlign: 'center', fontSize: 13, fontWeight: 700,
  color: '#555', flexShrink: 0,
};
const valuePill: React.CSSProperties = {
  flex: 1, background: '#1a1a1a', borderRadius: 8,
  padding: '5px 10px', textAlign: 'center', fontSize: 13, color: '#777',
};
const rowActive: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 6px',
  background: '#161616', borderRadius: 10,
  border: '1px solid #2a2a2a', marginBottom: 2,
};
const inputWrapper: React.CSSProperties = {
  flex: 1, display: 'flex', alignItems: 'center',
  background: '#1e1e1e', borderRadius: 8,
  padding: '6px 10px', border: '1px solid #333',
};
const inputField: React.CSSProperties = {
  flex: 1, background: 'none', color: '#fff',
  fontSize: 15, fontWeight: 600, width: 0,
};
const inputUnit: React.CSSProperties = { color: '#555', fontSize: 11, marginLeft: 4 };
const validateBtn: React.CSSProperties = {
  width: 40, height: 40, background: '#4CAF50',
  borderRadius: 10, color: '#fff', fontSize: 16, fontWeight: 800,
  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const validateBtnDisabled: React.CSSProperties = { background: '#222', cursor: 'not-allowed' };
