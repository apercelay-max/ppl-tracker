import React from 'react';

interface SessionRestBigProps {
  secondsLeft: number;
  formattedTime: string;
  progress: number;
  finished: boolean;
  nextLabel?: string;
  nextNote?: string;
  onSkip: () => void;
  onReduce: () => void;
  onAdd: () => void;
}

export const SessionRestBig: React.FC<SessionRestBigProps> = ({
  secondsLeft, formattedTime, progress, finished, nextLabel, nextNote, onSkip, onReduce, onAdd,
}) => {
  const usesBrand = !finished && progress > 0.5;
  const accentColor = finished ? '#4CAF50' : usesBrand ? 'var(--brand-1)' : progress > 0.25 ? '#FF9800' : '#e03030';
  const fillPct = Math.max(0, Math.min(100, progress * 100));

  return (
    <div style={scrollArea}>
      <div style={inner}>
        <p style={screenTitle}>REPOS EN COURS</p>
        <div style={{ ...timeCard, borderColor: accentColor + '55' }}>
          <p style={{ ...bigTime, color: accentColor }}>{finished ? '0:00' : formattedTime}</p>
          <p style={nextLabelStyle}>{finished ? 'On repart !' : (nextLabel ?? 'Repos')}</p>
          <div style={track}>
            <div style={{ ...fillBar, width: fillPct + '%', background: accentColor }} />
          </div>
        </div>
        {nextNote && (
          <div style={noteCard}>
            <p style={noteText}>{nextNote}</p>
          </div>
        )}
        <div style={btnRow}>
          <button onClick={onReduce} style={sideBtn}>-30s</button>
          <button
            onClick={onSkip}
            style={{ ...skipBtnBig, ...(finished ? skipBtnBigReady : {}) }}
          >
            {finished ? 'Continuer' : 'Passer le repos'}
          </button>
          <button onClick={onAdd} style={sideBtn}>+30s</button>
        </div>
      </div>
    </div>
  );
};

const scrollArea: React.CSSProperties = { flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const inner: React.CSSProperties = { maxWidth: 480, width: '100%', margin: '0 auto', padding: '16px 16px 100px' };
const screenTitle: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, marginBottom: 18, textAlign: 'center' };
const timeCard: React.CSSProperties = { background: 'var(--bg-card)', border: '2px solid var(--border-mid)', borderRadius: 24, padding: '36px 20px', marginBottom: 16, textAlign: 'center' };
const bigTime: React.CSSProperties = { fontSize: 76, fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: -1, lineHeight: 1, marginBottom: 10 };
const nextLabelStyle: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: 15, fontWeight: 600, marginBottom: 18 };
const track: React.CSSProperties = { height: 10, background: 'var(--bg-elevated)', borderRadius: 5, overflow: 'hidden' };
const fillBar: React.CSSProperties = { height: '100%', borderRadius: 5, transition: 'width 1s linear, background 0.3s' };
const noteCard: React.CSSProperties = { background: 'var(--bg-gold-tint)', border: '1px solid var(--border-gold-tint)', borderRadius: 16, padding: '12px 16px', marginBottom: 16 };
const noteText: React.CSSProperties = { color: 'var(--text-gold-body)', fontSize: 13, lineHeight: '18px' };
const btnRow: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center' };
const sideBtn: React.CSSProperties = { width: 64, height: 52, borderRadius: 14, flexShrink: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const skipBtnBig: React.CSSProperties = { flex: 1, height: 52, borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', fontSize: 15, fontWeight: 700, cursor: 'pointer' };
const skipBtnBigReady: React.CSSProperties = { background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))', border: '1px solid transparent', color: '#fff' };
