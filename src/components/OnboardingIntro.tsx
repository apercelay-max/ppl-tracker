import React, { useEffect, useRef, useState } from 'react';

/**
 * Intro du tout premier lancement : écran noir, un point lumineux file vers la
 * droite et « écrit » chaque titre en petits points ronds (comme un afficheur
 * à points), étape par étape. D'abord ce que PPL fait, puis pourquoi elle
 * existe, puis on enchaîne sur le quiz (OnboardingQuiz.tsx).
 *
 * Rien n'est enregistré : si on quitte l'appli avant la fin du quiz, l'intro
 * est simplement rejouée au prochain lancement. Elle n'apparaît pas quand on
 * refait le quiz depuis les Réglages (voir App.tsx).
 *
 * Le titre est dessiné en points (canvas), mais la phrase d'explication reste
 * du vrai texte : un afficheur à points est joli, pas fait pour se lire sur
 * trois lignes.
 */

interface Slide { chapter: string; title: string; detail: string }

// ─── Textes : c'est ici, et seulement ici, qu'on les modifie ─────────────────
// Titres courts (2-3 mots) : ils sont écrits en gros, en points.

const CH_DOES = 'Ce qu’elle fait';
const CH_WHY = 'Pourquoi elle existe';

const SLIDES: Slide[] = [
  { chapter: CH_DOES, title: 'Note tes séances',
    detail: 'Séries, charges et repos se saisissent en quelques secondes, même entre deux séries.' },
  { chapter: CH_DOES, title: 'Suis tes progrès',
    detail: 'Historique, records, poids de corps et stats : tu vois ce qui avance.' },
  { chapter: CH_DOES, title: 'Ton programme',
    detail: 'Push / Pull / Legs, full body… ou le tien, construit à partir de quelques questions.' },
  { chapter: CH_DOES, title: 'Un coach IA',
    detail: 'Il lit ton historique et te conseille. C’est une aide, pas un avis médical.' },
  { chapter: CH_DOES, title: 'Partout avec toi',
    detail: 'Un compte garde tes données d’un téléphone à l’autre, et un binôme peut suivre tes séances.' },
  { chapter: CH_WHY, title: 'Rester simple',
    detail: 'Une appli en français, claire même en pleine séance, qui note vraiment ce que tu soulèves.' },
  { chapter: CH_WHY, title: 'Tes données',
    detail: 'Elles t’appartiennent : exporte tout en Excel quand tu veux.' },
  { chapter: CH_WHY, title: 'Être régulier',
    detail: 'Trois séances vraiment faites valent mieux que six jamais faites. PPL est là pour ça.' },
  { chapter: 'À toi de jouer', title: 'C’est parti',
    detail: 'Quelques questions pour construire ton programme. Tu verras tout avant de valider.' },
];

// Dernier écran pour qui a déjà passé le quiz : pas de quiz à enchaîner.
const REPLAY_LAST: Slide = {
  chapter: 'À toi de jouer', title: 'C’est parti',
  detail: 'Tu peux refaire le quiz à tout moment : Réglages → Séance → « Refaire le quiz ».',
};

// ─── Réglages de l'animation ─────────────────────────────────────────────────

const GRID = 5;          // pas de la grille de points, en px
const DOT_R = 2.1;       // rayon d'un point
const FADE_MS = 350;     // apparition / disparition d'une étape
const SWEEP_MS = 1500;   // temps que met le point pour traverser le titre
const HOLD_MS = 2800;    // temps de lecture une fois le titre écrit
const HOLD_REDUCED_MS = 3800;
const HALO_R = 190;

type Dot = { x: number; y: number };

/**
 * Écrit le titre dans un canvas caché puis le transforme en une liste de points
 * (un par case de la grille où il y a de l'encre). La taille de police
 * diminue jusqu'à ce que le plus long mot tienne dans la largeur : sans ça,
 * « Partout avec toi » déborderait de l'écran d'un petit téléphone.
 */
const buildDots = (text: string, width: number, fontFamily: string): { dots: Dot[]; height: number } => {
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
  const dots: Dot[] = [];
  for (let y = 0; y + half < h; y += GRID) {
    for (let x = 0; x + half < w; x += GRID) {
      // On lit la transparence au centre de la case : > 110/255 = de l'encre.
      if (px[((y + half) * w + x + half) * 4 + 3] > 110) dots.push({ x: x + GRID / 2, y: y + GRID / 2 });
    }
  }
  return { dots, height: h };
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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
  const stageRef = useRef<HTMLDivElement>(null);
  const chapterRef = useRef<HTMLParagraphElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  // Toucher l'écran : finit d'écrire le titre, puis passe à l'étape suivante.
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!start) return;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const chapterEl = chapterRef.current;
    const detailEl = detailRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !stage || !chapterEl || !detailEl || !ctx) return;

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

    // Les points sont calculés dans le repère du bloc « stage », puis décalés
    // à sa vraie position à l'écran : le canvas, lui, couvre tout l'écran pour
    // que le halo du point déborde librement autour du titre.
    const rect = stage.getBoundingClientRect();
    const built = buildDots(slide.title, rect.width, getComputedStyle(document.body).fontFamily);
    const ox = rect.left;
    const oy = rect.top + (rect.height - built.height) / 2;
    const dots = built.dots.map((d) => ({ x: d.x + ox, y: d.y + oy }));
    const xs = dots.map((d) => d.x);
    const x0 = (xs.length ? Math.min(...xs) : ox) - 14;
    const x1 = (xs.length ? Math.max(...xs) : ox + rect.width) + 14;
    const midY = rect.top + rect.height / 2;

    const sweepMs = reduced ? 0 : SWEEP_MS;
    const sweepStart = reduced ? 0 : FADE_MS;
    const sweepEnd = sweepStart + sweepMs;
    const holdEnd = isLast ? Infinity : sweepEnd + (reduced ? HOLD_REDUCED_MS : HOLD_MS);
    const end = holdEnd + FADE_MS;

    const t0 = performance.now();
    let shift = 0; // avance rapide quand on touche l'écran
    let hy = midY;
    let raf = 0;

    skipRef.current = () => {
      const e = performance.now() - t0 + shift;
      if (e < sweepEnd) shift += sweepEnd - e;
      // Pas sur le dernier écran : son attente est infinie (on attend « Commencer »),
      // et l'y ajouter ferait sauter l'intro au-delà de sa dernière étape.
      else if (!isLast && e < holdEnd) shift += holdEnd - e;
    };

    const frame = (now: number) => {
      const e = now - t0 + shift;
      if (e >= end) {
        chapterEl.style.opacity = '0';
        detailEl.style.opacity = '0';
        setIndex((i) => i + 1);
        return;
      }
      const fadeIn = reduced ? 1 : clamp01(e / FADE_MS);
      const fadeOut = e > holdEnd ? clamp01(1 - (e - holdEnd) / FADE_MS) : 1;
      const k = fadeIn * fadeOut;
      const p = sweepMs === 0 ? 1 : easeInOut(clamp01((e - sweepStart) / sweepMs));
      const hx = x0 + (x1 - x0) * p;
      const settle = clamp01((e - sweepEnd) / 500);

      chapterEl.style.opacity = String(k);
      detailEl.style.opacity = String(clamp01((e - (sweepEnd - 150)) / 400) * fadeOut);

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // Le point suit la hauteur des lettres qu'il est en train d'écrire.
      let sy = 0;
      let n = 0;
      for (const d of dots) if (d.x <= hx && d.x > hx - 16) { sy += d.y; n++; }
      hy += ((n ? sy / n : hy) - hy) * 0.18;

      // Tout est noir, sauf un dégradé autour du point.
      const pulse = reduced ? 1 : 1 + 0.07 * Math.sin(e / 280);
      const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, HALO_R * pulse);
      halo.addColorStop(0, `rgba(${c1},${0.55 * k})`);
      halo.addColorStop(0.35, `rgba(${c2},${0.22 * k})`);
      halo.addColorStop(1, `rgba(${c2},0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);

      // Les points déjà écrits : grossissent à l'arrivée du point, brillent
      // près de lui, puis se posent à la fin pour que le titre se lise bien.
      ctx.fillStyle = '#fff';
      const base = 0.45 + 0.5 * settle;
      for (const d of dots) {
        const behind = hx - d.x;
        if (behind < 0) continue;
        const glow = Math.max(0, 1 - behind / 200);
        ctx.globalAlpha = (base + (1 - base) * glow) * k;
        ctx.beginPath();
        ctx.arc(d.x, d.y, DOT_R * (0.4 + 0.6 * Math.min(1, behind / 26)) * (1 + 0.25 * glow), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = k;
      ctx.shadowColor = `rgba(${c1},1)`;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
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
  }, [start, index, slide.title, isLast]);

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
        <div ref={stageRef} style={stage}>
          {/* Le titre est dessiné en points : on garde une version texte pour les lecteurs d'écran. */}
          <h2 style={srOnly}>{slide.title}</h2>
        </div>
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
const content: React.CSSProperties = {
  position: 'relative', width: '100%', maxWidth: 440, padding: '0 22px',
  display: 'flex', flexDirection: 'column', justifyContent: 'center', pointerEvents: 'none',
};
const chapterStyle: React.CSSProperties = {
  opacity: 0, color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 700,
  letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14,
};
const stage: React.CSSProperties = { height: 210, position: 'relative' };
const detailWrap: React.CSSProperties = { opacity: 0, marginTop: 18, minHeight: 120 };
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
