import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import type { NavTabKey } from '../data/types';
import { NAV_GROUPS, groupOfView, type NavGroup, type NavGroupId } from '../data/navGroups';
import {
HomeIcon, TargetIcon, CalendarIcon, HeartPulseIcon,
DumbbellIcon, ScaleIcon, ChartIcon, UserIcon, SlidersIcon,
} from './NavIcons';

// Étincelles du Coach IA. Définie ici comme BookIcon plus bas : elle ne sert
// qu'à la barre, et elle a besoin de la variante "filled" comme les autres.
const SparklesIcon: React.FC<{ size?: number; filled?: boolean }> = ({ size = 22, filled }) => (
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
strokeWidth={filled ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
<path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z"
fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.2 : 0} />
<path d="M18 15l.9 2.1 2.1.9-2.1.9L18 21l-.9-2.1-2.1-.9 2.1-.9L18 15Z"
fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.2 : 0} />
</svg>
);

// Le schéma corporel ("Corps") vit maintenant dans l'écran Objectifs (section
// dédiée) plutôt que dans un onglet séparé — voir ObjectivesScreen.tsx.

// Icône du catalogue (livre ouvert) définie ici plutôt que dans NavIcons.tsx :
// elle n'est utilisée que par la barre, autant garder le changement contenu.
// Même trait et même taille que les autres icônes, avec sa variante "filled".
const BookIcon: React.FC<{ size?: number; filled?: boolean }> = ({ size = 22, filled }) => (
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
strokeWidth={filled ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
<path d="M3 5.6A1.6 1.6 0 0 1 4.6 4H9a3 3 0 0 1 3 3v12a2.6 2.6 0 0 0-2.6-2.6H4.6A1.6 1.6 0 0 1 3 14.8V5.6Z"
fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.2 : 0} />
<path d="M21 5.6A1.6 1.6 0 0 0 19.4 4H15a3 3 0 0 0-3 3v12a2.6 2.6 0 0 1 2.6-2.6h4.8A1.6 1.6 0 0 0 21 14.8V5.6Z"
fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.2 : 0} />
</svg>
);

// Petite coche affichée à droite de la rubrique ouverte dans la liste.
const CheckIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
<path d="M5 13l4 4L19 7" />
</svg>
);

export type NavView = NavTabKey;

interface NavBarProps {
active: NavView;
onNavigate: (view: NavView) => void;
// Bouton rouge à droite de la capsule : reprend la séance en cours, ou
// ouvre la prochaine du cycle. Optionnel — sans lui, le bouton n'apparaît pas.
onStartSession?: () => void;
hasSessionInProgress?: boolean;
}

// Les 11 écrans, dans l'ordre d'avant. Exportés pour la barre d'onglets du haut
// (TopNav.tsx), qui garde pour l'instant la liste complète. La barre du bas,
// elle, ne montre plus que les 5 onglets de data/navGroups.ts.
export const TABS: { id: NavView; label: string }[] = [
{ id: 'home', label: 'Accueil' },
{ id: 'objectifs', label: 'Objectifs' },
{ id: 'historique', label: 'Historique' },
{ id: 'cardio', label: 'Cardio' },
{ id: 'exercices', label: 'Exercices' },
{ id: 'catalogue', label: 'Catalogue' },
{ id: 'poids', label: 'Poids' },
{ id: 'dashboard', label: 'Stats' },
{ id: 'coach', label: 'Coach' },
{ id: 'profil', label: 'Profil' },
{ id: 'settings', label: 'Réglages' },
];

// Icônes ligne dessinées à la main (voir NavIcons.tsx) plutôt que des emojis :
// les emojis rendent différemment selon la plateforme (tailles, styles,
// épaisseurs incohérentes entre eux), ce qui donnait une barre "pas propre".
// Ces icônes partagent le même trait et la même taille partout, et ont
// chacune une variante "filled" (voir plus bas, présentation façon Apple).
// Une icône par écran : elles servent dans la liste des rubriques, et à la barre du haut.
export const TAB_ICONS: Record<NavView, React.FC<{ size?: number; filled?: boolean }>> = {
home: HomeIcon,
objectifs: TargetIcon,
historique: CalendarIcon,
cardio: HeartPulseIcon,
exercices: DumbbellIcon,
catalogue: BookIcon,
poids: ScaleIcon,
dashboard: ChartIcon,
coach: SparklesIcon,
profil: UserIcon,
settings: SlidersIcon,
};

// Une icône par onglet de la barre (et non par écran) : on reconnaît l'onglet
// à un coup d'œil, sans avoir à deviner que « Séances » s'ouvre sur un calendrier.
const GROUP_ICONS: Record<NavGroupId, React.FC<{ size?: number; filled?: boolean }>> = {
accueil: HomeIcon,
seances: DumbbellIcon,
progres: ChartIcon,
coach: SparklesIcon,
profil: UserIcon,
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

// Bruit fin (texture Liquid Glass Apple) : SVG turbulence encodé en data-URI,
// généré une seule fois au chargement du module (pas à chaque render).
const NOISE_URL =
'data:image/svg+xml;utf8,' +
encodeURIComponent(
"<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>" +
"<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter>" +
"<rect width='100%' height='100%' filter='url(%23n)'/></svg>"
);

// Petit chevron sous l'onglet ouvert : il dit « touche encore pour voir la
// liste ». Il remplace l'ancien point. Il se retourne quand la liste est ouverte.
// Il garde la même hauteur que le point d'avant (5 px) pour ne pas changer la barre.
const ChevronMark: React.FC<{ shown: boolean; open?: boolean }> = ({ shown, open }) => (
<span
style={{ ...tabMark, opacity: shown ? 1 : 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
aria-hidden="true"
>
<svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor"
strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
<path d="M1.5 4.8L5 1.4l3.5 3.4" />
</svg>
</span>
);

// Barre de navigation "liquid glass" (façon iOS 26) : flotte au-dessus du
// contenu, fond translucide + flou + reflet spéculaire en haut, distorsion
// réelle du fond en bonus sur Chrome desktop. Uniquement affichée quand le
// réglage est activé, et jamais pendant une séance en cours (voir App.tsx)
// pour ne pas distraire pendant l'entraînement.
//
// Ajouts (juillet 2026) : un halo lumineux qui suit le doigt/curseur (via
// variables CSS --gx/--gy mises à jour directement sur le DOM, sans passer
// par un state React — donc sans re-render à chaque mouvement) et un léger
// "rebond" au clic (scale 0.98 → 1) pour un rendu plus proche du vrai verre.
//
// Refonte (novembre 2026) : 12 onglets, c'était trop (bouton « Plus », onglets à
// épingler, bandeau « barre trop chargée »…). La barre n'a plus que 5 onglets
// fixes (voir data/navGroups.ts). Toucher un onglet ouvre son premier écran ;
// toucher l'onglet DÉJÀ ouvert déplie la liste de ses rubriques, au-dessus de la barre.
export const NavBar: React.FC<NavBarProps> = ({ active, onNavigate, onStartSession, hasSessionInProgress }) => {
const [refraction, setRefraction] = useState(false);
useEffect(() => { setRefraction(supportsLiquidRefraction()); }, []);
const [menuOpen, setMenuOpen] = useState(false);
const glassRef = useRef<HTMLDivElement>(null);
const [pressed, setPressed] = useState(false);
const [barWidth, setBarWidth] = useState(0);

// L'onglet qui contient l'écran ouvert est celui qui est allumé, même quand on
// est sur l'une de ses rubriques (le Catalogue allume « Coach »).
const activeGroup = groupOfView(active);
const activeSlot = NAV_GROUPS.indexOf(activeGroup);

// Tout changement d'écran (par la barre ou autrement) referme la liste.
useEffect(() => { setMenuOpen(false); }, [active]);

// Échap referme la liste (clavier d'iPad, ordinateur).
useEffect(() => {
if (!menuOpen) return;
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
window.addEventListener('keydown', onKey);
return () => window.removeEventListener('keydown', onKey);
}, [menuOpen]);

// Mesure la largeur réelle du verre : la bulle (plus bas) est placée d'après la
// position mesurée des onglets, donc elle doit suivre un changement de largeur.
// ResizeObserver plutôt qu'un listener "resize" : ça couvre aussi la rotation
// de l'iPhone et le clavier qui s'ouvre, et ça se déclenche une fois au montage.
useEffect(() => {
const el = glassRef.current;
if (!el || typeof ResizeObserver === 'undefined') return;
const ro = new ResizeObserver((entries) => {
const w = entries[0]?.contentRect.width ?? 0;
setBarWidth((prev) => (Math.abs(prev - w) > 1 ? w : prev));
});
ro.observe(el);
return () => ro.disconnect();
}, []);

// ── Bulle mobile avec lentille ────────────────────────────────────────────
// Une seule bulle glisse derrière l'onglet ouvert. À l'intérieur, une copie
// agrandie des icônes (la « lentille ») glisse en sens inverse pour rester
// alignée avec la vraie barre : on voit les icônes grossies à travers le verre.
// C'est la seule façon d'avoir une déformation sur iPhone, où le filtre SVG
// de backdrop-filter n'existe pas. La position est mesurée (et non calculée)
// pour rester juste quelle que soit la largeur de l'écran.
const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
const bubbleRef = useRef<HTMLDivElement>(null);
const prevSlot = useRef<number | null>(null);
const [geo, setGeo] = useState<{ x: number; y: number; w: number; h: number; cw: number; ch: number } | null>(null);
const [bubbleReady, setBubbleReady] = useState(false);
// Une fois la bulle posée au bon endroit, on active ses transitions : sans ça
// elle glisserait depuis le coin à l'ouverture de l'appli.
useLayoutEffect(() => {
  const cap = glassRef.current;
  const btn = tabRefs.current[activeSlot];
  if (!cap || !btn) return;
  const OVER = 3; // la bulle déborde de l'onglet pour paraître plus grosse (sans être rognée par la capsule)
  setGeo({ x: btn.offsetLeft - OVER, y: btn.offsetTop - 4, w: btn.offsetWidth + OVER * 2, h: btn.offsetHeight + 8, cw: cap.clientWidth, ch: cap.clientHeight });
}, [activeSlot, barWidth]);
useEffect(() => {
  if (!geo || bubbleReady) return;
  const id = requestAnimationFrame(() => setBubbleReady(true));
  return () => cancelAnimationFrame(id);
}, [geo, bubbleReady]);
// Étirement façon goutte pendant le trajet, puis léger rebond à l'arrivée.
// Plus l'onglet visé est loin, plus la bulle s'étire.
useEffect(() => {
  const prev = prevSlot.current;
  prevSlot.current = activeSlot;
  const el = bubbleRef.current;
  if (!el || prev === null || prev === activeSlot) return;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const stretch = Math.min(0.5, 0.16 * Math.abs(activeSlot - prev));
  el.animate(
    [
      { scale: '1 1' },
      { scale: `${1 + stretch} 0.9`, offset: 0.35 },
      { scale: `${1 - stretch * 0.25} 1.06`, offset: 0.7 },
      { scale: '1 1' },
    ],
    { duration: 720, easing: 'cubic-bezier(0.3, 0, 0.3, 1)' },
  );
}, [activeSlot]);

// Un autre onglet : on ouvre son premier écran (celui que l'utilisateur veut voir en
// arrivant). Le même onglet : on déplie (ou replie) la liste de ses rubriques.
const handleTabPress = (group: NavGroup) => {
if (group.id === activeGroup.id) { setMenuOpen((v) => !v); return; }
setMenuOpen(false);
onNavigate(group.items[0].view);
};

const handlePick = (view: NavView) => {
setMenuOpen(false);
if (view !== active) onNavigate(view);
};

// Met à jour la position du halo directement en CSS var (perf : évite un
// re-render React à chaque pixel de déplacement de la souris).
const handlePointerMove = useCallback((e: React.PointerEvent) => {
const el = glassRef.current;
if (!el) return;
const rect = el.getBoundingClientRect();
const x = ((e.clientX - rect.left) / rect.width) * 100;
const y = ((e.clientY - rect.top) / rect.height) * 100;
el.style.setProperty('--gx', `${x}%`);
el.style.setProperty('--gy', `${y}%`);
}, []);

// La liste sort de l'onglet touché : son animation part du centre de cet onglet
// (même gauche que la capsule, la liste et la rangée ont la même largeur).
const listOriginX = geo ? geo.x + geo.w / 2 : null;

return (
<div style={wrapper}>
{menuOpen && (
<>
{/* Fond invisible pour fermer la liste en touchant en dehors */}
<div style={backdrop} onClick={() => setMenuOpen(false)} />
{/* Le panneau est centré par un conteneur flex plutôt que par un
translateX(-50%) : ça libère la propriété transform pour
l'animation d'ouverture (sinon les deux se marchent dessus). */}
<div style={drawerLayer}>
<div
className="navbar-glass nav-drawer-in"
style={listOriginX === null ? drawer : { ...drawer, transformOrigin: `${listOriginX}px bottom` }}
role="menu"
aria-label={`Rubriques : ${activeGroup.label}`}
>
<div style={drawerHandle} aria-hidden="true" />
<div style={drawerHead}>
<span style={drawerTitle}>{activeGroup.label}</span>
<span style={drawerTagline}>{activeGroup.tagline}</span>
</div>
<div style={drawerList}>
{activeGroup.items.map((item, i) => {
const isActive = item.view === active;
const Icon = TAB_ICONS[item.view];
return (
<button
key={item.view}
onClick={() => handlePick(item.view)}
className="nav-drawer-row"
role="menuitem"
style={{
...drawerRow,
background: isActive ? 'rgba(var(--brand-1-rgb),0.14)' : 'transparent',
animationDelay: `${Math.min(i, 8) * 28}ms`,
}}
aria-label={item.label}
aria-current={isActive ? 'page' : undefined}
>
{/* Icône dans une pastille discrète : sur une ligne, le simple
outline→filled ne suffit pas à ancrer l'œil, contrairement à
la barre où les icônes sont alignées côte à côte. */}
<span
style={{
...drawerIconWrap,
color: isActive ? 'var(--brand-1)' : 'var(--text-secondary)',
background: isActive ? 'rgba(var(--brand-1-rgb),0.16)' : 'var(--glass-highlight)',
}}
>
<Icon size={20} filled={isActive} />
</span>
<span style={drawerTexts}>
<span style={{ ...drawerLabel, color: isActive ? 'var(--brand-1)' : 'var(--text-primary)' }}>
{item.label}
</span>
<span style={drawerHint}>{item.hint}</span>
</span>
{isActive && (
<span style={{ color: 'var(--brand-1)', display: 'flex' }}>
<CheckIcon size={16} />
</span>
)}
</button>
);
})}
</div>
</div>
</div>
</>
)}

<div style={barRow}>
<div
ref={glassRef}
onPointerMove={handlePointerMove}
onPointerDown={() => setPressed(true)}
onPointerUp={() => setPressed(false)}
onPointerLeave={() => setPressed(false)}
className={`navbar-glass nav-capsule${refraction ? ' navbar-glass-refract' : ''}`}
style={{
...glass,
transform: pressed ? 'scale(0.98)' : 'scale(1)',
transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
willChange: 'transform',
}}
>
{/* Reflet spéculaire du haut — fonctionne partout (pur dégradé CSS) */}
<div style={sheen} />
{/* Halo lumineux qui suit le pointeur, façon Liquid Glass WWDC 2025 */}
<div style={pointerGlow} />
{/* Bruit très fin (2-3% d'opacité) pour casser l'aspect trop lisse du flou */}
<div style={{ ...noiseLayer, backgroundImage: `url("${NOISE_URL}")` }} />

{geo && (
<div
ref={bubbleRef}
className={`nav-bubble${bubbleReady ? ' is-ready' : ''}`}
style={{ '--nb-x': `${geo.x}px`, '--nb-y': `${geo.y}px`, '--nb-w': `${geo.w}px`, '--nb-h': `${geo.h}px`, '--nb-cw': `${geo.cw}px`, '--nb-ch': `${geo.ch}px` } as React.CSSProperties}
aria-hidden="true"
>
<div className="nav-lens">
<div className="nav-lens-zoom" style={{ ...lensRow }}>
{NAV_GROUPS.map((group, idx) => {
const Icon = GROUP_ICONS[group.id];
return (
<span key={group.id} style={lensTab}>
<span style={{ ...iconWrap, color: 'var(--brand-1)' }}><Icon size={22} filled /></span>
<span style={{ ...tabLabel, color: 'var(--brand-1)', fontWeight: 700 }}>{group.label}</span>
{/* La bulle cache l'onglet d'origine : c'est donc cette copie qu'on voit,
et c'est elle qui doit montrer le chevron retourné quand la liste est ouverte. */}
<span style={{ color: 'var(--brand-1)', display: 'flex' }}><ChevronMark shown open={idx === activeSlot && menuOpen} /></span>
</span>
);
})}
</div>
</div>
</div>
)}

{NAV_GROUPS.map((group, idx) => {
const isActive = idx === activeSlot;
const Icon = GROUP_ICONS[group.id];
return (
<button
key={group.id}
ref={(el) => { tabRefs.current[idx] = el; }}
onClick={() => handleTabPress(group)}
style={tabBtn}
aria-label={isActive ? `${group.label} : voir les rubriques` : group.label}
aria-current={isActive ? 'page' : undefined}
aria-haspopup={isActive ? 'menu' : undefined}
aria-expanded={isActive ? menuOpen : undefined}
>
{/* Présentation façon Apple (tab bar iOS / SF Symbols) : pas de
pastille colorée, pas d'agrandissement — juste l'icône qui passe
d'outline à filled et se teinte en couleur d'accent, le libellé
toujours visible sous chaque icône (jamais masqué), comme dans
Réglages, Musique ou l'App Store sur iPhone. */}
<span style={{ ...iconWrap, color: isActive ? 'var(--brand-1)' : 'var(--text-secondary)' }}>
<Icon size={22} filled={isActive} />
</span>
<span style={{ ...tabLabel, color: isActive ? 'var(--brand-1)' : 'var(--text-secondary)', fontWeight: isActive ? 700 : 600 }}>
{group.label}
</span>
<span style={{ color: 'var(--brand-1)', display: 'flex' }}><ChevronMark shown={isActive} open={isActive && menuOpen} /></span>
</button>
);
})}
</div>

{onStartSession && (
<button
onClick={onStartSession}
style={startBtn}
aria-label={hasSessionInProgress ? 'Reprendre la séance' : 'Commencer la séance'}
title={hasSessionInProgress ? 'Reprendre la séance' : 'Commencer la séance'}
>
<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
<path d="M8 5.6c0-.9 1-1.5 1.8-1L18 11.1a1.1 1.1 0 0 1 0 1.8L9.8 19.4c-.8.5-1.8-.1-1.8-1V5.6Z" />
</svg>
</button>
)}
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

// Rangée qui tient la capsule + le bouton de séance. C'est elle qui porte
// désormais la largeur max (la capsule prend juste la place qui reste).
const barRow: React.CSSProperties = {
display: 'flex',
alignItems: 'stretch',
gap: 10,
maxWidth: 460,
width: 'calc(100% - 24px)',
pointerEvents: 'none',
};

// Le fond et les ombres viennent de .nav-capsule (index.css) : ils doivent
// changer entre thème clair et sombre, ce qu'un style inline ne sait pas faire.
const glass: React.CSSProperties = {
position: 'relative',
overflow: 'hidden',
pointerEvents: 'auto',
zIndex: 2,
flex: 1,
minWidth: 0,
display: 'flex',
alignItems: 'center',
gap: 3,
padding: '6px 6px',
borderRadius: 999,
border: '1px solid var(--glass-border)',
};

// Bouton rouge « lancer la séance », détaché de la capsule.
const startBtn: React.CSSProperties = {
pointerEvents: 'auto',
flex: '0 0 auto',
width: 54,
borderRadius: 999,
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
color: '#fff',
cursor: 'pointer',
background: 'linear-gradient(150deg, var(--brand-1), var(--brand-2))',
boxShadow: '0 10px 26px rgba(var(--brand-1-rgb),0.45), inset 0 1px 0 rgba(255,255,255,0.3)',
transition: 'transform 0.18s cubic-bezier(0.34,1.5,0.64,1)',
};

// La lentille reproduit exactement la disposition de la capsule (mêmes marges,
// même écart, onglets de même largeur) : c'est ce qui la garde alignée avec la
// vraie barre quand elle glisse en sens inverse de la bulle.
const lensRow: React.CSSProperties = {
position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 3, padding: '6px 6px',
};

// Chevron sous l'onglet ouvert. Même emprise que l'ancien point (4 px + 1 px d'écart).
const tabMark: React.CSSProperties = {
width: 10, height: 5, marginTop: 1,
display: 'flex', alignItems: 'center', justifyContent: 'center',
transition: 'opacity 0.15s ease, transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)',
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

// Halo qui suit le pointeur : positionné via les variables CSS --gx/--gy
// (mises à jour directement sur le DOM dans handlePointerMove, sans state).
const pointerGlow: React.CSSProperties = {
position: 'absolute',
inset: 0,
background: 'radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,0.35), transparent 60%)',
mixBlendMode: 'overlay',
pointerEvents: 'none',
opacity: 0.9,
};

// Grain très fin, ~2.5% d'opacité, pour éviter l'effet "plastique" trop lisse.
const noiseLayer: React.CSSProperties = {
position: 'absolute',
inset: 0,
opacity: 0.025,
backgroundSize: '120px 120px',
mixBlendMode: 'overlay',
pointerEvents: 'none',
};

const tabBtn: React.CSSProperties = {
position: 'relative',
flex: 1,
minWidth: 0,
display: 'flex',
flexDirection: 'column',
alignItems: 'center',
gap: 2,
padding: '5px 2px 4px',
borderRadius: 999,
background: 'transparent',
border: 'none',
cursor: 'pointer',
};

// Copie d'onglet pour la lentille : déclarée après tabBtn dont elle hérite.
const lensTab: React.CSSProperties = { ...tabBtn, pointerEvents: 'none' };

// Pas de fond/pastille (contrairement à avant) : uniquement l'icône et sa
// couleur qui changent, comme sur une tab bar iOS.
const iconWrap: React.CSSProperties = {
display: 'flex', alignItems: 'center', justifyContent: 'center',
transition: 'color 0.15s ease, transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1)',
};

const tabLabel: React.CSSProperties = {
fontSize: 10,
letterSpacing: 0.1,
lineHeight: 1,
maxWidth: '100%',
overflow: 'hidden',
textOverflow: 'ellipsis',
whiteSpace: 'nowrap',
transition: 'color 0.15s ease',
};

const backdrop: React.CSSProperties = {
position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'auto',
};

// Calque plein écran qui centre le panneau au-dessus de la barre.
const drawerLayer: React.CSSProperties = {
position: 'fixed',
left: 0, right: 0,
bottom: 'calc(max(10px, env(safe-area-inset-bottom)) + 74px)',
display: 'flex',
justifyContent: 'center',
zIndex: 3,
pointerEvents: 'none',
};

// Panneau en liste (façon menu iOS) : une ligne par rubrique, beaucoup plus
// lisible qu'une grille d'icônes minuscules.
const drawer: React.CSSProperties = {
pointerEvents: 'auto',
display: 'flex',
flexDirection: 'column',
padding: '8px 8px 10px',
borderRadius: 26,
maxWidth: 460,
width: 'calc(100% - 24px)',
maxHeight: '58vh',
background: 'var(--glass-bg)',
border: '1px solid var(--glass-border)',
boxShadow: '0 -1px 0 var(--glass-highlight) inset, 0 12px 40px rgba(0,0,0,0.45)',
};

const drawerHandle: React.CSSProperties = {
width: 38, height: 4, borderRadius: 2,
background: 'var(--glass-highlight)',
margin: '2px auto 8px',
flexShrink: 0,
};

// En-tête de la liste : le nom de l'onglet, puis ce que l'on vient y chercher.
const drawerHead: React.CSSProperties = {
display: 'flex',
alignItems: 'baseline',
gap: 8,
padding: '0 10px 6px',
flexShrink: 0,
};

const drawerTitle: React.CSSProperties = {
fontSize: 10,
fontWeight: 700,
letterSpacing: 1.1,
textTransform: 'uppercase',
color: 'var(--brand-1)',
};

const drawerTagline: React.CSSProperties = {
fontSize: 11,
color: 'var(--text-dim)',
};

const drawerList: React.CSSProperties = {
display: 'flex',
flexDirection: 'column',
gap: 2,
overflowY: 'auto',
overscrollBehavior: 'contain',
};

const drawerRow: React.CSSProperties = {
display: 'flex',
alignItems: 'center',
gap: 12,
width: '100%',
textAlign: 'left',
padding: '9px 10px',
borderRadius: 16,
border: 'none',
cursor: 'pointer',
};

const drawerIconWrap: React.CSSProperties = {
display: 'flex', alignItems: 'center', justifyContent: 'center',
width: 34, height: 34, borderRadius: 11,
flexShrink: 0,
transition: 'color 0.15s ease, background 0.15s ease',
};

const drawerTexts: React.CSSProperties = {
display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1,
};

const drawerLabel: React.CSSProperties = {
fontSize: 14,
fontWeight: 600,
lineHeight: 1.1,
whiteSpace: 'nowrap',
overflow: 'hidden',
textOverflow: 'ellipsis',
};

const drawerHint: React.CSSProperties = {
fontSize: 11,
color: 'var(--text-dim)',
lineHeight: 1.15,
whiteSpace: 'nowrap',
overflow: 'hidden',
textOverflow: 'ellipsis',
};
