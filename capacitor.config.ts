import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ppltracker.app',
  appName: 'PPL Tracker',
  webDir: 'dist',
  // Fond de la page avant que l'appli ne s'affiche : le même sombre que l'écran de démarrage,
  // sinon un éclair blanc apparaît entre les deux.
  backgroundColor: '#131318',
};

export default config;
