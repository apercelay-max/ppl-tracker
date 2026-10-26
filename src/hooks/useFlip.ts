import { RefObject, useLayoutEffect, useRef } from 'react';

// Fait glisser les éléments d'une liste vers leur nouvelle place quand l'ordre
// change, au lieu de les téléporter. Technique « FLIP » :
//   First  : où était chaque élément (mesuré au rendu précédent),
//   Last   : où il est maintenant (mesuré après le rendu),
//   Invert : on le décale visuellement à son ancienne place,
//   Play   : on le laisse glisser jusqu'à sa vraie place.
// Les éléments à suivre portent data-flip="<clé stable>".
//
// `signature` résume l'ordre affiché : on n'anime que quand elle change. La
// position est stockée à chaque rendu (pas seulement quand l'ordre change),
// sinon un bloc dont la hauteur a changé entre-temps ferait un saut au
// premier réordonnancement.
export function useFlip(containerRef: RefObject<HTMLElement>, signature: string): void {
  const before = useRef(new Map<string, { x: number; y: number }>());
  const lastSignature = useRef(signature);

  // Pas de tableau de dépendances : on mesure après chaque rendu (voir ci-dessus).
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const origin = root.getBoundingClientRect();
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const orderChanged = signature !== lastSignature.current;
    lastSignature.current = signature;

    const next = new Map<string, { x: number; y: number }>();
    root.querySelectorAll<HTMLElement>('[data-flip]').forEach((el) => {
      const key = el.dataset.flip as string;
      const r = el.getBoundingClientRect();
      // Positions relatives au conteneur : un défilement de la page ne fausse rien.
      const pos = { x: r.left - origin.left, y: r.top - origin.top };
      next.set(key, pos);
      const prev = before.current.get(key);
      if (!orderChanged || reduced || !prev) return;
      const dx = prev.x - pos.x;
      const dy = prev.y - pos.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
        { duration: 560, easing: 'cubic-bezier(0.3, 1.2, 0.5, 1)' },
      );
    });
    before.current = next;
  });
}
