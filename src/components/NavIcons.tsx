import React from 'react';

// Petit jeu d'icônes ligne, dessinées à la main, pour remplacer les emojis
// dans la barre de navigation. Les emojis rendent différemment selon la
// plateforme/le navigateur (tailles et styles incohérents entre eux — d'où
// la barre "pas très propre") ; ces icônes SVG ont toutes le même trait, la
// même taille et la même couleur (currentColor), donc un rendu identique
// partout et cohérent entre elles.
//
// Ajout (juillet 2026) : chaque icône a maintenant une variante "filled",
// comme les SF Symbols d'Apple dans la tab bar iOS — l'onglet actif passe du
// trait fin (outline) au plein (filled), sans pastille de couleur derrière,
// exactement comme le fait iOS (Réglages, Musique, App Store…).
interface IconProps { size?: number; filled?: boolean; }

const base = {
viewBox: '0 0 24 24',
fill: 'none' as const,
stroke: 'currentColor',
strokeWidth: 1.8,
strokeLinecap: 'round' as const,
strokeLinejoin: 'round' as const,
};

export const HomeIcon: React.FC<IconProps> = ({ size = 18, filled }) =>
filled ? (
<svg width={size} height={size} viewBox="0 0 24 24">
<path fill="currentColor" d="M12 3.3l8.7 7.2a1 1 0 01.3.7V19.5a1 1 0 01-1 1h-4.8v-6.2H9.8v6.2H5a1 1 0 01-1-1V11.2a1 1 0 01.3-.7l7.7-7.2z" />
</svg>
) : (
<svg width={size} height={size} {...base}>
<path d="M4.5 11.5L12 4.5l7.5 7" />
<path d="M6.5 9.8V19h4.3v-5h2.4v5h4.3V9.8" />
</svg>
);

export const TargetIcon: React.FC<IconProps> = ({ size = 18, filled }) =>
filled ? (
<svg width={size} height={size} viewBox="0 0 24 24">
<path
fillRule="evenodd"
clipRule="evenodd"
fill="currentColor"
d="M12 19.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15zm0-3a4.5 4.5 0 100-9 4.5 4.5 0 000 9zm0-3a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
/>
</svg>
) : (
<svg width={size} height={size} {...base}>
<circle cx="12" cy="12" r="7.5" />
<circle cx="12" cy="12" r="4.5" />
<circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
</svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 18, filled }) =>
filled ? (
<svg width={size} height={size} viewBox="0 0 24 24">
<path
fillRule="evenodd"
clipRule="evenodd"
fill="currentColor"
d="M4 7.7a2.2 2.2 0 012.2-2.2h11.6A2.2 2.2 0 0120 7.7v11.6A2.2 2.2 0 0117.8 21.5H6.2A2.2 2.2 0 014 19.3V7.7zm3.2-4.4a1 1 0 00-1 1v2a1 1 0 002 0v-2a1 1 0 00-1-1zm10.6 0a1 1 0 00-1 1v2a1 1 0 002 0v-2a1 1 0 00-1-1zM4 9.5h16v1.8H4V9.5z"
/>
</svg>
) : (
<svg width={size} height={size} {...base}>
<rect x="4" y="5.5" width="16" height="14" rx="2.2" />
<line x1="4" y1="9.5" x2="20" y2="9.5" />
<line x1="8" y1="3.3" x2="8" y2="6.3" />
<line x1="16" y1="3.3" x2="16" y2="6.3" />
</svg>
);

export const HeartPulseIcon: React.FC<IconProps> = ({ size = 18, filled }) => (
<svg width={size} height={size} viewBox="0 0 24 24" {...(filled ? {} : base)}>
<path
fill={filled ? 'currentColor' : 'none'}
stroke={filled ? 'none' : 'currentColor'}
strokeWidth={filled ? 0 : 1.8}
strokeLinecap="round"
strokeLinejoin="round"
d="M12 19.2l-1.15-1.05C6.35 14.2 3.3 11.55 3.3 8.35c0-2.6 2.05-4.6 4.6-4.6 1.45 0 2.85.68 3.75 1.75l.35.4.35-.4c.9-1.07 2.3-1.75 3.75-1.75 2.55 0 4.6 2 4.6 4.6 0 3.2-3.05 5.85-7.55 9.8L12 19.2z"
/>
</svg>
);

export const DumbbellIcon: React.FC<IconProps> = ({ size = 18, filled }) =>
filled ? (
<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
<rect x="1.8" y="9.3" width="2.6" height="5.4" rx="1" />
<rect x="19.6" y="9.3" width="2.6" height="5.4" rx="1" />
<rect x="5.5" y="7.6" width="2.2" height="8.8" rx="0.9" />
<rect x="16.3" y="7.6" width="2.2" height="8.8" rx="0.9" />
<rect x="7.7" y="11.2" width="8.6" height="1.6" rx="0.8" />
</svg>
) : (
<svg width={size} height={size} {...base}>
<rect x="1.8" y="9.3" width="2.6" height="5.4" rx="1" />
<rect x="19.6" y="9.3" width="2.6" height="5.4" rx="1" />
<rect x="5.5" y="7.6" width="2.2" height="8.8" rx="0.9" />
<rect x="16.3" y="7.6" width="2.2" height="8.8" rx="0.9" />
<line x1="7.7" y1="12" x2="16.3" y2="12" />
</svg>
);

export const ScaleIcon: React.FC<IconProps> = ({ size = 18, filled }) =>
filled ? (
<svg width={size} height={size} viewBox="0 0 24 24">
<path
fillRule="evenodd"
clipRule="evenodd"
fill="currentColor"
d="M3.2 8a3 3 0 013-3h11.6a3 3 0 013 3v11a3 3 0 01-3 3H6.2a3 3 0 01-3-3V8zm8.8 1.4a2.6 2.6 0 100 5.2 2.6 2.6 0 000-5.2zm0 1.8a.8.8 0 11-.001 1.601A.8.8 0 0112 11.2z"
/>
</svg>
) : (
<svg width={size} height={size} {...base}>
<rect x="3.2" y="5" width="17.6" height="14" rx="3" />
<circle cx="12" cy="12" r="2.6" />
<line x1="12" y1="9.4" x2="12" y2="12" />
</svg>
);

export const ChartIcon: React.FC<IconProps> = ({ size = 18, filled }) =>
filled ? (
<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
<rect x="4" y="19" width="16" height="1.6" rx="0.8" />
<rect x="6" y="13" width="3" height="6" rx="0.6" />
<rect x="10.5" y="9" width="3" height="10" rx="0.6" />
<rect x="15" y="5" width="3" height="14" rx="0.6" />
</svg>
) : (
<svg width={size} height={size} {...base}>
<line x1="4" y1="20" x2="20" y2="20" />
<rect x="6" y="13" width="3" height="7" />
<rect x="10.5" y="9" width="3" height="11" />
<rect x="15" y="5" width="3" height="15" />
</svg>
);

export const UserIcon: React.FC<IconProps> = ({ size = 18, filled }) =>
filled ? (
<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
<circle cx="12" cy="8.2" r="3.7" />
<path d="M4.5 19.5c0-3.8 3.4-6 7.5-6s7.5 2.2 7.5 6a1 1 0 01-1 1H5.5a1 1 0 01-1-1z" />
</svg>
) : (
<svg width={size} height={size} {...base}>
<circle cx="12" cy="8.2" r="3.7" />
<path d="M4.5 19.5c0-3.8 3.4-6 7.5-6s7.5 2.2 7.5 6" />
</svg>
);

export const SlidersIcon: React.FC<IconProps> = ({ size = 18, filled }) => (
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
<line x1="4" y1="6.5" x2="20" y2="6.5" />
<circle cx="9.5" cy="6.5" r={filled ? 2.4 : 2} fill="currentColor" />
<line x1="4" y1="12" x2="20" y2="12" />
<circle cx="15" cy="12" r={filled ? 2.4 : 2} fill="currentColor" />
<line x1="4" y1="17.5" x2="20" y2="17.5" />
<circle cx="7.5" cy="17.5" r={filled ? 2.4 : 2} fill="currentColor" />
</svg>
);

// Icône "+" — bouton "Plus d'options" de la barre de navigation, quand des
// onglets sont mis derrière un tiroir plutôt qu'épinglés (voir Réglages →
// Apparence → Barre de menus). Pas de variante filled : Apple garde aussi
// "Plus" en simple trait dans les tab bars iOS.
export const PlusIcon: React.FC<IconProps> = ({ size = 18 }) => (
<svg width={size} height={size} {...base}>
<line x1="12" y1="5" x2="12" y2="19" />
<line x1="5" y1="12" x2="19" y2="12" />
</svg>
);
