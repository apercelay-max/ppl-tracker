// Registre des commandes de l'Apple Watch (voir widgetSync.ts, syncWatch).
// La logique d'une série validée (record, repos, série suivante) vit dans l'écran de
// séance : il s'enregistre ici tant qu'il est affiché, et la montre déclenche donc
// EXACTEMENT ce que fait le bouton « Valider » du téléphone. Si l'écran n'est pas
// affiché (on est sur un autre onglet), la commande est ignorée et le téléphone
// ouvre la séance : valider une série sans la voir serait trompeur.
export interface WatchHandlers {
  /** Valide la série en cours avec ces valeurs (poids en kg, comme le store). */
  completeSet: (weightKg: string, reps: string) => void;
  skipRest: () => void;
}

let handlers: WatchHandlers | null = null;

export const registerWatchHandlers = (h: WatchHandlers): (() => void) => {
  handlers = h;
  return () => { if (handlers === h) handlers = null; };
};

export const getWatchHandlers = (): WatchHandlers | null => handlers;
