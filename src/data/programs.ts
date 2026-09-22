import { WorkoutDay } from './types';
import { WORKOUTS, registerBuiltInWorkouts } from './workouts';
import { PPL_DEBUTANT_WORKOUTS, FULL_BODY_WORKOUTS, FORCE_5X5_WORKOUTS, WRIST_CONSOLIDATION_WORKOUTS } from './extraPrograms';
import { CATALOG_PROGRAMS } from './catalogPrograms';
import { APP_LIBRARY_PROGRAMS } from './appLibraryPrograms';

// ─── Programmes sélectionnables (Réglages → Programme d'entraînement) ─────
// "Strict V4.0" est le programme historique de l'appli (ex-V10, ex-V11),
// toujours présent en premier — c'est le programme réellement suivi par
// Antoine, mis à jour au fil des versions envoyées (V10 → V11 le 19/07/2026,
// puis V11 → V2.2 « Phase 1 Sèche » le 19/08/2026, puis V2.2 → V2.5 le
// 24/08/2026 — corrections de repos réel uniquement — puis V2.5 → V3.0 le
// 30/08/2026 — jambes sorties de fin de séance, 4 séances → 6 — puis
// V3.0 → V3.2 le 13/09/2026 — pause épaule partielle (douleur deltoïde
// antérieur/latéral, Sem 7-8) + jambes reconstruites en rééducation genou
// pure sur demande d'Antoine — puis V3.2 → V4.0 le 16/09/2026 : épaule
// déclarée muette (retour à charge pleine + réintroduction de l'antérieur),
// contrainte matérielle actée (poids du corps + haltères ≤ 25 kg/pièce,
// volume à 4 séries en compensation), jambes reconduites à l'identique —
// cf. src/data/workouts.ts pour le détail. Son id reste 'strict-v10'
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
  name: 'Strict V4.0',
  focusLabel: 'Strict V4.0 · Épaules priorité 1 + rééduc. genou',
  shortDescription: 'Sem 9-11 : épaule muette → retour à charge pleine et réintroduction de l\'antérieur, poids du corps + haltères ≤ 25 kg (volume à 4 séries), jambes en rééducation genou inchangée — 6 séances, fin de Phase 1 — Sèche (16/10).',
  source: 'Le programme d\'Antoine, mis à jour de V3.2 vers V4.0 le 16/09/2026 (fichier « programme_hypertrophie_PPL_Strict_Phase1_V4.0_S9-S11.xlsx »).',
  workouts: WORKOUTS,
  // Les clés 'legs-a'/'legs-b' (sans suffixe) sont les anciennes séances
  // Legs V11 (avant le 19/08/2026) ; 'legs-a-v3'/'legs-b-v3' celles de la
  // V3.0 (30/08 → 13/09/2026, tri-sets hypertrophie) ; 'legs-a-rehab'/
  // 'legs-b-rehab' sont les séances actives depuis le 13/09/2026
  // (rééducation genou). Les trois générations sont gardées pour que
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
// vélo, gainage sans appui sur les mains) — importé du fichier Excel de
// Léo en juillet 2026, pour continuer à s'entraîner pendant la guérison
// sans solliciter le poignet.
export const WRIST_CONSOLIDATION_PROGRAM: Program = {
  id: 'poignet-consolidation',
  name: 'Consolidation Poignet',
  focusLabel: 'Consolidation Poignet · Reprise en douceur',
  shortDescription: '5 séances/semaine (jambes, vélo, gainage) — aucun exercice ne sollicite le poignet.',
  source: 'Programme de Léo, importé depuis son fichier Excel "Programme musculation poignet consolidation".',
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
