import React, { useState } from 'react';
import { ExerciseCatalog } from '../components/ExerciseCatalog';
import { ProgrammesPanel } from '../components/ProgrammesPanel';

interface CatalogueScreenProps { onBack: () => void; }

/**
 * Écran Catalogue : tout ce qui est "bibliothèque" au même endroit.
 * - Exercices : les 225 exercices (muscles, matériel, photos, exécution).
 * - Programmes : les programmes disponibles + le générateur.
 *
 * L'écran Exercices, lui, reste dédié à TA progression (records, courbes) —
 * deux choses différentes, deux écrans.
 */
type Tab = 'exercices' | 'programmes';

export const CatalogueScreen: React.FC<CatalogueScreenProps> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('exercices');

  return (
    <div style={container}>
      <div style={scroll}>
        <div style={headerRow}>
          <button onClick={onBack} style={backBtn} aria-label="Retour">←</button>
          <div>
            <h1 style={title}>Catalogue</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
              {tab === 'exercices' ? 'La base d\'exercices de musculation' : 'Tes programmes, et le générateur'}
            </p>
          </div>
        </div>

        <div style={tabSwitch}>
          <button
            onClick={() => setTab('exercices')}
            style={{ ...tabBtn, ...(tab === 'exercices' ? tabBtnActive : {}) }}
          >
            Exercices
          </button>
          <button
            onClick={() => setTab('programmes')}
            style={{ ...tabBtn, ...(tab === 'programmes' ? tabBtnActive : {}) }}
          >
            Programmes
          </button>
        </div>

        {tab === 'exercices' ? <ExerciseCatalog /> : <ProgrammesPanel />}
      </div>
    </div>
  );
};

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto', background: 'var(--bg-base)' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 112px' };
const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 18,
  borderBottom: '1px solid var(--border-subtle)', marginBottom: 18,
};
const backBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12, background: 'var(--bg-elevated)',
  border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 18, flexShrink: 0,
};
const title: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 };
const tabSwitch: React.CSSProperties = { display: 'flex', gap: 6, marginBottom: 14 };
const tabBtn: React.CSSProperties = {
  flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)',
};
const tabBtnActive: React.CSSProperties = {
  background: 'var(--brand-1)', color: '#fff', border: '1px solid transparent',
};
