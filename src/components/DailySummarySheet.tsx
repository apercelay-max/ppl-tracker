import React from 'react';
import type { DailyBriefState } from '../hooks/useDailyBrief';
import { useWorkoutStore } from '../store/workoutStore';
import { formatWeightForDisplay, weightUnitLabel } from '../utils/weight';

interface DailySummarySheetProps {
  firstName?: string;
  state: DailyBriefState;
  onClose: () => void;
}

// Résumé du jour : stats de la semaine, séance conseillée et charges du jour.
// Les chiffres et les charges viennent de l'appli ; le texte, de Gemini
// (préparé en arrière-plan — voir hooks/useDailyBrief.ts).
export const DailySummarySheet: React.FC<DailySummarySheetProps> = ({ firstName, state, onClose }) => {
  const unit = useWorkoutStore((s) => s.weightUnit);
  const { cached, plan, loading, error, refresh } = state;
  const daily = cached?.daily;
  const session = plan.context.session;
  const week = plan.context.week;

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label="Résumé du jour" onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <h2 style={heading}>{firstName ? `Salut ${firstName}` : 'Résumé du jour'}</h2>
        <div style={scroll}>
          {daily ? (
            <p style={lead}>{daily.resume}</p>
          ) : (
            <p style={lead}>
              {loading ? 'Le coach prépare ton résumé…' : error ?? 'Le résumé n’est pas encore prêt.'}
            </p>
          )}

          <section style={block}>
            <h3 style={sub}>Ta semaine</h3>
            <div style={stats}>
              <Stat value={`${week.sessions}${week.goal ? ` / ${week.goal}` : ''}`} label="séances" />
              <Stat value={`${week.tonnageKg}`} label="kg soulevés" />
              <Stat value={`${week.previousTonnageKg}`} label="sem. dernière" />
            </div>
            {daily && <p style={text}>{daily.semaine}</p>}
          </section>

          {session && (
            <section style={block}>
              <h3 style={sub}>Séance conseillée : {session.name}</h3>
              {daily && <p style={text}>{daily.seance}</p>}
              <ul style={ul}>
                {plan.exercises.map((ex) => (
                  <li key={ex.name} style={li}>
                    <span style={{ flex: 1 }}>{ex.name} <span style={dim}>{ex.sets} × {ex.reps}</span></span>
                    <b style={kg}>
                      {ex.suggestedKg !== undefined
                        ? `${formatWeightForDisplay(String(ex.suggestedKg), unit)} ${weightUnitLabel(unit)}`
                        : '—'}
                    </b>
                  </li>
                ))}
              </ul>
              {daily && <p style={text}>{daily.poids}</p>}
            </section>
          )}

          {daily && (
            <section style={block}>
              <h3 style={sub}>Conseil du jour</h3>
              <p style={text}>{daily.conseil}</p>
            </section>
          )}
        </div>
        <div style={actions}>
          <button style={ghost} onClick={refresh} disabled={loading}>{loading ? 'Génération…' : 'Actualiser'}</button>
          <button style={btn} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div style={stat}>
    <b style={{ fontSize: 20, color: 'var(--text-primary)' }}>{value}</b>
    <span style={dim}>{label}</span>
  </div>
);

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
};
const card: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 18, padding: 22, maxWidth: 440, width: '100%',
  maxHeight: '88vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-mid)',
};
const heading: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, marginBottom: 10 };
const scroll: React.CSSProperties = { overflowY: 'auto', flex: 1, minHeight: 0 };
const lead: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.45, marginBottom: 14 };
const block: React.CSSProperties = { marginBottom: 16 };
const sub: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 };
const text: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.45, marginTop: 8 };
const stats: React.CSSProperties = { display: 'flex', gap: 8 };
const stat: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--bg-elevated)', borderRadius: 12, padding: '10px 12px' };
const dim: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11.5 };
const ul: React.CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 };
const li: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 8, color: 'var(--text-primary)', fontSize: 13.5 };
const kg: React.CSSProperties = { color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' };
const actions: React.CSSProperties = { display: 'flex', gap: 10, marginTop: 14 };
const btn: React.CSSProperties = { flex: 1, padding: '13px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))', color: '#fff', fontWeight: 800, fontSize: 15 };
const ghost: React.CSSProperties = { flex: 1, padding: '13px 0', borderRadius: 12, border: '1px solid var(--border-mid)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 15 };
