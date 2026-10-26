import React from 'react';
import { RollNumber } from './RollNumber';

interface WeightGaugeProps {
  weight: number;
  /** Bornes du cadran (kg) : la plage des pesées, avec un peu de marge. */
  min: number;
  max: number;
}

// Cadran de la dernière pesée. L'aiguille balaie de gauche à droite, oscille
// autour de sa position puis se pose, comme sur une vraie balance ; l'arc se
// remplit en même temps et le chiffre défile jusqu'à sa valeur. Le parent pose
// `key={id de la pesée}` : chaque nouvelle pesée rejoue le mouvement.
export const WeightGauge: React.FC<WeightGaugeProps> = ({ weight, min, max }) => {
  const pct = Math.max(0, Math.min(1, (weight - min) / Math.max(1, max - min)));
  const target = -90 + pct * 180; // de -90° (min) à +90° (max)
  const label = weight.toFixed(1).replace('.', ',');
  return (
    <div className="wg" role="img" aria-label={`Dernière pesée : ${label} kilos`}>
      <svg viewBox="0 0 200 112" aria-hidden="true">
        <path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="var(--bg-elevated)" strokeWidth="10" strokeLinecap="round" />
        <path className="wg-arc" d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="#4CAF50" strokeWidth="10" strokeLinecap="round" pathLength={100} strokeDasharray="100 100" style={{ '--p': 100 - pct * 100 } as React.CSSProperties} />
        <g className="wg-needle" style={{ '--t': `${target}deg` } as React.CSSProperties}>
          <line x1="100" y1="100" x2="100" y2="34" stroke="var(--text-primary)" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="100" r="7" fill="var(--text-primary)" />
      </svg>
      <p className="wg-val"><RollNumber value={label} animate delay={150} /> <span>kg</span></p>
    </div>
  );
};
