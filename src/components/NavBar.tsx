import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import type { NavTabKey } from '../data/types';
import {
HomeIcon, TargetIcon, CalendarIcon, HeartPulseIcon,
DumbbellIcon, ScaleIcon, ChartIcon, UserIcon, SlidersIcon, PlusIcon,
} from './NavIcons';

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

// Petite coche affichée à droite de la ligne active dans le menu "Plus".
const CheckIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
<path d="M5 13l4 4L19 7" />
</svg>
);

// Croix du bandeau "barre trop chargée" (bouton ignorer).
const CloseIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
<path d="M6 6l12 12M18 6L6 18" />
</svg>
);

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
{ id: 'catalogue', label: 'Catalogue' },
{ id: 'poids', label: 'Poids' },
{ id: 'dashboard', label: 'Stats' },
{ id: 'profil', label: 'Profil' },
{ id: 'settings', label: 'Réglages' },
];

// Une phrase courte par onglet, affichée sous le libellé dans le menu "Plus".
// Le menu en liste laisse la place pour ça (la grille d'icônes, non), et ça
// évite d'avoir à deviner ce que contient un onglet qu'on ouvre rarement.
const TAB_HINTS: Record<NavView, string> = {
home: 'Ta séance du jour',
objectifs: 'Objectifs et schéma corporel',
historique: 'Toutes tes séances passées',
cardio: 'Course, vélo, rameur…',
exercices: 'Tes exercices et tes records',
catalogue: 'Tous les mouvements',
poids: 'Suivi du poids de corps',
dashboard: 'Volume, progression, graphiques',
profil: 'Compte et synchronisation',
settings: 'Apparence, barre de menus…',
};

// Icônes ligne dessinées à la main (voir NavIcons.tsx) plutôt que des emojis :
// les emojis rendent différemment selon la plateforme (tailles, styles,
// épaisseurs incohérentes entre eux), ce qui donnait une barre "pas propre".
// Ces icônes partagent le même trait et la même taille partout, et ont
// chacune une variante "filled" (voir plus bas, présentation façon Apple).
const TAB_ICONS: Record<NavView, React.FC<{ size?: number; filled?: boolean }>> = {
home: HomeIcon,
objectifs: TargetIcon,
historique: CalendarIcon,
cardio: HeartPulseIcon,
exercices: DumbbellIcon,
catalogue: BookIcon,
poids: ScaleIcon,
dashboard: ChartIcon,
profil: UserIcon,
settings: SlidersIcon,
};

// Largeur minimale confortable pour un onglet de la barre (icône 22px +
// libellé de 9px sur une ligne). En dessous, les libellés se touchent ou se
// coupent : c'est ce seuil qui déclenche le bandeau "barre trop chargée".
const MIN_TAB_WIDTH = 54;
// Padding horizontal total du verre (6 + 6) — retiré de la largeur mesurée.
const GLASS_PADDING = 12;
const TAB_GAP = 3;

const DISMISS_KEY = 'ppl-navbar-crowded-dismissed';

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
// Ajouts (août 2026) : le menu "+" est passé d'une grille d'icônes serrée à
// un vrai panneau en liste (icône + libellé + description courte + coche sur
// l'onglet actif), et la barre se surveille elle-même : quand il y a trop
// d'onglets épinglés pour la largeur de l'écran, un bandeau propose de
// ranger les onglets en trop dans le "+" en un seul appui.
export const NavBar: React.FC<NavBarProps> = ({ active, onNavigate }) => {
const [refraction, setRefraction] = useState(false);
useEffect(() => { setRefraction(supportsLiquidRefraction()); }, []);
const navBarTabsEnabled = useWorkoutStore((s) => s.navBarTabsEnabled);
const navBarPinned = useWorkoutStore((s) => s.navBarPinned);
const setNavBarTabPinned = useWorkoutStore((s) => s.setNavBarTabPinned);
const [moreOpen, setMoreOpen] = useState(false);
const glassRef = useRef<HTMLDivElement>(null);
const [pressed, setPressed] = useState(false);
const [barWidth, setBarWidth] = useState(0);
const [dismissedSig, setDismissedSig] = useState<string | null>(() => {
try { return localStorage.getItem(DISMISS_KEY); } catch { return null; }
});

// "Réglages" reste toujours affiché, même désactivé — sinon on n'a plus
// aucun moyen de rallumer les autres onglets depuis la barre.
const visibleTabs = TABS.filter((tab) => tab.id === 'settings' || navBarTabsEnabled[tab.id]);
// Parmi les onglets visibles, certains restent épinglés directement dans la
// barre ; les autres passent derrière le bouton + (voir Réglages →
// Apparence → Barre de menus), pratique quand la barre est trop chargée.
// "Réglages" reste toujours épinglé — sinon on perdrait l'accès au réglage
// qui permet justement de gérer cette répartition.
const pinnedTabs = visibleTabs.filter((tab) => tab.id === 'settings' || navBarPinned[tab.id]);
const overflowTabs = visibleTabs.filter((tab) => tab.id !== 'settings' && !navBarPinned[tab.id]);
const isOverflowActive = overflowTabs.some((tab) => tab.id === active);

useEffect(() => { setMoreOpen(false); }, [active]);

// Mesure la largeur réelle du verre pour savoir combien d'onglets tiennent
// vraiment à l'écran. ResizeObserver plutôt qu'un listener "resize" : ça
// couvre aussi la rotation de l'iPhone et le clavier qui s'ouvre, et ça se
// déclenche une fois au montage (donc pas besoin de mesure initiale).
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

// Nombre de "cases" occupées : les onglets épinglés + le bouton "+" s'il
// existe. Puis nombre de cases qui tiennent réellement dans la largeur.
const slotCount = pinnedTabs.length + (overflowTabs.length > 0 ? 1 : 0);
const fittingSlots = barWidth > 0
? Math.max(1, Math.floor((barWidth - GLASS_PADDING + TAB_GAP) / (MIN_TAB_WIDTH + TAB_GAP)))
: slotCount;
const crowded = barWidth > 0 && slotCount > fittingSlots;

// Signature de la config actuelle : si Léo ignore le bandeau puis rajoute
// des onglets plus tard, le bandeau revient (la signature a changé).
const pinnedSig = useMemo(() => pinnedTabs.map((t) => t.id).join(','), [pinnedTabs]);
const showCrowdedBanner = crowded && !moreOpen && dismissedSig !== pinnedSig;

const dismissBanner = () => {
setDismissedSig(pinnedSig);
try { localStorage.setItem(DISMISS_KEY, pinnedSig); } catch { /* stockage indisponible */ }
};

// Range les onglets en trop derrière le "+" : on garde épinglés les
// premiers de la liste (ordre de TABS) + "Réglages" (jamais dépinglable) +
// l'onglet actif, et on réserve une case pour le bouton "+".
const tidyIntoMore = () => {
const keepSlots = Math.max(1, fittingSlots - 1); // une case réservée au "+"
const others = pinnedTabs.filter((t) => t.id !== 'settings');
// "Réglages" prend une case, et l'onglet ouvert en ce moment en prend une
// autre (il reste épinglé quoi qu'il arrive) : on retire les deux du budget
// avant de décider qui reste, sinon on dépasse à nouveau la largeur.
const activeIsOther = others.some((t) => t.id === active);
const budget = Math.max(0, keepSlots - 1 - (activeIsOther ? 1 : 0));
let used = 0;
others.forEach((tab) => {
if (tab.id === active) return; // gardé d'office
if (used < budget) { used += 1; return; }
setNavBarTabPinned(tab.id, false);
});
try { localStorage.removeItem(DISMISS_KEY); } catch { /* stockage indisponible */ }
setDismissedSig(null);
};

const handleNavigate = (view: NavView) => {
setMoreOpen(false);
onNavigate(view);
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

return (
<div style={wrapper}>
{moreOpen && overflowTabs.length > 0 && (
<>
{/* Fond invisible pour fermer le tiroir en touchant en dehors */}
<div style={backdrop} onClick={() => setMoreOpen(false)} />
{/* Le panneau est centré par un conteneur flex plutôt que par un
translateX(-50%) : ça libère la propriété transform pour
l'animation d'ouverture (sinon les deux se marchent dessus). */}
<div style={drawerLayer}>
<div className="navbar-glass nav-drawer-in" style={drawer} role="menu">
<div style={drawerHandle} aria-hidden="true" />
<div style={drawerTitle}>Plus</div>
<div style={drawerList}>
{overflowTabs.map((tab, i) => {
const isActive = tab.id === active;
const Icon = TAB_ICONS[tab.id];
return (
<button
key={tab.id}
onClick={() => handleNavigate(tab.id)}
className="nav-drawer-row"
role="menuitem"
style={{
...drawerRow,
background: isActive ? 'rgba(var(--brand-1-rgb),0.14)' : 'transparent',
animationDelay: `${Math.min(i, 8) * 28}ms`,
}}
aria-label={tab.label}
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
{tab.label}
</span>
<span style={drawerHint}>{TAB_HINTS[tab.id]}</span>
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

{/* Bandeau "barre trop chargée" : n'apparaît que quand les onglets
épinglés ne tiennent réellement plus dans la largeur mesurée. */}
{showCrowdedBanner && (
<div style={bannerLayer}>
<div className="navbar-glass nav-drawer-in" style={banner} role="status">
<span style={bannerText}>
La barre est trop chargée pour ton écran ({slotCount} onglets pour {fittingSlots} places).
</span>
<div style={bannerActions}>
<button onClick={tidyIntoMore} style={bannerPrimary}>
Ranger dans le +
</button>
<button onClick={dismissBanner} style={bannerGhost} aria-label="Ignorer">
<CloseIcon size={14} />
</button>
</div>
</div>
</div>
)}

<div
ref={glassRef}
onPointerMove={handlePointerMove}
onPointerDown={() => setPressed(true)}
onPointerUp={() => setPressed(false)}
onPointerLeave={() => setPressed(false)}
className={`navbar-glass${refraction ? ' navbar-glass-refract' : ''}`}
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

{pinnedTabs.map((tab) => {
const isActive = tab.id === active;
const Icon = TAB_ICONS[tab.id];
return (
<button
key={tab.id}
onClick={() => handleNavigate(tab.id)}
style={tabBtn}
aria-label={tab.label}
>
{/* Présentation façon Apple (tab bar iOS / SF Symbols) : pas de
pastille colorée, pas d'agrandissement — juste l'icône qui passe
d'outline à filled et se teinte en couleur d'accent, le libellé
toujours visible sous chaque icône (jamais masqué), comme dans
Réglages, Musique ou l'App Store sur iPhone. */}
<span style={{ ...iconWrap, color: isActive ? 'var(--brand-1)' : 'var(--text-muted)' }}>
<Icon size={22} filled={isActive} />
</span>
<span style={{ ...tabLabel, color: isActive ? 'var(--brand-1)' : 'var(--text-muted)', fontWeight: isActive ? 700 : 500 }}>
{tab.label}
</span>
</button>
);
})}

{overflowTabs.length > 0 && (
<button onClick={() => setMoreOpen((v) => !v)} style={tabBtn} aria-label="Plus d'options" aria-expanded={moreOpen}>
<span style={{ ...iconWrap, color: (moreOpen || isOverflowActive) ? 'var(--brand-1)' : 'var(--text-muted)', transform: moreOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>
<PlusIcon size={22} />
</span>
<span style={{ ...tabLabel, color: (moreOpen || isOverflowActive) ? 'var(--brand-1)' : 'var(--text-muted)', fontWeight: (moreOpen || isOverflowActive) ? 700 : 500 }}>
Plus
</span>
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

const glass: React.CSSProperties = {
position: 'relative',
overflow: 'hidden',
pointerEvents: 'auto',
zIndex: 2,
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
padding: '3px 2px',
background: 'transparent',
border: 'none',
cursor: 'pointer',
};

// Pas de fond/pastille (contrairement à avant) : uniquement l'icône et sa
// couleur qui changent, comme sur une tab bar iOS.
const iconWrap: React.CSSProperties = {
display: 'flex', alignItems: 'center', justifyContent: 'center',
transition: 'color 0.15s ease, transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1)',
};

const tabLabel: React.CSSProperties = {
fontSize: 9,
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

// Panneau en liste (façon menu iOS) : une ligne par onglet, beaucoup plus
// lisible que l'ancienne grille 4 colonnes d'icônes minuscules, et qui
// s'allonge proprement quand il y a beaucoup d'onglets rangés dans le "+".
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

const drawerTitle: React.CSSProperties = {
fontSize: 10,
fontWeight: 700,
letterSpacing: 1.1,
textTransform: 'uppercase',
color: 'var(--text-dim)',
padding: '0 10px 6px',
flexShrink: 0,
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

// Bandeau "barre trop chargée" — même calque/centrage que le panneau, juste
// au-dessus de la barre.
const bannerLayer: React.CSSProperties = {
position: 'fixed',
left: 0, right: 0,
bottom: 'calc(max(10px, env(safe-area-inset-bottom)) + 74px)',
display: 'flex',
justifyContent: 'center',
zIndex: 3,
pointerEvents: 'none',
};

const banner: React.CSSProperties = {
pointerEvents: 'auto',
display: 'flex',
alignItems: 'center',
gap: 10,
padding: '10px 10px 10px 14px',
borderRadius: 20,
maxWidth: 460,
width: 'calc(100% - 24px)',
background: 'var(--glass-bg)',
border: '1px solid var(--glass-border)',
boxShadow: '0 -1px 0 var(--glass-highlight) inset, 0 10px 30px rgba(0,0,0,0.4)',
};

const bannerText: React.CSSProperties = {
flex: 1,
minWidth: 0,
fontSize: 11.5,
lineHeight: 1.25,
color: 'var(--text-secondary)',
};

const bannerActions: React.CSSProperties = {
display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
};

const bannerPrimary: React.CSSProperties = {
padding: '7px 12px',
borderRadius: 12,
border: '1px solid rgba(var(--brand-1-rgb),0.4)',
background: 'rgba(var(--brand-1-rgb),0.18)',
color: 'var(--brand-1)',
fontSize: 11.5,
fontWeight: 700,
whiteSpace: 'nowrap',
cursor: 'pointer',
};

const bannerGhost: React.CSSProperties = {
display: 'flex', alignItems: 'center', justifyContent: 'center',
width: 28, height: 28,
borderRadius: 10,
border: 'none',
background: 'var(--glass-highlight)',
color: 'var(--text-muted)',
cursor: 'pointer',
};
