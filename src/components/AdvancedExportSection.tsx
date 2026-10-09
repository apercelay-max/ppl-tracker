import React, { useState } from 'react';
import { TierLock } from './TierLock';
import { saveFile } from '../lib/saveFile';
import { useWorkoutStore } from '../store/workoutStore';
import { buildAdvancedWorkbook } from '../utils/advancedExport';

// Réglages → Données → Export Excel complet (PPL Pro).
export const AdvancedExportSection: React.FC = () => {
  const history = useWorkoutStore((s) => s.history);
  const bodyWeightHistory = useWorkoutStore((s) => s.bodyWeightHistory);
  const cardioHistory = useWorkoutStore((s) => s.cardioHistory);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async () => {
    if (history.length === 0 && bodyWeightHistory.length === 0 && cardioHistory.length === 0) { setMsg('Rien à exporter pour le moment.'); return; }
    setBusy(true);
    setMsg(null);
    try {
      const blob = await buildAdvancedWorkbook({ history, bodyWeightHistory, cardioHistory });
      const r = await saveFile(`ppl-tracker-complet-${new Date().toISOString().slice(0, 10)}.xlsx`, blob);
      if (r === 'failed') setMsg('L’export a échoué. Réessaie.');
    } catch {
      setMsg('L’export a échoué. Réessaie.');
    }
    setBusy(false);
  };

  return (
    <TierLock min="pro" title="Export Excel complet" text="Un classeur avec tes séances, chaque série, tes records, ton poids de corps et ton cardio.">
      <div style={{ marginBottom: 20 }}>
        <p style={{ color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>EXPORT EXCEL COMPLET</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 11, lineHeight: '16px', marginBottom: 10 }}>
          Un classeur avec cinq onglets : séances, séries, records, poids de corps et cardio.
        </p>
        <button disabled={busy} onClick={() => void run()} style={{ width: '100%', padding: 12, borderRadius: 14, cursor: 'pointer', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Préparation…' : 'Exporter en Excel (.xlsx)'}
        </button>
        {msg && <p style={{ color: '#f5a623', fontSize: 11.5, marginTop: 8 }}>{msg}</p>}
      </div>
    </TierLock>
  );
};
