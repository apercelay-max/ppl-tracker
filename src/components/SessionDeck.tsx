import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ExerciseProgress } from '../data/types';
import { useSessionChrono } from '../hooks/useSessionChrono';
import { useWorkoutStore } from '../store/workoutStore';
import { computeTonnage } from '../utils/training';
import { kgToLbs } from '../utils/weight';

// Séance sur grand écran (iPad en paysage) : l'exercice en cours au centre, le
// précédent et le suivant en cartes inclinées derrière, et trois gestes.
//   · glisser à gauche / à droite : passer à l'exercice voisin (il suit le doigt) ;
//   · glisser vers le bas depuis le TOUT HAUT de l'écran : l'écran Stats descend ;
//   · glisser vers le haut depuis le TOUT BAS de l'écran : le programme (tous les
//     exercices) monte ;
//   · glisser vers la droite depuis le COIN HAUT-GAUCHE : une barre latérale couvre la
//     carte « précédent » et affiche toutes les stats de la séance.
// Les départs verticaux sont limités à une bande près du bord : au milieu de l'écran,
// le glissement vertical sert à faire défiler la carte et ne déclenche plus rien.
// Cela remplace la barre du bas : durée et tonnage sont sous la carte
// « précédent », pause et stop sous la carte « suivant ».
//
// Fluidité : pendant un geste on n'écrit que des `transform` (jamais de rendu
// React ni de mise en page), et le lâcher est une animation Web Animations qui
// repart de la vitesse du doigt. Les cartes sont rendues une fois pour toutes
// (clé = id de l'exercice) : quand l'exercice change, le DOM n'est pas recréé,
// la carte voisine devient simplement la carte centrale.

export type DeckSheet = 'stats' | 'programme';

// Une carte du deck : l'intro (échauffement et muscles) puis un exercice par carte.
export interface DeckCard {
  key: string;
  title: string;
  chip: string;
  chipOk?: boolean;
  meta?: string;
}

interface SessionDeckProps {
  cards: DeckCard[];
  currentIndex: number;
  progress: ExerciseProgress;
  startTime: number;
  pausedAt: number | null;
  // Contenu d'une carte : `preview` = aperçu muet (voisin), sinon carte vivante.
  renderCard: (cardIndex: number, preview: boolean) => React.ReactNode;
  onSwitch: (cardIndex: number) => void;
  onTogglePause: () => void;
  onStop: () => void;
  statsSheet: React.ReactNode;
  renderProgramme: (close: () => void) => React.ReactNode;
}

const GAP = 56;          // espace entre deux cartes pendant le glissement (px)
const AXIS_LOCK = 8;     // distance avant de décider horizontal / vertical (px)
// Zones de départ des glissements spéciaux, mesurées depuis les bords de l'ÉCRAN.
const EDGE = 44;         // bande du haut (Stats) et du bas (Programme), en px
const CORNER_W = 72;     // coin haut-gauche (barre latérale) : largeur depuis le bord gauche, en px
const CORNER_H = 1 / 3;  // … et hauteur : le tiers supérieur de l'écran
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const reduceMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const tx = (axis: 'x' | 'y', v: number) => (axis === 'x' ? `translate3d(${v}px,0,0)` : `translate3d(0,${v}px,0)`);

// Anime un élément d'une position à l'autre. Résout quand c'est fini (ou tout de
// suite si le téléphone demande moins d'animations).
const slide = (el: HTMLElement | null | undefined, axis: 'x' | 'y', from: number, to: number, ms: number): Promise<void> => {
  if (!el) return Promise.resolve();
  if (reduceMotion() || ms <= 0 || typeof el.animate !== 'function') {
    el.style.transform = tx(axis, to);
    return Promise.resolve();
  }
  const a = el.animate([{ transform: tx(axis, from) }, { transform: tx(axis, to) }], { duration: ms, easing: EASE, fill: 'forwards' });
  return a.finished.then(() => undefined, () => undefined);
};

// x = changer d'exercice, y = écran Stats / Programme, d = barre latérale (drawer).
type DragKind = 'x' | 'y' | 'd';

interface Drag {
  id: number;
  x: number; y: number;
  axis: DragKind | null;
  dx: number; dy: number;
  vx: number; vy: number;       // vitesse du doigt (px/ms), lissée
  lx: number; ly: number; lt: number;
  w: number; h: number;
  lastX: number;
  startedOpen: DeckSheet | 'drawer' | null;
  sheet: DeckSheet | null;      // écran en train d'être tiré
  only: DeckSheet | null;       // écran que la zone de départ autorise (haut = stats, bas = programme)
  po: number;                   // ouverture de l'écran / de la barre, de 0 (fermé) à 1 (ouvert)
  zone: { corner: boolean; top: boolean; bottom: boolean; inRoot: boolean };
}

// Durée et tonnage : composant à part, le chrono bat chaque seconde et ne doit
// pas faire re-rendre les cartes (même raison que SportLiveStats).
const DeckInfo: React.FC<{ startTime: number; pausedAt: number | null; progress: ExerciseProgress }> = ({ startTime, pausedAt, progress }) => {
  const { formatted } = useSessionChrono(startTime, pausedAt);
  const weightUnit = useWorkoutStore((s) => s.weightUnit);
  const kg = computeTonnage(progress);
  const t = weightUnit === 'lbs'
    ? { v: Math.round(kgToLbs(kg)).toLocaleString('fr-FR'), u: 'lbs' }
    : kg >= 1000
    ? { v: (kg / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }), u: 't' }
    : { v: String(Math.round(kg)), u: 'kg' };
  return (
    <div className="deck-info">
      <div>
        <span className="deck-lbl">{pausedAt != null ? 'En pause' : 'Durée'}</span>
        <b style={{ color: pausedAt != null ? 'var(--h-warn, #ffb020)' : undefined }}>{formatted}</b>
      </div>
      <div>
        <span className="deck-lbl">Poids soulevé</span>
        <b>{t.v}<i>{t.u}</i></b>
      </div>
    </div>
  );
};

const Chevron: React.FC<{ up?: boolean }> = ({ up }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: up ? 'rotate(180deg)' : undefined }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const SessionDeck: React.FC<SessionDeckProps> = ({
  cards, currentIndex, progress, startTime, pausedAt, renderCard,
  onSwitch, onTogglePause, onStop, statsSheet, renderProgramme,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef(new Map<string, HTMLDivElement>());
  const sheetEls = useRef<Record<DeckSheet, HTMLDivElement | null>>({ stats: null, programme: null });
  const [sheet, setSheet] = useState<DeckSheet | null>(null);
  // Les deux écrans sont lourds : on les monte un instant après l'ouverture de
  // la séance, pour que le premier geste ne déclenche pas leur construction.
  const [sheetsReady, setSheetsReady] = useState(false);
  // Barre latérale « toutes les stats » : même idée, montée un peu plus tard.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerReady, setDrawerReady] = useState(false);
  const busy = useRef(false);
  // Vrai pendant l'ouverture / fermeture d'un écran : un changement d'exercice
  // en même temps (choix dans le programme) ne doit pas couper cette animation,
  // sinon l'écran saute au lieu de glisser.
  const sheetBusy = useRef(false);
  const viaGesture = useRef(false);
  const prevIndex = useRef(currentIndex);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const sideEls = useRef<Record<'prev' | 'next', HTMLButtonElement | null>>({ prev: null, next: null });
  const scrimRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerScrimRef = useRef<HTMLDivElement>(null);
  // Écrits directement sur les éléments concernés : une variable CSS posée sur la
  // racine forcerait le recalcul du style de toutes les cartes à chaque image.
  const setSideOpacity = (v: number) => {
    (['prev', 'next'] as const).forEach((k) => { const el = sideEls.current[k]; if (el) el.style.opacity = String(v); });
  };
  const setScrim = (v: number) => { if (scrimRef.current) scrimRef.current.style.opacity = String(v); };
  const setDrawerScrim = (v: number) => { if (drawerScrimRef.current) drawerScrimRef.current.style.opacity = String(v); };

  useEffect(() => {
    const id = window.setTimeout(() => setSheetsReady(true), 700);
    const id2 = window.setTimeout(() => setDrawerReady(true), 1400);
    return () => { window.clearTimeout(id); window.clearTimeout(id2); };
  }, []);

  const slotOf = (i: number) => (cards[i] ? slotRefs.current.get(cards[i].key) : undefined);

  // Remet tout à l'état de repos : les positions viennent alors du CSS, qui
  // correspond exactement à la dernière image de l'animation (pas de saut).
  const cleanup = () => {
    const root = rootRef.current;
    if (!root) return;
    slotRefs.current.forEach((el) => { el.getAnimations?.().forEach((a) => a.cancel()); el.style.transform = ''; });
    (Object.keys(sheetEls.current) as DeckSheet[]).forEach((k) => {
      const el = sheetEls.current[k];
      if (!el) return;
      el.getAnimations?.().forEach((a) => a.cancel());
      el.style.transform = '';
    });
    delete root.dataset.dragging;
    delete root.dataset.moving;
    (['prev', 'next'] as const).forEach((k) => { const el = sideEls.current[k]; if (el) el.style.opacity = ''; });
    if (scrimRef.current) scrimRef.current.style.opacity = '';
    if (drawerRef.current) { drawerRef.current.getAnimations?.().forEach((a) => a.cancel()); drawerRef.current.style.transform = ''; }
    if (drawerScrimRef.current) drawerScrimRef.current.style.opacity = '';
    busy.current = false;
    sheetBusy.current = false;
  };

  // Changement d'exercice : si ce n'est pas un geste (ex. la dernière série vient
  // d'être validée et la séance avance), la nouvelle carte glisse un peu en
  // fondu au lieu d'apparaître d'un coup.
  useLayoutEffect(() => {
    const before = prevIndex.current;
    if (!sheetBusy.current) cleanup();
    if (before !== currentIndex) {
      prevIndex.current = currentIndex;
      if (!viaGesture.current && !reduceMotion()) {
        const el = slotOf(currentIndex);
        const dir = currentIndex > before ? 1 : -1;
        el?.animate?.(
          [{ transform: tx('x', dir * 72), opacity: 0 }, { transform: tx('x', 0), opacity: 1 }],
          { duration: 320, easing: EASE },
        );
      }
      viaGesture.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useLayoutEffect(() => { cleanup(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [sheet, drawerOpen]);

  // Aperçus voisins et écrans fermés : hors de portée du clavier et du toucher.
  useLayoutEffect(() => {
    cards.forEach((c, i) => slotRefs.current.get(c.key)?.toggleAttribute('inert', i !== currentIndex));
    (Object.keys(sheetEls.current) as DeckSheet[]).forEach((k) => sheetEls.current[k]?.toggleAttribute('inert', sheet !== k));
    drawerRef.current?.toggleAttribute('inert', !drawerOpen);
  });

  // Une carte plus haute que l'écran (beaucoup de séries, barre de repos) doit
  // défiler : on rend alors le glissement vertical au navigateur ; sinon il
  // sert à ouvrir les écrans Stats / Programme.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const update = () => root.querySelectorAll<HTMLElement>('.deck-slot').forEach((s) => {
      s.dataset.scroll = s.scrollHeight > s.clientHeight + 1 ? '1' : '0';
    });
    const ro = new ResizeObserver(update);
    root.querySelectorAll('.deck-slot, .deck-slot-inner').forEach((n) => ro.observe(n));
    update();
    return () => ro.disconnect();
  }, [currentIndex, cards.length]);

  // Agrandit la carte du centre selon la place disponible (un iPad en fenêtre
  // ne mesure parfois que ~1000 × 550 px). Le facteur ne dépend que de la taille
  // de l'écran, jamais du contenu : la carte ne change pas de taille quand une
  // barre de repos apparaît. Une carte plus haute que l'écran défile.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const fit = () => {
      const cw = Math.min(860, root.clientWidth - 300);
      const z = clamp(Math.min(cw / 560, (root.clientHeight - 70) / 480), 1, 1.5);
      root.style.setProperty('--deck-z', String(Math.round(z * 100) / 100));
    };
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  // Carte plus haute que l'écran : à chaque série validée ou exercice changé, on
  // la fait défiler jusqu'au bouton Valider pour qu'il reste sous le pouce.
  const doneSets = Object.values(progress).reduce((n, list) => n + list.filter((e) => e.completed).length, 0);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const slot = rootRef.current?.querySelector<HTMLElement>('.deck-slot.is-center');
      if (!slot || slot.dataset.scroll !== '1') return;
      const btn = Array.from(slot.querySelectorAll('button')).find((b) => /valider/i.test(b.textContent ?? ''));
      btn?.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [currentIndex, doneSets]);

  useEffect(() => {
    if (!sheet && !drawerOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (drawerOpen) closeDrawer(); else closeSheet(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet, drawerOpen]);

  // ── Exercice voisin ──────────────────────────────────────────────────────
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < cards.length - 1;

  const posX = (d: Drag, raw: number) => {
    // Pas d'exercice de ce côté : la carte résiste (effet élastique).
    const blocked = (raw > 0 && !hasPrev) || (raw < 0 && !hasNext);
    const x = blocked ? raw * 0.28 : raw;
    d.lastX = x;
    const c = slotOf(currentIndex);
    if (c) c.style.transform = tx('x', x);
    const p = slotOf(currentIndex - 1);
    if (p) p.style.transform = tx('x', x - d.w);
    const n = slotOf(currentIndex + 1);
    if (n) n.style.transform = tx('x', x + d.w);
    setSideOpacity(1 - Math.min(1, Math.abs(x) / (d.w * 0.6)) * 0.85);
  };

  const settleX = (dir: 1 | -1, commit: boolean, x: number, w: number, speed: number) => {
    const root = rootRef.current;
    if (!root) return;
    busy.current = true;
    delete root.dataset.dragging;
    root.dataset.moving = 'x';
    // Les cartes voisines s'effacent pendant le changement ; les nouvelles apparaissent en fondu.
    setSideOpacity(commit ? 0 : 1);
    const target = currentIndex + dir;
    const center = slotOf(currentIndex);
    const nb = slotOf(target);
    const v = Math.max(speed, 0.9);
    if (commit) {
      const ms = clamp((w - Math.abs(x)) / v, 200, 380);
      Promise.all([slide(center, 'x', x, -dir * w, ms), slide(nb, 'x', x + dir * w, 0, ms)]).then(() => {
        viaGesture.current = true;
        onSwitch(target);
        window.setTimeout(() => { viaGesture.current = false; cleanup(); }, 80);
      });
    } else {
      const ms = clamp(Math.abs(x) / v, 180, 320);
      Promise.all([slide(center, 'x', x, 0, ms), slide(nb, 'x', x + dir * w, dir * w, ms)]).then(cleanup);
    }
  };

  // Même mouvement sans doigt (touche sur une carte voisine).
  const goNeighbour = (dir: 1 | -1) => {
    if (busy.current || sheet || drawerOpen) return;
    const target = currentIndex + dir;
    if (target < 0 || target >= cards.length) return;
    const w = (slotOf(currentIndex)?.offsetWidth ?? 700) + GAP;
    const p = slotOf(currentIndex - 1); if (p) p.style.transform = tx('x', -w);
    const n = slotOf(currentIndex + 1); if (n) n.style.transform = tx('x', w);
    settleX(dir, true, 0, w, 1.4);
  };

  // ── Écrans Stats (du haut) et Programme (du bas) ─────────────────────────
  const closedY = (name: DeckSheet, h: number) => (name === 'stats' ? -h : h);

  const posY = (d: Drag, raw: number) => {
    let name: DeckSheet;
    let po: number;
    if (d.startedOpen && d.startedOpen !== 'drawer') {
      name = d.startedOpen;
      po = 1 - clamp((name === 'stats' ? -raw : raw) / d.h, 0, 1);
    } else {
      // La zone de départ décide de l'écran : le haut ne sert qu'aux Stats, le bas qu'au
      // Programme. Revenir en arrière avec le doigt le referme, il ne bascule pas sur l'autre.
      name = d.only ?? 'stats';
      po = clamp((name === 'stats' ? raw : -raw) / d.h, 0, 1);
    }
    d.sheet = name;
    d.po = po;
    const el = sheetEls.current[name];
    if (el) el.style.transform = tx('y', closedY(name, d.h) * (1 - po));
    setScrim(po * 0.55);
  };

  const settleY = (name: DeckSheet, open: boolean, po: number, h: number, speed: number) => {
    const root = rootRef.current;
    if (!root) return;
    busy.current = true;
    sheetBusy.current = true;
    delete root.dataset.dragging;
    root.dataset.moving = 'sheet';
    setScrim(open ? 0.55 : 0);
    const el = sheetEls.current[name];
    const v = Math.max(speed, 0.9);
    const from = closedY(name, h) * (1 - po);
    const to = open ? 0 : closedY(name, h);
    const ms = clamp(Math.abs(to - from) / v, 200, 400);
    slide(el, 'y', from, to, ms).then(() => {
      if ((open ? name : null) !== sheet) setSheet(open ? name : null);
      window.setTimeout(cleanup, 80);
    });
  };

  const openSheet = (name: DeckSheet) => {
    if (busy.current || sheet || drawerOpen) return;
    const h = rootRef.current?.clientHeight ?? 700;
    settleY(name, true, 0, h, 1.2);
  };
  const closeSheet = () => {
    if (busy.current || !sheet) return;
    const h = rootRef.current?.clientHeight ?? 700;
    settleY(sheet, false, 1, h, 1.2);
  };

  // ── Barre latérale « toutes les stats » (coin haut-gauche) ───────────────
  // Elle entre par la gauche et reste collée au doigt. Opaque et plus large que la
  // partie visible de la carte « précédent » : elle la cache entièrement.
  const posD = (d: Drag, raw: number) => {
    const reveal = d.startedOpen === 'drawer' ? clamp(d.w + raw, 0, d.w) : clamp(raw, 0, d.w);
    d.po = reveal / d.w;
    const el = drawerRef.current;
    if (el) el.style.transform = tx('x', reveal - d.w);
    setDrawerScrim(d.po * 0.5);
  };

  const settleD = (open: boolean, po: number, w: number, speed: number) => {
    const root = rootRef.current;
    if (!root) return;
    busy.current = true;
    sheetBusy.current = true;
    delete root.dataset.dragging;
    root.dataset.moving = 'drawer';
    setDrawerScrim(open ? 0.5 : 0);
    const v = Math.max(speed, 0.9);
    const from = -w * (1 - po);
    const to = open ? 0 : -w;
    const ms = clamp(Math.abs(to - from) / v, 200, 400);
    slide(drawerRef.current, 'x', from, to, ms).then(() => {
      if (open !== drawerOpen) setDrawerOpen(open);
      window.setTimeout(cleanup, 80);
    });
  };

  const closeDrawer = () => {
    if (busy.current || !drawerOpen) return;
    settleD(false, 1, drawerRef.current?.offsetWidth ?? 420, 1.2);
  };

  // ── Doigt ────────────────────────────────────────────────────────────────
  // Écouteurs sur la FENÊTRE : le bord haut de l'écran est dans l'en-tête, en dehors du
  // deck. Ils sont posés une fois ; ils appellent la version à jour des fonctions
  // ci-dessous (qui lisent l'exercice courant, l'écran ouvert, etc.).
  const live = useRef({
    down: (_e: PointerEvent) => {}, move: (_e: PointerEvent) => {}, up: (_e: PointerEvent) => {}, click: (_e: MouseEvent) => {},
  });

  const onPointerDown = (e: PointerEvent) => {
    const root = rootRef.current;
    if (!root || busy.current || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const target = e.target as HTMLElement | null;
    // Seulement ce qui est dans l'écran de séance : une feuille « Arrêter la séance ? » ou
    // une fenêtre par-dessus ne doit rien déclencher.
    const screen = root.parentElement;
    if (!target || !screen || !screen.contains(target)) return;
    const inRoot = root.contains(target);
    const rect = root.getBoundingClientRect();
    const x = e.clientX, y = e.clientY;
    const zone = {
      corner: x <= CORNER_W && y <= rect.bottom * CORNER_H,
      top: y <= EDGE,
      bottom: y >= rect.bottom - EDGE,
      inRoot,
    };
    let startedOpen: Drag['startedOpen'] = null;
    if (sheet) {
      // Écran ouvert : seule la poignée sert à le refermer au doigt, le contenu défile.
      if (!inRoot || !target.closest('[data-deck-grab]')) return;
      startedOpen = sheet;
    } else if (drawerOpen) {
      // Barre ouverte : on la referme en la glissant vers la gauche.
      if (!target.closest('.deck-drawer')) return;
      startedOpen = 'drawer';
    } else if (!zone.corner && !zone.top && !zone.bottom && !inRoot) {
      return;
    }
    drag.current = {
      id: e.pointerId, x, y, axis: null, dx: 0, dy: 0, vx: 0, vy: 0,
      lx: x, ly: y, lt: performance.now(), w: 0, h: 0, lastX: 0,
      startedOpen, sheet: null, only: null, po: 0, zone,
    };
  };

  // À quel geste correspond le premier mouvement ? null = aucun, on laisse faire le navigateur.
  const lockKind = (d: Drag): DragKind | null => {
    const ax = Math.abs(d.dx), ay = Math.abs(d.dy);
    if (d.startedOpen === 'drawer') return d.dx < 0 && ax > ay ? 'd' : null;
    if (d.startedOpen) return ay > ax ? 'y' : null;
    const z = d.zone;
    // Coin haut-gauche : départ exclusif de la barre latérale (vers la droite, droit ou en
    // diagonale vers le milieu). Un glissement droit vers le bas depuis le bord du haut
    // reste celui de l'écran Stats ; tout le reste du coin ne fait rien.
    if (z.corner && d.dx > 0 && d.dx >= ay * 0.5) return 'd';
    if (z.top && d.dy > 0 && ay > ax) { d.only = 'stats'; return 'y'; }
    if (z.bottom && d.dy < 0 && ay > ax) { d.only = 'programme'; return 'y'; }
    // Ailleurs : seul le glissement horizontal sert (changer d'exercice). Le vertical
    // appartient à la carte (défilement).
    if (ax > ay && z.inRoot && !z.corner) return 'x';
    return null;
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    const root = rootRef.current;
    if (!d || !root || d.id !== e.pointerId) return;
    const now = performance.now();
    const dt = now - d.lt;
    d.dx = e.clientX - d.x;
    d.dy = e.clientY - d.y;
    if (dt > 0) {
      d.vx = 0.7 * ((e.clientX - d.lx) / dt) + 0.3 * d.vx;
      d.vy = 0.7 * ((e.clientY - d.ly) / dt) + 0.3 * d.vy;
    }
    d.lx = e.clientX; d.ly = e.clientY; d.lt = now;

    if (!d.axis) {
      if (Math.max(Math.abs(d.dx), Math.abs(d.dy)) < AXIS_LOCK) return;
      const kind = lockKind(d);
      if (!kind) { drag.current = null; return; }
      d.axis = kind;
      // Le mouvement part de zéro au verrouillage : sinon la carte saute des 8 px de seuil.
      d.x = e.clientX; d.y = e.clientY; d.dx = 0; d.dy = 0;
      d.w = kind === 'd' ? (drawerRef.current?.offsetWidth ?? 420) : (slotOf(currentIndex)?.offsetWidth ?? 700) + GAP;
      d.h = root.clientHeight;
      try { root.setPointerCapture(e.pointerId); } catch { /* le geste continue sans capture */ }
      root.dataset.dragging = '1';
      root.dataset.moving = kind === 'x' ? 'x' : kind === 'y' ? 'sheet' : 'drawer';
      suppressClick.current = true;
    }
    if (d.axis === 'x') posX(d, d.dx);
    else if (d.axis === 'd') posD(d, d.dx);
    else posY(d, d.dy);
  };

  const endDrag = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.axis) return;
    try { rootRef.current?.releasePointerCapture(e.pointerId); } catch { /* déjà relâché */ }
    window.setTimeout(() => { suppressClick.current = false; }, 60);
    if (d.axis === 'x') {
      const dir: 1 | -1 = d.dx < 0 ? 1 : -1;
      const has = dir === 1 ? hasNext : hasPrev;
      const fast = Math.abs(d.vx) > 0.45 && Math.sign(d.vx) === Math.sign(d.dx);
      settleX(dir, has && (Math.abs(d.dx) > d.w * 0.28 || fast), d.lastX, d.w, Math.abs(d.vx));
    } else if (d.axis === 'd') {
      const closing = d.startedOpen === 'drawer';
      const fast = (closing ? -d.vx : d.vx) > 0.5;
      const open = closing ? !(d.po < 0.78 || (fast && d.po < 1)) : (d.po > 0.22 || fast);
      settleD(open, d.po, d.w, Math.abs(d.vx));
    } else if (d.sheet) {
      const toward = d.startedOpen ? (d.sheet === 'stats' ? -d.vy : d.vy) : (d.sheet === 'stats' ? d.vy : -d.vy);
      const fast = toward > 0.5;
      const open = d.startedOpen ? !(d.po < 0.78 || (fast && d.po < 1)) : (d.po > 0.22 || fast);
      settleY(d.sheet, open, d.po, d.h, Math.abs(d.vy));
    }
  };

  // Un clic qui suit un vrai glissement n'en est pas un (le doigt a fini sur un bouton).
  const onClickCapture = (e: MouseEvent) => {
    if (suppressClick.current) { e.stopPropagation(); e.preventDefault(); }
  };

  live.current = { down: onPointerDown, move: onPointerMove, up: endDrag, click: onClickCapture };
  useEffect(() => {
    const down = (e: PointerEvent) => live.current.down(e);
    const move = (e: PointerEvent) => live.current.move(e);
    const up = (e: PointerEvent) => live.current.up(e);
    const click = (e: MouseEvent) => live.current.click(e);
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('click', click, true);
    };
  }, []);

  const side = (i: number, dir: 'prev' | 'next') => {
    const c = cards[i];
    if (!c) return null;
    return (
      <button type="button" key={`${dir}-${c.key}`} ref={(el) => { sideEls.current[dir] = el; }} className={`deck-side deck-side-${dir}`} onClick={() => goNeighbour(dir === 'next' ? 1 : -1)}
        aria-label={`${dir === 'prev' ? 'Carte précédente' : 'Carte suivante'} : ${c.title}`}>
        <span className="deck-side-inner">
          <span className="deck-lbl">{dir === 'prev' ? '‹ Précédent' : 'Suivant ›'}</span>
          <span className="deck-side-name">{c.title}</span>
          <span className="deck-side-meta">
            <span className={`deck-chip${c.chipOk ? ' ok' : ''}`}>{c.chipOk ? '✓ ' : ''}{c.chip}</span>
            {c.meta && <span>{c.meta}</span>}
          </span>
        </span>
      </button>
    );
  };

  const sheetShell = (name: DeckSheet, hint: string, closeLabel: string, body: React.ReactNode) => {
    const bar = (
      <div className="deck-sheet-bar" data-deck-grab>
        <span className="deck-grip" aria-hidden="true" />
        <span className="deck-sheet-hint">{hint}</span>
        <button type="button" className="deck-sheet-close" onClick={closeSheet}>{closeLabel}</button>
      </div>
    );
    return (
      <div
        ref={(el) => { sheetEls.current[name] = el; }}
        className={`deck-sheet deck-sheet-${name}${sheet === name ? ' is-open' : ''}`}
        aria-hidden={sheet !== name}
      >
        {name === 'programme' && bar}
        <div className="deck-sheet-body">{sheetsReady || sheet === name ? body : null}</div>
        {name === 'stats' && bar}
      </div>
    );
  };

  return (
    <div
      ref={rootRef}
      className={`deck${sheet ? ' is-sheet-open' : ''}${drawerOpen ? ' is-drawer-open' : ''}`}
    >
      {side(currentIndex - 1, 'prev')}
      {side(currentIndex + 1, 'next')}

      {cards.map((c, i) => {
        const rel = i - currentIndex;
        if (Math.abs(rel) > 1) return null;
        return (
          <div
            key={c.key}
            ref={(el) => { if (el) slotRefs.current.set(c.key, el); else slotRefs.current.delete(c.key); }}
            className={`deck-slot ${rel === 0 ? 'is-center' : rel < 0 ? 'is-prev' : 'is-next'}`}
          >
            <div className="deck-slot-inner">{renderCard(i, rel !== 0)}</div>
          </div>
        );
      })}

      <DeckInfo startTime={startTime} pausedAt={pausedAt} progress={progress} />
      <div className="deck-ctl">
        <button type="button" className="deck-pause" onClick={onTogglePause}
          aria-label={pausedAt != null ? 'Reprendre la séance' : 'Mettre la séance en pause'}>
          {pausedAt != null ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.6c0-.9 1-1.5 1.8-1L18 11.1a1.1 1.1 0 0 1 0 1.8L9.8 19.4c-.8.5-1.8-.1-1.8-1V5.6Z" /></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.4" /><rect x="13.5" y="5" width="4" height="14" rx="1.4" /></svg>
          )}
        </button>
        <button type="button" className="deck-stop" onClick={onStop} aria-label="Arrêter la séance">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2.4" /></svg>
        </button>
      </div>

      <div className="deck-edge deck-edge-t"><button type="button" className="deck-pill" onClick={() => openSheet('stats')}><Chevron />Stats</button></div>
      <div className="deck-edge deck-edge-b"><button type="button" className="deck-pill" onClick={() => openSheet('programme')}><Chevron up />Exercices</button></div>

      {/* Bande du bas : capte le glissement vers le haut (Programme) même quand la carte défile. */}
      <div className="deck-zone-b" aria-hidden="true" />

      <div ref={scrimRef} className="deck-scrim" aria-hidden="true" />
      {sheetShell('stats', 'Glisse vers le haut pour revenir', 'Fermer', statsSheet)}
      {sheetShell('programme', 'Glisse vers le bas pour revenir', 'Fermer', renderProgramme(closeSheet))}

      <div ref={drawerScrimRef} className="deck-drawer-scrim" onClick={closeDrawer} aria-hidden="true" />
      <div ref={drawerRef} className={`deck-drawer${drawerOpen ? ' is-open' : ''}`} role="dialog" aria-label="Toutes les stats de la séance" aria-hidden={!drawerOpen}>
        <div className="deck-drawer-bar">
          <span className="deck-sheet-hint">Glisse vers la gauche pour fermer</span>
          <button type="button" className="deck-sheet-close" onClick={closeDrawer}>Fermer</button>
        </div>
        <div className="deck-drawer-body">{drawerReady || drawerOpen ? statsSheet : null}</div>
      </div>
    </div>
  );
};
