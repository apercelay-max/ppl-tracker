import { useState, useEffect } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { SessionScreen } from './screens/SessionScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { WorkoutIntroScreen } from './screens/WorkoutIntroScreen';
import { ObjectivesScreen } from './screens/ObjectivesScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { CardioScreen } from './screens/CardioScreen';
import { ExercicesScreen } from './screens/ExercicesScreen';
import { PoidsScreen } from './screens/PoidsScreen';
import { ProfilScreen } from './screens/ProfilScreen';
import { AuthScreen } from './screens/AuthScreen';
import { NavBar } from './components/NavBar';
import type { NavView } from './components/NavBar';
import { SplashScreen } from './components/SplashScreen';
import { SyncConflictModal } from './components/SyncConflictModal';
import { OnboardingModal } from './components/OnboardingModal';
import { useWorkoutStore } from './store/workoutStore';
import { useCloudSync } from './hooks/useCloudSync';
import { getAccent } from './data/accents';
import { ICON_SHAPE_RADIUS } from './data/iconPrefs';

type View =
| 'home' | 'intro' | 'session' | 'dashboard' | 'settings' | 'objectifs' | 'historique'
| 'cardio' | 'exercices' | 'poids' | 'profil' | 'auth';

// Durée d'affichage du splash "PPL" au démarrage, avant le fondu de sortie
// (voir .splash-fade dans index.css). Volontairement court pour ne pas
// ralentir l'ouverture de l'appli à chaque fois.
const SPLASH_VISIBLE_MS = 1100;
const SPLASH_FADE_MS = 350;

export default function App() {
const [view, setView] = useState<View>('home');
const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
// D'où on est venu quand on ouvre les Réglages, pour y retourner sans
// jamais toucher à une séance en cours (voir handleOpenSettings).
const [settingsReturnView, setSettingsReturnView] = useState<View>('home');
const theme = useWorkoutStore((s) => s.theme);
const themeMode = useWorkoutStore((s) => s.themeMode);
const setThemeMode = useWorkoutStore((s) => s.setThemeMode);
const accentTheme = useWorkoutStore((s) => s.accentTheme);
const customAccentColor = useWorkoutStore((s) => s.customAccentColor);
const amoledMode = useWorkoutStore((s) => s.amoledMode);
const fontScale = useWorkoutStore((s) => s.fontScale);
const iconShape = useWorkoutStore((s) => s.iconShape);
const highContrast = useWorkoutStore((s) => s.highContrast);
const navBarEnabled = useWorkoutStore((s) => s.navBarEnabled);
const ultraAnimationsEnabled = useWorkoutStore((s) => s.ultraAnimationsEnabled);
const ultraTransitionStyle = useWorkoutStore((s) => s.ultraTransitionStyle);
// Écran "Personnalisation ou simplicité", affiché une seule fois au tout
// premier lancement (voir OnboardingModal.tsx et workoutStore.ts).
const hasCompletedOnboarding = useWorkoutStore((s) => s.hasCompletedOnboarding);
const completeOnboarding = useWorkoutStore((s) => s.completeOnboarding);

// Synchro cloud (Supabase) — se met en route toute seule dès qu'un
// utilisateur est connecté (voir hooks/useCloudSync.ts). Le modal de
// conflit est rendu plus bas, par-dessus l'écran courant quel qu'il soit.
const sync = useCloudSync();

// ── Splash de démarrage ("PPL" en grand + icône) ────────────────────────
const [splashVisible, setSplashVisible] = useState(true);
const [splashFading, setSplashFading] = useState(false);
useEffect(() => {
const fadeTimer = setTimeout(() => setSplashFading(true), SPLASH_VISIBLE_MS);
const hideTimer = setTimeout(() => setSplashVisible(false), SPLASH_VISIBLE_MS + SPLASH_FADE_MS);
return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
}, []);

useEffect(() => {
document.documentElement.setAttribute('data-theme', theme);
}, [theme]);

// Mode "Système" (Réglages → Apparence) : on suit en direct les
// changements de thème clair/sombre du téléphone tant que themeMode reste
// 'system'. Si Léo a choisi 'light'/'dark' explicitement, ce listener ne
// touche à rien (setThemeMode a déjà fixé `theme` en dur dans ce cas).
useEffect(() => {
if (themeMode !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
const mq = window.matchMedia('(prefers-color-scheme: dark)');
const onChange = () => {
// Recalcule et réapplique le thème résolu sans changer themeMode.
useWorkoutStore.setState({ theme: mq.matches ? 'dark' : 'light' });
};
mq.addEventListener('change', onChange);
return () => mq.removeEventListener('change', onChange);
}, [themeMode, setThemeMode]);

useEffect(() => {
const accent = getAccent(accentTheme, customAccentColor);
const root = document.documentElement.style;
root.setProperty('--brand-1', accent.c1);
root.setProperty('--brand-2', accent.c2);
root.setProperty('--brand-1-rgb', accent.rgb1);
}, [accentTheme, customAccentColor]);

// Noir pur (AMOLED) — ne s'applique visuellement qu'en thème sombre,
// voir les overrides [data-theme="dark"][data-amoled="on"] dans index.css.
useEffect(() => {
document.documentElement.setAttribute('data-amoled', amoledMode ? 'on' : 'off');
}, [amoledMode]);

useEffect(() => {
document.documentElement.setAttribute('data-font-scale', fontScale);
}, [fontScale]);

useEffect(() => {
document.documentElement.style.setProperty('--icon-radius', ICON_SHAPE_RADIUS[iconShape]);
}, [iconShape]);

useEffect(() => {
document.documentElement.setAttribute('data-contrast', highContrast ? 'high' : 'normal');
}, [highContrast]);

const handleSelectDay = (dayId: string) => {
const state = useWorkoutStore.getState();
const hasResumableSession = state.session && state.session.dayId === dayId && !state.session.isComplete;
setSelectedDayId(dayId);
if (hasResumableSession) {
// Séance déjà en cours pour ce jour : on reprend direct, pas besoin
// de repasser par l'écran "Démarrer".
setView('session');
} else {
// Nouvelle séance : on montre d'abord l'aperçu (programme du jour +
// bouton Démarrer), la séance ne démarre qu'après avoir appuyé sur
// Démarrer.
setView('intro');
}
};

const handleStartWorkout = () => {
if (!selectedDayId) return;
useWorkoutStore.getState().startSession(selectedDayId);
setView('session');
};

const handleBack = () => {
setView('home');
};

const handleOpenDashboard = () => {
setView('dashboard');
};

const handleOpenSettings = () => {
setSettingsReturnView(view);
setView('settings');
};

const handleBackFromSettings = () => {
setView(settingsReturnView);
};

// Écran Compte (connexion/inscription) — toujours ouvert depuis les
// Réglages, donc "retour" ramène toujours vers Réglages (pas besoin
// d'un historique de navigation dédié comme pour settingsReturnView).
const handleOpenAccount = () => {
setView('auth');
};

const handleBackFromAccount = () => {
setView('settings');
};

// Navigation depuis la barre du bas (liquid glass, activable dans les
// Réglages) — "Réglages" passe par handleOpenSettings pour garder le
// comportement normal du bouton retour de cet écran.
const handleNavigate = (v: NavView) => {
if (v === 'settings') { handleOpenSettings(); return; }
setView(v);
};

let screen;
if (view === 'intro' && selectedDayId) {
screen = <WorkoutIntroScreen dayId={selectedDayId} onBack={handleBack} onStart={handleStartWorkout} />;
} else if (view === 'session' && selectedDayId) {
screen = <SessionScreen dayId={selectedDayId} onBack={handleBack} onOpenSettings={handleOpenSettings} />;
} else if (view === 'dashboard') {
screen = <DashboardScreen onBack={handleBack} />;
} else if (view === 'objectifs') {
screen = <ObjectivesScreen onBack={handleBack} />;
} else if (view === 'historique') {
screen = <HistoryScreen onBack={handleBack} />;
} else if (view === 'cardio') {
screen = <CardioScreen onBack={handleBack} />;
} else if (view === 'exercices') {
screen = <ExercicesScreen onBack={handleBack} />;
} else if (view === 'poids') {
screen = <PoidsScreen onBack={handleBack} />;
} else if (view === 'profil') {
screen = <ProfilScreen onBack={handleBack} />;
} else if (view === 'auth') {
screen = <AuthScreen onBack={handleBackFromAccount} />;
} else if (view === 'settings') {
screen = (
<SettingsScreen
onBack={handleBackFromSettings}
onOpenAccount={handleOpenAccount}
syncStatus={sync.status}
lastSyncedAt={sync.lastSyncedAt}
/>
);
} else {
screen = <HomeScreen onSelectDay={handleSelectDay} onOpenDashboard={handleOpenDashboard} onOpenSettings={handleOpenSettings} />;
}

// La barre ne s'affiche jamais pendant une séance (intro/session) — même
// activée dans les Réglages, elle distrairait pendant l'entraînement.
const NAV_VIEWS: View[] = ['home', 'objectifs', 'historique', 'cardio', 'exercices', 'poids', 'dashboard', 'profil', 'settings'];
const showNavBar = navBarEnabled && NAV_VIEWS.includes(view);
const activeNavTab: NavView = (NAV_VIEWS.includes(view) ? view : 'home') as NavView;

// Classe de transition d'écran : en mode Ultra animations, on pioche parmi
// plusieurs styles réglables (Réglages → Personnalisation) au lieu du seul
// rebond historique.
const transitionClass = !ultraAnimationsEnabled
? 'fade-in'
: ultraTransitionStyle === 'slide'
? 'ultra-slide-in'
: ultraTransitionStyle === 'zoom'
? 'ultra-zoom-in'
: ultraTransitionStyle === 'flip'
? 'ultra-flip-in'
: 'ultra-fade-in';

return (
<>
<div key={view} className={transitionClass} style={{ height: '100%' }}>
{screen}
</div>
{showNavBar && <NavBar active={activeNavTab} onNavigate={handleNavigate} />}
{splashVisible && <SplashScreen fadingOut={splashFading} />}
{!hasCompletedOnboarding && (
<OnboardingModal onChoose={(choice) => completeOnboarding(choice)} />
)}
{sync.status === 'conflict' && sync.conflict && (
<SyncConflictModal
remoteUpdatedAt={sync.conflict.remoteUpdatedAt}
onUseCloud={sync.resolveUseCloud}
onUseDevice={sync.resolveUseDevice}
/>
)}
</>
);
}
