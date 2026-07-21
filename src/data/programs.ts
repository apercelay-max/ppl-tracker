import { WorkoutDay } from './types';
import { WORKOUTS } from './workouts';
import { PPL_DEBUTANT_WORKOUTS, FULL_BODY_WORKOUTS, FORCE_5X5_WORKOUTS, WRIST_CONSOLIDATION_WORKOUTS } from './extraPrograms';

// ─── Programmes sélectionnables (Réglages → Programme d'entraînement) ─────
// "Strict V11" est le programme historique de l'appli (ex-V10), toujours
// présent en premier — c'est le programme réellement suivi par Léo, mis à
// jour au fil des versions envoyées (V10 → V11 le 19/07/2026). Les autres
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
name: 'Strict V11',
focusLabel: 'Strict V11 · Hypertrophie',
shortDescription: '6 séances (Pull/Push/Legs x2), hypertrophie, supersets ciblés. Actuellement en Phase 0 — décharge (16→23/07).',
source: 'Le programme de Léo, mis à jour de V10 vers V11 le 19/07/2026.',
workouts: WORKOUTS,
dayAccents: {
'pull-a': '#7c6fcd', 'push-a': '#e03030', 'legs-a': '#e8a020',
'pull-b': '#6a5fc0', 'push-b': '#cc2828', 'legs-b': '#d09018',
},
dayTypeLabels: {
'pull-a': 'PULL', 'push-a': 'PUSH', 'legs-a': 'LEGS',
'pull-b': 'PULL', 'push-b': 'PUSH', 'legs-b': 'LEGS',
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
];

// Combine programmes intégrés + programmes importés (donnés en argument,
// car ils vivent dans le store Zustand — voir SettingsScreen.tsx/HomeScreen.tsx).
export const getAllPrograms = (customPrograms: Program[] = []): Program[] => [
...BUILT_IN_PROGRAMS,
...customPrograms,
];

export const getProgram = (id: string, customPrograms: Program[] = []): Program =>
getAllPrograms(customPrograms).find((p) => p.id === id) ?? STRICT_V10_PROGRAM;
