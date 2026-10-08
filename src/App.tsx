import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { HomeScreen } from './screens/HomeScreen';
import { HomeScreenClassic } from './screens/HomeScreenClassic';
import { SessionScreen } from './screens/SessionScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { SettingsScreen, type SettingsCategory } from './screens/SettingsScreen';
import { WorkoutIntroScreen } from './screens/WorkoutIntroScreen';
import type { SessionAdaptation } from './utils/gymAdapt';
import type { CardioActivityType } from './data/types';
import { ObjectivesScreen } from './screens/ObjectivesScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { CardioScreen } from './screens/CardioScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { ExercicesScreen } from './screens/ExercicesScreen';
import { CatalogueScreen } from './screens/CatalogueScreen';
import { PoidsScreen } from './screens/PoidsScreen';
import { CoachScreen } from './screens/CoachScreen';
import { ProfilScreen } from './screens/ProfilScreen';
import { AuthScreen } from './screens/AuthScreen';
import { NavBar } from './components/NavBar';
import type { NavView } from './components/NavBar';
import { SplashScreen } from './components/SplashScreen';
import { DailySummarySheet } from './components/DailySummarySheet';
import { useDailyBrief } from './hooks/useDailyBrief';
import { SyncConflictModal } from './components/SyncConflictModal';
import { maybeAutoBackup } from './lib/localBackups';
import { OnboardingQuiz } from './components/OnboardingQuiz';
import { WhatsNewSheet } from './components/WhatsNewSheet';
import { CHANGELOG, type ChangelogEntry } from './data/changelog';
import { useWorkoutStore } from './store/workoutStore';
import { useCloudSync } from './hooks/useCloudSync';
import { useVoiceCoach } from './hooks/useVoiceCoach';
import { setPendingInvite, useBinomeSync } from './hooks/useBinome';
import { clearInviteCodeFromUrl, readInviteCodeFromUrl } from './lib/binome';
import type { GymProfile } from './utils/gymAdapt';
import { getAccent, hexToRgbTriplet } from './data/accents';
import { getProgram } from './data/programs';
import { ICON_SHAPE_RADIUS } from './data/iconPrefs';

type View =
| 'home' | 'intro' | 'session' | 'dashboard' | 'settings' | 'objectifs' | 'historique'
| 'cardio' | 'activite' | 'exercices' | 'catalogue' | 'poids' | 'coach' | 'profil' | 'auth';

// Écrans qu'un widget a le droit d'ouvrir.
const WIDGET_LINK_VIEWS: View[] = ['home', 'objectifs', 'poids', 'coach', 'profil', 'exercices'];

// Durée d'affichage du splash "PPL" au démarrage, avant le fondu de sortie
// (voir .splash-fade dans index.css). Volontairement court pour ne pas
// ralentir l'ouverture de l'appli à chaque fois.
const NEWS_SEEN_KEY = 'ppl-news-seen';
const SPLASH_VISIBLE_MS = 2900;
const SPLASH_FADE_MS = 450;

// Lien « mot de passe oublié » reçu par e-mail : Supabase y ajoute type=recovery.
// Lu ici, à l'évaluation du module, avant que la librairie ne nettoie l'adresse :
// l'événement PASSWORD_RECOVERY part avant que l'écran Compte existe, donc
// celui-ci ne pouvait jamais proposer de choisir le nouveau mot de passe.
const OPENED_FROM_RECOVERY_LINK = typeof window !== 'undefined'
  && /[#&?]type=recovery(&|$)/.test(window.location.search + window.location.hash);

export default function App() {
const [view, setView] = useState<View>(OPENED_FROM_RECOVERY_LINK ? 'auth' : 'home');
// Vrai tant que l'écran Compte doit s'ouvrir sur « nouveau mot de passe ».
const [recoveryPending, setRecoveryPending] = useState(OPENED_FROM_RECOVERY_LINK);
const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
// Quelle activité l'écran cardio en direct doit afficher (vélo, marche, course).
const [activityMode, setActivityMode] = useState<CardioActivityType>('velo');
// D'où on est venu quand on ouvre les Réglages, pour y retourner sans
// jamais toucher à une séance en cours (voir handleOpenSettings).
const [settingsReturnView, setSettingsReturnView] = useState<View>('home');
// Catégorie des Réglages à ouvrir d'office. Ne sert qu'à l'arrivée par un
// lien d'invitation binôme ; remis à zéro dès qu'on ouvre les Réglages
// normalement.
const [settingsInitialCategory, setSettingsInitialCategory] = useState<SettingsCategory | undefined>(undefined);
const theme = useWorkoutStore((s) => s.theme);
// Pour l'étiquette du bouton rouge de la barre (« Commencer » vs « Reprendre »).
const session = useWorkoutStore((s) => s.session);
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
const uiStyle = useWorkoutStore((s) => s.uiStyle);
// Quiz de démarrage (objectif, niveau, matériel...), affiché une seule fois
// au tout premier lancement — voir OnboardingQuiz.tsx et workoutStore.ts.
// Il est aussi rejouable depuis les Réglages : dans ce cas `quizOpen` le
// rouvre par-dessus l'écran courant, avec un bouton pour en ressortir.
const hasCompletedOnboarding = useWorkoutStore((s) => s.hasCompletedOnboarding);
const trainingProfile = useWorkoutStore((s) => s.trainingProfile);
const [quizOpen, setQuizOpen] = useState(false);
// Résumé du jour (Gemini) : préparé en arrière-plan dès l'ouverture, affiché
// en touchant le prénom sur l'accueil.
const [summaryOpen, setSummaryOpen] = useState(false);

// Synchro cloud (Supabase) — se met en route toute seule dès qu'un
// utilisateur est connecté (voir hooks/useCloudSync.ts). Le modal de
// conflit est rendu plus bas, par-dessus l'écran courant quel qu'il soit.
const sync = useCloudSync();
// Monté ici et pas dans SessionScreen : le coach doit continuer de parler
// quand on quitte l'écran de séance pendant un repos (Stats, Catalogue...).
// Il ne dit rien tant qu'aucune séance n'est en cours.
useVoiceCoach();
// Binôme : charge l'état et partage chaque séance terminée (voir hooks/useBinome.ts).
useBinomeSync();

// Lien d'invitation (…/?binome=CODE). Le code est rangé pour la durée de
// l'onglet — il faut peut-être d'abord se connecter — puis retiré de la barre
// d'adresse, sinon un rechargement rejouerait l'acceptation. On ouvre les
// Réglages sur « Données & compte », où l'invitation attend.
// Copie de secours hebdomadaire, un peu après le démarrage pour ne rien ralentir.
useEffect(() => {
const t = setTimeout(() => { void maybeAutoBackup(); }, 8000);
return () => clearTimeout(t);
}, []);

useEffect(() => {
const code = readInviteCodeFromUrl();
if (!code) return;
setPendingInvite(code);
clearInviteCodeFromUrl();
setSettingsReturnView('home');
setSettingsInitialCategory('donnees');
setView('settings');
}, []);

// ── Splash de démarrage ("PPL" en grand + icône) ────────────────────────
const [splashVisible, setSplashVisible] = useState(true);
const [splashFading, setSplashFading] = useState(false);
const dailyBrief = useDailyBrief(hasCompletedOnboarding);
useEffect(() => {
const fadeTimer = setTimeout(() => setSplashFading(true), SPLASH_VISIBLE_MS);
const hideTimer = setTimeout(() => setSplashVisible(false), SPLASH_VISIBLE_MS + SPLASH_FADE_MS);
return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
}, []);

// Nouveautés : après le splash, une seule fois par mise à jour. Un tout
// nouvel utilisateur (quiz pas encore fait) n'a rien à « rattraper » : on
// note simplement que tout est vu.
const [news, setNews] = useState<ChangelogEntry[]>([]);
useEffect(() => {
if (splashVisible || !CHANGELOG.length) return;
try {
if (!hasCompletedOnboarding) {
localStorage.setItem(NEWS_SEEN_KEY, CHANGELOG[0].id);
return;
}
const seen = localStorage.getItem(NEWS_SEEN_KEY);
if (seen === CHANGELOG[0].id) return;
const idx = seen ? CHANGELOG.findIndex((e) => e.id === seen) : -1;
const unseen = idx === -1 ? CHANGELOG.slice(0, 3) : CHANGELOG.slice(0, idx);
if (seen === null && unseen.length === 0) return;
setNews(unseen.slice(0, 3));
} catch { /* stockage indisponible : pas de nouveautés, tant pis */ }
}, [splashVisible, hasCompletedOnboarding]);
const closeNews = () => {
try { localStorage.setItem(NEWS_SEEN_KEY, CHANGELOG[0].id); } catch { /* ignoré */ }
setNews([]);
};

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
// Utilisé par le halo d'ambiance (.screen-ambient dans index.css), qui a besoin
// de la 2e couleur du dégradé en rgb pour pouvoir l'utiliser en rgba().
root.setProperty('--brand-2-rgb', hexToRgbTriplet(accent.c2));
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

// L'écran d'aperçu peut renvoyer un plan d'adaptation (temps dispo, forme
// du jour, matériel dispo) : il est transmis tel quel au store, qui bâtit
// la séance réellement faite à partir de là.
const handleStartWorkout = (adaptation: SessionAdaptation | null = null, gymId?: string, passageGym?: GymProfile | null) => {
if (!selectedDayId) return;
const current = useWorkoutStore.getState().session;
if (current && !current.isComplete && current.dayId !== selectedDayId) {
// Une autre séance est en cours : en lancer une nouvelle l'écraserait sans un
// mot (séries validées perdues). On demande d'abord, et on l'abandonne
// proprement (minuteur, notification de repos, écran allumé).
if (!window.confirm('Une autre séance est en cours. La remplacer par celle-ci ? Les séries déjà validées de la séance en cours seront perdues.')) return;
useWorkoutStore.getState().abandonSession();
}
useWorkoutStore.getState().startSession(selectedDayId, adaptation, gymId, passageGym ?? null);
setView('session');
};

const handleBack = () => {
setView('home');
};

// Bouton rouge de la barre du bas : reprend la séance en cours s'il y en a
// une, sinon ouvre la prochaine séance non faite du cycle (même règle que le
// bloc "Prochaine séance" de l'accueil).
const handleStartFromNav = () => {
const state = useWorkoutStore.getState();
if (state.session && !state.session.isComplete) {
handleSelectDay(state.session.dayId);
return;
}
const program = getProgram(state.activeProgramId, state.customPrograms);
const next = program.workouts.find((w) => !state.cycleDoneIds.includes(w.id)) ?? program.workouts[0];
if (next) handleSelectDay(next.id);
};

// Appuyer sur un widget iOS ouvre l'appli par un lien : ppltracker://session/<id>
// démarre (ou reprend) cette séance, ppltracker://view/<écran> ouvre l'écran.
// Le gestionnaire est relu à chaque rendu via une référence : l'abonnement,
// lui, ne se fait qu'une fois.
const deepLinkRef = useRef<(url: string) => void>(() => {});
deepLinkRef.current = (url: string) => {
const [kind, target] = url.replace(/^ppltracker:\/\//, '').split('/');
if (kind === 'session' && target) {
handleSelectDay(decodeURIComponent(target));
} else if (kind === 'view' && (WIDGET_LINK_VIEWS as string[]).includes(target)) {
setView(target as View);
}
};
useEffect(() => {
if (Capacitor.getPlatform() !== 'ios') return;
void CapacitorApp.getLaunchUrl().then((r) => { if (r?.url) deepLinkRef.current(r.url); });
const listener = CapacitorApp.addListener('appUrlOpen', (e) => deepLinkRef.current(e.url));
return () => { void listener.then((h) => h.remove()); };
}, []);

const handleOpenDashboard = () => {
setView('dashboard');
};

const handleOpenSettings = (category?: SettingsCategory) => {
setSettingsReturnView(view);
setSettingsInitialCategory(category);
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
setRecoveryPending(false);
setView('settings');
};

// Navigation depuis la barre du bas (liquid glass, activable dans les
// Réglages) — "Réglages" passe par handleOpenSettings pour garder le
// comportement normal du bouton retour de cet écran.
const handleNavigate = (v: NavView) => {
// Déjà dans les Réglages : un 2e appui sur l'onglet ne doit pas faire de
// « Réglages » son propre écran de retour (le bouton retour ne ferait plus rien).
if (v === 'settings') { if (view !== 'settings') handleOpenSettings(); return; }
setView(v);
};

let screen;
if (view === 'intro' && selectedDayId) {
screen = <WorkoutIntroScreen dayId={selectedDayId} onBack={handleBack} onStart={handleStartWorkout} />;
} else if (view === 'session' && selectedDayId) {
screen = <SessionScreen dayId={selectedDayId} onBack={handleBack} onOpenSettings={() => handleOpenSettings()} />;
} else if (view === 'dashboard') {
screen = <DashboardScreen onBack={handleBack} />;
} else if (view === 'objectifs') {
screen = <ObjectivesScreen onBack={handleBack} />;
} else if (view === 'historique') {
screen = <HistoryScreen onBack={handleBack} />;
} else if (view === 'cardio') {
screen = <CardioScreen onBack={handleBack} onStartActivity={(m) => { setActivityMode(m); setView('activite'); }} />;
} else if (view === 'activite') {
// Une activité cardio se comporte comme une séance : pas de barre de
// navigation, on en sort par « Terminer » ou par la flèche.
screen = <ActivityScreen mode={activityMode} onBack={() => setView('cardio')} />;
} else if (view === 'catalogue') {
screen = <CatalogueScreen onBack={handleBack} />;
} else if (view === 'exercices') {
screen = <ExercicesScreen onBack={handleBack} />;
} else if (view === 'poids') {
screen = <PoidsScreen onBack={handleBack} />;
} else if (view === 'coach') {
screen = <CoachScreen onBack={handleBack} />;
} else if (view === 'profil') {
screen = <ProfilScreen onBack={handleBack} />;
} else if (view === 'auth') {
screen = <AuthScreen onBack={handleBackFromAccount} initialMode={recoveryPending ? 'reset' : undefined} />;
} else if (view === 'settings') {
screen = (
<SettingsScreen
initialCategory={settingsInitialCategory}
onBack={handleBackFromSettings}
onOpenAccount={handleOpenAccount}
onRestartQuiz={() => { setView(settingsReturnView); setQuizOpen(true); }}
syncStatus={sync.status}
lastSyncedAt={sync.lastSyncedAt}
/>
);
} else {
{
  // Réglages → Personnalisation → Style de l'interface.
  const Home = uiStyle === 'classique' ? HomeScreenClassic : HomeScreen;
  screen = <Home onOpenSummary={() => setSummaryOpen(true)} onSelectDay={handleSelectDay} onOpenDashboard={handleOpenDashboard} onOpenSettings={() => handleOpenSettings()} onOpenSettingsCategory={handleOpenSettings} />;
}
}

// La barre ne s'affiche jamais pendant une séance (intro/session) — même
// activée dans les Réglages, elle distrairait pendant l'entraînement.
const NAV_VIEWS: View[] = ['home', 'objectifs', 'historique', 'cardio', 'exercices', 'catalogue', 'poids', 'dashboard', 'coach', 'profil', 'settings'];
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
{showNavBar && (
<NavBar
active={activeNavTab}
onNavigate={handleNavigate}
onStartSession={handleStartFromNav}
hasSessionInProgress={!!session && !session.isComplete}
/>
)}
{summaryOpen && (
<DailySummarySheet firstName={trainingProfile?.firstName} state={dailyBrief} onClose={() => setSummaryOpen(false)} />
)}
{splashVisible && <SplashScreen fadingOut={splashFading} firstName={trainingProfile?.firstName} />}
{(!hasCompletedOnboarding || quizOpen) && (
<OnboardingQuiz
initialProfile={trainingProfile}
canDismiss={quizOpen}
onClose={() => setQuizOpen(false)}
/>
)}
{news.length > 0 && <WhatsNewSheet entries={news} onClose={closeNews} />}
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
