import React from 'react';
import type { HistoryEntry } from '../data/types';
import { bucketByWeek, getMostRecentPersonalRecord } from '../utils/training';

interface Props { history: HistoryEntry[]; weeklySessionGoal: number; }

// Carte « Cette semaine » de l'accueil : série de semaines d'affilée, séances
// faites, tonnage et record éventuel. Tout vient de l'historique, sur la même
// fenêtre glissante de 7 jours que l'anneau hebdo (voir bucketByWeek).
export const WeeklyRecapCard: React.FC<Props> = ({ history, weeklySessionGoal }) => {
  const buckets = bucketByWeek(history, 12);
  const current = buckets[buckets.length - 1];

  // Série : même règle que ProfilScreen (semaines d'affilée où l'objectif est
  // atteint), sauf que la semaine en cours ne casse pas la série tant qu'elle
  // n'est pas terminée — sinon elle tomberait à 0 chaque début de semaine.
  let streak = 0;
  for (let i = buckets.length - 1; i >= 0; i--) {
    if (buckets[i].sessionCount >= weeklySessionGoal) streak++;
    else if (i !== buckets.length - 1) break;
  }

  // Un record ne compte que s'il date de cette semaine.
  const pr = getMostRecentPersonalRecord(history);
  const weekPr = pr && Date.now() - pr.date < 7 * 86400000 ? pr : null;

  const streakLine = streak > 0
    ? `🔥 ${streak} semaine${streak > 1 ? 's' : ''} d'affilée`
    : "Atteins ton objectif cette semaine pour lancer ta série";

  return (
    <div className="glass-card home-card" aria-label="Récap de la semaine">
      <span className="home-eyebrow">Cette semaine</span>
      <p style={{ color: streak > 0 ? 'var(--h-text)' : 'var(--h-muted)', fontSize: 14, fontWeight: streak > 0 ? 700 : 500 }}>{streakLine}</p>
      <div className="home-big">
        <b>{current.sessionCount}</b>
        <i>/ {weeklySessionGoal} séances · {Math.round(current.tonnage).toLocaleString('fr-FR')} kg</i>
      </div>
      {weekPr && (
        <p className="home-small">
          Record : {weekPr.exerciseName} {weekPr.weight} kg (avant {weekPr.previousMax} kg)
        </p>
      )}
    </div>
  );
};
