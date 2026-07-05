import React, { useState, useRef } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { ACCENT_PRESETS } from '../data/accents';
import type { HomeSectionKey } from '../store/workoutStore';
import { ICON_SHAPE_RADIUS, ICON_SHAPE_LABEL, ICON_SIZE_LABEL } from '../data/iconPrefs';
import type { IconShape, IconSize } from '../data/iconPrefs';
import { WORKOUTS } from '../data/workouts';
import { CARDIO_TYPE_LABELS } from '../store/workoutStore';
import type { CardioActivityType } from '../data/types';

const CARDIO_TYPES: CardioActivityType[] = ['velo', 'marche', 'course', 'autre'];

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

const BEEP_TONES: { id: 'doux' | 'classique' | 'urgent' | 'melodique' | 'cloche'; label: string }[] = [
  { id: 'doux', label: 'Doux' },
  { id: 'classique', label: 'Classique' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'melodique', label: 'Mélodique' },
  { id: 'cloche', label: 'Cloche' },
];

const SECTION_META: Record<HomeSectionKey, { label: string; desc: string; toggleable: boolean }> = {
  cycle: { label: 'Cycle en cours', desc: 'La carte semaine / RIR / objectif.', toggleable: true },
  seances: { label: 'Liste des séances', desc: 'Les 6 séances PPL — toujours visible.', toggleable: false },
  nutrition: { label: 'Conseil nutrition', desc: 'Le rappel protéines/glucides après la séance.', toggleable: true },
  supersetRule: { label: 'Règle superset', desc: 'Le rappel sur le fonctionnement des supersets.', toggleable: true },
  muscleAlert: { label: 'Groupes musculaires', desc: 'Alerte les groupes pas travaillés depuis un moment.', toggleable: true },
  cardio: { label: 'Cardio', desc: 'Ajouter et suivre tes séances de vélo, marche, course...', toggleable: true },
  weeklyGoal: { label: 'Objectif hebdo', desc: "L'anneau de progression du nombre de séances cette semaine.", toggleable: true },
  nextSession: { label: 'Prochaine séance', desc: 'Le bandeau qui indique la prochaine séance du cycle.', toggleable: true },
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const accentTheme = useWorkoutStore((s) => s.accentTheme);
  const setAccentTheme = useWorkoutStore((s) => s.setAccentTheme);
  const customAccentColor = useWorkoutStore((s) => s.customAccentColor);
  const setCustomAccentColor = useWorkoutStore((s) => s.setCustomAccentColor);
  const amoledMode = useWorkoutStore((s) => s.amoledMode);
  const setAmoledMode = useWorkoutStore((s) => s.setAmoledMode);
  const theme = useWorkoutStore((s) => s.theme);
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
  const beepVolume = useWorkoutStore((s) => s.beepVolume);
  const setBeepVolume = useWorkoutStore((s) => s.setBeepVolume);
  const testBeep = useWorkoutStore((s) => s.testBeep);
  const caloriesPerHour = useWorkoutStore((s) => s.caloriesPerHour);
  const setCaloriesPerHour = useWorkoutStore((s) => s.setCaloriesPerHour);
  const bodyDiagramEnabled = useWorkoutStore((s) => s.bodyDiagramEnabled);
  const setBodyDiagramEnabled = useWorkoutStore((s) => s.setBodyDiagramEnabled);
  const cardioKcalPerHour = useWorkoutStore((s) => s.cardioKcalPerHour);
  const setCardioKcalPerHour = useWorkoutStore((s) => s.setCardioKcalPerHour);
  const weeklySessionGoal = useWorkoutStore((s) => s.weeklySessionGoal);
  const setWeeklySessionGoal = useWorkoutStore((s) => s.setWeeklySessionGoal);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const toggleDay = (id: string) => setExpandedDays((d) => ({ ...d, [id]: !d[id] }));
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  // Télécharge tout le contenu du store (séances, historique, réglages…)
  // dans un fichier JSON, pour pouvoir le garder au chaud ou le remettre
  // sur un autre téléphone.
  const handleExport = () => {
    const raw = localStorage.getItem('ppl-tracker-store');
    if (!raw) return;
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ppl-tracker-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || !parsed.state) {
          setImportMsg("Fichier invalide — pas une sauvegarde PPL Tracker.");
          return;
        }
        const ok = window.confirm(
          'Importer va remplacer toutes tes données actuelles (séances, historique, réglages...) par celles du fichier. Continuer ?'
        );
        if (!ok) return;
        localStorage.setItem('ppl-tracker-store', text);
        window.location.reload();
      } catch (_) {
        setImportMsg('Fichier invalide — impossible de le lire.');
      }
    };
    reader.readAsText(file);
  };

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
          <label
            style={{
              ...swatchBtn,
              cursor: 'pointer',
              border: accentTheme === 'custom' ? `2px solid ${customAccentColor}` : '2px solid transparent',
            }}
            title="Couleur perso"
          >
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: '50%',
              background: accentTheme === 'custom'
                ? `linear-gradient(135deg, ${customAccentColor}, ${customAccentColor})`
                : 'repeating-conic-gradient(#e03030 0% 25%, #2563eb 0% 50%, #16a34a 0% 75%, #ea580c 0% 100%)',
              boxShadow: accentTheme === 'custom' ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${customAccentColor}` : 'none',
              fontSize: 16,
            }}>
              {accentTheme !== 'custom' && '🎨'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>Perso</span>
            <input
              type="color"
              value={customAccentColor}
              onChange={(e) => setCustomAccentColor(e.target.value)}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
            />
          </label>
        </div>

        {/* Thème */}
        <p style={{ ...sectionLabel, marginTop: 24 }}>THÈME</p>
        <div style={toggleRow}>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>Noir pur (AMOLED)</p>
            <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>
              {theme === 'dark'
                ? "Fond quasi noir, économise la batterie sur écran OLED."
                : 'Actif uniquement en thème sombre (☀️/🌙 sur l\'accueil).'}
            </p>
          </div>
          <button
            onClick={() => setAmoledMode(!amoledMode)}
            style={{
              ...switchTrack,
              background: amoledMode ? 'var(--brand-1)' : 'var(--bg-elevated)',
              justifyContent: amoledMode ? 'flex-end' : 'flex-start',
              opacity: theme === 'dark' ? 1 : 0.5,
            }}
          >
            <span style={switchThumb} />
          </button>
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
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {BEEP_TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setBeepTone(t.id)}
                  style={{
                    ...restBtn,
                    flex: '1 1 30%',
                    background: beepTone === t.id ? 'var(--brand-1)' : 'var(--bg-elevated)',
                    color: beepTone === t.id ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {t.label}
                </button>
              ))}
              <button onClick={testBeep} style={{ ...restBtn, flex: '1 1 30%', color: 'var(--brand-1)' }}>▶ Tester</button>
            </div>
            <div style={{ ...toggleRow, marginBottom: 20, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>Volume du bip</p>
                <p style={{ color: 'var(--text-dim)', fontSize: 12, fontWeight: 700 }}>{beepVolume}%</p>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={beepVolume}
                onChange={(e) => setBeepVolume(Number(e.target.value))}
                onMouseUp={testBeep}
                onTouchEnd={testBeep}
                style={{ width: '100%', accentColor: 'var(--brand-1)' }}
              />
            </div>
          </>
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

        {/* Schéma des muscles sollicités */}
        <p style={sectionLabel}>SÉANCE</p>
        <div style={{ ...toggleRow, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>Schéma muscles sollicités</p>
            <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2, lineHeight: '15px' }}>
              Le corps face/dos affiché en début de séance avec les muscles travaillés.
            </p>
          </div>
          <button
            onClick={() => setBodyDiagramEnabled(!bodyDiagramEnabled)}
            style={{
              ...switchTrack,
              background: bodyDiagramEnabled ? 'var(--brand-1)' : 'var(--bg-elevated)',
              justifyContent: bodyDiagramEnabled ? 'flex-end' : 'flex-start',
            }}
          >
            <span style={switchThumb} />
          </button>
        </div>

        {/* Objectif hebdo */}
        <p style={sectionLabel}>OBJECTIF HEBDO</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 10, lineHeight: '15px' }}>
          Nombre de séances (muscu) visées par semaine, affiché avec l'anneau de progression sur l'accueil.
        </p>
        <div style={{ ...toggleRow, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>{weeklySessionGoal} séance{weeklySessionGoal > 1 ? 's' : ''} / semaine</p>
          </div>
          <button onClick={() => setWeeklySessionGoal(weeklySessionGoal - 1)} style={stepperBtn}>−</button>
          <button onClick={() => setWeeklySessionGoal(weeklySessionGoal + 1)} style={stepperBtn}>+</button>
        </div>

        {/* Cardio (vélo, marche, course...) */}
        <p style={sectionLabel}>CARDIO — CALORIES PAR ACTIVITÉ</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 10, lineHeight: '15px' }}>
          Réglage des kcal/h utilisées pour estimer les calories brûlées lors d'une activité cardio.
        </p>
        <div style={{ marginBottom: 20 }}>
          {CARDIO_TYPES.map((t) => (
            <div key={t} style={{ ...toggleRow, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>
                  {CARDIO_TYPE_LABELS[t].emoji} {CARDIO_TYPE_LABELS[t].label}
                </p>
              </div>
              <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, width: 66, textAlign: 'center' }}>
                {cardioKcalPerHour[t]} kcal/h
              </span>
              <button onClick={() => setCardioKcalPerHour(t, cardioKcalPerHour[t] - 25)} style={stepperBtn}>−</button>
              <button onClick={() => setCardioKcalPerHour(t, cardioKcalPerHour[t] + 25)} style={stepperBtn}>+</button>
            </div>
          ))}
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

        {/* Sauvegarde */}
        <p style={{ ...sectionLabel, marginTop: 24 }}>SAUVEGARDE</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 10, lineHeight: '15px' }}>
          Télécharge un fichier avec tout ton historique et tes réglages, ou restaure une sauvegarde précédente.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: importMsg ? 8 : 28 }}>
          <button onClick={handleExport} style={{ ...restBtn, flex: 1, padding: '12px 8px' }}>⬇ Exporter</button>
          <button onClick={() => importInputRef.current?.click()} style={{ ...restBtn, flex: 1, padding: '12px 8px' }}>⬆ Importer</button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
        {importMsg && (
          <p style={{ color: '#f5a623', fontSize: 11, marginBottom: 28 }}>{importMsg}</p>
        )}

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
