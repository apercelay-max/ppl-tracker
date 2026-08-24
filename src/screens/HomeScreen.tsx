import React, { useRef, useState } from 'react';
import { MESOCYCLE_WEEKS, getProgressionWeek, getWorkout } from '../data/workouts';
import { getProgram } from '../data/programs';
import { useWorkoutStore, CARDIO_TYPE_LABELS } from '../store/workoutStore';
import type { HomeSectionKey } from '../store/workoutStore';
import { ICON_SIZE_PRESETS } from '../data/iconPrefs';
import { HOME_SECTION_META } from '../data/homeSectionMeta';
import {
  getMuscleGroupsStatus, getMuscleRecoverySummary, bucketByWeek, computeLoadStatus,
  computeTonnage, getMostRecentPersonalRecord, getFeaturedExerciseProgress,
} from '../utils/training';
import type { CardioActivityType } from '../data/types';
import {
  IconPMark, IconSettings, IconBarChart, IconSun, IconMoon, IconBattery, IconTarget, IconUtensils, IconActivity,
  IconClock, IconTrendingUp, IconTrophy, IconScale,
} from '../components/Icons';

const CARDIO_TYPES: CardioActivityType[] = ['velo', 'marche', 'course', 'autre'];

// Renvoie une date relative courte ("Aujourd'hui", "Hier", "Il y a 3 j"...) —
// utilisé par le cardio ET par le widget "Séance précédente".
const formatRelativeDate = (ts: number): string => {
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// Petit sparkline SVG normalisé (poids du corps, progression d'exercice) —
// pas d'axes ni de libellés, contrairement à MiniLineChart qui est prévu
// pour un écran dédié plus grand (voir components/MiniLineChart.tsx).
const sparklinePoints = (values: number[], w: number, h: number, padY = 4): string => {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - padY - ((v - min) / range) * (h - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

// Au-delà de ce seuil (en jours), un groupe musculaire est considéré
// "en retard" — le cycle PPL Strict V10 repasse sur chaque groupe tous les
// 4 à 8 jours environ, donc 9 jours laisse une vraie marge avant d'alerter.
const MUSCLE_ALERT_THRESHOLD_DAYS = 9;

// Couleur/label de secours pour un jour qui n'a pas d'entrée dans les
// dayAccents/dayTypeLabels du programme actif (ne devrait pas arriver
// pour les programmes intégrés, mais protège les programmes importés
// incomplets).
const FALLBACK_ACCENT = '#7a7a90';

// Icônes (SVG inline, même style trait que le reste de l'app) affichées
// dans le sélecteur "+ Ajouter un widget" — une par clé de HomeSectionKey,
// même si "seances" n'y apparaît jamais (non retirable, donc jamais dans
// availableKeys) : le Record doit rester exhaustif pour rester typé.
const WIDGET_PICKER_ICONS: Record<HomeSectionKey, React.ReactNode> = {
  seances: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5.5" width="16" height="14" rx="2.2" /><line x1="4" y1="9.5" x2="20" y2="9.5" /></svg>,
  lastSession: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  weeklyStats: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  nextSession: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  cycle: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>,
  weeklyGoal: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>,
  muscleAlert: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-9.33-5" /><path d="M6 16a6 6 0 0 0 9.33 5" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>,
  cardio: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  nutrition: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>,
  supersetRule: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><polyline points="21 3 21 9 15 9" /></svg>,
  bodyWeight: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="12" cy="12" r="4" /><line x1="12" y1="7.5" x2="13.4" y2="11" /></svg>,
  personalRecord: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4" /><path d="M17 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4" /></svg>,
  exerciseProgress: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="6" r="2.5" /><path d="M4 20 L9 13 L13 16 L18 8.5" /></svg>,
};

interface HomeScreenProps { onSelectDay: (dayId: string) => void; onOpenDashboard: () => void; onOpenSettings: () => void; }

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectDay, onOpenDashboard, onOpenSettings }) => {
  const currentWeek = useWorkoutStore((s) => s.currentWeek);
  const setCurrentWeek = useWorkoutStore((s) => s.setCurrentWeek);
  const session = useWorkoutStore((s) => s.session);
  const theme = useWorkoutStore((s) => s.theme);
  const setThemeMode = useWorkoutStore((s) => s.setThemeMode);
  const navBarEnabled = useWorkoutStore((s) => s.navBarEnabled);
  const wakeLockEnabled = useWorkoutStore((s) => s.wakeLockEnabled);
  const setWakeLockEnabled = useWorkoutStore((s) => s.setWakeLockEnabled);
  const homeSections = useWorkoutStore((s) => s.homeSections);
  const homeSectionOrder = useWorkoutStore((s) => s.homeSectionOrder);
  const cycleDoneIds = useWorkoutStore((s) => s.cycleDoneIds);
  const history = useWorkoutStore((s) => s.history);
  const iconSize = useWorkoutStore((s) => s.iconSize);
  const iconSizes = ICON_SIZE_PRESETS[iconSize];
  const cardioHistory = useWorkoutStore((s) => s.cardioHistory);
  const addCardioEntry = useWorkoutStore((s) => s.addCardioEntry);
  const deleteCardioEntry = useWorkoutStore((s) => s.deleteCardioEntry);
  const weeklySessionGoal = useWorkoutStore((s) => s.weeklySessionGoal);
  const homeSectionColors = useWorkoutStore((s) => s.homeSectionColors);
  const setHomeSectionOrder = useWorkoutStore((s) => s.setHomeSectionOrder);
  const setHomeSectionVisible = useWorkoutStore((s) => s.setHomeSectionVisible);
  const bodyWeightHistory = useWorkoutStore((s) => s.bodyWeightHistory);
  // Programme actif (voir Réglages → Programme d'entraînement) — Strict V10
  // par défaut, jamais supprimé même si un autre programme est choisi.
  const activeProgramId = useWorkoutStore((s) => s.activeProgramId);
  const customPrograms = useWorkoutStore((s) => s.customPrograms);
  const activeProgram = getProgram(activeProgramId, customPrograms);
  // Couleur perso d'un bloc si réglée dans les Réglages, sinon la couleur
  // par défaut de ce bloc (accent du thème, ou couleur du jour pour
  // "prochaine séance"). Sert aussi à afficher un liseré de couleur sur la
  // carte pour qu'on voie d'un coup d'œil qu'elle est personnalisée.
  const blockColor = (key: HomeSectionKey, fallback: string) => homeSectionColors[key] ?? fallback;

  // ── Widgets d'accueil (mode édition + sélecteur d'ajout) ─────────────────
  const [homeEditMode, setHomeEditMode] = useState(false);
  const [widgetPickerOpen, setWidgetPickerOpen] = useState(false);

  // ── Cardio (formulaire rapide d'ajout) ──────────────────────────────────
  const [cardioFormOpen, setCardioFormOpen] = useState(false);
  const [cardioType, setCardioType] = useState<CardioActivityType>('velo');
  const [cardioDuration, setCardioDuration] = useState(30);
  const [cardioRpe, setCardioRpe] = useState<number | null>(null);

  const handleAddCardio = () => {
    addCardioEntry(cardioType, cardioDuration, cardioRpe ?? undefined);
    setCardioFormOpen(false);
    setCardioDuration(30);
    setCardioRpe(null);
  };

  const weekData = getProgressionWeek(currentWeek);
  const resumeWorkout = session && !session.isComplete
    ? getWorkout(session.dayId)
    : null;
  const cycleProgress = ((currentWeek - 1) / (MESOCYCLE_WEEKS - 1)) * 100;

  const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  // ── Récupération musculaire (widget affiché en tête d'écran d'accueil) ──
  // Quel groupe musculaire a le plus besoin de récupérer, et la moyenne de
  // récupération tous groupes confondus — voir getMuscleRecoverySummary
  // (utils/training.ts), qui se base sur les durées de récup recommandées
  // par muscle et sur la dernière séance réelle où chacun a été travaillé.
  const { leastRecovered, averagePct } = getMuscleRecoverySummary(history);
  const recoveryColor = averagePct >= 0.8 ? '#4CAF50' : averagePct >= 0.5 ? '#f5a623' : '#e03030';

  // ── Charge d'entraînement (alerte pic de charge) ─────────────────────────
  // Compare la charge de la semaine en cours à la moyenne des semaines
  // précédentes — voir computeLoadStatus (utils/training.ts). Renvoie null
  // si pas assez de données plutôt que d'inventer un statut.
  const loadStatus = computeLoadStatus(bucketByWeek(history));

  // ── Effet holographique du titre ─────────────────────────────────────────
  // Le dégradé animé (.titre-irise) bouge déjà tout seul en boucle. On
  // ajoute par-dessus un reflet qui suit le doigt/la souris, comme une
  // carte holographique, sans toucher à l'animation existante.
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const [holoPos, setHoloPos] = useState({ x: 50, y: 50 });
  const handleTitlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = titleWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHoloPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };
  const handleTitlePointerLeave = () => setHoloPos({ x: 50, y: 50 });

  const cycleColor = blockColor('cycle', 'var(--brand-1)');
  // Le suivi "semaine / RIR / objectif" (mésocycle 11 semaines) est propre
  // à Strict V2.2 — les autres programmes n'ont pas cette notion, donc le
  // bloc ne s'affiche que pour celui-ci, même si le réglage est activé.
  const cycleSection = homeSections.cycle && activeProgramId === 'strict-v10' && (
    <div key="cycle" style={{ ...weekCard, ...(homeSectionColors.cycle ? { borderLeft: `3px solid ${cycleColor}` } : {}) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={sectionLabel}>CYCLE EN COURS</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 700, marginTop: 2 }}>{weekData.phase}</p>
        </div>
        <div style={weekSelectorRow}>
          <button className="week-btn" style={weekBtn} onClick={() => setCurrentWeek(currentWeek - 1)} disabled={currentWeek <= 1}>‹</button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 28 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>SEM.</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 18, lineHeight: '1' }}>{currentWeek}</span>
          </div>
          <button className="week-btn" style={weekBtn} onClick={() => setCurrentWeek(currentWeek + 1)} disabled={currentWeek >= MESOCYCLE_WEEKS}>›</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={weekMetric}>
          <span style={weekMetricLabel}>RIR</span>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: '#4CAF50' }}>{weekData.rir.replace('RIR ', '')}</span>
        </div>
        <div style={weekMetric}>
          <span style={weekMetricLabel}>REPOS</span>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: cycleColor }}>3:00</span>
        </div>
        <div style={{ ...weekMetric, flex: 2 }}>
          <span style={weekMetricLabel}>OBJECTIF</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: '14px' }}>{weekData.objective}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 6 }}>
        {Array.from({ length: MESOCYCLE_WEEKS }, (_, i) => (
          <div key={i} style={{
            flex: 1, height: i + 1 === currentWeek ? 6 : 4, borderRadius: 3,
            background: i + 1 < currentWeek ? cycleColor : i + 1 === currentWeek ? '#ffffff' : 'var(--border-strong)',
            transition: 'background 0.3s, height 0.3s',
            boxShadow: i + 1 < currentWeek ? `0 0 6px rgba(var(--brand-1-rgb),0.4)` : 'none',
          }} />
        ))}
      </div>
      <p style={{ color: 'var(--text-micro)', fontSize: 10 }}>Semaine {currentWeek} / {MESOCYCLE_WEEKS} · {Math.round(cycleProgress)}% du cycle</p>
    </div>
  );

  const seancesSection = (
    <div key="seances">
      <p style={{ ...sectionLabel, marginBottom: 10 }}>SÉANCES</p>
      <div>
        {activeProgram.workouts.map((workout, idx) => {
          const accent = activeProgram.dayAccents[workout.id] ?? FALLBACK_ACCENT;
          const typeLabel = activeProgram.dayTypeLabels[workout.id] ?? '';
          const isDone = cycleDoneIds.includes(workout.id);
          return (
            <button
              key={workout.id}
              className="workout-card slide-up"
              style={{ ...workoutCard, animationDelay: `${idx * 0.06}s`, opacity: isDone ? 0.5 : 1 }}
              onClick={() => onSelectDay(workout.id)}
            >
              <div style={{
                width: 48, alignSelf: 'stretch', flexShrink: 0,
                background: `${accent}15`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                borderRight: `1px solid ${accent}22`,
              }}>
                <span style={{ color: accent, fontSize: 10, fontWeight: 800, letterSpacing: 1.5 }}>{typeLabel}</span>
                <span style={{ color: `${accent}60`, fontSize: 11, fontWeight: 700 }}>J{workout.dayNumber}</span>
              </div>
              <div style={{ flex: 1, padding: '14px 14px', textAlign: 'left' }}>
                <p style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 800, marginBottom: 3, letterSpacing: -0.3 }}>{workout.name}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 2 }}>{workout.muscleGroups}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                  {isDone ? (
                    <span style={{
                      background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)',
                      borderRadius: 6, padding: '2px 8px',
                      color: '#4CAF50', fontSize: 10, fontWeight: 700,
                    }}>✓ Fait ce cycle</span>
                  ) : (
                    <span style={{
                      background: `${accent}15`, border: `1px solid ${accent}25`,
                      borderRadius: 6, padding: '2px 8px',
                      color: accent, fontSize: 10, fontWeight: 700,
                    }}>{workout.exercises.length} exercices</span>
                  )}
                  <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{workout.estimatedDuration}</span>
                </div>
              </div>
              <span style={{ color: accent, fontSize: 22, fontWeight: 200, paddingRight: 14, flexShrink: 0, opacity: 0.6 }}>›</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const nutritionSection = homeSections.nutrition && (
    <div key="nutrition" style={{ ...nutritionCard, ...(homeSectionColors.nutrition ? { borderLeft: `3px solid ${homeSectionColors.nutrition}` } : {}) }}>
      <p style={{ color: 'var(--text-gold-label)', fontSize: 11, fontWeight: 700, marginBottom: 6 }}><span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 6 }}><IconUtensils size={13} /></span>Nutrition post-training</p>
      <p style={{ color: 'var(--text-gold-body)', fontSize: 12, lineHeight: '18px' }}>
        Dans les <strong style={{ color: '#a07030' }}>30 min</strong> après la séance :
        30-40g protéines · 50-80g glucides.
      </p>
    </div>
  );

  const muscleAlertSection = homeSections.muscleAlert && (() => {
    if (history.length === 0) return null; // Rien à signaler avant la 1ère séance
    const statuses = getMuscleGroupsStatus(history)
      .filter((s) => s.daysSince === null || s.daysSince > MUSCLE_ALERT_THRESHOLD_DAYS)
      .sort((a, b) => (b.daysSince ?? 999) - (a.daysSince ?? 999));
    return (
      <div key="muscleAlert" style={{ ...muscleAlertCard, ...(homeSectionColors.muscleAlert ? { borderLeft: `3px solid ${homeSectionColors.muscleAlert}` } : {}) }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, marginBottom: statuses.length ? 8 : 0 }}>
          <span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 6 }}><IconTarget size={13} /></span>Groupes musculaires
        </p>
        {statuses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: '17px' }}>
            Tout est à jour, aucun groupe musculaire délaissé. 👍
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {statuses.map((s) => (
              <div key={s.group} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.group}</span>
                <span style={{ color: homeSectionColors.muscleAlert ?? '#f5a623', fontSize: 12, fontWeight: 700 }}>
                  {s.daysSince === null ? 'jamais travaillé' : `${s.daysSince} j`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  })();

  const supersetSection = homeSections.supersetRule && activeProgramId === 'strict-v10' && (
    <div key="supersetRule" style={{
      background: 'var(--bg-green-tint)', borderRadius: 14, padding: 14, marginTop: 8, marginBottom: 10,
      border: '1px solid var(--border-ss-tint)',
      ...(homeSectionColors.supersetRule ? { borderLeft: `3px solid ${homeSectionColors.supersetRule}` } : {}),
    }}>
      <p style={{ color: 'var(--text-ss-label)', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>⟳ Règle Superset</p>
      <p style={{ color: 'var(--text-ss-body)', fontSize: 12, lineHeight: '17px' }}>
        Enchaîne les deux exercices SS sans repos. Le minuteur de 3 min démarre uniquement après la paire. Push A & B uniquement.
      </p>
    </div>
  );

  const cardioColor = blockColor('cardio', 'var(--brand-1)');
  const cardioSection = homeSections.cardio && (
    <div key="cardio" style={{ ...cardioCard, ...(homeSectionColors.cardio ? { borderLeft: `3px solid ${cardioColor}` } : {}) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: cardioFormOpen || cardioHistory.length ? 10 : 0 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}><span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 6 }}><IconActivity size={13} /></span>Cardio</p>
        {!cardioFormOpen && (
          <button onClick={() => setCardioFormOpen(true)} style={{ ...cardioAddBtn, color: cardioColor }}>+ Ajouter</button>
        )}
      </div>

      {cardioFormOpen && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {CARDIO_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setCardioType(t)}
                style={{
                  ...cardioTypeBtn,
                  background: cardioType === t ? cardioColor : 'var(--bg-elevated)',
                  color: cardioType === t ? '#fff' : 'var(--text-muted)',
                }}
              >
                <span style={{ fontSize: 15 }}>{CARDIO_TYPE_LABELS[t].emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 700 }}>{CARDIO_TYPE_LABELS[t].label}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, flex: 1 }}>Durée</span>
            <button onClick={() => setCardioDuration((d) => Math.max(5, d - 5))} style={cardioStepBtn}>−</button>
            <span style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 800, width: 56, textAlign: 'center' }}>{cardioDuration} min</span>
            <button onClick={() => setCardioDuration((d) => Math.min(240, d + 5))} style={cardioStepBtn}>+</button>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>Ressenti (facultatif)</p>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setCardioRpe(cardioRpe === n ? null : n)}
                style={{
                  ...cardioRpeBtn,
                  background: cardioRpe === n ? cardioColor : 'var(--bg-elevated)',
                  color: cardioRpe === n ? '#fff' : 'var(--text-dim)',
                }}
              >{n}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAddCardio} style={{ ...cardioValidateBtn, background: `linear-gradient(135deg, ${cardioColor}, var(--brand-2))` }}>Enregistrer</button>
            <button onClick={() => setCardioFormOpen(false)} style={cardioCancelBtn}>Annuler</button>
          </div>
        </div>
      )}

      {cardioHistory.slice(0, 3).map((entry) => (
        <div key={entry.id} style={cardioRow}>
          <span style={{ fontSize: 16 }}>{CARDIO_TYPE_LABELS[entry.type].emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>{CARDIO_TYPE_LABELS[entry.type].label}</p>
            <p style={{ color: 'var(--text-dim)', fontSize: 11 }}>
              {formatRelativeDate(entry.date)} · {entry.durationMin} min · {entry.calories} kcal{entry.rpe ? ` · RPE ${entry.rpe}` : ''}
            </p>
          </div>
          <button onClick={() => deleteCardioEntry(entry.id)} style={cardioDeleteBtn}>✕</button>
        </div>
      ))}
    </div>
  );

  const weeklyGoalSection = homeSections.weeklyGoal && (() => {
    const now = Date.now();
    const sessionsThisWeek = history.filter((e) => now - e.date < 7 * 86400000).length;
    const pct = Math.min(1, sessionsThisWeek / weeklySessionGoal);
    const r = 26;
    const circumference = 2 * Math.PI * r;
    const goalReached = sessionsThisWeek >= weeklySessionGoal;
    const goalColor = blockColor('weeklyGoal', 'var(--brand-1)');
    return (
      <div key="weeklyGoal" style={{ ...weeklyGoalCard, ...(homeSectionColors.weeklyGoal ? { borderLeft: `3px solid ${goalColor}` } : {}) }}>
        <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="7" />
          <circle
            cx="32" cy="32" r={r} fill="none"
            stroke={goalReached ? '#4CAF50' : goalColor}
            strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 0.3s' }}
          />
        </svg>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 800 }}>
            {sessionsThisWeek} / {weeklySessionGoal} <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: 12 }}>séances cette semaine</span>
          </p>
          <p style={{ color: goalReached ? '#4CAF50' : 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>
            {goalReached ? 'Objectif atteint 💪' : `Encore ${weeklySessionGoal - sessionsThisWeek} pour l'objectif`}
          </p>
        </div>
      </div>
    );
  })();

  const nextWorkout = activeProgram.workouts.find((w) => !cycleDoneIds.includes(w.id)) ?? activeProgram.workouts[0];
  const nextColor = blockColor('nextSession', activeProgram.dayAccents[nextWorkout?.id ?? ''] ?? FALLBACK_ACCENT);
  const nextSessionSection = homeSections.nextSession && !resumeWorkout && nextWorkout && (
    <button key="nextSession" className="workout-card" style={{ ...nextSessionBanner, ...(homeSectionColors.nextSession ? { borderLeft: `3px solid ${nextColor}` } : {}) }} onClick={() => onSelectDay(nextWorkout.id)}>
      <div style={{ ...nextSessionIcon, background: `${nextColor}20` }}>
        <span style={{ display: 'inline-flex' }}><IconTarget size={20} color={nextColor} /></span>
      </div>
      <div style={{ textAlign: 'left', flex: 1 }}>
        <p style={{ color: nextColor, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>PROCHAINE SÉANCE</p>
        <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800 }}>{nextWorkout.name}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{nextWorkout.muscleGroups}</p>
      </div>
      <span style={{ color: nextColor, fontSize: 22, fontWeight: 200, flexShrink: 0, opacity: 0.8 }}>›</span>
    </button>
  );

  // ── Séance précédente ─────────────────────────────────────────────────
  const lastEntry = history[0];
  const lastSessionSection = homeSections.lastSession && lastEntry && (() => {
    const lastWorkoutMeta = getWorkout(lastEntry.dayId);
    const tonnage = lastEntry.tonnage ?? computeTonnage(lastEntry.exerciseProgress);
    const setsCount = Object.values(lastEntry.exerciseProgress).reduce((sum, sets) => sum + sets.filter((s) => s.completed).length, 0);
    const durationMin = Math.round(lastEntry.durationMs / 60000);
    const accent = activeProgram.dayAccents[lastEntry.dayId] ?? FALLBACK_ACCENT;
    return (
      <div key="lastSession" style={{ ...cardioCard, ...(homeSectionColors.lastSession ? { borderLeft: `3px solid ${homeSectionColors.lastSession}` } : {}) }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
          <span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 6 }}><IconClock size={13} /></span>Séance précédente
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 6, alignSelf: 'stretch', borderRadius: 3, background: accent, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 800 }}>{lastWorkoutMeta?.name ?? lastEntry.dayId}</p>
            <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>{formatRelativeDate(lastEntry.date)}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={statTile}><span style={statTileLabel}>DURÉE</span><span style={statTileValue}>{durationMin} min</span></div>
          <div style={statTile}><span style={statTileLabel}>TONNAGE</span><span style={statTileValue}>{tonnage.toLocaleString('fr-FR')} kg</span></div>
          <div style={statTile}><span style={statTileLabel}>SÉRIES</span><span style={statTileValue}>{setsCount}</span></div>
        </div>
      </div>
    );
  })();

  // ── Stats de la semaine ───────────────────────────────────────────────
  const weeklyStatsSection = homeSections.weeklyStats && history.length > 0 && (() => {
    const buckets = bucketByWeek(history, 4); // plus ancien → plus récent, dernier = cette semaine
    const thisWeek = buckets[buckets.length - 1];
    const lastWeek = buckets[buckets.length - 2];
    const pct = lastWeek.tonnage > 0 ? Math.round(((thisWeek.tonnage - lastWeek.tonnage) / lastWeek.tonnage) * 100) : null;
    const maxTonnage = Math.max(1, ...buckets.map((b) => b.tonnage));
    return (
      <div key="weeklyStats" style={{ ...cardioCard, ...(homeSectionColors.weeklyStats ? { borderLeft: `3px solid ${homeSectionColors.weeklyStats}` } : {}) }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
          <span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 6 }}><IconBarChart size={13} /></span>Stats de la semaine
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 3 }}>Tonnage cette semaine</p>
            <p style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 }}>{thisWeek.tonnage.toLocaleString('fr-FR')} kg</p>
          </div>
          {pct !== null && (
            <span style={{
              fontSize: 10, fontWeight: 800, borderRadius: 6, padding: '3px 7px',
              color: pct >= 0 ? '#4CAF50' : '#f5a623',
              background: pct >= 0 ? 'rgba(76,175,80,0.12)' : 'rgba(245,166,35,0.12)',
              border: `1px solid ${pct >= 0 ? 'rgba(76,175,80,0.25)' : 'rgba(245,166,35,0.25)'}`,
            }}>{pct >= 0 ? '+' : ''}{pct}%</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, height: 46, alignItems: 'flex-end' }}>
          {buckets.map((b, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{
                width: '100%', height: `${Math.max(6, Math.round((b.tonnage / maxTonnage) * 100))}%`, borderRadius: 4,
                background: i === buckets.length - 1 ? 'var(--brand-1)' : 'var(--bg-elevated)',
                opacity: i === buckets.length - 1 ? 1 : 0.75,
              }} />
              <span style={{ color: i === buckets.length - 1 ? 'var(--text-secondary)' : 'var(--text-micro)', fontSize: 8, fontWeight: 700 }}>
                {i === buckets.length - 1 ? 'S' : `-${buckets.length - 1 - i}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  })();

  // ── Poids du corps ────────────────────────────────────────────────────
  const bodyWeightSection = homeSections.bodyWeight && bodyWeightHistory.length > 0 && (() => {
    const last = bodyWeightHistory[0]; // stocké du plus récent au plus ancien
    const previous = bodyWeightHistory[1];
    const deltaKg = previous ? Math.round((last.weightKg - previous.weightKg) * 10) / 10 : null;
    const trend = [...bodyWeightHistory].slice(0, 8).reverse().map((e) => e.weightKg); // plus ancien → plus récent
    return (
      <div key="bodyWeight" style={{ ...cardioCard, ...(homeSectionColors.bodyWeight ? { borderLeft: `3px solid ${homeSectionColors.bodyWeight}` } : {}) }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
          <span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 6 }}><IconScale size={13} /></span>Poids du corps
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 3 }}>Dernière pesée · {formatRelativeDate(last.date)}</p>
            <p style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 }}>{last.weightKg} kg</p>
          </div>
          {deltaKg !== null && deltaKg !== 0 && (
            <span style={{
              fontSize: 10, fontWeight: 800, borderRadius: 6, padding: '3px 7px',
              color: 'var(--text-secondary)', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
            }}>{deltaKg > 0 ? '↑' : '↓'} {Math.abs(deltaKg)} kg</span>
          )}
        </div>
        {trend.length >= 2 ? (
          <svg width="100%" height="36" viewBox="0 0 280 36" preserveAspectRatio="none" style={{ display: 'block' }}>
            <polyline points={sparklinePoints(trend, 280, 36)} fill="none" stroke="var(--brand-1)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <p style={{ color: 'var(--text-dim)', fontSize: 11 }}>Ajoute une autre pesée pour voir la tendance.</p>
        )}
      </div>
    );
  })();

  // ── Dernier record perso ──────────────────────────────────────────────
  const recentPR = getMostRecentPersonalRecord(history);
  const personalRecordSection = homeSections.personalRecord && recentPR && (
    <div key="personalRecord" style={{ ...personalRecordCard, ...(homeSectionColors.personalRecord ? { borderLeft: `3px solid ${homeSectionColors.personalRecord}` } : {}) }}>
      <div style={personalRecordIcon}><IconTrophy size={20} color="#f5a623" /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#f5a623', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>NOUVEAU RECORD</p>
        <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800 }}>{recentPR.exerciseName} — {recentPR.weight} kg</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>
          +{Math.round((recentPR.weight - recentPR.previousMax) * 10) / 10} kg vs le record précédent · {formatRelativeDate(recentPR.date)}
        </p>
      </div>
    </div>
  );

  // ── Progression sur un exercice ───────────────────────────────────────
  const featuredProgress = getFeaturedExerciseProgress(history);
  const exerciseProgressSection = homeSections.exerciseProgress && featuredProgress && (() => {
    const trend = featuredProgress.e1rmHistory.map((p) => p.e1rm);
    return (
      <div key="exerciseProgress" style={{ ...cardioCard, ...(homeSectionColors.exerciseProgress ? { borderLeft: `3px solid ${homeSectionColors.exerciseProgress}` } : {}) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}>
            <span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 6 }}><IconTrendingUp size={13} /></span>Progression
          </p>
          <span style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '3px 8px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>
            {featuredProgress.exerciseName}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 3 }}>1RM estimé</p>
            <p style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800 }}>{featuredProgress.currentE1RM} kg</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, borderRadius: 6, padding: '3px 7px', color: '#4CAF50', background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.25)' }}>
            +{featuredProgress.deltaKg} kg / {featuredProgress.weeksSpan} sem.
          </span>
        </div>
        <svg width="100%" height="36" viewBox="0 0 280 36" preserveAspectRatio="none" style={{ display: 'block' }}>
          <polyline points={sparklinePoints(trend, 280, 36)} fill="none" stroke="var(--brand-1)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  })();

  const SECTION_MAP: Record<string, React.ReactNode> = {
    cycle: cycleSection,
    seances: seancesSection,
    nutrition: nutritionSection,
    supersetRule: supersetSection,
    muscleAlert: muscleAlertSection,
    cardio: cardioSection,
    weeklyGoal: weeklyGoalSection,
    nextSession: nextSessionSection,
    lastSession: lastSessionSection,
    weeklyStats: weeklyStatsSection,
    bodyWeight: bodyWeightSection,
    personalRecord: personalRecordSection,
    exerciseProgress: exerciseProgressSection,
  };

  // ── Édition de l'accueil : réordonner par rapport aux voisins VISIBLES
  // uniquement (pas le voisin dans l'ordre complet, qui peut être masqué —
  // voir setHomeSectionOrder dans workoutStore.ts) ────────────────────────
  const renderableKeys = homeSectionOrder.filter((key) => Boolean(SECTION_MAP[key]));
  const availableKeys = homeSectionOrder.filter((key) => {
    const meta = HOME_SECTION_META[key];
    return meta.toggleable && !homeSections[key as keyof typeof homeSections];
  });

  const moveVisibleSection = (key: HomeSectionKey, direction: 'up' | 'down') => {
    const order = [...homeSectionOrder];
    const isRenderable = (k: HomeSectionKey) => Boolean(SECTION_MAP[k]);
    const renderableIdxs = order.map((k, i) => (isRenderable(k) ? i : -1)).filter((i) => i !== -1);
    const realIdx = order.indexOf(key);
    const posInRenderable = renderableIdxs.indexOf(realIdx);
    const swapPos = direction === 'up' ? posInRenderable - 1 : posInRenderable + 1;
    if (swapPos < 0 || swapPos >= renderableIdxs.length) return;
    const swapRealIdx = renderableIdxs[swapPos];
    [order[realIdx], order[swapRealIdx]] = [order[swapRealIdx], order[realIdx]];
    setHomeSectionOrder(order);
  };

  return (
    <div style={container}>
      <div style={{ ...scroll, paddingBottom: navBarEnabled ? 112 : 80 }}>

        {/* Header */}
        <div style={headerSection}>
          <div style={logoRow}>
            <div style={{ ...logoBadge, width: iconSizes.logo, height: iconSizes.logo }}><span style={{ display: 'inline-flex', lineHeight: 1 }}><IconPMark size={iconSizes.logo * 0.6} color="#ffffff" /></span></div>
            <div>
              <div
                ref={titleWrapRef}
                style={{ position: 'relative', display: 'inline-block' }}
                onPointerMove={handleTitlePointerMove}
                onPointerLeave={handleTitlePointerLeave}
              >
                <h1 className="titre-irise" style={titleStyle}>PPL Tracker</h1>
                <h1
                  aria-hidden
                  style={{
                    ...titleStyle,
                    position: 'absolute', inset: 0, margin: 0, pointerEvents: 'none',
                    backgroundImage: `radial-gradient(circle at ${holoPos.x}% ${holoPos.y}%, rgba(255,255,255,0.95), rgba(255,255,255,0) 45%)`,
                    WebkitBackgroundClip: 'text', backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent', color: 'transparent',
                    mixBlendMode: 'overlay',
                    transition: 'background-image 0.08s linear',
                  }}
                >PPL Tracker</h1>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{activeProgram.focusLabel}</p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {homeEditMode ? (
                <button
                  onClick={() => { setHomeEditMode(false); setWidgetPickerOpen(false); }}
                  style={{
                    height: iconSizes.header, padding: '0 14px', borderRadius: 'var(--icon-radius)',
                    background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}
                >Terminé</button>
              ) : (
                <button
                  onClick={() => setHomeEditMode(true)}
                  style={{ ...themeToggle, width: iconSizes.header, height: iconSizes.header }}
                  title="Personnaliser l'accueil"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                </button>
              )}
              <button
                onClick={onOpenSettings}
                style={{ ...themeToggle, width: iconSizes.header, height: iconSizes.header }}
                title="Réglages"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><IconSettings size={18} /></span>
              </button>
              <button
                onClick={onOpenDashboard}
                style={{ ...themeToggle, width: iconSizes.header, height: iconSizes.header }}
                title="Dashboard"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><IconBarChart size={18} /></span>
              </button>
              {wakeLockSupported && (
                <button
                  onClick={() => setWakeLockEnabled(!wakeLockEnabled)}
                  style={{ ...themeToggle, width: iconSizes.header, height: iconSizes.header, background: wakeLockEnabled ? 'rgba(76,175,80,0.12)' : 'var(--bg-elevated)', borderColor: wakeLockEnabled ? 'rgba(76,175,80,0.3)' : 'var(--border)' }}
                  title={wakeLockEnabled ? 'Écran toujours allumé (actif)' : 'Écran toujours allumé (inactif)'}
                >
                  {wakeLockEnabled ? <IconSun size={18} filled /> : <IconSun size={18} />}
                </button>
              )}
              <button
                onClick={() => setThemeMode(theme === 'dark' ? 'light' : 'dark')}
                style={{ ...themeToggle, width: iconSizes.header, height: iconSizes.header }}
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Récupération musculaire — toujours visible en tête d'accueil */}
        <div style={recoveryCard}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, marginBottom: 10 }}><span style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 6 }}><IconBattery size={13} /></span>Récupération musculaire</p>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: '17px' }}>
              Termine ta première séance pour voir la récupération de chaque muscle ici.
            </p>
          ) : (
            <>
              {leastRecovered ? (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>À récupérer en priorité</span>
                    <span style={{ color: '#f5a623', fontSize: 12, fontWeight: 800 }}>{Math.round(leastRecovered.pct * 100)}%</span>
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{leastRecovered.group}</p>
                  <div style={recoveryBarTrack}>
                    <div style={{ ...recoveryBarFill, width: `${Math.round(leastRecovered.pct * 100)}%`, background: '#f5a623' }} />
                  </div>
                </div>
              ) : (
                <p style={{ color: '#4CAF50', fontSize: 12, marginBottom: 14 }}>Tous les groupes musculaires sont récupérés 💪</p>
              )}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Moyenne de récupération</span>
                  <span style={{ color: recoveryColor, fontSize: 12, fontWeight: 800 }}>{Math.round(averagePct * 100)}%</span>
                </div>
                <div style={recoveryBarTrack}>
                  <div style={{ ...recoveryBarFill, width: `${Math.round(averagePct * 100)}%`, background: recoveryColor }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Alerte pic de charge d'entraînement */}
        {loadStatus && (
          <div style={{ ...recoveryCard, border: loadStatus.level === 'spike' ? '1px solid rgba(224,48,48,0.35)' : '1px solid var(--border-mid)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{loadStatus.label}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: '17px' }}>{loadStatus.detail}</p>
          </div>
        )}

        {/* Reprise */}
        {resumeWorkout && (
          <button className="resume-btn" style={resumeCard} onClick={() => onSelectDay(resumeWorkout.id)}>
            <div style={{ ...resumeIcon, width: iconSizes.resume, height: iconSizes.resume }}><span style={{ fontSize: iconSizes.resume * 0.4 }}>▶</span></div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <p style={{ color: 'var(--brand-1)', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>SÉANCE EN COURS</p>
              <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800 }}>{resumeWorkout.name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Appuie pour reprendre</p>
            </div>
            <span style={{ color: 'var(--brand-1)', fontSize: 22, fontWeight: 200, flexShrink: 0, opacity: 0.8 }}>›</span>
          </button>
        )}

        {/* Bandeau mode édition */}
        {homeEditMode && (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: '17px', marginBottom: 12 }}>
            Réorganise, retire ou ajoute des widgets à ton accueil.
          </p>
        )}

        {/* Blocs réordonnables selon les réglages */}
        {renderableKeys.map((key, idx) => {
          const meta = HOME_SECTION_META[key];
          return (
            <div key={key} style={{ position: 'relative' }}>
              {homeEditMode && (
                <div style={widgetCtrlCluster}>
                  <button
                    onClick={() => moveVisibleSection(key, 'up')}
                    disabled={idx === 0}
                    style={{ ...widgetCtrlBtn, opacity: idx === 0 ? 0.3 : 1 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                  </button>
                  <button
                    onClick={() => moveVisibleSection(key, 'down')}
                    disabled={idx === renderableKeys.length - 1}
                    style={{ ...widgetCtrlBtn, opacity: idx === renderableKeys.length - 1 ? 0.3 : 1 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                  {meta.toggleable && (
                    <button
                      onClick={() => setHomeSectionVisible(key as keyof typeof homeSections, false)}
                      style={{ ...widgetCtrlBtn, color: '#e03030' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  )}
                </div>
              )}
              {SECTION_MAP[key]}
            </div>
          );
        })}

        {/* Ajouter un widget */}
        {homeEditMode && availableKeys.length > 0 && (
          <button onClick={() => setWidgetPickerOpen(true)} style={addWidgetBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Ajouter un widget
          </button>
        )}

      </div>

      {/* Sélecteur de widget (bottom sheet, même style que le tiroir "+" de la nav bar) */}
      {widgetPickerOpen && (
        <>
          <div onClick={() => setWidgetPickerOpen(false)} style={pickerBackdrop} />
          <div style={{ ...pickerLayer, bottom: navBarEnabled ? 'calc(max(10px, env(safe-area-inset-bottom)) + 74px)' : 'max(10px, env(safe-area-inset-bottom))' }}>
            <div className="navbar-glass nav-drawer-in" style={pickerSheet} role="menu">
              <div style={pickerHandle} aria-hidden="true" />
              <p style={pickerTitle}>Ajouter un widget</p>
              <div style={pickerList}>
                {availableKeys.map((key) => {
                  const meta = HOME_SECTION_META[key];
                  return (
                    <button
                      key={key}
                      className="nav-drawer-row"
                      onClick={() => { setHomeSectionVisible(key as keyof typeof homeSections, true); setWidgetPickerOpen(false); }}
                      style={pickerRow}
                    >
                      <div style={pickerIconWrap}>{WIDGET_PICKER_ICONS[key]}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                        <span style={pickerLabel}>{meta.label}</span>
                        <span style={pickerHint}>{meta.desc}</span>
                      </div>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand-1)" strokeWidth="2.4" strokeLinecap="round" style={{ flexShrink: 0 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto', background: 'var(--bg-base)' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px 80px' };
const headerSection: React.CSSProperties = {
  paddingTop: 'max(24px, env(safe-area-inset-top))',
  paddingBottom: 18,
  borderBottom: '1px solid var(--border-subtle)',
  marginBottom: 18,
};
const logoRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14 };
const logoBadge: React.CSSProperties = {
  width: 48, height: 48, borderRadius: 'var(--icon-radius)',
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 4px 16px rgba(var(--brand-1-rgb),0.3)',
  transition: 'width 0.2s, height 0.2s, border-radius 0.2s',
};
const titleStyle: React.CSSProperties = {
  fontSize: 24, fontWeight: 800, letterSpacing: -0.5,
};
const themeToggle: React.CSSProperties = {
  width: 36, height: 36,
  background: 'var(--bg-elevated)', borderRadius: 'var(--icon-radius)',
  border: '1px solid var(--border)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 16, cursor: 'pointer', flexShrink: 0,
  transition: 'width 0.2s, height 0.2s, border-radius 0.2s',
};
const sectionLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 2 };
const weekCard: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: 20, padding: 18, marginBottom: 16,
  border: '1px solid var(--border-mid)',
};
const weekSelectorRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4,
  background: 'var(--bg-higher)', borderRadius: 12, padding: '4px 8px',
  border: '1px solid var(--border-strong)',
};
const weekBtn: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 20, fontWeight: 300, padding: '0 4px', borderRadius: 6 };
const weekMetric: React.CSSProperties = {
  flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '8px 6px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
};
const weekMetricLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 9, fontWeight: 700, letterSpacing: 1 };
const recoveryCard: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 18, padding: 16,
  marginTop: 4, marginBottom: 18,
  border: '1px solid var(--border-mid)',
};
const recoveryBarTrack: React.CSSProperties = {
  width: '100%', height: 6, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden',
};
const recoveryBarFill: React.CSSProperties = {
  height: '100%', borderRadius: 3, transition: 'width 0.3s',
};
const resumeCard: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  background: 'var(--bg-red-tint)',
  borderRadius: 18, padding: '14px 16px',
  marginBottom: 20, marginTop: 4,
  border: '1px solid rgba(var(--brand-1-rgb),0.2)',
  width: '100%', cursor: 'pointer',
};
const resumeIcon: React.CSSProperties = {
  width: 40, height: 40, background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  borderRadius: 'var(--icon-radius)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(var(--brand-1-rgb),0.35)',
};
const workoutCard: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  borderRadius: 18, marginBottom: 8,
  border: '1px solid var(--border)',
  overflow: 'hidden', width: '100%', cursor: 'pointer',
  background: 'var(--bg-surface)',
};
const nutritionCard: React.CSSProperties = {
  background: 'var(--bg-gold-tint)', borderRadius: 14, padding: 14, marginTop: 10,
  border: '1px solid var(--border-gold-tint)',
};
const muscleAlertCard: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14, padding: 14, marginTop: 10, marginBottom: 10,
  border: '1px solid var(--border-mid)',
};
const weeklyGoalCard: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  background: 'var(--bg-card)', borderRadius: 14, padding: 14, marginTop: 10, marginBottom: 10,
  border: '1px solid var(--border-mid)',
};
const nextSessionBanner: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  background: 'var(--bg-card)', borderRadius: 18, padding: '14px 16px',
  marginBottom: 16, border: '1px solid var(--border-mid)', width: '100%', cursor: 'pointer',
};
const nextSessionIcon: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 'var(--icon-radius)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
const cardioCard: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 14, padding: 14, marginTop: 10, marginBottom: 10,
  border: '1px solid var(--border-mid)',
};
const cardioAddBtn: React.CSSProperties = {
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  borderRadius: 10, padding: '6px 10px', color: 'var(--brand-1)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
};
const cardioTypeBtn: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
  padding: '8px 2px', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border-strong)',
};
const cardioStepBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  color: 'var(--text-muted)', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const cardioRpeBtn: React.CSSProperties = {
  flex: 1, height: 26, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
};
const cardioValidateBtn: React.CSSProperties = {
  flex: 1, background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  borderRadius: 10, padding: '10px 8px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
const cardioCancelBtn: React.CSSProperties = {
  flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  borderRadius: 10, padding: '10px 8px', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
const cardioRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 0', borderTop: '1px solid var(--border-subtle)',
};
const cardioDeleteBtn: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 7, flexShrink: 0,
  background: 'var(--bg-elevated)', color: 'var(--text-dim)', fontSize: 11, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

// ─── Widgets d'accueil (mode édition + sélecteur d'ajout) ────────────────────

const statTile: React.CSSProperties = {
  flex: 1, background: 'var(--bg-higher)', borderRadius: 10, padding: '8px 4px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
  border: '1px solid var(--border-strong)',
};
const statTileLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 9, fontWeight: 700, letterSpacing: 1 };
const statTileValue: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 };

const personalRecordCard: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  background: 'var(--bg-gold-tint)', borderRadius: 18, padding: '14px 16px',
  marginTop: 10, marginBottom: 10, border: '1px solid var(--border-gold-tint)',
};
const personalRecordIcon: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 'var(--icon-radius)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  background: 'rgba(245,166,35,0.15)',
};

// Cluster de contrôles flottant (haut-droite d'un widget) en mode édition —
// mêmes proportions que le tiroir de la nav bar pour rester cohérent.
const widgetCtrlCluster: React.CSSProperties = {
  position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', gap: 4,
  background: 'var(--bg-higher)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: 3,
};
const widgetCtrlBtn: React.CSSProperties = {
  width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--text-muted)', cursor: 'pointer',
};
const addWidgetBtn: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  background: 'var(--bg-elevated)', border: '1px dashed var(--border-strong)', borderRadius: 14,
  padding: 14, color: 'var(--brand-1)', fontSize: 13, fontWeight: 700, marginBottom: 16, cursor: 'pointer',
};

// Sélecteur "+ Ajouter un widget" — même habillage liquid-glass que le
// tiroir "+" de la nav bar (components/NavBar.tsx), dupliqué ici plutôt
// qu'importé pour ne pas coupler les deux composants pour quelques styles.
const pickerBackdrop: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.4)' };
const pickerLayer: React.CSSProperties = {
  position: 'fixed', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 61, pointerEvents: 'none',
};
const pickerSheet: React.CSSProperties = {
  pointerEvents: 'auto', display: 'flex', flexDirection: 'column', padding: '8px 8px 14px',
  borderRadius: 26, maxWidth: 460, width: 'calc(100% - 24px)', maxHeight: '58vh',
  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
  boxShadow: '0 -1px 0 var(--glass-highlight) inset, 0 12px 40px rgba(0,0,0,0.45)',
};
const pickerHandle: React.CSSProperties = { width: 38, height: 4, borderRadius: 2, background: 'var(--glass-highlight)', margin: '2px auto 8px', flexShrink: 0 };
const pickerTitle: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase', color: 'var(--text-dim)', padding: '0 10px 6px', flexShrink: 0 };
const pickerList: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', overscrollBehavior: 'contain' };
const pickerRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 16, border: 'none', cursor: 'pointer' };
const pickerIconWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 11,
  flexShrink: 0, background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
};
const pickerLabel: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const pickerHint: React.CSSProperties = { fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
