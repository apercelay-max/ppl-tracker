import React, { useEffect, useRef, useState } from 'react';

/**
 * Intro du tout premier lancement (et, une seule fois, des anciens
 * utilisateurs — voir App.tsx). Écran noir : un point lumineux parcourt une
 * ligne qui défile vers la droite. À chaque étape il quitte la ligne, dessine
 * un petit schéma qui illustre le texte, écrit le titre en points ronds, puis
 * revient sur la ligne et repart vers l'étape suivante.
 *
 * Fonctionnement : tout est posé dans un « monde » fixe (une étape tous les
 * STEP px) et une caméra le parcourt. Le trajet du point est une suite de
 * segments chronométrés ; un point d'encre n'apparaît qu'une fois dépassé par
 * le point lumineux. Rien n'est enregistré ici : la mémoire « déjà vue » est
 * gérée par App.tsx.
 *
 * Le titre est dessiné en points (canvas), mais la phrase d'explication reste
 * du vrai texte : un afficheur à points est joli, pas fait pour se lire sur
 * trois lignes.
 */

type Pt = [number, number];

interface Slide { chapter: string; title: string; detail: string; art: Pt[][] }

// ─── Petits dessins ──────────────────────────────────────────────────────────
// Repère local d'un dessin : x de -100 à 100, y de -170 (haut) à 0 (bas, juste
// au-dessus de la ligne). Chaque trait est une suite de points que le point
// lumineux relie l'un après l'autre.

const circ = (cx: number, cy: number, r: number, n = 18): Pt[] =>
  Array.from({ length: n + 1 }, (_, i): Pt => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] =>
  [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
const tick = (x: number, y: number): Pt[] => [[x - 9, y], [x - 2, y + 8], [x + 11, y - 9]];

const ART_NOTE: Pt[][] = [ // haltère + coche : « note tes séances »
  [[-76, -85], [76, -85]],
  rect(-60, -120, -48, -50), rect(-76, -105, -64, -65),
  rect(48, -120, 60, -50), rect(64, -105, 76, -65),
  [[-18, -152], [-4, -138], [24, -168]],
];
const ART_PROGRES: Pt[][] = [ // axes + courbe qui monte
  [[-90, -160], [-90, -25], [92, -25]],
  [[-78, -50], [-42, -74], [-12, -62], [28, -108], [72, -142]],
  [[54, -144], [72, -142], [70, -124]],
];
const ART_PROGRAMME: Pt[][] = [-131, -86, -41].flatMap((y): Pt[][] => [ // trois séances en liste
  rect(-82, y - 19, 82, y + 19), circ(-62, y, 6, 10), [[-44, y], [44, y]],
]);
const ART_COACH: Pt[][] = [ // bulle de discussion + étincelle
  [[-85, -150], [85, -150], [85, -70], [-5, -70], [-40, -38], [-38, -70], [-85, -70], [-85, -150]],
  [[0, -132], [0, -88]], [[-22, -110], [22, -110]],
  [[-14, -124], [14, -96]], [[14, -124], [-14, -96]],
];
const ART_PARTOUT: Pt[][] = [ // deux téléphones reliés
  rect(-92, -135, -52, -60), rect(52, -135, 92, -60),
  [[-44, -97], [44, -97]], [[-34, -107], [-44, -97], [-34, -87]], [[34, -107], [44, -97], [34, -87]],
];
const ART_SIMPLE: Pt[][] = [ // un rond, une coche
  circ(0, -95, 62, 24), [[-28, -95], [-9, -74], [30, -120]],
];
const ART_DONNEES: Pt[][] = [ // une feuille de tableur qui sort
  [[-50, -160], [18, -160], [50, -128], [50, -30], [-50, -30], [-50, -160]],
  [[18, -160], [18, -128], [50, -128]],
  [[-32, -100], [32, -100]], [[-32, -70], [32, -70]], [[0, -114], [0, -50]],
  [[62, -95], [96, -95]], [[86, -105], [96, -95], [86, -85]],
];
const ART_REGULIER: Pt[][] = [ // un calendrier avec des coches
  rect(-80, -150, 80, -30), [[-80, -120], [80, -120]],
  [[-45, -162], [-45, -140]], [[45, -162], [45, -140]],
  tick(-48, -95), tick(0, -95), tick(48, -95), tick(-24, -60), tick(24, -60),
];
const ART_PARTI: Pt[][] = [ // un drapeau
  [[-24, -30], [-24, -165]], [[-24, -165], [62, -145], [-24, -122]],
];

// ─── Textes : c'est ici, et seulement ici, qu'on les modifie ─────────────────
// Titres courts (2-3 mots) : ils sont écrits en gros, en points.

const CH_DOES = 'Ce qu’elle fait';
const CH_WHY = 'Pourquoi elle existe';

const SLIDES: Slide[] = [
  { chapter: CH_DOES, title: 'Note tes séances', art: ART_NOTE,
    detail: 'Séries, charges et repos se saisissent en quelques secondes, même entre deux séries.' },
  { chapter: CH_DOES, title: 'Suis tes progrès', art: ART_PROGRES,
    detail: 'Historique, records, poids de corps et stats : tu vois ce qui avance.' },
  { chapter: CH_DOES, title: 'Ton programme', art: ART_PROGRAMME,
    detail: 'Push / Pull / Legs, full body… ou le tien, construit à partir de quelques questions.' },
  { chapter: CH_DOES, title: 'Un coach IA', art: ART_COACH,
    detail: 'Il lit ton historique et te conseille. C’est une aide, pas un avis médical.' },
  { chapter: CH_DOES, title: 'Partout avec toi', art: ART_PARTOUT,
    detail: 'Un compte garde tes données d’un téléphone à l’autre, et un binôme peut suivre tes séances.' },
  { chapter: CH_WHY, title: 'Rester simple', art: ART_SIMPLE,
    detail: 'Une appli en français, claire même en pleine séance, qui note vraiment ce que tu soulèves.' },
  { chapter: CH_WHY, title: 'Tes données', art: ART_DONNEES,
    detail: 'Elles t’appartiennent : exporte tout en Excel quand tu veux.' },
  { chapter: CH_WHY, title: 'Être régulier', art: ART_REGULIER,
    detail: 'Trois séances vraiment faites valent mieux que six jamais faites. PPL est là pour ça.' },
  { chapter: 'À toi de jouer', title: 'C’est parti', art: ART_PARTI,
    detail: 'Quelques questions pour construire ton programme. Tu verras tout avant de valider.' },
];

// Dernier écran pour qui a déjà passé le quiz : pas de quiz à enchaîner.
const REPLAY_LAST: Slide = {
  ...SLIDES[SLIDES.length - 1],
  detail: 'Tu peux refaire le quiz à tout moment : Réglages → Séance → « Refaire le quiz ».',
};

// ─── Réglages de l'animation ─────────────────────────────────────────────────

const GRID = 5;            // pas de la grille de points du titre, en px
const DOT_R = 2.1;         // rayon d'un point de dessin ou de titre
const TRAIL_R = 1.7;       // rayon d'un point de la ligne
const INK_SPEED = 520;     // vitesse du point quand il dessine, en px/s
const ENTRY_MS = 1000;     // le point entre par la gauche
const TRAVEL_MS = 1100;    // trajet d'une étape à la suivante
const WRITE_MS = 900;      // écriture du titre
const HOLD_MS = 2300;      // temps de lecture une fois l'étape finie
const HOLD_REDUCED_MS = 3800;
const STEP = 520;          // distance entre deux étapes dans le « monde »
const HALO_R = 190;

type Dot = { x: number; y: number; f: number };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const clampN = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Écrit le titre dans un canvas caché puis le transforme en points (un par case
 * de la grille où il y a de l'encre). La taille de police diminue jusqu'à ce
 * que le plus long mot tienne dans la largeur : sans ça, « Partout avec toi »
 * déborderait de l'écran d'un petit téléphone.
 */
const buildTitle = (text: string, width: number, fontFamily: string): { dots: { x: number; y: number }[]; height: number } => {
  const probe = document.createElement('canvas');
  const ctx = probe.getContext('2d');
  if (!ctx) return { dots: [], height: 0 };

  let size = 58;
  let lines: string[] = [];
  for (; size >= 30; size -= 2) {
    ctx.font = `800 ${size}px ${fontFamily}`;
    lines = [];
    let current = '';
    let tooWide = false;
    for (const word of text.split(' ')) {
      if (ctx.measureText(word).width > width) tooWide = true;
      const attempt = current ? `${current} ${word}` : word;
      if (current && ctx.measureText(attempt).width > width) { lines.push(current); current = word; }
      else current = attempt;
    }
    if (current) lines.push(current);
    if (!tooWide && lines.length <= 3) break;
  }

  const lineH = Math.round(size * 1.12);
  const w = Math.ceil(width);
  const h = lines.length * lineH + GRID * 2;
  probe.width = w;
  probe.height = h;
  ctx.font = `800 ${size}px ${fontFamily}`;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => ctx.fillText(line, 0, GRID + i * lineH + lineH / 2));

  const px = ctx.getImageData(0, 0, w, h).data;
  const half = GRID >> 1;
  const dots: { x: number; y: number }[] = [];
  for (let y = 0; y + half < h; y += GRID) {
    for (let x = 0; x + half < w; x += GRID) {
      // On lit la transparence au centre de la case : > 110/255 = de l'encre.
      if (px[((y + half) * w + x + half) * 4 + 3] > 110) dots.push({ x: x + GRID / 2, y: y + GRID / 2 });
    }
  }
  return { dots, height: h };
};

// ─── Trajet du point ─────────────────────────────────────────────────────────

/**
 * Un morceau du trajet du point lumineux, chronométré.
 *  - 'ink'   : il avance en laissant des points derrière lui (trait, ligne) ;
 *  - 'move'  : il se déplace sans rien laisser (saut d'un trait à l'autre) ;
 *  - 'write' : il balaie le titre de gauche à droite, qui apparaît sous lui ;
 *  - 'wait'  : il attend, le temps de lire.
 * Chaque point d'encre a une position `f` (0 → 1) le long de son segment : il
 * est visible quand le point lumineux l'a dépassé.
 */
interface Seg {
  kind: 'move' | 'ink' | 'write' | 'wait';
  t0: number; t1: number;
  ax: number; ay: number; bx: number; by: number; len: number;
  ease: boolean;   // accélère puis ralentit (trajets), sinon vitesse constante
  follow: boolean; // la caméra suit le point (trajets entre deux étapes)
  trail: boolean;  // fait partie de la ligne, pas d'un dessin
  r: number;
  sf0: number; sf1: number; // étape (décimale) au début / à la fin du segment
  dots: Dot[];
  minX: number; maxX: number;
}

interface Station { x: number; tArrive: number; tDone: number; tHoldEnd: number; titleH: number }

const buildTimeline = (slides: Slide[], W: number, H: number, reduced: boolean, font: string) => {
  // Mouvement réduit : tout se pose d'un coup, seul le temps de lecture reste.
  const K = reduced ? 0.001 : 1;
  const dur = (ms: number) => Math.max(1, ms * K);
  const lineY = Math.round(H * 0.5);
  const titleTop = lineY + 30;
  const scale = Math.min(1, W / 375);
  const stageW = Math.min(W, 440) - 44;
  const X = (i: number) => W / 2 + i * STEP;

  const segs: Seg[] = [];
  const stations: Station[] = [];
  let t = 0, px = -30, py = lineY, st = 0;

  const add = (kind: Seg['kind'], bx: number, by: number, ms: number, o: Partial<Seg> = {}): Seg => {
    const seg: Seg = {
      kind, t0: t, t1: t + ms, ax: px, ay: py, bx, by, len: Math.hypot(bx - px, by - py),
      ease: false, follow: false, trail: false, r: DOT_R, sf0: st, sf1: st,
      dots: [], minX: Infinity, maxX: -Infinity, ...o,
    };
    segs.push(seg);
    t += ms; px = bx; py = by;
    return seg;
  };
  // Sème des points régulièrement le long d'un segment. Le premier point est
  // omis quand le segment prolonge le précédent (il y est déjà).
  const lay = (seg: Seg, step: number, fromZero: boolean) => {
    const n = Math.max(1, Math.round(seg.len / step));
    for (let k = fromZero ? 0 : 1; k <= n; k++) {
      const f = k / n;
      seg.dots.push({ x: seg.ax + (seg.bx - seg.ax) * f, y: seg.ay + (seg.by - seg.ay) * f, f });
    }
  };
  const inkTo = (x: number, y: number, first: boolean) => {
    const d = Math.hypot(x - px, y - py);
    lay(add('ink', x, y, dur(Math.max(60, (d / INK_SPEED) * 1000))), 5, first);
  };
  const moveTo = (x: number, y: number) =>
    add('move', x, y, dur(clampN(Math.hypot(x - px, y - py) / 1.4, 90, 320)));

  // Entrée : la ligne arrive par le bord gauche jusqu'à la première étape.
  lay(add('ink', X(0), lineY, dur(ENTRY_MS), { ease: true, trail: true, r: TRAIL_R }), 6, true);

  slides.forEach((slide, i) => {
    st = i;
    const cx = X(i);
    if (i > 0) {
      lay(add('ink', cx, lineY, dur(TRAVEL_MS), {
        ease: true, follow: true, trail: true, r: TRAIL_R, sf0: i - 1, sf1: i,
      }), 6, false);
    }
    const tArrive = t;

    // Le dessin, juste au-dessus de la ligne.
    slide.art.forEach((stroke) => {
      const pts = stroke.map(([x, y]): Pt => [cx + x * scale, lineY - 26 + y * scale]);
      moveTo(pts[0][0], pts[0][1]);
      for (let j = 1; j < pts.length; j++) inkTo(pts[j][0], pts[j][1], j === 1);
    });

    // Le titre, en dessous : le point le balaie de gauche à droite.
    const built = buildTitle(slide.title, stageW, font);
    const left = cx - stageW / 2;
    const dots: Dot[] = built.dots.map((d) => ({ x: left + d.x, y: titleTop + d.y, f: 0 }));
    const xs = dots.map((d) => d.x);
    const x0 = Math.min(...xs) - 12;
    const x1 = Math.max(...xs) + 12;
    const midY = titleTop + built.height / 2;
    moveTo(x0, midY);
    dots.forEach((d) => { d.f = (d.x - x0) / (x1 - x0); });
    add('write', x1, midY, dur(WRITE_MS)).dots = dots;
    const tDone = t;

    // Pause de lecture. Dernière étape : on attend le bouton, sans fin.
    const last = i === slides.length - 1;
    add('wait', px, py, last ? 1e9 : reduced ? HOLD_REDUCED_MS : HOLD_MS);
    const tHoldEnd = last ? Infinity : t;
    if (!last) moveTo(cx, lineY); // retour exact sur la ligne, là où il l'a quittée

    stations.push({ x: cx, tArrive, tDone, tHoldEnd, titleH: built.height });
  });

  for (const seg of segs) {
    for (const d of seg.dots) {
      if (d.x < seg.minX) seg.minX = d.x;
      if (d.x > seg.maxX) seg.maxX = d.x;
    }
  }
  return { segs, stations, lineY, titleTop, scale, X };
};

// ─── Composant ───────────────────────────────────────────────────────────────

interface OnboardingIntroProps {
  /** Vrai une fois le splash disparu : l'intro attend son tour derrière lui. */
  start: boolean;
  /** Vrai pour qui a déjà fait le quiz : on le lui rappelle au lieu de l'enchaîner. */
  replay?: boolean;
  onDone: () => void;
}

export const OnboardingIntro: React.FC<OnboardingIntroProps> = ({ start, replay, onDone }) => {
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;
  const slide = replay && isLast ? REPLAY_LAST : SLIDES[index];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chapterRef = useRef<HTMLParagraphElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  // Toucher l'écran : saute à la fin de l'écriture du titre, puis à la fin de la pause.
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!start) return;
    const canvas = canvasRef.current;
    const chapterEl = chapterRef.current;
    const detailEl = detailRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !chapterEl || !detailEl || !ctx) return;

    const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const css = getComputedStyle(document.documentElement);
    const c1 = css.getPropertyValue('--brand-1-rgb').trim() || '224,48,48';
    const c2 = css.getPropertyValue('--brand-2-rgb').trim() || '155,39,175';

    const { segs, stations, lineY, titleTop, scale, X } =
      buildTimeline(SLIDES, W, H, reduced, getComputedStyle(document.body).fontFamily);

    chapterEl.style.top = `${Math.max(64, lineY - 26 - 172 * scale - 34)}px`;
    const placeDetail = (i: number) => { detailEl.style.top = `${titleTop + stations[i].titleH + 14}px`; };
    placeDetail(0);

    // Les moments où un toucher fait sauter l'animation.
    const markers = stations.flatMap((s) => [s.tDone, s.tHoldEnd]).filter(Number.isFinite);

    const t0 = performance.now();
    let shift = 0;      // avance rapide quand on touche l'écran
    let last = t0;
    let cam = 0;        // position de la caméra dans le monde
    let shown = 0;      // étape dont le texte est affiché
    let lastSeg = -1;
    let writeY = lineY;
    let raf = 0;

    skipRef.current = () => {
      const e = performance.now() - t0 + shift;
      const next = markers.find((m) => m > e + 30);
      if (next !== undefined) shift += next - e;
    };

    const frame = (now: number) => {
      // Pas de plafond sur dt : la chronologie suit l'horloge réelle, la caméra doit
      // en faire autant, sinon elle prend du retard dès que l'affichage ralentit.
      const dt = (now - last) / 1000;
      last = now;
      const e = now - t0 + shift;

      // Segment en cours (les segments se suivent sans trou : recherche dichotomique).
      let lo = 0, hi = segs.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (segs[mid].t0 <= e) lo = mid; else hi = mid - 1;
      }
      const si = lo;
      const seg = segs[si];
      const u = clamp01((e - seg.t0) / (seg.t1 - seg.t0));
      const p = seg.ease ? easeInOut(u) : u;

      const hx = seg.ax + (seg.bx - seg.ax) * p;
      let hy = seg.ay + (seg.by - seg.ay) * p;
      if (seg.kind === 'write') {
        // Pendant l'écriture, le point suit la hauteur des lettres qu'il écrit.
        if (si !== lastSeg) writeY = seg.ay;
        let sy = 0, n = 0;
        for (const d of seg.dots) if (d.f <= p && d.f > p - 0.05) { sy += d.y; n++; }
        writeY += ((n ? sy / n : writeY) - writeY) * 0.2;
        hy = writeY;
      }
      lastSeg = si;

      // Caméra : suit le point entre deux étapes, sinon reste centrée sur l'étape.
      const camTarget = seg.follow
        ? hx - W * (0.5 - 0.12 * (1 - p))
        : X(Math.round(seg.sf1)) - W / 2;
      cam = reduced ? camTarget : cam + (camTarget - cam) * (1 - Math.exp(-dt * 6));

      // Textes : ceux de l'étape qu'on vient d'atteindre.
      let ci = 0;
      while (ci + 1 < stations.length && stations[ci + 1].tArrive <= e) ci++;
      if (ci !== shown) { shown = ci; placeDetail(ci); setIndex(ci); }
      const s = stations[ci];
      const out = 1 - clamp01((e - s.tHoldEnd) / 300);
      chapterEl.style.opacity = String(clamp01((e - s.tArrive) / 400) * out);
      detailEl.style.opacity = String(clamp01((e - (s.tDone - 150)) / 400) * out);

      // ── Dessin ──
      const k = reduced ? 1 : clamp01(e / 500);
      const cur = seg.sf0 + (seg.sf1 - seg.sf0) * p;

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // Tout est noir, sauf un dégradé autour du point.
      const sx = hx - cam;
      const pulse = reduced ? 1 : 1 + 0.07 * Math.sin(e / 280);
      const halo = ctx.createRadialGradient(sx, hy, 0, sx, hy, HALO_R * pulse);
      halo.addColorStop(0, `rgba(${c1},${0.55 * k})`);
      halo.addColorStop(0.35, `rgba(${c2},${0.22 * k})`);
      halo.addColorStop(1, `rgba(${c2},0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);

      // L'encre déjà posée. Les étapes passées s'estompent à mesure qu'on avance ;
      // la ligne, elle, reste toujours visible. Les points s'effacent près du bord
      // gauche pour que les dessins ne soient pas coupés net.
      ctx.fillStyle = '#fff';
      for (let g = 0; g <= si; g++) {
        const sg = segs[g];
        if (!sg.dots.length || sg.maxX - cam < -8 || sg.minX - cam > W + 8) continue;
        const live = g === si && sg.kind !== 'wait';
        const dim = sg.trail ? 0.55 : 1 - 0.65 * clamp01(cur - sg.sf0);
        for (const d of sg.dots) {
          const dx = d.x - cam;
          if (dx < -8 || dx > W + 8) continue;
          let a = dim * k * (dx < 100 ? clamp01((dx + 8) / 108) : 1);
          let r = sg.r;
          if (live) {
            if (d.f > p) continue;
            const behind = (p - d.f) * sg.len; // distance derrière le point lumineux
            const glow = Math.max(0, 1 - behind / 160);
            r *= (0.4 + 0.6 * Math.min(1, behind / 26)) * (1 + 0.25 * glow);
            a *= 0.75 + 0.25 * glow;
          }
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(dx, d.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Un petit rond sur la ligne, à chaque étape déjà atteinte.
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      for (const st of stations) {
        const dx = st.x - cam;
        if (e < st.tArrive || dx < -12 || dx > W + 12) continue;
        ctx.globalAlpha = 0.8 * k * (dx < 100 ? clamp01((dx + 12) / 112) : 1);
        ctx.beginPath();
        ctx.arc(dx, lineY, 7, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Le point lumineux.
      ctx.globalAlpha = k;
      ctx.shadowColor = `rgba(${c1},1)`;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(sx, hy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      skipRef.current = () => {};
    };
  }, [start]);

  return (
    <div style={overlay} onClick={() => skipRef.current()}>
      <canvas ref={canvasRef} aria-hidden="true" style={canvasStyle} />
      <button
        onClick={(ev) => { ev.stopPropagation(); onDone(); }}
        style={skipBtn}
      >
        Passer
      </button>

      <div style={content}>
        <p ref={chapterRef} style={chapterStyle}>{slide.chapter}</p>
        {/* Le titre est dessiné en points : on garde une version texte pour les lecteurs d'écran. */}
        <h2 style={srOnly}>{slide.title}</h2>
        <div ref={detailRef} style={detailWrap}>
          <p style={detailStyle}>{slide.detail}</p>
          {isLast && (
            <button
              onClick={(ev) => { ev.stopPropagation(); onDone(); }}
              style={startBtn}
            >
              {replay ? 'Fermer' : 'Commencer'}
            </button>
          )}
        </div>
      </div>

      <div style={dotsRow} aria-hidden="true">
        {SLIDES.map((_, i) => (
          <span key={i} style={{ ...progressDot, ...(i === index ? progressDotActive : {}) }} />
        ))}
      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
// Couleurs en dur (blanc sur noir) : l'intro reste noire quel que soit le thème
// de l'appli, un thème clair rendrait le texte invisible.

const overlay: React.CSSProperties = {
  // Au-dessus des Nouveautés (z-index 1000) : celles-ci attendent la fin de l'intro.
  position: 'fixed', inset: 0, zIndex: 1100, background: '#000', cursor: 'pointer',
  display: 'flex', justifyContent: 'center', overflow: 'hidden',
};
const canvasStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
};
// Les textes sont posés en absolu : leur hauteur est calculée dans l'effet, à
// partir de la ligne et du titre dessinés dans le canvas.
const content: React.CSSProperties = {
  position: 'relative', width: '100%', maxWidth: 440, pointerEvents: 'none',
};
const chapterStyle: React.CSSProperties = {
  position: 'absolute', left: 22, right: 22, margin: 0,
  opacity: 0, color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 700,
  letterSpacing: 2.5, textTransform: 'uppercase',
};
const detailWrap: React.CSSProperties = { position: 'absolute', left: 22, right: 22, opacity: 0 };
const detailStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: '22px', margin: 0,
};
const startBtn: React.CSSProperties = {
  marginTop: 22, width: '100%', padding: '15px 16px', borderRadius: 14, cursor: 'pointer',
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  border: '1px solid transparent', color: '#fff', fontSize: 15, fontWeight: 800,
  pointerEvents: 'auto',
};
const skipBtn: React.CSSProperties = {
  position: 'absolute', right: 18, top: 'max(18px, env(safe-area-inset-top))', zIndex: 1,
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, padding: '8px 4px',
};
const dotsRow: React.CSSProperties = {
  position: 'absolute', left: 0, right: 0, bottom: 'max(26px, env(safe-area-inset-bottom))',
  display: 'flex', justifyContent: 'center', gap: 7, pointerEvents: 'none',
};
const progressDot: React.CSSProperties = {
  width: 5, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.25)',
  transition: 'background 0.3s, width 0.3s',
};
const progressDotActive: React.CSSProperties = { width: 16, background: '#fff' };
const srOnly: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap', margin: -1, padding: 0, border: 0,
};
