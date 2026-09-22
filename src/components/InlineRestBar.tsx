import React from 'react';
import { useWorkoutStore } from '../store/workoutStore';

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
  const isSport = useWorkoutStore((s) => s.uiStyle) === 'sport';

  // Style « Sport pro » : le repos dans un anneau, façon cadran de montre,
  // les commandes à côté. Mêmes boutons, même logique.
  if (isSport) {
    const R = 52;
    const C = 2 * Math.PI * R;
    return (
      <div className={`sv2-rest sp-rest fade-in${finished ? ' over rest-bar-blink' : ''}`} role="timer" aria-live="off">
        <div className="sp-ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--h-hero-line)" strokeWidth="8" />
            <circle cx="60" cy="60" r={R} fill="none" stroke={finished ? 'var(--h-good)' : 'var(--brand-1)'} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - (finished ? 100 : elapsedPct) / 100)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div>
            <span className="sp-num" style={{ color: finished ? 'var(--h-good)' : undefined }}>{finished ? 'GO' : formattedTime}</span>
            <span className="sp-lbl">{isPaused ? 'Pause' : 'Repos'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          {nextLabel && <span className="sv2-rest-next" style={{ textAlign: 'left' }}>{nextLabel}</span>}
          <div className="sv2-rest-ctrls" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <button onClick={onReduce}>−30 s</button>
            <button onClick={onAdd}>+30 s</button>
            <button onClick={onTogglePause} style={{ gridColumn: '1 / -1' }}>{isPaused ? 'Reprendre' : 'Pause'}</button>
          </div>
          <button className="sv2-rest-skip" onClick={onSkip} style={{ height: 46 }}>
            {finished ? 'Attaquer' : 'Passer'}
          </button>
        </div>
        {nextNote && <p className="sv2-rest-note" style={{ gridColumn: '1 / -1' }}>{nextNote}</p>}
      </div>
    );
  }

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
