import React, { useRef, useState } from 'react';
import { PROGRESSION_WEEKS, getWorkout } from '../data/workouts';
import { getProgram } from '../data/programs';
import { useWorkoutStore, CARDIO_TYPE_LABELS } from '../store/workoutStore';
import type { HomeSectionKey } from '../store/workoutStore';
import { ICON_SIZE_PRESETS } from '../data/iconPrefs';
import { getMuscleGroupsStatus } from '../utils/training';
import type { CardioActivityType } from '../data/types';

const CARDIO_TYPES: CardioActivityType[] = ['velo', 'marche', 'course', 'autre'];

const formatCardioDate = (ts: number): string => {
  const diffDays = Math.floor((Date.now() - ts) / 86400000);
  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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

  const weekIdx = currentWeek <= 2 ? 0 : currentWeek <= 4 ? 1 : currentWeek <= 6 ? 2 : currentWeek === 7 ? 3 : 4;
  const weekData = PROGRESSION_WEEKS[weekIdx];
  const resumeWorkout = session && !session.isComplete
    ? getWorkout(session.dayId)
    : null;
  const cycleProgress = ((currentWeek - 1) / 7) * 100;

  const wakeLockSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

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
  // Le suivi "semaine / RIR / objectif" (progression 8 semaines) est propre
  // à Strict V10 — les autres programmes n'ont pas cette notion, donc le
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
          <button className="week-btn" style={weekBtn} onClick={() => setCurrentWeek(currentWeek + 1)} disabled={currentWeek >= 8}>›</button>
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
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} style={{
            flex: 1, height: i + 1 === currentWeek ? 6 : 4, borderRadius: 3,
            background: i + 1 < currentWeek ? cycleColor : i + 1 === currentWeek ? '#ffffff' : 'var(--border-strong)',
            transition: 'background 0.3s, height 0.3s',
            boxShadow: i + 1 < currentWeek ? `0 0 6px rgba(var(--brand-1-rgb),0.4)` : 'none',
          }} />
        ))}
      </div>
      <p style={{ color: 'var(--text-micro)', fontSize: 10 }}>Semaine {currentWeek} / 8 · {Math.round(cycleProgress)}% du cycle</p>
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
      <p style={{ color: 'var(--text-gold-label)', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>🥩 Nutrition post-training</p>
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
          🎯 Groupes musculaires
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
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}>🏃 Cardio</p>
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
              {formatCardioDate(entry.date)} · {entry.durationMin} min · {entry.calories} kcal{entry.rpe ? ` · RPE ${entry.rpe}` : ''}
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
        <span style={{ fontSize: 20 }}>🎯</span>
      </div>
      <div style={{ textAlign: 'left', flex: 1 }}>
        <p style={{ color: nextColor, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>PROCHAINE SÉANCE</p>
        <p style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 800 }}>{nextWorkout.name}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{nextWorkout.muscleGroups}</p>
      </div>
      <span style={{ color: nextColor, fontSize: 22, fontWeight: 200, flexShrink: 0, opacity: 0.8 }}>›</span>
    </button>
  );

  const SECTION_MAP: Record<string, React.ReactNode> = {
    cycle: cycleSection,
    seances: seancesSection,
    nutrition: nutritionSection,
    supersetRule: supersetSection,
    muscleAlert: muscleAlertSection,
    cardio: cardioSection,
    weeklyGoal: weeklyGoalSection,
    nextSession: nextSessionSection,
  };

  return (
    <div style={container}>
      <div style={{ ...scroll, paddingBottom: navBarEnabled ? 112 : 80 }}>

        {/* Header */}
        <div style={headerSection}>
          <div style={logoRow}>
            <div style={{ ...logoBadge, width: iconSizes.logo, height: iconSizes.logo }}><span style={{ fontSize: iconSizes.logo * 0.46, lineHeight: 1 }}>⚡</span></div>
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
              <button
                onClick={onOpenSettings}
                style={{ ...themeToggle, width: iconSizes.header, height: iconSizes.header }}
                title="Réglages"
              >
                ⚙️
              </button>
              <button
                onClick={onOpenDashboard}
                style={{ ...themeToggle, width: iconSizes.header, height: iconSizes.header }}
                title="Dashboard"
              >
                📊
              </button>
              {wakeLockSupported && (
                <button
                  onClick={() => setWakeLockEnabled(!wakeLockEnabled)}
                  style={{ ...themeToggle, width: iconSizes.header, height: iconSizes.header, background: wakeLockEnabled ? 'rgba(76,175,80,0.12)' : 'var(--bg-elevated)', borderColor: wakeLockEnabled ? 'rgba(76,175,80,0.3)' : 'var(--border)' }}
                  title={wakeLockEnabled ? 'Écran toujours allumé (actif)' : 'Écran toujours allumé (inactif)'}
                >
                  {wakeLockEnabled ? '🔆' : '🔅'}
                </button>
              )}
              <button
                onClick={() => setThemeMode(theme === 'dark' ? 'light' : 'dark')}
                style={{ ...themeToggle, width: iconSizes.header, height: iconSizes.header }}
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>

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

        {/* Blocs réordonnables selon les réglages */}
        {homeSectionOrder.map((key) => SECTION_MAP[key])}

      </div>
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
