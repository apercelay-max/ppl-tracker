import React, { useEffect } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import type { DotAnimation, DotDensity, DotSize } from '../store/workoutStore';
import { layoutText } from '../data/dotFont';

// Moteur du style « Points » : il repère les gros textes de l'écran et les redessine en
// petits points lumineux, SANS toucher à la mise en page.
//
// Principe :
//  - le vrai texte reste en place, rendu invisible (classe dp-t, voir index.css) : les
//    lecteurs d'écran, la sélection et la mise en page ne changent pas ;
//  - un <canvas> posé juste après l'élément dessine les points à sa place ;
//  - chaque texte garde SA largeur d'origine : la taille des points s'ajuste pour que
//    le texte tienne dans la place qu'il occupait. Si les points deviendraient trop
//    petits pour être lisibles, le texte reste un texte normal, net : mieux vaut un
//    petit libellé clair qu'un grain illisible ;
//  - les champs de saisie (poids, reps) sont recopiés en points au fil de la frappe.

interface Settings { density: DotDensity; size: DotSize; anim: DotAnimation }

interface Item {
  id: number;
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  key: string;                     // change => il faut recalculer les points
  dots: { x: number; y: number }[];
  p: number; W: number; H: number; // pas de la grille, taille du dessin (px CSS)
  color: [number, number, number];
  calm: boolean;                   // texte de la séance : les points restent posés
  active: boolean;                 // false : texte trop petit, affiché normalement
}

const MAX_ITEMS = 80;
const EXCLUDE = '[data-no-dots], script, style, textarea, svg, canvas';
const SIZE_FACTOR: Record<DotSize, number> = { m: 0.12, l: 0.155, xl: 0.2 };
const hash = (i: number): number => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function parseColor(css: string): [number, number, number] {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return [255, 255, 255];
  const parts = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  if (parts.length >= 4 && parts[3] === 0) return [255, 255, 255]; // texte à dégradé : transparent
  return [parts[0] ?? 255, parts[1] ?? 255, parts[2] ?? 255];
}

interface Effect { a: number; s: number; l: number; hue: number | null }
const fx: Effect = { a: 1, s: 1, l: 0, hue: null };

// Un effet donne, pour un point à la position écran (gx, gy) et à l'instant T :
// son opacité, sa taille, son éclat et éventuellement sa teinte. Les positions sont celles
// de l'ÉCRAN : une vague ou un balayage traverse tous les textes comme une seule surface.
function effect(anim: DotAnimation, T: number, gx: number, gy: number, id: number): Effect {
  fx.a = 1; fx.s = 1; fx.l = 0; fx.hue = null;
  if (anim === 'pop') {
    const cyc = T % 5.4;
    const tt = cyc - (gx * 0.0018 + gy * 0.0011);
    if (tt < 0) { fx.a = 0; return fx; }
    fx.a = Math.min(1, tt * 7);
    fx.s = 1 + 0.9 * Math.exp(-tt * 5) * Math.cos(tt * 15);
    fx.l = Math.exp(-tt * 4);
    if (cyc > 4.5) fx.a *= Math.max(0, 1 - (cyc - 4.5) / 0.7);
  } else if (anim === 'scan') {
    const u = gx * 0.8 + gy * 0.6;
    const pos = ((T * 190) % 1100) - 120;
    const b = Math.exp(-((u - pos) * (u - pos)) / (2 * 45 * 45));
    fx.a = 0.5 + 0.5 * b; fx.s = 0.88 + 0.4 * b; fx.l = b;
  } else if (anim === 'pulse') {
    const w = 0.5 + 0.5 * Math.sin(T * 2.6 - gy * 0.006);
    fx.a = 0.5 + 0.5 * w; fx.s = 0.85 + 0.25 * w; fx.l = w * 0.3;
  } else if (anim === 'wave') {
    const m = (Math.sin(gx * 0.022 + gy * 0.016 - T * 3.2) + 1) / 2;
    fx.a = 0.6 + 0.4 * m; fx.s = 0.88 + 0.28 * m; fx.hue = 354 + m * 36;
  } else if (anim === 'ripple') {
    const d = Math.abs(Math.hypot(gx - window.innerWidth / 2, gy - window.innerHeight * 0.45) - ((T * 240) % 1000));
    const b = Math.exp(-(d * d) / (2 * 34 * 34));
    fx.a = 0.5 + 0.5 * b; fx.s = 0.85 + 0.5 * b; fx.l = b;
  } else if (anim === 'twinkle') {
    const b = Math.pow(0.5 + 0.5 * Math.sin(T * 3 + hash(id) * 50), 14);
    fx.a = 0.8 + 0.2 * b; fx.s = 1 + 0.6 * b; fx.l = b;
  }
  return fx;
}

function startEngine(): () => void {
  const root = document.getElementById('root');
  if (!root) return () => {};
  const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(3, window.devicePixelRatio || 2);
  const T0 = performance.now();

  const read = (): Settings => {
    const s = useWorkoutStore.getState();
    return { density: s.dotDensity, size: s.dotSize, anim: reduced ? 'none' : s.dotAnimation };
  };
  let settings = read();
  const items = new Map<HTMLElement, Item>();
  const parentsMoved = new Map<HTMLElement, number>(); // parent -> nombre de textes qui s'y appuient
  let nextId = 1;
  let raf = 0;
  let last = 0;
  let timer: number | null = null;
  let fallback: number | null = null;

  // Le canvas est posé en position absolue dans le parent du texte : celui-ci doit donc
  // être « positionné ». On ne le change que s'il ne l'était pas, et on le remet à la fin.
  const holdParent = (parent: HTMLElement) => {
    const n = parentsMoved.get(parent) ?? 0;
    if (n === 0 && getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
      parent.dataset.dpPos = '1';
    }
    parentsMoved.set(parent, n + 1);
  };
  const releaseParent = (parent: HTMLElement | null) => {
    if (!parent) return;
    const n = (parentsMoved.get(parent) ?? 1) - 1;
    if (n <= 0) {
      parentsMoved.delete(parent);
      if (parent.dataset.dpPos) { parent.style.position = ''; delete parent.dataset.dpPos; }
    } else parentsMoved.set(parent, n);
  };

  const dispose = (item: Item) => {
    item.canvas.remove();
    item.el.classList.remove('dp-t');
    releaseParent(item.el.parentElement);
    items.delete(item.el);
  };

  const create = (el: HTMLElement) => {
    const parent = el.parentElement;
    if (!parent) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'dp-c';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    holdParent(parent);
    el.after(canvas);
    items.set(el, {
      id: nextId++, el, canvas, ctx, key: '', dots: [], p: 0, W: 0, H: 0,
      color: [255, 255, 255], calm: !!el.closest('.session-v2'), active: false,
    });
  };

  // Recalcule les points d'un texte quand son contenu, sa place ou les réglages changent.
  const layout = (item: Item): void => {
    const el = item.el;
    const text = el instanceof HTMLInputElement ? el.value : (el.textContent ?? '');
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const key = `${text}|${w}|${h}|${el.offsetLeft}|${el.offsetTop}|${settings.size}${settings.density}`;
    if (key === item.key) return;
    item.key = key;

    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize) || 16;
    const L = layoutText(text);
    const exp = settings.density === 'complet' ? 1.15 : 1;
    const p = Math.min(fs * SIZE_FACTOR[settings.size], (w * exp) / L.cols, (h * 1.3) / L.rows);
    const minP = settings.density === 'complet' ? 1.8 : 2.3;
    if (!text.trim() || w === 0 || p < minP) {
      item.active = false;
      item.canvas.style.display = 'none';
      el.classList.remove('dp-t');
      return;
    }
    item.active = true;
    item.p = p;
    item.W = L.cols * p;
    item.H = L.rows * p;
    item.dots = L.dots.map((d) => ({ x: (d.x + 0.5) * p, y: (d.y + 0.5) * p }));
    item.color = parseColor(cs.color);
    item.calm = !!el.closest('.session-v2');
    const c = item.canvas;
    c.width = Math.ceil(item.W * dpr);
    c.height = Math.ceil(item.H * dpr);
    c.style.width = `${item.W}px`;
    c.style.height = `${item.H}px`;
    c.style.left = `${el.offsetLeft + (w - item.W) / 2}px`;
    c.style.top = `${el.offsetTop + (h - item.H) / 2}px`;
    c.style.display = 'block';
    el.classList.add('dp-t');
  };

  const draw = (item: Item, T: number) => {
    const el = item.el;
    const r = el.getBoundingClientRect();
    if (r.bottom < -60 || r.top > window.innerHeight + 60) return; // hors écran : rien à dessiner
    const { ctx, p } = item;
    const gx0 = r.left + (r.width - item.W) / 2;
    const gy0 = r.top + (r.height - item.H) / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, item.W, item.H);
    const [r0, g0, b0] = item.color;
    const lift = item.calm ? 0.2 : 0.15;
    for (let i = 0; i < item.dots.length; i++) {
      const q = item.dots[i];
      const f = effect(settings.anim, T, gx0 + q.x, gy0 + q.y, item.id * 1000 + i);
      let a = f.a; let s = f.s; let l = f.l;
      if (item.calm) { a = Math.max(a, 0.92); s = 1 + (s - 1) * 0.15; l *= 0.4; }
      if (a <= 0.01) continue;
      const k = Math.min(1, l * 0.8 + lift);
      ctx.fillStyle = f.hue !== null && !item.calm
        ? `hsla(${f.hue % 360},88%,58%,${Math.min(1, a)})`
        : `rgba(${Math.round(r0 + (255 - r0) * k)},${Math.round(g0 + (255 - g0) * k)},${Math.round(b0 + (255 - b0) * k)},${Math.min(1, a)})`;
      ctx.beginPath();
      ctx.arc(q.x, q.y, p * 0.46 * s, 0, Math.PI * 2);
      ctx.fill();
      if (f.l > 0.55 && !item.calm) {
        ctx.globalAlpha = (f.l - 0.55) * 0.5;
        ctx.beginPath();
        ctx.arc(q.x, q.y, p * 0.46 * s * 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  };

  // Repère les textes à mettre en points : feuilles de texte courtes (un seul nœud
  // texte), assez grandes pour que des points soient lisibles.
  const discover = () => {
    const minFont = settings.density === 'complet' ? 14 : 20;
    const found = new Map<HTMLElement, number>();
    const consider = (el: HTMLElement) => {
      if (el.closest(EXCLUDE)) return;
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      if (fs < minFont || cs.display === 'none' || cs.visibility === 'hidden' || el.offsetWidth === 0) return;
      found.set(el, fs);
    };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null = walker.nextNode();
    let scanned = 0;
    while (node && scanned < 6000) {
      scanned++;
      const txt = node.nodeValue?.trim() ?? '';
      const el = node.parentElement;
      if (txt && txt.length <= 26 && el && el.childNodes.length === 1) consider(el);
      node = walker.nextNode();
    }
    root.querySelectorAll<HTMLInputElement>('input[inputmode]').forEach((inp) => { if (inp.value) consider(inp); });

    const keep = [...found.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_ITEMS).map(([el]) => el);
    const keepSet = new Set(keep);
    [...items.values()].forEach((it) => { if (!keepSet.has(it.el) || !it.el.isConnected) dispose(it); });
    keep.forEach((el) => { if (!items.has(el)) create(el); });
  };

  // Une passe : recalcule les points qui ont changé et redessine. `force` ignore la cadence
  // (appelé juste après le repérage, pour que les points apparaissent sans attendre).
  const step = (now: number, force: boolean) => {
    if (document.hidden && !force) return;
    // Sans animation les points ne bougent pas : on vérifie seulement de temps en temps
    // si un texte a changé, au lieu de redessiner à chaque image.
    const gap = settings.anim === 'none' ? 250 : 33;
    if (!force && now - last < gap) return;
    last = now;
    const T = (now - T0) / 1000;
    for (const item of [...items.values()]) {
      if (!item.el.isConnected) { dispose(item); continue; }
      const before = item.key;
      layout(item);
      if (item.active && (force || settings.anim !== 'none' || item.key !== before)) draw(item, T);
    }
  };
  // Boucle : requestAnimationFrame quand le navigateur affiche des images, et un filet à
  // 120 ms quand il n'en fournit pas (page masquée ou en économie d'énergie) : les points
  // ne dépendent jamais d'une image pour exister.
  function tick() {
    cancelAnimationFrame(raf);
    if (fallback !== null) window.clearTimeout(fallback);
    step(performance.now(), false);
    schedule();
  }
  function schedule() {
    raf = requestAnimationFrame(tick);
    fallback = window.setTimeout(tick, 120);
  }

  // Nouvelles lignes, écran qui change : on relance le repérage (en différé, pour ne pas le
  // faire dix fois de suite). Nos propres canvas ne comptent pas, sinon on tournerait en rond.
  const scheduleDiscover = () => {
    if (timer !== null) return;
    timer = window.setTimeout(() => { timer = null; discover(); step(performance.now(), true); }, 300);
  };
  const isOurs = (n: Node) => n instanceof HTMLCanvasElement && n.classList.contains('dp-c');
  const observer = new MutationObserver((muts) => {
    const relevant = muts.some((m) => [...m.addedNodes, ...m.removedNodes].some((n) => !isOurs(n)));
    if (relevant) scheduleDiscover();
  });
  observer.observe(root, { childList: true, subtree: true });

  const unsubscribe = useWorkoutStore.subscribe(() => {
    const next = read();
    if (next.density !== settings.density || next.size !== settings.size || next.anim !== settings.anim) {
      settings = next;
      items.forEach((it) => { it.key = ''; });
      scheduleDiscover();
    }
  });

  discover();
  step(performance.now(), true);
  schedule();

  return () => {
    cancelAnimationFrame(raf);
    if (fallback !== null) window.clearTimeout(fallback);
    if (timer !== null) window.clearTimeout(timer);
    observer.disconnect();
    unsubscribe();
    [...items.values()].forEach(dispose);
  };
}

// Monté une fois dans App : ne fait rien tant que le style « Points » n'est pas choisi.
export const DotEngine: React.FC = () => {
  const uiStyle = useWorkoutStore((s) => s.uiStyle);
  useEffect(() => {
    if (uiStyle !== 'points') return;
    document.documentElement.dataset.points = 'on';
    const stop = startEngine();
    return () => {
      stop();
      delete document.documentElement.dataset.points;
    };
  }, [uiStyle]);
  return null;
};
