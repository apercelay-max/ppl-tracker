import { WorkoutDay } from './types';
import { WORKOUTS, registerBuiltInWorkouts } from './workouts';
import { PPL_DEBUTANT_WORKOUTS, FULL_BODY_WORKOUTS, FORCE_5X5_WORKOUTS, WRIST_CONSOLIDATION_WORKOUTS } from './extraPrograms';
import { CATALOG_PROGRAMS } from './catalogPrograms';
import { APP_LIBRARY_PROGRAMS } from './appLibraryPrograms';

// ─── Programmes sélectionnables (Réglages → Programme d'entraînement) ─────
// "Strict V4.3" est le programme historique de l'appli (ex-V10, ex-V11),
// toujours présent en premier. L'historique des versions est dans
// src/data/workouts.ts. Son id reste 'strict-v10'
// pour ne pas casser les réglages déjà enregistrés sur l'appareil. Les autres
// sont des trames additionnelles, proposées en plus — changer de programme
// actif ne supprime jamais les autres, ni l'historique déjà enregistré
// (voir workoutStore.ts).

export interface Program {
  id: string;
  name: string;
  focusLabel: string; // sous-titre affiché sur l'accueil, ex. "Strict V11 · Hypertrophie"
  shortDescription: string;
  source: string; // note honnête d'origine/inspiration, affichée dans Réglages
  isCustom?: boolean; // true pour un programme importé par l'utilisateur
  workouts: WorkoutDay[];
  dayAccents: Record<string, string>;
  dayTypeLabels: Record<string, string>;
}

export const STRICT_V10_PROGRAM: Program = {
  id: 'strict-v10',
  name: 'Strict V4.3',
  focusLabel: 'Strict V4.3 · Épaules priorité 1',
  shortDescription: 'Sem 9-13 : retour à la charge pleine, deltoïde latéral en tête (18 séries/rotation), poids du corps + haltères ≤ 25 kg, double progression (un cran à la fois), jambes en mobilité/activation — 6 séances, fin de Phase 1 (21/10).',
  source: 'Programme Strict, version V4.3 (mise à jour du 08/10/2026).',
  workouts: WORKOUTS,
  // Les clés 'legs-a'/'legs-b' (sans suffixe) sont les anciennes séances
  // Legs V11 (avant le 19/08/2026) ; 'legs-a-v3'/'legs-b-v3' celles de la
  // V3.0 (30/08 → 13/09/2026, tri-sets hypertrophie) ; 'legs-a-rehab'/
  // 'legs-b-rehab' sont les séances actives depuis le 13/09/2026
  // (mobilité et activation). Les trois générations sont gardées pour que
  // l'historique déjà enregistré reste coloré/étiqueté correctement.
  dayAccents: {
    'pull-a': '#7c6fcd', 'push-a': '#e03030', 'legs-a': '#e8a020',
    'pull-b': '#6a5fc0', 'push-b': '#cc2828', 'legs-b': '#d09018',
    'legs-a-v3': '#e8a020', 'legs-b-v3': '#d09018',
    'legs-a-rehab': '#e8a020', 'legs-b-rehab': '#d09018',
  },
  dayTypeLabels: {
    'pull-a': 'PULL', 'push-a': 'PUSH', 'legs-a': 'LEGS',
    'pull-b': 'PULL', 'push-b': 'PUSH', 'legs-b': 'LEGS',
    'legs-a-v3': 'LEGS', 'legs-b-v3': 'LEGS',
    'legs-a-rehab': 'LEGS', 'legs-b-rehab': 'LEGS',
  },
};

export const PPL_DEBUTANT_PROGRAM: Program = {
  id: 'ppl-debutant',
  name: 'PPL Débutant',
  focusLabel: 'PPL Débutant · Prise en main',
  shortDescription: '3 séances simples, moins d\'exercices, pas de superset — pour bien débuter.',
  source: 'Trame Push/Pull/Legs simplifiée, inspirée des bases classiques du PPL.',
  workouts: PPL_DEBUTANT_WORKOUTS,
  dayAccents: { 'pplb-pull': '#7c6fcd', 'pplb-push': '#e03030', 'pplb-legs': '#e8a020' },
  dayTypeLabels: { 'pplb-pull': 'PULL', 'pplb-push': 'PUSH', 'pplb-legs': 'LEGS' },
};

export const FULL_BODY_PROGRAM: Program = {
  id: 'full-body',
  name: 'Full Body 3x/semaine',
  focusLabel: 'Full Body · 3x/semaine',
  shortDescription: '3 séances corps entier, efficace si tu as peu de jours disponibles.',
  source: 'Trame full-body classique (squat/press/tirage à chaque séance), inspirée des standards du genre.',
  workouts: FULL_BODY_WORKOUTS,
  dayAccents: { 'fb-a': '#2563eb', 'fb-b': '#16a34a', 'fb-c': '#ea580c' },
  dayTypeLabels: { 'fb-a': 'FULL A', 'fb-b': 'FULL B', 'fb-c': 'FULL C' },
};

export const FORCE_5X5_PROGRAM: Program = {
  id: 'force-5x5',
  name: 'Force 5x5',
  focusLabel: 'Force 5x5 · Force pure',
  shortDescription: '2 séances alternées, 5 séries de 5, mouvements de base lourds.',
  source: 'Trame 5x5 générique (squat/développé/rowing, développé militaire/soulevé de terre), inspirée de la méthode 5x5 classique, pas la copie d\'un programme commercial précis.',
  workouts: FORCE_5X5_WORKOUTS,
  dayAccents: { 'f5x5-a': '#e03030', 'f5x5-b': '#7c6fcd' },
  dayTypeLabels: { 'f5x5-a': 'FORCE A', 'f5x5-b': 'FORCE B' },
};

// Programme de consolidation du poignet : 5 séances/semaine (bas du corps,
// vélo, gainage sans appui sur les mains) — ajouté en juillet 2026, pour
// s'entraîner sans solliciter le poignet.
export const WRIST_CONSOLIDATION_PROGRAM: Program = {
  id: 'poignet-consolidation',
  name: 'Consolidation Poignet',
  focusLabel: 'Consolidation Poignet · Reprise en douceur',
  shortDescription: '5 séances/semaine (jambes, vélo, gainage) — aucun exercice ne sollicite le poignet.',
  source: 'Programme de reprise sans appui sur les poignets, ajouté en juillet 2026.',
  workouts: WRIST_CONSOLIDATION_WORKOUTS,
  dayAccents: {
    'poignet-lundi': '#e8a020', 'poignet-mardi': '#2563eb', 'poignet-mercredi': '#16a34a',
    'poignet-jeudi': '#2563eb', 'poignet-vendredi': '#7c6fcd',
  },
  dayTypeLabels: {
    'poignet-lundi': 'JAMBES', 'poignet-mardi': 'VÉLO', 'poignet-mercredi': 'JAMBES+GAINAGE',
    'poignet-jeudi': 'VÉLO', 'poignet-vendredi': 'FULL BODY',
  },
};

// Programmes intégrés dans l'appli (hors programmes importés par
// l'utilisateur, qui vivent dans le store — voir customPrograms).
export const BUILT_IN_PROGRAMS: Program[] = [
  STRICT_V10_PROGRAM,
  PPL_DEBUTANT_PROGRAM,
  FULL_BODY_PROGRAM,
  FORCE_5X5_PROGRAM,
  WRIST_CONSOLIDATION_PROGRAM,
// Programmes batis sur le catalogue d'exercices (voir catalogPrograms.ts).
...CATALOG_PROGRAMS,
// Modèles repris des bibliothèques de routines des autres apps de sport
// (voir appLibraryPrograms.ts).
...APP_LIBRARY_PROGRAMS,
];

// Combine programmes intégrés + programmes importés (donnés en argument,
// car ils vivent dans le store Zustand — voir SettingsScreen.tsx/HomeScreen.tsx).
export const getAllPrograms = (customPrograms: Program[] = []): Program[] => [
  ...BUILT_IN_PROGRAMS,
  ...customPrograms,
];

export const getProgram = (id: string, customPrograms: Program[] = []): Program =>
  getAllPrograms(customPrograms).find((p) => p.id === id) ?? STRICT_V10_PROGRAM;

/**
 * Accent et libellé (PUSH/PULL/LEGS…) d'une séance, quel que soit le
 * programme d'où elle vient (bibliothèque, catalogue, généré, importé).
 * Sans ça, l'Historique/le Dashboard/l'intro de séance affichaient l'id brut
 * ("ppl6-legs-b") pour tout programme autre que Strict, qui seul avait ses
 * séances codées en dur dans ces écrans.
 */
export const getDayMeta = (
  dayId: string,
  customPrograms: Program[] = []
): { accent: string; typeLabel: string } => {
  for (const program of getAllPrograms(customPrograms)) {
    if (program.workouts.some((w) => w.id === dayId)) {
      return {
        accent: program.dayAccents[dayId] ?? '#7a7a90',
        typeLabel: program.dayTypeLabels[dayId] ?? '',
      };
    }
  }
  return { accent: '#7a7a90', typeLabel: '' };
};

// Les séances des programmes intégrés doivent être retrouvables par getWorkout().
registerBuiltInWorkouts(BUILT_IN_PROGRAMS.flatMap((p) => p.workouts));
