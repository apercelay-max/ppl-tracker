import React, { useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { MiniLineChart } from '../components/MiniLineChart';

interface PoidsScreenProps { onBack: () => void; }

const formatDate = (ts: number): string => {
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
};

export const PoidsScreen: React.FC<PoidsScreenProps> = ({ onBack }) => {
  const bodyWeightHistory = useWorkoutStore((s) => s.bodyWeightHistory);
  const addBodyWeightEntry = useWorkoutStore((s) => s.addBodyWeightEntry);
  const deleteBodyWeightEntry = useWorkoutStore((s) => s.deleteBodyWeightEntry);
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    addBodyWeightEntry(val);
    setInput('');
  };

  // bodyWeightHistory est stocké du plus récent au plus ancien (comme les
  // autres historiques de l'appli) — on inverse pour le graphique.
  const chartPoints = [...bodyWeightHistory].reverse().map((e) => ({ date: e.date, value: e.weightKg }));
  const last = bodyWeightHistory[0];

  return (
    <div style={container}>
      <div style={scroll}>

        <div style={headerRow}>
          <button onClick={onBack} style={backBtn} aria-label="Retour">←</button>
          <div>
            <h1 style={title}>⚖️ Poids</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Fonctionnalité en essai — dis-moi ce que t'en penses</p>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Ton poids (kg)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={inputStyle}
            />
            <button onClick={handleAdd} style={addBtn}>Enregistrer</button>
          </div>
          {last && (
            <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 10 }}>
              Dernière valeur : <strong style={{ color: 'var(--text-secondary)' }}>{last.weightKg} kg</strong> ({formatDate(last.date)})
            </p>
          )}
        </div>

        <p style={{ ...sectionLabel, marginTop: 16 }}>ÉVOLUTION</p>
        <div style={card}>
          <MiniLineChart points={chartPoints} unit="kg" emptyMessage="Ajoute au moins deux pesées pour voir ta courbe." />
        </div>

        <p style={{ ...sectionLabel, marginTop: 16 }}>HISTORIQUE</p>
        {bodyWeightHistory.length === 0 ? (
          <div style={card}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: '18px', textAlign: 'center' }}>
              Pas encore de pesée enregistrée.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bodyWeightHistory.map((entry) => (
              <div key={entry.id} style={row}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>{entry.weightKg} kg</p>
                  <p style={{ color: 'var(--text-dim)', fontSize: 11 }}>{formatDate(entry.date)}</p>
                </div>
                <button onClick={() => deleteBodyWeightEntry(entry.id)} style={deleteBtn}>✕</button>
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
const card: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14, padding: 14,
  border: '1px solid var(--border-mid)', marginBottom: 8,
};
const inputStyle: React.CSSProperties = {
  flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit',
};
const addBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
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
