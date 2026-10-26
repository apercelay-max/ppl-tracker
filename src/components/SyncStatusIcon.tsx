import React, { useState } from 'react';
import type { SyncStatus } from '../hooks/useCloudSync';

interface SyncStatusIconProps {
  status: SyncStatus;
}

// Petite icône d'état de la synchro, à côté du libellé (Réglages → Compte).
//  - envoi en cours : le contour du nuage se trace en boucle, la flèche monte ;
//  - fini : le nuage cède la place à une coche verte qui se dessine ;
//  - erreur : nuage rouge qui tremble une fois.
// La coche ne se dessine que si on VOIT la synchro finir (passage de « en cours »
// à « fini ») : à l'ouverture de l'écran, un état déjà synchronisé s'affiche tel quel.
const WORKING: SyncStatus[] = ['checking', 'syncing'];

export const SyncStatusIcon: React.FC<SyncStatusIconProps> = ({ status }) => {
  // État dérivé pendant le rendu (voir SetRow.tsx) : le premier affichage de la
  // coche porte déjà l'animation, un effet arriverait trop tard.
  const [prev, setPrev] = useState(status);
  const [drawCheck, setDrawCheck] = useState(false);
  if (status !== prev) {
    setPrev(status);
    setDrawCheck(status === 'synced' && WORKING.includes(prev));
  }

  if (status === 'idle') return null;

  if (status === 'synced') {
    return (
      <svg className={`sy sy-ok${drawCheck ? ' sy-draw' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle className="sy-ring" cx="12" cy="12" r="9.5" pathLength={100} strokeDasharray="100 100" transform="rotate(-90 12 12)" />
        <path className="sy-check" d="M7.5 12.5l3 3 6-6.5" pathLength={100} strokeDasharray="100 100" />
      </svg>
    );
  }

  const working = WORKING.includes(status);
  const color = status === 'error' ? '#e03030' : status === 'conflict' ? '#f5a623' : 'currentColor';
  return (
    <svg className={`sy${working ? ' sy-run' : ''}${status === 'error' ? ' sy-err' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path className="sy-cloud" pathLength={100} d="M6.657 18c-2.572 0-4.657-2.007-4.657-4.483 0-2.475 2.085-4.482 4.657-4.482.393-1.762 1.794-3.2 3.675-3.773 1.88-.572 3.956-.193 5.444 1 1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486 0 1.927-1.551 3.487-3.465 3.487h-11.878" />
      {working && <path className="sy-arrow" d="M12 17v-6M9.5 13.5L12 11l2.5 2.5" />}
    </svg>
  );
};
