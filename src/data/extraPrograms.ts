import { WorkoutDay } from './types';

// ─── Programmes additionnels (voir programs.ts) ─────────────────────────────
// Ces séances viennent en plus de Strict V10 (workouts.ts, jamais modifié
// ni supprimé) — un choix parmi d'autres, pas un remplacement. Elles sont
// inspirées de trames d'entraînement classiques et largement documentées
// (PPL débutant, full-body 3x/semaine, 5x5 force), pas la copie exacte
// d'un programme commercial précis.

// ─── PPL Débutant : version simplifiée, 3 séances, pas de superset ─────────
export const PPL_DEBUTANT_WORKOUTS: WorkoutDay[] = [
{
id: 'pplb-pull',
dayNumber: 1,
name: 'Pull Débutant',
focus: 'Bases du tirage, en toute sécurité',
muscleGroups: 'Dos / Biceps',
estimatedDuration: '≈ 30 min',
exercises: [
{
id: 'pplb-pull-1', name: 'Tirage poulie haute prise large', muscleGroup: 'DOS',
sets: 3, targetReps: '10-12', restSeconds: 90, restMode: 'normal', isSuperset: false,
notes: 'Buste droit, tire les coudes vers le bas et l\'arrière.',
},
{
id: 'pplb-pull-2', name: 'Rowing poulie basse assis', muscleGroup: 'DOS',
sets: 3, targetReps: '10-12', restSeconds: 90, restMode: 'normal', isSuperset: false,
notes: 'Dos droit, ramène la poignée vers le nombril.',
},
{
id: 'pplb-pull-3', name: 'Curl haltères alterné', muscleGroup: 'BICEPS',
sets: 3, targetReps: '12-15', restSeconds: 60, restMode: 'normal', isSuperset: false,
notes: 'Coudes fixes le long du corps, un bras après l\'autre.',
},
],
},
{
id: 'pplb-push',
dayNumber: 2,
name: 'Push Débutant',
focus: 'Bases de la poussée, pecs et épaules',
muscleGroups: 'Pecs / Épaules / Triceps',
estimatedDuration: '≈ 30 min',
exercises: [
{
id: 'pplb-push-1', name: 'Développé couché machine ou barre guidée', muscleGroup: 'PECS',
sets: 3, targetReps: '10-12', restSeconds: 90, restMode: 'normal', isSuperset: false,
notes: 'Descente contrôlée, coudes à ~45° du buste.',
},
{
id: 'pplb-push-2', name: 'Développé épaules haltères assis', muscleGroup: 'ÉPAULES',
sets: 3, targetReps: '10-12', restSeconds: 90, restMode: 'normal', isSuperset: false,
notes: 'Dos calé au dossier, ne pas verrouiller les coudes en haut.',
},
{
id: 'pplb-push-3', name: 'Extension triceps poulie haute (corde)', muscleGroup: 'TRICEPS',
sets: 3, targetReps: '12-15', restSeconds: 60, restMode: 'normal', isSuperset: false,
notes: 'Coudes collés au corps, ouvre la corde en bas.',
},
],
},
{
id: 'pplb-legs',
dayNumber: 3,
name: 'Legs Débutant',
focus: 'Bases du bas du corps en sécurité',
muscleGroups: 'Quadriceps / Ischios / Mollets',
estimatedDuration: '≈ 32 min',
exercises: [
{
id: 'pplb-legs-1', name: 'Presse à cuisses', muscleGroup: 'QUADRICEPS',
sets: 3, targetReps: '12-15', restSeconds: 120, restMode: 'normal', isSuperset: false,
notes: 'Amplitude complète sans décoller le bas du dos.',
},
{
id: 'pplb-legs-2', name: 'Leg curl allongé ou assis', muscleGroup: 'ISCHIOS & FESSIERS',
sets: 3, targetReps: '12-15', restSeconds: 90, restMode: 'normal', isSuperset: false,
notes: 'Mouvement lent, pas d\'à-coups.',
},
{
id: 'pplb-legs-3', name: 'Extensions mollets debout', muscleGroup: 'MOLLETS',
sets: 3, targetReps: '15-20', restSeconds: 60, restMode: 'normal', isSuperset: false,
notes: 'Pause en étirement en bas du mouvement.',
},
],
},
];

// ─── Full Body 3x/semaine : corps entier, 3 séances différentes ───────────
export const FULL_BODY_WORKOUTS: WorkoutDay[] = [
{
id: 'fb-a',
dayNumber: 1,
name: 'Full Body A',
focus: 'Corps entier, accent bas du corps',
muscleGroups: 'Jambes / Pecs / Dos',
estimatedDuration: '≈ 45 min',
exercises: [
{
id: 'fb-a-1', name: 'Squat gobelet (haltère)', muscleGroup: 'QUADRICEPS',
sets: 3, targetReps: '8-10', restSeconds: 120, restMode: 'normal', isSuperset: false,
notes: 'Descente contrôlée, dos droit, talons au sol.',
},
{
id: 'fb-a-2', name: 'Développé couché haltères', muscleGroup: 'PECS',
sets: 3, targetReps: '10-12', restSeconds: 90, restMode: 'normal', isSuperset: false,
notes: 'Omoplates serrées et ancrées dans le banc.',
},
{
id: 'fb-a-3', name: 'Rowing poulie basse assis', muscleGroup: 'DOS',
sets: 3, targetReps: '10-12', restSeconds: 90, restMode: 'normal', isSuperset: false,
notes: 'Dos droit, tire vers le nombril.',
},
{
id: 'fb-a-4', name: 'Élévations latérales haltères', muscleGroup: 'ÉPAULES',
sets: 3, targetReps: '12-15', restSeconds: 60, restMode: 'normal', isSuperset: false,
notes: 'Légère flexion des coudes, monte jusqu\'aux épaules.',
},
{
id: 'fb-a-5', name: 'Gainage abdominal classique', muscleGroup: 'ABDOS',
sets: 3, targetReps: '30-45 s', restSeconds: 45, restMode: 'normal', isSuperset: false,
notes: 'Planche rigide sur les coudes, corps aligné.',
},
],
},
{
id: 'fb-b',
dayNumber: 2,
name: 'Full Body B',
focus: 'Corps entier, accent chaîne postérieure',
muscleGroups: 'Ischios / Épaules / Dos',
estimatedDuration: '≈ 45 min',
exercises: [
{
id: 'fb-b-1', name: 'Soulevé de terre roumain haltères', muscleGroup: 'ISCHIOS & FESSIERS',
sets: 3, targetReps: '10-12', restSeconds: 120, restMode: 'normal', isSuperset: false,
notes: 'Dos plat, hanches vers l\'arrière, légère flexion des genoux.',
},
{
id: 'fb-b-2', name: 'Développé militaire haltères assis', muscleGroup: 'ÉPAULES',
sets: 3, targetReps: '10-12', restSeconds: 90, restMode: 'normal', isSuperset: false,
notes: 'Buste stable, pousse à la verticale.',
},
{
id: 'fb-b-3', name: 'Tirage poulie haute prise large', muscleGroup: 'DOS',
sets: 3, targetReps: '10-12', restSeconds: 90, restMode: 'normal', isSuperset: false,
notes: 'Tire les coudes vers le bas, pas de balancier.',
},
{
id: 'fb-b-4', name: 'Fentes marchées', muscleGroup: 'QUADRICEPS',
sets: 3, targetReps: '10/jambe', restSeconds: 90, restMode: 'normal', isSuperset: false,
notes: 'Grand pas, genou arrière proche du sol.',
},
{
id: 'fb-b-5', name: 'Crunch enroulement bassin', muscleGroup: 'ABDOS',
sets: 3, targetReps: '15-20', restSeconds: 45, restMode: 'normal', isSuperset: false,
notes: 'Enroule le bassin vers la poitrine.',
},
],
},
{
id: 'fb-c',
dayNumber: 3,
name: 'Full Body C',
focus: 'Corps entier, accent haut du corps',
muscleGroups: 'Pecs / Dos / Bras',
estimatedDuration: '≈ 45 min',
exercises: [
{
id: 'fb-c-1', name: 'Presse à cuisses', muscleGroup: 'QUADRICEPS',
sets: 3, targetReps: '10-12', restSeconds: 120, restMode: 'normal', isSuperset: false,
notes: 'Amplitude complète, contrôle la descente.',
},
{
id: 'fb-c-2', name: 'Pompes lestées ou classiques', muscleGroup: 'PECS',
sets: 3, targetReps: 'AMRAP', restSeconds: 90, restMode: 'normal', isSuperset: false,
notes: 'Corps gainé en planche, poitrine proche du sol.',
},
{
id: 'fb-c-3', name: 'Rowing haltère unilatéral (banc)', muscleGroup: 'DOS',
sets: 3, targetReps: '10-12', restSeconds: 90, restMode: 'normal', isSuperset: false,
notes: 'Dos plat, tire le coude vers la hanche.',
},
{
id: 'fb-c-4', name: 'Curl biceps haltères', muscleGroup: 'BICEPS',
sets: 3, targetReps: '12-15', restSeconds: 60, restMode: 'normal', isSuperset: false,
notes: 'Coudes fixes, pas d\'élan.',
},
{
id: 'fb-c-5', name: 'Planche gainage latéral', muscleGroup: 'ABDOS',
sets: 3, targetReps: '30 s/côté', restSeconds: 45, restMode: 'normal', isSuperset: false,
notes: 'Hanches hautes, corps aligné.',
},
],
},
];

// ─── Force 5x5 : 2 séances alternées, mouvements de base lourds ───────────
// Inspiré de la structure 5x5 classique (squat à chaque séance, presse +
// tirage en alternance, un seul gros mouvement au tirage lourd type
// soulevé de terre) — une trame générique, pas la reproduction d'un
// programme commercial précis.
export const FORCE_5X5_WORKOUTS: WorkoutDay[] = [
{
id: 'f5x5-a',
dayNumber: 1,
name: 'Force A',
focus: 'Squat, développé couché, rowing — les bases',
muscleGroups: 'Jambes / Pecs / Dos',
estimatedDuration: '≈ 50 min',
exercises: [
{
id: 'f5x5-a-1', name: 'Squat barre', muscleGroup: 'QUADRICEPS',
sets: 5, targetReps: '5', restSeconds: 180, restMode: 'normal', isSuperset: false,
notes: 'Même charge sur les 5 séries, ajoute du poids séance après séance.',
},
{
id: 'f5x5-a-2', name: 'Développé couché barre', muscleGroup: 'PECS',
sets: 5, targetReps: '5', restSeconds: 180, restMode: 'normal', isSuperset: false,
notes: 'Barre touche la poitrine à chaque répétition.',
},
{
id: 'f5x5-a-3', name: 'Rowing barre buste penché', muscleGroup: 'DOS',
sets: 5, targetReps: '5', restSeconds: 150, restMode: 'normal', isSuperset: false,
notes: 'Dos plat, tire la barre vers le nombril.',
},
],
},
{
id: 'f5x5-b',
dayNumber: 2,
name: 'Force B',
focus: 'Squat, développé militaire, soulevé de terre',
muscleGroups: 'Jambes / Épaules / Dos',
estimatedDuration: '≈ 50 min',
exercises: [
{
id: 'f5x5-b-1', name: 'Squat barre', muscleGroup: 'QUADRICEPS',
sets: 5, targetReps: '5', restSeconds: 180, restMode: 'normal', isSuperset: false,
notes: 'Même charge sur les 5 séries, ajoute du poids séance après séance.',
},
{
id: 'f5x5-b-2', name: 'Développé militaire barre', muscleGroup: 'ÉPAULES',
sets: 5, targetReps: '5', restSeconds: 180, restMode: 'normal', isSuperset: false,
notes: 'Debout, gainage serré, pousse à la verticale.',
},
{
id: 'f5x5-b-3', name: 'Soulevé de terre barre', muscleGroup: 'ISCHIOS & FESSIERS',
sets: 1, targetReps: '5', restSeconds: 180, restMode: 'normal', isSuperset: false,
notes: 'Une seule série de 5 (contrairement aux autres) — mouvement très exigeant, inutile de le répéter 5 fois.',
},
],
},
];

// ─── Consolidation Poignet : 5 séances/semaine, aucun appui/charge sur le
// poignet (import du fichier Excel de Léo, juillet 2026) ───────────────────
// Objectif : continuer à s'entraîner pendant la consolidation d'une
// blessure au poignet, sans aucun exercice qui sollicite l'appui ou la
// préhension lourde (pas de pompes, pas de développé barre/haltères, pas de
// tirage à charge lourde) — uniquement bas du corps, gainage sans appui sur
// les mains, et cardio vélo (pédales, pas de poids du buste sur les mains).
export const WRIST_CONSOLIDATION_WORKOUTS: WorkoutDay[] = [
{
id: 'poignet-lundi',
dayNumber: 1,
name: 'Bas du corps',
focus: 'Jambes en douceur — aucun appui sur le poignet',
muscleGroups: 'Quadriceps / Fessiers / Mollets',
estimatedDuration: '≈ 30 min',
exercises: [
{
id: 'poignet-lundi-1', name: 'Échauffement', muscleGroup: 'ÉCHAUFFEMENT',
sets: 1, targetReps: '5 min', restSeconds: 0, restMode: 'normal', isSuperset: false,
notes: 'Marche ou vélo léger, articulations mobilisées, sans appui sur les mains.',
},
{
id: 'poignet-lundi-2', name: 'Squats', muscleGroup: 'QUADRICEPS',
sets: 3, targetReps: '15', restSeconds: 60, restMode: 'normal', isSuperset: false,
notes: 'Pieds largeur épaules, descente contrôlée, mains libres (pas d\'appui).',
},
{
id: 'poignet-lundi-3', name: 'Fentes', muscleGroup: 'QUADRICEPS',
sets: 3, targetReps: '10/jambe', restSeconds: 60, restMode: 'normal', isSuperset: false,
notes: 'Grand pas, genou arrière proche du sol, mains sur les hanches.',
},
{
id: 'poignet-lundi-4', name: 'Pont fessier', muscleGroup: 'ISCHIOS & FESSIERS',
sets: 3, targetReps: '15', restSeconds: 45, restMode: 'normal', isSuperset: false,
notes: 'Allongé, bras au sol sans appuyer (juste équilibre), monte le bassin.',
},
{
id: 'poignet-lundi-5', name: 'Mollets', muscleGroup: 'MOLLETS',
sets: 3, targetReps: '20', restSeconds: 45, restMode: 'normal', isSuperset: false,
notes: 'Debout, montées sur pointes de pieds, équilibre sans appui des mains.',
},
{
id: 'poignet-lundi-6', name: 'Étirements', muscleGroup: 'ÉTIREMENTS',
sets: 1, targetReps: '5 min', restSeconds: 0, restMode: 'normal', isSuperset: false,
notes: 'Étirements des jambes, éviter tout appui sur les poignets.',
},
],
},
{
id: 'poignet-mardi',
dayNumber: 2,
name: 'Vélo',
focus: 'Cardio léger, rythme modéré — aucune charge sur les mains',
muscleGroups: 'Cardio',
estimatedDuration: '≈ 30 min',
exercises: [
{
id: 'poignet-mardi-1', name: 'Échauffement facile', muscleGroup: 'CARDIO',
sets: 1, targetReps: '5 min', restSeconds: 0, restMode: 'normal', isSuperset: false,
notes: 'Vélo, allure facile, prise légère sur le guidon.',
},
{
id: 'poignet-mardi-2', name: 'Rythme modéré', muscleGroup: 'CARDIO',
sets: 1, targetReps: '20 min', restSeconds: 0, restMode: 'normal', isSuperset: false,
notes: 'Allure soutenue mais confortable, cadence régulière.',
},
{
id: 'poignet-mardi-3', name: 'Retour au calme', muscleGroup: 'CARDIO',
sets: 1, targetReps: '5 min', restSeconds: 0, restMode: 'normal', isSuperset: false,
notes: 'Allure très facile, respiration qui redescend.',
},
],
},
{
id: 'poignet-mercredi',
dayNumber: 3,
name: 'Jambes + gainage',
focus: 'Bas du corps et gainage sans appui sur les mains',
muscleGroups: 'Quadriceps / Abdos',
estimatedDuration: '≈ 30 min',
exercises: [
{
id: 'poignet-mercredi-1', name: 'Échauffement', muscleGroup: 'ÉCHAUFFEMENT',
sets: 1, targetReps: '5 min', restSeconds: 0, restMode: 'normal', isSuperset: false,
notes: 'Marche ou vélo léger, sans appui sur les mains.',
},
{
id: 'poignet-mercredi-2', name: 'Step-ups', muscleGroup: 'QUADRICEPS',
sets: 3, targetReps: '10/jambe', restSeconds: 60, restMode: 'normal', isSuperset: false,
notes: 'Sur step ou marche, monte en poussant sur le talon, mains libres.',
},
{
id: 'poignet-mercredi-3', name: 'Chaise', muscleGroup: 'QUADRICEPS',
sets: 3, targetReps: '30-45 s', restSeconds: 45, restMode: 'normal', isSuperset: false,
notes: 'Dos contre un mur, cuisses parallèles au sol, mains sur les cuisses.',
},
{
id: 'poignet-mercredi-4', name: 'Dead bug', muscleGroup: 'ABDOS',
sets: 3, targetReps: '10/côté', restSeconds: 45, restMode: 'normal', isSuperset: false,
notes: 'Allongé, bras tendus vers le plafond (pas d\'appui au sol), bas du dos plaqué.',
},
{
id: 'poignet-mercredi-5', name: 'Étirements', muscleGroup: 'ÉTIREMENTS',
sets: 1, targetReps: '5 min', restSeconds: 0, restMode: 'normal', isSuperset: false,
notes: 'Étirements jambes et hanches, éviter tout appui sur les poignets.',
},
],
},
{
id: 'poignet-jeudi',
dayNumber: 4,
name: 'Vélo',
focus: 'Cardio fractionné — aucune charge sur les mains',
muscleGroups: 'Cardio',
estimatedDuration: '≈ 30 min',
exercises: [
{
id: 'poignet-jeudi-1', name: 'Échauffement facile', muscleGroup: 'CARDIO',
sets: 1, targetReps: '5 min', restSeconds: 0, restMode: 'normal', isSuperset: false,
notes: 'Vélo, allure facile, prise légère sur le guidon.',
},
{
id: 'poignet-jeudi-2', name: 'Fractionné', muscleGroup: 'CARDIO',
sets: 1, targetReps: '10 x (1 min rapide / 1 min lente)', restSeconds: 0, restMode: 'normal', isSuperset: false,
notes: 'Alterne 1 min à allure rapide et 1 min à allure lente, 10 fois de suite.',
},
{
id: 'poignet-jeudi-3', name: 'Retour au calme', muscleGroup: 'CARDIO',
sets: 1, targetReps: '5 min', restSeconds: 0, restMode: 'normal', isSuperset: false,
notes: 'Allure très facile, respiration qui redescend.',
},
],
},
{
id: 'poignet-vendredi',
dayNumber: 5,
name: 'Corps entier',
focus: 'Bilan de semaine, tout le corps sans appui sur les mains',
muscleGroups: 'Jambes / Fessiers / Abdos',
estimatedDuration: '≈ 30 min',
exercises: [
{
id: 'poignet-vendredi-1', name: 'Squats', muscleGroup: 'QUADRICEPS',
sets: 3, targetReps: '15', restSeconds: 60, restMode: 'normal', isSuperset: false,
notes: 'Pieds largeur épaules, descente contrôlée, mains libres.',
},
{
id: 'poignet-vendredi-2', name: 'Fentes', muscleGroup: 'QUADRICEPS',
sets: 3, targetReps: '10/jambe', restSeconds: 60, restMode: 'normal', isSuperset: false,
notes: 'Grand pas, genou arrière proche du sol, mains sur les hanches.',
},
{
id: 'poignet-vendredi-3', name: 'Pont sur une jambe', muscleGroup: 'ISCHIOS & FESSIERS',
sets: 3, targetReps: '10/jambe', restSeconds: 45, restMode: 'normal', isSuperset: false,
notes: 'Allongé, une jambe tendue, monte le bassin avec la jambe au sol.',
},
{
id: 'poignet-vendredi-4', name: 'Bird-dog', muscleGroup: 'ABDOS',
sets: 3, targetReps: '10/côté', restSeconds: 45, restMode: 'normal', isSuperset: false,
notes: 'À quatre pattes, poids sur les avant-bras si besoin plutôt que les poignets tendus, tends bras et jambe opposés.',
},
{
id: 'poignet-vendredi-5', name: 'Dead bug', muscleGroup: 'ABDOS',
sets: 3, targetReps: '10/côté', restSeconds: 45, restMode: 'normal', isSuperset: false,
notes: 'Allongé, bras tendus vers le plafond (pas d\'appui au sol), bas du dos plaqué.',
},
{
id: 'poignet-vendredi-6', name: 'Étirements', muscleGroup: 'ÉTIREMENTS',
sets: 1, targetReps: '5 min', restSeconds: 0, restMode: 'normal', isSuperset: false,
notes: 'Étirements généraux, éviter tout appui sur les poignets.',
},
],
},
];
