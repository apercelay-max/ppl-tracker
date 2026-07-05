import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkoutSession, ExerciseProgress, SetEntry, HistoryEntry, TimerState, CardioActivityType, CardioEntry } from '../data/types';
import { getWorkout } from '../data/workouts';

const notifSupported = typeof Notification !== 'undefined';
let notifTimeoutId: ReturnType<typeof setTimeout> | null = null;

// Sur beaucoup de navigateurs mobiles (Chrome/Android notamment), appeler
// `new Notification()` sur une page contrôlée par un service worker lève
// une exception (Illegal constructor) — silencieuse dans un setTimeout,
// donc la notif ne partait jamais quand on quittait l'appli. On passe par
// le service worker (showNotification) qui, lui, fonctionne même quand
// l'appli est en arrière-plan, avec repli sur l'ancienne méthode si besoin.
const fireRestNotification = () => {
  try {
    const { beepEnabled, beepTone, beepVolume } = useWorkoutStore.getState();
    if (beepEnabled) playBeep(beepTone, beepVolume);
  } catch (_) {}
  if (Notification.permission !== 'granted') return;
  const title = '\u{1F4AA} Repos terminé !';
  const options: NotificationOptions = {
    body: "C'est reparti → série suivante.",
    silent: false,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ppl-rest-timer',
    renotify: true,
  };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification(title, options))
      .catch(() => { try { new Notification(title, options); } catch (_) {} });
  } else {
    try { new Notification(title, options); } catch (_) {}
  }
};

const scheduleRestNotification = (seconds: number) => {
  if (!notifSupported) return;
  if (notifTimeoutId) clearTimeout(notifTimeoutId);
  notifTimeoutId = setTimeout(fireRestNotification, seconds * 1000);
};

const cancelRestNotification = () => {
  if (notifTimeoutId) { clearTimeout(notifTimeoutId); notifTimeoutId = null; }
};

const vibrate = () => {
  try { if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]); } catch (_) {}
};

// ── Bip de fin de repos (Web Audio, pas besoin de fichier son) ────────────
export type BeepTone = 'doux' | 'classique' | 'urgent' | 'melodique' | 'cloche';
let audioCtx: AudioContext | null = null;

interface BeepNote { freq: number; delay: number; dur: number; }

// Chaque tonalité est une petite suite de notes (fréquence, décalage,
// durée) — ça permet des sons variés (bips répétés, mélodie, cloche qui
// résonne) sans avoir besoin de fichiers audio.
const BEEP_PATTERNS: Record<BeepTone, BeepNote[]> = {
  doux: [{ freq: 440, delay: 0, dur: 0.18 }],
  classique: [{ freq: 880, delay: 0, dur: 0.12 }, { freq: 880, delay: 0.2, dur: 0.12 }],
  urgent: [{ freq: 1046, delay: 0, dur: 0.1 }, { freq: 1046, delay: 0.18, dur: 0.1 }, { freq: 1046, delay: 0.36, dur: 0.1 }],
  melodique: [{ freq: 523, delay: 0, dur: 0.15 }, { freq: 659, delay: 0.16, dur: 0.15 }, { freq: 784, delay: 0.32, dur: 0.3 }],
  cloche: [{ freq: 660, delay: 0, dur: 0.9 }, { freq: 990, delay: 0, dur: 0.9 }],
};

// volume : 0-100, réglable dans les Réglages
const playBeep = (tone: BeepTone, volume: number = 70) => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    const peak = Math.max(0, Math.min(1, volume / 100)) * 0.35;
    const notes = BEEP_PATTERNS[tone] ?? BEEP_PATTERNS.classique;
    for (const note of notes) {
      const start = now + note.delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = note.freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + note.dur + 0.02);
    }
  } catch (_) {}
};

// ── Wake Lock ─────────────────────────────────────────────────────────────
let wakeLockSentinel: WakeLockSentinel | null = null;

const requestWakeLock = async () => {
  try {
    if ('wakeLock' in navigator) {
      wakeLockSentinel = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => { wakeLockSentinel = null; });
    }
  } catch (_) {}
};

const releaseWakeLock = () => {
  if (wakeLockSentinel) { wakeLockSentinel.release(); wakeLockSentinel = null; }
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && wakeLockSentinel === null) requestWakeLock();
  });
}

export interface HomeSectionsVisible {
  cycle: boolean;
  nutrition: boolean;
  supersetRule: boolean;
  muscleAlert: boolean;
  cardio: boolean;
  weeklyGoal: boolean;
  nextSession: boolean;
}

export type HomeSectionKey =
  | 'cycle' | 'seances' | 'nutrition' | 'supersetRule' | 'muscleAlert' | 'cardio' | 'weeklyGoal' | 'nextSession';

const DEFAULT_HOME_ORDER: HomeSectionKey[] = [
  'nextSession', 'cycle', 'weeklyGoal', 'seances', 'muscleAlert', 'cardio', 'nutrition', 'supersetRule',
];

// kcal/h par défaut pour chaque type d'activité cardio (utilisées pour
// estimer les calories brûlées, réglables dans Réglages).
const DEFAULT_CARDIO_KCAL_PER_HOUR: Record<CardioActivityType, number> = {
  velo: 450,
  marche: 250,
  course: 600,
  autre: 350,
};

export const CARDIO_TYPE_LABELS: Record<CardioActivityType, { label: string; emoji: string }> = {
  velo: { label: 'Vélo', emoji: '🚴' },
  marche: { label: 'Marche', emoji: '🚶' },
  course: { label: 'Course à pied', emoji: '🏃' },
  autre: { label: 'Autre', emoji: '⚡' },
};

interface WorkoutStore {
  session: WorkoutSession | null;
  timer: TimerState;
  currentWeek: number;
  history: HistoryEntry[];
  theme: 'dark' | 'light';
  wakeLockEnabled: boolean;
  customRestSeconds: Record<string, number>;
  accentTheme: string;
  customAccentColor: string;
  amoledMode: boolean;
  fontScale: 'sm' | 'md' | 'lg';
  homeSections: HomeSectionsVisible;
  homeSectionOrder: HomeSectionKey[];
  iconShape: 'square' | 'rounded' | 'circle';
  iconSize: 'sm' | 'md' | 'lg';
  defaultRestSeconds: number;
  highContrast: boolean;
  cycleDoneIds: string[];
  beepEnabled: boolean;
  beepTone: BeepTone;
  beepVolume: number;
  caloriesPerHour: number;
  bodyDiagramEnabled: boolean;
  cardioHistory: CardioEntry[];
  cardioKcalPerHour: Record<CardioActivityType, number>;
  weeklySessionGoal: number;
  startSession: (dayId: string) => void;
  completeSet: (exerciseId: string, setIndex: number, entry: SetEntry) => void;
  editSet: (exerciseId: string, setIndex: number) => void;
  skipSet: () => void;
  skipExercise: () => void;
  addSet: (exerciseId: string) => void;
  finishSession: () => void;
  abandonSession: () => void;
  startTimer: (seconds: number) => void;
  skipTimer: () => void;
  reduceTimer: (secondsToRemove: number) => void;
  addTimer: (secondsToAdd: number) => void;
  setCurrentWeek: (week: number) => void;
  setTheme: (t: 'dark' | 'light') => void;
  setWakeLockEnabled: (enabled: boolean) => void;
  advanceSession: () => void;
  saveCustomRest: (exerciseId: string, seconds: number) => void;
  clearCustomRest: (exerciseId: string) => void;
  updateLastSessionRPE: (rpe: number, tonnage: number, trainingLoad: number) => void;
  updateLastSessionNote: (note: string) => void;
  setAccentTheme: (id: string) => void;
  setFontScale: (s: 'sm' | 'md' | 'lg') => void;
  setHomeSectionVisible: (key: keyof HomeSectionsVisible, visible: boolean) => void;
  moveHomeSection: (key: HomeSectionKey, direction: 'up' | 'down') => void;
  setIconShape: (shape: 'square' | 'rounded' | 'circle') => void;
  setIconSize: (size: 'sm' | 'md' | 'lg') => void;
  setDefaultRestSeconds: (seconds: number) => void;
  setHighContrast: (enabled: boolean) => void;
  setBeepEnabled: (enabled: boolean) => void;
  setBeepTone: (tone: BeepTone) => void;
  setBeepVolume: (value: number) => void;
  testBeep: () => void;
  setCaloriesPerHour: (value: number) => void;
  setCustomAccentColor: (hex: string) => void;
  setAmoledMode: (enabled: boolean) => void;
  setBodyDiagramEnabled: (enabled: boolean) => void;
  addCardioEntry: (type: CardioActivityType, durationMin: number, rpe?: number) => void;
  deleteCardioEntry: (id: string) => void;
  setCardioKcalPerHour: (type: CardioActivityType, value: number) => void;
  setWeeklySessionGoal: (value: number) => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      session: null,
      timer: { isRunning: false, endTimestamp: null, totalSeconds: 0 },
      currentWeek: 1,
      history: [],
      theme: 'dark',
      wakeLockEnabled: true,
      customRestSeconds: {},
      accentTheme: 'red',
      customAccentColor: '#e03030',
      amoledMode: false,
      fontScale: 'md',
      homeSections: { cycle: true, nutrition: true, supersetRule: true, muscleAlert: true, cardio: true, weeklyGoal: true, nextSession: true },
      homeSectionOrder: DEFAULT_HOME_ORDER,
      iconShape: 'rounded',
      iconSize: 'md',
      defaultRestSeconds: 180,
      highContrast: false,
      cycleDoneIds: [],
      beepEnabled: true,
      beepTone: 'classique',
      beepVolume: 70,
      caloriesPerHour: 330,
      bodyDiagramEnabled: true,
      cardioHistory: [],
      cardioKcalPerHour: { ...DEFAULT_CARDIO_KCAL_PER_HOUR },
      weeklySessionGoal: 4,

      startSession: (dayId) => {
        const workout = getWorkout(dayId);
        if (!workout) return;
        try {
          if (notifSupported && Notification.permission === 'default') Notification.requestPermission();
        } catch (_) {}
        const exerciseProgress: ExerciseProgress = {};
        for (const ex of workout.exercises) {
          exerciseProgress[ex.id] = Array.from({ length: ex.sets }, () => ({
            weight: ex.defaultWeight ?? '', reps: '', completed: false,
          }));
        }
        set({
          session: {
            dayId, startTime: Date.now(), exerciseProgress,
            currentExerciseIndex: 0, currentSetIndex: 0, isComplete: false,
          },
          // Jour 1 du cycle (Pull A) = redémarrage d'un nouveau cycle glissant
          // → on regrise toutes les séances de l'accueil.
          cycleDoneIds: workout.dayNumber === 1 ? [] : get().cycleDoneIds,
        });
        if (get().wakeLockEnabled) requestWakeLock();
      },

      completeSet: (exerciseId, setIndex, entry) => {
        const { session } = get();
        if (!session) return;
        const updated = { ...session.exerciseProgress };
        updated[exerciseId] = [...updated[exerciseId]];
        updated[exerciseId][setIndex] = { ...entry, completed: true };
        // Reporter le poids sur la série suivante
        const nextIdx = setIndex + 1;
        if (nextIdx < updated[exerciseId].length && !updated[exerciseId][nextIdx].completed) {
          updated[exerciseId][nextIdx] = { ...updated[exerciseId][nextIdx], weight: entry.weight };
        }
        set({ session: { ...session, exerciseProgress: updated } });
      },

      // Remettre une série en mode édition
      editSet: (exerciseId, setIndex) => {
        const { session } = get();
        if (!session) return;
        const workout = getWorkout(session.dayId);
        if (!workout) return;
        const updated = { ...session.exerciseProgress };
        updated[exerciseId] = [...updated[exerciseId]];
        updated[exerciseId][setIndex] = { ...updated[exerciseId][setIndex], completed: false };
        const exIdx = workout.exercises.findIndex(e => e.id === exerciseId);
        set({
          session: {
            ...session,
            exerciseProgress: updated,
            currentExerciseIndex: exIdx >= 0 ? exIdx : session.currentExerciseIndex,
            currentSetIndex: setIndex,
          },
          timer: { isRunning: false, endTimestamp: null, totalSeconds: 0 },
        });
        cancelRestNotification();
      },

      // Passer la série courante (marquée skip)
      skipSet: () => {
        const { session } = get();
        if (!session) return;
        const workout = getWorkout(session.dayId);
        if (!workout) return;
        const currentEx = workout.exercises[session.currentExerciseIndex];
        if (!currentEx) return;
        const updated = { ...session.exerciseProgress };
        updated[currentEx.id] = [...updated[currentEx.id]];
        updated[currentEx.id][session.currentSetIndex] = { weight: '', reps: '—', completed: true };
        set({ session: { ...session, exerciseProgress: updated } });
        get().advanceSession();
      },

      // Passer tout l'exercice courant
      skipExercise: () => {
        const { session } = get();
        if (!session) return;
        const workout = getWorkout(session.dayId);
        if (!workout) return;
        const currentEx = workout.exercises[session.currentExerciseIndex];
        if (!currentEx) return;
        const updated = { ...session.exerciseProgress };
        updated[currentEx.id] = updated[currentEx.id].map(e =>
          e.completed ? e : { weight: '', reps: '—', completed: true }
        );
        const nextIdx = session.currentExerciseIndex + 1;
        if (nextIdx >= workout.exercises.length) {
          set({ session: { ...session, exerciseProgress: updated } });
          get().finishSession();
        } else {
          set({ session: { ...session, exerciseProgress: updated, currentExerciseIndex: nextIdx, currentSetIndex: 0 } });
        }
        get().skipTimer();
      },

      // Ajouter une série à un exercice
      addSet: (exerciseId) => {
        const { session } = get();
        if (!session) return;
        const updated = { ...session.exerciseProgress };
        const lastEntry = updated[exerciseId]?.[updated[exerciseId].length - 1];
        updated[exerciseId] = [
          ...(updated[exerciseId] ?? []),
          { weight: lastEntry?.weight ?? '', reps: '', completed: false },
        ];
        set({ session: { ...session, exerciseProgress: updated } });
      },

      advanceSession: () => {
        const { session } = get();
        if (!session) return;
        const workout = getWorkout(session.dayId);
        if (!workout) return;
        const currentEx = workout.exercises[session.currentExerciseIndex];
        if (!currentEx) return;
        const totalSets = session.exerciseProgress[currentEx.id]?.length ?? currentEx.sets;
        const isLastSet = session.currentSetIndex === totalSets - 1;
        if (isLastSet) {
          const nextIdx = session.currentExerciseIndex + 1;
          if (nextIdx >= workout.exercises.length) { get().finishSession(); }
          else { set({ session: { ...session, currentExerciseIndex: nextIdx, currentSetIndex: 0 } }); }
        } else {
          set({ session: { ...session, currentSetIndex: session.currentSetIndex + 1 } });
        }
      },

      finishSession: () => {
        const { session, history } = get();
        if (!session) return;
        const entry: HistoryEntry = {
          id: `${session.dayId}-${session.startTime}`,
          dayId: session.dayId, date: session.startTime,
          exerciseProgress: session.exerciseProgress,
          durationMs: Date.now() - session.startTime,
        };
        set((state) => ({
          session: { ...session, isComplete: true },
          history: [entry, ...history].slice(0, 50),
          cycleDoneIds: state.cycleDoneIds.includes(session.dayId)
            ? state.cycleDoneIds
            : [...state.cycleDoneIds, session.dayId],
        }));
        cancelRestNotification();
        releaseWakeLock();
      },

      abandonSession: () => {
        set({ session: null, timer: { isRunning: false, endTimestamp: null, totalSeconds: 0 } });
        cancelRestNotification();
        releaseWakeLock();
      },

      startTimer: (seconds) => {
        if (seconds <= 0) return;
        const endTimestamp = Date.now() + seconds * 1000;
        set({ timer: { isRunning: true, endTimestamp, totalSeconds: seconds } });
        scheduleRestNotification(seconds);
        vibrate();
      },

      skipTimer: () => {
        set({ timer: { isRunning: false, endTimestamp: null, totalSeconds: 0 } });
        cancelRestNotification();
      },

      reduceTimer: (secondsToRemove) => {
        const { timer } = get();
        if (!timer.endTimestamp) return;
        const newEnd = Math.max(Date.now() + 1000, timer.endTimestamp - secondsToRemove * 1000);
        set({ timer: { ...timer, endTimestamp: newEnd } });
        scheduleRestNotification(Math.ceil((newEnd - Date.now()) / 1000));
      },

      addTimer: (secondsToAdd) => {
        const { timer } = get();
        if (!timer.endTimestamp) return;
        const newEnd = timer.endTimestamp + secondsToAdd * 1000;
        set({ timer: { ...timer, endTimestamp: newEnd } });
        scheduleRestNotification(Math.ceil((newEnd - Date.now()) / 1000));
      },

      setCurrentWeek: (week) => set({ currentWeek: Math.min(8, Math.max(1, week)) }),
      setTheme: (t) => set({ theme: t }),
      setWakeLockEnabled: (enabled) => {
        set({ wakeLockEnabled: enabled });
        if (enabled) { requestWakeLock(); } else { releaseWakeLock(); }
      },

      // Sauvegarder le temps de repos custom pour un exercice (appelé
      // automatiquement pendant une séance, ou manuellement depuis la
      // liste "Temps de repos par exercice" dans les Réglages).
      saveCustomRest: (exerciseId, seconds) => {
        set((state) => ({
          customRestSeconds: { ...state.customRestSeconds, [exerciseId]: Math.max(30, seconds) },
        }));
      },

      // Retire le temps custom d'un exercice → il revient à sa valeur
      // d'origine définie dans workouts.ts.
      clearCustomRest: (exerciseId) => {
        set((state) => {
          const updated = { ...state.customRestSeconds };
          delete updated[exerciseId];
          return { customRestSeconds: updated };
        });
      },

      // Mettre à jour le RPE + charge d'entraînement de la dernière séance
      updateLastSessionRPE: (rpe, tonnage, trainingLoad) => {
        set((state) => {
          if (state.history.length === 0) return state;
          const updated = [...state.history];
          updated[0] = { ...updated[0], rpe, tonnage, trainingLoad };
          return { history: updated };
        });
      },

      // Note libre (ressenti) sur la dernière séance terminée
      updateLastSessionNote: (note) => {
        set((state) => {
          if (state.history.length === 0) return state;
          const updated = [...state.history];
          updated[0] = { ...updated[0], note };
          return { history: updated };
        });
      },

      setAccentTheme: (id) => set({ accentTheme: id }),
      setFontScale: (s) => set({ fontScale: s }),
      setHomeSectionVisible: (key, visible) =>
        set((state) => ({ homeSections: { ...state.homeSections, [key]: visible } })),

      moveHomeSection: (key, direction) => {
        set((state) => {
          const order = [...state.homeSectionOrder];
          const idx = order.indexOf(key);
          if (idx === -1) return state;
          const swapWith = direction === 'up' ? idx - 1 : idx + 1;
          if (swapWith < 0 || swapWith >= order.length) return state;
          [order[idx], order[swapWith]] = [order[swapWith], order[idx]];
          return { homeSectionOrder: order };
        });
      },

      setIconShape: (shape) => set({ iconShape: shape }),
      setIconSize: (size) => set({ iconSize: size }),
      setDefaultRestSeconds: (seconds) => set({ defaultRestSeconds: seconds }),
      setHighContrast: (enabled) => set({ highContrast: enabled }),

      setBeepEnabled: (enabled) => set({ beepEnabled: enabled }),
      setBeepTone: (tone) => { set({ beepTone: tone }); playBeep(tone, get().beepVolume); },
      setBeepVolume: (value) => {
        const v = Math.max(0, Math.min(100, value));
        set({ beepVolume: v });
      },
      testBeep: () => playBeep(get().beepTone, get().beepVolume),
      setCaloriesPerHour: (value) => set({ caloriesPerHour: Math.max(50, Math.min(1200, value)) }),
      setCustomAccentColor: (hex) => set({ customAccentColor: hex, accentTheme: 'custom' }),
      setAmoledMode: (enabled) => set({ amoledMode: enabled }),
      setBodyDiagramEnabled: (enabled) => set({ bodyDiagramEnabled: enabled }),

      addCardioEntry: (type, durationMin, rpe) => {
        const kcalPerHour = get().cardioKcalPerHour[type] ?? DEFAULT_CARDIO_KCAL_PER_HOUR[type];
        const entry: CardioEntry = {
          id: `cardio-${Date.now()}`,
          type,
          date: Date.now(),
          durationMin,
          calories: Math.round((kcalPerHour / 60) * durationMin),
          rpe,
        };
        set((state) => ({ cardioHistory: [entry, ...state.cardioHistory].slice(0, 50) }));
      },
      deleteCardioEntry: (id) => {
        set((state) => ({ cardioHistory: state.cardioHistory.filter((e) => e.id !== id) }));
      },
      setCardioKcalPerHour: (type, value) => {
        set((state) => ({
          cardioKcalPerHour: { ...state.cardioKcalPerHour, [type]: Math.max(50, Math.min(1500, value)) },
        }));
      },
      setWeeklySessionGoal: (value) => set({ weeklySessionGoal: Math.max(1, Math.min(7, value)) }),
    }),
    {
      name: 'ppl-tracker-store',
      partialize: (state) => ({
        session: state.session,
        currentWeek: state.currentWeek,
        history: state.history,
        theme: state.theme,
        wakeLockEnabled: state.wakeLockEnabled,
        customRestSeconds: state.customRestSeconds,
        accentTheme: state.accentTheme,
        fontScale: state.fontScale,
        homeSections: state.homeSections,
        homeSectionOrder: state.homeSectionOrder,
        iconShape: state.iconShape,
        iconSize: state.iconSize,
        defaultRestSeconds: state.defaultRestSeconds,
        highContrast: state.highContrast,
        cycleDoneIds: state.cycleDoneIds,
        beepEnabled: state.beepEnabled,
        beepTone: state.beepTone,
        beepVolume: state.beepVolume,
        caloriesPerHour: state.caloriesPerHour,
        customAccentColor: state.customAccentColor,
        amoledMode: state.amoledMode,
        bodyDiagramEnabled: state.bodyDiagramEnabled,
        cardioHistory: state.cardioHistory,
        cardioKcalPerHour: state.cardioKcalPerHour,
        weeklySessionGoal: state.weeklySessionGoal,
      }),
      // Merge personnalisé : par défaut, zustand/persist remplace entièrement
      // les objets imbriqués (homeSections, homeSectionOrder) par la version
      // sauvegardée. Si on ajoute une nouvelle section plus tard (ex:
      // muscleAlert), les téléphones qui ont déjà des données perdraient
      // silencieusement cette section. On merge donc à la main pour que les
      // nouvelles clés apparaissent avec leur valeur par défaut.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<WorkoutStore>;
        const merged = { ...current, ...p };
        merged.homeSections = { ...current.homeSections, ...(p.homeSections ?? {}) };
        const savedOrder = p.homeSectionOrder ?? current.homeSectionOrder;
        const missingKeys = current.homeSectionOrder.filter((k) => !savedOrder.includes(k));
        merged.homeSectionOrder = [...savedOrder, ...missingKeys];
        return merged;
      },
    }
  )
);
