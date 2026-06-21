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

  if (entry.completed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 4px', opacity: 0.45 }}>
        <span style={setNumStyle}>{setNumber}</span>
        <span style={valuePill}>{entry.weight || '—'} kg</span>
        <span style={valuePill}>{entry.reps} reps</span>
        <span className="check-pop" style={{ color: '#4CAF50', fontSize: 16, fontWeight: 800, width: 32, textAlign: 'center' }}>✓</span>
      </div>
    );
  }

  if (!isCurrent) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 4px', opacity: 0.2 }}>
        <span style={{ ...setNumStyle, color: '#333' }}>{setNumber}</span>
        <span style={{ color: '#333', fontSize: 13 }}>{targetReps} reps</span>
      </div>
    );
  }

  return (
    <div style={rowActive}>
      <span style={{ ...setNumStyle, color: '#fff', fontSize: 14 }}>{setNumber}</span>
      <div className="input-field" style={inputWrapper}>
        <input style={inputField} type="text" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="kg" onFocus={(e) => e.target.select()} />
        <span style={inputUnit}>kg</span>
      </div>
      <div className="input-field" style={inputWrapper}>
        <input style={inputField} type="text" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} placeholder={targetReps} onFocus={(e) => e.target.select()} onKeyDown={(e) => e.key === 'Enter' && handleValidate()} />
        <span style={inputUnit}>reps</span>
      </div>
      <button className="validate-btn" style={{ ...validateBtn, background: reps ? '#4CAF50' : '#1e1e1e', cursor: reps ? 'pointer' : 'not-allowed', boxShadow: reps ? '0 4px 14px rgba(76,175,80,0.3)' : 'none' }} onClick={handleValidate} disabled={!reps}>✓</button>
    </div>
  );
};

const setNumStyle: React.CSSProperties = { width: 22, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#555', flexShrink: 0 };
const valuePill: React.CSSProperties = { flex: 1, background: '#1a1a1a', borderRadius: 8, padding: '5px 10px', textAlign: 'center', fontSize: 13, color: '#777' };
const rowActive: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px', background: 'linear-gradient(135deg, #161616, #131313)', borderRadius: 12, border: '1px solid #252525', marginBottom: 2 };
const inputWrapper: React.CSSProperties = { flex: 1, display: 'flex', alignItems: 'center', background: '#1e1e1e', borderRadius: 10, padding: '8px 10px', border: '1px solid #2a2a2a', transition: 'border-color 0.15s, box-shadow 0.15s' };
const inputField: React.CSSProperties = { flex: 1, background: 'none', color: '#fff', fontSize: 16, fontWeight: 600, width: 0 };
const inputUnit: React.CSSProperties = { color: '#444', fontSize: 11, marginLeft: 4 };
const validateBtn: React.CSSProperties = { width: 42, height: 42, borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 800, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s, box-shadow 0.2s, transform 0.1s' };
