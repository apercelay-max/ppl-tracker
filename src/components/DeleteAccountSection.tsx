import React, { useState } from 'react';
import { deleteMyAccount } from '../lib/account';
import { withdrawAiConsent } from '../utils/coachAi';

// Suppression du compte depuis l'appli : exigée par Apple (règle 5.1.1(v)).
// Deux étapes volontaires — un bouton, puis une confirmation qui dit ce qui part
// et ce qui reste — parce que c'est irréversible.
export const DeleteAccountSection: React.FC = () => {
  const [step, setStep] = useState<'idle' | 'confirm'>('idle');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setMessage(null);
    const r = await deleteMyAccount();
    setBusy(false);
    if (!r.ok) { setMessage(r.message); return; }
    withdrawAiConsent();
    setStep('idle');
    setMessage('Ton compte a été supprimé. Les données de cet appareil sont restées dessus.');
  };

  return (
    <div style={{ marginTop: 14 }}>
      {step === 'idle' ? (
        <button onClick={() => setStep('confirm')} style={ghost}>Supprimer mon compte</button>
      ) : (
        <div style={box}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: '17px', margin: '0 0 10px' }}>
            Ton compte et tout ce qui est stocké dans le cloud (synchronisation, binôme, parrainage) seront
            effacés définitivement. Ton historique reste sur cet appareil, mais ne se synchronisera plus.
            Si tu as un abonnement PPL Pro, il continue jusqu’à son terme : résilie-le dans les réglages de
            ton compte Apple.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep('idle')} disabled={busy} style={{ ...ghostNeutral, flex: 1 }}>Annuler</button>
            <button onClick={() => void run()} disabled={busy} style={{ ...danger, flex: 1, opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Suppression…' : 'Supprimer définitivement'}
            </button>
          </div>
        </div>
      )}
      {message && <p style={{ color: 'var(--text-dim)', fontSize: 11.5, lineHeight: '16px', marginTop: 8 }}>{message}</p>}
    </div>
  );
};

const ghost: React.CSSProperties = {
  width: '100%', padding: 12, borderRadius: 14, cursor: 'pointer', background: 'var(--bg-elevated)',
  border: '1px solid rgba(232,105,95,0.35)', color: '#e8695f', fontSize: 13, fontWeight: 700,
};
const ghostNeutral: React.CSSProperties = {
  padding: 12, borderRadius: 14, cursor: 'pointer', background: 'var(--bg-elevated)',
  border: '1px solid var(--border-strong)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700,
};
const danger: React.CSSProperties = { padding: 12, borderRadius: 14, cursor: 'pointer', border: 'none', background: '#c9392f', color: '#fff', fontSize: 13, fontWeight: 800 };
const box: React.CSSProperties = { padding: 12, borderRadius: 14, background: 'rgba(232,105,95,0.08)', border: '1px solid rgba(232,105,95,0.3)' };
