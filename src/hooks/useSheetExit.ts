import { useCallback, useEffect, useRef, useState } from 'react';

const EXIT_MS = 260;

// Donne une SORTIE aux fenêtres et feuilles : elles apparaissaient en douceur mais
// disparaissaient d'un coup, parce que le parent les retire dès que `onClose` est
// appelé. Ici on joue d'abord l'animation de sortie (classe is-closing, voir
// index.css), et `onClose` n'est appelé qu'ensuite.
// Sans animation possible (animation réduite), on ferme tout de suite : la fermeture
// ne dépend jamais de l'animation.
export function useSheetExit(onClose: () => void): { closing: boolean; close: () => void } {
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  const close = useCallback(() => {
    if (timer.current !== null) return; // déjà en train de se fermer : un second toucher ne doit rien relancer
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { onClose(); return; }
    setClosing(true);
    timer.current = window.setTimeout(onClose, EXIT_MS);
  }, [onClose]);

  return { closing, close };
}
