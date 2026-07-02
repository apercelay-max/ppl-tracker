import React from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { getWorkout } from '../data/workouts';
import { HistoryEntry } from '../data/types';
import { bucketByWeek, computeLoadStatus, computeTonnage, WeekBucket } from '../utils/training';

interface DashboardScreenProps { onBack: () => void; }

const DAY_ACCENT: Record<string, string> = {
  'pull-a': '#7c6fcd', 'push-a': '#e03030', 'legs-a': '#e8a020',
  'pull-b': '#6a5fc0', 'push-b': '#cc2828', 'legs-b': '#d09018',
};
const DAY_TYPE_LABEL: Record<string, string> = {
  'pull-a': 'PULL', 'push-a': 'PUSH', 'legs-a': 'LEGS',
  'pull-b': 'PULL', 'push-b': 'PUSH', 'legs-b': 'LEGS',
};

const formatDate = (ts: number): string => {
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const WeeklyBarChart: React.FC<{
  buckets: WeekBucket[];
  valueFn: (b: WeekBucket) => number;
  color: string;
}> = ({ buckets, valueFn, color }) => {
  const max = Math.max(1, ...buckets.map(valueFn));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 84 }}>
      {buckets.map((b, i) => {
        const v = valueFn(b);
        const h = v > 0 ? Math.max(4, (v / max) * 72) : 2;
        const isCurrent = i === buckets.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
              <div style={{
                width: '100%', height: h, borderRadius: 4,
                background: v > 0 ? color : 'var(--bg-elevated)',
                opacity: isCurrent ? 1 : 0.75,
                transition: 'height 0.3s',
              }} />
            </div>
            <span style={{ color: isCurrent ? 'var(--text-secondary)' : 'var(--text-micro)', fontSize: 8, fontWeight: 700 }}>
              {isCurrent ? 'S' : `-${b.weeksAgo}`}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onBack }) => {
  const history = useWorkoutStore((s) => s.history);

  const buckets = bucketByWeek(history, 8);
  const status = computeLoadStatus(buckets);

  const totalSessions = history.length;
  const totalTonnage = history.reduce((sum, e) => sum + (e.tonnage ?? computeTonnage(e.exerciseProgress)), 0);
  const totalMinutes = Math.round(history.reduce((sum, e) => sum + e.durationMs, 0) / 60000);

  return (
    <div style={container}>
      <div style={scroll}>
        <div style={headerRow}>
          <button onClick={onBack} style={backBtn}>←</button>
          <div>
            <h1 style={titleStyle}>Dashboard</h1>
            <p style={subtitleStyle}>Historique & charge d'entraînement</p>
          </div>
        </div>

        {totalSessions === 0 ? (
          <div style={emptyCard}>
            <span style={{ fontSize: 32 }}>📊</span>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 10, lineHeight: '18px' }}>
              Pas encore de séance terminée. Reviens ici après ton premier entraînement !
            </p>
          </div>
        ) : (
          <>
            {/* Résumé global */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={statBlock}>
                <span style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 }}>{totalSessions}</span>
                <span style={statLabel}>SÉANCES</span>
              </div>
              <div style={statBlock}>
                <span style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 }}>{totalTonnage.toLocaleString('fr-FR')}</span>
                <span style={statLabel}>KG SOULEVÉS</span>
              </div>
              <div style={statBlock}>
                <span style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 }}>{totalMinutes}</span>
                <span style={statLabel}>MIN AU TOTAL</span>
              </div>
            </div>

            {/* Statut de charge */}
            <div style={{ ...statusCard, borderColor: status ? statusColor(status.level) + '40' : 'var(--border)' }}>
              {status ? (
                <>
                  <p style={{ fontSize: 14, fontWeight: 700, color: statusColor(status.level), marginBottom: 4 }}>{status.label}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: '17px' }}>{status.detail}</p>
                </>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: '17px' }}>
                  Note ton ressenti (RPE) à la fin de tes prochaines séances pour voir apparaître ton statut de charge ici.
                </p>
              )}
            </div>

            {/* Charge d'entraînement hebdo */}
            <div style={chartCard}>
              <p style={sectionLabel}>CHARGE D'ENTRAÎNEMENT / SEMAINE</p>
              <WeeklyBarChart buckets={buckets} valueFn={(b) => b.trainingLoad} color="#e03030" />
            </div>

            {/* Tonnage hebdo */}
            <div style={chartCard}>
              <p style={sectionLabel}>TONNAGE / SEMAINE (KG)</p>
              <WeeklyBarChart buckets={buckets} valueFn={(b) => b.tonnage} color="#5560cc" />
            </div>

            {/* Historique */}
            <p style={{ ...sectionLabel, marginBottom: 10 }}>SÉANCES RÉCENTES</p>
            <div>
              {history.slice(0, 20).map((entry) => (
                <SessionRow key={entry.id} entry={entry} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const statusColor = (level: 'up' | 'stable' | 'down' | 'spike'): string => {
  if (level === 'spike') return '#f5a623';
  if (level === 'up') return '#5560cc';
  if (level === 'down') return '#7a7a90';
  return '#4CAF50';
};

const SessionRow: React.FC<{ entry: HistoryEntry }> = ({ entry }) => {
  const workout = getWorkout(entry.dayId);
  const accent = DAY_ACCENT[entry.dayId] ?? '#7a7a90';
  const typeLabel = DAY_TYPE_LABEL[entry.dayId] ?? '';
  const durationMin = Math.round(entry.durationMs / 60000);
  const setsCompleted = Object.values(entry.exerciseProgress).flat().filter((s) => s.completed).length;

  return (
    <div style={sessionRow}>
      <div style={{
        width: 44, alignSelf: 'stretch', flexShrink: 0,
        background: `${accent}15`, borderRadius: 12,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      }}>
        <span style={{ color: accent, fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>{typeLabel}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>{workout?.name ?? entry.dayId}</p>
          <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{formatDate(entry.date)}</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
          {setsCompleted} séries · {durationMin} min
          {entry.tonnage ? ` · ${entry.tonnage} kg` : ''}
        </p>
      </div>
      {entry.rpe && (
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 800 }}>{entry.rpe}</span>
        </div>
      )}
    </div>
  );
};

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto', background: 'var(--bg-base)' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 40px' };
const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 18,
  borderBottom: '1px solid var(--border-subtle)', marginBottom: 18,
};
const backBtn: React.CSSProperties = {
  width: 36, height: 36, background: 'var(--bg-elevated)', borderRadius: 10,
  color: 'var(--text-muted)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, border: '1px solid var(--border-strong)',
};
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.3 };
const subtitleStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12, marginTop: 2 };
const emptyCard: React.CSSProperties = {
  textAlign: 'center', padding: '48px 20px',
  background: 'var(--bg-surface)', borderRadius: 18, border: '1px solid var(--border)',
};
const statBlock: React.CSSProperties = {
  flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 14, padding: '12px 6px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
};
const statLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 8, fontWeight: 700, letterSpacing: 1, textAlign: 'center' };
const statusCard: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 16, padding: 14, marginBottom: 16,
  border: '1px solid var(--border-mid)',
};
const chartCard: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 16, padding: 14, marginBottom: 12,
  border: '1px solid var(--border-mid)',
};
const sectionLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 };
const sessionRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 14, padding: '8px 10px 8px 8px', marginBottom: 6,
};
