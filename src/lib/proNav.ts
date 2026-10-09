// Ouvre l'écran des formules depuis n'importe quel écran (App.tsx enregistre l'ouverture).
let opener: (() => void) | null = null;
export const setProOpener = (fn: (() => void) | null): void => { opener = fn; };
export const openProScreen = (): void => { opener?.(); };
