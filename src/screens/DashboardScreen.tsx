import React, { useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { getWorkout } from '../data/workouts';
import { HistoryEntry } from '../data/types';
import {
  bucketByWeek, computeLoadStatus, computeTonnage, WeekBucket,
  ALL_EXERCISES, getExerciseWeightHistory, getMuscleGroupVolume,
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

const formatAxisValue = (v: number): string => {
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `${Math.round(v)}`;
};

const WeeklyBarChart: React.FC<{
  buckets: WeekBucket[];
  valueFn: (b: WeekBucket) => number;
  color: string;
}> = ({ buckets, valueFn, color }) => {
  const max = Math.max(1, ...buckets.map(valueFn));
  const CHART_H = 72;
  return (
    <div style={{ display: 'flex', gap: 8, height: 84 }}>
      {/* Axe Y : repères haut / milieu / 0 */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: CHART_H, paddingBottom: 12 }}>
        <span style={axisLabel}>{formatAxisValue(max)}</span>
        <span style={axisLabel}>{formatAxisValue(max / 2)}</span>
        <span style={axisLabel}>0</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flex: 1, position: 'relative' }}>
        {/* Lignes de repère horizontales */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: CHART_H, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
          <div style={axisGridline} />
          <div style={axisGridline} />
          <div style={axisGridline} />
        </div>
        {buckets.map((b, i) => {
          const v = valueFn(b);
          const h = v > 0 ? Math.max(4, (v / max) * CHART_H) : 2;
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
  const CHART_H = 110;
  const PAD_TOP = 10;
  const PAD_BOTTOM = 18;
  const AXIS_W = 28; // largeur réservée aux libellés de l'axe Y

  let svgContent: React.ReactNode = null;
  if (points.length >= 2) {
    const weights = points.map((p) => p.maxWeight);
    const dataMin = Math.min(...weights);
    const dataMax = Math.max(...weights);
    // Un peu de marge au-dessus/en dessous pour que les points ne touchent
    // pas les bords du graphique.
    const pad = (dataMax - dataMin) * 0.15 || dataMax * 0.1 || 1;
    const min = Math.max(0, dataMin - pad);
    const max = dataMax + pad;
    const range = max - min || 1;
    const plotX0 = AXIS_W;
    const plotW = CHART_W - AXIS_W - 8;
    const yFor = (w: number) => CHART_H - PAD_BOTTOM - ((w - min) / range) * (CHART_H - PAD_TOP - PAD_BOTTOM);
    const coords = points.map((p, i) => ({
      x: plotX0 + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW),
      y: yFor(p.maxWeight),
      w: p.maxWeight,
    }));
    const path = coords.map((c) => `${c.x},${c.y}`).join(' ');
    const last = points[points.length - 1];
    const first = points[0];
    const trendUp = last.maxWeight >= first.maxWeight;
    const lineColor = trendUp ? '#4CAF50' : '#f5a623';
    const midVal = (min + max) / 2;
    const dateFmt = (ts: number) => new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    svgContent = (
      <>
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ width: '100%', height: 100, display: 'block' }}>
          {/* Axe Y : lignes de repère + valeurs */}
          {[max, midVal, min].map((v, i) => {
            const y = yFor(v);
            return (
              <g key={i}>
                <line x1={plotX0} y1={y} x2={CHART_W} y2={y} stroke="var(--border-subtle)" strokeWidth={1} />
                <text x={plotX0 - 4} y={y + 3} textAnchor="end" fontSize="8" fill="var(--text-dim)">{Math.round(v)}</text>
              </g>
            );
          })}
          <polyline points={path} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {coords.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 3.5 : 2} fill={lineColor} />
          ))}
          {/* Axe X : première et dernière date */}
          <text x={plotX0} y={CHART_H - 4} textAnchor="start" fontSize="8" fill="var(--text-dim)">{dateFmt(first.date)}</text>
          <text x={CHART_W} y={CHART_H - 4} textAnchor="end" fontSize="8" fill="var(--text-dim)">{dateFmt(last.date)}</text>
        </svg>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
          <span style={{ color: lineColor, fontSize: 11, fontWeight: 800 }}>{last.maxWeight} kg</span>
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

const MUSCLE_VOLUME_COLORS = ['#7c6fcd', '#e03030', '#e8a020', '#4CAF50', '#5560cc', '#f5a623', '#cc2828', '#7a7a90', '#3b9dcc', '#c46ad1', '#8fae3f', '#d67a3a'];

type VolumeUnit = 'kg' | 'reps';

const MuscleGroupVolumeChart: React.FC<{ history: HistoryEntry[] }> = ({ history }) => {
  const [unit, setUnit] = useState<VolumeUnit>('kg');
  const raw = getMuscleGroupVolume(history, 4);
  const valueOf = (v: { tonnage: number; totalReps: number }) => (unit === 'kg' ? v.tonnage : v.totalReps);
  const volumes = [...raw].sort((a, b) => valueOf(b) - valueOf(a));
  const max = Math.max(1, ...volumes.map(valueOf));
  const anyData = volumes.some((v) => valueOf(v) > 0);

  return (
    <div style={chartCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ ...sectionLabel, marginBottom: 0 }}>VOLUME PAR GROUPE MUSCULAIRE (4 SEM.)</p>
        <div style={unitToggleTrack}>
          <button onClick={() => setUnit('kg')} style={{ ...unitToggleBtn, background: unit === 'kg' ? 'var(--brand-1)' : 'transparent', color: unit === 'kg' ? '#fff' : 'var(--text-muted)' }}>kg</button>
          <button onClick={() => setUnit('reps')} style={{ ...unitToggleBtn, background: unit === 'reps' ? 'var(--brand-1)' : 'transparent', color: unit === 'reps' ? '#fff' : 'var(--text-muted)' }}>reps</button>
        </div>
      </div>
      {!anyData ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '10px 0' }}>
          Pas encore de séries chiffrées sur les 4 dernières semaines.
        </p>
      ) : (
        <>
          {/* Axe : repères 0 / milieu / max, alignés avec les barres */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, paddingLeft: 2 }}>
            <span style={axisLabel}>0</span>
            <span style={axisLabel}>{formatAxisValue(max / 2)}</span>
            <span style={axisLabel}>{formatAxisValue(max)}{unit === 'kg' ? ' kg' : ' reps'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {volumes.map((v, i) => {
              const val = valueOf(v);
              const isZero = val === 0;
              return (
                <div key={v.group} style={{ opacity: isZero ? 0.45 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700 }}>{v.group}</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 700 }}>
                      {isZero ? 'pas travaillé' : `${val.toLocaleString('fr-FR')} ${unit === 'kg' ? 'kg' : 'reps'}`}
                    </span>
                  </div>
                  <div style={{ height: 7, borderRadius: 4, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: isZero ? '2%' : `${Math.max(3, (val / max) * 100)}%`,
                      background: isZero ? 'var(--border-strong)' : MUSCLE_VOLUME_COLORS[i % MUSCLE_VOLUME_COLORS.length],
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
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

            {/* Volume par groupe musculaire */}
            <MuscleGroupVolumeChart history={history} />

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

const axisLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 9, fontWeight: 700 };
const axisGridline: React.CSSProperties = { borderTop: '1px dashed var(--border-subtle)', width: '100%', height: 0 };
const unitToggleTrack: React.CSSProperties = {
  display: 'flex', gap: 2, background: 'var(--bg-elevated)', borderRadius: 8, padding: 2,
  border: '1px solid var(--border-strong)', flexShrink: 0,
};
const unitToggleBtn: React.CSSProperties = {
  padding: '4px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s',
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
