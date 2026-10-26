import React, { useEffect, useRef } from 'react';
import { fireShockwave } from '../utils/shockwave';

interface DeckRestBarProps {
  formattedTime: string;
  progress: number;   // 1 -> 0 au fil du repos (comme InlineRestBar)
  finished: boolean;
  isPaused: boolean;
}

// Barre du repos en cours, au-dessus de la progression de la séance (vue iPad).
// Elle se pose d'en haut puis, au moment où elle touche, une onde de choc part
// d'elle (voir utils/shockwave.ts). Elle n'existe que pendant le repos : chaque
// repos la recrée, donc l'effet se rejoue à chaque série validée.
export const DeckRestBar: React.FC<DeckRestBarProps> = ({ formattedTime, progress, finished, isPaused }) => {
  const ref = useRef<HTMLDivElement>(null);
  const elapsedPct = Math.max(0, Math.min(100, (1 - progress) * 100));

  useEffect(() => {
    // La barre met ~300 ms à se poser ; l'onde part à l'impact.
    const id = window.setTimeout(() => fireShockwave(ref.current), 300);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div ref={ref} className={`deck-restbar${finished ? ' is-over' : ''}`} role="timer" aria-live="off">
      <span className="deck-restbar-lbl">{isPaused ? 'Repos en pause' : finished ? 'Repos terminé' : 'Repos'}</span>
      <div className="deck-restbar-track"><i style={{ width: `${finished ? 100 : elapsedPct}%` }} /></div>
      <b className="deck-restbar-time">{finished ? 'Go' : formattedTime}</b>
    </div>
  );
};
