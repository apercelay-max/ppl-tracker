import { RefObject, useEffect } from 'react';
import type { ScrollTilt } from '../store/workoutStore';

// Effet de profondeur au défilement : la carte qui entre par le bas de l'écran
// bascule en arrière (son bas s'enfonce vers le fond) et se redresse à plat à
// mesure qu'elle remonte. Une seule carte est touchée à la fois, celle qui
// vient d'apparaître en bas de l'écran ; les autres restent à plat.
//
// Deux styles (Réglages → Style de l'interface → Effet au défilement) :
//  - « recul »      : toute la carte recule, rapetisse, pâlit et se floute un peu ;
//  - « balancoire » : la carte pivote vers son milieu (le haut avance, le bas
//                     s'enfonce) et s'écrase en hauteur.
// Dans les deux cas le bord du haut reste exactement à sa place : la carte
// reste « collée » à celle du dessus pendant qu'elle s'éloigne.

const MAX_ANGLE = 85;    // degrés, quand la carte vient d'apparaître tout en bas de l'écran
const ZONE = 96;         // px : distance, depuis le bas de l'écran, sur laquelle la carte se redresse
const RECUL_DEPTH = 2;   // « recul » : recul maximal, en hauteurs de carte
const RECUL_BLUR = 1.6;  // « recul » : flou maximal, en px
const RECUL_FADE = 0.6;  // « recul » : opacité perdue au maximum
const PIVOT = 0.6;       // « balancoire » : le pivot est à 60 % de la hauteur, en partant du haut
const SQUASH = 0.4;      // « balancoire » : écrasement maximal en hauteur

type TiltMode = Exclude<ScrollTilt, 'off'>;

// Les propriétés qu'on pose sur une carte. On les pose avec !important : certaines
// cartes ont une animation d'entrée (.slide-up) et une transition (.workout-card)
// sur transform, et une animation l'emporte sur un style en ligne ordinaire. La
// transition est coupée le temps de l'effet, sinon chaque image serait « lissée »
// sur 150 ms et le haut de la carte ne resterait plus en place.
const PROPS = ['transform', 'transform-origin', 'filter', 'opacity', 'transition'] as const;

// Ce que la carte avait avant qu'on y touche (valeur et priorité), pour le lui rendre
// tel quel : un `opacity` posé par React sur une carte « déjà faite » ne doit pas disparaître.
const saved = new WeakMap<HTMLElement, Record<string, [string, string]>>();

function setImportant(el: HTMLElement, prop: (typeof PROPS)[number], value: string): void {
  el.style.setProperty(prop, value, 'important');
}

function reset(el: HTMLElement): void {
  const before = saved.get(el);
  if (!before) return;
  saved.delete(el);
  PROPS.forEach((prop) => {
    const [value, priority] = before[prop];
    if (value) el.style.setProperty(prop, value, priority);
    else el.style.removeProperty(prop);
  });
}

// hc : hauteur de la carte ; e : avancement de l'effet, de 0 (à plat) à 1 (carte à peine apparue).
function apply(el: HTMLElement, mode: TiltMode, hc: number, e: number): void {
  if (!saved.has(el)) {
    const snapshot: Record<string, [string, string]> = {};
    PROPS.forEach((prop) => { snapshot[prop] = [el.style.getPropertyValue(prop), el.style.getPropertyPriority(prop)]; });
    saved.set(el, snapshot);
  }
  const angle = MAX_ANGLE * e;
  // Perspective proportionnelle à la carte : le rendu garde la même allure
  // qu'elle fasse 80 px ou 400 px de haut.
  const persp = Math.max(520, hc * 6.2);
  setImportant(el, 'transition', 'none');

  if (mode === 'recul') {
    // Pivot en haut de la carte : son bord du haut ne bouge pas.
    setImportant(el, 'transform-origin', '50% 0');
    setImportant(el, 'transform', `perspective(${persp}px) translateZ(${-RECUL_DEPTH * hc * e}px) rotateX(${-angle}deg)`);
    setImportant(el, 'filter', `blur(${RECUL_BLUR * e}px)`);
    setImportant(el, 'opacity', String(1 - RECUL_FADE * e));
    return;
  }

  // Balançoire : le pivot au milieu ferait glisser le bord du haut vers le bas
  // (un trou apparaîtrait sous la carte du dessus). On calcule où ce bord finit
  // après rotation et perspective, et on le replace à sa place d'origine.
  const squash = 1 - SQUASH * e;
  const rad = (angle * Math.PI) / 180;
  const topY = -PIVOT * hc * squash;                        // le bord du haut, par rapport au pivot
  const topZ = PIVOT * hc * squash * Math.sin(rad);         // et sa distance vers l'avant
  const projectedTopY = topY * Math.cos(rad) * (persp / (persp - topZ));
  const shiftY = -PIVOT * hc - projectedTopY;
  setImportant(el, 'transform-origin', `50% ${PIVOT * 100}%`);
  setImportant(el, 'transform', `translateY(${shiftY}px) perspective(${persp}px) rotateX(${-angle}deg) scaleY(${squash})`);
}

// Le conteneur qui défile : le premier parent dont overflow-y est auto ou scroll.
// Sans lui (écran qui ne défile pas, ex. la rangée horizontale de l'iPad en
// paysage) il n'y a rien à faire.
function findScroller(el: HTMLElement): HTMLElement | null {
  for (let n = el.parentElement; n; n = n.parentElement) {
    const overflowY = getComputedStyle(n).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return n;
  }
  return null;
}

/**
 * @param contentRef   un élément à l'intérieur du conteneur qui défile (on remonte jusqu'à lui)
 * @param mode         'off' désactive l'effet
 * @param itemSelector les cartes concernées. Si l'une en contient une autre (un bloc qui
 *                     rassemble plusieurs cartes), seules les cartes du dedans comptent.
 * @param enabled      false pour suspendre l'effet (ex. mode édition de l'accueil)
 */
export function useScrollTilt(
  contentRef: RefObject<HTMLElement>,
  mode: ScrollTilt,
  itemSelector: string,
  enabled = true,
): void {
  useEffect(() => {
    const root = contentRef.current;
    if (!root || mode === 'off' || !enabled) return;
    // Même règle que useFlip : si l'appareil demande moins d'animations, on s'abstient.
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const scroller = findScroller(root);
    if (!scroller) return;

    // Une carte qui s'élargit un peu en avançant ne doit pas faire apparaître de
    // défilement horizontal.
    const previousOverflowX = scroller.style.overflowX;
    scroller.style.overflowX = 'hidden';

    const leafItems = () => Array.from(root.querySelectorAll<HTMLElement>(itemSelector))
      .filter((el) => !el.querySelector(itemSelector));

    let raf = 0;
    const update = () => {
      raf = 0;
      const viewH = scroller.clientHeight;
      const viewTop = scroller.getBoundingClientRect().top;
      // On mesure tout avant d'écrire quoi que ce soit : mélanger lectures et
      // écritures forcerait le navigateur à recalculer la mise en page à chaque carte.
      // Le haut d'une carte ne bouge jamais (voir apply), donc sa mesure reste fiable
      // même quand la carte est déjà inclinée.
      const measured = leafItems().map((el) => ({ el, hc: el.offsetHeight, y: el.getBoundingClientRect().top - viewTop }));
      measured.forEach(({ el, hc, y }) => {
        // L'effet suit le HAUT de la carte : il commence quand ce bord est à ZONE px
        // du bas de l'écran (carte à plat) et atteint son maximum quand le bord
        // touche le bas (carte à peine entrée). Ainsi une carte très haute ne reste
        // pas couchée tant qu'elle n'est pas entièrement visible.
        // La zone ne dépasse jamais la hauteur de la carte : deux cartes ne peuvent
        // donc pas être inclinées en même temps.
        const zone = Math.min(hc, ZONE);
        const p = zone > 0 ? Math.min(1, Math.max(0, (y - (viewH - zone)) / zone)) : 0;
        const e = p * p * (3 - 2 * p);
        if (e < 0.001) reset(el); else apply(el, mode, hc, e);
      });
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };

    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Le contenu change de hauteur (« Tout voir », mode édition…) sans que rien ne défile.
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    observer?.observe(root);
    observer?.observe(scroller);
    schedule();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
      scroller.style.overflowX = previousOverflowX;
      leafItems().forEach(reset);
    };
  }, [contentRef, mode, itemSelector, enabled]);
}
