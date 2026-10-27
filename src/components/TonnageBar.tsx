import React from 'react';

interface TonnageBarProps {
  /** Tonnage soulevé pendant la séance (kg). */
  tonnageKg: number;
}

// Barre chargée de disques : un disque par tonne soulevée (jusqu'à 10 par côté, au
// delà la barre est « pleine »). Les disques glissent sur la manchette l'un après
// l'autre, et un disque de plus apparaît quand le tonnage franchit une tonne.
// La légende dit la règle : sans elle, la barre se lirait comme un poids réel.
const MAX_PLATES = 10;

export const TonnageBar: React.FC<TonnageBarProps> = ({ tonnageKg }) => {
  const plates = Math.max(0, Math.min(MAX_PLATES, Math.floor(tonnageKg / 1000)));
  return (
    <div className="tb" role="img" aria-label={`${plates} disque${plates > 1 ? 's' : ''} : un par tonne soulevée`}>
      <div className="tb-row" aria-hidden="true">
        <i className="tb-bar" />
        <i className="tb-collar" />
        {Array.from({ length: plates }, (_, i) => (
          // La clé contient l'indice : un disque neuf se monte (et s'anime), les anciens restent en place.
          <i key={i} className="tb-plate" style={{ '--i': i, height: 46 - Math.min(i, 6) * 3 } as React.CSSProperties} />
        ))}
      </div>
      <p className="tb-legend">1 disque = 1 t soulevée</p>
    </div>
  );
};
