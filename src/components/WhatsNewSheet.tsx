import React from 'react';
import type { ChangelogEntry } from '../data/changelog';

interface WhatsNewSheetProps {
  entries: ChangelogEntry[];
  onClose: () => void;
}

// Écran « Nouveautés » : affiché une fois après une mise à jour, par-dessus
// l'écran d'accueil. Voir data/changelog.ts pour le contenu.
export const WhatsNewSheet: React.FC<WhatsNewSheetProps> = ({ entries, onClose }) => (
  <div style={overlay} role="dialog" aria-modal="true" aria-label="Nouveautés">
    <div style={card}>
      <h2 style={heading}>Nouveautés</h2>
      <div style={list}>
        {entries.map((entry) => (
          <section key={entry.id} style={{ marginBottom: 16 }}>
            <h3 style={sub}>{entry.title}</h3>
            <ul style={ul}>
              {entry.items.map((item) => (
                <li key={item} style={li}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <button style={btn} onClick={onClose}>C’est parti</button>
    </div>
  </div>
);

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
};
const card: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 18, padding: 22, maxWidth: 420, width: '100%',
  maxHeight: '85vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-mid)',
};
const heading: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 19, fontWeight: 800, marginBottom: 12 };
const list: React.CSSProperties = { overflowY: 'auto', flex: 1, marginBottom: 14 };
const sub: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, marginBottom: 6 };
const ul: React.CSSProperties = { paddingLeft: 18, margin: 0 };
const li: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 13, lineHeight: '19px', marginBottom: 4 };
const btn: React.CSSProperties = {
  width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 13.5, fontWeight: 700,
  background: 'var(--brand-1)', color: '#fff', border: 'none', cursor: 'pointer',
};
