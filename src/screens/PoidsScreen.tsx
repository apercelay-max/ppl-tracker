import React, { useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { MiniLineChart } from '../components/MiniLineChart';
import { MassUnit } from '../data/types';

interface PoidsScreenProps { onBack: () => void; }

const formatDate = (ts: number): string => {
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
};

const formatMass = (value: number, unit: MassUnit): string => (unit === 'percent' ? `${value} %` : `${value} kg`);

// Petit sélecteur % / kg réutilisé pour la masse graisseuse et la masse
// musculaire — pas de conversion entre les deux, on garde juste l'unité
// choisie par l'utilisateur au moment de la saisie.
const UnitToggle: React.FC<{ value: MassUnit; onChange: (u: MassUnit) => void }> = ({ value, onChange }) => (
  <div style={unitToggleWrap}>
    <button
      type="button"
      onClick={() => onChange('percent')}
      style={value === 'percent' ? unitBtnActive : unitBtn}
    >
      %
    </button>
    <button
      type="button"
      onClick={() => onChange('kg')}
      style={value === 'kg' ? unitBtnActive : unitBtn}
    >
      kg
    </button>
  </div>
);

export const PoidsScreen: React.FC<PoidsScreenProps> = ({ onBack }) => {
  const bodyWeightHistory = useWorkoutStore((s) => s.bodyWeightHistory);
  const addBodyWeightEntry = useWorkoutStore((s) => s.addBodyWeightEntry);
  const deleteBodyWeightEntry = useWorkoutStore((s) => s.deleteBodyWeightEntry);

  const [input, setInput] = useState('');
  const [fatInput, setFatInput] = useState('');
  const [fatUnit, setFatUnit] = useState<MassUnit>('percent');
  const [muscleInput, setMuscleInput] = useState('');
  const [muscleUnit, setMuscleUnit] = useState<MassUnit>('percent');

  const handleAdd = () => {
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    const fatVal = fatInput.trim() ? parseFloat(fatInput.replace(',', '.')) : NaN;
    const muscleVal = muscleInput.trim() ? parseFloat(muscleInput.replace(',', '.')) : NaN;

    addBodyWeightEntry(
      val,
      !isNaN(fatVal) && fatVal > 0 ? { value: fatVal, unit: fatUnit } : undefined,
      !isNaN(muscleVal) && muscleVal > 0 ? { value: muscleVal, unit: muscleUnit } : undefined,
    );
    setInput('');
    setFatInput('');
    setMuscleInput('');
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
          </div>

          <p style={fieldLabel}>MASSE GRAISSEUSE (facultatif)</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              inputMode="decimal"
              placeholder={fatUnit === 'percent' ? 'Ex : 18' : 'Ex : 12.5'}
              value={fatInput}
              onChange={(e) => setFatInput(e.target.value)}
              style={inputStyle}
            />
            <UnitToggle value={fatUnit} onChange={setFatUnit} />
          </div>

          <p style={fieldLabel}>MASSE MUSCULAIRE (facultatif)</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              inputMode="decimal"
              placeholder={muscleUnit === 'percent' ? 'Ex : 42' : 'Ex : 30'}
              value={muscleInput}
              onChange={(e) => setMuscleInput(e.target.value)}
              style={inputStyle}
            />
            <UnitToggle value={muscleUnit} onChange={setMuscleUnit} />
          </div>

          <button onClick={handleAdd} style={addBtnFull}>Enregistrer</button>

          {last && (
            <div style={{ marginTop: 12 }}>
              <p style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                Dernière pesée : <strong style={{ color: 'var(--text-secondary)' }}>{last.weightKg} kg</strong> ({formatDate(last.date)})
              </p>
              {(last.bodyFat || last.muscleMass) && (
                <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 4 }}>
                  {last.bodyFat && (
                    <>Masse graisseuse : <strong style={{ color: 'var(--text-secondary)' }}>{formatMass(last.bodyFat.value, last.bodyFat.unit)}</strong></>
                  )}
                  {last.bodyFat && last.muscleMass && '  ·  '}
                  {last.muscleMass && (
                    <>Masse musculaire : <strong style={{ color: 'var(--text-secondary)' }}>{formatMass(last.muscleMass.value, last.muscleMass.unit)}</strong></>
                  )}
                </p>
              )}
            </div>
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
                  {(entry.bodyFat || entry.muscleMass) && (
                    <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>
                      {entry.bodyFat && `Graisse ${formatMass(entry.bodyFat.value, entry.bodyFat.unit)}`}
                      {entry.bodyFat && entry.muscleMass && '  ·  '}
                      {entry.muscleMass && `Muscle ${formatMass(entry.muscleMass.value, entry.muscleMass.unit)}`}
                    </p>
                  )}
                  <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>{formatDate(entry.date)}</p>
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
const fieldLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, margin: '12px 0 6px' };
const card: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14, padding: 14,
  border: '1px solid var(--border-mid)', marginBottom: 8,
};
const inputStyle: React.CSSProperties = {
  flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  borderRadius: 10, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit',
};
const addBtnFull: React.CSSProperties = {
  width: '100%', marginTop: 14,
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
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
const unitToggleWrap: React.CSSProperties = {
  display: 'flex', flexShrink: 0, background: 'var(--bg-elevated)',
  border: '1px solid var(--border-strong)', borderRadius: 10, overflow: 'hidden',
};
const unitBtn: React.CSSProperties = {
  padding: '9px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-dim)',
  background: 'transparent', cursor: 'pointer',
};
const unitBtnActive: React.CSSProperties = {
  ...unitBtn,
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  color: '#fff',
};
