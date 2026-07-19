import React, { useState, useEffect, useRef } from 'react';
import { getWorkout } from '../data/workouts';
import { Exercise, SetEntry } from '../data/types';
import { getMuscleRecoveryStatus } from '../utils/training';
import { useWorkoutStore } from '../store/workoutStore';
import { ExerciseCard } from '../components/ExerciseCard';

interface WorkoutIntroScreenProps {
  dayId: string;
  onBack: () => void;
  onStart: () => void;
}

const DAY_ACCENT: Record<string, string> = {
  'pull-a': '#7c6fcd', 'push-a': '#e03030', 'legs-a': '#e8a020',
  'pull-b': '#6a5fc0', 'push-b': '#cc2828', 'legs-b': '#d09018',
};
const DAY_TYPE_LABEL: Record<string, string> = {
  'pull-a': 'PULL', 'push-a': 'PUSH', 'legs-a': 'LEGS',
  'pull-b': 'PULL', 'push-b': 'PUSH', 'legs-b': 'LEGS',
};

const CLOSE_DRAG_THRESHOLD = 90; // px glissés vers le bas pour fermer la fiche
const SHEET_TRANSITION = 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)';

const emptySetEntries = (count: number): SetEntry[] =>
  Array.from({ length: count }, () => ({ weight: '', reps: '', completed: false }));

// Écran d'aperçu affiché avant de démarrer une séance (style "Forme" /
// Apple Fitness+) : on voit le programme du jour et on ne rentre dans le
// minuteur/les séries qu'après avoir appuyé sur Démarrer. Un tap sur un
// exercice ouvre une fiche détaillée (bottom sheet, glisse depuis le bas) —
// elle réutilise le vrai <ExerciseCard/> (celui affiché pendant la séance)
// en mode "aperçu" : les séries cochées ici restent locales à la fiche et
// ne touchent jamais l'historique/le store réel. On ferme en tapant le
// fond, la croix, ou en glissant la petite barre du haut vers le bas.
export const WorkoutIntroScreen: React.FC<WorkoutIntroScreenProps> = ({ dayId, onBack, onStart }) => {
  const history = useWorkoutStore((s) => s.history);
  const currentWeek = useWorkoutStore((s) => s.currentWeek);
  const workout = getWorkout(dayId);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);
  const [previewEntries, setPreviewEntries] = useState<SetEntry[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(0);
  const dragYRef = useRef(0);

  // Anime l'ouverture : on monte le sheet hors écran (translateY 100%) puis,
  // une fois monté dans le DOM, on bascule sur place au frame suivant pour
  // que la transition CSS ait quelque chose à animer. On réinitialise aussi
  // l'aperçu des séries (indépendant de la vraie séance).
  useEffect(() => {
    if (detailExercise) {
      setDragY(0);
      dragYRef.current = 0;
      setPreviewEntries(emptySetEntries(detailExercise.sets));
      setPreviewIndex(0);
      const id = requestAnimationFrame(() => setSheetVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setSheetVisible(false);
  }, [detailExercise]);

  const closeSheet = () => {
    setSheetVisible(false);
    setTimeout(() => setDetailExercise(null), 240);
  };

  // Écoute le déplacement du doigt/souris au niveau de la fenêtre (pas
  // seulement sur la poignée) le temps du glissement — plus fiable que la
  // capture de pointeur seule sur certains navigateurs mobiles (Safari iOS
  // en PWA notamment).
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientY: number) => {
      const y = Math.max(0, clientY - dragStartY.current);
      dragYRef.current = y;
      setDragY(y);
    };
    const onPointerMove = (e: PointerEvent) => handleMove(e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientY);
    };
    const onEnd = () => {
      setIsDragging(false);
      if (dragYRef.current > CLOSE_DRAG_THRESHOLD) {
        closeSheet();
      } else {
        setDragY(0);
        dragYRef.current = 0;
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  const startDrag = (clientY: number) => {
    dragStartY.current = clientY;
    dragYRef.current = 0;
    setIsDragging(true);
  };
  const onHandlePointerDown = (e: React.PointerEvent) => startDrag(e.clientY);
  const onHandleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) startDrag(e.touches[0].clientY);
  };

  // ── Handlers de l'aperçu de séries (locaux à la fiche, n'écrivent rien
  // dans le store ni l'historique — juste pour voir la vraie mise en page) ──
  const handleSetComplete = (idx: number, entry: SetEntry) => {
    setPreviewEntries((arr) => arr.map((e, i) => (i === idx ? entry : e)));
    setPreviewIndex(idx + 1);
  };
  const handleSkipSet = () => {
    setPreviewEntries((arr) => arr.map((e, i) => (i === previewIndex ? { weight: '', reps: '—', completed: true } : e)));
    setPreviewIndex((i) => i + 1);
  };
  const handleAddSet = () => {
    setPreviewEntries((arr) => [...arr, { weight: '', reps: '', completed: false }]);
  };

  if (!workout) return null;

  const accent = DAY_ACCENT[dayId] ?? '#7a7a90';
  const typeLabel = DAY_TYPE_LABEL[dayId] ?? '';
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);

  // Groupes musculaires du programme du jour encore en récupération (voir
  // Objectifs → Récupération) — alerte non bloquante, juste informative.
  const dayMuscleGroups = new Set(workout.exercises.map((ex) => ex.muscleGroup));
  const unrecoveredGroups = getMuscleRecoveryStatus(history).filter(
    (s) => dayMuscleGroups.has(s.group) && s.hoursSince !== null && !s.recovered
  );

  return (
    <div style={container}>
      <div style={scroll}>
        <div style={headerRow}>
          <button onClick={onBack} style={backBtn}>←</button>
          <span style={{ ...typeBadge, background: `${accent}20`, color: accent }}>{typeLabel} · J{workout.dayNumber}</span>
        </div>

        <div style={{ ...heroCard, borderColor: `${accent}40` }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>{workout.name}</h1>
          <p style={{ color: accent, fontSize: 13, fontWeight: 700, marginTop: 4 }}>{workout.focus}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 10 }}>{workout.muscleGroups}</p>
          <div style={statsRow}>
            <div style={statItem}>
              <span style={statValue}>{workout.exercises.length}</span>
              <span style={statLabel}>EXERCICES</span>
            </div>
            <div style={{ ...statItem, borderLeft: '1px solid var(--border-mid)', borderRight: '1px solid var(--border-mid)' }}>
              <span style={statValue}>{totalSets}</span>
              <span style={statLabel}>SÉRIES</span>
            </div>
            <div style={statItem}>
              <span style={statValue}>{workout.estimatedDuration.replace('≈ ', '')}</span>
              <span style={statLabel}>DURÉE</span>
            </div>
          </div>
        </div>

        {unrecoveredGroups.length > 0 && (
          <div style={recoveryWarning}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ color: '#f5a623', fontSize: 13, fontWeight: 700 }}>
                Pas totalement récupéré
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3, lineHeight: '16px' }}>
                {unrecoveredGroups.map((s, i) => (
                  <span key={s.group}>
                    {i > 0 && ', '}
                    {s.group} (encore {s.hoursRemaining >= 24 ? `${Math.round(s.hoursRemaining / 24 * 10) / 10} j` : `${s.hoursRemaining} h`})
                  </span>
                ))}
              </p>
            </div>
          </div>
        )}

        <p style={{ ...sectionLabel }}>AU PROGRAMME</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 100 }}>
          {workout.exercises.map((ex, i) => (
            <button key={ex.id} style={exerciseRow} onClick={() => setDetailExercise(ex)}>
              <span style={{ ...exerciseIndex, color: accent }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700 }}>{ex.name}</p>
                <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>{ex.muscleGroup}</p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {ex.sets} × {ex.targetReps}
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: 14, flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      </div>

      {detailExercise && (
        <div
          style={{ ...sheetBackdrop, opacity: sheetVisible ? 1 : 0, transition: 'opacity 240ms ease' }}
          onClick={closeSheet}
        >
          <div
            style={{
              ...sheetCard,
              transform: sheetVisible ? `translateY(${dragY}px)` : 'translateY(100%)',
              transition: isDragging ? 'none' : SHEET_TRANSITION,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={sheetHandleZone}
              onPointerDown={onHandlePointerDown}
              onTouchStart={onHandleTouchStart}
            >
              <div style={sheetHandle} />
              <button onClick={closeSheet} style={closeBtn}>✕</button>
            </div>

            <ExerciseCard
              exercise={detailExercise}
              setEntries={previewEntries}
              currentSetIndex={previewIndex}
              isActive
              currentWeek={currentWeek}
              onSetComplete={handleSetComplete}
              onSkipSet={handleSkipSet}
              onSkipExercise={closeSheet}
              onAddSet={handleAddSet}
            />
          </div>
        </div>
      )}

      <div style={startBar}>
        <button onClick={onStart} style={{ ...startBtn, background: `linear-gradient(135deg, ${accent}, var(--brand-2))` }}>
          Démarrer
        </button>
      </div>
    </div>
  );
};

const container: React.CSSProperties = { height: '100dvh', overflowY: 'auto', background: 'var(--bg-base)', position: 'relative' };
const scroll: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '0 16px' };
const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 16,
};
const backBtn: React.CSSProperties = {
  width: 36, height: 36, background: 'var(--bg-elevated)', borderRadius: 'var(--icon-radius)',
  color: 'var(--text-muted)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, border: '1px solid var(--border-strong)',
};
const typeBadge: React.CSSProperties = {
  fontSize: 11, fontWeight: 800, letterSpacing: 1, padding: '6px 12px', borderRadius: 20,
};
const heroCard: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 20, padding: 20, marginBottom: 24,
  border: '1px solid var(--border-mid)',
};
const statsRow: React.CSSProperties = {
  display: 'flex', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-subtle)',
};
const statItem: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '0 4px',
};
const statValue: React.CSSProperties = { color: 'var(--text-primary)', fontSize: 17, fontWeight: 800 };
const statLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 8, fontWeight: 700, letterSpacing: 1 };
const sectionLabel: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 10 };
const recoveryWarning: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10,
  background: 'rgba(245, 166, 35, 0.1)', border: '1px solid rgba(245, 166, 35, 0.3)',
  borderRadius: 14, padding: '12px 14px', marginBottom: 20,
};
const exerciseRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 14, padding: '10px 14px', width: '100%', cursor: 'pointer',
};
const exerciseIndex: React.CSSProperties = { fontSize: 13, fontWeight: 800, width: 16, flexShrink: 0 };
const startBar: React.CSSProperties = {
  position: 'fixed', bottom: 0, left: 0, right: 0,
  padding: '14px 16px max(14px, env(safe-area-inset-bottom))',
  background: 'linear-gradient(to top, var(--bg-base) 60%, transparent)',
};
const startBtn: React.CSSProperties = {
  width: '100%', maxWidth: 480, margin: '0 auto', display: 'block',
  padding: '16px', borderRadius: 18, color: '#fff', fontSize: 16, fontWeight: 800,
  cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
};
const sheetBackdrop: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50,
};
const sheetCard: React.CSSProperties = {
  width: '100%', maxWidth: 480, background: 'var(--bg-card)',
  borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '0 20px max(20px, env(safe-area-inset-bottom))',
  border: '1px solid var(--border-mid)', borderBottom: 'none',
  maxHeight: '85vh', overflowY: 'auto', willChange: 'transform',
};
const sheetHandleZone: React.CSSProperties = {
  padding: '14px 0 12px', margin: '0 -20px 4px', touchAction: 'none', cursor: 'grab',
  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 44,
};
const sheetHandle: React.CSSProperties = {
  width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)',
};
const closeBtn: React.CSSProperties = {
  position: 'absolute', right: 20, top: 6,
  width: 30, height: 30, borderRadius: 15, background: 'var(--bg-elevated)',
  color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', flexShrink: 0,
  border: '1px solid var(--border-strong)',
};
