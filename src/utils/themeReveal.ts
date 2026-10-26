// Changement de thème en « révélation circulaire » : le nouveau thème part du
// point touché (le bouton lune/soleil) et s'étend jusqu'aux coins de l'écran.
//
// On s'appuie sur l'API View Transitions : le navigateur photographie l'ancien
// écran, applique le changement, puis nous laisse animer l'apparition du nouveau.
// Safari l'a depuis iOS 18 ; ailleurs (ou si l'utilisateur a réduit les
// animations) le thème change d'un coup, comme avant — rien ne casse.

interface ViewTransitionLike { ready: Promise<void> }
type StartViewTransition = (update: () => void) => ViewTransitionLike;

// Dernier toucher : sert d'origine du cercle. Écouté dès l'import, en phase de
// capture, pour être à jour même si le bouton arrête la propagation de l'événement.
let lastTap: { x: number; y: number; t: number } | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => { lastTap = { x: e.clientX, y: e.clientY, t: Date.now() }; }, { capture: true, passive: true });
}

export function revealTheme(apply: () => void): void {
  const start = (document as unknown as { startViewTransition?: StartViewTransition }).startViewTransition;
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!start || reduced) { apply(); return; }

  // Un changement de thème sans toucher récent (suivi du mode « Système », par
  // exemple) part du centre plutôt que d'un vieux point sans rapport.
  const recent = lastTap && Date.now() - lastTap.t < 800 ? lastTap : null;
  const x = recent ? recent.x : window.innerWidth / 2;
  const y = recent ? recent.y : window.innerHeight / 2;
  // Rayon qui atteint le coin le plus éloigné : le cercle couvre tout l'écran à la fin.
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  const transition = start.call(document, apply);
  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
    );
  }).catch(() => { /* transition annulée (autre changement en cours) : le thème est déjà appliqué */ });
}
