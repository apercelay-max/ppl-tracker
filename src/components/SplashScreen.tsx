import React from 'react';

interface SplashScreenProps {
  fadingOut: boolean;
}

// Écran de démarrage : "PPL" en grand + le logo, affiché une fraction de
// seconde à l'ouverture de l'appli avant l'écran d'accueil. Pur CSS (voir
// .splash-letter / .splash-badge / .splash-fade dans index.css) — aucune
// dépendance externe, donc ça reste instantané même hors-ligne.
export const SplashScreen: React.FC<SplashScreenProps> = ({ fadingOut }) => {
  return (
    <div className={`splash-screen${fadingOut ? ' splash-fade' : ''}`} style={wrapper}>
      <div className="splash-badge" style={badge}>
        <span style={{ fontSize: 34 }}>⚡</span>
      </div>
      <div style={lettersRow}>
        {['P', 'P', 'L'].map((letter, i) => (
          <span
            key={i}
            className="splash-letter titre-irise"
            style={{ ...letterStyle, animationDelay: `${i * 0.09}s` }}
          >
            {letter}
          </span>
        ))}
      </div>
      <p className="splash-sub" style={subStyle}>Tracker</p>
    </div>
  );
};

const wrapper: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 999,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-base)',
  gap: 4,
};

const badge: React.CSSProperties = {
  width: 64, height: 64, borderRadius: 'var(--icon-radius)',
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 8px 28px rgba(var(--brand-1-rgb), 0.4)',
  marginBottom: 18,
};

const lettersRow: React.CSSProperties = {
  display: 'flex',
  gap: 2,
};

const letterStyle: React.CSSProperties = {
  fontSize: 64,
  fontWeight: 900,
  letterSpacing: -2,
  lineHeight: 1,
};

const subStyle: React.CSSProperties = {
  color: 'var(--text-dim)',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 4,
  textTransform: 'uppercase',
  marginTop: 6,
};
