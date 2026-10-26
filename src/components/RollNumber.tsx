import React, { useEffect, useState } from 'react';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface RollNumberProps {
  /** Texte tel qu'affiché, ex. « 82,5 » : seuls les chiffres roulent, le reste reste fixe. */
  value: string;
  /** Vrai à l'apparition d'une valeur neuve : les chiffres partent de 0 et roulent jusqu'à leur place. */
  animate?: boolean;
  /** Retard de départ en ms, pour décaler le poids et les reps l'un de l'autre. */
  delay?: number;
}

// Compteur façon odomètre de salle de sport : chaque chiffre est une colonne
// 0-9 qu'on fait glisser verticalement jusqu'au bon chiffre. Si `value` change
// plus tard (boutons − / +), les colonnes roulent d'elles-mêmes jusqu'au nouveau
// chiffre : la transition CSS fait le travail, il n'y a rien à rejouer.
export const RollNumber: React.FC<RollNumberProps> = ({ value, animate = false, delay = 0 }) => {
  // Deux frames d'attente avant de lancer le roulement : une seule peut arriver
  // avant le premier affichage, et la transition ne se jouerait pas.
  const [ready, setReady] = useState(!animate);
  useEffect(() => {
    if (ready) return;
    let b = 0;
    const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setReady(true)); });
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); };
  }, [ready]);

  return (
    <span className="roll" role="img" aria-label={value}>
      {[...value].map((ch, i) => (/\d/.test(ch) ? (
        <span key={i} className="roll-col" aria-hidden="true">
          <span
            className="roll-strip"
            style={{ '--d': ready ? Number(ch) : 0, '--roll-delay': `${delay + i * 60}ms` } as React.CSSProperties}
          >
            {DIGITS.map((d) => <span key={d}>{d}</span>)}
          </span>
        </span>
      ) : (
        <span key={i} aria-hidden="true">{ch}</span>
      )))}
    </span>
  );
};
