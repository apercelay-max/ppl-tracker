import React, { useState } from 'react';
import { TierLock } from './TierLock';
import { useWorkoutStore } from '../store/workoutStore';
import { buildReport, type ReportPeriod } from '../utils/report';
import { buildReportImage } from '../utils/reportImage';
import { saveFile } from '../lib/saveFile';
import { kgToLbs, weightUnitLabel } from '../utils/weight';

// Historique → rapport de la semaine ou du mois, à partager en image (PPL Pro).
export const ReportCard: React.FC = () => {
  const history = useWorkoutStore((s) => s.history);
  const unit = useWorkoutStore((s) => s.weightUnit);
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const report = buildReport(history, period);
  const vol = Math.round(unit === 'lbs' ? kgToLbs(report.tonnageKg) : report.tonnageKg);

  const share = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const blob = await buildReportImage(report, unit);
      const r = await saveFile(`ppl-tracker-${period === 'week' ? 'semaine' : 'mois'}-${new Date().toISOString().slice(0, 10)}.png`, blob);
      if (r === 'failed') setMsg('Le rapport n’a pas pu être créé. Réessaie.');
    } catch {
      setMsg('Le rapport n’a pas pu être créé. Réessaie.');
    }
    setBusy(false);
  };

  return (
    <TierLock min="pro" title="Rapports à partager" text="Ta semaine ou ton mois en une image : séances, volume, jours actifs et records, à envoyer à tes amis.">
      <div style={card}>
        <p style={label}>RAPPORT</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(['week', 'month'] as ReportPeriod[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} style={{ ...seg, background: period === p ? 'var(--brand-1)' : 'var(--bg-elevated)', color: period === p ? '#fff' : 'var(--text-muted)' }}>
              {p === 'week' ? '7 jours' : '30 jours'}
            </button>
          ))}
        </div>
        <p style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>
          {report.sessions} séance{report.sessions > 1 ? 's' : ''} · {vol.toLocaleString('fr-FR')} {weightUnitLabel(unit)}
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '0 0 12px' }}>{report.rangeLabel}</p>
        <button disabled={busy || report.sessions === 0} onClick={() => void share()} style={{ ...btn, opacity: busy || report.sessions === 0 ? 0.5 : 1 }}>
          {busy ? 'Création…' : report.sessions === 0 ? 'Aucune séance sur cette période' : 'Partager le rapport'}
        </button>
        {msg && <p style={{ color: '#f5a623', fontSize: 11.5, marginTop: 8 }}>{msg}</p>}
      </div>
    </TierLock>
  );
};

const card: React.CSSProperties = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 16 };
const label: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, margin: '0 0 10px' };
const seg: React.CSSProperties = { flex: 1, padding: '9px 6px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const btn: React.CSSProperties = { width: '100%', padding: 12, borderRadius: 12, border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' };
