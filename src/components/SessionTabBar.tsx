import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DumbbellIcon, ChartIcon } from './NavIcons';

// Barre du bas pendant une seance : meme traitement "verre liquide" que la
// NavBar principale (voir NavBar.tsx), reduite a 2 onglets fixes (pas de
// tiroir +, pas d'epinglage) puisque c'est une mini barre contextuelle.
// D'autres onglets pourront s'ajouter ici plus tard (Leo, juillet 2026).

export type SessionTabId = 'exercise' | 'stats';

interface SessionTabBarProps {
  active: SessionTabId;
  onChange: (tab: SessionTabId) => void;
}

const TABS: { id: SessionTabId; label: string; Icon: React.FC<{ size?: number; filled?: boolean }> }[] = [
  { id: 'exercise', label: 'Exercice', Icon: DumbbellIcon },
  { id: 'stats', label: 'Stats', Icon: ChartIcon },
];

const supportsLiquidRefraction = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isBlink = new RegExp('Chrome|Chromium|Edg/').test(ua);
  return isBlink && !isIOS;
};

export const SessionTabBar: React.FC<SessionTabBarProps> = ({ active, onChange }) => {
  const [refraction, setRefraction] = useState(false);
  useEffect(() => { setRefraction(supportsLiquidRefraction()); }, []);
  const glassRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState(false);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const el = glassRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--gx', x + '%');
    el.style.setProperty('--gy', y + '%');
  }, []);

  return (
    <div style={wrapper}>
      <div
        ref={glassRef}
        onPointerMove={handlePointerMove}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        className={'navbar-glass' + (refraction ? ' navbar-glass-refract' : '')}
        style={{
          ...glass,
          transform: pressed ? 'scale(0.98)' : 'scale(1)',
          transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
          willChange: 'transform',
        }}
      >
        <div style={sheen} />
        <div style={pointerGlow} />
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={tabBtn}
              aria-label={tab.label}
            >
              <span style={{ ...iconWrap, color: isActive ? 'var(--brand-1)' : 'var(--text-muted)' }}>
                <Icon size={22} filled={isActive} />
              </span>
              <span style={{ ...tabLabel, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--brand-1)' : 'var(--text-muted)' }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const wrapper: React.CSSProperties = {
  position: 'fixed',
  left: 0, right: 0,
  bottom: 'max(10px, env(safe-area-inset-bottom))',
  display: 'flex',
  justifyContent: 'center',
  zIndex: 50,
  pointerEvents: 'none',
};

const glass: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  pointerEvents: 'auto',
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  padding: '6px 8px',
  borderRadius: 22,
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  boxShadow: '0 -1px 0 var(--glass-highlight) inset, 0 6px 24px rgba(0,0,0,0.35)',
};

const sheen: React.CSSProperties = {
  position: 'absolute',
  top: 0, left: '8%', right: '8%',
  height: '46%',
  borderRadius: '50% 50% 60% 60% / 100% 100% 30% 30%',
  background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), rgba(255,255,255,0))',
  pointerEvents: 'none',
};

const pointerGlow: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,0.35), transparent 60%)',
  mixBlendMode: 'overlay',
  pointerEvents: 'none',
  opacity: 0.9,
};

const tabBtn: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  padding: '3px 22px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
};

const iconWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'color 0.15s ease, transform 0.18s cubic-bezier(0.34, 1.4, 0.64, 1)',
};

const tabLabel: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: 0.1,
  lineHeight: 1,
  transition: 'color 0.15s ease',
};
