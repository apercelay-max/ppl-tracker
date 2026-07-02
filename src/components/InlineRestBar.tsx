import React from 'react';

interface InlineRestBarProps {
  secondsLeft: number;
  formattedTime: string;
  progress: number; // 1 -> 0 as time runs out
  finished: boolean;
  nextLabel?: string;
  nextNote?: string;
  onSkip: () => void;
  onReduce: () => void;
  onAdd: () => void;
}

export const InlineRestBar: React.FC<InlineRestBarProps> = ({
  secondsLeft, formattedTime, progress, finished, nextLabel, nextNote, onSkip, onReduce, onAdd,
}) => {
  const accentColor = finished ? '#4CAF50' : secondsLeft > 120 ? '#4CAF50' : secondsLeft > 60 ? '#FF9800' : '#e03030';
  const fillPct = Math.max(0, Math.min(100, (1 - progress) * 100));

  return (
    <div className={`fade-in${finished ? ' rest-bar-blink' : ''}`} style={{ ...wrap, borderColor: `${accentColor}40` }}>
      <div style={{ ...fill, width: `${fillPct}%`, background: accentColor }} />
      <div style={content}>
        <button className="rest-bar-btn" onClick={onReduce} style={smallBtn}>-30s</button>
        <div style={center}>
          <span style={{ ...timeText, color: accentColor }}>{finished ? '0:00' : formattedTime}</span>
          <span style={label}>{finished ? "C'est reparti 💪" : (nextLabel ?? 'Repos')}</span>
        </div>
        <button className="rest-bar-btn" onClick={onAdd} style={smallBtn}>+30s</button>
        <button
          className="rest-bar-btn"
          onClick={onSkip}
          style={{ ...skipBtn, ...(finished ? skipBtnReady : {}) }}
        >
          {finished ? '▶' : '⏭'}
        </button>
      </div>
      {nextNote && (
        <p style={noteText}>💡 {nextNote}</p>
      )}
    </div>
  );
};

const wrap: React.CSSProperties = {
  position: 'relative', overflow: 'hidden',
  background: 'var(--bg-red-tint)', borderRadius: 16,
  border: '1px solid rgba(224,48,48,0.25)',
  marginTop: 2, marginBottom: 10, padding: '10px 10px',
  transition: 'border-color 0.3s',
};
const fill: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0, bottom: 0,
  transition: 'width 1s linear, background 0.3s',
  opacity: 0.14,
};
const content: React.CSSProperties = {
  position: 'relative', display: 'flex', alignItems: 'center', gap: 8,
};
const center: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 };
const timeText: React.CSSProperties = { fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5, transition: 'color 0.3s' };
const label: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textAlign: 'center' };
const smallBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, cursor: 'pointer',
};
const skipBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 11, flexShrink: 0,
  background: 'linear-gradient(135deg, #e03030, #b71c1c)', color: '#fff',
  fontSize: 15, fontWeight: 700, cursor: 'pointer',
  boxShadow: '0 3px 10px rgba(224,48,48,0.3)',
  transition: 'background 0.3s, box-shadow 0.3s',
};
const skipBtnReady: React.CSSProperties = {
  background: 'linear-gradient(135deg, #4CAF50, #2e7d32)',
  boxShadow: '0 3px 14px rgba(76,175,80,0.4)',
};
const noteText: React.CSSProperties = {
  position: 'relative', color: 'var(--text-muted)', fontSize: 11, lineHeight: '15px',
  fontStyle: 'italic', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(224,48,48,0.15)',
};
