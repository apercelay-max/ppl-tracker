import React from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { THEME_LIST } from '../data/themes';

interface SettingsScreenProps { onBack: () => void; }

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const theme = useWorkoutStore((s) => s.theme);
  const setTheme = useWorkoutStore((s) => s.setTheme);
  const currentWeek = useWorkoutStore((s) => s.currentWeek);
  const history = useWorkoutStore((s) => s.history);
  const resetAll = useWorkoutStore((s) => s.resetAll);

  const isSystem = theme === 'system';
  const cycleProgress = Math.round(((currentWeek - 1) / 7) * 100);

  const handleReset = () => {
    if (window.confirm('Réinitialiser la progression ? Historique et semaine repartiront à zéro.')) {
      resetAll();
    }
  };

  return (
    <div style={container}>
      <div style={scroll}>

        {/* Header */}
        <div style={headerSection}>
          <div style={logoRow}>
            <button onClick={onBack} style={backBtn} title="Retour">‹</button>
            <div style={logoBadge}><span style={{ fontSize: 22, lineHeight: 1 }}>⚡</span></div>
            <div>
              <h1 style={titleStyle}>Réglages</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>PPL Tracker · Strict V10</p>
            </div>
          </div>
        </div>

        {/* Thème */}
        <p style={sectionLabel}>THÈME</p>
        <button
          style={systemRow}
          onClick={() => setTheme(isSystem ? 'classicDark' : 'system')}
        >
          <div style={systemIcon}>📱</div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <p style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>Automatique</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Suit le mode clair/sombre de l'appareil</p>
          </div>
          <div style={{ ...toggle, background: isSystem ? 'var(--accent)' : 'var(--bg-elevated)' }}>
            <div style={{ ...toggleKnob, transform: `translateX(${isSystem ? 20 : 2}px)` }} />
          </div>
        </button>

        <div style={themeGrid}>
          {THEME_LIST.map((t) => {
            const isActive = !isSystem && theme === t.id;
            return (
              <button key={t.id} style={themeCard} onClick={() => setTheme(t.id)}>
                <div style={{
                  ...themeTile,
                  background: `linear-gradient(135deg, ${t.gradient.join(', ')})`,
                  outline: isActive ? '2px solid var(--accent)' : '1px solid var(--border)',
                  outlineOffset: 2,
                }}>
                  {isActive && <div style={themeCheck}>✓</div>}
                  <span style={themeEmoji}>{t.emoji}</span>
                </div>
                <span style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>{t.name}</span>
              </button>
            );
          })}
        </div>

        {/* Mes données */}
        <p style={{ ...sectionLabel, marginTop: 26 }}>MES DONNÉES</p>
        <div style={dataCard}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={metric}>
              <span style={metricLabel}>SEMAINE</span>
              <span style={{ ...metricValue, color: 'var(--accent)' }}>{currentWeek}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}> / 8</span></span>
            </div>
            <div style={metric}>
              <span style={metricLabel}>SÉANCES</span>
              <span style={{ ...metricValue, color: 'var(--num-color)' }}>{history.length}</span>
            </div>
            <div style={metric}>
              <span style={metricLabel}>CYCLE</span>
              <span style={{ ...metricValue, color: '#4CAF50' }}>{cycleProgress}%</span>
            </div>
          </div>
        </div>

        {/* Stockage */}
        <div style={goldCard}>
          <p style={{ color: 'var(--text-gold-label)', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>💾 Stockage local</p>
          <p style={{ color: 'var(--text-gold-body)', fontSize: 12, lineHeight: '18px' }}>
            Tes données restent <strong>sur cet appareil</strong> — rien n'est envoyé sur internet.
            Même système de thèmes que l'app Repas & Courses.
          </p>
        </div>

        {/* Zone danger */}
        <p style={{ ...sectionLabel, marginTop: 26, color: 'var(--text-gold-label)' }}>ZONE DANGER</p>
        <div style={dangerCard}>
          <div style={dangerIcon}>🗑</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#e05050', marginBottom: 3 }}>ACTION IRRÉVERSIBLE</p>
            <p style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 800, marginBottom: 2 }}>Réinitialiser la progression</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>Historique des séances et semaine en cours.</p>
            <button style={dangerBtn} onClick={handleReset}>Tout réinitialiser</button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto', background: 'var(--bg-gradient, var(--bg-base))', backgroundAttachment: 'fixed' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 80px' };
const headerSection: React.CSSProperties = {
  paddingTop: 'max(24px, env(safe-area-inset-top))',
  paddingBottom: 18, borderBottom: '1px solid var(--border-subtle)', marginBottom: 18,
};
const logoRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14 };
const backBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10,
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', fontSize: 22, fontWeight: 300,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
const logoBadge: React.CSSProperties = {
  width: 48, height: 48, borderRadius: 14,
  background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
};
const titleStyle: React.CSSProperties = { fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: 'var(--text-primary)' };
const sectionLabel: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 10 };
const systemRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  borderRadius: 18, padding: 14, marginBottom: 14, cursor: 'pointer',
};
const systemIcon: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 10, fontSize: 17,
  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
const toggle: React.CSSProperties = { width: 44, height: 26, borderRadius: 13, position: 'relative', transition: 'background 0.2s', flexShrink: 0 };
const toggleKnob: React.CSSProperties = {
  width: 20, height: 20, borderRadius: 10, background: '#fff',
  position: 'absolute', top: 3, left: 0, transition: 'transform 0.2s',
};
const themeGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 };
const themeCard: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' };
const themeTile: React.CSSProperties = {
  width: '100%', aspectRatio: '1', borderRadius: 16, position: 'relative',
};
const themeCheck: React.CSSProperties = {
  position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11,
  background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: 13,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const themeEmoji: React.CSSProperties = { position: 'absolute', bottom: 8, left: 10, fontSize: 20 };
const dataCard: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 20, padding: 14,
  border: '1px solid var(--border-mid)',
};
const metric: React.CSSProperties = {
  flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '10px 6px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
};
const metricLabel: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 9, fontWeight: 700, letterSpacing: 1 };
const metricValue: React.CSSProperties = { fontSize: 18, fontWeight: 800, letterSpacing: -0.5 };
const goldCard: React.CSSProperties = {
  background: 'var(--bg-gold-tint)', borderRadius: 14, padding: 14, marginTop: 10,
  border: '1px solid var(--border-gold-tint)',
};
const dangerCard: React.CSSProperties = {
  display: 'flex', gap: 14, alignItems: 'flex-start',
  background: 'var(--bg-red-tint)', borderRadius: 18, padding: 16,
  border: '1px solid rgba(224,80,80,0.3)',
};
const dangerIcon: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12, fontSize: 17,
  background: 'linear-gradient(135deg, #e03030, #7F1D1D)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  boxShadow: '0 4px 12px rgba(224,48,48,0.35)',
};
const dangerBtn: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 10,
  border: '1.5px solid #e05050', background: 'rgba(224,80,80,0.12)',
  color: '#e05050', fontSize: 13, fontWeight: 700,
};
