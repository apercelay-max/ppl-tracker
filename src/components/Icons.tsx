import React from 'react';

type IconProps = { size?: number; color?: string };
type SunProps = IconProps & { filled?: boolean };

const base = {
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const IconZap: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

// Monogramme "P" — logo de l'app (badge accueil + écran de démarrage).
export const IconPMark: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <text x="12" y="18.5" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontWeight={900} fontSize={20} fill={color}>P</text>
  </svg>
);

export const IconSettings: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const IconBarChart: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export const IconSun: React.FC<SunProps> = ({ size = 18, color = 'currentColor', filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} fill={filled ? color : 'none'} stroke={color}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

export const IconMoon: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const IconBattery: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
    <line x1="23" y1="13" x2="23" y2="11" />
  </svg>
);

export const IconTarget: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const IconUtensils: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

export const IconActivity: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export const IconClock: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const IconFlame: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export const IconDumbbell: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <rect x="1" y="9" width="4" height="6" rx="1.5" />
    <rect x="19" y="9" width="4" height="6" rx="1.5" />
    <line x1="5" y1="12" x2="19" y2="12" />
    <line x1="8" y1="8" x2="8" y2="16" />
    <line x1="16" y1="8" x2="16" y2="16" />
  </svg>
);

export const IconPlate: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.5" />
  </svg>
);

export const IconTrendingUp: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

export const IconTrophy: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export const IconBell: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export const IconVibrate: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <rect x="8" y="4" width="8" height="16" rx="2" />
    <path d="m2 8 2 2-2 2 2 2-2 2" />
    <path d="m22 8-2 2 2 2-2 2 2 2" />
  </svg>
);

export const IconLightbulb: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

export const IconWind: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
    <path d="M12.59 11.59A2 2 0 1 1 14 15H2" />
    <path d="M17.59 18.59A2 2 0 1 1 19 22H2" />
  </svg>
);

export const IconScale: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M12 3v18" />
    <path d="M7 21h10" />
    <path d="M3 7h18" />
    <path d="m5 7 3-4 3 4" />
    <path d="M2 7l3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m16 7 3-4 3 4" />
    <path d="M13 7l3 8c.87.65 1.92 1 3 1s2.13-.35 3-1Z" />
  </svg>
);

export const IconThumbsUp: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
  </svg>
);

export const IconHome: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const IconCalendar: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const IconUser: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const IconMonitor: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

export const IconPalette: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M12 22a10 10 0 1 1 0-20 8 8 0 0 1 8 8c0 1.66-1.34 3-3 3h-2a2 2 0 0 0-1 3.73A2 2 0 0 1 12 22Z" />
    <circle cx="7.5" cy="10.5" r="1" fill={color} stroke="none" />
    <circle cx="12" cy="7.5" r="1" fill={color} stroke="none" />
    <circle cx="16.5" cy="10.5" r="1" fill={color} stroke="none" />
  </svg>
);

export const IconSave: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8" />
    <path d="M7 3v5h8" />
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const IconRotateCcw: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M3 12a9 9 0 1 0 2.64-6.36" />
    <polyline points="3 3 3 8 8 8" />
  </svg>
);

export const IconSparkles: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" />
  </svg>
);

export const IconPartyPopper: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M3 21 9 9l6 6z" />
    <circle cx="18" cy="6" r="1" fill={color} stroke="none" />
    <circle cx="21" cy="10" r="1" fill={color} stroke="none" />
    <circle cx="14" cy="4" r="1" fill={color} stroke="none" />
  </svg>
);

export const IconFireworks: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
    <line x1="12" y1="12" x2="12" y2="4" />
    <line x1="12" y1="12" x2="18" y2="7" />
    <line x1="12" y1="12" x2="20" y2="14" />
    <line x1="12" y1="12" x2="16" y2="20" />
    <line x1="12" y1="12" x2="8" y2="20" />
    <line x1="12" y1="12" x2="4" y2="14" />
    <line x1="12" y1="12" x2="6" y2="7" />
  </svg>
);

export const IconBounce: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <circle cx="12" cy="6" r="3" />
    <path d="M4 19c2.5-5 5.5-7 8-7s5.5 2 8 7" />
  </svg>
);

export const IconArrowRight: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const IconRefreshCw: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <polyline points="21 3 21 9 15 9" />
  </svg>
);

export const IconDownload: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const IconUpload: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const IconShare: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' {...base} stroke={color}>
    <circle cx='18' cy='5' r='3' />
    <circle cx='6' cy='12' r='3' />
    <circle cx='18' cy='19' r='3' />
    <line x1='8.59' y1='13.51' x2='15.42' y2='17.49' />
    <line x1='15.41' y1='6.51' x2='8.59' y2='10.49' />
  </svg>
);

// ─── Icônes ajoutées pour remplacer les emojis ──────────────────────────────
// Même trait que les autres (2 px, bouts arrondis, viewBox 24) : mélangées aux
// précédentes dans une même barre, elles doivent être indiscernables.

export const IconArrowLeft: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
  </svg>
);

export const IconClose: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color} strokeWidth={2.4}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const IconBike: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill={color} stroke="none" />
    <path d="M12 17.5 9 11l3-2 2.5 3H18" />
  </svg>
);

export const IconWalk: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <circle cx="13" cy="4" r="1.6" />
    <path d="m11 21 1.5-6-2.5-2.5V9l3-1.5 2.5 3H19" /><path d="m9 21 1.5-4.5" />
  </svg>
);

export const IconRun: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <circle cx="15" cy="4" r="1.6" />
    <path d="m9.5 21 2-5.5-3-2.5 1.5-4 3.5 3H17" /><path d="M6.5 12.5 9 10" /><path d="m13 15.5 2.5 5.5" />
  </svg>
);

export const IconBook: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M3 5.6A1.6 1.6 0 0 1 4.6 4H9a3 3 0 0 1 3 3v12a2.6 2.6 0 0 0-2.6-2.6H4.6A1.6 1.6 0 0 1 3 14.8Z" />
    <path d="M21 5.6A1.6 1.6 0 0 0 19.4 4H15a3 3 0 0 0-3 3v12a2.6 2.6 0 0 1 2.6-2.6h4.8A1.6 1.6 0 0 0 21 14.8Z" />
  </svg>
);

export const IconStar: React.FC<IconProps & { filled?: boolean }> = ({ size = 18, color = 'currentColor', filled }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color} fill={filled ? color : 'none'}>
    <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9Z" />
  </svg>
);

export const IconHeart: React.FC<IconProps & { filled?: boolean }> = ({ size = 18, color = 'currentColor', filled }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color} fill={filled ? color : 'none'}>
    <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1Z" />
  </svg>
);

export const IconAlert: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" /><path d="M12 17h.01" />
  </svg>
);

export const IconScissors: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
    <path d="M20 4 8.1 15.9" /><path d="m8.1 8.1 11.9 11.9" />
  </svg>
);

export const IconMedal: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="m7.2 2 3 5.4" /><path d="m13.8 2 3 5.4" /><path d="M6 2h12" />
    <circle cx="12" cy="15" r="6" /><path d="M12 12.5 13 15h2.2l-1.8 1.4.7 2.3-2.1-1.4-2.1 1.4.7-2.3L8.8 15H11Z" />
  </svg>
);

export const IconHandWave: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11" /><path d="M14 10.5V3.8a1.5 1.5 0 0 1 3 0V12" />
    <path d="M17 11.5V6.5a1.5 1.5 0 0 1 3 0v7a8 8 0 0 1-8 8h-1a7 7 0 0 1-5-2l-3.4-3.6a1.6 1.6 0 0 1 2.3-2.3L8 16.5" />
    <path d="M8 16.5V6a1.5 1.5 0 0 1 3 0v6.5" />
  </svg>
);

export const IconBiceps: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M4 6h7a5 5 0 0 1 4.6 3l.9 2.1A6 6 0 0 1 17 13v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" />
    <path d="M4 11c2.2-1.2 4.6-1.2 6.5.4" />
  </svg>
);

export const IconGauge: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke={color}>
    <path d="M3.5 17a9 9 0 1 1 17 0" /><path d="m12 13 4-3.5" /><circle cx="12" cy="14" r="1.4" />
  </svg>
);
