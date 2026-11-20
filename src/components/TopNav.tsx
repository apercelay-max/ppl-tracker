import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { TABS, TAB_ICONS } from './NavBar';
import type { NavView } from './NavBar';

// Barre d'onglets du haut : l'autre choix possible à la place de la capsule du bas
// (Réglages → Barre de menus → Position). Deux présentations, même contenu :
//  - « ruban »   : une capsule fine ; « Onglets : » la déplie en une ligne qui défile ;
//  - « sommaire » : le texte « Onglets : » ouvre un panneau qui descend, en deux colonnes.
// Écriture volontairement très fine (graisse 200-300) et icônes au trait fin : l'idée est
// que la barre se fasse oublier. Les animations sont dans index.css (.topnav-*).

interface TopNavProps {
  variant: 'ruban' | 'sommaire';
  active: NavView;
  onNavigate: (view: NavView) => void;
  onStartSession?: () => void;
  hasSessionInProgress?: boolean;
}

const ChevronIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const PlusThin: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const TopNav: React.FC<TopNavProps> = ({ variant, active, onNavigate, onStartSession, hasSessionInProgress }) => {
  const navBarTabsEnabled = useWorkoutStore((s) => s.navBarTabsEnabled);
  // « Réglages » reste toujours là, comme dans la capsule : sans lui on ne pourrait plus
  // rallumer les autres onglets. Ici tout tient dans la liste, donc pas de notion d'épinglé.
  const tabs = useMemo(
    () => TABS.filter((t) => t.id === 'settings' || navBarTabsEnabled[t.id]),
    [navBarTabsEnabled],
  );
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const trackRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const bubbleReady = useRef(false);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Échap referme (clavier d'iPad, ordinateur).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const scrollToActive = (smooth: boolean) => {
    const track = trackRef.current;
    const el = tabRefs.current[active];
    if (!track || !el) return;
    const left = Math.max(0, el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2);
    track.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
  };

  // La pastille (ruban) glisse derrière l'onglet actif. Mesurée et non calculée : la
  // largeur de chaque onglet dépend de son libellé. Premier placement sans transition,
  // sinon elle traverserait la barre depuis la gauche à l'ouverture de l'appli.
  useLayoutEffect(() => {
    if (variant !== 'ruban') return;
    const b = bubbleRef.current;
    const el = tabRefs.current[active];
    if (!b || !el) return;
    const place = () => {
      b.style.left = `${el.offsetLeft}px`;
      b.style.width = `${el.offsetWidth}px`;
    };
    if (!bubbleReady.current) b.style.transition = 'none';
    place();
    if (!bubbleReady.current) {
      void b.offsetWidth;
      b.style.transition = '';
      bubbleReady.current = true;
    }
    // La largeur de l'onglet peut changer après le premier calcul (polices, icônes) : on suit.
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [variant, active, tabs]);

  // Une fois la capsule étirée, on centre l'onglet actif dans le ruban.
  useEffect(() => {
    if (variant !== 'ruban' || !open) return;
    const t = window.setTimeout(() => scrollToActive(true), 420);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, open, active]);

  const choose = (id: NavView) => {
    onNavigate(id);
    window.clearTimeout(closeTimer.current);
    // On laisse voir la pastille arriver avant de refermer.
    closeTimer.current = window.setTimeout(() => setOpen(false), variant === 'ruban' ? 700 : 380);
  };

  const label = (
    <button
      type="button"
      className="topnav-lbl"
      aria-expanded={open}
      aria-label={`Onglets, ${current.label}`}
      onClick={() => { window.clearTimeout(closeTimer.current); setOpen((v) => !v); }}
    >
      <span className="topnav-lbl-t">Onglets :</span>
      <span className="topnav-cur"><span>{current.label}</span></span>
      {variant === 'ruban'
        ? <span className="topnav-chev"><ChevronIcon /></span>
        : <span className="topnav-plus"><PlusThin /></span>}
    </button>
  );

  const startBtn = onStartSession && (
    <button
      type="button"
      className="topnav-go"
      onClick={onStartSession}
      aria-label={hasSessionInProgress ? 'Reprendre la séance' : 'Commencer la séance'}
      title={hasSessionInProgress ? 'Reprendre la séance' : 'Commencer la séance'}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8 5.6c0-.9 1-1.5 1.8-1L18 11.1a1.1 1.1 0 0 1 0 1.8L9.8 19.4c-.8.5-1.8-.1-1.8-1V5.6Z" />
      </svg>
    </button>
  );

  return (
    <div className={`topnav topnav-${variant}`} data-open={open}>
      {/* Fond invisible (ruban) ou voile (sommaire) : toucher en dehors referme. */}
      <div className="topnav-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
      {variant === 'sommaire' && <div className="topnav-fade" aria-hidden="true" />}

      {variant === 'sommaire' && (
        <div className="topnav-sheet" role="menu" aria-hidden={!open}>
          <div className="topnav-idx">
            {tabs.map((tab, i) => {
              const on = tab.id === active;
              const Icon = TAB_ICONS[tab.id];
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="menuitem"
                  tabIndex={open ? 0 : -1}
                  className={`topnav-row${on ? ' on' : ''}`}
                  style={{ '--d': `${(i % 6) * 34 + Math.floor(i / 6) * 70}ms` } as React.CSSProperties}
                  aria-current={on ? 'page' : undefined}
                  onClick={() => choose(tab.id)}
                >
                  <Icon size={18} filled={on} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="topnav-bar">
        <div className="topnav-row-wrap">
          {variant === 'ruban' ? (
            <div className="navbar-glass nav-capsule topnav-glass">
              {label}
              <div className="topnav-ribbon">
                <div className="topnav-track" ref={trackRef} role="group" aria-label="Liste des onglets">
                  <span className="topnav-bubble" ref={bubbleRef} aria-hidden="true" />
                  {tabs.map((tab, i) => {
                    const on = tab.id === active;
                    const Icon = TAB_ICONS[tab.id];
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        ref={(el) => { tabRefs.current[tab.id] = el; }}
                        tabIndex={open ? 0 : -1}
                        className={`topnav-tab${on ? ' on' : ''}`}
                        style={{ '--d': `${Math.min(i, 6) * 30}ms` } as React.CSSProperties}
                        aria-current={on ? 'page' : undefined}
                        onClick={() => choose(tab.id)}
                      >
                        <Icon size={16} filled={on} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="topnav-head">{label}</div>
          )}
          {startBtn}
        </div>
      </div>
    </div>
  );
};
