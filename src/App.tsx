import { useState, useEffect } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { SessionScreen } from './screens/SessionScreen';
import { useWorkoutStore } from './store/workoutStore';

type View = 'home' | 'session';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const theme = useWorkoutStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
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

  if (view === 'session' && selectedDayId) {
    return <SessionScreen dayId={selectedDayId} onBack={handleBack} />;
  }
  return <HomeScreen onSelectDay={handleSelectDay} />;
}
