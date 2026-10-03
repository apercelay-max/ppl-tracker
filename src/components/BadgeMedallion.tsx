import React from 'react';
import { DataIcon } from './DataIcon';
import { BadgeMotif } from '../data/badges';

// ─── Médaillon de badge ─────────────────────────────────────────────────
// Chaque badge est rendu comme un médaillon circulaire : un anneau coloré
// (couleur de palier — bronze/argent/or/platine), un motif décoratif propre
// à la catégorie (voir BadgeMotif) et l'icône au centre. Un badge non
// débloqué reste visible mais en grisé, pour donner envie de le débloquer
// sans jamais inventer de progrès qui n'existe pas.

const TIER_COLORS = ['#b08d57', '#9CA3AF', '#e8b923', '#60d4e8', '#f472b6'];
const LOCKED_COLOR = 'var(--text-dim)';

export const tierColor = (tierIndex: number): string =>
  TIER_COLORS[Math.min(tierIndex, TIER_COLORS.length - 1)];

const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
};

const polygonPoints = (cx: number, cy: number, r: number, sides: number, rotationDeg = 0): string =>
  Array.from({ length: sides }, (_, i) => polar(cx, cy, r, rotationDeg + (i * 360) / sides))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');

const Motif: React.FC<{ motif: BadgeMotif; color: string; size: number }> = ({ motif, color, size }) => {
  const cx = size / 2;
  const cy = size / 2;

  if (motif === 'rays') {
    return (
      <>
        {Array.from({ length: 12 }, (_, i) => {
          const deg = i * 30;
          const [x1, y1] = polar(cx, cy, size * 0.3, deg);
          const [x2, y2] = polar(cx, cy, size * 0.47, deg);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={size * 0.025} strokeLinecap="round" />;
        })}
      </>
    );
  }

  if (motif === 'starburst') {
    return (
      <>
        {Array.from({ length: 16 }, (_, i) => {
          const deg = i * 22.5;
          const len = i % 2 === 0 ? size * 0.47 : size * 0.38;
          const [x1, y1] = polar(cx, cy, size * 0.3, deg);
          const [x2, y2] = polar(cx, cy, len, deg);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={size * 0.018} strokeLinecap="round" />;
        })}
      </>
    );
  }

  if (motif === 'dots') {
    return (
      <>
        {Array.from({ length: 14 }, (_, i) => {
          const deg = i * (360 / 14);
          const [x, y] = polar(cx, cy, size * 0.42, deg);
          return <circle key={i} cx={x} cy={y} r={size * 0.025} fill={color} />;
        })}
      </>
    );
  }

  if (motif === 'rings') {
    return (
      <>
        {[0.46, 0.38, 0.3].map((rr, i) => (
          <circle key={i} cx={cx} cy={cy} r={size * rr} fill="none" stroke={color} strokeWidth={size * 0.014} opacity={0.9 - i * 0.2} />
        ))}
      </>
    );
  }

  if (motif === 'track') {
    return (
      <>
        <circle cx={cx} cy={cy} r={size * 0.46} fill="none" stroke={color} strokeWidth={size * 0.028} strokeDasharray={`${size * 0.09} ${size * 0.07}`} />
        <circle cx={cx} cy={cy} r={size * 0.33} fill="none" stroke={color} strokeWidth={size * 0.02} strokeDasharray={`${size * 0.06} ${size * 0.05}`} opacity={0.7} />
      </>
    );
  }

  if (motif === 'hex') {
    return (
      <>
        <polygon points={polygonPoints(cx, cy, size * 0.45, 6, 0)} fill="none" stroke={color} strokeWidth={size * 0.025} strokeLinejoin="round" />
        <polygon points={polygonPoints(cx, cy, size * 0.3, 6, 30)} fill="none" stroke={color} strokeWidth={size * 0.016} strokeLinejoin="round" opacity={0.7} />
      </>
    );
  }

  if (motif === 'diamonds') {
    return (
      <>
        {Array.from({ length: 6 }, (_, i) => {
          const deg = i * 60;
          const [x, y] = polar(cx, cy, size * 0.4, deg);
          return (
            <polygon
              key={i}
              points={polygonPoints(x, y, size * 0.07, 4, 0)}
              fill="none"
              stroke={color}
              strokeWidth={size * 0.018}
              strokeLinejoin="round"
            />
          );
        })}
      </>
    );
  }

  // 'spikes' — couronne de petits triangles pointant vers l'extérieur.
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const deg = i * 45;
        const [bx1, by1] = polar(cx, cy, size * 0.32, deg - 9);
        const [bx2, by2] = polar(cx, cy, size * 0.32, deg + 9);
        const [tx, ty] = polar(cx, cy, size * 0.47, deg);
        return (
          <polygon
            key={i}
            points={`${bx1.toFixed(1)},${by1.toFixed(1)} ${bx2.toFixed(1)},${by2.toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)}`}
            fill={color}
            opacity={0.85}
          />
        );
      })}
    </>
  );
};

interface BadgeMedallionProps {
  icon: string;
  motif: BadgeMotif;
  tierIndex: number; // -1 si non débloqué
  size?: number;
}

export const BadgeMedallion: React.FC<BadgeMedallionProps> = ({ icon, motif, tierIndex, size = 56 }) => {
  const unlocked = tierIndex >= 0;
  const color = unlocked ? tierColor(tierIndex) : LOCKED_COLOR;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity: unlocked ? 1 : 0.4 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size * 0.47}
        fill="var(--bg-elevated)"
        stroke={color}
        strokeWidth={unlocked ? size * 0.045 : size * 0.03}
        strokeDasharray={unlocked ? undefined : `${size * 0.05} ${size * 0.04}`}
      />
      <Motif motif={motif} color={color} size={size} />
      <g transform={`translate(${size / 2 - size * 0.16}, ${size / 2 - size * 0.16})`}>
        <DataIcon name={icon} size={size * 0.32} color={color} />
      </g>
    </svg>
  );
};
