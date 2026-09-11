import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkoutSession, ExerciseProgress, SetEntry, HistoryEntry, TimerState, CardioActivityType, CardioEntry, CardioStats, BodyWeightEntry, NavTabKey } from '../data/types';
import { getWorkout, getBaseWorkout, setCustomWorkouts, setSessionWorkoutOverride, MESOCYCLE_WEEKS } from '../data/workouts';
import { applyAdaptation, type Gym, type GymProfile, type SessionAdaptation } from '../utils/gymAdapt';
import { Program } from '../data/programs';
import { bucketByWeek, computeTonnage } from '../utils/training';
import { getNextStep } from '../utils/supersets';
import type { TrainingProfile } from '../utils/onboardingQuiz';

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

// Petit retour haptique (vibration courte) pour les actions fréquentes —
// volontairement plus discret que `vibrate()` (utilisé pour le repos) pour
// ne pas fatiguer à chaque série validée.
const tapVibrate = () => {
try { if ('vibrate' in navigator) navigator.vibrate(15); } catch (_) {}
};

// Vibration un peu plus marquée pour un événement "important" (fin de
// séance) — distincte du tap léger et du motif du PR (voir SessionScreen).
const successVibrate = () => {
try { if ('vibrate' in navigator) navigator.vibrate([40, 30, 40]); } catch (_) {}
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
coach: boolean;
cycle: boolean;
nutrition: boolean;
supersetRule: boolean;
muscleAlert: boolean;
cardio: boolean;
weeklyGoal: boolean;
nextSession: boolean;
lastSession: boolean;
weeklyStats: boolean;
bodyWeight: boolean;
personalRecord: boolean;
exerciseProgress: boolean;
plateau: boolean;
}

export type HomeSectionKey =
| 'coach' | 'cycle' | 'seances' | 'nutrition' | 'supersetRule' | 'muscleAlert' | 'cardio' | 'weeklyGoal' | 'nextSession'
| 'lastSession' | 'weeklyStats' | 'bodyWeight' | 'personalRecord' | 'exerciseProgress' | 'plateau';

const DEFAULT_HOME_ORDER: HomeSectionKey[] = [
'coach', 'nextSession', 'lastSession', 'weeklyStats', 'cycle', 'weeklyGoal', 'seances', 'muscleAlert', 'cardio', 'nutrition', 'supersetRule',
'bodyWeight', 'personalRecord', 'exerciseProgress', 'plateau',
];

// La « partie simple » de l'accueil : les blocs qui restent affichés en
// permanence. Les autres ne sont NI retirés NI déplacés dans les réglages —
// ils attendent derrière le bouton « Tout voir » en bas de l'écran, à un tap.
// Léo compose lui-même cette liste depuis le mode édition de l'accueil
// (l'étoile sur chaque widget), d'où un réglage persisté plutôt qu'une
// constante figée.
//
// Trois blocs seulement, choisis par Léo : ce qu'il vient faire (la prochaine
// séance), ce que le coach a repéré, et où il en est de sa semaine. Le cycle
// et la liste des séances passent derrière « Tout voir » — c'est ce qui
// occupait le plus de hauteur pour de l'information qu'on ne relit pas à
// chaque ouverture. Le coach ne coûte rien les premiers jours : il s'efface
// déjà tout seul tant qu'aucune séance n'est terminée.
const DEFAULT_HOME_ESSENTIALS: Record<HomeSectionKey, boolean> = {
coach: true, nextSession: true, weeklyGoal: true,
cycle: false, seances: false, lastSession: false, weeklyStats: false,
nutrition: false, supersetRule: false, muscleAlert: false, cardio: false,
bodyWeight: false, personalRecord: false, exerciseProgress: false, plateau: false,
};

// kcal/h par défaut pour chaque type d'activité cardio (utilisées pour
// estimer les calories brûlées, réglables dans Réglages).
const DEFAULT_CARDIO_KCAL_PER_HOUR: Record<CardioActivityType, number> = {
velo: 450,
marche: 250,
course: 600,
autre: 350,
};

// `icon` est une clé traduite en SVG par components/DataIcon.tsx (ce fichier
// ne peut pas contenir de JSX).
export const CARDIO_TYPE_LABELS: Record<CardioActivityType, { label: string; icon: string }> = {
velo: { label: 'Vélo', icon: 'bike' },
marche: { label: 'Marche', icon: 'walk' },
course: { label: 'Course à pied', icon: 'run' },
autre: { label: 'Autre', icon: 'other' },
};

// Tous les onglets possibles de la barre de navigation, activables/désactivables
// individuellement dans les Réglages — "settings" reste toujours affiché (voir
// NavBar.tsx) pour ne jamais bloquer l'accès aux réglages.
export const NAV_TAB_ORDER: NavTabKey[] = [
'home', 'objectifs', 'historique', 'cardio', 'exercices', 'catalogue', 'poids', 'dashboard', 'profil', 'settings',
];

const DEFAULT_NAV_TABS_ENABLED: Record<NavTabKey, boolean> = {
home: true, objectifs: true, historique: true, cardio: true,
exercices: true, catalogue: true, poids: true, dashboard: true, coach: true, profil: true, settings: true,
};

// Parmi les onglets activés, ceux qui restent épinglés directement dans la
// barre plutôt que derrière le bouton + (voir Réglages → Apparence → Barre
// de menus). Tout épinglé par défaut : rien ne change tant que Léo ne
// personnalise pas la répartition lui-même.
const DEFAULT_NAV_TABS_PINNED: Record<NavTabKey, boolean> = {
home: true, objectifs: true, historique: true, cardio: true,
exercices: true, catalogue: true, poids: true, dashboard: true, profil: true, settings: true,
// Pas épinglé d'origine : le Coach arrive dans le menu « Plus » pour ne pas
// pousser un onglet hors de la barre. À épingler dans Réglages si voulu.
coach: false,
};

// Matériel de la salle — sert au calcul des disques (« 2×10 + 2,5 par côté »)
// et au mode « salle inconnue ». Valeurs par défaut = salle française
// classique : barre olympique 20 kg, barre EZ 10 kg, disques de 1,25 à 25.
const DEFAULT_GYM_PROFILE: GymProfile = {
  barKg: 20,
  ezBarKg: 10,
  plates: [25, 20, 15, 10, 5, 2.5, 1.25],
  otherIncrementKg: 2.5,
  availableEquipment: ['Barre', 'Barre EZ', 'Haltères', 'Machine', 'Poulie', 'Poids du corps'],
  machines: [],
  machinesListComplete: false,
};

/**
 * Salle créée d'office : tant que Léo n'en a qu'une, rien ne lui est demandé
 * au démarrage d'une séance. Identifiant fixe pour la toute première, pour
 * qu'une sauvegarde d'avant les salles multiples y retombe naturellement.
 */
const INITIAL_GYM: Gym = { ...DEFAULT_GYM_PROFILE, id: 'gym-principale', name: 'Ma salle' };

const makeDefaultGym = (name = 'Ma salle'): Gym => ({
  ...DEFAULT_GYM_PROFILE,
  id: `gym-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name,
});

/**
 * Nombre de séances gardées dans l'historique local.
 * C'était 50 — soit environ trois mois à quatre séances par semaine, après
 * quoi les plus anciennes disparaissaient définitivement, sans prévenir.
 * 500 couvre plus de deux ans ; à ~2 ko l'entrée, ça reste sous le mégaoctet,
 * loin de la limite du stockage local.
 */
const HISTORY_LIMIT = 500;

interface WorkoutStore {
session: WorkoutSession | null;
timer: TimerState;
currentWeek: number;
history: HistoryEntry[];
theme: 'dark' | 'light';
// Préférence d'apparence choisie par Léo (Réglages → Apparence) : 'system'
// suit le thème du téléphone (clair/sombre) et se met à jour tout seul si
// l'appareil change d'heure/luminosité ; 'light'/'dark' est un choix figé
// qui prend le dessus. `theme` ci-dessus reste la valeur RÉSOLUE utilisée
// partout ailleurs dans l'appli (data-theme, AMOLED...) — c'est
// `setThemeMode` qui la garde synchronisée.
themeMode: 'system' | 'light' | 'dark';
wakeLockEnabled: boolean;
customRestSeconds: Record<string, number>;
accentTheme: string;
customAccentColor: string;
amoledMode: boolean;
fontScale: 'sm' | 'md' | 'lg';
homeSections: HomeSectionsVisible;
homeSectionOrder: HomeSectionKey[];
homeEssentials: Record<HomeSectionKey, boolean>;
iconShape: 'square' | 'rounded' | 'circle';
iconSize: 'sm' | 'md' | 'lg';
defaultRestSeconds: number;
weightUnit: 'kg' | 'lbs';
  weightUnitToggleStyle: 'toast' | 'menu';
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
homeSectionColors: Partial<Record<HomeSectionKey, string>>;
navBarEnabled: boolean;
navBarTabsEnabled: Record<NavTabKey, boolean>;
navBarPinned: Record<NavTabKey, boolean>;
// Salles enregistrées (Réglages → Mes salles). Il y en a toujours au moins
// une ; la question « tu es dans quelle salle ? » n'apparaît au démarrage
// d'une séance qu'à partir de deux.
gyms: Gym[];
activeGymId: string;
// Affichage de l'aide au chargement des disques : c'est une préférence
// d'affichage, elle vaut pour toutes les salles.
plateHelperEnabled: boolean;
// Ancien réglage unique, conservé le temps de la migration des sauvegardes.
gymProfile: GymProfile;
// Valider une série en secouant le téléphone (mains prises/pleines de magnésie).
shakeToValidateEnabled: boolean;
// Adaptation appliquée à la séance en cours (temps dispo, forme du jour,
// matériel dispo) — null quand la séance est celle du programme.
sessionAdaptation: SessionAdaptation | null;
// Horodatage du début de la pause en cours, null si la séance tourne.
sessionPausedAt: number | null;
bodyWeightHistory: BodyWeightEntry[];
activeProgramId: string;
customPrograms: Program[];
badgesEnabled: boolean;
totalSessionsCompleted: number;
totalCardioSessions: number;
bestWeekStreak: number;
hapticsEnabled: boolean;
ultraAnimationsEnabled: boolean;
// Style visuel des effets "Ultra animations" (confettis par défaut, ou
// feu d'artifice / étincelles — voir Réglages → Personnalisation).
ultraAnimationStyle: 'confetti' | 'fireworks' | 'sparkles';
// Style de transition entre écrans en mode "Ultra animations" (rebond par
// défaut = comportement historique, ou glissement / zoom / rotation).
ultraTransitionStyle: 'bounce' | 'slide' | 'zoom' | 'flip';
// Choix fait au tout premier lancement (voir OnboardingModal.tsx / App.tsx) :
// "aime personnaliser" ou "préfère la simplicité". `hasCompletedOnboarding`
// distingue une toute nouvelle installation (false → montre l'écran de
// choix) d'une installation déjà existante avant l'ajout de cet écran (voir
// merge() plus bas : grandfathered à true/false=simplicityMode pour ne rien
// changer au comportement déjà en place chez Léo).
hasCompletedOnboarding: boolean;
// true = "simplicité" choisi — masque les réglages de personnalisation
// cosmétique (couleurs, icônes, animations, barre de menus, accueil) dans
// SettingsScreen, en ne gardant que l'essentiel. Modifiable à tout moment
// depuis Réglages → Apparence → "Réglages avancés", pas figé après le choix
// initial.
simplicityMode: boolean;
// Réponses du quiz de démarrage (objectif, niveau, matériel, blessures...) —
// null tant que le quiz n'a jamais été rempli. Sert à pré-remplir le quiz
// quand on le refait et à expliquer d'où vient le programme généré (voir
// components/OnboardingQuiz.tsx et utils/onboardingQuiz.ts).
trainingProfile: TrainingProfile | null;
startSession: (dayId: string, adaptation?: SessionAdaptation | null, gymId?: string) => void;
completeSet: (exerciseId: string, setIndex: number, entry: SetEntry) => void;
editSet: (exerciseId: string, setIndex: number) => void;
restoreSessionPosition: (exerciseIndex: number, setIndex: number) => void;
skipSet: () => void;
skipExercise: () => void;
shortenSession: () => void;
switchToExercise: (exerciseId: string) => void;
setExerciseNameOverride: (exerciseId: string, name: string | null) => void;
toggleSupersetRest: (groupId: string, disabled: boolean) => void;
addSet: (exerciseId: string) => void;
finishSession: () => void;
abandonSession: () => void;
// Pause de la SÉANCE (à ne pas confondre avec pauseTimer, qui ne gèle que le
// minuteur de repos). Quand on reprend, on décale session.startTime de la
// durée de la pause : le chrono repart d'où il s'était arrêté sans qu'aucun
// autre calcul n'ait à connaître l'existence de la pause.
pauseSession: () => void;
resumeSession: () => void;
startTimer: (seconds: number) => void;
skipTimer: () => void;
reduceTimer: (secondsToRemove: number) => void;
addTimer: (secondsToAdd: number) => void;
pauseTimer: () => void;
resumeTimer: () => void;
setCurrentWeek: (week: number) => void;
setTheme: (t: 'dark' | 'light') => void;
setThemeMode: (m: 'system' | 'light' | 'dark') => void;
setWakeLockEnabled: (enabled: boolean) => void;
advanceSession: () => void;
saveCustomRest: (exerciseId: string, seconds: number) => void;
clearCustomRest: (exerciseId: string) => void;
updateLastSessionRPE: (rpe: number, tonnage: number, trainingLoad: number) => void;
updateLastSessionNote: (note: string) => void;
setAccentTheme: (id: string) => void;
setFontScale: (s: 'sm' | 'md' | 'lg') => void;
setHomeSectionVisible: (key: keyof HomeSectionsVisible, visible: boolean) => void;
setHomeEssential: (key: HomeSectionKey, essential: boolean) => void;
moveHomeSection: (key: HomeSectionKey, direction: 'up' | 'down') => void;
setHomeSectionOrder: (order: HomeSectionKey[]) => void;
setIconShape: (shape: 'square' | 'rounded' | 'circle') => void;
setIconSize: (size: 'sm' | 'md' | 'lg') => void;
setDefaultRestSeconds: (seconds: number) => void;
setWeightUnit: (unit: 'kg' | 'lbs') => void;
  setWeightUnitToggleStyle: (style: 'toast' | 'menu') => void;
setHighContrast: (enabled: boolean) => void;
setBeepEnabled: (enabled: boolean) => void;
setBeepTone: (tone: BeepTone) => void;
setBeepVolume: (value: number) => void;
testBeep: () => void;
setCaloriesPerHour: (value: number) => void;
setCustomAccentColor: (hex: string) => void;
setAmoledMode: (enabled: boolean) => void;
setBodyDiagramEnabled: (enabled: boolean) => void;
// `stats` et `caloriesOverride` ne servent qu'au mode vélo : quand le vélo
// annonce lui-même ses calories, elles valent mieux que notre estimation
// durée × kcal/h. Une saisie manuelle appelle la fonction sans eux.
addCardioEntry: (type: CardioActivityType, durationMin: number, rpe?: number, stats?: CardioStats, caloriesOverride?: number) => void;
deleteCardioEntry: (id: string) => void;
setCardioKcalPerHour: (type: CardioActivityType, value: number) => void;
setWeeklySessionGoal: (value: number) => void;
setHomeSectionColor: (key: HomeSectionKey, hex: string | null) => void;
setNavBarEnabled: (enabled: boolean) => void;
setNavBarTabEnabled: (key: NavTabKey, enabled: boolean) => void;
setNavBarTabPinned: (key: NavTabKey, pinned: boolean) => void;
setGymProfile: (patch: Partial<GymProfile>) => void;
setPlateHelperEnabled: (enabled: boolean) => void;
addGym: (name: string) => string;
updateGym: (id: string, patch: Partial<Gym>) => void;
removeGym: (id: string) => void;
duplicateGym: (id: string) => string;
setActiveGym: (id: string) => void;
setShakeToValidateEnabled: (enabled: boolean) => void;
addBodyWeightEntry: (weightKg: number) => void;
deleteBodyWeightEntry: (id: string) => void;
setActiveProgram: (id: string) => void;
addCustomProgram: (program: Program) => void;
removeCustomProgram: (id: string) => void;
setBadgesEnabled: (enabled: boolean) => void;
setHapticsEnabled: (enabled: boolean) => void;
setUltraAnimationsEnabled: (enabled: boolean) => void;
setUltraAnimationStyle: (style: 'confetti' | 'fireworks' | 'sparkles') => void;
setUltraTransitionStyle: (style: 'bounce' | 'slide' | 'zoom' | 'flip') => void;
setSimplicityMode: (enabled: boolean) => void;
completeOnboarding: (choice: 'perso' | 'simple') => void;
saveTrainingProfile: (profile: TrainingProfile) => void;
}

// Recalcule le registre des séances importées (voir data/workouts.ts →
// CUSTOM_WORKOUTS) à partir de la liste de programmes custom du store.
const syncCustomWorkoutsRegistry = (customPrograms: Program[]) => {
setCustomWorkouts(customPrograms.flatMap((p) => p.workouts));
};

// Nombre de semaines d'affilée (semaine en cours incluse) où l'objectif
// hebdo a été atteint, à partir de l'historique réel — même calcul que
// ProfilScreen.tsx, réutilisé ici pour tenir à jour le record `bestWeekStreak`
// (badges de régularité) à chaque séance terminée.
const computeCurrentWeekStreak = (history: HistoryEntry[], weeklySessionGoal: number): number => {
const buckets = bucketByWeek(history, 12);
let streak = 0;
for (let i = buckets.length - 1; i >= 0; i--) {
if (buckets[i].sessionCount >= weeklySessionGoal) streak++;
else break;
}
return streak;
};

/**
 * Salle active, c'est-à-dire celle dont on lit les disques et le matériel.
 * Il y a toujours au moins une salle, mais on retombe sur la première si
 * l'identifiant actif pointe dans le vide (sauvegarde bricolée à la main).
 */
export const useActiveGym = (): Gym =>
  useWorkoutStore((s) => s.gyms.find((g) => g.id === s.activeGymId) ?? s.gyms[0]);

export const useWorkoutStore = create<WorkoutStore>()(
persist(
(set, get) => ({
session: null,
timer: { isRunning: false, endTimestamp: null, totalSeconds: 0 },
currentWeek: 1,
history: [],
theme: 'dark',
themeMode: 'dark',
wakeLockEnabled: true,
customRestSeconds: {},
accentTheme: 'red',
customAccentColor: '#e03030',
amoledMode: false,
fontScale: 'md',
homeSections: {
// Le coach ouvre l'accueil : c'est ce qu'on lit avant de lancer une
// séance. Il ne s'affiche de toute façon qu'une fois une séance
// terminée — avant, il n'a rien à dire.
coach: true,
cycle: true, nutrition: true, supersetRule: true, muscleAlert: true, cardio: true, weeklyGoal: true, nextSession: true,
// Les 2 widgets demandés en priorité (séance précédente, stats de la
// semaine) sont visibles par défaut. Les 3 autres (poids du corps,
// dernier record, progression) démarrent masqués — à ajouter via le
// bouton "+ Ajouter un widget" de l'accueil pour qui les veut.
lastSession: true, weeklyStats: true, bodyWeight: false, personalRecord: false, exerciseProgress: false,
// Le plateau ne s'affiche que s'il y a vraiment une stagnation à signaler,
// et il faut plusieurs semaines de données avant qu'il ait quoi que ce soit
// à dire : visible par défaut, il ne prendra de la place que le jour où il
// sert.
plateau: true,
},
homeSectionOrder: DEFAULT_HOME_ORDER,
homeEssentials: { ...DEFAULT_HOME_ESSENTIALS },
iconShape: 'rounded',
iconSize: 'md',
defaultRestSeconds: 180,
weightUnit: 'kg',
  weightUnitToggleStyle: 'toast',
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
homeSectionColors: {},
navBarEnabled: false,
navBarTabsEnabled: { ...DEFAULT_NAV_TABS_ENABLED },
navBarPinned: { ...DEFAULT_NAV_TABS_PINNED },
gyms: [{ ...INITIAL_GYM }],
activeGymId: INITIAL_GYM.id,
plateHelperEnabled: true,
gymProfile: { ...DEFAULT_GYM_PROFILE },
shakeToValidateEnabled: false,
sessionAdaptation: null,
sessionPausedAt: null,
bodyWeightHistory: [],
activeProgramId: 'strict-v10',
customPrograms: [],
badgesEnabled: true,
totalSessionsCompleted: 0,
totalCardioSessions: 0,
bestWeekStreak: 0,
hapticsEnabled: true,
ultraAnimationsEnabled: false,
ultraAnimationStyle: 'confetti',
ultraTransitionStyle: 'bounce',
hasCompletedOnboarding: false,
simplicityMode: false,
trainingProfile: null,

startSession: (dayId, adaptation = null, gymId) => {
// On part TOUJOURS de la séance du programme, jamais d'une éventuelle
// séance déjà adaptée encore en place : sinon relancer une séance
// appliquerait l'adaptation par-dessus une adaptation.
const base = getBaseWorkout(dayId);
if (!base) return;
const workout = applyAdaptation(base, adaptation);
setSessionWorkoutOverride(adaptation ? workout : null);
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
gymId: gymId ?? get().activeGymId,
},
// Jour 1 du cycle (Pull A) = redémarrage d'un nouveau cycle glissant
// → on regrise toutes les séances de l'accueil.
cycleDoneIds: workout.dayNumber === 1 ? [] : get().cycleDoneIds,
sessionAdaptation: adaptation,
});
if (get().wakeLockEnabled) requestWakeLock();
},

completeSet: (exerciseId, setIndex, entry) => {
const { session, hapticsEnabled } = get();
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
if (hapticsEnabled) tapVibrate();
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
});
},

// Remet currentExerciseIndex/currentSetIndex à une position donnée,
// sans toucher au repos ni à exerciseProgress — utilisé après avoir
// corrigé une série déjà passée (rouverte via le crayon) pour revenir
// à la position réelle de la séance sans relancer de chrono ni
// avancer/reculer la progression (voir SessionScreen.handleSetComplete).
restoreSessionPosition: (exerciseIndex, setIndex) => {
const { session } = get();
if (!session) return;
set({ session: { ...session, currentExerciseIndex: exerciseIndex, currentSetIndex: setIndex } });
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

// Raccourcir la séance en retard : coupe tous les exercices non essentiels
// (voir Exercise.essential) qui n'ont pas encore été entamés — un exercice
// déjà commencé (au moins une série faite) n'est jamais coupé, même non
// essentiel, pour ne pas revenir en arrière sur ce que Léo est en train de
// faire. La position courante est recalculée sur le premier exercice qui
// reste réellement à faire, plutôt que de s'appuyer sur getNextStep (pensé
// pour n'avancer que d'une série à la fois, pas pour sauter plusieurs
// exercices coupés d'un coup).
shortenSession: () => {
const { session } = get();
if (!session) return;
const workout = getWorkout(session.dayId);
if (!workout) return;
const updated = { ...session.exerciseProgress };
for (const ex of workout.exercises) {
if (ex.essential === true) continue;
const entries = updated[ex.id] ?? [];
const alreadyStarted = entries.some((e) => e.completed);
if (alreadyStarted) continue;
updated[ex.id] = entries.map(() => ({ weight: '', reps: '—', completed: true }));
}
const firstUnfinished = workout.exercises.findIndex((ex) => {
const entries = updated[ex.id] ?? [];
const total = Math.max(ex.sets, entries.length);
return entries.filter((e) => e.completed).length < total;
});
// Au sein de cet exercice, la 1ère série pas encore faite (ex: si c'est
// l'exercice en cours, il peut déjà avoir des séries validées) — sinon
// currentSetIndex retomberait sur une série déjà faite et plus aucune
// série active ne s'afficherait nulle part (voir SetRow : une entrée
// completed passe toujours en rendu "faite", jamais en actif).
const firstUnfinishedSetIndex = firstUnfinished === -1 ? 0
: Math.max(0, (updated[workout.exercises[firstUnfinished].id] ?? []).findIndex((e) => !e.completed));
set({
session: {
...session,
exerciseProgress: updated,
...(firstUnfinished === -1 ? {} : { currentExerciseIndex: firstUnfinished, currentSetIndex: firstUnfinishedSetIndex }),
},
});
get().skipTimer();
if (firstUnfinished === -1) get().finishSession();
},

// Basculer sur un autre exercice que celui en cours (ex: machine occupée
// par quelqu'un d'autre) — reprend au premier set non complété de cet
// exercice, sans rien marquer comme sauté ni toucher au minuteur de repos
// en cours (voir SessionScreen : bouton "Faire cet exercice maintenant").
switchToExercise: (exerciseId) => {
const { session } = get();
if (!session) return;
const workout = getWorkout(session.dayId);
if (!workout) return;
const exIdx = workout.exercises.findIndex((e) => e.id === exerciseId);
if (exIdx === -1) return;
const entries = session.exerciseProgress[exerciseId] ?? [];
const firstIncomplete = entries.findIndex((e) => !e.completed);
const setIdx = firstIncomplete === -1 ? Math.max(0, entries.length - 1) : firstIncomplete;
set({ session: { ...session, currentExerciseIndex: exIdx, currentSetIndex: setIdx } });
},

// Remplacer temporairement le nom affiché d'un exercice pour cette séance
// (ex: machine occupée, on fait un exercice de substitution) — ne touche pas
// au programme d'entraînement, juste à l'affichage de cette séance en cours.
setExerciseNameOverride: (exerciseId, name) => {
const { session } = get();
if (!session) return;
const updated = { ...(session.exerciseNameOverrides ?? {}) };
if (name && name.trim()) {
updated[exerciseId] = name.trim();
} else {
delete updated[exerciseId];
}
set({ session: { ...session, exerciseNameOverrides: updated } });
},

// Activer/désactiver le repos entre les 2 exercices d'un superset pour
// cette séance (ex: une des deux machines est occupée) — ne touche pas au
// programme, uniquement à la séance en cours.
toggleSupersetRest: (groupId, disabled) => {
const { session } = get();
if (!session) return;
const current = session.disabledSupersetGroupIds ?? [];
const updated = disabled
? (current.includes(groupId) ? current : [...current, groupId])
: current.filter((id) => id !== groupId);
set({ session: { ...session, disabledSupersetGroupIds: updated } });
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
// Position suivante calculee par getNextStep : gere la rotation A->B->C
// des supersets/tri-sets (voir utils/supersets.ts) autant que le simple
// enchainement serie -> serie -> exercice suivant.
const step = getNextStep(
workout.exercises,
session.currentExerciseIndex,
session.currentSetIndex,
(ex) => session.exerciseProgress[ex.id]?.length ?? ex.sets,
session.disabledSupersetGroupIds ?? [],
);
if (step.exerciseIndex === null) { get().finishSession(); return; }
set({ session: { ...session, currentExerciseIndex: step.exerciseIndex, currentSetIndex: step.setIndex } });
},

finishSession: () => {
const { session, history, weeklySessionGoal, totalSessionsCompleted, bestWeekStreak, hapticsEnabled } = get();
if (!session) return;
const durationMs = Date.now() - session.startTime;
const entry: HistoryEntry = {
id: `${session.dayId}-${session.startTime}`,
dayId: session.dayId, date: session.startTime,
exerciseProgress: session.exerciseProgress,
durationMs,
gymId: session.gymId,
// Le tonnage est calculé ici, à la fin de la séance, et plus seulement
// quand un RPE est saisi : une séance sans RPE comptait pour zéro dans
// les stats alors que les séries, elles, étaient bien enregistrées.
// (La charge d'entraînement, elle, a vraiment besoin du RPE — c'est sa
// définition : RPE × durée.)
tonnage: computeTonnage(session.exerciseProgress),
exerciseNameOverrides: session.exerciseNameOverrides,
};
const updatedHistory = [entry, ...history].slice(0, HISTORY_LIMIT);
const currentStreak = computeCurrentWeekStreak(updatedHistory, weeklySessionGoal);
set((state) => ({
session: { ...session, isComplete: true },
history: updatedHistory,
cycleDoneIds: state.cycleDoneIds.includes(session.dayId)
? state.cycleDoneIds
: [...state.cycleDoneIds, session.dayId],
// Compteur vie entière — jamais tronqué, contrairement à `history`
// (plafonnée, voir HISTORY_LIMIT) — sert de base honnête aux badges de
// paliers (10/25/50/100/200 séances).
totalSessionsCompleted: totalSessionsCompleted + 1,
bestWeekStreak: Math.max(bestWeekStreak, currentStreak),
// Une séance terminée n'est plus en pause.
sessionPausedAt: null,
}));
if (hapticsEnabled) successVibrate();
cancelRestNotification();
releaseWakeLock();
// La séance adaptée ne doit plus masquer celle du programme une fois
// terminée (historique, aperçu de la prochaine séance...).
setSessionWorkoutOverride(null);
},

pauseSession: () => {
const { session, sessionPausedAt, timer } = get();
if (!session || session.isComplete || sessionPausedAt !== null) return;
// Le repos en cours se met en pause avec la séance — sinon il continuerait
// de tourner pendant que Léo est parti.
if (timer.isRunning && !timer.isPaused) get().pauseTimer();
set({ sessionPausedAt: Date.now() });
},

resumeSession: () => {
const { session, sessionPausedAt, timer } = get();
if (!session || sessionPausedAt === null) return;
const paused = Date.now() - sessionPausedAt;
set({
session: { ...session, startTime: session.startTime + paused },
sessionPausedAt: null,
});
if (timer.isPaused) get().resumeTimer();
},

abandonSession: () => {
set({ session: null, sessionAdaptation: null, sessionPausedAt: null, timer: { isRunning: false, endTimestamp: null, totalSeconds: 0 } });
cancelRestNotification();
releaseWakeLock();
setSessionWorkoutOverride(null);
},

startTimer: (seconds) => {
if (seconds <= 0) return;
const endTimestamp = Date.now() + seconds * 1000;
set({ timer: { isRunning: true, endTimestamp, totalSeconds: seconds } });
scheduleRestNotification(seconds);
if (get().hapticsEnabled) vibrate();
},

skipTimer: () => {
set({ timer: { isRunning: false, endTimestamp: null, totalSeconds: 0 } });
cancelRestNotification();
},

reduceTimer: (secondsToRemove) => {
const { timer } = get();
if (timer.isPaused) {
const newRemaining = Math.max(1, (timer.pausedRemainingSeconds ?? 0) - secondsToRemove);
set({ timer: { ...timer, pausedRemainingSeconds: newRemaining } });
return;
}
if (!timer.endTimestamp) return;
const newEnd = Math.max(Date.now() + 1000, timer.endTimestamp - secondsToRemove * 1000);
set({ timer: { ...timer, endTimestamp: newEnd } });
scheduleRestNotification(Math.ceil((newEnd - Date.now()) / 1000));
},

addTimer: (secondsToAdd) => {
const { timer } = get();
if (timer.isPaused) {
const newRemaining = (timer.pausedRemainingSeconds ?? 0) + secondsToAdd;
set({ timer: { ...timer, pausedRemainingSeconds: newRemaining } });
return;
}
if (!timer.endTimestamp) return;
const newEnd = timer.endTimestamp + secondsToAdd * 1000;
set({ timer: { ...timer, endTimestamp: newEnd } });
scheduleRestNotification(Math.ceil((newEnd - Date.now()) / 1000));
},

// Met le repos en pause : fige le temps restant, annule la notification
// programmée (sinon elle sonnerait quand même à l'heure prévue initiale) et
// bascule isPaused à vrai. Le decompte visuel reste figé jusqu a resumeTimer.
pauseTimer: () => {
const { timer } = get();
if (!timer.isRunning || !timer.endTimestamp || timer.isPaused) return;
const remaining = Math.max(0, Math.ceil((timer.endTimestamp - Date.now()) / 1000));
set({ timer: { ...timer, isPaused: true, pausedRemainingSeconds: remaining, endTimestamp: null } });
cancelRestNotification();
},

// Reprend le repos : recalcule un nouvel endTimestamp a partir du temps
// figé et reprogramme la notification de fin de repos.
resumeTimer: () => {
const { timer } = get();
if (!timer.isPaused || timer.pausedRemainingSeconds == null) return;
const seconds = timer.pausedRemainingSeconds;
const endTimestamp = Date.now() + seconds * 1000;
set({ timer: { ...timer, isPaused: false, pausedRemainingSeconds: null, endTimestamp } });
scheduleRestNotification(seconds);
},

setCurrentWeek: (week) => set({ currentWeek: Math.min(MESOCYCLE_WEEKS, Math.max(1, week)) }),
setTheme: (t) => set({ theme: t }),
// 'system' résout tout de suite le thème actuel du téléphone — le
// suivi des changements ultérieurs (ex: passage auto en sombre le
// soir) est géré par un effet dans App.tsx qui réécoute matchMedia
// tant que themeMode reste 'system'.
setThemeMode: (m) => {
if (m === 'system') {
const prefersDark = typeof window !== 'undefined' && window.matchMedia
? window.matchMedia('(prefers-color-scheme: dark)').matches
: true;
set({ themeMode: m, theme: prefersDark ? 'dark' : 'light' });
} else {
set({ themeMode: m, theme: m });
}
},
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

setHomeEssential: (key, essential) =>
set((state) => ({ homeEssentials: { ...state.homeEssentials, [key]: essential } })),

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

// Remplace l'ordre complet en un coup — utilisé par l'accueil pour
// réordonner un widget par rapport à ses voisins VISIBLES seulement (voir
// HomeScreen.tsx), ce que moveHomeSection ne permet pas (il échange avec le
// voisin immédiat dans l'ordre complet, même masqué).
setHomeSectionOrder: (order) => set({ homeSectionOrder: order }),

setIconShape: (shape) => set({ iconShape: shape }),
setIconSize: (size) => set({ iconSize: size }),
setDefaultRestSeconds: (seconds) => set({ defaultRestSeconds: seconds }),
setWeightUnit: (unit) => set({ weightUnit: unit }),
  setWeightUnitToggleStyle: (style) => set({ weightUnitToggleStyle: style }),
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

addCardioEntry: (type, durationMin, rpe, stats, caloriesOverride) => {
const kcalPerHour = get().cardioKcalPerHour[type] ?? DEFAULT_CARDIO_KCAL_PER_HOUR[type];
const entry: CardioEntry = {
id: `cardio-${Date.now()}`,
type,
date: Date.now(),
durationMin,
calories: caloriesOverride != null && caloriesOverride > 0
? Math.round(caloriesOverride)
: Math.round((kcalPerHour / 60) * durationMin),
rpe,
stats,
};
set((state) => ({
cardioHistory: [entry, ...state.cardioHistory].slice(0, HISTORY_LIMIT),
totalCardioSessions: state.totalCardioSessions + 1,
}));
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
setHomeSectionColor: (key, hex) => set((state) => {
const next = { ...state.homeSectionColors };
if (hex) next[key] = hex; else delete next[key];
return { homeSectionColors: next };
}),
setNavBarEnabled: (enabled) => set({ navBarEnabled: enabled }),
setNavBarTabEnabled: (key, enabled) => {
set((state) => ({ navBarTabsEnabled: { ...state.navBarTabsEnabled, [key]: enabled } }));
},
setNavBarTabPinned: (key, pinned) => {
set((state) => ({ navBarPinned: { ...state.navBarPinned, [key]: pinned } }));
},

setGymProfile: (patch) => {
set((state) => {
const next = { ...state.gymProfile, ...patch };
// Les disques sont triés du plus lourd au plus léger et dédoublonnés :
// tout le calcul de combinaison suppose cet ordre.
next.plates = [...new Set(next.plates.filter((v) => v > 0))].sort((a, b) => b - a);
return { gymProfile: next };
});
},

setShakeToValidateEnabled: (enabled) => set({ shakeToValidateEnabled: enabled }),

setPlateHelperEnabled: (enabled) => set({ plateHelperEnabled: enabled }),

addGym: (name) => {
const gym = makeDefaultGym(name.trim() || 'Nouvelle salle');
set((state) => ({ gyms: [...state.gyms, gym] }));
return gym.id;
},

updateGym: (id, patch) => {
set((state) => ({
gyms: state.gyms.map((g) => {
if (g.id !== id) return g;
const next = { ...g, ...patch };
// Même règle que pour l'ancien profil : disques triés du plus lourd au
// plus léger et dédoublonnés, tout le calcul en dépend.
if (patch.plates) next.plates = [...new Set(patch.plates.filter((v) => v > 0))].sort((a, b) => b - a);
return next;
}),
}));
},

removeGym: (id) => {
set((state) => {
// On ne supprime jamais la dernière salle : l'appli a besoin d'un
// profil de matériel pour le calcul des disques.
if (state.gyms.length <= 1) return {};
const gyms = state.gyms.filter((g) => g.id !== id);
const activeGymId = state.activeGymId === id ? gyms[0].id : state.activeGymId;
return { gyms, activeGymId };
});
},

duplicateGym: (id) => {
const source = get().gyms.find((g) => g.id === id);
if (!source) return '';
const copie: Gym = {
...source,
plates: [...source.plates],
availableEquipment: [...source.availableEquipment],
machines: [...(source.machines ?? [])],
id: `gym-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
name: `${source.name} (copie)`,
};
set((state) => ({ gyms: [...state.gyms, copie] }));
return copie.id;
},

setActiveGym: (id) => {
if (!get().gyms.some((g) => g.id === id)) return;
set({ activeGymId: id });
},

addBodyWeightEntry: (weightKg) => {
const entry: BodyWeightEntry = { id: `bw-${Date.now()}`, date: Date.now(), weightKg };
set((state) => ({ bodyWeightHistory: [entry, ...state.bodyWeightHistory].slice(0, 200) }));
},
deleteBodyWeightEntry: (id) => {
set((state) => ({ bodyWeightHistory: state.bodyWeightHistory.filter((e) => e.id !== id) }));
},

// Change le programme actif — ne touche jamais aux autres programmes
// ni à l'historique déjà enregistré. Remet à zéro les séances "faites
// ce cycle" puisque ce compteur est propre au programme actif.
setActiveProgram: (id) => set({ activeProgramId: id, cycleDoneIds: [] }),

// Ajoute un programme importé (voir importParser.ts) et le rend
// immédiatement disponible pour getWorkout() partout dans l'appli.
addCustomProgram: (program) => {
set((state) => {
const customPrograms = [...state.customPrograms, program];
syncCustomWorkoutsRegistry(customPrograms);
return { customPrograms };
});
},
removeCustomProgram: (id) => {
set((state) => {
const customPrograms = state.customPrograms.filter((p) => p.id !== id);
syncCustomWorkoutsRegistry(customPrograms);
return {
customPrograms,
// Si le programme actif vient d'être supprimé, on retombe sur
// Strict V10 plutôt que de laisser l'accueil sans séances.
activeProgramId: state.activeProgramId === id ? 'strict-v10' : state.activeProgramId,
};
});
},

setBadgesEnabled: (enabled) => set({ badgesEnabled: enabled }),
setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
setUltraAnimationsEnabled: (enabled) => set({ ultraAnimationsEnabled: enabled }),
setUltraAnimationStyle: (style) => set({ ultraAnimationStyle: style }),
setUltraTransitionStyle: (style) => set({ ultraTransitionStyle: style }),
setSimplicityMode: (enabled) => set({ simplicityMode: enabled }),
// Appelé une seule fois, depuis OnboardingModal, au tout premier lancement.
completeOnboarding: (choice) => set({ hasCompletedOnboarding: true, simplicityMode: choice === 'simple' }),

saveTrainingProfile: (profile) => set({ trainingProfile: profile }),
}),
{
name: 'ppl-tracker-store',
partialize: (state) => ({
session: state.session,
sessionPausedAt: state.sessionPausedAt,
// Le repos en cours : sans ça, verrouiller son téléphone pendant les
// 3 minutes de repos remettait le minuteur à zéro. `endTimestamp` est une
// date absolue, il reste donc juste après un rechargement.
timer: state.timer,
currentWeek: state.currentWeek,
history: state.history,
theme: state.theme,
themeMode: state.themeMode,
wakeLockEnabled: state.wakeLockEnabled,
customRestSeconds: state.customRestSeconds,
accentTheme: state.accentTheme,
fontScale: state.fontScale,
homeSections: state.homeSections,
homeSectionOrder: state.homeSectionOrder,
homeEssentials: state.homeEssentials,
iconShape: state.iconShape,
iconSize: state.iconSize,
defaultRestSeconds: state.defaultRestSeconds,
weightUnit: state.weightUnit,
      weightUnitToggleStyle: state.weightUnitToggleStyle,
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
homeSectionColors: state.homeSectionColors,
navBarEnabled: state.navBarEnabled,
navBarTabsEnabled: state.navBarTabsEnabled,
navBarPinned: state.navBarPinned,
gyms: state.gyms,
activeGymId: state.activeGymId,
plateHelperEnabled: state.plateHelperEnabled,
gymProfile: state.gymProfile,
shakeToValidateEnabled: state.shakeToValidateEnabled,
sessionAdaptation: state.sessionAdaptation,
bodyWeightHistory: state.bodyWeightHistory,
activeProgramId: state.activeProgramId,
customPrograms: state.customPrograms,
badgesEnabled: state.badgesEnabled,
totalSessionsCompleted: state.totalSessionsCompleted,
totalCardioSessions: state.totalCardioSessions,
bestWeekStreak: state.bestWeekStreak,
hapticsEnabled: state.hapticsEnabled,
ultraAnimationsEnabled: state.ultraAnimationsEnabled,
ultraAnimationStyle: state.ultraAnimationStyle,
ultraTransitionStyle: state.ultraTransitionStyle,
hasCompletedOnboarding: state.hasCompletedOnboarding,
simplicityMode: state.simplicityMode,
trainingProfile: state.trainingProfile,
}),
// Merge personnalisé : par défaut, zustand/persist remplace entièrement
// les objets imbriqués (homeSections, homeSectionOrder) par la version
// sauvegardée. Si on ajoute une nouvelle section plus tard (ex:
// muscleAlert), les téléphones qui ont déjà des données perdraient
// silencieusement cette section. On merge donc à la main pour que les
// nouvelles clés apparaissent avec leur valeur par défaut.
merge: (persisted, current) => {
const hadPriorState = persisted != null;
const p = (persisted ?? {}) as Partial<WorkoutStore>;
// Un repos dont l'échéance est passée pendant que l'app était fermée n'a
// plus lieu d'être : on le nettoie plutôt que de rouvrir l'app sur un
// minuteur à zéro qui sonne dans le vide.
if (p.timer?.isRunning && p.timer.endTimestamp && p.timer.endTimestamp <= Date.now()) {
p.timer = { isRunning: false, endTimestamp: null, totalSeconds: 0 };
}
const merged = { ...current, ...p };
merged.homeSections = { ...current.homeSections, ...(p.homeSections ?? {}) };
// Même précaution que pour homeSections : un bloc ajouté plus tard doit
// apparaître avec sa valeur par défaut au lieu d'être absent du réglage
// sauvegardé sur le téléphone.
merged.homeEssentials = { ...current.homeEssentials, ...(p.homeEssentials ?? {}) };
const savedOrder = p.homeSectionOrder ?? current.homeSectionOrder;
const missingKeys = current.homeSectionOrder.filter((k) => !savedOrder.includes(k));
merged.homeSectionOrder = [...savedOrder, ...missingKeys];
// Même logique pour les onglets de la nav bar : un nouvel onglet
// ajouté plus tard (ex: Profil) doit apparaître actif par défaut
// pour les téléphones qui ont déjà une sauvegarde, pas disparaître.
merged.navBarTabsEnabled = { ...DEFAULT_NAV_TABS_ENABLED, ...(p.navBarTabsEnabled ?? {}) };
merged.navBarPinned = { ...DEFAULT_NAV_TABS_PINNED, ...(p.navBarPinned ?? {}) };
merged.activeProgramId = p.activeProgramId ?? 'strict-v10';
// Profil de salle : mergé clé par clé pour qu'un réglage ajouté plus tard
// arrive avec sa valeur par défaut au lieu de rester undefined.
merged.gymProfile = { ...DEFAULT_GYM_PROFILE, ...(p.gymProfile ?? {}) };
// Migration vers les salles multiples : la sauvegarde d'avant n'avait qu'un
// seul profil de matériel, il devient la première salle sans rien perdre.
// L'aide au chargement était rangée dans l'ancien profil unique.
merged.plateHelperEnabled = p.plateHelperEnabled
  ?? (p.gymProfile as (GymProfile & { plateHelperEnabled?: boolean }) | undefined)?.plateHelperEnabled
  ?? true;
const salles = (p.gyms ?? []).map((g) => ({ ...DEFAULT_GYM_PROFILE, ...g }));
merged.gyms = salles.length > 0
? salles
: [{ ...merged.gymProfile, id: INITIAL_GYM.id, name: INITIAL_GYM.name }];
merged.activeGymId = merged.gyms.some((g) => g.id === p.activeGymId)
? (p.activeGymId as string)
: merged.gyms[0].id;
merged.shakeToValidateEnabled = p.shakeToValidateEnabled ?? false;
merged.sessionAdaptation = p.sessionAdaptation ?? null;
merged.customPrograms = p.customPrograms ?? [];
// Remplit tout de suite le registre des séances importées, pour que
// getWorkout() les retrouve dès le premier rendu après le chargement.
syncCustomWorkoutsRegistry(merged.customPrograms);

// Une séance adaptée doit rester adaptée après un rechargement de
// l'appli (fermeture de l'onglet, PWA relancée en pleine séance) :
// on réinstalle la surcouche tout de suite, avant le premier rendu.
// Placé APRÈS syncCustomWorkoutsRegistry pour que les séances issues
// d'un programme importé soient déjà retrouvables.
if (merged.session && !merged.session.isComplete && merged.sessionAdaptation) {
const base = getBaseWorkout(merged.session.dayId);
setSessionWorkoutOverride(base ? applyAdaptation(base, merged.sessionAdaptation) : null);
} else {
setSessionWorkoutOverride(null);
}

// Badges — compteurs vie entière introduits après coup. Pour ne pas
// pénaliser les utilisateurs qui ont déjà de l'historique, on les
// initialise une seule fois (si absents de la sauvegarde) à partir
// des données réelles déjà présentes (history/cardioHistory étant
// limités à 50 entrées, c'est une base honnête — pas un chiffre
// inventé — mais elle peut sous-compter l'activité plus ancienne).
merged.badgesEnabled = p.badgesEnabled ?? true;
const baseHistory = p.history ?? current.history;
const baseCardio = p.cardioHistory ?? current.cardioHistory;
const baseGoal = p.weeklySessionGoal ?? current.weeklySessionGoal;
merged.totalSessionsCompleted = p.totalSessionsCompleted ?? baseHistory.length;
merged.totalCardioSessions = p.totalCardioSessions ?? baseCardio.length;
merged.bestWeekStreak = p.bestWeekStreak ?? computeCurrentWeekStreak(baseHistory, baseGoal);
// Vibrations — activées par défaut, comme le reste des retours
// sensoriels (bip, wake lock).
merged.hapticsEnabled = p.hapticsEnabled ?? true;
// Ultra animations — désactivé par défaut (opt-in), contrairement
// aux autres retours sensoriels : c'est un effet plus voyant que
// Léo doit choisir d'activer, pas quelque chose qu'on impose.
merged.ultraAnimationsEnabled = p.ultraAnimationsEnabled ?? false;
merged.ultraAnimationStyle = p.ultraAnimationStyle ?? 'confetti';
merged.ultraTransitionStyle = p.ultraTransitionStyle ?? 'bounce';
// 'dark' par défaut = comportement historique (avant l'ajout du
// mode "Système") : personne ne bascule en clair sans le demander.
merged.themeMode = p.themeMode ?? 'dark';
// Onboarding "Personnalisation ou simplicité" : n'existait pas avant.
// Une installation qui avait déjà un state sauvegardé (hadPriorState)
// est considérée comme ayant déjà "choisi" Personnalisation — c'est le
// comportement historique, tous les réglages restent visibles, rien ne
// change pour Léo. Seule une toute nouvelle installation (aucun state
// du tout) verra l'écran de choix au premier lancement.
merged.hasCompletedOnboarding = p.hasCompletedOnboarding ?? hadPriorState;
merged.weightUnit = p.weightUnit ?? 'kg';
    merged.weightUnitToggleStyle = p.weightUnitToggleStyle ?? 'toast';
merged.simplicityMode = p.simplicityMode ?? false;
merged.trainingProfile = p.trainingProfile ?? null;

return merged;
},
}
)
);
