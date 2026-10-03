import React, { useEffect, useRef } from 'react';
import { IconPMark } from './Icons';

interface SplashScreenProps {
  fadingOut: boolean;
  firstName?: string;
}

const MARK = /[̀-ͯ]/;

// Cherche la lettre qui portera le point : la première lettre à point ou à
// accent du prénom (i, j, é, è, ï…), sinon le « j » de « Bonjour ».
const findTarget = (name: string): { word: 'hello' | 'name'; index: number } => {
  for (let i = 0; i < name.length; i++) {
    const c = name[i];
    if (/[ij]/i.test(c) && c === c.toLowerCase()) return { word: 'name', index: i };
    if (MARK.test(c.normalize('NFD').slice(1))) return { word: 'name', index: i };
  }
  return { word: 'hello', index: 'Bonjour'.indexOf('j') };
};

// Une lettre, avec son point/accent remplacé par le point animé quand c'est la cible.
type DotRef = React.RefObject<HTMLElement>;

const Letter: React.FC<{ char: string; target: boolean; dotRef: DotRef }> = ({ char, target, dotRef }) => {
  if (!target) return <>{char}</>;
  const base = char.normalize('NFD')[0];
  const accented = char.normalize('NFD').length > 1;
  const glyph = accented ? base : base === 'i' ? 'ı' : base === 'j' ? 'ȷ' : base;
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {glyph}
      <i ref={dotRef} className="splash-dot" style={{ top: accented ? '-0.02em' : '0.1em' }} />
    </span>
  );
};

const Word: React.FC<{ text: string; targetIndex: number; dotRef: DotRef }> = ({ text, targetIndex, dotRef }) => (
  <>
    {Array.from(text).map((ch, i) => <Letter key={i} char={ch} target={i === targetIndex} dotRef={dotRef} />)}
  </>
);

// Écran de démarrage : le « PPL » d'avant s'affiche, puis se transforme en un
// point qui part du centre, accélère puis ralentit pour se poser sur l'accent
// (ou le point d'un i/j) du prénom. « Bonjour <prénom> » se révèle alors en
// haut, puis l'accueil apparaît en fondu. Le trajet est mesuré sur l'écran
// réel (Web Animations), pour tomber pile sur la lettre quelle que soit la taille.
const PPL_HOLD_MS = 700;
const GROW_MS = 300;
const TRAVEL_MS = 750;

export const SplashScreen: React.FC<SplashScreenProps> = ({ fadingOut, firstName }) => {
  const name = (firstName ?? '').trim();
  const target = findTarget(name);
  const dotRef = useRef<HTMLElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fly = flyRef.current;
    const dest = dotRef.current;
    if (!fly || !dest) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { fly.style.display = 'none'; return; }
    const r = dest.getBoundingClientRect();
    const dx = r.left + r.width / 2 - window.innerWidth / 2;
    const dy = r.top + r.height / 2 - window.innerHeight / 2;
    const size = fly.offsetWidth || 20;
    const end = r.width / size;
    const total = GROW_MS + TRAVEL_MS;
    const anim = fly.animate(
      [
        { transform: 'translate(0px, 0px) scale(0)', offset: 0, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
        { transform: 'translate(0px, 0px) scale(1)', offset: GROW_MS / total, easing: 'cubic-bezier(0.7, 0, 0.3, 1)' },
        { transform: `translate(${dx}px, ${dy}px) scale(${end})`, offset: 1 },
      ],
      { duration: total, delay: PPL_HOLD_MS, fill: 'both' }
    );
    anim.onfinish = () => { fly.style.display = 'none'; };
    return () => anim.cancel();
  }, []);

  return (
    <div className={`splash-screen${fadingOut ? ' splash-fade' : ''}`} style={wrapper}>
      <div className="splash-ppl" style={pplBlock}>
        <div className="splash-badge" style={badge}>
          <IconPMark size={38} color="#ffffff" />
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {['P', 'P', 'L'].map((letter, i) => (
            <span key={i} className="splash-letter titre-irise" style={{ fontSize: 64, fontWeight: 900, letterSpacing: -2, lineHeight: 1, animationDelay: `${i * 0.09}s` }}>
              {letter}
            </span>
          ))}
        </div>
        <p className="splash-sub" style={subStyle}>Tracker</p>
      </div>
      <div ref={flyRef} className="splash-fly" />
      <h1 style={title}>
        <span className="splash-hello">
          <Word text="Bonjour" targetIndex={target.word === 'hello' ? target.index : -1} dotRef={dotRef} />
        </span>
        {name && (
          <span className="splash-name">
            <Word text={name} targetIndex={target.word === 'name' ? target.index : -1} dotRef={dotRef} />
          </span>
        )}
      </h1>
    </div>
  );
};

const wrapper: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 999, background: '#000',
  display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
  padding: 'calc(env(safe-area-inset-top, 0px) + 36px) 20px 0',
};

const title: React.CSSProperties = {
  fontSize: 34, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1, margin: 0,
};

const pplBlock: React.CSSProperties = {
  position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', gap: 4, pointerEvents: 'none',
};
const badge: React.CSSProperties = {
  width: 64, height: 64, borderRadius: 'var(--icon-radius)',
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 8px 28px rgba(var(--brand-1-rgb), 0.4)', marginBottom: 18,
};
const subStyle: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 13, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', marginTop: 6,
};
