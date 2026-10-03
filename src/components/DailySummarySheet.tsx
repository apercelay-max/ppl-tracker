import React, { useMemo } from 'react';
import type { DailyBriefState } from '../hooks/useDailyBrief';
import { useWorkoutStore } from '../store/workoutStore';
import { getWorkout } from '../data/workouts';
import { formatWeightForDisplay, weightUnitLabel } from '../utils/weight';
import { getMuscleRecoverySummary } from '../utils/training';

interface DailySummarySheetProps {
  firstName?: string;
  state: DailyBriefState;
  onClose: () => void;
}

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const agoLabel = (ts: number): string => {
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days <= 0) return 'aujourd’hui';
  if (days === 1) return 'hier';
  return `il y a ${days} jours`;
};

// Résumé du jour, en plein écran comme le démarrage : stats de la semaine,
// récupération, dernière séance, séance conseillée avec les charges du jour.
// Les chiffres et les charges viennent de l'appli ; les textes, de Gemini
// (préparés en arrière-plan — voir hooks/useDailyBrief.ts).
export const DailySummarySheet: React.FC<DailySummarySheetProps> = ({ firstName, state, onClose }) => {
  const unit = useWorkoutStore((s) => s.weightUnit);
  const history = useWorkoutStore((s) => s.history);
  const bodyWeightHistory = useWorkoutStore((s) => s.bodyWeightHistory);
  const { cached, plan, loading, error, refresh } = state;
  const daily = cached?.daily;
  const session = plan.context.session;
  const week = plan.context.week;
  const kgLabel = (kg: number) => `${formatWeightForDisplay(String(kg), unit)} ${weightUnitLabel(unit)}`;

  // Séances par jour de la semaine en cours (lundi → dimanche).
  const perDay = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)).getTime();
    for (const e of history) {
      if (e.date < monday) continue;
      counts[(new Date(e.date).getDay() + 6) % 7]++;
    }
    return counts;
  }, [history]);
  const todayIdx = (new Date().getDay() + 6) % 7;

  const recovery = useMemo(() => getMuscleRecoverySummary(history), [history]);
  const last = history[0];
  const lastName = last ? getWorkout(last.dayId)?.name ?? 'Séance' : null;
  const weightDelta = week.previousTonnageKg > 0
    ? Math.round(((week.tonnageKg - week.previousTonnageKg) / week.previousTonnageKg) * 100)
    : null;
  const bodyWeight = bodyWeightHistory.length
    ? bodyWeightHistory.reduce((a, b) => (a.date > b.date ? a : b))
    : null;

  let n = 0;
  const step = (): React.CSSProperties => ({ animationDelay: `${0.15 + 0.1 * n++}s` });

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label="Résumé du jour">
      <button style={closeBtn} onClick={onClose} aria-label="Fermer">✕</button>
      <div style={scroll}>
        <div style={column}>
          <p className="daily-in" style={{ ...eyebrow, ...step() }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="daily-in" style={{ ...title, ...step() }}>{firstName ? `Bonjour ${firstName}` : 'Bonjour'}</h1>

          <p className="daily-in" style={{ ...lead, ...step() }}>
            {daily ? daily.resume : loading ? 'Le coach prépare ton résumé…' : error ?? 'Le résumé n’est pas encore prêt.'}
          </p>

          <section className="daily-in" style={{ ...block, ...step() }}>
            <h2 style={sub}>Ta semaine</h2>
            <div style={stats}>
              <Stat value={`${week.sessions}${week.goal ? ` / ${week.goal}` : ''}`} label="séances" />
              <Stat value={`${week.tonnageKg}`} label="kg soulevés" />
              <Stat value={weightDelta === null ? '—' : `${weightDelta > 0 ? '+' : ''}${weightDelta} %`} label="vs sem. dernière" />
            </div>
            <div style={dayRow}>
              {DAY_LETTERS.map((l, i) => (
                <div key={i} style={dayCol}>
                  <span style={{ ...dayDot, background: perDay[i] > 0 ? 'var(--brand-1)' : 'rgba(255,255,255,0.1)', outline: i === todayIdx ? '2px solid rgba(255,255,255,0.5)' : 'none' }} />
                  <span style={{ ...dim, color: i === todayIdx ? '#fff' : undefined }}>{l}</span>
                </div>
              ))}
            </div>
            {daily && <p style={text}>{daily.semaine}</p>}
          </section>

          <section className="daily-in" style={{ ...block, ...step() }}>
            <h2 style={sub}>Forme & récupération</h2>
            <div style={stats}>
              <Stat value={`${Math.round(recovery.averagePct * 100)} %`} label="récupéré" />
              {recovery.leastRecovered && (
                <Stat value={recovery.leastRecovered.group} label={recovery.leastRecovered.hoursRemaining > 0 ? `encore ${recovery.leastRecovered.hoursRemaining} h` : 'récupéré'} />
              )}
              {last && <Stat value={agoLabel(last.date + last.durationMs)} label="dernière séance" />}
            </div>
            {last && lastName && (
              <p style={text}>
                Dernière séance : {lastName}, {Math.round(last.durationMs / 60000)} min
                {typeof last.tonnage === 'number' ? `, ${Math.round(last.tonnage)} kg soulevés` : ''}
                {typeof last.rpe === 'number' ? `, ressenti ${last.rpe}/10` : ''}.
              </p>
            )}
            {bodyWeight && <p style={text}>Dernier poids de corps : {kgLabel(bodyWeight.weightKg)}.</p>}
          </section>

          {session && (
            <section className="daily-in" style={{ ...block, ...step() }}>
              <h2 style={sub}>Séance conseillée</h2>
              <p style={sessionName}>{session.name}</p>
              {session.focus && <p style={dim}>{session.focus}</p>}
              {daily && <p style={text}>{daily.seance}</p>}
              <ul style={ul}>
                {plan.exercises.map((ex) => (
                  <li key={ex.name} style={li}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ flex: 1, color: '#fff' }}>{ex.name} <span style={dim}>{ex.sets} × {ex.reps}</span></span>
                      <b style={kg}>{ex.suggestedKg !== undefined ? kgLabel(ex.suggestedKg) : '—'}</b>
                    </div>
                    {ex.advice && <p style={adviceStyle}>{ex.advice}</p>}
                  </li>
                ))}
              </ul>
              {daily && <p style={text}>{daily.poids}</p>}
            </section>
          )}

          {daily && (
            <section className="daily-in" style={{ ...block, ...step() }}>
              <h2 style={sub}>Conseil du jour</h2>
              <p style={{ ...text, color: '#fff', fontSize: 15 }}>{daily.conseil}</p>
            </section>
          )}

          <div className="daily-in" style={{ ...actions, ...step() }}>
            <button style={ghost} onClick={refresh} disabled={loading}>{loading ? 'Génération…' : 'Actualiser'}</button>
            <button style={btn} onClick={onClose}>C’est parti</button>
          </div>
          {cached && <p style={{ ...dim, textAlign: 'center', marginTop: 12 }}>Rédigé par {cached.model}</p>}
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div style={stat}>
    <b style={{ fontSize: 20, color: '#fff', lineHeight: 1.15 }}>{value}</b>
    <span style={dim}>{label}</span>
  </div>
);

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column', animation: 'dailyScreenIn 0.45s ease both' };
const scroll: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: 'calc(env(safe-area-inset-top, 0px) + 36px) 20px calc(env(safe-area-inset-bottom, 0px) + 32px)' };
const column: React.CSSProperties = { maxWidth: 560, margin: '0 auto' };
const closeBtn: React.CSSProperties = { position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 14px)', right: 16, zIndex: 2, width: 36, height: 36, borderRadius: 18, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 16 };
const eyebrow: React.CSSProperties = { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 };
const title: React.CSSProperties = { color: '#fff', fontSize: 34, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1, margin: 0 };
const lead: React.CSSProperties = { color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 1.5, margin: '14px 0 26px' };
const block: React.CSSProperties = { marginBottom: 26 };
const sub: React.CSSProperties = { color: 'var(--brand-1)', fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 10px' };
const text: React.CSSProperties = { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.5, marginTop: 10 };
const stats: React.CSSProperties = { display: 'flex', gap: 8 };
const stat: React.CSSProperties = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 12px' };
const dim: React.CSSProperties = { color: 'rgba(255,255,255,0.5)', fontSize: 12 };
const dayRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginTop: 14, padding: '0 6px' };
const dayCol: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 };
const dayDot: React.CSSProperties = { width: 14, height: 14, borderRadius: 7 };
const sessionName: React.CSSProperties = { color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 2px' };
const ul: React.CSSProperties = { listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 };
const li: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px', fontSize: 14 };
const kg: React.CSSProperties = { color: '#fff', fontVariantNumeric: 'tabular-nums', fontSize: 16 };
const adviceStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.55)', fontSize: 12.5, lineHeight: 1.4, margin: '6px 0 0' };
const actions: React.CSSProperties = { display: 'flex', gap: 10 };
const btn: React.CSSProperties = { flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))', color: '#fff', fontWeight: 800, fontSize: 15 };
const ghost: React.CSSProperties = { flex: 1, padding: '14px 0', borderRadius: 14, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: 15 };
