import { WorkoutDay, ProgressionWeek } from './types';
import { PPL_DEBUTANT_WORKOUTS, FULL_BODY_WORKOUTS, FORCE_5X5_WORKOUTS, WRIST_CONSOLIDATION_WORKOUTS } from './extraPrograms';

// ─── Tableau de progression 8 semaines (PPL Strict V11) ─────────────────────

export const PROGRESSION_WEEKS: ProgressionWeek[] = [
  {
    label: 'Sem. 1-2',
    phase: 'Repères',
    rir: 'RIR 2-3',
    objective: 'Calibrer les charges proposées (bas de fourchette).',
  },
  {
    label: 'Sem. 3-4',
    phase: 'Reps',
    rir: 'RIR 2',
    objective: 'Appliquer les propositions : +1 rep/série avant de charger.',
  },
  {
    label: 'Sem. 5-6',
    phase: 'Charge',
    rir: 'RIR 1-2',
    objective: '+charge (retour bas de fourchette) ; +1 série épaules/fessiers si récup OK.',
  },
  {
    label: 'Sem. 7',
    phase: 'Pic',
    rir: 'RIR 0-1',
    objective: 'Échec technique sur les isolations.',
  },
  {
    label: 'Sem. 8',
    phase: 'Deload',
    rir: '—',
    objective: '-30 % volume / -20 % charge. Jambes maintenues en récup active.',
  },
];

// ─── Les 6 séances PPL Strict V11 ────────────────────────────────────────────
// Programme actif de l'appli (remplace Strict V10 le 19/07/2026).
// État actuel : PHASE 0bis — REMONTÉE EN CHARGE (24→30/07/2026), suite de la
// Phase 0 — décharge (16→23/07). 3 séries de travail par exercice, RIR 2-3,
// charges réduites d'≈5 % par rapport à la cible Sem 1 sèche. Zéro échec,
// zéro AMRAP (Dips en reps fixes 10-15), zéro technique d'intensification —
// on absorbe le retour au volume/intensité pendant que les calories sont
// encore à maintenance, pour arriver le 31/07 à pleine charge d'entraînement
// (bascule sèche : séries/RIR/charges d'origine, déficit -400/-500 kcal).
// Contrainte permanente du programme : zéro développé vertical en charge
// libre au-dessus de la tête (protection lombaires, cf. protocole de
// réintroduction progressive côté onglet "Conseils — Lombaires" du fichier
// source, pas encore repris dans l'appli).
export const WORKOUTS: WorkoutDay[] = [
  // ── JOUR 1 — PULL A ────────────────────────────────────────────────────────
  {
    id: 'pull-a',
    dayNumber: 1,
    name: 'Pull A',
    focus: 'Épaisseur du dos + priorité deltoïde postérieur (Phase 0bis — remontée, RIR 2-3, jusqu\'au 30/07)',
    muscleGroups: 'Dos / Deltoïde postérieur / Biceps',
    estimatedDuration: '≈ 50 min',
    exercises: [
      {
        id: 'pull-a-1',
        name: 'Tractions pronation lestées',
        muscleGroup: 'DOS',
        sets: 3,
        targetReps: '6-10',
        restSeconds: 180,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC+5',
        notes: 'Prise large, descente complète. Tempo 3-0-1. PDC×13 en V10 = trop facile → lester pour retomber dans 6-10.',
      },
      {
        id: 'pull-a-2',
        name: 'Tirage horizontal poulie assis',
        muscleGroup: 'DOS',
        sets: 3,
        targetReps: '10-12',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '75',
        notes: 'Machine 2ᵉ plateau (repère machine, pas kg). Rétraction scapulaire marquée. Tempo 2-1-1.',
      },
      // ── SUPERSET Pull A : Deltoïde postérieur + Biceps ──
      {
        id: 'pull-a-3',
        name: 'Oiseau poulie unilatéral',
        muscleGroup: 'DELTOÏDE POSTÉRIEUR',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 0, // Pas de repos : enchaîné avec le curl marteau
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-pull-a',
        supersetOrder: 1,
        defaultWeight: '9.5',
        notes: 'Câble bas croisé, trajectoire horizontale pure. Tempo 2-1-1. Enchaîné sans repos avec le curl marteau.',
      },
      {
        id: 'pull-a-4',
        name: 'Curl marteau haltères',
        muscleGroup: 'BICEPS',
        sets: 3,
        targetReps: '10-12',
        restSeconds: 90, // Repos après la paire SS
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-pull-a',
        supersetOrder: 2,
        defaultWeight: '26.5',
        notes: '2ᵉ mouvement du superset (après l\'oiseau). Tempo 2-0-1. 28 kg validé à 11-13 reps en V10.',
      },
      {
        id: 'pull-a-5',
        name: 'Curl poulie basse à la corde',
        muscleGroup: 'BICEPS',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '14.5',
        notes: 'Tension continue, supination en fin de course. Tempo 2-0-1. 15 kg = bon calibre (12-14 reps V10).',
      },
    ],
  },

  // ── JOUR 2 — PUSH A ────────────────────────────────────────────────────────
  {
    id: 'push-a',
    dayNumber: 2,
    name: 'Push A',
    focus: 'Deltoïdes priorité 1 à froid, aucun développé vertical (Phase 0bis — remontée, RIR 2-3, jusqu\'au 30/07)',
    muscleGroups: 'Épaules / Pecs / Triceps',
    estimatedDuration: '≈ 42 min',
    exercises: [
      {
        id: 'push-a-1',
        name: 'Élévations latérales haltères',
        muscleGroup: 'ÉPAULES',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 75,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '19',
        notes: '18×19 en V10 = trop léger → 20 kg pour tomber dans 12-15. Buste légèrement penché, pas d\'élan. Tempo 2-0-1.',
      },
      {
        id: 'push-a-2',
        name: 'Élévations frontales haltère/disque',
        muscleGroup: 'ÉPAULES',
        sets: 3,
        targetReps: '10-12',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '11.5',
        notes: 'Deltoïde antérieur. Hauteur d\'yeux, dos plaqué, gainage abdo actif (protection lombaire). Tempo 2-0-1.',
      },
      {
        id: 'push-a-3',
        name: 'Développé incliné haltères',
        muscleGroup: 'PECS',
        sets: 3,
        targetReps: '8-12',
        restSeconds: 150,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '50',
        notes: 'Banc 30°. Portion claviculaire + delt antérieur. Tempo 3-0-1. Charge estimée ~90 % du couché V10, à calibrer.',
      },
      // ── SUPERSET Push A : Pecs (écartés) + Triceps ──
      {
        id: 'push-a-4',
        name: 'Écartés poulie vis-à-vis',
        muscleGroup: 'PECS',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 0,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-push-a',
        supersetOrder: 1,
        defaultWeight: '27.5',
        notes: 'Poulies à hauteur d\'épaule, convergence au bas du sternum, buste penché ~15°. Tempo 2-1-1. Enchaîné avec le triceps.',
      },
      {
        id: 'push-a-5',
        name: 'Extension triceps corde poulie',
        muscleGroup: 'TRICEPS',
        sets: 3,
        targetReps: '10-12',
        restSeconds: 90,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-push-a',
        supersetOrder: 2,
        defaultWeight: '21.5',
        notes: '2ᵉ mouvement du superset. Coudes collés, écarter la corde en bas. Tempo 2-0-1. 17,5 kg×19 en V10 = trop léger → 22,5 kg.',
      },
    ],
  },

  // ── JOUR 3 — LEGS A ────────────────────────────────────────────────────────
  {
    id: 'legs-a',
    dayNumber: 3,
    name: 'Legs A',
    focus: 'Récup active post-ski (unilatéral), priorité fessiers (Phase 0bis — remontée, RIR 2-3, jusqu\'au 30/07)',
    muscleGroups: 'Fessiers / Quadriceps / Ischios / Mollets + Abdos',
    estimatedDuration: '≈ 44 min',
    exercises: [
      {
        id: 'legs-a-1',
        name: 'Hip thrust unilatéral (banc, haltère)',
        muscleGroup: 'FESSIERS',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '11.5',
        notes: 'Poussée dans le talon, rétroversion + pause 1 s en haut. Tempo 2-1-1. 10 kg en V10 → 12 kg.',
      },
      // ── SUPERSET antagoniste : Fente (quad) + RDL (ischios) ──
      {
        id: 'legs-a-2',
        name: 'Fente avant grand pas (unilat.)',
        muscleGroup: 'QUADRICEPS',
        sets: 3,
        targetReps: '10-12 /jambe',
        restSeconds: 0,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-legs-a-1',
        supersetOrder: 1,
        defaultWeight: 'PDC',
        notes: 'Superset antagoniste avec le RDL. Genou aligné, torse droit. Tempo 3-0-1.',
      },
      {
        id: 'legs-a-3',
        name: 'Soulevé de terre roumain unilatéral',
        muscleGroup: 'ISCHIO-JAMBIERS',
        sets: 3,
        targetReps: '10-12 /jambe',
        restSeconds: 90,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-legs-a-1',
        supersetOrder: 2,
        defaultWeight: '9.5',
        notes: 'LÉGER. 2ᵉ du superset. Dos neutre gainé même enchaîné — ne jamais sacrifier la position lombaire. Tempo 3-1-1.',
      },
      // ── SUPERSET Mollets + Abdos (reverse crunch) ──
      {
        id: 'legs-a-4',
        name: 'Extensions mollets debout unilatéral',
        muscleGroup: 'MOLLETS',
        sets: 3,
        targetReps: '15-20 /jambe',
        restSeconds: 0,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-legs-a-2',
        supersetOrder: 1,
        defaultWeight: 'PDC',
        notes: 'Superset avec le reverse crunch. Pause 1 s en étirement bas. Tempo 2-2-1.',
      },
      {
        id: 'legs-a-5',
        name: 'Reverse crunch (enroulement bassin)',
        muscleGroup: 'ABDOS',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 60,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-legs-a-2',
        supersetOrder: 2,
        defaultWeight: 'PDC',
        notes: '2ᵉ du superset. Enrouler le bassin vers le sternum, sans élan. Tempo 2-1-1.',
      },
      {
        id: 'legs-a-6',
        name: 'Hollow body hold',
        muscleGroup: 'ABDOS',
        sets: 3,
        targetReps: 'Max sec',
        restSeconds: 60,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC',
        notes: 'Anti-extension. Bas du dos plaqué obligatoire. +5 s à la séance suivante si tenu proprement, sinon maintenir.',
      },
    ],
  },

  // ── JOUR 4 — PULL B ────────────────────────────────────────────────────────
  {
    id: 'pull-b',
    dayNumber: 4,
    name: 'Pull B',
    focus: 'Largeur du dos + volume deltoïde postérieur (Phase 0bis — remontée, RIR 2-3, jusqu\'au 30/07)',
    muscleGroups: 'Dos / Deltoïde postérieur / Biceps',
    estimatedDuration: '≈ 48 min',
    exercises: [
      {
        id: 'pull-b-1',
        name: 'Tractions supination lestées',
        muscleGroup: 'DOS',
        sets: 3,
        targetReps: '6-10',
        restSeconds: 180,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC+9.5',
        notes: 'Poitrine vers la barre. Tempo 3-0-1. PDC×15 en V10 = beaucoup trop facile pour 6-10 → lester ~10 kg.',
      },
      {
        id: 'pull-b-2',
        name: 'Pullover poulie haute (debout)',
        muscleGroup: 'DOS',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '26',
        notes: 'Bras quasi tendus, étirement du grand dorsal. Tempo 2-1-1. 25-27,5 kg validé 12-18 reps en V10.',
      },
      // ── SUPERSET Pull B : Deltoïde postérieur + Biceps ──
      {
        id: 'pull-b-3',
        name: 'Oiseau haltères buste penché',
        muscleGroup: 'DELTOÏDE POSTÉRIEUR',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 0,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-pull-b',
        supersetOrder: 1,
        defaultWeight: '13.5',
        notes: 'Buste ~45°, pouces vers le bas, coudes hauts. Tempo 2-1-1. Enchaîné avec le curl incliné.',
      },
      {
        id: 'pull-b-4',
        name: 'Curl incliné haltères (banc 45°)',
        muscleGroup: 'BICEPS',
        sets: 3,
        targetReps: '10-12',
        restSeconds: 90,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-pull-b',
        supersetOrder: 2,
        defaultWeight: '22',
        notes: '2ᵉ du superset. Bras ballants = étirement max du chef long. Tempo 3-0-1. 23 kg calibré en V10.',
      },
      {
        id: 'pull-b-5',
        name: 'Curl inversé barre EZ (avant-bras)',
        muscleGroup: 'BICEPS',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '9.5',
        notes: 'Pronation, poignets verrouillés. Tempo 2-0-1. 10 kg validé 13-14 reps en V10.',
      },
    ],
  },

  // ── JOUR 5 — PUSH B ────────────────────────────────────────────────────────
  {
    id: 'push-b',
    dayNumber: 5,
    name: 'Push B',
    focus: 'Deltoïdes priorité 1 (poulie) + pecs sterno-costal, aucun développé vertical (Phase 0bis — remontée, RIR 2-3, jusqu\'au 30/07)',
    muscleGroups: 'Épaules / Pecs / Triceps',
    estimatedDuration: '≈ 47 min',
    exercises: [
      {
        id: 'push-b-1',
        name: 'Élévations latérales poulie basse',
        muscleGroup: 'ÉPAULES',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 75,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '5',
        notes: 'Câble derrière le dos, tension en bas. Tempo 2-0-1. 5 kg/côté validé 14-17 reps en V10 (7,5 = trop lourd).',
      },
      {
        id: 'push-b-2',
        name: 'Élévations frontales poulie basse',
        muscleGroup: 'ÉPAULES',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '5',
        notes: 'Deltoïde antérieur. Corps immobile, gainage abdo, aucun balancier lombaire. Tempo 2-0-1.',
      },
      {
        id: 'push-b-3',
        name: 'Développé couché haltères',
        muscleGroup: 'PECS',
        sets: 3,
        targetReps: '8-12',
        restSeconds: 150,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '60',
        notes: 'Omoplates rétractées, léger étirement en bas. Tempo 3-0-1. 62 kg validé 8-10 reps en V10 (bon calibre 8-12).',
      },
      // ── SUPERSET Push B : Pecs (écartés) + Triceps (dips) ──
      {
        id: 'push-b-4',
        name: 'Écartés haltères vis-à-vis (poulie)',
        muscleGroup: 'PECS',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 0,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-push-b',
        supersetOrder: 1,
        defaultWeight: '27.5',
        notes: '29 kg → 13 reps en V10 (en plein dans 12-15). Tempo 2-1-1. Enchaîné avec les dips.',
      },
      {
        id: 'push-b-5',
        name: 'Dips au poids du corps',
        muscleGroup: 'TRICEPS',
        sets: 3,
        targetReps: '10-15',
        restSeconds: 120,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-push-b',
        supersetOrder: 2,
        defaultWeight: 'PDC',
        notes: '2ᵉ du superset. Coudes serrés, buste vertical. Tempo 2-0-1. Reps fixes 10-15, pas d\'AMRAP en Phase 0bis (reprend le 31/07). 14-18 reps en V10.',
      },
    ],
  },

  // ── JOUR 6 — LEGS B ────────────────────────────────────────────────────────
  {
    id: 'legs-b',
    dayNumber: 6,
    name: 'Legs B',
    focus: 'Récup active, priorité fessiers puis mollets (Phase 0bis — remontée, RIR 2-3, jusqu\'au 30/07)',
    muscleGroups: 'Fessiers / Quadriceps / Mollets + Abdos',
    estimatedDuration: '≈ 45 min',
    exercises: [
      {
        id: 'legs-b-1',
        name: 'Hip thrust unilatéral (banc, haltère)',
        muscleGroup: 'FESSIERS',
        sets: 3,
        targetReps: '12-15 /jambe',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '11.5',
        notes: 'Grand fessier. Pause 1 s en haut, rétroversion. Tempo 2-1-1.',
      },
      // ── SUPERSET Fessiers (abduction) + Quadriceps (bulgare) ──
      {
        id: 'legs-b-2',
        name: 'Abduction hanche câble unilatéral',
        muscleGroup: 'FESSIERS',
        sets: 3,
        targetReps: '15-20 /jambe',
        restSeconds: 0,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-legs-b-1',
        supersetOrder: 1,
        defaultWeight: '5',
        notes: 'Moyen fessier. Buste stable, pas de rotation du bassin. Tempo 2-1-1. Enchaîné avec le bulgare.',
      },
      {
        id: 'legs-b-3',
        name: 'Squat bulgare unilatéral haltères',
        muscleGroup: 'QUADRICEPS',
        sets: 3,
        targetReps: '10-12 /jambe',
        restSeconds: 90,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-legs-b-1',
        supersetOrder: 2,
        defaultWeight: 'PDC',
        notes: '2ᵉ du superset. Pied arrière surélevé, descente contrôlée, genou avant aligné. Tempo 3-0-1.',
      },
      // ── SUPERSET Mollets + Abdos (crunch) ──
      {
        id: 'legs-b-4',
        name: 'Extensions mollets assis unilatéral',
        muscleGroup: 'MOLLETS',
        sets: 3,
        targetReps: '15-20 /jambe',
        restSeconds: 0,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-legs-b-2',
        supersetOrder: 1,
        defaultWeight: '40',
        notes: 'Soléaire. 32×30 en V10 = trop léger pour 15-20 → 40 (repère à calibrer). Tempo 2-2-1. Enchaîné avec le crunch.',
      },
      {
        id: 'legs-b-5',
        name: 'Crunch câble à genoux',
        muscleGroup: 'ABDOS',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 60,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-legs-b-2',
        supersetOrder: 2,
        defaultWeight: '14.5',
        notes: '2ᵉ du superset. Enrouler la colonne, hanches fixes, charge progressive. Tempo 2-1-1.',
      },
      {
        id: 'legs-b-6',
        name: 'Gainage latéral (oblique)',
        muscleGroup: 'ABDOS',
        sets: 3,
        targetReps: 'Max sec /côté',
        restSeconds: 60,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC',
        notes: 'Anti-inclinaison. Bassin haut, obliques + carré des lombes. +5 s à la séance suivante si tenu proprement, sinon maintenir.',
      },
    ],
  },
];

// Toutes les séances de tous les programmes intégrés (Strict V11 + les
// programmes additionnels de extraPrograms.ts) — sert uniquement à la
// recherche par id ci-dessous, pour que l'historique/les écrans puissent
// toujours retrouver une séance même si le programme actif a changé
// depuis (voir workoutStore.ts → activeProgramId).
const ALL_KNOWN_WORKOUTS: WorkoutDay[] = [
  ...WORKOUTS,
  ...PPL_DEBUTANT_WORKOUTS,
  ...FULL_BODY_WORKOUTS,
  ...FORCE_5X5_WORKOUTS,
  ...WRIST_CONSOLIDATION_WORKOUTS,
];

// Registre des séances issues de programmes importés par l'utilisateur
// (voir importParser.ts + workoutStore.ts → customPrograms). Rempli au
// chargement de l'appli et à chaque import — permet à getWorkout() de les
// retrouver sans dépendance circulaire vers le store.
export const CUSTOM_WORKOUTS: WorkoutDay[] = [];
export const setCustomWorkouts = (days: WorkoutDay[]) => {
  CUSTOM_WORKOUTS.length = 0;
  CUSTOM_WORKOUTS.push(...days);
};

// Helper : récupère une séance par son ID, dans n'importe quel programme
// intégré ou importé (pas seulement Strict V11) — utilisé partout dans
// l'appli (session, historique, dashboard...) donc reste valable même
// après un changement de programme actif.
export const getWorkout = (id: string): WorkoutDay | undefined =>
  ALL_KNOWN_WORKOUTS.find((w) => w.id === id) ?? CUSTOM_WORKOUTS.find((w) => w.id === id);
