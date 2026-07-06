export interface AccentPreset {
  id: string;
  label: string;
  c1: string;   // couleur principale
  c2: string;   // couleur de dégradé (associée)
  rgb1: string; // c1 en "r,g,b" pour les rgba()
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'red',    label: 'Rouge',  c1: '#e03030', c2: '#9b27af', rgb1: '224,48,48' },
  { id: 'blue',   label: 'Bleu',   c1: '#2563eb', c2: '#06b6d4', rgb1: '37,99,235' },
  { id: 'green',  label: 'Vert',   c1: '#16a34a', c2: '#84cc16', rgb1: '22,163,74' },
  { id: 'orange', label: 'Orange', c1: '#ea580c', c2: '#f59e0b', rgb1: '234,88,12' },
  { id: 'violet', label: 'Violet', c1: '#9333ea', c2: '#ec4899', rgb1: '147,51,234' },
  { id: 'cyan',   label: 'Cyan',   c1: '#0891b2', c2: '#22d3ee', rgb1: '8,145,178' },
];

// ── Thèmes "salle de sport" ──────────────────────────────────────────────────
// Couleurs relevées directement sur les sites officiels de chaque enseigne
// (getComputedStyle sur les vrais boutons/dégradés de la page, pas des
// couleurs inventées) — sauf mention contraire ci-dessous.
export const GYM_PRESETS: AccentPreset[] = [
  { id: 'gym-basicfit',     label: 'Basic-Fit',      c1: '#FF8712', c2: '#592BB2', rgb1: '255,135,18' },
  { id: 'gym-fitnesspark',  label: 'Fitness Park',   c1: '#FFD600', c2: '#1A1A1A', rgb1: '255,214,0' },
  { id: 'gym-orangebleue',  label: "L'Orange Bleue", c1: '#F36C21', c2: '#10113C', rgb1: '243,108,33' },
  { id: 'gym-keepcool',     label: 'Keepcool',       c1: '#66CC99', c2: '#0F2E22', rgb1: '102,204,153' },
  { id: 'gym-neoness',      label: 'Neoness',        c1: '#D71730', c2: '#141414', rgb1: '215,23,48' },
  { id: 'gym-libertygym',   label: 'Liberty GYM',    c1: '#83BE00', c2: '#141414', rgb1: '131,190,0' },
  // CMG Sports Club (Club Maillot / Club Grenelle, rebrand "Masada"): pas de
  // couleur de marque forte sur le site actuel — palette neutre reprise telle
  // quelle (gris ardoise + crème).
  { id: 'gym-cmg',          label: 'CMG Sports Club', c1: '#1F2937', c2: '#F5F3EF', rgb1: '31,41,55' },
  { id: 'gym-johnreed',     label: 'John Reed',      c1: '#F0077B', c2: '#0D0D0D', rgb1: '240,7,123' },
  // GIGAFIT : le site est en noir/blanc, le doré n'existe que dans les images
  // des badges (pas de couleur CSS) — estimation visuelle depuis ces badges.
  { id: 'gym-gigafit',      label: 'GIGAFIT',        c1: '#C9A227', c2: '#0A0A0A', rgb1: '201,162,39' },
  { id: 'gym-magicform',    label: 'Magic Form',     c1: '#CE2329', c2: '#141414', rgb1: '206,35,41' },
];

// ── Couleur perso (color picker libre) ──────────────────────────────────────

const hexToRgbTriplet = (hex: string): string => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16) || 0;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r},${g},${b}`;
};

// Assombrit légèrement la couleur pour servir de 2e couleur du dégradé.
const darken = (hex: string, amount: number): string => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16) || 0;
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(((num >> 16) & 255) - Math.round(255 * amount));
  const g = clamp(((num >> 8) & 255) - Math.round(255 * amount));
  const b = clamp((num & 255) - Math.round(255 * amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

export const getAccent = (id: string, customHex?: string): AccentPreset => {
  if (id === 'custom' && customHex) {
    return { id: 'custom', label: 'Perso', c1: customHex, c2: darken(customHex, 0.22), rgb1: hexToRgbTriplet(customHex) };
  }
  return ACCENT_PRESETS.find((a) => a.id === id) ?? GYM_PRESETS.find((a) => a.id === id) ?? ACCENT_PRESETS[0];
};
