import React from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import type { DotAnimation, DotDensity, DotSize } from '../store/workoutStore';
import { LiquidPill } from './LiquidPill';

// Réglages du style « Points » (Réglages → Apparence → Style de l'interface) : densité,
// taille des points et animation. Affichés seulement quand ce style est choisi.
const DENSITIES: { id: DotDensity; label: string; hint: string }[] = [
  { id: 'minimal', label: 'Minimaliste', hint: 'Titres et gros chiffres' },
  { id: 'complet', label: 'Ultra complet', hint: 'Un maximum de textes' },
];
const SIZES: { id: DotSize; label: string }[] = [
  { id: 'm', label: 'Moyens' },
  { id: 'l', label: 'Gros' },
  { id: 'xl', label: 'Très gros' },
];
const ANIMS: { id: DotAnimation; label: string }[] = [
  { id: 'none', label: 'Aucune' },
  { id: 'pop', label: 'Apparition' },
  { id: 'scan', label: 'Balayage' },
  { id: 'pulse', label: 'Pulsation' },
  { id: 'wave', label: 'Vague' },
  { id: 'ripple', label: 'Ondes' },
  { id: 'twinkle', label: 'Étincelles' },
];

export const DotSettings: React.FC = () => {
  const density = useWorkoutStore((s) => s.dotDensity);
  const size = useWorkoutStore((s) => s.dotSize);
  const anim = useWorkoutStore((s) => s.dotAnimation);
  const setDensity = useWorkoutStore((s) => s.setDotDensity);
  const setSize = useWorkoutStore((s) => s.setDotSize);
  const setAnim = useWorkoutStore((s) => s.setDotAnimation);

  return (
    <div style={{ marginTop: 4 }}>
      <p style={label}>DENSITÉ DES POINTS</p>
      <LiquidPill style={pill} role="group" aria-label="Densité des points">
        {DENSITIES.map((o) => (
          <button key={o.id} onClick={() => setDensity(o.id)} aria-pressed={density === o.id} title={o.hint} style={{ ...btn, ...(density === o.id ? btnOn : {}) }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{o.label}</span>
            <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.8 }}>{o.hint}</span>
          </button>
        ))}
      </LiquidPill>

      <p style={label}>TAILLE DES POINTS</p>
      <LiquidPill style={pill} role="group" aria-label="Taille des points">
        {SIZES.map((o) => (
          <button key={o.id} onClick={() => setSize(o.id)} aria-pressed={size === o.id} style={{ ...btn, ...(size === o.id ? btnOn : {}) }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{o.label}</span>
          </button>
        ))}
      </LiquidPill>

      <p style={label}>ANIMATION DES POINTS</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} role="group" aria-label="Animation des points">
        {ANIMS.map((o) => (
          <button key={o.id} onClick={() => setAnim(o.id)} aria-pressed={anim === o.id} style={{ ...chip, ...(anim === o.id ? chipOn : {}) }}>
            {o.label}
          </button>
        ))}
      </div>
      <p style={note}>Pendant la séance, les points du texte restent posés pour ne jamais gêner la lecture.</p>
    </div>
  );
};

const label: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginTop: 14, marginBottom: 6 };
const pill: React.CSSProperties = { display: 'flex', gap: 2, padding: 3, background: 'var(--bg-elevated)', borderRadius: 12 };
const btn: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  padding: '8px 4px', borderRadius: 9, cursor: 'pointer', color: 'var(--text-dim)', background: 'transparent',
  transition: 'color 0.15s ease',
};
const btnOn: React.CSSProperties = { color: 'var(--text-primary)' };
const chip: React.CSSProperties = {
  padding: '7px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  background: 'var(--bg-elevated)', color: 'var(--text-dim)', border: '1px solid var(--border)',
};
const chipOn: React.CSSProperties = { background: 'rgba(var(--brand-1-rgb), 0.16)', color: 'var(--brand-1)', borderColor: 'var(--brand-1)' };
const note: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, marginTop: 8, lineHeight: '15px' };
