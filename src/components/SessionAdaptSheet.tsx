import React, { useMemo, useState } from 'react';
import type { WorkoutDay } from '../data/types';
import { useWorkoutStore } from '../store/workoutStore';
import {
  buildAdaptation, applyAdaptation, isAdaptationActive, estimateWorkoutMinutes,
  ZONE_LABELS, EMPTY_OPTIONS,
  type AdaptOptions, type SessionAdaptation, type SoreZone,
} from '../utils/gymAdapt';
import { CATALOG_EQUIPMENT, type Equipment } from '../data/exercisesCatalog';

// ─── « Adapter la séance » ─────────────────────────────────────────────────
// Fiche ouverte depuis l'aperçu d'une séance, avant de démarrer. Trois
// réglages, et surtout un aperçu EN DIRECT de ce que ça change : on ne
// démarre jamais une séance modifiée sans avoir vu la liste des
// modifications (c'est ce qui distingue ça d'un mode automatique opaque).

interface Props {
  workout: WorkoutDay;
  onClose: () => void;
  onStart: (adaptation: SessionAdaptation | null) => void;
}

const TIME_CHOICES: (number | null)[] = [null, 30, 40, 50, 60];
const ZONES: SoreZone[] = ['epaule', 'coude-poignet', 'lombaires', 'genou'];

export const SessionAdaptSheet: React.FC<Props> = ({ workout, onClose, onStart }) => {
  const history = useWorkoutStore((s) => s.history);
  const gymProfile = useWorkoutStore((s) => s.gymProfile);
  const setGymProfile = useWorkoutStore((s) => s.setGymProfile);
  const [options, setOptions] = useState<AdaptOptions>(EMPTY_OPTIONS);

  const patch = (p: Partial<AdaptOptions>) => setOptions((o) => ({ ...o, ...p }));
  const toggleZone = (z: SoreZone) =>
    setOptions((o) => ({
      ...o,
      soreZones: o.soreZones.includes(z) ? o.soreZones.filter((v) => v !== z) : [...o.soreZones, z],
    }));

  const toggleEquipment = (eq: Equipment) => {
    const has = gymProfile.availableEquipment.includes(eq);
    setGymProfile({
      availableEquipment: has
        ? gymProfile.availableEquipment.filter((e) => e !== eq)
        : [...gymProfile.availableEquipment, eq],
    });
  };

  // Recalculé à chaque changement d'option : c'est l'aperçu affiché en bas.
  const adaptation = useMemo(
    () => buildAdaptation(workout, options, history, gymProfile),
    [workout, options, history, gymProfile]
  );
  const active = isAdaptationActive(adaptation);
  const adapted = applyAdaptation(workout, adaptation);
  const baseMin = estimateWorkoutMinutes(workout.exercises);

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={handle} />
        <h2 style={title}>Adapter la séance</h2>
        <p style={subtitle}>
          {workout.name} · {workout.exercises.length} exercices · ≈ {baseMin} min à l'origine
        </p>

        <div style={scroll}>
          {/* ── Temps disponible ─────────────────────────────────────────── */}
          <p style={sectionLabel}>J'AI COMBIEN DE TEMPS ?</p>
          <div style={chipRow}>
            {TIME_CHOICES.map((t) => (
              <button
                key={String(t)}
                onClick={() => patch({ timeBudgetMin: t })}
                style={chip(options.timeBudgetMin === t)}
              >
                {t === null ? 'Pas de limite' : `${t} min`}
              </button>
            ))}
          </div>

          {/* ── Forme du jour ────────────────────────────────────────────── */}
          <p style={sectionLabel}>LA FORME DU JOUR</p>
          <button onClick={() => patch({ tired: !options.tired })} style={toggleRow(options.tired)}>
            <span style={{ flex: 1, textAlign: 'left' }}>
              <span style={toggleTitle}>Pas en forme</span>
              <span style={toggleHint}>Charges cibles -10 %, repos +20 %</span>
            </span>
            <Switch on={options.tired} />
          </button>

          <p style={{ ...sectionLabel, marginTop: 14 }}>UNE ARTICULATION SENSIBLE ?</p>
          <div style={chipRow}>
            {ZONES.map((z) => (
              <button key={z} onClick={() => toggleZone(z)} style={chip(options.soreZones.includes(z))}>
                {ZONE_LABELS[z]}
              </button>
            ))}
          </div>

          {/* ── Salle inconnue ───────────────────────────────────────────── */}
          <p style={{ ...sectionLabel, marginTop: 14 }}>JE NE SUIS PAS DANS MA SALLE</p>
          <button onClick={() => patch({ awayGym: !options.awayGym })} style={toggleRow(options.awayGym)}>
            <span style={{ flex: 1, textAlign: 'left' }}>
              <span style={toggleTitle}>Limiter au matériel dispo</span>
              <span style={toggleHint}>Remplace ce qui n'est pas faisable ici</span>
            </span>
            <Switch on={options.awayGym} />
          </button>
          {options.awayGym && (
            <div style={{ ...chipRow, marginTop: 8 }}>
              {CATALOG_EQUIPMENT.filter((eq) => eq !== 'Autre').map((eq) => (
                <button
                  key={eq}
                  onClick={() => toggleEquipment(eq)}
                  style={chip(gymProfile.availableEquipment.includes(eq))}
                >
                  {eq}
                </button>
              ))}
            </div>
          )}

          {/* ── Aperçu ───────────────────────────────────────────────────── */}
          <div style={preview}>
            <div style={previewHead}>
              <span style={previewLabel}>CE QUE ÇA CHANGE</span>
              <span style={previewTime}>
                {baseMin} min → <strong style={{ color: active ? 'var(--brand-1)' : 'var(--text-secondary)' }}>
                  {adaptation.estimatedMin} min
                </strong>
              </span>
            </div>
            {active ? (
              <>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {adaptation.summary.map((line, i) => (
                    <li key={i} style={previewLine}>· {line}</li>
                  ))}
                </ul>
                <p style={previewFooter}>
                  {adapted.exercises.length} exercices ·{' '}
                  {adapted.exercises.reduce((n, e) => n + e.sets, 0)} séries
                </p>
              </>
            ) : (
              <p style={previewLine}>Rien pour l'instant — la séance reste celle du programme.</p>
            )}
          </div>
        </div>

        <div style={actions}>
          <button onClick={onClose} style={ghostBtn}>Annuler</button>
          <button onClick={() => onStart(active ? adaptation : null)} style={primaryBtn}>
            {active ? 'Démarrer adaptée' : 'Démarrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────

const backdrop: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60,
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
};
const sheet: React.CSSProperties = {
  width: '100%', maxWidth: 480, maxHeight: '92vh', display: 'flex', flexDirection: 'column',
  background: 'var(--bg-card)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
  border: '1px solid var(--border-mid)', borderBottom: 'none',
  padding: '10px 18px max(16px, env(safe-area-inset-bottom))',
};
const handle: React.CSSProperties = {
  width: 38, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 12px',
};
const title: React.CSSProperties = {
  color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, letterSpacing: -0.3,
};
const subtitle: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 12, marginTop: 3 };
const scroll: React.CSSProperties = { overflowY: 'auto', paddingTop: 14, flex: 1 };
const sectionLabel: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 9.5, fontWeight: 700, letterSpacing: 1.4, marginBottom: 8,
};
const chipRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 };
const chip = (on: boolean): React.CSSProperties => ({
  padding: '8px 12px', borderRadius: 12, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
  background: on ? 'rgba(var(--brand-1-rgb),0.16)' : 'var(--bg-elevated)',
  border: `1px solid ${on ? 'rgba(var(--brand-1-rgb),0.45)' : 'var(--border-strong)'}`,
  color: on ? 'var(--brand-1)' : 'var(--text-muted)',
});
const toggleRow = (on: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
  padding: '11px 14px', borderRadius: 14, cursor: 'pointer',
  background: on ? 'rgba(var(--brand-1-rgb),0.12)' : 'var(--bg-surface)',
  border: `1px solid ${on ? 'rgba(var(--brand-1-rgb),0.4)' : 'var(--border)'}`,
});
const toggleTitle: React.CSSProperties = {
  display: 'block', color: 'var(--text-primary)', fontSize: 14, fontWeight: 700,
};
const toggleHint: React.CSSProperties = {
  display: 'block', color: 'var(--text-dim)', fontSize: 11, marginTop: 2,
};
/** Interrupteur façon iOS — purement visuel, le clic est sur la ligne entière. */
const Switch: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    aria-hidden="true"
    style={{
      width: 44, height: 26, borderRadius: 13, flexShrink: 0, position: 'relative',
      background: on ? 'var(--brand-1)' : 'var(--bg-higher)',
      border: '1px solid var(--border-strong)',
      transition: 'background 0.2s',
    }}
  >
    <span
      style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 20, height: 20, borderRadius: 10, background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
        transition: 'left 0.2s cubic-bezier(0.34, 1.4, 0.64, 1)',
      }}
    />
  </span>
);
const preview: React.CSSProperties = {
  marginTop: 16, marginBottom: 4, padding: 14, borderRadius: 16,
  background: 'var(--bg-base)', border: '1px solid var(--border)',
};
const previewHead: React.CSSProperties = {
  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 8,
};
const previewLabel: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 9.5, fontWeight: 700, letterSpacing: 1.4,
};
const previewTime: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 };
const previewLine: React.CSSProperties = {
  color: 'var(--text-secondary)', fontSize: 12.5, lineHeight: '18px', marginBottom: 3,
};
const previewFooter: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 11.5, marginTop: 8,
  paddingTop: 8, borderTop: '1px solid var(--border-subtle)',
};
const actions: React.CSSProperties = {
  display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', marginTop: 8,
};
const ghostBtn: React.CSSProperties = {
  padding: '14px 18px', borderRadius: 16, cursor: 'pointer',
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  color: 'var(--text-muted)', fontSize: 14, fontWeight: 700,
};
const primaryBtn: React.CSSProperties = {
  flex: 1, padding: '14px', borderRadius: 16, cursor: 'pointer', border: 'none',
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  color: '#fff', fontSize: 15, fontWeight: 800,
};
