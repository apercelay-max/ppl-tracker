import { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { SessionScreen } from './screens/SessionScreen';

type View = 'home' | 'session';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const handleSelectDay = (dayId: string) => {
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
