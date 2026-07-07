import React from 'react';

interface SyncConflictModalProps {
  remoteUpdatedAt: string;
  onUseCloud: () => void;
  onUseDevice: () => void;
}

export const SyncConflictModal: React.FC<SyncConflictModalProps> = ({ remoteUpdatedAt, onUseCloud, onUseDevice }) => {
  const dateLabel = new Date(remoteUpdatedAt).toLocaleString('fr-FR', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div style={overlay}>
      <div style={card}>
        <h2 style={title}>Données trouvées dans le cloud</h2>
        <p style={text}>
          Ce compte a déjà des données enregistrées (dernière synchro : {dateLabel}).
          Cet appareil a aussi ses propres données locales. Que veux-tu garder ?
        </p>
        <button style={{ ...btn, ...btnPrimary }} onClick={onUseCloud}>
          Charger les données du cloud sur cet appareil
        </button>
        <button style={btn} onClick={onUseDevice}>
          Garder les données de cet appareil (remplace le cloud)
        </button>
        <p style={note}>
          Pas sûr ? Exporte d'abord une sauvegarde depuis Réglages → Données avant de choisir.
        </p>
      </div>
    </div>
  );
};

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
};
const card: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 18, padding: 22, maxWidth: 420, width: '100%',
  border: '1px solid var(--border-mid)',
};
const title: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 17, fontWeight: 800, marginBottom: 10 };
const text: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 13, lineHeight: '19px', marginBottom: 16 };
const btn: React.CSSProperties = {
  width: '100%', padding: '12px 0', borderRadius: 12, marginBottom: 10, fontSize: 13.5, fontWeight: 700,
  background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', cursor: 'pointer',
};
const btnPrimary: React.CSSProperties = { background: 'var(--brand-1)', color: '#fff', border: 'none' };
const note: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, lineHeight: '15px', marginTop: 4 };
