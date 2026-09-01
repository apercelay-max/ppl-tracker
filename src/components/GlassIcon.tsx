import React from 'react';

/**
 * Pastille de verre autour d'une icône. Sert de support commun à toutes les
 * icônes de l'app pour qu'elles aient le même poids visuel, quel que soit
 * l'écran. L'habillage est dans .glass-icon (index.css) — il doit changer
 * entre thème clair et sombre, ce qu'un style inline ne sait pas faire.
 */
interface GlassIconProps {
  children: React.ReactNode;
  /** Côté de la pastille en px. L'arrondi suit automatiquement. */
  size?: number;
  round?: boolean;
  /** Teinte la pastille en couleur d'accent : à réserver à l'icône qui identifie l'écran. */
  accent?: boolean;
  style?: React.CSSProperties;
  title?: string;
}

export const GlassIcon: React.FC<GlassIconProps> = ({ children, size = 34, round, accent, style, title }) => (
  <span
    className={`glass-icon${round ? ' round' : ''}${accent ? ' accent' : ''}`}
    style={{ ['--gi' as any]: `${size}px`, ...style }}
    title={title}
    aria-hidden="true"
  >
    {children}
  </span>
);
