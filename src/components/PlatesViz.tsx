import React, { useEffect, useState } from 'react';
import type { PlatePair } from '../utils/plates';

interface PlatesVizProps {
  /** Disques d'UN côté, du plus lourd au plus léger (celui que calcule solvePlates). */
  perSide: PlatePair[];
}

// Couleurs façon salle de sport (les disques olympiques sont codés par poids).
const PLATE_COLOR = (kg: number): string =>
  kg >= 25 ? '#e03030' : kg >= 20 ? '#378add' : kg >= 15 ? '#f5a623' : kg >= 10 ? '#4caf50' : kg >= 5 ? '#d6d6e6' : '#9797b0';
// Hauteur et épaisseur d'un disque : le plus lourd est le plus grand.
const PLATE_H = (kg: number): number => Math.max(16, Math.min(46, 14 + kg * 1.3));
const PLATE_W = (kg: number): number => (kg >= 10 ? 8 : kg >= 2.5 ? 6 : 4);

// Dessin de la barre sous le texte « Par côté : … » : les disques glissent sur la
// manchette, du plus lourd (contre le centre) au plus léger, comme on les charge
// en vrai. Quand la charge change, les disques repartent et se rechargent.
// `key` sur la liste (voir le parent) relance l'animation à chaque nouvelle composition.
export const PlatesViz: React.FC<PlatesVizProps> = ({ perSide }) => {
  const plates = perSide.flatMap(({ plate, count }) => Array.from({ length: count }, () => plate));
  // Les disques partent « dehors » puis rentrent : sans cet état de départ, la
  // transition CSS ne se jouerait pas (ils apparaîtraient déjà en place).
  const [loaded, setLoaded] = useState(false);
  // Signature de contenu plutôt que la référence du tableau : `perSide` est
  // recréé à chaque rendu du parent (ex. frappe dans le champ RPE), ce qui
  // relançait l'animation de chargement même quand la charge n'avait pas changé.
  const signature = perSide.map((p) => `${p.count}x${p.plate}`).join('+');
  useEffect(() => {
    setLoaded(false);
    let b = 0;
    const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setLoaded(true)); });
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); };
  }, [signature]);

  if (plates.length === 0) return null;
  return (
    <div className="plv" aria-hidden="true">
      <div className="plv-bar" />
      <div className="plv-collar" />
      {plates.map((kg, i) => (
        <i
          key={i}
          className={`plv-plate${loaded ? ' on' : ''}`}
          style={{ height: PLATE_H(kg), width: PLATE_W(kg), background: PLATE_COLOR(kg), '--i': i } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
