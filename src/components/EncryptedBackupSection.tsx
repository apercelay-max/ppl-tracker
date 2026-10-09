import React, { useRef, useState } from 'react';
import { TierLock } from './TierLock';
import { saveFile } from '../lib/saveFile';
import { decryptBackup, encryptBackup, isEncryptedBackup, MIN_PASSWORD } from '../lib/encryptedBackup';
import { saveBackup, markExported } from '../lib/localBackups';

// Réglages → Données → Sauvegarde chiffrée (PPL Pro). Le mot de passe n'est jamais enregistré.
export const EncryptedBackupSection: React.FC = () => {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const tooShort = password.length < MIN_PASSWORD;

  const doExport = async () => {
    const raw = localStorage.getItem('ppl-tracker-store');
    if (!raw) { setMsg({ text: 'Rien à sauvegarder pour le moment.', ok: false }); return; }
    if (tooShort) { setMsg({ text: `Choisis un mot de passe d'au moins ${MIN_PASSWORD} caractères.`, ok: false }); return; }
    setBusy(true);
    try {
      const file = await encryptBackup(raw, password);
      const result = await saveFile(`ppl-tracker-chiffre-${new Date().toISOString().slice(0, 10)}.pplbackup`, new Blob([file], { type: 'application/json' }));
      if (result === 'failed') setMsg({ text: 'La sauvegarde a échoué. Réessaie.', ok: false });
      else if (result === 'saved') { markExported(); setMsg({ text: 'Sauvegarde chiffrée créée. Garde bien ton mot de passe : sans lui, elle est illisible, et nous ne pouvons pas le retrouver.', ok: true }); }
    } catch {
      setMsg({ text: 'Le chiffrement n’est pas disponible sur cet appareil.', ok: false });
    }
    setBusy(false);
  };

  const doImport = async (file: File) => {
    const text = await file.text();
    if (!isEncryptedBackup(text)) { setMsg({ text: 'Ce fichier n’est pas une sauvegarde chiffrée PPL Tracker.', ok: false }); return; }
    if (password === '') { setMsg({ text: 'Saisis le mot de passe de cette sauvegarde, puis choisis à nouveau le fichier.', ok: false }); return; }
    setBusy(true);
    const plain = await decryptBackup(text, password);
    setBusy(false);
    if (plain === null) { setMsg({ text: 'Mot de passe incorrect, ou fichier abîmé.', ok: false }); return; }
    if (!window.confirm('Restaurer cette sauvegarde va remplacer toutes tes données actuelles (séances, historique, réglages). Une copie de l’état actuel est gardée avant. Continuer ?')) return;
    await saveBackup('safety', 'Avant restauration d\'une sauvegarde chiffrée');
    localStorage.setItem('ppl-tracker-store', plain);
    window.location.reload();
  };

  return (
    <TierLock min="pro" title="Sauvegarde chiffrée" text="Une copie de toutes tes données, chiffrée avec ton mot de passe, à garder où tu veux.">
      <div style={wrap}>
        <p style={label}>SAUVEGARDE CHIFFRÉE</p>
        <p style={help}>Ton mot de passe chiffre le fichier sur ton téléphone. Il n’est jamais enregistré ni envoyé : si tu l’oublies, la sauvegarde est perdue.</p>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe (8 caractères minimum)" style={input} autoComplete="off" />
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={busy} onClick={() => void doExport()} style={{ ...btn, opacity: busy ? 0.6 : 1 }}>Exporter chiffré</button>
          <button disabled={busy} onClick={() => fileRef.current?.click()} style={{ ...btn, opacity: busy ? 0.6 : 1 }}>Restaurer</button>
        </div>
        <input ref={fileRef} type="file" accept=".pplbackup,application/json" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void doImport(f); }} />
        {msg && <p style={{ ...help, color: msg.ok ? '#4CAF50' : '#f5a623', marginTop: 8 }}>{msg.text}</p>}
      </div>
    </TierLock>
  );
};

const wrap: React.CSSProperties = { marginBottom: 20 };
const label: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 };
const help: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, lineHeight: '16px', marginBottom: 10 };
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 12, marginBottom: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', fontSize: 14 };
const btn: React.CSSProperties = { flex: 1, padding: '12px 8px', borderRadius: 14, cursor: 'pointer', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 };
