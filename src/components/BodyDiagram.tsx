import React from 'react';
import { BodyRegionKey } from '../utils/training';

interface BodyDiagramProps {
  // Intensité 0..1 par région — 0/absent = pas travaillé, 1 = groupe le
  // plus sollicité de la séance. Sert à calculer l'opacité de surbrillance.
  intensity: Partial<Record<BodyRegionKey, number>>;
}

// Surbrillance basée sur la couleur d'accent du thème (var(--brand-1-rgb))
// pour rester cohérent avec le reste de l'appli, quelle que soit la couleur
// choisie par l'utilisateur dans les Réglages.
const activeFill = (t: number | undefined): string =>
  t && t > 0 ? `rgba(var(--brand-1-rgb), ${(0.3 + 0.6 * Math.min(1, t)).toFixed(2)})` : 'var(--bg-elevated)';

const REGION_STROKE = 'var(--border-strong)';

export const BodyDiagram: React.FC<BodyDiagramProps> = ({ intensity }) => {
  const f = (key: BodyRegionKey) => activeFill(intensity[key]);

  return (
    <svg viewBox="0 0 240 165" style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>
      {/* ─── Vue de face ─── */}
      <g>
        <text x="55" y="10" textAnchor="middle" fontSize="7" fill="var(--text-dim)" fontWeight="700" letterSpacing="1">FACE</text>
        <ellipse cx="55" cy="23" rx="10" ry="11" fill="var(--bg-elevated)" stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="50" y="32" width="10" height="6" fill="var(--bg-elevated)" stroke={REGION_STROKE} strokeWidth="1" />
        <ellipse cx="32" cy="44" rx="9" ry="8" fill={f('front-shoulder')} stroke={REGION_STROKE} strokeWidth="1" />
        <ellipse cx="78" cy="44" rx="9" ry="8" fill={f('front-shoulder')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="39" y="38" width="32" height="24" rx="7" fill={f('front-chest')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="21" y="47" width="9" height="23" rx="4" fill={f('front-biceps')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="80" y="47" width="9" height="23" rx="4" fill={f('front-biceps')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="20" y="71" width="8" height="21" rx="4" fill={f('front-forearm')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="82" y="71" width="8" height="21" rx="4" fill={f('front-forearm')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="41" y="62" width="28" height="24" rx="5" fill={f('front-abs')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="37" y="88" width="14" height="33" rx="6" fill={f('front-quad')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="59" y="88" width="14" height="33" rx="6" fill={f('front-quad')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="38" y="123" width="12" height="25" rx="5" fill={f('front-calf')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="60" y="123" width="12" height="25" rx="5" fill={f('front-calf')} stroke={REGION_STROKE} strokeWidth="1" />
      </g>

      {/* ─── Vue de dos ─── */}
      <g transform="translate(130,0)">
        <text x="55" y="10" textAnchor="middle" fontSize="7" fill="var(--text-dim)" fontWeight="700" letterSpacing="1">DOS</text>
        <ellipse cx="55" cy="23" rx="10" ry="11" fill="var(--bg-elevated)" stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="50" y="32" width="10" height="6" fill="var(--bg-elevated)" stroke={REGION_STROKE} strokeWidth="1" />
        <ellipse cx="32" cy="44" rx="9" ry="8" fill={f('back-shoulder')} stroke={REGION_STROKE} strokeWidth="1" />
        <ellipse cx="78" cy="44" rx="9" ry="8" fill={f('back-shoulder')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="39" y="38" width="32" height="30" rx="7" fill={f('back-lats')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="21" y="47" width="9" height="23" rx="4" fill={f('back-triceps')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="80" y="47" width="9" height="23" rx="4" fill={f('back-triceps')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="20" y="71" width="8" height="21" rx="4" fill={f('back-forearm')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="82" y="71" width="8" height="21" rx="4" fill={f('back-forearm')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="41" y="68" width="28" height="13" rx="4" fill={f('back-lowerback')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="39" y="81" width="32" height="14" rx="6" fill={f('back-glute')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="37" y="95" width="14" height="26" rx="6" fill={f('back-hamstring')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="59" y="95" width="14" height="26" rx="6" fill={f('back-hamstring')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="38" y="123" width="12" height="25" rx="5" fill={f('back-calf')} stroke={REGION_STROKE} strokeWidth="1" />
        <rect x="60" y="123" width="12" height="25" rx="5" fill={f('back-calf')} stroke={REGION_STROKE} strokeWidth="1" />
      </g>
    </svg>
  );
};
