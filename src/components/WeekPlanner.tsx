import React, { useState } from 'react';
import { TierLock } from './TierLock';

// Coach → Planificateur de semaine (PPL Pro) : la personne dit combien de jours, quel objectif, combien de
// temps, et la demande part dans la conversation du coach, qui sait déjà proposer un programme complet
// (relu et validé par l'appli avant d'être affiché, voir validateNewProgram). Rien n'est appliqué sans
// qu'elle appuie sur « Appliquer ».
const GOALS = ['prendre de la masse', 'gagner en force', 'perdre du gras', 'rester en forme'];
const DURATIONS = [30, 45, 60, 75];

interface Props { busy: boolean; onAsk: (question: string) => void }

export const WeekPlanner: React.FC<Props> = ({ busy, onAsk }) => {
  const [days, setDays] = useState(3);
  const [goal, setGoal] = useState(GOALS[0]);
  const [minutes, setMinutes] = useState(60);

  const send = () => onAsk(
    `Construis-moi un programme complet pour ${days} jour${days > 1 ? 's' : ''} par semaine, séances d'environ ${minutes} minutes, avec comme objectif : ${goal}. ` +
    'Propose-le comme un nouveau programme que je pourrai appliquer.'
  );

  return (
    <TierLock min="pro" title="Planificateur de semaine" text="Dis combien de jours tu peux t'entraîner et ton objectif : le coach te construit un programme complet, que tu valides avant qu'il soit appliqué.">
      <div style={card}>
        <p style={label}>PLANIFICATEUR DE SEMAINE</p>
        <p style={help}>Jours par semaine</p>
        <div style={row}>
          {[2, 3, 4, 5, 6].map((d) => (
            <button key={d} onClick={() => setDays(d)} style={{ ...chip, ...(days === d ? chipOn : {}) }}>{d}</button>
          ))}
        </div>
        <p style={help}>Objectif</p>
        <div style={{ ...row, flexWrap: 'wrap' }}>
          {GOALS.map((g) => (
            <button key={g} onClick={() => setGoal(g)} style={{ ...chip, ...(goal === g ? chipOn : {}), flex: '1 1 45%' }}>{g}</button>
          ))}
        </div>
        <p style={help}>Durée d'une séance</p>
        <div style={row}>
          {DURATIONS.map((m) => (
            <button key={m} onClick={() => setMinutes(m)} style={{ ...chip, ...(minutes === m ? chipOn : {}) }}>{m} min</button>
          ))}
        </div>
        <button disabled={busy} onClick={send} style={{ ...cta, opacity: busy ? 0.55 : 1 }}>
          {busy ? 'Le coach réfléchit…' : 'Construire mon programme'}
        </button>
      </div>
    </TierLock>
  );
};

const card: React.CSSProperties = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 16 };
const label: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, margin: '0 0 10px' };
const help: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, margin: '10px 0 6px' };
const row: React.CSSProperties = { display: 'flex', gap: 6 };
const chip: React.CSSProperties = { flex: 1, padding: '9px 6px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const chipOn: React.CSSProperties = { background: 'var(--brand-1)', color: '#fff', borderColor: 'var(--brand-1)' };
const cta: React.CSSProperties = { width: '100%', marginTop: 14, padding: 12, borderRadius: 12, border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' };
