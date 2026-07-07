import React, { useMemo } from 'react';

export type UltraEffectStyle = 'confetti' | 'fireworks' | 'sparkles';

interface ConfettiBurstProps {
  /** Nombre de particules (défaut 24). */
  count?: number;
  /** Couleurs utilisées, piochées au hasard pour chaque particule (confettis/feu d'artifice). */
  colors?: string[];
  /** Style visuel de l'effet — voir Réglages → Personnalisation → Ultra animations. */
  style?: UltraEffectStyle;
}

const DEFAULT_COLORS = ['#e03030', '#9b27af', '#4CAF50', '#5560cc', '#e8a020', '#39c5bb', '#ff3cac'];

type ConfettiPiece = { id: number; left: number; delay: number; duration: number; color: string; size: number; round: boolean };
type FireworkPiece = { id: number; fx: number; fy: number; delay: number; duration: number; color: string; size: number };
type SparklePiece = { id: number; left: number; top: number; delay: number; duration: number; size: number };

// Petit effet visuel en CSS pur (voir .confetti-piece / .firework-piece /
// .sparkle-piece + leurs @keyframes dans index.css) — pas de dépendance
// externe, pas de canvas, juste des <span> positionnés/animés en CSS. Le
// composant ne se retire pas tout seul : c'est au parent de le démonter après
// ~1.5-2s (voir usage dans SessionScreen.tsx), pour rester cohérent avec la
// façon dont prBanner/setTimeout sont déjà gérés ailleurs dans le fichier.
export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({ count = 24, colors = DEFAULT_COLORS, style = 'confetti' }) => {
  const confettiPieces = useMemo<ConfettiPiece[]>(
    () =>
      style !== 'confetti'
        ? []
        : Array.from({ length: count }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 0.35,
            duration: 1.1 + Math.random() * 0.9,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 6 + Math.random() * 6,
            round: Math.random() > 0.5,
          })),
    [count, colors, style]
  );

  // Feu d'artifice : chaque particule part du centre de l'écran et file dans
  // une direction aléatoire (angle + distance), voir @keyframes fireworkBurst.
  const fireworkPieces = useMemo<FireworkPiece[]>(
    () =>
      style !== 'fireworks'
        ? []
        : Array.from({ length: count }, (_, i) => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 90 + Math.random() * 140;
            return {
              id: i,
              fx: Math.cos(angle) * distance,
              fy: Math.sin(angle) * distance,
              delay: Math.random() * 0.15,
              duration: 0.7 + Math.random() * 0.5,
              color: colors[Math.floor(Math.random() * colors.length)],
              size: 5 + Math.random() * 5,
            };
          }),
    [count, colors, style]
  );

  // Étincelles : petits ✨ dispersés sur l'écran qui popent puis tournent en
  // s'estompant (réutilise @keyframes sparklePop, déjà défini dans index.css).
  const sparklePieces = useMemo<SparklePiece[]>(
    () =>
      style !== 'sparkles'
        ? []
        : Array.from({ length: count }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: 8 + Math.random() * 74,
            delay: Math.random() * 0.6,
            duration: 0.6 + Math.random() * 0.6,
            size: 12 + Math.random() * 14,
          })),
    [count, style]
  );

  if (style === 'fireworks') {
    return (
      <div style={wrap} aria-hidden="true">
        {fireworkPieces.map((p) => (
          <span
            key={p.id}
            className="firework-piece"
            style={
              {
                background: p.color,
                width: p.size,
                height: p.size,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                '--fx': `${p.fx}px`,
                '--fy': `${p.fy}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    );
  }

  if (style === 'sparkles') {
    return (
      <div style={wrap} aria-hidden="true">
        {sparklePieces.map((p) => (
          <span
            key={p.id}
            className="sparkle-piece"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              fontSize: p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          >
            ✨
          </span>
        ))}
      </div>
    );
  }

  return (
    <div style={wrap} aria-hidden="true">
      {confettiPieces.map((p) => (
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
