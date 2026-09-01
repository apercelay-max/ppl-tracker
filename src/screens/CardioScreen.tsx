import React, { useState } from 'react';
import { DataIcon } from '../components/DataIcon';
import { IconActivity, IconArrowLeft, IconBike, IconClose } from '../components/Icons';
import { GlassIcon } from '../components/GlassIcon';
import { useWorkoutStore, CARDIO_TYPE_LABELS } from '../store/workoutStore';
import type { CardioActivityType, CardioStats } from '../data/types';

interface CardioScreenProps { onBack: () => void; onStartActivity?: (mode: CardioActivityType) => void; }

const CARDIO_TYPES: CardioActivityType[] = ['velo', 'marche', 'course', 'autre'];

// Les trois activités qui ont un écran en direct. « Autre » n'en a pas : sans
// capteur ni GPS, ce serait un chrono sans rien autour.
const LIVE_MODES: { mode: CardioActivityType; label: string; hint: string }[] = [
  { mode: 'velo', label: 'Mode vélo', hint: 'Chrono, puissance, cadence — en direct' },
  { mode: 'course', label: 'Mode course', hint: 'Distance et allure au GPS' },
  { mode: 'marche', label: 'Mode marche', hint: 'Distance et allure au GPS' },
];

const formatCardioDate = (ts: number): string => {
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export const CardioScreen: React.FC<CardioScreenProps> = ({ onBack, onStartActivity }) => {
  const cardioHistory = useWorkoutStore((s) => s.cardioHistory);
  const addCardioEntry = useWorkoutStore((s) => s.addCardioEntry);
  const deleteCardioEntry = useWorkoutStore((s) => s.deleteCardioEntry);

  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState<CardioActivityType>('velo');
  const [duration, setDuration] = useState(30);
  const [rpe, setRpe] = useState<number | null>(null);

  const handleAdd = () => {
    addCardioEntry(type, duration, rpe ?? undefined);
    setFormOpen(false);
    setDuration(30);
    setRpe(null);
  };

  const now = Date.now();
  const weekEntries = cardioHistory.filter((e) => now - e.date < 7 * 86400000);
  const weekMinutes = weekEntries.reduce((sum, e) => sum + e.durationMin, 0);
  const weekCalories = weekEntries.reduce((sum, e) => sum + e.calories, 0);

  return (
    <div className="screen-ambient" style={container}>
      <div style={scroll}>

        <div style={headerRow}>
          <button onClick={onBack} className="glass-icon" style={backBtn} aria-label="Retour"><IconArrowLeft size={17} /></button>
          <GlassIcon size={38} accent><IconActivity size={19} /></GlassIcon>
          <div>
            <h1 style={title}>Cardio</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Vélo, marche, course...</p>
          </div>
        </div>

        {/* Mode vélo — séance en direct, avec les mesures du vélo si un
            capteur Bluetooth est disponible. */}
        {/* Séances en direct : chrono + mesures. Le vélo lit le Bluetooth,
            la marche et la course le GPS (qui, lui, marche sur iPhone). */}
        {onStartActivity && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {LIVE_MODES.map((m) => (
              <button key={m.mode} onClick={() => onStartActivity(m.mode)} className="glass-card" style={liveCta}>
                <GlassIcon size={40} accent><DataIcon name={CARDIO_TYPE_LABELS[m.mode].icon} size={20} /></GlassIcon>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  <span style={{ display: 'block', color: 'var(--text-primary)', fontSize: 15, fontWeight: 800 }}>{m.label}</span>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11.5, marginTop: 2 }}>{m.hint}</span>
                </span>
                <span style={{ color: 'var(--text-dim)', fontSize: 17 }}>›</span>
              </button>
            ))}
          </div>
        )}

        {/* Résumé de la semaine */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={statBlock}>
            <span style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 }}>{weekEntries.length}</span>
            <span style={statLabel}>SÉANCES CETTE SEM.</span>
          </div>
          <div style={statBlock}>
            <span style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 }}>{weekMinutes}</span>
            <span style={statLabel}>MIN CETTE SEM.</span>
          </div>
          <div style={statBlock}>
            <span style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 }}>{weekCalories}</span>
            <span style={statLabel}>KCAL CETTE SEM.</span>
          </div>
        </div>

        {!formOpen ? (
          <button onClick={() => setFormOpen(true)} style={addBtn}>+ Ajouter une séance</button>
        ) : (
          <div style={card}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {CARDIO_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    ...typeBtn,
                    background: type === t ? 'var(--brand-1)' : 'var(--bg-elevated)',
                    color: type === t ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  <span style={{ display: 'inline-flex' }}><DataIcon name={CARDIO_TYPE_LABELS[t].icon} size={16} /></span>
                  <span style={{ fontSize: 9, fontWeight: 700 }}>{CARDIO_TYPE_LABELS[t].label}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, flex: 1 }}>Durée</span>
              <button onClick={() => setDuration((d) => Math.max(5, d - 5))} style={stepBtn}>−</button>
              <span style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 800, width: 56, textAlign: 'center' }}>{duration} min</span>
              <button onClick={() => setDuration((d) => Math.min(240, d + 5))} style={stepBtn}>+</button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>Ressenti (facultatif)</p>
            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setRpe(rpe === n ? null : n)}
                  style={{
                    ...rpeBtn,
                    background: rpe === n ? 'var(--brand-1)' : 'var(--bg-elevated)',
                    color: rpe === n ? '#fff' : 'var(--text-dim)',
                  }}
                >{n}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleAdd} style={validateBtn}>Enregistrer</button>
              <button onClick={() => setFormOpen(false)} style={cancelBtn}>Annuler</button>
            </div>
          </div>
        )}

        <p style={{ ...sectionLabel, marginTop: 20 }}>HISTORIQUE</p>
        {cardioHistory.length === 0 ? (
          <div style={card}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: '18px', textAlign: 'center' }}>
              Pas encore de séance cardio enregistrée.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cardioHistory.map((entry) => (
              <div key={entry.id} style={{ ...row, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', color: 'var(--text-muted)' }}><DataIcon name={CARDIO_TYPE_LABELS[entry.type].icon} size={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>{CARDIO_TYPE_LABELS[entry.type].label}</p>
                  <p style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                    {formatCardioDate(entry.date)} · {entry.durationMin} min · {entry.calories} kcal{entry.rpe ? ` · RPE ${entry.rpe}` : ''}
                  </p>
                </div>
                <button onClick={() => deleteCardioEntry(entry.id)} style={deleteBtn} aria-label="Supprimer"><IconClose size={13} /></button>

                {/* Ce que les capteurs ont mesuré. Jusqu'ici c'était enregistré
                    mais affiché nulle part. Chaque tuile n'apparaît que si la
                    donnée existe : une sortie saisie à la main n'en a aucune. */}
                {entry.stats && hasMeasures(entry.stats) && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%', marginTop: 6 }}>
                    <Measure label="Puiss. moy." value={entry.stats.avgPower} unit="W" />
                    <Measure label="Puiss. max" value={entry.stats.maxPower} unit="W" />
                    <Measure label="Cadence" value={entry.stats.avgCadence} unit="rpm" />
                    <Measure label="Distance" value={entry.stats.distanceKm} unit="km" decimals={2} />
                    <Measure label="FC moy." value={entry.stats.avgHr} unit="bpm" />
                    <Measure label="FC max" value={entry.stats.maxHr} unit="bpm" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto' };
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
const sectionLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 };
const statBlock: React.CSSProperties = {
  flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 14, padding: '12px 4px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
};
const statLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 8, fontWeight: 700, letterSpacing: 1, textAlign: 'center' };
const card: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14, padding: 14,
  border: '1px solid var(--border-mid)', marginBottom: 8,
};
const addBtn: React.CSSProperties = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  borderRadius: 14, padding: '14px 8px', color: 'var(--brand-1)', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 8,
};
const typeBtn: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
  padding: '8px 2px', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border-strong)',
};
const stepBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  color: 'var(--text-muted)', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const rpeBtn: React.CSSProperties = {
  flex: 1, height: 26, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
};
const validateBtn: React.CSSProperties = {
  flex: 1, background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  borderRadius: 10, padding: '10px 8px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
const cancelBtn: React.CSSProperties = {
  flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  borderRadius: 10, padding: '10px 8px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
const row: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  borderRadius: 14, padding: '10px 12px',
};
const deleteBtn: React.CSSProperties = {
  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
  background: 'var(--bg-elevated)', color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const liveCta: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14, width: '100%', cursor: 'pointer',
  borderRadius: 26, padding: '14px 18px',
};

/** Vrai dès qu'au moins une mesure chiffrée existe. */
const hasMeasures = (st: CardioStats): boolean =>
  [st.avgPower, st.maxPower, st.avgCadence, st.maxCadence, st.avgSpeed, st.distanceKm, st.avgHr, st.maxHr]
    .some((v) => v != null && v > 0);

const Measure: React.FC<{ label: string; value?: number; unit: string; decimals?: number }> = ({ label, value, unit, decimals = 0 }) => {
  if (value == null || value <= 0) return null;
  return (
    <span className="glass-tile" style={measureTile}>
      <span style={{ color: 'var(--text-dim)', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 800 }} className="tabular">
        {value.toFixed(decimals)} {unit}
      </span>
    </span>
  );
};

const measureTile: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 1,
  borderRadius: 13, padding: '6px 10px',
};
