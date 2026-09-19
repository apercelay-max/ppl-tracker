import React from 'react';

interface InlineRestBarProps {
  secondsLeft: number;
  formattedTime: string;
  progress: number; // 1 -> 0 as time runs out
  finished: boolean;
  nextLabel?: string;
  nextNote?: string;
  onSkip: () => void;
  onReduce: () => void;
  onAdd: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

// Le repos prend la place de la série en cours, en grand : c'est la seule
// chose qu'on regarde entre deux séries, souvent posé sur un banc à un mètre
// du téléphone. Styles dans index.css (.sv2-rest…).
export const InlineRestBar: React.FC<InlineRestBarProps> = ({
  formattedTime, progress, finished, nextLabel, nextNote, onSkip, onReduce, onAdd,
  isPaused, onTogglePause,
}) => {
  // La barre se remplit à mesure que le repos avance (progress va de 1 à 0).
  const elapsedPct = Math.max(0, Math.min(100, (1 - progress) * 100));
  const status = isPaused ? 'Repos en pause' : finished ? 'Repos terminé' : 'Repos';

  return (
    <div className={`sv2-rest fade-in${finished ? ' over rest-bar-blink' : ''}`} role="timer" aria-live="off">
      <span className="sv2-eyebrow">{status}</span>
      <span className="sv2-rest-clock">{finished ? 'Go' : formattedTime}</span>
      <div className="sv2-rest-bar"><i style={{ width: `${finished ? 100 : elapsedPct}%` }} /></div>
      {nextLabel && <span className="sv2-rest-next">{nextLabel}</span>}
      <div className="sv2-rest-ctrls">
        <button onClick={onReduce}>−30 s</button>
        <button onClick={onTogglePause}>{isPaused ? 'Reprendre' : 'Pause'}</button>
        <button onClick={onAdd}>+30 s</button>
      </div>
      <button className="sv2-rest-skip" onClick={onSkip}>
        {finished ? 'Attaquer la série' : 'Passer le repos'}
      </button>
      {nextNote && <p className="sv2-rest-note">{nextNote}</p>}
    </div>
  );
};
