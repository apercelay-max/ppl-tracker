export type IconShape = 'square' | 'rounded' | 'circle';
export type IconSize = 'sm' | 'md' | 'lg';

export const ICON_SHAPE_RADIUS: Record<IconShape, string> = {
  square: '4px',
  rounded: '14px',
  circle: '50%',
};

export const ICON_SHAPE_LABEL: Record<IconShape, string> = {
  square: 'Carré',
  rounded: 'Arrondi',
  circle: 'Rond',
};

export interface IconSizeSet {
  header: number; // boutons du header (⚙️ 📊 ☀️ 🔆)
  logo: number;   // badge du logo PPL Tracker
  anim: number;   // cadre de l'animation bonhomme dans une carte exercice
  resume: number; // icône ▶ de la carte "séance en cours"
}

export const ICON_SIZE_PRESETS: Record<IconSize, IconSizeSet> = {
  sm: { header: 30, logo: 40, anim: 46, resume: 34 },
  md: { header: 36, logo: 48, anim: 54, resume: 40 },
  lg: { header: 42, logo: 56, anim: 64, resume: 46 },
};

export const ICON_SIZE_LABEL: Record<IconSize, string> = {
  sm: 'Petit',
  md: 'Normal',
  lg: 'Grand',
};
