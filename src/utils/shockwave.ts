// Onde de choc : un anneau part d'un élément (la barre de repos qui vient de se poser)
// et grandit sur tout l'écran ; chaque bloc de l'écran est repoussé un court instant
// quand l'onde le traverse, puis revient exactement à sa place.
//
// Pas de filtre SVG de déformation : sur un iPad, redessiner tout l'écran à chaque image
// saccade, et Safari gère mal ces filtres sur du contenu HTML. Ici on n'anime que les
// propriétés `translate` et `scale` de quelques blocs (elles s'ajoutent à leur
// `transform` sans l'écraser) et on fait grandir un anneau par `transform` : ce sont des
// mouvements que le processeur graphique sait faire seul.

// Blocs qui bougent au passage de l'onde (vue iPad de la séance).
export const SHOCKWAVE_TARGETS = [
  '.sv2-header-row',
  '.sv2-prog',
  '.deck-side-inner',
  '.deck-info > div',
  '.deck-ctl > button',
  '.deck-pill',
  '.deck-slot.is-center .deck-slot-inner > * > *',
].join(', ');

const SPEED = 1.1;        // vitesse de l'onde (px par milliseconde)
const PUSH = 9;           // décalage maximal d'un bloc (px), près de l'origine
const PUSH_DURATION = 520;

const reduceMotion = (): boolean => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const fireShockwave = (origin: HTMLElement | null, targetSelector: string = SHOCKWAVE_TARGETS): void => {
  if (!origin || typeof document === 'undefined' || typeof origin.animate !== 'function' || reduceMotion()) return;

  const o = origin.getBoundingClientRect();
  const ox = o.left + o.width / 2;
  const oy = o.top + o.height / 2;
  const reach = Math.hypot(Math.max(ox, window.innerWidth - ox), Math.max(oy, window.innerHeight - oy));
  const total = reach / SPEED;

  // L'anneau : un disque dont seul le bord est visible, qui grandit à vitesse constante.
  const ring = document.createElement('div');
  ring.className = 'shock-ring';
  ring.style.left = `${ox - reach}px`;
  ring.style.top = `${oy - reach}px`;
  ring.style.width = ring.style.height = `${reach * 2}px`;
  document.body.appendChild(ring);
  const ringAnim = ring.animate(
    [
      { transform: 'scale(0.01)', opacity: 0.9 },
      { transform: 'scale(0.5)', opacity: 0.45, offset: 0.5 },
      { transform: 'scale(1)', opacity: 0 },
    ],
    { duration: total, easing: 'linear' },
  );
  ringAnim.onfinish = () => ring.remove();
  ringAnim.oncancel = () => ring.remove();

  // Les blocs : repoussés à l'opposé de l'origine quand l'anneau passe sur eux, puis
  // un léger contrecoup, puis retour à zéro (l'écran se remet comme avant).
  document.querySelectorAll<HTMLElement>(targetSelector).forEach((el) => {
    if (el === origin || el.contains(origin) || origin.contains(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const dx = r.left + r.width / 2 - ox;
    const dy = r.top + r.height / 2 - oy;
    const d = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / d;
    const uy = dy / d;
    const amp = PUSH / (1 + d / 600);   // plus fort près de l'origine
    el.animate(
      [
        { translate: '0 0', scale: '1' },
        { translate: `${ux * amp}px ${uy * amp}px`, scale: '1.014', offset: 0.4 },
        { translate: `${-ux * amp * 0.35}px ${-uy * amp * 0.35}px`, scale: '0.996', offset: 0.75 },
        { translate: '0 0', scale: '1' },
      ],
      { duration: PUSH_DURATION, delay: Math.max(0, d / SPEED - 80), easing: 'ease-out' },
    );
  });
};
