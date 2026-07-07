import React, { useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { ALL_EXERCISES, ALL_MUSCLE_GROUPS, getExerciseWeightHistory, getMaxWeightEver, getExerciseE1RMHistory, getMaxE1RMEver } from '../utils/training';
import { MiniLineChart } from '../components/MiniLineChart';

interface ExercicesScreenProps { onBack: () => void; }

const formatLastDate = (ts: number): string => {
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays <= 0) return "aujourd'hui";
  if (diffDays === 1) return 'hier';
  if (diffDays < 7) return `il y a ${diffDays} j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export const ExercicesScreen: React.FC<ExercicesScreenProps> = ({ onBack }) => {
  const history = useWorkoutStore((s) => s.history);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // Vue affichée dans le graphique déplié : poids max soulevé, ou 1RM estimé
  // (formule d'Epley) — partagée par toutes les cartes pour rester cohérent
  // en parcourant la liste.
  const [chartMode, setChartMode] = useState<'weight' | 'e1rm'>('weight');

  // Recherche insensible à la casse et aux accents (ex: "developpe" trouve
  // "Développé couché") — pratique sur mobile où taper les accents est pénible.
  const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const normalizedQuery = normalize(query.trim());

  const groups = ALL_MUSCLE_GROUPS
    .map((group) => ({
      group,
      exercises: ALL_EXERCISES.filter((ex) =>
        ex.muscleGroup === group && (normalizedQuery === '' || normalize(ex.name).includes(normalizedQuery))
      ),
    }))
    .filter((g) => g.exercises.length > 0);

  return (
    <div style={container}>
      <div style={scroll}>

        <div style={headerRow}>
          <button onClick={onBack} style={backBtn} aria-label="Retour">←</button>
          <div>
            <h1 style={title}>🏋️ Exercices</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Ta progression, exercice par exercice</p>
          </div>
        </div>

        <div style={searchWrap}>
          <span style={searchIcon}>🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un exercice..."
            style={searchInput}
          />
          {query !== '' && (
            <button onClick={() => setQuery('')} style={searchClearBtn} aria-label="Effacer">✕</button>
          )}
        </div>

        {groups.length === 0 && (
          <p style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', marginTop: 24 }}>
            Aucun exercice ne correspond à "{query}".
          </p>
        )}

        <div style={modeSwitch}>
          <button
            onClick={() => setChartMode('weight')}
            style={{ ...modeBtn, ...(chartMode === 'weight' ? modeBtnActive : {}) }}
          >
            Poids soulevé
          </button>
          <button
            onClick={() => setChartMode('e1rm')}
            style={{ ...modeBtn, ...(chartMode === 'e1rm' ? modeBtnActive : {}) }}
          >
            1RM estimé
          </button>
        </div>
        {chartMode === 'e1rm' && (
          <p style={{ color: 'var(--text-dim)', fontSize: 10.5, lineHeight: '14px', marginTop: -10, marginBottom: 16 }}>
            Estimation (formule d'Epley) à partir de ton poids × reps — une tendance, pas une vraie mesure de force max.
          </p>
        )}

        {groups.map(({ group, exercises }) => (
          <div key={group} style={{ marginBottom: 18 }}>
            <p style={sectionLabel}>{group}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {exercises.map((ex) => {
                const isOpen = openId === ex.id;
                const max = getMaxWeightEver(history, ex.id);
                const maxE1rm = getMaxE1RMEver(history, ex.id);
                const points = getExerciseWeightHistory(history, ex.id);
                const e1rmPoints = getExerciseE1RMHistory(history, ex.id);
                const lastPoint = points[points.length - 1];
                const chartPoints = chartMode === 'weight'
                  ? points.map((p) => ({ date: p.date, value: p.maxWeight }))
                  : e1rmPoints.map((p) => ({ date: p.date, value: p.e1rm }));
                return (
                  <div key={ex.id} style={card}>
                    <button onClick={() => setOpenId(isOpen ? null : ex.id)} style={exRow}>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>{ex.name}</p>
                        <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>
                          {chartMode === 'weight'
                            ? (max > 0 ? `Record : ${max} kg` : 'Pas encore testé')
                            : (maxE1rm > 0 ? `1RM est. : ~${Math.round(maxE1rm)} kg` : 'Pas encore testé')}
                          {lastPoint ? ` · dernière fois ${formatLastDate(lastPoint.date)}` : ''}
                        </p>
                      </div>
                      <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{isOpen ? '▴' : '▾'}</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '4px 2px 2px' }}>
                        <MiniLineChart
                          points={chartPoints}
                          unit="kg"
                          emptyMessage="Pas encore assez de séances chiffrées sur cet exercice pour voir une courbe."
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

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
  background: 'var(--bg-card)', borderRadius: 14,
  border: '1px solid var(--border-mid)', overflow: 'hidden',
};
const exRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', width: '100%', padding: '12px 14px', cursor: 'pointer',
};
const searchWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)',
  border: '1px solid var(--border-mid)', borderRadius: 12, padding: '10px 14px', marginBottom: 18,
};
const searchIcon: React.CSSProperties = { fontSize: 14, opacity: 0.7 };
const searchInput: React.CSSProperties = {
  flex: 1, background: 'transparent', border: 'none', outline: 'none',
  color: 'var(--text-primary)', fontSize: 14,
};
const searchClearBtn: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 4,
};
const modeSwitch: React.CSSProperties = {
  display: 'flex', gap: 6, marginBottom: 12,
};
const modeBtn: React.CSSProperties = {
  flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
  background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)',
};
const modeBtnActive: React.CSSProperties = {
  background: 'var(--brand-1)', color: '#fff', border: '1px solid transparent',
};
