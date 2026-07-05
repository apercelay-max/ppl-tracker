import React, { useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { getWorkout } from '../data/workouts';
import { HistoryEntry } from '../data/types';
import {
  bucketByWeek, computeLoadStatus, computeTonnage, WeekBucket,
  ALL_EXERCISES, getExerciseWeightHistory,
} from '../utils/training';

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

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const MonthCalendar: React.FC<{ history: HistoryEntry[] }> = ({ history }) => {
  const [monthOffset, setMonthOffset] = useState(0); // 0 = mois en cours, négatif = mois précédents
  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = dimanche
  const startOffset = (firstWeekday + 6) % 7; // décalage pour semaine commençant lundi

  const sessionsByDay: Record<number, HistoryEntry[]> = {};
  for (const entry of history) {
    const d = new Date(entry.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      (sessionsByDay[day] ??= []).push(entry);
    }
  }

  const monthLabel = viewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const sessionsThisMonth = Object.keys(sessionsByDay).length;

  return (
    <div style={chartCard}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => setMonthOffset((m) => m - 1)} style={calNavBtn}>‹</button>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>{monthLabel}</p>
        <button
          onClick={() => setMonthOffset((m) => Math.min(0, m + 1))}
          disabled={monthOffset === 0}
          style={{ ...calNavBtn, opacity: monthOffset === 0 ? 0.3 : 1, cursor: monthOffset === 0 ? 'default' : 'pointer' }}
        >›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {WEEKDAY_LABELS.map((d, i) => (
          <span key={i} style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 9, fontWeight: 700 }}>{d}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: startOffset }, (_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const sessions = sessionsByDay[day];
          const isToday = monthOffset === 0 && day === now.getDate();
          const accent = sessions ? (DAY_ACCENT[sessions[0].dayId] ?? '#7a7a90') : undefined;
          return (
            <div
              key={day}
              style={{
                aspectRatio: '1', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: accent ? `${accent}25` : 'var(--bg-elevated)',
                border: isToday ? '1px solid var(--brand-1)' : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: accent ? 800 : 500, color: accent ?? 'var(--text-dim)' }}>{day}</span>
            </div>
          );
        })}
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 10, textAlign: 'center' }}>
        {sessionsThisMonth > 0 ? `${sessionsThisMonth} séance${sessionsThisMonth > 1 ? 's' : ''} ce mois-ci` : 'Aucune séance ce mois-ci'}
      </p>
    </div>
  );
};

const ProgressionChart: React.FC<{ history: HistoryEntry[] }> = ({ history }) => {
  const [exerciseId, setExerciseId] = useState(ALL_EXERCISES[0]?.id ?? '');
  const points = getExerciseWeightHistory(history, exerciseId);

  const CHART_W = 300;
  const CHART_H = 100;
  const PAD = 12;

  let svgContent: React.ReactNode = null;
  if (points.length >= 2) {
    const weights = points.map((p) => p.maxWeight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min || 1;
    const coords = points.map((p, i) => {
      const x = PAD + (i / (points.length - 1)) * (CHART_W - PAD * 2);
      const y = CHART_H - PAD - ((p.maxWeight - min) / range) * (CHART_H - PAD * 2);
      return { x, y, w: p.maxWeight };
    });
    const path = coords.map((c) => `${c.x},${c.y}`).join(' ');
    const last = points[points.length - 1];
    const first = points[0];
    const trendUp = last.maxWeight >= first.maxWeight;
    svgContent = (
      <>
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ width: '100%', height: 90, display: 'block' }}>
          <polyline points={path} fill="none" stroke={trendUp ? '#4CAF50' : '#f5a623'} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {coords.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 3.5 : 2} fill={trendUp ? '#4CAF50' : '#f5a623'} />
          ))}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>{first.maxWeight} kg</span>
          <span style={{ color: trendUp ? '#4CAF50' : '#f5a623', fontSize: 11, fontWeight: 800 }}>{last.maxWeight} kg</span>
        </div>
      </>
    );
  } else {
    svgContent = (
      <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
        Pas encore assez de séances avec cet exercice pour voir une courbe.
      </p>
    );
  }

  return (
    <div style={chartCard}>
      <p style={{ ...sectionLabel, marginBottom: 8 }}>PROGRESSION PAR EXERCICE</p>
      <select
        value={exerciseId}
        onChange={(e) => setExerciseId(e.target.value)}
        style={exerciseSelect}
      >
        {ALL_EXERCISES.map((ex) => (
          <option key={ex.id} value={ex.id}>{ex.name}</option>
        ))}
      </select>
      {svgContent}
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
              <WeeklyBarChart buckets={buckets} valueFn={(b) => b.trainingLoad} color="var(--brand-1)" />
            </div>

            {/* Tonnage hebdo */}
            <div style={chartCard}>
              <p style={sectionLabel}>TONNAGE / SEMAINE (KG)</p>
              <WeeklyBarChart buckets={buckets} valueFn={(b) => b.tonnage} color="#5560cc" />
            </div>

            {/* Progression par exercice */}
            <ProgressionChart history={history} />

            {/* Calendrier des séances */}
            <MonthCalendar history={history} />

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
        {entry.note && (
          <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 3, fontStyle: 'italic', lineHeight: '15px' }}>
            « {entry.note} »
          </p>
        )}
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
  width: 36, height: 36, background: 'var(--bg-elevated)', borderRadius: 'var(--icon-radius)',
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
const calNavBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, background: 'var(--bg-elevated)',
  color: 'var(--text-secondary)', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-strong)',
};
const exerciseSelect: React.CSSProperties = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  borderRadius: 10, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 13,
  marginBottom: 10, fontFamily: 'inherit',
};
const sessionRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 14, padding: '8px 10px 8px 8px', marginBottom: 6,
};
