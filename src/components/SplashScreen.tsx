import React from 'react';

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
const Letter: React.FC<{ char: string; target: boolean }> = ({ char, target }) => {
  if (!target) return <>{char}</>;
  const base = char.normalize('NFD')[0];
  const accented = char.normalize('NFD').length > 1;
  const glyph = accented ? base : base === 'i' ? 'ı' : base === 'j' ? 'ȷ' : base;
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      {glyph}
      <i className="splash-dot" style={{ top: accented ? '-0.02em' : '0.1em' }} />
    </span>
  );
};

const Word: React.FC<{ text: string; targetIndex: number }> = ({ text, targetIndex }) => (
  <>
    {Array.from(text).map((ch, i) => <Letter key={i} char={ch} target={i === targetIndex} />)}
  </>
);

// Écran de démarrage : tout noir, « Bonjour » + le prénom en haut, puis un
// petit point tombe sur l'accent (ou le point d'un i/j) avant que l'écran
// d'accueil n'apparaisse en fondu. Pur CSS, instantané même hors-ligne.
export const SplashScreen: React.FC<SplashScreenProps> = ({ fadingOut, firstName }) => {
  const name = (firstName ?? '').trim();
  const target = findTarget(name);
  return (
    <div className={`splash-screen${fadingOut ? ' splash-fade' : ''}`} style={wrapper}>
      <h1 style={title}>
        <span className="splash-hello">
          <Word text="Bonjour" targetIndex={target.word === 'hello' ? target.index : -1} />
        </span>
        {name && (
          <span className="splash-name">
            <Word text={name} targetIndex={target.word === 'name' ? target.index : -1} />
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
