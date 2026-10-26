import React from 'react';
import { BodyRegionKey } from '../utils/training';

interface BodyDiagramProps {
  // Intensité 0..1 par région — 0/absent = pas travaillé, 1 = groupe le
  // plus sollicité de la séance. Sert à calculer l'opacité de surbrillance.
  intensity: Partial<Record<BodyRegionKey, number>>;
  // Couleurs explicites par région (ex: rouge/vert pour la récupération),
  // prioritaires sur `intensity` quand fournies pour une région donnée —
  // permet de réutiliser ce même schéma pour un mode couleur différent de
  // la surbrillance accent-color par défaut.
  fillOverride?: Partial<Record<BodyRegionKey, string>>;
}

// Surbrillance basée sur la couleur d'accent du thème (var(--brand-1-rgb))
// pour rester cohérent avec le reste de l'appli, quelle que soit la couleur
// choisie par l'utilisateur dans les Réglages.
const activeFill = (t: number | undefined): string =>
  t && t > 0 ? `rgba(var(--brand-1-rgb), ${(0.3 + 0.6 * Math.min(1, t)).toFixed(2)})` : 'var(--bg-elevated)';

const REGION_STROKE = 'var(--border-strong)';

export const BodyDiagram: React.FC<BodyDiagramProps> = ({ intensity, fillOverride }) => {
  const f = (key: BodyRegionKey) => fillOverride?.[key] ?? activeFill(intensity[key]);

  // Un muscle = un socle neutre avec son contour + (s'il a une couleur) une couche
  // colorée qui MONTE de bas en haut, comme un réservoir qui se remplit. Les muscles
  // se remplissent l'un après l'autre (n = rang d'apparition). Le socle s'efface une
  // fois la couche arrivée, pour que le rendu final reste exactement celui d'avant
  // (une couleur translucide sur le socle serait plus terne que sur le fond).
  let n = 0;
  const muscle = (key: BodyRegionKey, kind: 'ellipse' | 'rect', geo: Record<string, number>) => {
    const color = f(key);
    const delay = `${n++ * 60}ms`;
    const colored = color !== 'var(--bg-elevated)';
    return (
      <g style={{ '--bd-delay': delay } as React.CSSProperties}>
        {React.createElement(kind, { ...geo, fill: 'var(--bg-elevated)', stroke: REGION_STROKE, strokeWidth: 1, className: colored ? 'bd-covered' : undefined })}
        {colored && React.createElement(kind, { ...geo, fill: color, className: 'bd-fill' })}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 240 165" style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>
      {/* ─── Vue de face ─── */}
      <g>
        <text x="55" y="10" textAnchor="middle" fontSize="7" fill="var(--text-dim)" fontWeight="700" letterSpacing="1">FACE</text>
        <ellipse cx="55" cy="23" rx="10" ry="11" fill="var(--bg-elevated)" stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="50" y="32" width="10" height="6" fill="var(--bg-elevated)" stroke={REGION_STROKE} strokeWidth="1" />
        {muscle('front-shoulder', 'ellipse', { cx: 32, cy: 44, rx: 9, ry: 8 })}
        {muscle('front-shoulder', 'ellipse', { cx: 78, cy: 44, rx: 9, ry: 8 })}
        {muscle('front-chest', 'rect', { x: 39, y: 38, width: 32, height: 24, rx: 7 })}
        {muscle('front-biceps', 'rect', { x: 21, y: 47, width: 9, height: 23, rx: 4 })}
        {muscle('front-biceps', 'rect', { x: 80, y: 47, width: 9, height: 23, rx: 4 })}
        {muscle('front-forearm', 'rect', { x: 20, y: 71, width: 8, height: 21, rx: 4 })}
        {muscle('front-forearm', 'rect', { x: 82, y: 71, width: 8, height: 21, rx: 4 })}
        {muscle('front-abs', 'rect', { x: 41, y: 62, width: 28, height: 24, rx: 5 })}
        {muscle('front-quad', 'rect', { x: 37, y: 88, width: 14, height: 33, rx: 6 })}
        {muscle('front-quad', 'rect', { x: 59, y: 88, width: 14, height: 33, rx: 6 })}
        {muscle('front-calf', 'rect', { x: 38, y: 123, width: 12, height: 25, rx: 5 })}
        {muscle('front-calf', 'rect', { x: 60, y: 123, width: 12, height: 25, rx: 5 })}
      </g>

      {/* ─── Vue de dos ─── */}
      <g transform="translate(130,0)">
        <text x="55" y="10" textAnchor="middle" fontSize="7" fill="var(--text-dim)" fontWeight="700" letterSpacing="1">DOS</text>
        <ellipse cx="55" cy="23" rx="10" ry="11" fill="var(--bg-elevated)" stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="50" y="32" width="10" height="6" fill="var(--bg-elevated)" stroke={REGION_STROKE} strokeWidth="1" />
        {muscle('back-shoulder', 'ellipse', { cx: 32, cy: 44, rx: 9, ry: 8 })}
        {muscle('back-shoulder', 'ellipse', { cx: 78, cy: 44, rx: 9, ry: 8 })}
        {muscle('back-lats', 'rect', { x: 39, y: 38, width: 32, height: 30, rx: 7 })}
        {muscle('back-triceps', 'rect', { x: 21, y: 47, width: 9, height: 23, rx: 4 })}
        {muscle('back-triceps', 'rect', { x: 80, y: 47, width: 9, height: 23, rx: 4 })}
        {muscle('back-forearm', 'rect', { x: 20, y: 71, width: 8, height: 21, rx: 4 })}
        {muscle('back-forearm', 'rect', { x: 82, y: 71, width: 8, height: 21, rx: 4 })}
        {muscle('back-lowerback', 'rect', { x: 41, y: 68, width: 28, height: 13, rx: 4 })}
        {muscle('back-glute', 'rect', { x: 39, y: 81, width: 32, height: 14, rx: 6 })}
        {muscle('back-hamstring', 'rect', { x: 37, y: 95, width: 14, height: 26, rx: 6 })}
        {muscle('back-hamstring', 'rect', { x: 59, y: 95, width: 14, height: 26, rx: 6 })}
        {muscle('back-calf', 'rect', { x: 38, y: 123, width: 12, height: 25, rx: 5 })}
        {muscle('back-calf', 'rect', { x: 60, y: 123, width: 12, height: 25, rx: 5 })}
      </g>
    </svg>
  );
};
