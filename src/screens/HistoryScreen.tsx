import React, { useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { getWorkout } from '../data/workouts';
import { computeTonnage } from '../utils/training';
import type { HistoryEntry } from '../data/types';

interface HistoryScreenProps { onBack: () => void; }

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
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// Calendrier mensuel des séances — vivait avant dans le Dashboard, déplacé
// ici pour que tout ce qui touche à "quand j'ai fait quoi" soit regroupé
// dans Historique plutôt qu'éparpillé entre deux écrans.
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

// L'historique est déjà stocké du plus récent au plus ancien (voir
// finishSession dans workoutStore.ts) — pas besoin de re-trier ici.
export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const history = useWorkoutStore((s) => s.history);

  return (
    <div style={container}>
      <div style={scroll}>

        <div style={headerRow}>
          <button onClick={onBack} style={backBtn} aria-label="Retour">←</button>
          <div>
            <h1 style={title}>🗓️ Historique</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{history.length} séance{history.length > 1 ? 's' : ''} enregistrée{history.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        <MonthCalendar history={history} />

        {history.length === 0 ? (
          <div style={card}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: '18px', textAlign: 'center' }}>
              Pas encore de séance terminée. Ton journal d'entraînement apparaîtra ici au fil du temps.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((entry) => {
              const workout = getWorkout(entry.dayId);
              const accent = DAY_ACCENT[entry.dayId] ?? 'var(--brand-1)';
              const tonnage = entry.tonnage ?? computeTonnage(entry.exerciseProgress);
              const minutes = Math.round(entry.durationMs / 60000);
              return (
                <div key={entry.id} style={{ ...row, borderLeft: `3px solid ${accent}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ color: accent, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{DAY_TYPE_LABEL[entry.dayId] ?? ''}</p>
                      <p style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 800, marginTop: 2 }}>{workout?.name ?? entry.dayId}</p>
                    </div>
                    <p style={{ color: 'var(--text-dim)', fontSize: 11, whiteSpace: 'nowrap' }}>{formatDate(entry.date)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={statChip}>⏱ {minutes} min</span>
                    <span style={statChip}>🏋️ {Math.round(tonnage)} kg</span>
                    {entry.rpe && <span style={statChip}>💥 RPE {entry.rpe}</span>}
                  </div>
                  {entry.note && (
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8, lineHeight: '17px', fontStyle: 'italic' }}>
                      "{entry.note}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto', background: 'var(--bg-base)' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 112px' };
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
const card: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14, padding: 20,
  border: '1px solid var(--border-mid)',
};
const row: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14, padding: 14,
  border: '1px solid var(--border-mid)',
};
const statChip: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 11.5, fontWeight: 600,
};
const chartCard: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 16, padding: 14, marginBottom: 16,
  border: '1px solid var(--border-mid)',
};
const calNavBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, background: 'var(--bg-elevated)',
  color: 'var(--text-secondary)', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-strong)',
};
