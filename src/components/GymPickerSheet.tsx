import React, { useMemo, useState } from 'react';
import type { WorkoutDay } from '../data/types';
import { useWorkoutStore } from '../store/workoutStore';
import {
  buildAdaptation, applyAdaptation, isAdaptationActive, EMPTY_OPTIONS,
  type Gym, type SessionAdaptation,
} from '../utils/gymAdapt';

// ─── « Tu es dans quelle salle ? » ─────────────────────────────────────────
// S'ouvre au démarrage d'une séance, uniquement à partir de deux salles
// enregistrées (choix de Léo : tant qu'il n'y en a qu'une, on ne lui demande
// rien). La salle utilisée la dernière fois est présélectionnée, donc dans le
// cas courant c'est un simple appui sur « Démarrer ».
//
// Quand la salle choisie ne permet pas de faire certains exercices, on montre
// les remplacements AVANT de démarrer et on laisse le choix de les appliquer
// ou de garder la séance telle quelle — jamais de substitution silencieuse.

interface Props {
  workout: WorkoutDay;
  onClose: () => void;
  onStart: (adaptation: SessionAdaptation | null, gymId: string) => void;
}

export const GymPickerSheet: React.FC<Props> = ({ workout, onClose, onStart }) => {
  const gyms = useWorkoutStore((s) => s.gyms);
  const activeGymId = useWorkoutStore((s) => s.activeGymId);
  const history = useWorkoutStore((s) => s.history);
  const [selectedId, setSelectedId] = useState(activeGymId || gyms[0]?.id);

  const gym: Gym | undefined = gyms.find((g) => g.id === selectedId) ?? gyms[0];

  // Adaptation liée au seul matériel de la salle (pas de contrainte de temps
  // ni de forme du jour ici : ça, c'est le bouton « Adapter »).
  const adaptation = useMemo(
    () => (gym ? buildAdaptation(workout, { ...EMPTY_OPTIONS, awayGym: true }, history, gym) : null),
    [workout, history, gym]
  );
  const aDesChangements = isAdaptationActive(adaptation);
  const adapted = adaptation ? applyAdaptation(workout, adaptation) : workout;

  if (!gym) return null;

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={handle} />
        <h2 style={title}>Tu es dans quelle salle ?</h2>
        <p style={subtitle}>{workout.name} · {workout.exercises.length} exercices</p>

        <div style={scroll}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {gyms.map((g) => {
              const on = g.id === selectedId;
              return (
                <button key={g.id} onClick={() => setSelectedId(g.id)} style={gymRow(on)}>
                  <span style={radio(on)}>{on && <span style={radioDot} />}</span>
                  <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <span style={gymName(on)}>{g.name}</span>
                    <span style={gymHint}>
                      {g.plates.length > 0
                        ? `barre ${g.barKg} kg · ${g.plates.length} tailles de disques`
                        : 'disques non renseignés'}
                      {g.machinesListComplete && g.machines && g.machines.length > 0
                        ? ` · ${g.machines.length} machines`
                        : ''}
                    </span>
                  </span>
                  {g.id === activeGymId && <span style={badge}>habituelle</span>}
                </button>
              );
            })}
          </div>

          {aDesChangements && adaptation && (
            <div style={warn}>
              <p style={warnTitle}>
                {adaptation.summary.length} exercice{adaptation.summary.length > 1 ? 's' : ''} à revoir dans cette salle
              </p>
              <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0 }}>
                {adaptation.summary.map((line, i) => (
                  <li key={i} style={warnLine}>· {line}</li>
                ))}
              </ul>
              {adapted.exercises.length !== workout.exercises.length && (
                <p style={warnFooter}>
                  {adapted.exercises.length} exercices au lieu de {workout.exercises.length}
                </p>
              )}
            </div>
          )}
        </div>

        <div style={actions}>
          <button onClick={onClose} style={ghostBtn}>Annuler</button>
          {aDesChangements ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <button onClick={() => onStart(adaptation, gym.id)} style={primaryBtn}>
                Démarrer avec ces remplacements
              </button>
              <button onClick={() => onStart(null, gym.id)} style={secondaryBtn}>
                Non, garder la séance telle quelle
              </button>
            </div>
          ) : (
            <button onClick={() => onStart(null, gym.id)} style={primaryBtn}>Démarrer</button>
          )}
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
  width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
  background: 'var(--bg-card)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
  border: '1px solid var(--border-mid)', borderBottom: 'none',
  padding: '10px 18px max(16px, env(safe-area-inset-bottom))',
};
const handle: React.CSSProperties = {
  width: 38, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 12px',
};
const title: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, letterSpacing: -0.3 };
const subtitle: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 12, marginTop: 3 };
const scroll: React.CSSProperties = { overflowY: 'auto', flex: 1, paddingBottom: 4 };
const gymRow = (on: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
  padding: '12px 14px', borderRadius: 16, cursor: 'pointer',
  background: on ? 'rgba(var(--brand-1-rgb),0.12)' : 'var(--bg-surface)',
  border: `1px solid ${on ? 'rgba(var(--brand-1-rgb),0.45)' : 'var(--border)'}`,
});
const radio = (on: boolean): React.CSSProperties => ({
  width: 20, height: 20, borderRadius: 10, flexShrink: 0,
  border: `2px solid ${on ? 'var(--brand-1)' : 'var(--border-strong)'}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
});
const radioDot: React.CSSProperties = {
  width: 10, height: 10, borderRadius: 5, background: 'var(--brand-1)',
};
const gymName = (on: boolean): React.CSSProperties => ({
  display: 'block', fontSize: 15, fontWeight: 700,
  color: on ? 'var(--brand-1)' : 'var(--text-primary)',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
});
const gymHint: React.CSSProperties = {
  display: 'block', color: 'var(--text-dim)', fontSize: 11, marginTop: 2,
};
const badge: React.CSSProperties = {
  flexShrink: 0, fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
  color: 'var(--text-dim)', background: 'var(--bg-elevated)',
  border: '1px solid var(--border-strong)', borderRadius: 8, padding: '4px 7px',
};
const warn: React.CSSProperties = {
  marginTop: 14, padding: 14, borderRadius: 16,
  background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.3)',
};
const warnTitle: React.CSSProperties = { color: '#f5a623', fontSize: 12.5, fontWeight: 800 };
const warnLine: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: 12, lineHeight: '18px', marginTop: 2 };
const warnFooter: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 11.5, marginTop: 8,
  paddingTop: 8, borderTop: '1px solid rgba(245,166,35,0.2)',
};
const actions: React.CSSProperties = {
  display: 'flex', gap: 8, alignItems: 'flex-start',
  paddingTop: 12, borderTop: '1px solid var(--border-subtle)', marginTop: 8,
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
const secondaryBtn: React.CSSProperties = {
  padding: '10px', borderRadius: 14, cursor: 'pointer',
  background: 'transparent', border: '1px solid var(--border-strong)',
  color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 700,
};
