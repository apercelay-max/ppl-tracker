import React, { useState } from 'react';
import { useWorkoutStore, CARDIO_TYPE_LABELS } from '../store/workoutStore';
import type { CardioActivityType } from '../data/types';

interface CardioScreenProps { onBack: () => void; }

const CARDIO_TYPES: CardioActivityType[] = ['velo', 'marche', 'course', 'autre'];

const formatCardioDate = (ts: number): string => {
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export const CardioScreen: React.FC<CardioScreenProps> = ({ onBack }) => {
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
    <div style={container}>
      <div style={scroll}>

        <div style={headerRow}>
          <button onClick={onBack} style={backBtn} aria-label="Retour">←</button>
          <div>
            <h1 style={title}>🏃 Cardio</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Vélo, marche, course...</p>
          </div>
        </div>

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
                  <span style={{ fontSize: 16 }}>{CARDIO_TYPE_LABELS[t].emoji}</span>
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
              <div key={entry.id} style={row}>
                <span style={{ fontSize: 18 }}>{CARDIO_TYPE_LABELS[entry.type].emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>{CARDIO_TYPE_LABELS[entry.type].label}</p>
                  <p style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                    {formatCardioDate(entry.date)} · {entry.durationMin} min · {entry.calories} kcal{entry.rpe ? ` · RPE ${entry.rpe}` : ''}
                  </p>
                </div>
                <button onClick={() => deleteCardioEntry(entry.id)} style={deleteBtn}>✕</button>
              </div>
            ))}
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
