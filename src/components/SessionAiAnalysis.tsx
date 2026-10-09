import React, { useMemo, useState } from 'react';
import { TierLock } from './TierLock';
import { useWorkoutStore } from '../store/workoutStore';
import { getWorkout } from '../data/workouts';
import { getProgram } from '../data/programs';
import { buildCoachDigest } from '../utils/coachDigest';
import { readStoredApiKey, requestCoachAi } from '../utils/coachAi';
import type { CoachAiBrief } from '../utils/coachDigest';

// Fin de séance → bilan du coach IA (PPL Pro). Le coach regarde la séance qui vient d'être
// terminée dans le contexte des dernières semaines : ce qui progresse, ce qui stagne, quoi changer.
export const SessionAiAnalysis: React.FC = () => {
  const history = useWorkoutStore((s) => s.history);
  const trainingProfile = useWorkoutStore((s) => s.trainingProfile);
  const bodyWeightHistory = useWorkoutStore((s) => s.bodyWeightHistory);
  const activeProgramId = useWorkoutStore((s) => s.activeProgramId);
  const customPrograms = useWorkoutStore((s) => s.customPrograms);
  const weeklySessionGoal = useWorkoutStore((s) => s.weeklySessionGoal);
  const [brief, setBrief] = useState<CoachAiBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digest = useMemo(() => buildCoachDigest({
    history, resolveWorkout: getWorkout, profile: trainingProfile, bodyWeightHistory,
    programName: getProgram(activeProgramId, customPrograms).name, weeklySessionGoal,
  }), [history, trainingProfile, bodyWeightHistory, activeProgramId, customPrograms, weeklySessionGoal]);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await requestCoachAi({ mode: 'brief', digest, apiKey: readStoredApiKey() || undefined });
      if (r.ok && r.mode === 'brief') setBrief(r.brief);
      else if (!r.ok) setError(r.message);
    } catch {
      setError('Le bilan n’a pas pu être généré. Réessaie dans un instant.');
    }
    setLoading(false);
  };

  return (
    <TierLock min="pro" title="Analyse de ta séance par le coach IA" text="Un bilan de la séance qui vient de finir : ce qui progresse, ce qui stagne, quoi changer la prochaine fois.">
      <div style={card}>
        <p style={label}>COACH IA</p>
        {brief ? (
          <>
            <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5, fontWeight: 600, margin: '0 0 10px' }}>{brief.resume}</p>
            {brief.points.slice(0, 3).map((p, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, margin: 0 }}>{p.titre}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12.5, lineHeight: 1.45, margin: '3px 0 0' }}>{p.constat}</p>
                <p style={{ color: 'var(--text-primary)', fontSize: 12.5, lineHeight: 1.45, margin: '4px 0 0' }}>→ {p.action}</p>
              </div>
            ))}
            <p style={{ color: 'var(--text-muted)', fontSize: 12.5, fontStyle: 'italic', margin: 0 }}>{brief.encouragement}</p>
          </>
        ) : (
          <button disabled={loading} onClick={() => void run()} style={{ ...cta, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Analyse en cours…' : 'Analyser ma séance'}
          </button>
        )}
        {error && <p style={{ color: '#f5a623', fontSize: 11.5, marginTop: 8 }}>{error}</p>}
      </div>
    </TierLock>
  );
};

const card: React.CSSProperties = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 16 };
const label: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, margin: '0 0 10px' };
const cta: React.CSSProperties = { width: '100%', padding: 12, borderRadius: 12, border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' };
