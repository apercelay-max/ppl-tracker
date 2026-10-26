import React from 'react';

interface WordRevealProps {
  text: string;
  /** Vrai pour un texte qui vient d'arriver : les mots apparaissent l'un après l'autre. */
  animate: boolean;
}

// Texte qui se formule mot après mot, en se précisant (léger flou qui s'efface),
// comme si le coach l'écrivait. Réservé aux réponses NEUVES : l'historique de la
// conversation, relu à l'ouverture de l'écran, s'affiche d'un bloc.
// Le texte reste un seul bloc pour les lecteurs d'écran (aria-label), les mots
// individuels ne servent qu'à l'animation.
const STEP_MS = 55;      // délai entre deux mots
const MAX_MS = 2600;     // une longue réponse ne doit pas mettre dix secondes à s'afficher

export const WordReveal: React.FC<WordRevealProps> = ({ text, animate }) => {
  if (!animate) return <>{text}</>;
  const words = text.split(/(\s+)/); // on garde les espaces et les retours à la ligne
  const real = words.filter((w) => w.trim() !== '').length || 1;
  const step = Math.min(STEP_MS, MAX_MS / real);
  let n = 0;
  return (
    <span aria-label={text} role="text">
      {words.map((w, i) => (w.trim() === ''
        ? <span key={i} aria-hidden="true">{w}</span>
        : <span key={i} className="wr-word" aria-hidden="true" style={{ animationDelay: `${n++ * step}ms` }}>{w}</span>))}
    </span>
  );
};
