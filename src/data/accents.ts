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
// Couleurs inspirées de l'identité visuelle de ces enseignes (pas les codes
// hexadécimaux officiels de la marque — juste une ambiance proche).
export const GYM_PRESETS: AccentPreset[] = [
  { id: 'gym-basicfit',     label: 'Basic-Fit',      c1: '#EB6800', c2: '#78BE20', rgb1: '235,104,0' },
  { id: 'gym-keepcool',     label: 'Keepcool',       c1: '#1f7a4d', c2: '#111111', rgb1: '31,122,77' },
  { id: 'gym-orangebleue',  label: "L'Orange Bleue", c1: '#f28c1e', c2: '#1f6fb2', rgb1: '242,140,30' },
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
