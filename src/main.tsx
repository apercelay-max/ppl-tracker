import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { useWorkoutStore } from './store/workoutStore';
import { startWidgetSync } from './lib/widgetSync';

// Widget iOS (sans effet hors de l'app native).
startWidgetSync();

// Plusieurs onglets / la PWA et le navigateur partagent le même stockage : sans
// ça, chacun écrase silencieusement les données de l'autre à sa prochaine écriture.
window.addEventListener('storage', (e) => {
  if (e.key === 'ppl-tracker-store' && e.newValue) void useWorkoutStore.persist.rehydrate();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
