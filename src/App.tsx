import { useState, useEffect } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { SessionScreen } from './screens/SessionScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { useWorkoutStore } from './store/workoutStore';
import { getAccent } from './data/accents';

type View = 'home' | 'session' | 'dashboard' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const theme = useWorkoutStore((s) => s.theme);
  const accentTheme = useWorkoutStore((s) => s.accentTheme);
  const fontScale = useWorkoutStore((s) => s.fontScale);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const accent = getAccent(accentTheme);
    const root = document.documentElement.style;
    root.setProperty('--brand-1', accent.c1);
    root.setProperty('--brand-2', accent.c2);
    root.setProperty('--brand-1-rgb', accent.rgb1);
  }, [accentTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', fontScale);
  }, [fontScale]);

  const handleSelectDay = (dayId: string) => {
    const state = useWorkoutStore.getState();
    if (!state.session || state.session.dayId !== dayId || state.session.isComplete) {
      state.startSession(dayId);
    }
    setSelectedDayId(dayId);
    setView('session');
  };

  const handleBack = () => {
    setView('home');
  };

  const handleOpenDashboard = () => {
    setView('dashboard');
  };

  const handleOpenSettings = () => {
    setView('settings');
  };

  if (view === 'session' && selectedDayId) {
    return <SessionScreen dayId={selectedDayId} onBack={handleBack} />;
  }

  if (view === 'dashboard') {
    return <DashboardScreen onBack={handleBack} />;
  }

  if (view === 'settings') {
    return <SettingsScreen onBack={handleBack} />;
  }

  return <HomeScreen onSelectDay={handleSelectDay} onOpenDashboard={handleOpenDashboard} onOpenSettings={handleOpenSettings} />;
}
