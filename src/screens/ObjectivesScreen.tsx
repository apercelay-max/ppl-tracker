import React from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { getMuscleGroupsStatus, getMaxWeightEver, ALL_EXERCISES } from '../utils/training';

interface ObjectivesScreenProps { onBack: () => void; }

// Au-delà de ce seuil (en jours), un groupe musculaire est considéré
// "en retard" — même logique que l'alerte sur l'accueil (voir HomeScreen.tsx).
const MUSCLE_ALERT_THRESHOLD_DAYS = 9;

export const ObjectivesScreen: React.FC<ObjectivesScreenProps> = ({ onBack }) => {
  const history = useWorkoutStore((s) => s.history);
  const weeklySessionGoal = useWorkoutStore((s) => s.weeklySessionGoal);

  const now = Date.now();
  const sessionsThisWeek = history.filter((e) => now - e.date < 7 * 86400000).length;
  const pct = Math.min(1, sessionsThisWeek / weeklySessionGoal);
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const goalReached = sessionsThisWeek >= weeklySessionGoal;

  const muscleStatuses = history.length > 0
    ? getMuscleGroupsStatus(history).sort((a, b) => (b.daysSince ?? 999) - (a.daysSince ?? 999))
    : [];

  const records = ALL_EXERCISES
    .map((ex) => ({ ...ex, max: getMaxWeightEver(history, ex.id) }))
    .filter((r) => r.max > 0)
    .sort((a, b) => b.max - a.max)
    .slice(0, 8);

  return (
    <div style={container}>
      <div style={scroll}>

        <div style={headerRow}>
          <button onClick={onBack} style={backBtn} aria-label="Retour">←</button>
          <div>
            <h1 style={title}>🎯 Objectifs</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Ce que tu vises, où t'en es</p>
          </div>
        </div>

        {/* Objectif hebdo */}
        <p style={sectionLabel}>OBJECTIF HEBDO</p>
        <div style={card}>
          <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
            <circle cx="36" cy="36" r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
            <circle
              cx="36" cy="36" r={r} fill="none"
              stroke={goalReached ? '#4CAF50' : 'var(--brand-1)'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct)}
              style={{ transition: 'stroke-dashoffset 0.3s' }}
            />
          </svg>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 800 }}>
              {sessionsThisWeek} / {weeklySessionGoal} <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: 12 }}>séances cette semaine</span>
            </p>
            <p style={{ color: goalReached ? '#4CAF50' : 'var(--text-dim)', fontSize: 12, marginTop: 3 }}>
              {goalReached ? 'Objectif atteint 💪' : `Encore ${weeklySessionGoal - sessionsThisWeek} pour l'objectif`}
            </p>
          </div>
        </div>

        {/* Groupes musculaires */}
        <p style={sectionLabel}>GROUPES MUSCULAIRES</p>
        <div style={card}>
          {muscleStatuses.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: '18px' }}>
              Pas encore de séance enregistrée — reviens ici après ta première séance.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {muscleStatuses.map((s) => {
                const late = s.daysSince === null || s.daysSince > MUSCLE_ALERT_THRESHOLD_DAYS;
                const color = s.daysSince === null ? '#f55555' : late ? '#f5a623' : '#4CAF50';
                return (
                  <div key={s.group} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.group}</span>
                    <span style={{ color, fontSize: 12, fontWeight: 700 }}>
                      {s.daysSince === null ? 'jamais travaillé' : `${s.daysSince} j`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Records personnels */}
        <p style={sectionLabel}>RECORDS PERSONNELS</p>
        <div style={card}>
          {records.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: '18px' }}>
              Aucun record pour l'instant — les charges chiffrées de tes séances apparaîtront ici.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {records.map((rec, i) => (
                <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : '💪'}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13, flex: 1 }}>{rec.name}</span>
                  <span style={{ color: 'var(--brand-1)', fontSize: 14, fontWeight: 800 }}>{rec.max} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto', background: 'var(--bg-base)' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' };
const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 18,
  borderBottom: '1px solid var(--border-subtle)', marginBottom: 18,
};
const backBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12, background: 'var(--bg-elevated)',
  border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 18, flexShrink: 0,
};
const title: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 };
const sectionLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10, marginTop: 20 };
const card: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  background: 'var(--bg-card)', borderRadius: 14, padding: 16,
  border: '1px solid var(--border-mid)',
};
