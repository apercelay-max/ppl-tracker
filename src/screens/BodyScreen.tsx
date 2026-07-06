import React from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { BodyDiagram } from '../components/BodyDiagram';
import { getBodyIntensityFromHistory } from '../utils/training';

interface BodyScreenProps { onBack: () => void; }

// Fenêtre glissante sur laquelle on calcule "ce qui a été travaillé
// récemment" — même valeur que le seuil d'alerte groupe musculaire
// (voir ObjectivesScreen.tsx / HomeScreen.tsx) pour rester cohérent.
const LOOKBACK_DAYS = 9;

export const BodyScreen: React.FC<BodyScreenProps> = ({ onBack }) => {
  const history = useWorkoutStore((s) => s.history);
  const intensity = getBodyIntensityFromHistory(history, LOOKBACK_DAYS);
  const hasData = Object.keys(intensity).length > 0;

  return (
    <div style={container}>
      <div style={scroll}>

        <div style={headerRow}>
          <button onClick={onBack} style={backBtn} aria-label="Retour">←</button>
          <div>
            <h1 style={title}>🧍 Corps</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Muscles travaillés ces {LOOKBACK_DAYS} derniers jours</p>
          </div>
        </div>

        <div style={card}>
          {hasData ? (
            <BodyDiagram intensity={intensity} />
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: '18px', textAlign: 'center', padding: '24px 8px' }}>
              Pas encore de séance récente — fais une séance et reviens voir quels muscles s'allument ici.
            </p>
          )}
        </div>

        <div style={legendRow}>
          <span style={{ ...legendDot, background: 'var(--bg-elevated)' }} />
          <span style={legendLabel}>pas travaillé</span>
          <span style={{ ...legendDot, background: 'rgba(var(--brand-1-rgb), 0.45)' }} />
          <span style={legendLabel}>un peu</span>
          <span style={{ ...legendDot, background: 'rgba(var(--brand-1-rgb), 0.9)' }} />
          <span style={legendLabel}>beaucoup</span>
        </div>

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
const card: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14, padding: 20,
  border: '1px solid var(--border-mid)',
};
const legendRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
  marginTop: 16, justifyContent: 'center',
};
const legendDot: React.CSSProperties = { width: 10, height: 10, borderRadius: 5 };
const legendLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 11, marginRight: 8 };
