import { useWorkoutStore } from '../store/workoutStore';

/**
 * Classe de fond à poser sur le conteneur d'un écran, selon le réglage
 * Réglages → Apparence → Style de l'interface :
 *  - « classique » : .screen-ambient, le halo de couleur derrière des cartes
 *    en verre (le design d'origine) ;
 *  - « nouveau »  : .app-v2, fond plein et cartes pleines (même palette que
 *    l'accueil et l'écran de séance) ;
 *  - « sport »    : .app-v2 + .ui-sport, la même structure habillée en noir,
 *    chiffres serrés et étiquettes façon montre de sport.
 * Les deux classes sont définies dans index.css.
 */
export const useScreenClass = (): string =>
  useWorkoutStore((s) => (s.uiStyle === 'classique' ? 'screen-ambient' : s.uiStyle === 'sport' ? 'app-v2 ui-sport' : 'app-v2'));
