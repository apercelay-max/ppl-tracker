import React, { useState, useEffect } from 'react';
import { useSessionChrono } from '../hooks/useSessionChrono';
import { useHeartRate } from '../hooks/useHeartRate';

interface Props {
  startTime: number;
  compact?: boolean; // true = mobile bottom bar, false = desktop side panel
}

// Calories: Keytel formula (male ~47y), or ~5.5 kcal/min for strength training
const estCal = (ms: number, hr: number | null): number => {
  const min = ms / 60000;
  if (hr && hr > 50) return Math.max(0, Math.round((0.074 * hr - 6.5) * min));
  return Math.round(5.5 * min);
};

const clock = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const StatsPanel: React.FC<Props> = ({ startTime, compact }) => {
  const { elapsed, formatted: chrono } = useSessionChrono(startTime);
  const { hr, status, connect, disconnect, isSupported, error } = useHeartRate();
  const [time, setTime] = useState(clock);

  useEffect(() => {
    const id = setInterval(() => setTime(clock()), 15000);
    return () => clearInterval(id);
  }, []);

  const cal = estCal(elapsed, hr);
  const connected = status === 'connected';
  const connecting = status === 'connecting';
  const hrColor = hr ? (hr > 170 ? '#f44336' : hr > 145 ? '#ff9800' : '#ff6b6b') : '#555';

  // Mobile compact bar
  if (compact) {
    return (
      <div style={bar}>
        <MiniStat icon="⏱" value={chrono} color="#4CAF50" />
        <div style={sep} />
        <MiniStat icon="🕐" value={time} />
        <div style={sep} />
        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            cursor: isSupported ? 'pointer' : 'default' }}
          onClick={isSupported ? (connected ? disconnect : connect) : undefined}
        >
          <span style={{ fontSize: 14, lineHeight: 1, opacity: isSupported ? 1 : 0.3 }}>❤️</span>
          <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            color: connected ? hrColor : isSupported ? '#4a4a4a' : '#333' }}>
            {connecting ? '…' : hr ? `${hr}` : isSupported ? '–' : '—'}
          </span>
        </div>
        <div style={sep} />
        <MiniStat icon="🔥" value={`${cal}`} />
      </div>
    );
  }

  // Desktop side panel
  return (
    <div style={sidePanel}>
      <Block label="DURÉE">
        <p style={{ ...bigNum, color: '#4CAF50' }}>{chrono}</p>
      </Block>
      <Block label="HEURE">
        <p style={bigNum}>{time}</p>
      </Block>
      <Block label="FRÉQUENCE CARDIAQUE">
        {connected ? (
          <>
            <p style={{ ...bigNum, color: hrColor, marginBottom: 10 }}>
              {hr ?? '–'} <span style={{ fontSize: 14, color: '#555' }}>bpm</span>
            </p>
            <button style={smallBtn} onClick={disconnect}>Déconnecter</button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 20, color: '#333', fontWeight: 200, marginBottom: 10 }}>
              {connecting ? 'Connexion…' : '–'}
            </p>
            <button
              style={{
                ...smallBtn,
                ...(isSupported
                  ? { color: '#4CAF50', borderColor: '#1a3a1a', background: '#0a150a' }
                  : { opacity: 0.35, cursor: 'not-allowed' }),
              }}
              onClick={isSupported ? connect : undefined}
              disabled={connecting || !isSupported}
            >
              {!isSupported ? '⚠ iOS non supporté' : connecting ? 'Connexion…' : '❤️ Connecter HRM'}
            </button>
            {error && <p style={{ color: '#f66', fontSize: 11, marginTop: 6 }}>{error}</p>}
          </>
        )}
      </Block>
      <Block label="CALORIES">
        <p style={bigNum}>
          {cal} <span style={{ fontSize: 14, color: '#555' }}>kcal</span>
        </p>
        <p style={{ color: '#2a2a2a', fontSize: 10, marginTop: 4 }}>
          {hr ? 'basé sur FC' : 'estimation ~5.5/min'}
        </p>
      </Block>
    </div>
  );
};

const MiniStat = ({ icon, value, color = '#bbb' }: { icon: string; value: string; color?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
    <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
    <span style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
  </div>
);

const Block = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 28 }}>
    <p style={lbl}>{label}</p>
    {children}
  </div>
);

const bar: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-evenly', alignItems: 'center',
  padding: '10px 8px',
  paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
  background: '#080808', borderTop: '1px solid #1a1a1a',
  flexShrink: 0,
};
const sep: React.CSSProperties = { width: 1, height: 28, background: '#1e1e1e', flexShrink: 0 };
const sidePanel: React.CSSProperties = {
  width: 200, flexShrink: 0,
  background: '#070707', borderLeft: '1px solid #161616',
  padding: '16px 18px 20px',
  overflowY: 'auto',
  display: 'flex', flexDirection: 'column',
};
const lbl: React.CSSProperties = {
  color: '#2e2e2e', fontSize: 9, fontWeight: 700, letterSpacing: 2, marginBottom: 8,
};
const bigNum: React.CSSProperties = {
  fontSize: 30, fontWeight: 200, color: '#ddd',
  fontVariantNumeric: 'tabular-nums', letterSpacing: -1, lineHeight: 1,
};
const smallBtn: React.CSSProperties = {
  background: '#111', border: '1px solid #1e1e1e', borderRadius: 10,
  padding: '8px 12px', color: '#555', fontSize: 11, cursor: 'pointer',
  width: '100%',
};
