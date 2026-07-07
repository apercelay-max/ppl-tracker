import React, { useMemo } from 'react';

interface ConfettiBurstProps {
  /** Nombre de confettis (défaut 24). */
  count?: number;
  /** Couleurs utilisées, piochées au hasard pour chaque confetti. */
  colors?: string[];
}

const DEFAULT_COLORS = ['#e03030', '#9b27af', '#4CAF50', '#5560cc', '#e8a020', '#39c5bb', '#ff3cac'];

// Petite pluie de confettis en CSS pur (voir .confetti-piece / @keyframes
// confettiFall dans index.css) — pas de dépendance externe, pas de canvas,
// juste des <span> positionnés au hasard qui tombent en tournoyant puis
// disparaissent. Le composant ne se retire pas tout seul : c'est au parent
// de le démonter après ~1.5-2s (voir usage dans SessionScreen.tsx), pour
// rester cohérent avec la façon dont prBanner/setTimeout sont déjà gérés
// ailleurs dans le fichier.
export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({ count = 24, colors = DEFAULT_COLORS }) => {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.35,
        duration: 1.1 + Math.random() * 0.9,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 6,
        round: Math.random() > 0.5,
      })),
    [count, colors]
  );

  return (
    <div style={wrap} aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.round ? 1 : 0.4),
            background: p.color,
            borderRadius: p.round ? '50%' : 2,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

const wrap: React.CSSProperties = {
  position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 500,
};
