import React, { useState, useEffect } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import type { NavTabKey } from '../data/types';
import {
  HomeIcon, TargetIcon, CalendarIcon, HeartPulseIcon,
  DumbbellIcon, ScaleIcon, ChartIcon, UserIcon, SlidersIcon,
} from './NavIcons';

// Le schéma corporel ("Corps") vit maintenant dans l'écran Objectifs (section
// dédiée) plutôt que dans un onglet séparé — voir ObjectivesScreen.tsx.
export type NavView = NavTabKey;

interface NavBarProps {
  active: NavView;
  onNavigate: (view: NavView) => void;
}

const TABS: { id: NavView; label: string }[] = [
  { id: 'home', label: 'Accueil' },
  { id: 'objectifs', label: 'Objectifs' },
  { id: 'historique', label: 'Historique' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'exercices', label: 'Exercices' },
  { id: 'poids', label: 'Poids' },
  { id: 'dashboard', label: 'Stats' },
  { id: 'profil', label: 'Profil' },
  { id: 'settings', label: 'Réglages' },
];

// Icônes ligne dessinées à la main (voir NavIcons.tsx) plutôt que des emojis :
// les emojis rendent différemment selon la plateforme (tailles, styles,
// épaisseurs incohérentes entre eux), ce qui donnait une barre "pas propre".
// Ces icônes partagent le même trait et la même taille partout.
const TAB_ICONS: Record<NavView, React.FC<{ size?: number }>> = {
  home: HomeIcon,
  objectifs: TargetIcon,
  historique: CalendarIcon,
  cardio: HeartPulseIcon,
  exercices: DumbbellIcon,
  poids: ScaleIcon,
  dashboard: ChartIcon,
  profil: UserIcon,
  settings: SlidersIcon,
};

// Le vrai "liquid glass" (distorsion du fond, façon loupe) utilise un filtre
// SVG (feDisplacementMap) appliqué en backdrop-filter. Seuls les navigateurs
// à moteur Blink sur ordinateur (Chrome, Edge...) savent l'appliquer.
// Sur iPhone/iPad, TOUS les navigateurs (même "Chrome") tournent en fait sur
// le moteur WebKit d'Apple en coulisses, qui ne le supporte pas encore — donc
// sur mobile Apple on retombe automatiquement sur un verre dépoli classique
// (flou + reflets), sans la distorsion. C'est une limite du navigateur, pas
// un choix : impossible à contourner en CSS pur.
const supportsLiquidRefraction = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isBlink = /Chrome|Chromium|Edg\//.test(ua);
  return isBlink && !isIOS;
};

// Barre de navigation "liquid glass" (façon iOS 26) : flotte au-dessus du
// contenu, fond translucide + flou + reflet spéculaire en haut, distorsion
// réelle du fond en bonus sur Chrome desktop. Uniquement affichée quand le
// réglage est activé, et jamais pendant une séance en cours (voir App.tsx)
// pour ne pas distraire pendant l'entraînement.
export const NavBar: React.FC<NavBarProps> = ({ active, onNavigate }) => {
  const [refraction, setRefraction] = useState(false);
  useEffect(() => { setRefraction(supportsLiquidRefraction()); }, []);
  const navBarTabsEnabled = useWorkoutStore((s) => s.navBarTabsEnabled);
  // "Réglages" reste toujours affiché, même désactivé — sinon on n'a plus
  // aucun moyen de rallumer les autres onglets depuis la barre.
  const visibleTabs = TABS.filter((tab) => tab.id === 'settings' || navBarTabsEnabled[tab.id]);

  return (
    <div style={wrapper}>
      <div className={`navbar-glass${refraction ? ' navbar-glass-refract' : ''}`} style={glass}>
        {/* Reflet spéculaire du haut — fonctionne partout (pur dégradé CSS) */}
        <div style={sheen} />

        {visibleTabs.map((tab) => {
          const isActive = tab.id === active;
          const Icon = TAB_ICONS[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              style={tabBtn}
              aria-label={tab.label}
            >
              <span
                style={{
                  ...iconPill,
                  background: isActive ? 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(var(--brand-1-rgb), 0.45)' : 'none',
                  transform: isActive ? 'translateY(-1px) scale(1)' : 'scale(0.94)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                }}
              >
                <Icon size={17} />
              </span>
              {/* Le libellé ne s'affiche que pour l'onglet actif — avec 9
                  onglets, les afficher tous rendrait la barre trop large
                  (elle doit rester petite). On garde quand même la place
                  réservée (espace insécable) pour que les icônes ne
                  sautent pas verticalement selon l'onglet actif. */}
              <span style={{ ...tabLabel, color: isActive ? 'var(--text-primary)' : 'transparent', fontWeight: isActive ? 800 : 600 }}>
                {isActive ? tab.label : ' '}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtre SVG de distorsion — invisible, référencé via backdrop-filter
          dans .navbar-glass-refract (index.css). N'a d'effet que sur Chrome
          desktop (voir supportsLiquidRefraction ci-dessus) ; ignoré partout
          ailleurs, où seul le flou classique s'applique. */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="liquidGlassNav" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.009 0.02" numOctaves="2" seed="7" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2.5" result="softNoise" />
            <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="16" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

const wrapper: React.CSSProperties = {
  position: 'fixed',
  left: 0, right: 0,
  bottom: 'max(10px, env(safe-area-inset-bottom))',
  display: 'flex',
  justifyContent: 'center',
  zIndex: 50,
  pointerEvents: 'none',
};

const glass: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  pointerEvents: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  padding: '6px 6px',
  borderRadius: 22,
  maxWidth: 460,
  width: 'calc(100% - 24px)',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  boxShadow: '0 -1px 0 var(--glass-highlight) inset, 0 6px 24px rgba(0,0,0,0.35)',
};

// Reflet du dessus : bande lumineuse fine collée au bord haut du verre, comme
// la lumière qui accroche le bourrelet d'une vraie lentille. Pur CSS, visible
// sur tous les navigateurs (contrairement à la distorsion SVG).
const sheen: React.CSSProperties = {
  position: 'absolute',
  top: 0, left: '8%', right: '8%',
  height: '46%',
  borderRadius: '50% 50% 60% 60% / 100% 100% 30% 30%',
  background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), rgba(255,255,255,0))',
  pointerEvents: 'none',
};

const tabBtn: React.CSSProperties = {
  position: 'relative',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  padding: '3px 2px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
};

const iconPill: React.CSSProperties = {
  width: 27, height: 27,
  borderRadius: 13.5,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'transform 0.18s cubic-bezier(0.34, 1.4, 0.64, 1), background 0.18s ease, box-shadow 0.18s ease',
};

const tabLabel: React.CSSProperties = {
  fontSize: 8,
  letterSpacing: 0.15,
  transition: 'color 0.15s ease',
};
