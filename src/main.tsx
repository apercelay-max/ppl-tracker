import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// Polices intégrées à l'appli (et non chargées depuis Google Fonts) : elles marchent hors
// ligne, dans une salle sans réseau, et aucune adresse IP n'est envoyée à Google.
import '@fontsource/barlow/latin-600.css';
import '@fontsource/barlow/latin-700.css';
import '@fontsource/barlow/latin-800.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import '@fontsource/jetbrains-mono/latin-700.css';

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
