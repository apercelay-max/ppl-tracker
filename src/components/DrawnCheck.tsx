import React from 'react';

// Coche qui se dessine d'un trait dans un anneau : « c'est enregistré ». Sans
// `draw` (série déjà validée avant), elle s'affiche directement terminée.
export const DrawnCheck: React.FC<{ draw: boolean }> = ({ draw }) => (
  <svg className={`dc${draw ? ' dc-draw' : ''}`} width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle className="dc-ring" cx="11" cy="11" r="9" pathLength={100} strokeDasharray="100 100" transform="rotate(-90 11 11)" />
    <path className="dc-check" d="M6.5 11.4l3.1 3.1 5.9-6.6" pathLength={100} strokeDasharray="100 100" />
  </svg>
);
