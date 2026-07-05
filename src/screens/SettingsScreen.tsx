import React, { useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { ACCENT_PRESETS } from '../data/accents';
import type { HomeSectionKey } from '../store/workoutStore';
import { ICON_SHAPE_RADIUS, ICON_SHAPE_LABEL, ICON_SIZE_LABEL } from '../data/iconPrefs';
import type { IconShape, IconSize } from '../data/iconPrefs';
import { WORKOUTS } from '../data/workouts';

const formatRest = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

interface SettingsScreenProps { onBack: () => void; }

const FONT_SCALES: { id: 'sm' | 'md' | 'lg'; label: string; preview: number }[] = [
  { id: 'sm', label: 'Petit', preview: 12 },
  { id: 'md', label: 'Normal', preview: 15 },
  { id: 'lg', label: 'Grand', preview: 18 },
];

const ICON_SHAPES: IconShape[] = ['square', 'rounded', 'circle'];
const ICON_SIZES: IconSize[] = ['sm', 'md', 'lg'];

const REST_OPTIONS: { seconds: number; label: string }[] = [
  { seconds: 60, label: '1:00' },
  { seconds: 90, label: '1:30' },
  { seconds: 120, label: '2:00' },
  { seconds: 180, label: '3:00' },
  { seconds: 240, label: '4:00' },
];

const BEEP_TONES: { id: 'doux' | 'classique' | 'urgent'; label: string }[] = [
  { id: 'doux', label: 'Doux' },
  { id: 'classique', label: 'Classique' },
  { id: 'urgent', label: 'Urgent' },
];

const SECTION_META: Record<HomeSectionKey, { label: string; desc: string; toggleable: boolean }> = {
  cycle: { label: 'Cycle en cours', desc: 'La carte semaine / RIR / objectif.', toggleable: true },
  seances: { label: 'Liste des séances', desc: 'Les 6 séances PPL — toujours visible.', toggleable: false },
  nutrition: { label: 'Conseil nutrition', desc: 'Le rappel protéines/glucides après la séance.', toggleable: true },
  supersetRule: { label: 'Règle superset', desc: 'Le rappel sur le fonctionnement des supersets.', toggleable: true },
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const accentTheme = useWorkoutStore((s) => s.accentTheme);
  const setAccentTheme = useWorkoutStore((s) => s.setAccentTheme);
  const fontScale = useWorkoutStore((s) => s.fontScale);
  const setFontScale = useWorkoutStore((s) => s.setFontScale);
  const homeSections = useWorkoutStore((s) => s.homeSections);
  const setHomeSectionVisible = useWorkoutStore((s) => s.setHomeSectionVisible);
  const homeSectionOrder = useWorkoutStore((s) => s.homeSectionOrder);
  const moveHomeSection = useWorkoutStore((s) => s.moveHomeSection);
  const iconShape = useWorkoutStore((s) => s.iconShape);
  const setIconShape = useWorkoutStore((s) => s.setIconShape);
  const iconSize = useWorkoutStore((s) => s.iconSize);
  const setIconSize = useWorkoutStore((s) => s.setIconSize);
  const defaultRestSeconds = useWorkoutStore((s) => s.defaultRestSeconds);
  const setDefaultRestSeconds = useWorkoutStore((s) => s.setDefaultRestSeconds);
  const customRestSeconds = useWorkoutStore((s) => s.customRestSeconds);
  const saveCustomRest = useWorkoutStore((s) => s.saveCustomRest);
  const clearCustomRest = useWorkoutStore((s) => s.clearCustomRest);
  const highContrast = useWorkoutStore((s) => s.highContrast);
  const setHighContrast = useWorkoutStore((s) => s.setHighContrast);
  const beepEnabled = useWorkoutStore((s) => s.beepEnabled);
  const setBeepEnabled = useWorkoutStore((s) => s.setBeepEnabled);
  const beepTone = useWorkoutStore((s) => s.beepTone);
  const setBeepTone = useWorkoutStore((s) => s.setBeepTone);
  const testBeep = useWorkoutStore((s) => s.testBeep);
  const caloriesPerHour = useWorkoutStore((s) => s.caloriesPerHour);
  const setCaloriesPerHour = useWorkoutStore((s) => s.setCaloriesPerHour);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const toggleDay = (id: string) => setExpandedDays((d) => ({ ...d, [id]: !d[id] }));

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

        {/* Accessibilité */}
        <p style={{ ...sectionLabel, marginTop: 24 }}>ACCESSIBILITÉ</p>
        <div style={toggleRow}>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>Contraste élevé</p>
            <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>
              Textes et bordures plus marqués, pour mieux distinguer les éléments.
            </p>
          </div>
          <button
            onClick={() => setHighContrast(!highContrast)}
            style={{
              ...switchTrack,
              background: highContrast ? 'var(--brand-1)' : 'var(--bg-elevated)',
              justifyContent: highContrast ? 'flex-end' : 'flex-start',
            }}
          >
            <span style={switchThumb} />
          </button>
        </div>

        {/* Forme des icônes */}
        <p style={{ ...sectionLabel, marginTop: 24 }}>FORME DES ICÔNES</p>
        <div style={segmentRow}>
          {ICON_SHAPES.map((shape) => (
            <button
              key={shape}
              onClick={() => setIconShape(shape)}
              style={{
                ...segmentBtn,
                background: iconShape === shape ? 'var(--brand-1)' : 'var(--bg-elevated)',
                color: iconShape === shape ? '#fff' : 'var(--text-muted)',
              }}
            >
              <span style={{
                display: 'block', width: 24, height: 24,
                borderRadius: ICON_SHAPE_RADIUS[shape],
                background: iconShape === shape ? '#fff' : 'var(--text-muted)',
              }} />
              <span style={{ fontSize: 10, fontWeight: 700 }}>{ICON_SHAPE_LABEL[shape]}</span>
            </button>
          ))}
        </div>

        {/* Taille des icônes */}
        <p style={{ ...sectionLabel, marginTop: 24 }}>TAILLE DES ICÔNES</p>
        <div style={segmentRow}>
          {ICON_SIZES.map((sz) => (
            <button
              key={sz}
              onClick={() => setIconSize(sz)}
              style={{
                ...segmentBtn,
                background: iconSize === sz ? 'var(--brand-1)' : 'var(--bg-elevated)',
                color: iconSize === sz ? '#fff' : 'var(--text-muted)',
              }}
            >
              <span style={{
                display: 'block',
                width: sz === 'sm' ? 18 : sz === 'md' ? 24 : 30,
                height: sz === 'sm' ? 18 : sz === 'md' ? 24 : 30,
                borderRadius: ICON_SHAPE_RADIUS[iconShape],
                background: iconSize === sz ? '#fff' : 'var(--text-muted)',
              }} />
              <span style={{ fontSize: 10, fontWeight: 700 }}>{ICON_SIZE_LABEL[sz]}</span>
            </button>
          ))}
        </div>

        {/* Temps de repos par défaut */}
        <p style={{ ...sectionLabel, marginTop: 24 }}>TEMPS DE REPOS PAR DÉFAUT</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 10, lineHeight: '15px' }}>
          Utilisé quand tu commences une série sans temps personnalisé. Tu peux toujours ajuster +30s/-30s pendant le repos.
        </p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {REST_OPTIONS.map((opt) => (
            <button
              key={opt.seconds}
              onClick={() => setDefaultRestSeconds(opt.seconds)}
              style={{
                ...restBtn,
                background: defaultRestSeconds === opt.seconds ? 'var(--brand-1)' : 'var(--bg-elevated)',
                color: defaultRestSeconds === opt.seconds ? '#fff' : 'var(--text-muted)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Son du minuteur */}
        <p style={{ ...sectionLabel, marginTop: 24 }}>SON DU MINUTEUR</p>
        <div style={toggleRow}>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>Bip de fin de repos</p>
            <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>
              Joue un bip quand le repos se termine, en plus de la vibration/notification.
            </p>
          </div>
          <button
            onClick={() => setBeepEnabled(!beepEnabled)}
            style={{
              ...switchTrack,
              background: beepEnabled ? 'var(--brand-1)' : 'var(--bg-elevated)',
              justifyContent: beepEnabled ? 'flex-end' : 'flex-start',
            }}
          >
            <span style={switchThumb} />
          </button>
        </div>
        {beepEnabled && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {BEEP_TONES.map((t) => (
              <button
                key={t.id}
                onClick={() => setBeepTone(t.id)}
                style={{
                  ...restBtn,
                  background: beepTone === t.id ? 'var(--brand-1)' : 'var(--bg-elevated)',
                  color: beepTone === t.id ? '#fff' : 'var(--text-muted)',
                }}
              >
                {t.label}
              </button>
            ))}
            <button onClick={testBeep} style={{ ...restBtn, flex: '0 0 auto', padding: '10px 16px' }}>▶ Tester</button>
          </div>
        )}
        {!beepEnabled && <div style={{ marginBottom: 12 }} />}

        {/* Calories (estimation) */}
        <p style={{ ...sectionLabel, marginTop: 12 }}>CALORIES (ESTIMATION)</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 10, lineHeight: '15px' }}>
          Utilisé pour estimer les calories brûlées quand aucun capteur de fréquence cardiaque n'est connecté.
        </p>
        <div style={{ ...toggleRow, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>{caloriesPerHour} kcal/h</p>
          </div>
          <button onClick={() => setCaloriesPerHour(caloriesPerHour - 10)} style={stepperBtn}>−</button>
          <button onClick={() => setCaloriesPerHour(caloriesPerHour + 10)} style={stepperBtn}>+</button>
        </div>

        {/* Temps de repos par exercice */}
        <p style={{ ...sectionLabel, marginTop: 24 }}>TEMPS DE REPOS PAR EXERCICE</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 10, lineHeight: '15px' }}>
          Remplace le temps par défaut pour un exercice précis. Déplie une séance pour voir ses exercices.
        </p>
        <div style={{ marginBottom: 20 }}>
          {WORKOUTS.map((workout) => {
            const isOpen = !!expandedDays[workout.id];
            return (
              <div key={workout.id} style={dayGroup}>
                <button onClick={() => toggleDay(workout.id)} style={dayHeaderBtn}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, flex: 1, textAlign: 'left' }}>
                    {workout.name}
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>{workout.exercises.length} exercices</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 10, marginLeft: 8 }}>{isOpen ? '▴' : '▾'}</span>
                </button>
                {isOpen && (
                  <div style={{ padding: '4px 10px 8px' }}>
                    {workout.exercises.map((ex) => {
                      const current = customRestSeconds[ex.id] ?? ex.restSeconds;
                      const isCustom = customRestSeconds[ex.id] !== undefined;
                      return (
                        <div key={ex.id} style={exRestRow}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ex.name}
                            </p>
                            {isCustom && <p style={{ color: 'var(--text-micro)', fontSize: 9, marginTop: 1 }}>Personnalisé</p>}
                          </div>
                          <button
                            onClick={() => saveCustomRest(ex.id, Math.max(30, current - 15))}
                            style={stepperBtn}
                          >−</button>
                          <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, width: 40, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                            {formatRest(current)}
                          </span>
                          <button
                            onClick={() => saveCustomRest(ex.id, Math.min(300, current + 15))}
                            style={stepperBtn}
                          >+</button>
                          {isCustom && (
                            <button onClick={() => clearCustomRest(ex.id)} style={resetBtn} title="Revenir au temps d'origine">↺</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Écran d'accueil : ordre + visibilité */}
        <p style={{ ...sectionLabel, marginTop: 24 }}>DISPOSITION DE L'ACCUEIL</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 12, lineHeight: '15px' }}>
          Utilise les flèches pour réordonner les blocs, et l'interrupteur pour masquer ceux que tu ne veux pas voir.
        </p>
        <div style={{ marginBottom: 20 }}>
          {homeSectionOrder.map((key, idx) => {
            const meta = SECTION_META[key];
            const visible = meta.toggleable ? homeSections[key as keyof typeof homeSections] : true;
            return (
              <div key={key} style={toggleRow}>
                <div style={reorderCol}>
                  <button
                    onClick={() => moveHomeSection(key, 'up')}
                    disabled={idx === 0}
                    style={{ ...reorderBtn, opacity: idx === 0 ? 0.25 : 1 }}
                  >▲</button>
                  <button
                    onClick={() => moveHomeSection(key, 'down')}
                    disabled={idx === homeSectionOrder.length - 1}
                    style={{ ...reorderBtn, opacity: idx === homeSectionOrder.length - 1 ? 0.25 : 1 }}
                  >▼</button>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>{meta.label}</p>
                  <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>{meta.desc}</p>
                </div>
                {meta.toggleable ? (
                  <button
                    onClick={() => setHomeSectionVisible(key as keyof typeof homeSections, !visible)}
                    style={{
                      ...switchTrack,
                      background: visible ? 'var(--brand-1)' : 'var(--bg-elevated)',
                      justifyContent: visible ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <span style={switchThumb} />
                  </button>
                ) : (
                  <span style={{ color: 'var(--text-micro)', fontSize: 10, fontWeight: 700, flexShrink: 0, width: 44, textAlign: 'center' }}>FIXE</span>
                )}
              </div>
            );
          })}
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
  width: 36, height: 36, background: 'var(--bg-elevated)', borderRadius: 'var(--icon-radius)',
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
const reorderCol: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
};
const restBtn: React.CSSProperties = {
  flex: 1, padding: '10px 2px', borderRadius: 12, cursor: 'pointer',
  fontSize: 12, fontWeight: 700, textAlign: 'center',
  border: '1px solid var(--border-strong)', transition: 'background 0.2s, color 0.2s',
};
const reorderBtn: React.CSSProperties = {
  width: 26, height: 20, borderRadius: 6,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  color: 'var(--text-muted)', fontSize: 9, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const dayGroup: React.CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 14, marginBottom: 8, overflow: 'hidden',
};
const dayHeaderBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', width: '100%',
  padding: '12px 14px', cursor: 'pointer',
};
const exRestRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 2px', borderTop: '1px solid var(--border-subtle)',
};
const stepperBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  color: 'var(--text-muted)', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const resetBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginLeft: 2,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  color: 'var(--brand-1)', fontSize: 13, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
