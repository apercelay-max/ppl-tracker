import { WorkoutDay, ProgressionWeek } from './types';
import { PPL_DEBUTANT_WORKOUTS, FULL_BODY_WORKOUTS, FORCE_5X5_WORKOUTS, WRIST_CONSOLIDATION_WORKOUTS } from './extraPrograms';
import { LEGACY_LEGS_WORKOUTS } from './legacyWorkouts';

// ─── Mésocycle Phase 1 — Sèche (31/07 → 16/10/2026) ─────────────────────────
// 11 semaines, deload + diet break en semaine 6. Repris tel quel de l'onglet
// « Récap + Progression » du fichier V2.2.
export const MESOCYCLE_WEEKS = 11;

export const PROGRESSION_WEEKS: ProgressionWeek[] = [
  {
    label: 'Sem. 1-3',
    phase: 'Repères — salle',
    rir: 'RIR 2-3',
    objective: 'Terminé (31/07 → 20/08). Historique salle : les repères de plaques ne sont pas des kg.',
  },
  {
    label: 'Sem. 4',
    phase: 'Recalibrage — home gym',
    rir: 'RIR 2-3',
    objective: 'Établir les vrais kg sur les exercices dont le référentiel change. Aucune recherche de performance.',
  },
  {
    label: 'Sem. 5',
    phase: 'Charge',
    rir: 'RIR 1-2',
    objective: 'Pilotage ▲/▼ sur tous les exercices. Viser le haut de fourchette avant de charger.',
  },
  {
    label: 'Sem. 6',
    phase: 'Deload + diet break',
    rir: 'RIR 3-4',
    objective: '-30 % volume / -20 % charge. Zéro échec, zéro AMRAP. Retour 7 j à la maintenance calorique.',
  },
  {
    label: 'Sem. 7-10',
    phase: 'Reprise → Charge',
    rir: 'RIR 2 puis 1-2',
    objective: 'Retour au déficit -400/-500 kcal, volume plein. Sem 9-10 : appliquer ▲ +charge.',
  },
  {
    label: 'Sem. 11',
    phase: 'Pic',
    rir: 'RIR 0-1',
    objective: 'Échec technique sur les isolations. Dernière semaine avant la Phase 2 — Maintenance (17/10).',
  },
];

// Semaine du mésocycle (1-11) → index de phase dans PROGRESSION_WEEKS.
const WEEK_TO_PHASE_INDEX = [0, 0, 0, 1, 2, 3, 4, 4, 4, 4, 5];

/** Phase du mésocycle correspondant à la semaine donnée (bornée 1 → 11). */
export const getProgressionWeek = (week: number): ProgressionWeek => {
  const w = Math.min(MESOCYCLE_WEEKS, Math.max(1, Math.round(week)));
  return PROGRESSION_WEEKS[WEEK_TO_PHASE_INDEX[w - 1]];
};

// ─── Les 4 séances PPL Strict V2.2 ──────────────────────────────────────────
// Programme actif de l'appli. Remplace Strict V11 (6 séances) le 19/08/2026,
// à partir du fichier « programme_hypertrophie_PPL_Strict_Phase1_V2.2.xlsx ».
//
// CE QUI CHANGE PAR RAPPORT À V11 :
//  · 6 séances → 4. Les deux journées Legs sont DISSOUTES : chaque séance du
//    haut du corps se termine par un TRI-SET continu de trois exercices
//    (hanche ou cuisse → mollet ou 2ᵉ hanche → abdos), enchaînés sans repos,
//    60 s entre les tours. Fréquence jambes 2 → 4 fois par rotation, à volume
//    hebdomadaire identique (104 séries), pour ~50 min gagnées par semaine.
//  · Tout le matériel passe en HOME GYM : haltères ≤ 40 kg pièce, banc
//    réglable, 1 poulie haute + 1 basse mais UN SEUL stack (donc aucun câble
//    bilatéral), barre EZ, barre de traction, station dips, gilet ≤ 10 kg.
//    Les repères de plaques de l'historique salle ne sont plus des kg.
//  · Charges de départ = colonne Sem 4 (recalibrage, 21→27/08) pour Pull A,
//    Push A et Pull B ; colonne Sem 5 (charge, 28/08→03/09) pour Push B, dont
//    la Sem 4 a déjà été réalisée.
//
// ⚠ RÈGLE DU CYCLE GLISSANT : ne jamais boucler la rotation de 4 séances en
// moins de 6 jours pendant la sèche (en dessous, on dépasse 120 séries
// hebdomadaires en déficit calorique). Cible = 7 jours, soit 104 séries.
//
// ⚠ RÈGLE V2.2 — LE RIR PRIME SUR LA FOURCHETTE : la fourchette de reps est
// un outil de calibrage de charge, pas une consigne d'arrêt. On ne s'arrête
// jamais avant le RIR prescrit pour rentrer dans la case ; on note le vrai
// chiffre et on corrige la CHARGE à la séance suivante.
//
// Contrainte permanente : zéro développé vertical en charge libre au-dessus
// de la tête (protection lombaires). Jambes en récupération active stricte
// post-ski : unilatéral intégral, aucune surcharge progressive recherchée.
export const WORKOUTS: WorkoutDay[] = [
  // ── PULL A — Deltoïdes / Dos / Biceps + Jambes ⟳ ──────────────────────────────────
  {
    id: 'pull-a',
    dayNumber: 1,
    name: 'Pull A',
    focus: 'Épaules (deltoïde postérieur + latéral) prioritaires à froid, puis dos et biceps — jambes en tri-set de fin de séance',
    muscleGroups: 'Deltoïdes / Dos / Biceps + Jambes ⟳',
    estimatedDuration: '≈ 69 min',
    exercises: [
      {
        id: 'pull-a-1',
        name: 'Oiseau haltères poitrine appuyée (banc 30°)',
        muscleGroup: 'DELTOÏDE POSTÉRIEUR',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '12',
        notes: '★ PRIORITÉ 1, exercice n°1 à froid. REMPLACE l\'oiseau câble bas croisé (impossible : un seul stack). Poitrine calée sur le dossier incliné à 30° → contrainte lombaire nulle et zéro élan, le deltoïde postérieur devient le seul moteur. Pouces vers le bas, coudes hauts, trajectoire horizontale pure, pause 1 s en contraction. Tempo 2-1-1, RIR 2-3.',
      },
      {
        id: 'pull-a-2',
        name: 'Élévations latérales poulie basse unilatéral',
        muscleGroup: 'DELTOÏDE LATÉRAL',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '7',
        notes: 'Ajout V1.4 — prend la place du curl poulie à la corde. Le deltoïde latéral passe de 6 à 12 séries par semaine. Câble passé derrière le dos, main libre en appui, buste immobile : le câble maintient la tension en position basse, là où l\'haltère est à zéro. Départ 7 kg par bras (recalé après ta séance Push B). Tempo 2-0-1, RIR 2-3.',
      },
      {
        id: 'pull-a-3',
        name: 'Tractions pronation lestées (barre)',
        muscleGroup: 'DOS',
        sets: 3,
        targetReps: '6-10',
        restSeconds: 180,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC+5',
        notes: 'Retour à la VRAIE traction : les repères 130 / 75 / 120 étaient des plaques de machine guidée, aucun rapport avec des kg. Référence au poids du corps : 11/9/7. Départ Sem 4 = PDC + gilet 5 kg. Prise large, descente COMPLÈTE bras tendus, poitrine vers la barre. Tempo 3-0-1, RIR 2-3.',
      },
      {
        id: 'pull-a-4',
        name: 'Curl marteau haltères',
        muscleGroup: 'BICEPS',
        sets: 3,
        targetReps: '10-12',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '32',
        notes: '★ PRIORITÉ 2. SEUL exercice du programme dont le référentiel est intact (haltères en kg réels). Charge maintenue à 32 kg total (16/haltère). Superset supprimé : exercice isolé, repos plein. Coudes fixes, pas de balancier. Tempo 2-0-1, RIR 2-3.',
      },
      {
        id: 'pull-a-5',
        name: 'Tirage haltère sur banc',
        muscleGroup: 'DOS',
        sets: 3,
        targetReps: '10-12',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '28',
        notes: 'Charge désormais en KG RÉELS d\'haltère (les 85 étaient un repère machine). Départ 28 kg à calibrer — tu as jusqu\'à 40 kg. SANGLES OBLIGATOIRES : le biceps est déjà fatigué, les sangles remettent le grand dorsal en facteur limitant. Un genou et une main sur le banc, dos à plat, coude qui longe le flanc. Tempo 2-1-1, RIR 2-3. ⚠ Chute S1→S3 de -25 % dans l\'historique : à surveiller en priorité.',
      },
      {
        id: 'pull-a-6',
        name: 'Abduction hanche câble unilatéral',
        muscleGroup: 'FESSIERS',
        sets: 3,
        targetReps: '15-20 /jambe',
        restSeconds: 60,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ts-pull-a',
        supersetOrder: 1,
        defaultWeight: '5',
        notes: '⟳ 1ᵉʳ des trois — on enchaîne sans repos. Moyen fessier, le muscle de la largeur de hanche et le contrôleur du valgus, donc le premier à récupérer après un genou. Poulie basse + sangle de cheville. Buste stable, aucune rotation du bassin. Alternative sans câble : élastique ancré bas. Tempo 2-1-1.',
      },
      {
        id: 'pull-a-7',
        name: 'Squat bulgare unilatéral haltères',
        muscleGroup: 'QUADRICEPS',
        sets: 3,
        targetReps: '10-12 /jambe',
        restSeconds: 60,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ts-pull-a',
        supersetOrder: 1,
        defaultWeight: 'PDC',
        notes: '⟳ 2ᵉ des trois. Pied arrière sur le banc, torse légèrement penché en avant pour la dominante fessier et pour décharger le genou. Descente contrôlée 3 s, genou avant aligné sur le 2ᵉ orteil. Surcharge par haltères ou gilet UNIQUEMENT si le genou est totalement muet. Tempo 3-0-1.',
      },
      {
        id: 'pull-a-8',
        name: 'Crunch câble à genoux',
        muscleGroup: 'ABDOS',
        sets: 4,
        targetReps: '12-15',
        restSeconds: 60,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ts-pull-a',
        supersetOrder: 2,
        defaultWeight: '15',
        notes: '⟳ 3ᵉ et dernier des trois : c\'est ici que tu prends les 60 s avant le tour suivant. Poulie haute + corde. Enrouler la colonne vertèbre par vertèbre, hanches FIXES — si tu plies à la hanche c\'est le psoas qui travaille. Repos RÉEL par muscle = 60 s + les deux autres exercices, largement au-dessus du plancher de 120 s.',
      },
    ],
  },
  // ── PUSH A — Deltoïdes / Pecs / Triceps + Jambes ⟳ ──────────────────────────────────
  {
    id: 'push-a',
    dayNumber: 2,
    name: 'Push A',
    focus: 'Deltoïdes à froid, puis pecs et triceps en superset — jambes en tri-set de fin de séance. Zéro développé vertical',
    muscleGroups: 'Deltoïdes / Pecs / Triceps + Jambes ⟳',
    estimatedDuration: '≈ 61 min',
    exercises: [
      {
        id: 'push-a-1',
        name: 'Élévations latérales haltères',
        muscleGroup: 'DELTOÏDE LATÉRAL',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '20',
        notes: '★ PRIORITÉ 1, à froid. 16 kg → 21/17/15 en Sem 3, nettement au-dessus de la fourchette : charge montée à 20 kg total (10/haltère). Buste légèrement penché, pas d\'élan, coude légèrement plus haut que le poignet. Repos 120 s : sous ce seuil la resynthèse de la phosphocréatine est incomplète. Tempo 2-0-1, RIR 2-3.',
      },
      {
        id: 'push-a-2',
        name: 'Élévations frontales haltère/disque',
        muscleGroup: 'DELTOÏDE ANTÉRIEUR',
        sets: 3,
        targetReps: '10-12',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '20',
        notes: '16 kg → 15/16/15 en Sem 3, au-dessus de la fourchette : charge montée à 20 kg. Hauteur d\'yeux, dos plaqué, gainage abdominal actif — c\'est le verrou lombaire de cet exercice. Tempo 2-0-1, RIR 2-3.',
      },
      {
        id: 'push-a-3',
        name: 'Développé couché haltères',
        muscleGroup: 'PECS',
        sets: 3,
        targetReps: '8-12',
        restSeconds: 180,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '59',
        notes: 'Charge en KG RÉELS d\'haltères (50/77/80 = plaques de machine guidée). ⚠ V2.2 : recalé de 40 à 59 kg — tu as tenu 59 kg en 14/11/10 au Jour 4, la charge de 40 kg était largement sous-évaluée. Omoplates rétractées, léger étirement en bas sans forcer l\'épaule, pieds au sol, aucune cambrure lombaire recherchée. Tempo 3-0-1, RIR 2-3.',
      },
      {
        id: 'push-a-4',
        name: 'Écartés haltères banc incliné 30°',
        muscleGroup: 'PECS',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 90,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-push-a',
        supersetOrder: 1,
        defaultWeight: '24',
        notes: '⟳ 1ᵉʳ du superset — enchaîner avec le triceps. REMPLACE les écartés poulie vis-à-vis (un seul stack). Banc à 30° : reprend ton intention du « bas vers haut » pour le faisceau claviculaire. L\'haltère charge le pec au maximum en position ÉTIRÉE. Coudes semi-fléchis verrouillés, descente lente, pas de développé déguisé. Tempo 2-1-1, RIR 2-3.',
      },
      {
        id: 'push-a-5',
        name: 'Extension triceps corde poulie haute',
        muscleGroup: 'TRICEPS',
        sets: 3,
        targetReps: '10-12',
        restSeconds: 90,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-push-a',
        supersetOrder: 2,
        defaultWeight: '20',
        notes: '⟳ 2ᵉ du superset : repos réel 125 s (90 s affichées + la série des écartés). 15 kg → 15/15 en Sem 3, au-dessus de la fourchette : charge montée à 20 kg. Coudes collés au buste, écarter la corde en fin de course. Tempo 2-0-1, RIR 2-3.',
      },
      {
        id: 'push-a-6',
        name: 'Hip thrust unilatéral (banc, haltère)',
        muscleGroup: 'FESSIERS',
        sets: 4,
        targetReps: '12-15 /jambe',
        restSeconds: 60,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ts-push-a',
        supersetOrder: 1,
        defaultWeight: '12',
        notes: '⟳ 1ᵉʳ des trois. ★ Priorité 1 du bas du corps : le grand fessier ouvre le tri-set des deux séances PUSH. Haut du dos sur le banc, haltère sur le pli de la hanche, menton rentré. Poussée dans le TALON, rétroversion du bassin et pause 1 s en haut. Tempo 2-1-1.',
      },
      {
        id: 'push-a-7',
        name: 'Extensions mollets debout unilatéral',
        muscleGroup: 'MOLLETS',
        sets: 4,
        targetReps: '15-20 /jambe',
        restSeconds: 60,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ts-push-a',
        supersetOrder: 1,
        defaultWeight: 'PDC+10',
        notes: '⟳ 2ᵉ des trois. Gastrocnémiens, genou TENDU. Avant-pied sur une marche ou un disque, pause 1 s en étirement bas — l\'amplitude complète en position allongée est ce qui différencie cet exercice. Haltère dans la main du côté travaillé, ou gilet lesté. Tempo 2-2-1.',
      },
      {
        id: 'push-a-8',
        name: 'Reverse crunch (enroulement bassin)',
        muscleGroup: 'ABDOS',
        sets: 4,
        targetReps: '12-15',
        restSeconds: 60,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ts-push-a',
        supersetOrder: 2,
        defaultWeight: 'PDC',
        notes: '⟳ 3ᵉ et dernier des trois : les 60 s se prennent ici avant le tour suivant. Enrouler le bassin vers le sternum, sans élan des jambes. Tempo 2-1-1.',
      },
    ],
  },
  // ── PULL B — Deltoïdes / Biceps / Dos + Jambes ⟳ ──────────────────────────────────
  {
    id: 'pull-b',
    dayNumber: 3,
    name: 'Pull B',
    focus: 'Deux vecteurs de deltoïde postérieur à froid, biceps en position étirée puis dos — jambes en tri-set de fin de séance',
    muscleGroups: 'Deltoïdes / Biceps / Dos + Jambes ⟳',
    estimatedDuration: '≈ 66 min',
    exercises: [
      {
        id: 'pull-b-1',
        name: 'Oiseau haltères buste penché',
        muscleGroup: 'DELTOÏDE POSTÉRIEUR',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '16',
        notes: '★ PRIORITÉ 1, à froid. 14 kg → 17/16/14 en Sem 3, au-dessus de la fourchette : charge montée à 16 kg. Buste ~45°, pouces vers le bas, coudes hauts. Version debout ici, version poitrine appuyée au Jour 1 : tu as les deux profils dans la semaine. Gainage lombaire actif pendant toute la série. Tempo 2-1-1, RIR 2-3.',
      },
      {
        id: 'pull-b-2',
        name: 'Face pull poulie haute (corde)',
        muscleGroup: 'DELTOÏDE POSTÉRIEUR',
        sets: 3,
        targetReps: '15-20',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '15',
        notes: 'Ajout V1.4 — prend la place du pullover. Corde à hauteur de visage, tirer vers le front en écartant, coudes HAUTS, rotation externe en fin de course. Deuxième vecteur sur le deltoïde postérieur : l\'oiseau travaille l\'abduction horizontale pure, le face pull y ajoute la rotation externe et les trapèzes moyens. Meilleur contrepoids aux 12 séries de poussée hebdo et à la gêne d\'épaule signalée sur le Reverse Peck Deck. Charge légère, jamais d\'à-coups. Tempo 2-1-1, RIR 2-3.',
      },
      {
        id: 'pull-b-3',
        name: 'Curl incliné haltères (banc 45°)',
        muscleGroup: 'BICEPS',
        sets: 3,
        targetReps: '10-12',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '20',
        notes: '★ PRIORITÉ 2. Placé AVANT les tractions : c\'est l\'exercice à position étirée maximale du chef long, son rendement dépend d\'un biceps frais. Bras ballants derrière le plan du corps = étirement max. ⚠ V2.2 : charge à 20 kg pour départager charge et décrochage de série 3 (le verdict de fatigue précédent était faussé, la série 1 sortait de la fourchette). Tempo 3-0-1, RIR 2-3.',
      },
      {
        id: 'pull-b-4',
        name: 'Tractions supination lestées (barre)',
        muscleGroup: 'DOS',
        sets: 3,
        targetReps: '6-10',
        restSeconds: 180,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC+10',
        notes: 'Ta Sem 3 était déjà au poids du corps chez toi : 12/11/8, AU-DESSUS de la fourchette 6-10 → il faut lester. Départ Sem 4 = PDC + gilet 10 kg (le maximum de ton gilet). Poitrine vers la barre, descente complète. En supination le biceps brachial travaille dur juste après le curl incliné : surveille le coude. Tempo 3-0-1, RIR 2-3.',
      },
      {
        id: 'pull-b-5',
        name: 'Curl inversé barre EZ (avant-bras)',
        muscleGroup: 'AVANT-BRAS / BRACHIAL',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '12',
        notes: '10 kg → 15/15/13 en Sem 3, haut de fourchette : charge montée à 12 kg. V2.1 — CHARGE = DISQUES AJOUTÉS, barre non comptée (convention alignée sur le triceps EZ du Jour 4, à ta demande). Placé après les tractions : la prise est un facteur limitant, on ne la fatigue pas avant. Pronation, poignets verrouillés en légère extension. Tempo 2-0-1, RIR 2-3.',
      },
      {
        id: 'pull-b-6',
        name: 'Hip thrust unilatéral (banc, haltère)',
        muscleGroup: 'FESSIERS',
        sets: 3,
        targetReps: '12-15 /jambe',
        restSeconds: 60,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ts-pull-b',
        supersetOrder: 1,
        defaultWeight: '12',
        notes: '⟳ 1ᵉʳ des trois. Deuxième dose de grand fessier de la rotation. Même exécution qu\'au Jour 2 : talon, rétroversion, pause 1 s. 3 séries ici contre 4 au Jour 2, ce qui porte le total fessiers à 10 séries par rotation. Tempo 2-1-1.',
      },
      {
        id: 'pull-b-7',
        name: 'Extensions mollets assis unilatéral (haltère)',
        muscleGroup: 'MOLLETS',
        sets: 4,
        targetReps: '15-20 /jambe',
        restSeconds: 60,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ts-pull-b',
        supersetOrder: 1,
        defaultWeight: '20',
        notes: '⟳ 2ᵉ des trois. Soléaire, genou FLÉCHI à 90° — l\'autre moitié du mollet, celle que la version debout ne touche pas. Haltère posé verticalement sur le genou, avant-pied sur un disque. Plafond à 40 kg : au-delà, intensifier par la pause de 3 s en étirement bas plutôt que par la charge. Tempo 2-2-1.',
      },
      {
        id: 'pull-b-8',
        name: 'Gainage latéral (oblique)',
        muscleGroup: 'ABDOS',
        sets: 3,
        targetReps: 'Max sec /côté',
        restSeconds: 60,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ts-pull-b',
        supersetOrder: 2,
        defaultWeight: 'PDC',
        notes: '⟳ 3ᵉ et dernier des trois : les 60 s se prennent ici. Anti-inclinaison : obliques et carré des lombes, le troisième pilier de la protection lombaire avec l\'anti-extension (hollow) et l\'anti-rotation (Pallof). Bassin haut, alignement épaule-hanche-cheville. +5 s dès que le temps cible est tenu proprement.',
      },
    ],
  },
  // ── PUSH B — Deltoïdes / Pecs / Triceps + Jambes ⟳ ──────────────────────────────────
  {
    id: 'push-b',
    dayNumber: 4,
    name: 'Push B',
    focus: 'Six séries de deltoïde latéral à froid, pecs, puis dips isolés en fin — jambes en tri-set de fin de séance',
    muscleGroups: 'Deltoïdes / Pecs / Triceps + Jambes ⟳',
    estimatedDuration: '≈ 69 min',
    exercises: [
      {
        id: 'push-b-1',
        name: 'Élévations latérales poulie basse unilatéral',
        muscleGroup: 'DELTOÏDE LATÉRAL',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '7',
        notes: '★ PRIORITÉ 1, à froid. Unilatéral imposé par le stack unique — et c\'est la meilleure version : le câble maintient la tension en position basse, là où l\'haltère est à zéro. Câble qui passe derrière le dos, main libre en appui. Sem 4 à 5 kg → 18/18/15, au-dessus de la fourchette : charge Sem 5 montée à 7 kg. Repos 120 s : à 75 s tu perdais 40 % de tes reps. Tempo 2-0-1, RIR 1-2 en Sem 5.',
      },
      {
        id: 'push-b-2',
        name: 'Élévations latérales haltères assis (dos calé)',
        muscleGroup: 'DELTOÏDE LATÉRAL',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '16',
        notes: 'REMPLACE les élévations frontales. Banc à 90°, dos plaqué : plus de jambes, plus de balancier, plus de compensation lombaire — le deltoïde latéral devient le seul moteur. Troisième profil de résistance du latéral dans la semaine, après le câble (tension en bas) et l\'haltère debout (pic à l\'horizontale). Sem 4 à 14 kg → 15/15/15 : charge Sem 5 montée à 16 kg. Tempo 2-0-1.',
      },
      {
        id: 'push-b-3',
        name: 'Développé couché haltères',
        muscleGroup: 'PECS',
        sets: 3,
        targetReps: '8-12',
        restSeconds: 180,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '62',
        notes: '⚠ V2.2 : Sem 4 tenue à 59 kg en 14/11/10 — la série 1 sortait de la fourchette par le haut, donc l\'écart mesurait la CHARGE et pas la fatigue. Bonne action : charger. Sem 5 à 62 kg (+5 %), série 1 attendue à 11-12 au RIR 1-2. Omoplates rétractées, léger étirement en bas, pieds au sol. Option si l\'épaule antérieure tire : prise neutre (marteau), même charge. Tempo 3-0-1.',
      },
      {
        id: 'push-b-4',
        name: 'Écartés haltères banc à plat',
        muscleGroup: 'PECS',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 90,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-push-b',
        supersetOrder: 1,
        defaultWeight: '26',
        notes: '⟳ 1ᵉʳ du superset — enchaîner avec l\'extension triceps EZ. Banc À PLAT ici, contre 30° au Jour 2 : c\'est cette différence d\'angle qui porte la variation haut / milieu de pec entre les deux séances Push. Coudes semi-fléchis verrouillés, descente lente jusqu\'à l\'étirement, remontée sans verrouiller. Sem 4 : 26 kg → 13/14/12, calibrage propre, on garde. Tempo 2-1-1.',
      },
      {
        id: 'push-b-5',
        name: 'Extension triceps barre EZ couché (barre derrière la tête)',
        muscleGroup: 'TRICEPS',
        sets: 3,
        targetReps: '15-20',
        restSeconds: 90,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ss-push-b',
        supersetOrder: 2,
        defaultWeight: '10',
        notes: '⟳ 2ᵉ du superset. V2.1 — fourchette passée à 15-20 reps sur ta demande : tes 17/16/17 tombent en plein dedans. Allongé sur le banc à plat, barre EZ descendue DERRIÈRE la tête et non sur le front : c\'est ce qui met le chef long en étirement maximal. Coudes pointés vers le haut, ils ne s\'écartent pas. CHARGE = DISQUES AJOUTÉS, barre non comptée (ta convention). Tempo 3-0-1.',
      },
      {
        id: 'push-b-6',
        name: 'Dips (station)',
        muscleGroup: 'TRICEPS',
        sets: 3,
        targetReps: 'AMRAP (obj. ≥ 15-18)',
        restSeconds: 150,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC',
        notes: 'V2.1 — SORTIS DU SUPERSET et déplacés en toute fin de haut du corps, avec 150 s de repos plein : ils n\'arrivent plus juste après le développé couché. Sem 4 : 12/10/11 contre 20/17/15 en Sem 2, c\'était un défaut de programmation, pas de forme. Buste vertical et coudes serrés pour la dominante triceps ; buste penché en avant pour basculer sur le bas du pec. ⚠ PAS DE LEST tant que la série 1 n\'est pas revenue à 15 reps. Objectif Sem 5 : 15/13/13 au poids du corps.',
      },
      {
        id: 'push-b-7',
        name: 'Stiff leg deadlift unilatéral haltère',
        muscleGroup: 'ISCHIOS',
        sets: 3,
        targetReps: '10-12 /jambe',
        restSeconds: 60,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ts-push-b',
        supersetOrder: 1,
        defaultWeight: '13',
        notes: '⟳ 1ᵉʳ des trois. REMPLACE le soulevé de terre roumain unilatéral, à ta demande. Jambe d\'appui quasi TENDUE : l\'étirement des ischio-jambiers est plus profond, et c\'est là que se joue l\'essentiel du stimulus. Jambe libre en prolongement exact du tronc, hanche qui recule, dos NEUTRE gainé du début à la fin. Charge de contrôle, on ne cherche pas lourd. ⚠ La série se termine dès que le bas du dos s\'arrondit, pas quand les ischios lâchent. Tempo 3-1-1.',
      },
      {
        id: 'push-b-8',
        name: 'Fente avant grand pas (unilat.)',
        muscleGroup: 'QUADRICEPS',
        sets: 3,
        targetReps: '10-12 /jambe',
        restSeconds: 60,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ts-push-b',
        supersetOrder: 1,
        defaultWeight: 'PDC',
        notes: '⟳ 2ᵉ des trois. Grand pas = dominante fessier, genou avant qui ne dépasse pas la pointe de pied, donc contrainte fémoro-patellaire minimale. Antagoniste du stiff leg qui précède : les deux s\'enchaînent sans se gêner. Surcharge au gilet lesté d\'abord (charge axiale centrée), haltères ensuite. Tempo 3-0-1.',
      },
      {
        id: 'push-b-9',
        name: 'Hollow body hold',
        muscleGroup: 'ABDOS',
        sets: 3,
        targetReps: 'Max sec',
        restSeconds: 60,
        restMode: 'superset',
        isSuperset: true,
        supersetGroupId: 'ts-push-b',
        supersetOrder: 2,
        defaultWeight: 'PDC',
        notes: '⟳ 3ᵉ et dernier des trois : les 60 s se prennent ici. Anti-extension : c\'est l\'exercice qui protège directement ton bas du dos sous charge, et le complément logique du stiff leg qui ouvre ce tri-set. Bas du dos PLAQUÉ au sol, obligatoire — dès qu\'il décolle, la série est terminée. +5 s si le temps cible est tenu proprement.',
      },
    ],
  },
];

// Toutes les séances de tous les programmes intégrés (Strict V2.2 + les
// programmes additionnels de extraPrograms.ts) — sert uniquement à la
// recherche par id ci-dessous, pour que l'historique/les écrans puissent
// toujours retrouver une séance même si le programme actif a changé
// depuis (voir workoutStore.ts → activeProgramId). LEGACY_LEGS_WORKOUTS y
// figure pour que les anciennes séances Legs A/B enregistrées avant le
// 19/08/2026 restent lisibles dans l'historique.
const ALL_KNOWN_WORKOUTS: WorkoutDay[] = [
  ...WORKOUTS,
  ...LEGACY_LEGS_WORKOUTS,
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
// Séance de la SESSION EN COURS quand elle a été adaptée avant de démarrer
// (« j'ai 35 minutes », « pas en forme », « salle inconnue » — voir
// utils/gymAdapt.ts). C'est une surcouche volontairement placée ici plutôt
// que dans chaque écran : getWorkout() est appelé depuis une quinzaine
// d'endroits (séance, stats, image de partage, historique...) et ils doivent
// TOUS voir la séance réellement faite, pas celle du programme. Vidée dès que
// la séance est terminée ou abandonnée (workoutStore.ts).
let SESSION_WORKOUT_OVERRIDE: WorkoutDay | null = null;
export const setSessionWorkoutOverride = (workout: WorkoutDay | null) => {
  SESSION_WORKOUT_OVERRIDE = workout;
};
export const getSessionWorkoutOverride = (): WorkoutDay | null => SESSION_WORKOUT_OVERRIDE;

/** Séance telle qu'elle est écrite dans le programme, sans adaptation. */
export const getBaseWorkout = (id: string): WorkoutDay | undefined =>
  ALL_KNOWN_WORKOUTS.find((w) => w.id === id) ?? CUSTOM_WORKOUTS.find((w) => w.id === id);

export const getWorkout = (id: string): WorkoutDay | undefined =>
  (SESSION_WORKOUT_OVERRIDE && SESSION_WORKOUT_OVERRIDE.id === id ? SESSION_WORKOUT_OVERRIDE : undefined)
  ?? getBaseWorkout(id);
