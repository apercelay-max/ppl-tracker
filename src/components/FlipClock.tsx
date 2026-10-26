import React, { useEffect, useState } from 'react';

// Chrono « à palettes » façon tableau de gare : chaque chiffre qui change bascule
// d'un cran (la moitié haute se replie, la moitié basse se déplie avec le nouveau
// chiffre). Les séparateurs (« : ») restent fixes. Seuls les chiffres qui
// changent bougent : à chaque seconde, un seul se retourne la plupart du temps.
const FlipDigit: React.FC<{ d: string }> = ({ d }) => {
  const [shown, setShown] = useState(d);
  const [prev, setPrev] = useState(d);
  const [flip, setFlip] = useState(0);
  const [settled, setSettled] = useState(true);
  // État dérivé pendant le rendu : la bascule démarre dès le rendu où le chiffre change.
  if (d !== shown) { setPrev(shown); setShown(d); setFlip((f) => f + 1); setSettled(false); }
  useEffect(() => {
    if (flip === 0) return;
    const id = window.setTimeout(() => setSettled(true), 420);
    return () => window.clearTimeout(id);
  }, [flip]);
  return (
    <span className="fd" aria-hidden="true">
      <span className="fd-h fd-t"><i>{shown}</i></span>
      <span className="fd-h fd-b"><i>{settled ? shown : prev}</i></span>
      {flip > 0 && <span key={`t${flip}`} className="fd-h fd-t fd-f1"><i>{prev}</i></span>}
      {flip > 0 && <span key={`b${flip}`} className="fd-h fd-b fd-f2"><i>{shown}</i></span>}
    </span>
  );
};

export const FlipClock: React.FC<{ value: string; color?: string }> = ({ value, color }) => (
  <span className="fclock" role="timer" aria-label={value} style={{ color }}>
    {[...value].map((ch, i) => (/\d/.test(ch) ? <FlipDigit key={i} d={ch} /> : <span key={i} className="fclock-sep" aria-hidden="true">{ch}</span>))}
  </span>
);
