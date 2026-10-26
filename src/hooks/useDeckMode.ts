import { useEffect, useRef, useState } from 'react';

// Quelle mise en page pour la séance : « vue iPad » (cartes, voir SessionDeck) ou liste.
//
// Le choix ne doit JAMAIS changer en pleine séance à cause d'un à-coup de mesure.
// Sur un iPad, `window.innerWidth` n'est pas une valeur sûre : le zoom (pincement ou
// zoom automatique d'un champ), le clavier, la barre de Safari ou le redimensionnement
// d'une fenêtre la font bouger, parfois d'un seul coup de plus de 100 px. Une seule
// mesure instantanée suffisait à renvoyer l'écran à l'ancienne liste « d'avant ».
// On se protège donc de quatre façons :
//   · on prend la PLUS GRANDE de plusieurs mesures de largeur : un zoom fait baisser
//     l'une d'elles (la largeur visible) mais pas la largeur de mise en page ;
//   · on attend que la largeur soit stable (SETTLE_MS) avant de changer quoi que ce soit ;
//   · on ne change rien tant qu'un champ de saisie a le focus (clavier ouvert) ;
//   · on entre à 900 px mais on ne sort que sous 720 px (vraie fenêtre étroite, ex.
//     écran partagé) : l'écart est large exprès, une fenêtre d'environ 1000 px reste
//     donc dans la vue iPad quoi qu'il arrive.

const DECK_ENTER = 900;
const DECK_LEAVE = 720;
const WIDE_ENTER = 700;
const WIDE_LEAVE = 640;
const SETTLE_MS = 500;

/** Largeur de mise en page, insensible au zoom : la plus grande des mesures disponibles. */
export const layoutWidth = (): number => {
  if (typeof window === 'undefined') return 0;
  const vv = window.visualViewport;
  return Math.max(
    window.innerWidth || 0,
    document.documentElement?.clientWidth || 0,
    vv ? Math.round(vv.width * vv.scale) : 0,
  );
};

export const useScreenMode = (): { isWide: boolean; isDeck: boolean } => {
  const [isDeck, setIsDeck] = useState(() => layoutWidth() >= DECK_ENTER);
  const [isWide, setIsWide] = useState(() => layoutWidth() >= WIDE_ENTER);
  const deckRef = useRef(isDeck);
  const wideRef = useRef(isWide);
  deckRef.current = isDeck;
  wideRef.current = isWide;

  useEffect(() => {
    let timer = 0;
    const evaluate = () => {
      timer = 0;
      // Clavier ouvert : la largeur peut bouger le temps de la saisie. Le « focusout »
      // relance cette vérification dès que le champ est quitté.
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      const w = layoutWidth();
      const deck = deckRef.current ? w >= DECK_LEAVE : w >= DECK_ENTER;
      const wide = wideRef.current ? w >= WIDE_LEAVE : w >= WIDE_ENTER;
      if (deck !== deckRef.current) setIsDeck(deck);
      if (wide !== wideRef.current) setIsWide(wide);
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(evaluate, SETTLE_MS);
    };
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    document.addEventListener('focusout', schedule);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      document.removeEventListener('focusout', schedule);
    };
  }, []);

  // La vue iPad suppose la mise en page « large » : jamais l'une sans l'autre.
  return { isWide: isWide || isDeck, isDeck };
};
