import { useState, useEffect } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { SessionScreen } from './screens/SessionScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { WorkoutIntroScreen } from './screens/WorkoutIntroScreen';
import { useWorkoutStore } from './store/workoutStore';
import { getAccent } from './data/accents';
import { ICON_SHAPE_RADIUS } from './data/iconPrefs';

type View = 'home' | 'intro' | 'session' | 'dashboard' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  // D'où on est venu quand on ouvre les Réglages, pour y retourner sans
  // jamais toucher à une séance en cours (voir handleOpenSettings).
  const [settingsReturnView, setSettingsReturnView] = useState<View>('home');
  const theme = useWorkoutStore((s) => s.theme);
  const accentTheme = useWorkoutStore((s) => s.accentTheme);
  const customAccentColor = useWorkoutStore((s) => s.customAccentColor);
  const amoledMode = useWorkoutStore((s) => s.amoledMode);
  const fontScale = useWorkoutStore((s) => s.fontScale);
  const iconShape = useWorkoutStore((s) => s.iconShape);
  const highContrast = useWorkoutStore((s) => s.highContrast);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
      // bouton Démarrer), la séance ne démarre qu'au clic.
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

  if (view === 'intro' && selectedDayId) {
    return <WorkoutIntroScreen dayId={selectedDayId} onBack={handleBack} onStart={handleStartWorkout} />;
  }

  if (view === 'session' && selectedDayId) {
    return <SessionScreen dayId={selectedDayId} onBack={handleBack} onOpenSettings={handleOpenSettings} />;
  }

  if (view === 'dashboard') {
    return <DashboardScreen onBack={handleBack} />;
  }

  if (view === 'settings') {
    return <SettingsScreen onBack={handleBackFromSettings} />;
  }

  return <HomeScreen onSelectDay={handleSelectDay} onOpenDashboard={handleOpenDashboard} onOpenSettings={handleOpenSettings} />;
}
