import React from 'react';
import { useSessionChrono } from '../hooks/useSessionChrono';
import { computeTonnage } from '../utils/training';
import type { ExerciseProgress, HistoryEntry } from '../data/types';

interface Props {
  startTime: number;
  pausedAt: number | null;
  exerciseProgress: ExerciseProgress;
  dayId: string;
  history: HistoryEntry[];
}

// Bandeau de chiffres en direct du style « Sport pro » (en-tête de séance).
// Composant à part : le chrono se rafraîchit chaque seconde, et ce rendu ne
// doit pas entraîner tout l'écran de séance avec lui.
export const SportLiveStats: React.FC<Props> = ({ startTime, pausedAt, exerciseProgress, dayId, history }) => {
  const { formatted } = useSessionChrono(startTime, pausedAt);
  const tonnage = computeTonnage(exerciseProgress);
  // Même séance, la dernière fois : on compare le tonnage accumulé jusqu'ici
  // au total de cette séance-là.
  const last = history.find((h) => h.dayId === dayId);
  const lastTonnage = last ? last.tonnage ?? computeTonnage(last.exerciseProgress) : null;
  const pct = lastTonnage && lastTonnage > 0 ? Math.round((tonnage / lastTonnage) * 100) : null;
  const fmt = (kg: number) => (kg >= 1000
    ? { v: (kg / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }), u: 't' }
    : { v: String(Math.round(kg)), u: 'kg' });
  const t = fmt(tonnage);

  return (
    <div className="sp-live">
      <div>
        <span className="sp-lbl">{pausedAt != null ? 'En pause' : 'Temps'}</span>
        <span className="sp-num" style={{ color: pausedAt != null ? 'var(--h-warn)' : 'var(--brand-1)' }}>{formatted}</span>
      </div>
      <div>
        <span className="sp-lbl">Tonnage</span>
        <span><span className="sp-num">{t.v}</span><span className="sp-unit">{t.u}</span></span>
      </div>
      <div>
        <span className="sp-lbl">Dernière fois</span>
        {pct !== null
          ? <span title="Part du tonnage de la dernière fois déjà soulevée"><span className="sp-num">{pct}</span><span className="sp-unit">% fait</span></span>
          : <span className="sp-delta" style={{ paddingTop: 6 }}>1re fois</span>}
      </div>
    </div>
  );
};
