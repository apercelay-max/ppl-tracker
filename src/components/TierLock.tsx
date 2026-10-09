import React from 'react';
import { TIER_NAME, useCanUse, type Tier } from '../lib/subscriptions';
import { openProScreen } from '../lib/proNav';

// Montre son contenu si la formule de la personne le permet ; sinon une carte qui explique
// ce qu'elle débloque, avec un bouton vers l'écran des formules. Hors appli iPhone (web, PWA),
// `useCanUse` répond toujours oui : personne n'y est limité.
interface Props {
  min: Exclude<Tier, 'free'>;
  title: string;
  text: string;
  children: React.ReactNode;
}

export const TierLock: React.FC<Props> = ({ min, title, text, children }) => {
  const allowed = useCanUse(min);
  if (allowed) return <>{children}</>;
  return (
    <div style={box}>
      <p style={tag}>🔒 {TIER_NAME[min].toUpperCase()}</p>
      <p style={head}>{title}</p>
      <p style={body}>{text}</p>
      <button onClick={openProScreen} style={btn}>Voir les formules</button>
    </div>
  );
};

const box: React.CSSProperties = {
  background: 'var(--bg-elevated)', border: '1px dashed var(--border-strong)', borderRadius: 16,
  padding: '16px 16px 14px', marginBottom: 16,
};
const tag: React.CSSProperties = { color: 'var(--brand-1)', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, margin: 0 };
const head: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 15, fontWeight: 800, margin: '6px 0 4px' };
const body: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 12, lineHeight: '17px', margin: '0 0 12px' };
const btn: React.CSSProperties = {
  width: '100%', padding: 11, borderRadius: 12, border: 'none', color: '#fff', fontSize: 13, fontWeight: 800,
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
};
