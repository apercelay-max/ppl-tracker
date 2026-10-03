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

  if (motif === 'sunrise') {
    // Rayons groupés en haut du médaillon, comme un soleil levant.
    return (
      <>
        <circle cx={cx} cy={cy - size * 0.04} r={size * 0.1} fill="none" stroke={color} strokeWidth={size * 0.022} />
        {Array.from({ length: 7 }, (_, i) => {
          const deg = -75 + i * 25;
          const [x1, y1] = polar(cx, cy, size * 0.3, deg);
          const [x2, y2] = polar(cx, cy, size * 0.46, deg);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={size * 0.022} strokeLinecap="round" />;
        })}
      </>
    );
  }

  if (motif === 'stars') {
    // Petites étoiles à 4 branches éparpillées, comme un ciel nocturne.
    return (
      <>
        {[
          [0.3, -40], [0.44, 10], [0.33, 70], [0.4, 150], [0.46, -110], [0.28, -170],
        ].map(([rr, deg], i) => {
          const [x, y] = polar(cx, cy, size * rr, deg);
          const s = size * (i % 2 === 0 ? 0.05 : 0.035);
          return (
            <g key={i}>
              <line x1={x - s} y1={y} x2={x + s} y2={y} stroke={color} strokeWidth={size * 0.012} strokeLinecap="round" />
              <line x1={x} y1={y - s} x2={x} y2={y + s} stroke={color} strokeWidth={size * 0.012} strokeLinecap="round" />
            </g>
          );
        })}
      </>
    );
  }

  if (motif === 'grid') {
    // Grille 3×3, comme une page de calendrier.
    const step = size * 0.16;
    const cells: React.ReactNode[] = [];
    for (let row = -1; row <= 1; row++) {
      for (let col = -1; col <= 1; col++) {
        cells.push(
          <rect
            key={`${row}-${col}`}
            x={cx + col * step - step * 0.38}
            y={cy + row * step - step * 0.38}
            width={step * 0.76}
            height={step * 0.76}
            rx={size * 0.015}
            fill="none"
            stroke={color}
            strokeWidth={size * 0.016}
          />
        );
      }
    }
    return <>{cells}</>;
  }

  if (motif === 'pulse') {
    // Ligne en zigzag façon tracé cardiaque.
    const y0 = cy;
    const w = size * 0.4;
    const points = [
      [cx - w, y0], [cx - w * 0.5, y0], [cx - w * 0.32, y0 - size * 0.18],
      [cx - w * 0.14, y0 + size * 0.2], [cx, y0], [cx + w * 0.5, y0], [cx + w, y0],
    ].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    return <polyline points={points} fill="none" stroke={color} strokeWidth={size * 0.025} strokeLinecap="round" strokeLinejoin="round" />;
  }

  if (motif === 'quad') {
    // 4 pétales (cercles superposés), pour la variété.
    return (
      <>
        {[0, 90, 180, 270].map((deg) => {
          const [x, y] = polar(cx, cy, size * 0.16, deg);
          return <circle key={deg} cx={x} cy={y} r={size * 0.17} fill="none" stroke={color} strokeWidth={size * 0.016} opacity={0.8} />;
        })}
      </>
    );
  }

  if (motif === 'bars') {
    // Barres radiales de hauteur variable, façon vumètre/jauge.
    const lengths = [0.32, 0.4, 0.46, 0.38, 0.44, 0.3, 0.42, 0.36];
    return (
      <>
        {lengths.map((len, i) => {
          const deg = i * 45;
          const [x1, y1] = polar(cx, cy, size * 0.22, deg);
          const [x2, y2] = polar(cx, cy, size * len, deg);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={size * 0.035} strokeLinecap="round" />;
        })}
      </>
    );
  }

  if (motif === 'pins') {
    // Petits repères façon épingles de carte, pour les salles différentes.
    return (
      <>
        {[[-120, 0.36], [-10, 0.44], [95, 0.34], [160, 0.42]].map(([deg, rr], i) => {
          const [x, y] = polar(cx, cy, size * rr, deg);
          return (
            <g key={i}>
              <circle cx={x} cy={y - size * 0.03} r={size * 0.045} fill="none" stroke={color} strokeWidth={size * 0.018} />
              <line x1={x} y1={y + size * 0.01} x2={x} y2={y + size * 0.05} stroke={color} strokeWidth={size * 0.018} strokeLinecap="round" />
            </g>
          );
        })}
      </>
    );
  }

  if (motif === 'lines') {
    // Lignes horizontales empilées, façon page de carnet.
    return (
      <>
        {[-0.22, -0.06, 0.1, 0.26].map((dy, i) => (
          <line
            key={i}
            x1={cx - size * (0.32 - i * 0.03)}
            y1={cy + size * dy}
            x2={cx + size * (0.32 - i * 0.03)}
            y2={cy + size * dy}
            stroke={color}
            strokeWidth={size * 0.02}
            strokeLinecap="round"
            opacity={0.85}
          />
        ))}
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
