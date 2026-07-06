import React from 'react';

export type NavView = 'home' | 'objectifs' | 'dashboard' | 'settings';

interface NavBarProps {
  active: NavView;
  onNavigate: (view: NavView) => void;
}

const TABS: { id: NavView; label: string; emoji: string }[] = [
  { id: 'home', label: 'Accueil', emoji: '🏠' },
  { id: 'objectifs', label: 'Objectifs', emoji: '🎯' },
  { id: 'dashboard', label: 'Stats', emoji: '📊' },
  { id: 'settings', label: 'Réglages', emoji: '⚙️' },
];

// Barre de navigation "liquid glass" (façon iOS 26) : flotte au-dessus du
// contenu, fond translucide + flou, reflet subtil en haut. Uniquement
// affichée quand le réglage est activé, et jamais pendant une séance en
// cours (voir App.tsx) pour ne pas distraire pendant l'entraînement.
export const NavBar: React.FC<NavBarProps> = ({ active, onNavigate }) => {
  return (
    <div style={wrapper}>
      <div style={glass}>
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              style={tabBtn}
              aria-label={tab.label}
            >
              <span
                style={{
                  ...iconPill,
                  background: isActive ? 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' : 'transparent',
                  boxShadow: isActive ? '0 2px 10px rgba(var(--brand-1-rgb), 0.45)' : 'none',
                  transform: isActive ? 'translateY(-1px) scale(1)' : 'scale(0.94)',
                }}
              >
                <span style={{ fontSize: 17, filter: isActive ? 'none' : 'grayscale(0.15)', opacity: isActive ? 1 : 0.75 }}>{tab.emoji}</span>
              </span>
              <span style={{ ...tabLabel, color: isActive ? 'var(--text-primary)' : 'var(--text-dim)', fontWeight: isActive ? 800 : 600 }}>
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
  bottom: 'max(14px, env(safe-area-inset-bottom))',
  display: 'flex',
  justifyContent: 'center',
  zIndex: 50,
  pointerEvents: 'none',
};

const glass: React.CSSProperties = {
  pointerEvents: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '8px 10px',
  borderRadius: 28,
  maxWidth: 420,
  width: 'calc(100% - 32px)',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  boxShadow: '0 -1px 0 var(--glass-highlight) inset, 0 8px 32px rgba(0,0,0,0.35)',
  backdropFilter: 'blur(22px) saturate(180%)',
  WebkitBackdropFilter: 'blur(22px) saturate(180%)',
};

const tabBtn: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 3,
  padding: '4px 2px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
};

const iconPill: React.CSSProperties = {
  width: 34, height: 34,
  borderRadius: 17,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'transform 0.18s cubic-bezier(0.34, 1.4, 0.64, 1), background 0.18s ease, box-shadow 0.18s ease',
};

const tabLabel: React.CSSProperties = {
  fontSize: 9.5,
  letterSpacing: 0.2,
  transition: 'color 0.15s ease',
};
