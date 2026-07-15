import { useState, useEffect } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { SessionScreen } from './screens/SessionScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { useWorkoutStore } from './store/workoutStore';
import { applyTheme } from './data/themes';

type View = 'home' | 'session' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const theme = useWorkoutStore((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
    if (theme === 'system' && typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => applyTheme('system');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
  }, [theme]);

  const handleSelectDay = (dayId: string) => {
    const state = useWorkoutStore.getState();
    if (!state.session || state.session.dayId !== dayId || state.session.isComplete) {
      state.startSession(dayId);
    }
    setSelectedDayId(dayId);
    setView('session');
  };

  const handleBack = () => setView('home');

  if (view === 'settings') {
    return <SettingsScreen onBack={handleBack} />;
  }
  if (view === 'session' && selectedDayId) {
    return <SessionScreen dayId={selectedDayId} onBack={handleBack} />;
  }
  return <HomeScreen onSelectDay={handleSelectDay} onOpenSettings={() => setView('settings')} />;
}
