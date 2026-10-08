import React, { useState } from 'react';
import { GLOSSARY } from '../data/glossary';

// Petit « ? » qui ouvre une définition en langage simple. Pas de
// window.alert : une feuille en bas d'écran, fermable d'un tap.
export const InfoTip: React.FC<{ term: keyof typeof GLOSSARY | string; size?: number }> = ({ term, size = 15 }) => {
  const [open, setOpen] = useState(false);
  const entry = GLOSSARY[term];
  if (!entry) return null;
  return (
    <>
      <button
        type="button"
        aria-label={`Que veut dire ${entry.title} ?`}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        style={{
          width: size, height: size, borderRadius: '50%', marginLeft: 6, flexShrink: 0,
          border: '1px solid var(--border-strong)', background: 'var(--bg-elevated)',
          color: 'var(--text-muted)', fontSize: size * 0.65, fontWeight: 800, lineHeight: 1,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          verticalAlign: 'middle', padding: 0,
        }}
      >?</button>
      {open && (
        <div
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 440, background: 'var(--bg-surface)', borderRadius: '22px 22px 0 0', padding: '20px 18px calc(18px + env(safe-area-inset-bottom))' }}
          >
            <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800, marginBottom: 8, letterSpacing: 0, textTransform: 'none' }}>{entry.title}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13.5, lineHeight: '20px', marginBottom: 16, letterSpacing: 0, textTransform: 'none', fontWeight: 400 }}>{entry.text}</p>
            <button
              onClick={() => setOpen(false)}
              style={{ width: '100%', padding: '12px 10px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
            >J'ai compris</button>
          </div>
        </div>
      )}
    </>
  );
};
