import { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { SessionScreen } from './screens/SessionScreen';
import { useWorkoutStore } from './store/workoutStore';

type View = 'home' | 'session';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const handleSelectDay = (dayId: string) => {
    // Start session immediately so SessionScreen never hits the loading state.
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

  if (view === 'session' && selectedDayId) {
    return <SessionScreen dayId={selectedDayId} onBack={handleBack} />;
  }

  return <HomeScreen onSelectDay={handleSelectDay} />;
}
