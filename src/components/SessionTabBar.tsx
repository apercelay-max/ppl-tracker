import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DumbbellIcon, ChartIcon, ListIcon, TimerIcon } from './NavIcons';

// Barre du bas pendant une seance : meme traitement "verre liquide" que la
// NavBar principale (voir NavBar.tsx), reduite a 2 onglets fixes (pas de
// tiroir +, pas d'epinglage) puisque c'est une mini barre contextuelle.
// D'autres onglets pourront s'ajouter ici plus tard (Leo, juillet 2026).

export type SessionTabId = 'exercise' | 'stats' | 'programme' | 'repos';

interface SessionTabBarProps {
  active: SessionTabId;
  onChange: (tab: SessionTabId) => void;
  restActive: boolean;
  // Contrôles de séance, à droite de la capsule : vert = pause / reprise,
  // rouge = arrêter. Ils remplacent l'ancienne flèche retour de l'en-tête.
  isPaused: boolean;
  onTogglePause: () => void;
  onStop: () => void;
}

const BASE_TABS: { id: SessionTabId; label: string; Icon: React.FC<{ size?: number; filled?: boolean }> }[] = [
  { id: 'exercise', label: 'Exercice', Icon: DumbbellIcon },
  { id: 'programme', label: 'Programme', Icon: ListIcon },
  { id: 'stats', label: 'Stats', Icon: ChartIcon },
];

const supportsLiquidRefraction = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isBlink = new RegExp('Chrome|Chromium|Edg/').test(ua);
  return isBlink && !isIOS;
};

export const SessionTabBar: React.FC<SessionTabBarProps> = ({ active, onChange, restActive, isPaused, onTogglePause, onStop }) => {
  const [refraction, setRefraction] = useState(false);
  useEffect(() => { setRefraction(supportsLiquidRefraction()); }, []);
  const glassRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState(false);
  const tabs = restActive ? [...BASE_TABS, { id: 'repos' as SessionTabId, label: 'Repos', Icon: TimerIcon }] : BASE_TABS;

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
      <div style={barRow}>
      <div
        ref={glassRef}
        onPointerMove={handlePointerMove}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        className={'navbar-glass nav-capsule' + (refraction ? ' navbar-glass-refract' : '')}
        style={{
          ...glass,
          transform: pressed ? 'scale(0.98)' : 'scale(1)',
          transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
          willChange: 'transform',
        }}
      >
        <div style={sheen} />
        <div style={pointerGlow} />
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={isActive ? 'nav-tab-active' : undefined}
              style={tabBtn}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span style={{ ...iconWrap, color: isActive ? 'var(--brand-1)' : 'var(--text-muted)' }}>
                <Icon size={22} filled={isActive} />
              </span>
              <span style={{ ...tabLabel, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--brand-1)' : 'var(--text-muted)' }}>
                {tab.label}
              </span>
              <span style={{ ...tabDot, background: isActive ? 'var(--brand-1)' : 'transparent' }} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <button
        onClick={onTogglePause}
        style={pauseBtn}
        aria-label={isPaused ? 'Reprendre la séance' : 'Mettre la séance en pause'}
        title={isPaused ? 'Reprendre la séance' : 'Mettre la séance en pause'}
      >
        {isPaused ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.6c0-.9 1-1.5 1.8-1L18 11.1a1.1 1.1 0 0 1 0 1.8L9.8 19.4c-.8.5-1.8-.1-1.8-1V5.6Z" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6.5" y="5" width="4" height="14" rx="1.4" />
            <rect x="13.5" y="5" width="4" height="14" rx="1.4" />
          </svg>
        )}
      </button>

      <button onClick={onStop} style={stopBtn} aria-label="Arrêter la séance" title="Arrêter la séance">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="5" y="5" width="14" height="14" rx="2.4" />
        </svg>
      </button>
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

// Même rangée que la NavBar de l'accueil : la capsule prend la place qui
// reste, les deux boutons de séance sont posés à côté.
const barRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  gap: 8,
  maxWidth: 460,
  width: 'calc(100% - 24px)',
  pointerEvents: 'none',
};

// Fond et ombres dans .nav-capsule (index.css), comme pour la NavBar.
const glass: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  pointerEvents: 'auto',
  zIndex: 2,
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  gap: 3,
  padding: '6px 8px',
  borderRadius: 999,
  border: '1px solid var(--glass-border)',
};

// Vert = pause / reprise. Rond, comme le bouton de lancement de l'accueil.
const pauseBtn: React.CSSProperties = {
  pointerEvents: 'auto',
  flex: '0 0 auto',
  width: 52,
  borderRadius: 999,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#fff', cursor: 'pointer',
  background: 'linear-gradient(150deg, #34c06a, #1e8f4a)',
  boxShadow: '0 10px 24px rgba(40,180,100,0.42), inset 0 1px 0 rgba(255,255,255,0.3)',
};

// Rouge = arrêter. Carré (arrondi) pour qu'on ne le confonde jamais avec le
// bouton vert au toucher, même sans regarder.
const stopBtn: React.CSSProperties = {
  pointerEvents: 'auto',
  flex: '0 0 auto',
  width: 52,
  borderRadius: 18,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#fff', cursor: 'pointer',
  background: 'linear-gradient(150deg, #e0453a, #b8231d)',
  boxShadow: '0 10px 24px rgba(224,69,58,0.42), inset 0 1px 0 rgba(255,255,255,0.3)',
};

const tabDot: React.CSSProperties = {
  width: 4, height: 4, borderRadius: '50%', marginTop: 1,
  transition: 'background 0.15s ease',
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
  padding: '5px 14px 4px',
  borderRadius: 999,
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
