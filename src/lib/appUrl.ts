import { Capacitor } from '@capacitor/core';

// Dans l'appli iPhone, la page tourne sur « capacitor://localhost » : une adresse
// relative comme /api/coach ou window.location.origin ne désigne plus le serveur.
// Tout ce qui doit joindre ou pointer vers le site passe donc par ici.
const WEB_ORIGIN = 'https://ppl-tracker-puce.vercel.app';

export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

/** Adresse du site : celle du navigateur sur le web, le site publié dans l'appli iPhone. */
export const webOrigin = (): string => (isNativeApp() ? WEB_ORIGIN : window.location.origin);
