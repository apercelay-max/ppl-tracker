import React from 'react';
import {
  IconBike, IconWalk, IconRun, IconZap, IconBiceps, IconFlame,
  IconScale, IconTrophy, IconActivity,
} from './Icons';

/**
 * Icônes désignées par un nom dans les données (badges, types de cardio).
 * Les fichiers de données ne peuvent pas importer de JSX — ils stockent donc
 * une clé, et c'est ici qu'on la traduit en icône. Une clé inconnue retombe
 * sur une icône neutre plutôt que de casser l'écran.
 */
export type DataIconName =
  | 'bike' | 'walk' | 'run' | 'other'
  | 'biceps' | 'flame' | 'scale' | 'trophy';

const MAP: Record<DataIconName, React.FC<{ size?: number; color?: string }>> = {
  bike: IconBike,
  walk: IconWalk,
  run: IconRun,
  other: IconZap,
  biceps: IconBiceps,
  flame: IconFlame,
  scale: IconScale,
  trophy: IconTrophy,
};

export const DataIcon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 16, color }) => {
  const Cmp = MAP[name as DataIconName] ?? IconActivity;
  return <Cmp size={size} color={color} />;
};
