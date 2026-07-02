import React from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { ACCENT_PRESETS } from '../data/accents';
import type { HomeSectionsVisible } from '../store/workoutStore';

interface SettingsScreenProps { onBack: () => void; }

const FONT_SCALES: { id: 'sm' | 'md' | 'lg'; label: string; preview: number }[] = [
  { id: 'sm', label: 'Petit', preview: 12 },
  { id: 'md', label: 'Normal', preview: 15 },
  { id: 'lg', label: 'Grand', preview: 18 },
];

const HOME_SECTION_LABELS: { key: keyof HomeSectionsVisible; label: string; desc: string }[] = [
  { key: 'cycle', label: 'Cycle en cours', desc: 'La carte semaine / RIR / objectif en haut de l’accueil.' },
  { key: 'nutrition', label: 'Conseil nutrition', desc: 'Le rappel protéines/glucides après la séance.' },
  { key: 'supersetRule', label: 'Règle superset', desc: 'Le rappel sur le fonctionnement des supersets.' },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const accentTheme = useWorkoutStore((s) => s.accentTheme);
  const setAccentTheme = useWorkoutStore((s) => s.setAccentTheme);
  const fontScale = useWorkoutStore((s) => s.fontScale);
  const setFontScale = useWorkoutStore((s) => s.setFontScale);
  const homeSections = useWorkoutStore((s) => s.homeSections);
  const setHomeSectionVisible = useWorkoutStore((s) => s.setHomeSectionVisible);

  return (
    <div style={container}>
      <div style={scroll}>
        <div style={headerRow}>
          <button onClick={onBack} style={backBtn}>←</button>
          <div>
            <h1 style={titleStyle}>Réglages</h1>
            <p style={subtitleStyle}>Personnalise l'appli</p>
          </div>
        </div>

        {/* Couleur d'accent */}
        <p style={sectionLabel}>COULEUR D'ACCENT</p>
        <div style={swatchGrid}>
          {ACCENT_PRESETS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAccentTheme(a.id)}
              style={{
                ...swatchBtn,
                border: accentTheme === a.id ? `2px solid ${a.c1}` : '2px solid transparent',
              }}
              title={a.label}
            >
              <span style={{
                display: 'block', width: 40, height: 40, borderRadius: '50%',
                background: `linear-gradient(135deg, ${a.c1}, ${a.c2})`,
                boxShadow: accentTheme === a.id ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${a.c1}` : 'none',
              }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Taille du texte */}
        <p style={{ ...sectionLabel, marginTop: 24 }}>TAILLE DU TEXTE</p>
        <div style={segmentRow}>
          {FONT_SCALES.map((f) => (
            <button
              key={f.id}
              onClick={() => setFontScale(f.id)}
              style={{
                ...segmentBtn,
                background: fontScale === f.id ? 'var(--brand-1)' : 'var(--bg-elevated)',
                color: fontScale === f.id ? '#fff' : 'var(--text-muted)',
              }}
            >
              <span style={{ fontSize: f.preview, fontWeight: 800 }}>Aa</span>
              <span style={{ fontSize: 10, fontWeight: 700 }}>{f.label}</span>
            </button>
          ))}
        </div>

        {/* Écran d'accueil */}
        <p style={{ ...sectionLabel, marginTop: 24 }}>ÉCRAN D'ACCUEIL</p>
        <div style={{ marginBottom: 20 }}>
          {HOME_SECTION_LABELS.map(({ key, label, desc }) => (
            <div key={key} style={toggleRow}>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>{label}</p>
                <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>{desc}</p>
              </div>
              <button
                onClick={() => setHomeSectionVisible(key, !homeSections[key])}
                style={{
                  ...switchTrack,
                  background: homeSections[key] ? 'var(--brand-1)' : 'var(--bg-elevated)',
                  justifyContent: homeSections[key] ? 'flex-end' : 'flex-start',
                }}
              >
                <span style={switchThumb} />
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto', background: 'var(--bg-base)' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 40px' };
const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 18,
  borderBottom: '1px solid var(--border-subtle)', marginBottom: 20,
};
const backBtn: React.CSSProperties = {
  width: 36, height: 36, background: 'var(--bg-elevated)', borderRadius: 10,
  color: 'var(--text-muted)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, border: '1px solid var(--border-strong)',
};
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.3 };
const subtitleStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 12, marginTop: 2 };
const sectionLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 12 };
const swatchGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 };
const swatchBtn: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  padding: '10px 4px', borderRadius: 14, cursor: 'pointer',
  background: 'var(--bg-surface)',
};
const segmentRow: React.CSSProperties = { display: 'flex', gap: 8 };
const segmentBtn: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  padding: '12px 4px', borderRadius: 14, cursor: 'pointer',
  border: '1px solid var(--border-strong)', transition: 'background 0.2s, color 0.2s',
};
const toggleRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 14, padding: '12px 14px', marginBottom: 8,
};
const switchTrack: React.CSSProperties = {
  width: 44, height: 26, borderRadius: 13, padding: 3,
  display: 'flex', alignItems: 'center', flexShrink: 0, cursor: 'pointer',
  transition: 'background 0.2s',
};
const switchThumb: React.CSSProperties = {
  width: 20, height: 20, borderRadius: '50%', background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'transform 0.2s',
};
