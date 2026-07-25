import React from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { useSessionChrono } from '../hooks/useSessionChrono';
import { useHeartRate } from '../hooks/useHeartRate';
import { BodyDiagram } from './BodyDiagram';
import { IconTrophy, IconTrendingUp } from './Icons';
import { computeTonnage, BodyRegionKey } from '../utils/training';
import { kgToLbs, weightUnitLabel } from '../utils/weight';
import { WorkoutSession, WorkoutDay, HistoryEntry } from '../data/types';

interface SessionStatsBigProps {
  session: WorkoutSession;
  workout: WorkoutDay;
  completedSets: number;
  totalSets: number;
  progressPct: number;
  bodyIntensity: Partial<Record<BodyRegionKey, number>>;
  prList: string[];
  history: HistoryEntry[];
}

// Estimation calories : meme formule que StatsPanel.tsx (barre compacte
// affichee pendant l'onglet Exercice) - dupliquee ici volontairement (pure,
// 2 lignes) pour eviter de coupler ce fichier a StatsPanel.tsx pendant
// que d'autres sessions peuvent l'editer en parallele.
const estCal = (ms: number, hr: number | null, caloriesPerHour: number): number => {
  const min = ms / 60000;
  if (hr && hr > 50) return Math.max(0, Math.round((0.074 * hr - 6.5) * min));
  return Math.round((caloriesPerHour / 60) * min);
};

export const SessionStatsBig: React.FC<SessionStatsBigProps> = ({
  session, workout, completedSets, totalSets, progressPct, bodyIntensity, prList, history,
}) => {
  const { elapsed, formatted: chrono } = useSessionChrono(session.startTime);
  const { hr, status, connect, disconnect, isSupported, error } = useHeartRate();
  const caloriesPerHour = useWorkoutStore((s) => s.caloriesPerHour);
  const weightUnit = useWorkoutStore((s) => s.weightUnit);

  const cal = estCal(elapsed, hr, caloriesPerHour);
  const connected = status === 'connected';
  const connecting = status === 'connecting';
  const hrColor = hr ? (hr > 170 ? '#f44336' : hr > 145 ? '#ff9800' : '#ff6b6b') : 'var(--text-muted)';

  const tonnageKg = computeTonnage(session.exerciseProgress);
  const tonnageDisplay = weightUnit === 'lbs' ? Math.round(kgToLbs(tonnageKg)) : tonnageKg;
  const sameDayHistory = history.filter((h) => h.dayId === session.dayId);
  const previousEntry = sameDayHistory[0];
  const previousTonnageKg = previousEntry ? (previousEntry.tonnage ?? computeTonnage(previousEntry.exerciseProgress)) : 0;
  const tonnagePctVsPrevious = previousTonnageKg > 0 ? Math.round(((tonnageKg - previousTonnageKg) / previousTonnageKg) * 100) : undefined;
  const previousTonnageDisplay = weightUnit === 'lbs' ? Math.round(kgToLbs(previousTonnageKg)) : previousTonnageKg;

  return (
    <div style={scrollArea}>
      <div style={inner}>
        <p style={screenTitle}>{workout.name} - Stats de la seance</p>

        <div style={card}>
          <p style={label}>DUREE</p>
          <p style={{ ...bigNum, color: '#4CAF50' }}>{chrono}</p>
        </div>

        <div style={card}>
          <p style={label}>SERIES</p>
          <p style={bigNum}>{completedSets} <span style={unitSpan}>/ {totalSets}</span></p>
          <div style={progressTrack}>
            <div style={{ ...progressFill, width: progressPct + '%' }} />
          </div>
        </div>

        <div style={card}>
          <p style={label}>TONNAGE SOULEVE</p>
          <p style={bigNum}>{tonnageDisplay} <span style={unitSpan}>{weightUnitLabel(weightUnit)}</span></p>
        </div>

        {previousEntry && previousTonnageKg > 0 && (
              <div style={card}>
                <p style={label}>
                  <span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 6 }}><IconTrendingUp size={12} /></span>
                  VS SEANCE PRECEDENTE
                </p>
                {tonnageKg > 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: '19px', marginBottom: 10 }}>
                    {workout.name} précédente ({previousTonnageDisplay} {weightUnitLabel(weightUnit)}) :{' '}
                    <strong style={{ color: (tonnagePctVsPrevious ?? 0) >= 0 ? '#4CAF50' : '#f5a623' }}>
                      {(tonnagePctVsPrevious ?? 0) >= 0 ? '+' : ''}{tonnagePctVsPrevious}%
                    </strong>
                  </p>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: '19px', marginBottom: 10 }}>
                    Objectif : dépasser {previousTonnageDisplay} {weightUnitLabel(weightUnit)}
                  </p>
                )}
                <div style={progressTrack}>
                  <div style={{ ...progressFill, width: Math.min(100, (tonnageKg / previousTonnageKg) * 100) + '%' }} />
                </div>
              </div>
            )}
            <div style={cardRow}>
          <div style={{ ...card, flex: 1 }}>
            <p style={label}>FREQUENCE CARDIAQUE</p>
            {connected ? (
              <>
                <p style={{ ...bigNum, color: hrColor, fontSize: 26 }}>{hr ?? '-'} <span style={unitSpan}>bpm</span></p>
                <button style={smallBtn} onClick={disconnect}>Deconnecter</button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 18, color: 'var(--text-dim)', fontWeight: 200, marginBottom: 10 }}>
                  {connecting ? 'Connexion...' : '-'}
                </p>
                <button
                  style={{
                    ...smallBtn,
                    ...(isSupported
                      ? { color: '#4CAF50', borderColor: '#1a3a1a', background: '#0a150a' }
                      : { opacity: 0.35, cursor: 'not-allowed' }),
                  }}
                  onClick={isSupported ? connect : undefined}
                  disabled={connecting || !isSupported}
                >
                  {!isSupported ? 'iOS non supporte' : connecting ? 'Connexion...' : 'Connecter'}
                </button>
                {error && <p style={{ color: '#f66', fontSize: 11, marginTop: 6 }}>{error}</p>}
              </>
            )}
          </div>
          <div style={{ ...card, flex: 1 }}>
            <p style={label}>CALORIES</p>
            <p style={{ ...bigNum, fontSize: 26 }}>{cal} <span style={unitSpan}>kcal</span></p>
            <p style={{ color: 'var(--text-micro)', fontSize: 10, marginTop: 4 }}>
              {hr ? 'base sur FC' : 'estimation ~' + caloriesPerHour + ' kcal/h'}
            </p>
          </div>
        </div>

        <div style={card}>
          <p style={label}>MUSCLES SOLLICITES</p>
          <BodyDiagram intensity={bodyIntensity} />
        </div>

        <div style={card}>
          <p style={label}>RECORDS DE LA SEANCE</p>
          {prList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {prList.map((name) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-flex', color: '#FFD54F' }}><IconTrophy size={16} /></span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>{name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Pas encore de record dans cette seance - a toi de jouer !</p>
          )}
        </div>
      </div>
    </div>
  );
};

const scrollArea: React.CSSProperties = { flex: 1, overflowY: 'auto' };
const inner: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '16px 16px 100px' };
const screenTitle: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 12, fontWeight: 700, letterSpacing: 0.3, marginBottom: 14, textAlign: 'center',
};
const card: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  borderRadius: 18, padding: '16px 16px', marginBottom: 14,
};
const cardRow: React.CSSProperties = { display: 'flex', gap: 14, marginBottom: 14 };
const label: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8,
};
const bigNum: React.CSSProperties = {
  fontSize: 34, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
};
const unitSpan: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' };
const progressTrack: React.CSSProperties = {
  marginTop: 10, height: 10, background: 'var(--bg-elevated)', borderRadius: 5, overflow: 'hidden',
};
const progressFill: React.CSSProperties = {
  height: '100%', background: 'linear-gradient(90deg, var(--brand-1), var(--brand-2))', borderRadius: 5, transition: 'width 0.3s',
};
const smallBtn: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
};
