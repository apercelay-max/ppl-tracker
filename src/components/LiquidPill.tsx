import React, { useLayoutEffect, useRef } from 'react';

interface LiquidPillProps {
  style?: React.CSSProperties;
  children: React.ReactNode;
  role?: string;
  'aria-label'?: string;
}

// Sélecteur en pastille (thème, style de l'interface…) dont le fond glisse d'un
// choix à l'autre en s'étirant comme une goutte, au lieu de sauter. C'est le même
// geste que la bulle de la barre du bas (voir NavBar.tsx).
//
// Le composant ne connaît pas les choix : il repère le bouton marqué
// aria-pressed="true" parmi ses enfants et glisse sous lui. Les boutons gardent
// donc leur logique, il suffit qu'ils déclarent leur état (accessibilité comprise).
export const LiquidPill: React.FC<LiquidPillProps> = ({ style, children, ...aria }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const last = useRef<{ x: number; w: number } | null>(null);

  // Sans tableau de dépendances : on remesure à chaque rendu, puisque c'est
  // justement un changement d'enfant (autre bouton pressé) qui doit déplacer la bulle.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const bubble = bubbleRef.current;
    if (!wrap || !bubble) return;
    const pressed = wrap.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!pressed) { bubble.style.opacity = '0'; return; }
    const x = pressed.offsetLeft;
    const w = pressed.offsetWidth;
    bubble.style.opacity = '1';
    const prev = last.current;
    last.current = { x, w };
    const apply = () => { bubble.style.left = `${x}px`; bubble.style.width = `${w}px`; };
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!prev || reduced || (prev.x === x && prev.w === w)) { apply(); return; }
    // Étirement : la bulle couvre l'ancien ET le nouveau choix à mi-course.
    const lo = Math.min(prev.x, x);
    const span = Math.max(prev.x + prev.w, x + w) - lo;
    bubble.getAnimations().forEach((a) => a.cancel());
    bubble.animate(
      [
        { left: `${prev.x}px`, width: `${prev.w}px` },
        { left: `${lo}px`, width: `${span}px`, offset: 0.45 },
        { left: `${x}px`, width: `${w}px` },
      ],
      { duration: 480, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    );
    apply();
  });

  return (
    <div ref={wrapRef} className="lp" style={{ ...style, position: 'relative' }} {...aria}>
      <div ref={bubbleRef} className="lp-bubble" aria-hidden="true" />
      {children}
    </div>
  );
};
