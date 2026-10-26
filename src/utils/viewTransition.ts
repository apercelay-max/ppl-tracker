import { flushSync } from 'react-dom';

interface ViewTransitionLike {
  ready?: Promise<void>;
  finished?: Promise<void>;
  updateCallbackDone?: Promise<void>;
}

// Change d'écran avec une transition du navigateur (API View Transitions, iOS 18+) :
// les éléments portant le même `view-transition-name` d'un écran à l'autre se
// déplacent de l'un à l'autre au lieu d'être remplacés (le titre de la séance
// glisse de la carte de l'accueil vers l'écran d'aperçu, voir index.css).
// Sans l'API, ou si l'animation est réduite, on change d'écran tout de suite.
//
// flushSync : le navigateur doit voir le nouvel écran DÈS la fin du callback,
// sinon il photographie l'ancien écran deux fois et l'effet ne se joue pas.
//
// Filet de sécurité : le navigateur n'appelle le callback qu'une fois une image
// affichée. Si aucune image ne vient (page masquée, appareil en économie
// d'énergie), un toucher resterait sans effet. Au bout de 600 ms on applique donc
// le changement nous-mêmes ; `applied` garantit qu'il n'a lieu qu'une fois.
export function transitionTo(update: () => void): void {
  const start = (document as unknown as { startViewTransition?: (cb: () => void) => ViewTransitionLike }).startViewTransition;
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!start || reduced) { update(); return; }

  let applied = false;
  const run = () => { if (applied) return; applied = true; flushSync(update); };
  const transition = start.call(document, run);
  // Une transition sautée (une autre démarre, page masquée) rejette ces promesses :
  // ce n'est pas une erreur, le changement d'écran a eu lieu quand même.
  transition.ready?.catch(() => {});
  transition.finished?.catch(() => {});
  transition.updateCallbackDone?.catch(() => {});
  window.setTimeout(run, 600);
}
