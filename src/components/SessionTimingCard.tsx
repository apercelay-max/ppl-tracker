import React from 'react';
import { WorkoutDay, WorkoutSession } from '../data/types';
import { useWorkoutStore } from '../store/workoutStore';
import { useSessionTiming } from '../hooks/useSessionTiming';

interface Props {
  workout: WorkoutDay;
  session: WorkoutSession;
}

const AHEAD_BEHIND_THRESHOLD_SECONDS = 90;
const SHORTEN_THRESHOLD_SECONDS = 3 * 60;

const formatClock = (ts: number): string => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 1) return '< 1 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${minutes} min`;
};

/**
 * Estimation de fin de séance + écart avance/retard, affichée dans les
 * onglets Programme et Stats de la séance en cours. Voir useSessionTiming
 * pour le calcul (planning théorique séries × (45 s + repos) vs progression
 * réelle) et workoutStore.shortenSession pour ce que fait le bouton.
 */
export const SessionTimingCard: React.FC<Props> = ({ workout, session }) => {
  const customRestSeconds = useWorkoutStore((s) => s.customRestSeconds);
  const shortenSession = useWorkoutStore((s) => s.shortenSession);
  const timing = useSessionTiming(workout, session, customRestSeconds);

  const isBehind = timing.deltaSeconds > AHEAD_BEHIND_THRESHOLD_SECONDS;
  const isAhead = timing.deltaSeconds < -AHEAD_BEHIND_THRESHOLD_SECONDS;
  const showShorten = timing.deltaSeconds > SHORTEN_THRESHOLD_SECONDS && timing.hasDroppableExercises;

  const handleShorten = () => {
    if (window.confirm('Couper les exercices non essentiels pas encore commencés pour finir plus vite ?')) {
      shortenSession();
    }
  };

  return (
    <div style={card}>
      <div style={row}>
        <div>
          <p style={label}>FIN ESTIMÉE</p>
          <p style={bigNum}>{formatClock(timing.estimatedFinishTimestamp)}</p>
          <p style={sub}>dans {formatDuration(timing.remainingSeconds)}</p>
        </div>
        {(isBehind || isAhead) && (
          <span style={{ ...badge, ...(isBehind ? badgeBehind : badgeAhead) }}>
            {isBehind ? '⏱ En retard' : '⏱ En avance'} de {formatDuration(Math.abs(timing.deltaSeconds))}
          </span>
        )}
      </div>
      {showShorten && (
        <button onClick={handleShorten} style={shortenBtn}>
          ✂ Raccourcir la séance — garder les essentiels
        </button>
      )}
    </div>
  );
};

const card: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  borderRadius: 18, padding: '14px 16px', marginBottom: 14,
};
const row: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 };
const label: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 };
const bigNum: React.CSSProperties = { fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 };
const sub: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12, marginTop: 4 };
const badge: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 20, border: '1px solid',
  whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2,
};
const badgeBehind: React.CSSProperties = { color: '#f5a623', borderColor: 'rgba(245,166,35,0.35)', background: 'rgba(245,166,35,0.1)' };
const badgeAhead: React.CSSProperties = { color: '#4CAF50', borderColor: 'rgba(76,175,80,0.3)', background: 'rgba(76,175,80,0.1)' };
const shortenBtn: React.CSSProperties = {
  width: '100%', marginTop: 12, background: 'rgba(224,48,48,0.12)', border: '1px solid rgba(224,48,48,0.3)',
  borderRadius: 12, padding: '11px', color: '#e03030', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
