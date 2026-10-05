import { WorkoutDay, ProgressionWeek } from './types';
import { PPL_DEBUTANT_WORKOUTS, FULL_BODY_WORKOUTS, FORCE_5X5_WORKOUTS, WRIST_CONSOLIDATION_WORKOUTS } from './extraPrograms';
import { LEGACY_LEGS_WORKOUTS, LEGACY_LEGS_V3_WORKOUTS } from './legacyWorkouts';

// ─── Mésocycle Phase 1 — Sèche (31/07 → 16/10/2026) ─────────────────────────
// 11 semaines, deload + diet break en semaine 6. Sem 7-11 repris de l'onglet
// « Récap + Progression » du fichier V3.0 (30/08/2026) : le bloc unique
// « Sem 7-10 » de la V2.5 est éclaté en Reprise (S7-S8) / Charge (S9-S10)
// pour coller au RIR réellement prescrit par type de mouvement. Les chiffres
// Sem 9-11 ci-dessous ont été reconstruits le 16/09/2026 depuis le fichier
// V4.0 (les projections V3.0 correspondantes, caduques, sont remplacées), puis
// mis à jour le 05/10/2026 vers la V4.2 (V4.1 du 29/09 : plus de latéral ;
// V4.2 du 30/09 : règle de double progression, un cran à la fois).
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
    label: 'Sem. 7-8',
    phase: 'Reprise + pause épaule (V3.2)',
    rir: 'RIR 2-3 (haut) · douleur <3/10 (genou)',
    objective: "Douleur deltoïde antérieur + latéral en fin de Sem 6 (postérieur indemne) → 2 semaines sans travail direct de ces faisceaux : pecs 100 % poids du corps, dos en tractions seules. MàJ 13/09 : latéral réintégré dès Sem 8, en haltères légers (antérieur reste à 0 série). Legs A/B : sur demande d'Antoine, rééducation genou PURE (mobilité/activation/geste cible) — plus aucun rapport avec le cycle Reprise→Charge→Pic ni avec le RIR, seul le seuil de douleur <3/10 encadre chaque série.",
  },
  {
    label: 'Sem. 9',
    phase: 'CHARGE 1 (V4.2) — 25/09→01/10',
    rir: 'RIR 2 poly · 1-2 isolations épaules/pecs · 1 isolations bras',
    objective: "Épaule déclarée MUETTE le 14/09 (condition d'entrée V3.1 remplie) : retour à la charge pleine sur le postérieur, réintégration du latéral en 3 doses/semaine et réintroduction prudente de l'antérieur (développé-écarté, élévations frontales en toute fin de séance, RIR haut). Recalibrage des charges après 4 semaines de pause/reprise — semaine de test, pas de charge maximale. Contrainte matérielle actée : poids du corps en priorité, haltères plafonnées à 25 kg/pièce ; le volume (4 séries sur les exercices prioritaires à faible coût de fatigue) remplace la charge comme variable de progression. Genou : rééducation pure reconduite à l'identique, aucun calendrier, seul le seuil de douleur <3/10 encadre chaque série.",
  },
  {
    label: 'Sem. 10',
    phase: 'CHARGE 2 (V4.2) — 02/10→08/10',
    rir: 'RIR 1-2 poly · 1 isolations épaules/pecs · 0-1 isolations bras',
    objective: "Pic de volume. V4.2 (30/09) : double progression — une charge n'est validée que si CHAQUE série atteint ses reps cibles ; validée → +1 cran (3 kg la paire d'haltères, 1 cran de pile, 5 kg de gilet), jamais 2 ; non validée → même charge, +1 rep sur les séries manquées. Face pull : passage à hauteur de visage (contre hauteur de poitrine en Sem 9) si la Sem 9 est indolore. Push B : pompes prise large et élévations frontales retirées, remplacées par des élévations latérales à la poulie basse (V4.1, 29/09). Genou : identique à Sem 9, aucun changement tant que le seuil de douleur n'est pas franchi.",
  },
  {
    label: 'Sem. 11',
    phase: 'PIC — fin de sèche (V4.2) — 09/10→16/10',
    rir: 'RIR 1 poly · 0-1 isolations épaules/pecs · 0 isolations bras',
    objective: "Dernière semaine avant la Phase 2 — Maintenance (17/10). Techniques d'intensification concentrées ici uniquement (partiels en position étirée en premier choix, drop set sur le triceps) — aucune sur les tractions, les dips ni le bas du corps. Le pic se fait par le RIR 0 et la dernière série, plus par un saut de charge décidé d'avance (V4.2). Nouveautés V4.1 : élévations latérales debout ajoutées au Pull A (3 séries) et 5ᵉ série au Push A — le latéral devient le premier muscle du programme (18 séries/rotation). Fourchettes de reps resserrées. Genou : toujours piloté par le seuil de douleur, sans lien avec ce calendrier — deux séances consécutives indolores ouvriraient l'étape 2 du protocole (non déclenchée au 14/09).",
  },
];

// Semaine du mésocycle (1-11) → index de phase dans PROGRESSION_WEEKS.
const WEEK_TO_PHASE_INDEX = [0, 0, 0, 1, 2, 3, 4, 4, 5, 6, 7];

/** Phase du mésocycle correspondant à la semaine donnée (bornée 1 → 11). */
export const getProgressionWeek = (week: number): ProgressionWeek => {
  const w = Math.min(MESOCYCLE_WEEKS, Math.max(1, Math.round(week)));
  return PROGRESSION_WEEKS[WEEK_TO_PHASE_INDEX[w - 1]];
};

// ─── Les 6 séances PPL Strict V4.2 ──────────────────────────────────────────
// Programme actif de l'appli. V4.0 intégrée le 16/09/2026 (fichier
// « programme_hypertrophie_PPL_Strict_Phase1_V4.0_S9-S11.xlsx »), puis mise à
// jour le 05/10/2026 vers « …_V4.2_S9-S11.xlsx » :
//  · V4.1 (29/09) — le latéral repasse en tête : élévations latérales debout
//    ajoutées au Pull A (Sem 11), 5ᵉ série au Push A (Sem 11) ; Push B : pompes
//    prise large et élévations frontales RETIRÉES, élévations latérales poulie
//    basse ajoutées ; extension triceps barre en pronation ; recalage de
//    charges d'élévations latérales ; durées recalculées échauffements compris.
//  · V4.2 (30/09) — double progression : plus de saut de charge écrit
//    d'avance, un cran à la fois et seulement si TOUTES les séries atteignent
//    leurs reps. Les charges Sem 10-11 ont été recalculées sur les reps réelles.
//  Les defaultWeight ci-dessous sont les charges de la SEM 11 (prochaine
//  semaine à faire au 05/10), telles que calculées dans le fichier V4.2.
// Couvre Sem 9-11, fin de Phase 1 — Sèche (25/09 → 16/10/2026).
//
// CE QUI DÉCLENCHE CETTE VERSION (14/09/2026, trois consignes d'Antoine) :
//
//  1) ÉPAULE DÉCLARÉE MUETTE — aucune douleur au repos, en séance ni le
//     lendemain sur les Sem 7-8. C'est la condition d'entrée non négociable
//     posée par la V3.1 : elle est remplie, le protocole de retour à la
//     charge s'applique intégralement. Les épaules repassent PRIORITÉ 1
//     (25 séries/semaine contre 12 en V3.2) : le postérieur revient à charge
//     pleine, le latéral gagne une 3ᵉ dose hebdomadaire (6→11 séries), et
//     l'ANTÉRIEUR est réintroduit pour la première fois depuis le 10/09 — par
//     le développé-écarté haltères (Push A, priorité 3 pecs) puis par les
//     élévations frontales en toute fin de séance (Push B, RIR volontairement
//     haut). Quatre points de vigilance explicites dans les notes ci-dessous ;
//     au moindre signal douloureux, l'exercice concerné sort et redevient 0
//     série — protocole détaillé dans l'onglet Excel « Conseils — Épaule ».
//
//  2) CONTRAINTE MATÉRIELLE ASSUMÉE — poids du corps en priorité (tractions,
//     dips, pompes) et haltères plafonnées à 25 kg/pièce (50 kg bilatéral) :
//     le développé couché haltères (68 kg) et les écartés ne reviennent pas,
//     remplacés par le développé-écarté (hybride, ≤ 38 kg) et les pompes
//     lestées (gilet 10 kg ≈ 58 kg effectifs). Comme la charge absolue baisse
//     structurellement, le VOLUME devient la variable de progression : 4
//     séries (contre 3) sur les exercices prioritaires à faible coût de
//     fatigue, 3 séries conservées sur les tractions/dips/pompes non lestées
//     dont le coût articulaire est déjà maximal. 80 → 93 séries par rotation,
//     chaque séance reste sous 60 min. Rationnement détaillé (quels exercices
//     passent à 4 séries et pourquoi) dans l'onglet Excel « Récap +
//     Progression ».
//
//  3) GENOU — reconduit À L'IDENTIQUE de la V3.2 sur les trois semaines
//     (« un peu mieux, je continue ») : Legs A et Legs B ne changent pas d'un
//     exercice, d'une charge ni d'une série. L'étape 2 du protocole (travail
//     fonctionnel léger) n'est toujours pas déclenchée — fessiers, mollets,
//     quadriceps et ischios restent à 0 série hypertrophie. Aucun rapport de
//     calendrier avec les deux points ci-dessus (haut du corps vs bas du
//     corps) ; seul le seuil de douleur <3/10 encadre chaque série.
//
// IDS DE SÉANCE : 'pull-a'/'push-a'/'pull-b'/'push-b' restent en place (même
// jour, contenu mis à jour — convention établie depuis la V2.2). Les séances
// Legs ne changent pas de génération (toujours 'legs-a-rehab'/'legs-b-rehab',
// contenu inchangé depuis la V3.2) : voir legacyWorkouts.ts pour les
// générations antérieures ('legs-a'/'legs-b' pré-19/08, 'legs-a-v3'/
// 'legs-b-v3' V3.0 tri-sets hypertrophie).
//
// defaultWeight = charge Sem 9 (première semaine couverte par ce fichier,
// qui démarre le 25/09/2026 — rien n'est encore exécuté à l'intégration de
// ce fichier le 16/09/2026) ; la progression complète Sem 9→10→11 et le
// raisonnement sont dans notes, comme pour les versions précédentes.
export const WORKOUTS: WorkoutDay[] = [
  // ── PULL A — Deltoïde postérieur / Biceps / Dos (épaules priorité 1) ─────
  {
    id: 'pull-a',
    dayNumber: 1,
    name: 'Pull A',
    focus: "Épaules priorité 1 (postérieur à charge pleine), biceps priorité 2, dos en tractions placées tôt (biceps frais). Jambes en rééducation genou juste après. V4.1 : + élévations latérales debout dès la Sem 11 (V4.2, Sem 9-11)",
    muscleGroups: 'Deltoïde postérieur / Latéral / Biceps / Dos',
    estimatedDuration: '≈ 66 min',
    exercises: [
      {
        id: 'pull-a-5',
        name: 'Oiseau haltères poitrine appuyée (banc 30°)',
        muscleGroup: 'DELTOÏDE POSTÉRIEUR',
        sets: 4,
        targetReps: '12-15 · S11 : 10-12',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '23',
        essential: true,
        notes: "★ Priorité 1 avec le latéral : retour à charge pleine, le deltoïde postérieur n'a jamais été douloureux. Passe à 4 séries (exercice ouvrant de la rotation). Charge remontée de 14 → 20 kg (Sem 9) → 23 kg (Sem 10-11), niveau V3.0 d'avant la pause. Poitrine calée sur le dossier à 30° : zéro élan. Vigilance : ne pas laisser l'humérus monter au-dessus du plan des épaules en fin de course, ce qui basculerait le travail sur le latéral. S11 : partiels en position étirée sur la dernière série (5 reps sur le tiers bas après l'échec). Sem 9 : 20 kg, RIR 1-2. Tempo 2-1-1. V4.2 (30/09) : Sem 9 validée (17/16/14/12 pour 15/14/13/12 au RIR prescrit) → 23 kg en Sem 11 confirmé. Si la série 1 sort au-dessus de 15 en Sem 9, le fichier dit de monter sans attendre ; ici la charge de travail à saisir est 23 kg.",
      },
      {
        id: 'pull-a-9',
        name: 'Élévations latérales haltères debout',
        muscleGroup: 'DELTOÏDE LATÉRAL',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '20',
        essential: false,
        notes: "NOUVEAU en V4.1 (29/09/2026), à partir de la SEM 11 seulement (la Sem 10 du Pull A a été faite à Los Angeles). 4ᵉ dose de latéral de la rotation, placée juste après l'oiseau pour respecter la priorité 1 : muscle par muscle, le latéral était dernier du haut du corps en volume effectif alors qu'il porte ta priorité 1. Haltères plutôt que poulie (la poulie unilatérale coûte 10 min contre 8 et aurait porté le Pull A à 69-72 min). Sem 11 : 20 kg en 12-15, RIR 0-1, partiels sur la moitié basse d'amplitude après l'échec sur la dernière série. Si la série 1 dépasse 15 répétitions : +3 kg dès la séance suivante. ★ Dose ajoutée en V4.1 : c'est la PREMIÈRE à sortir si l'épaule parle. Mains jamais au-dessus du plan des épaules, pouce légèrement plus haut que l'auriculaire. Tempo 2-1-1.",
      },
      {
        id: 'pull-a-1',
        name: 'Tractions pronation lestées (barre) prise large',
        muscleGroup: 'DOS',
        sets: 3,
        targetReps: '6-10',
        restSeconds: 180,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC+5',
        essential: true,
        notes: "Priorité 4 mais placé tôt : le biceps doit être frais. Reste à 3 séries — coût de fatigue le plus élevé du programme, gilet plein (PDC+10, plus aucune marge de lestage). La progression passe par les reps puis par le tempo excentrique en S11 (3-0-1 → 5-0-1), pas par la charge. Objectif de fin de phase : 3×10 propres en pronation large à PDC+10. Épaule muette : aucune restriction, mais garde l'amorce scapulaire avant de tirer plutôt que la suspension passive. Sem 9-10 : PDC+10, RIR 2. Tempo 3-0-1 (S11 : 5-0-1). V4.2 (30/09) : Sem 9 (11/10/8 pour 10/9/8) validée → en Sem 11 le lest monte d'UN cran seulement : PDC+5 (pas PDC+10, deux crans d'un coup après une Sem 10 sautée). Tempo 3-0-1 maintenu : le 5 s excentrique est abandonné pour ne faire bouger qu'une variable.",
      },
      {
        id: 'pull-a-2',
        name: 'Curl marteau haltères',
        muscleGroup: 'BICEPS',
        sets: 4,
        targetReps: '12-15 · S11 : 10-12',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '32',
        essential: true,
        notes: "★ Priorité 2. Passe à 4 séries. Charge remontée par paliers de 3 kg depuis les 28 kg de la pause jusqu'aux 38 kg de la V3.0 : Sem 9 = 32 kg, Sem 10 = 35 kg, Sem 11 = 38 kg (19 kg/haltère, sous le plafond de 25 kg). Coude au corps, humérus vertical : le deltoïde antérieur n'intervient pas, exercice de bras le plus neutre pour l'épaule. S11 : partiels en position étirée sur la dernière série. Sem 9 : 32 kg, RIR 1. Tempo 2-0-1. V4.2 (30/09) : Sem 9 NON validée (11/12/11/10 pour 15/14/13/12) → en Sem 11 on RESTE à 32 kg (et non 38). Objectif : +1 rep par série, soit 12/13/12/11 au RIR 0 + partiels étirés sur la dernière série.",
      },
      {
        id: 'pull-a-3',
        name: 'Curl inversé barre EZ (avant-bras)',
        muscleGroup: 'AVANT-BRAS / BRACHIAL',
        sets: 3,
        targetReps: "15-20 · S11 : 16-20",
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '10',
        essential: false,
        notes: "Reste à 3 séries : l'avant-bras encaisse déjà les 12 séries de traction de la rotation. Charge = disques ajoutés, barre non comptée (barre EZ = 8 kg à vide). Sem 9 : 14 kg, Sem 10 : 16 kg, Sem 11 : 18 kg. Repère V3.0 : 15-17 kg en 12-15. Même position d'épaule que le curl marteau, humérus vertical et immobile : aucun risque attendu. Sem 9 : RIR 1. Tempo 2-0-1. V4.2 (30/09) : Sem 9 à 10 kg de disques → 20/15/15 pour 20/19/18, non validée → en Sem 11 on RESTE à 10 kg (et non 18). Objectif 20/16/16 au RIR 0.",
      },
      {
        id: 'pull-a-4',
        name: 'Tractions prise serrée pronation (mains largeur épaules)',
        muscleGroup: 'DOS — FINITION',
        sets: 3,
        targetReps: 'AMRAP (obj. ≥ 8)',
        restSeconds: 150,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC',
        essential: false,
        notes: "Conservé de la V3.1. Prise serrée = plus de brachial et de dorsal bas, moins de contrainte antérieure que la prise large ; placé après le biceps volontairement, c'est l'exercice de dos qu'on accepte de faire sur un fléchisseur du coude déjà chargé. AMRAP, note le nombre réel : objectif ≥ 8 (S9), ≥ 9 (S10), ≥ 10 (S11), chute S1→S3 tolérée jusqu'à 20 %. Si tu dépasses 12 reps sur les 3 séries, passe le gilet plutôt que d'allonger la série. Tempo 3-0-1. RIR 2.",
      },
    ],
  },
  // ── PUSH A — Deltoïde latéral / Pecs / Triceps ───────────────────────────
  {
    id: 'push-a',
    dayNumber: 2,
    name: 'Push A',
    focus: "Deltoïde latéral priorité 1, pecs en développé-écarté + dips + pompes (1ʳᵉ charge directe de l'antérieur depuis le 10/09), triceps en fin de séance. Jambes en rééducation genou juste après (V4.0, Sem 9-11)",
    muscleGroups: 'Deltoïde latéral / Pecs / Triceps',
    estimatedDuration: '≈ 63 min',
    exercises: [
      {
        id: 'push-a-6',
        name: 'Élévations latérales haltères (debout)',
        muscleGroup: 'DELTOÏDE LATÉRAL',
        sets: 5,
        targetReps: '15-20 (S9) · 12-15 (S10-11)',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '20',
        essential: true,
        notes: "★ Priorité 1. Dose principale du latéral, passe à 4 séries, en ouverture de séance. Charge remontée depuis les 14 kg de la reprise vers les 23 kg de la V3.0 : Sem 9 = 17 kg, Sem 10 = 20 kg, Sem 11 = 23 kg. Debout : léger élan toléré en fin de série (contrairement à la version assise du Jour 5). ★ Point de vigilance n°1 de la reprise : ne monte pas les mains au-dessus du plan des épaules et garde le pouce légèrement plus haut que l'auriculaire (rotation externe) — c'est l'abduction + rotation interne au-delà de 90° qui referme l'espace sous-acromial. S11 : partiels sur la moitié basse d'amplitude après l'échec. Sem 9 : 17 kg, RIR 1-2. Tempo 2-1-1. V4.1 : 5 séries en Sem 11 (4 en Sem 9-10) — le latéral passe de 11 à 18 séries par rotation ; la 5ᵉ série est la 2ᵉ à sortir si l'épaule parle. V4.2 (30/09) : la Sem 10 à Los Angeles (40 lbs ≈ 18,1 kg → 23/19/16/17 pour un plafond à 15) valide la charge → +1 cran = 20 kg en Sem 11, PAS 23 kg (2 crans d'un coup, +27 %).",
      },
      {
        id: 'push-a-7',
        name: 'Développé-écarté haltères (fly press), banc plat',
        muscleGroup: 'PECS',
        sets: 4,
        targetReps: '10-12 · S11 : 8-10',
        restSeconds: 150,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '44',
        essential: true,
        notes: "★ Priorité 3, NOUVEAU en V4.0 — exercice demandé par toi. Hybride développé/écarté (coudes semi-fléchis, arc de cercle) : conserve la tension du pec en position allongée sans imposer au deltoïde antérieur l'étirement bras ouverts de l'écarté strict, qui lui reste dehors. Remplace à la fois le développé couché haltères (hors plafond 25 kg/haltère) et les écartés. ★ Point de vigilance n°2 : 1ʳᵉ charge directe du deltoïde antérieur depuis le 10/09 — série 1 de Sem 9 prudente, tu arrêtes si ça parle. En bas, les coudes ne descendent pas sous le plan du tronc. Douleur > 3/10 ou gêne le lendemain → l'exercice sort. Sem 9 : 35 kg (17,5 kg/haltère). Sem 10-11 : 38 kg. Plafond 25 kg/haltère = 50 kg total. RIR 1-2. Tempo 3-1-1. V4.2 (30/09) : Sem 10 (90 lbs ≈ 40,8 kg → 17/15/13/14) validée largement → 44 kg en Sem 11 (1 cran au-dessus de 41 ; la V4.1 prévoyait 38 kg, soit une baisse : corrigé). Plafond de 50 kg respecté.",
      },
      {
        id: 'push-a-2',
        name: 'Dips (station)',
        muscleGroup: 'PECS',
        sets: 3,
        targetReps: 'AMRAP (obj. ≥ 12)',
        restSeconds: 150,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC+5',
        essential: true,
        notes: "Conservé en amplitude complète sur ta décision assumée (aucune intensification sur les dips depuis la V2.3). Reste à 3 séries : mouvement de poussée au coût articulaire le plus élevé du programme. AMRAP, objectif ≥ 12/série ; repère Sem 7 (V3.2) : 17/14/13. Passage au gilet 10 kg dès Sem 10 si 3×15 tenus en Sem 9. En bas du dip, l'humérus part en extension derrière le tronc — position la plus exposante pour le deltoïde antérieur ; épaule muette donc aucune restriction, mais c'est le premier exercice à sortir si quoi que ce soit revient. Sem 9 : PDC, RIR 2. V4.2 (30/09) : Sem 10 en PDC → 18/17/15, validée → Sem 11 : PDC+5 (1 cran de gilet), pas PDC+10.",
      },
      {
        id: 'push-a-4',
        name: 'Pompes sur poignées / haltères (amplitude complète)',
        muscleGroup: 'PECS',
        sets: 3,
        targetReps: '12-20 (S9) · 12-15 (S10-11)',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC+5',
        essential: false,
        notes: "Conservé de la V3.1. Les poignées laissent la poitrine descendre sous le niveau des mains : seule façon d'obtenir un vrai étirement du pec au poids du corps. Position d'étirement du deltoïde antérieur, moins agressive que le dip (mains fixées au sol, amplitude autolimitée). Gilet ajouté dès Sem 10 (repère Sem 7 : 30/25/22, largement au-dessus de la cible). Si 3×20 sortent encore avec le gilet en S11, augmente la hauteur des poignées plutôt que les reps. Sem 9 : PDC, RIR 1-2. Tempo 3-1-1. V4.2 (30/09) : Sem 10 en PDC → 20/19/16 pour 15/14/13, validée → Sem 11 : PDC+5 (1 cran), pas PDC+10 comme prévu en V4.0.",
      },
      {
        id: 'push-a-1',
        name: 'Extension triceps corde poulie haute',
        muscleGroup: 'TRICEPS',
        sets: 4,
        targetReps: '12-15 · S11 : 10-12',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '17',
        essential: true,
        notes: "★ Priorité 2, mais placé en fin de séance et non en tête : un triceps pré-fatigué transformerait l'échec des dips/pompes en échec du triceps. La contrepartie est un RIR plus bas plutôt qu'une charge lourde. Passe à 4 séries. Coudes verrouillés au corps, humérus vertical et immobile — zéro implication du deltoïde. Écarter la corde en fin de course pour le chef latéral. S11 : drop set unique (-30 % de charge, jusqu'à l'échec). Sem 9 : 26 kg, RIR 1. Sem 10 : 28 kg. Sem 11 : 30 kg. Tempo 2-0-1. V4.2 (30/09) : Sem 10 non faite. Sem 9 à 15 kg → 15/15/15/14, validée → Sem 11 : 17 kg (1 cran de pile). ⚠ Si les 15 kg de Sem 9 venaient d'une autre poulie que celle de la maison, recale sur ta pile maison.",
      },
    ],
  },
  // ── LEGS A — Rééducation genou droit / Abdos ──────────────────────────────
  {
    id: 'legs-a-rehab',
    dayNumber: 3,
    name: 'Legs A',
    focus: "Rééducation genou droit pure (mobilité, activation) + abdos — sur demande d'Antoine, plus d'objectif hypertrophie tant que le genou n'est pas libéré (V3.2, 13/09/2026)",
    muscleGroups: 'Genou (mobilité / activation) / Abdos',
    estimatedDuration: '≈ 30 min',
    exercises: [
      {
        id: 'legs-a-rehab-1',
        name: 'Mobilisation rotulienne auto-appliquée',
        muscleGroup: 'GENOU — MOBILITÉ',
        sets: 2,
        targetReps: '10 /sens ×4 sens',
        restSeconds: 30,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '—',
        essential: false,
        notes: "Mobilisation manuelle de la rotule dans ses 4 axes (haut/bas/interne/externe), doigts posés à plat sur les bords, genou détendu en extension complète, quadriceps relâché. Objectif : lever la raideur péri-articulaire avant tout travail actif. Aucune charge, aucun RIR — seul le seuil de douleur <3/10 encadre la série, stable pendant l'exercice et disparue dans l'heure. ⚠ Arrêt immédiat en cas de sensation de blocage ou de craquement DOULOUREUX (un simple crépitement indolore est fréquent après une atteinte du genou et sans gravité). Étape 1/3 du protocole genou : mobilité pure, zéro charge fonctionnelle. Utile aussi hors séance, quotidien, 2 min si le genou est raide un matin donné.",
      },
      {
        id: 'legs-a-rehab-2',
        name: 'Dorsiflexion cheville au mur',
        muscleGroup: 'GENOU — MOBILITÉ',
        sets: 3,
        targetReps: '10 /jambe',
        restSeconds: 30,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '—',
        essential: false,
        notes: "Genou dirigé vers le mur sans décoller le talon, orteils à distance croissante jusqu'à la limite tenable. Compare la distance orteil-mur des deux côtés. Cheville et genou sont mécaniquement couplés dans l'accroupissement : une dorsiflexion limitée pousse le genou à compenser vers l'avant ou fait décoller le talon — c'est pour ça que cet exercice est ici, pas seulement au niveau du genou. Le talon ne doit JAMAIS décoller du sol : c'est le signal que l'amplitude dépasse ce que la cheville peut donner sans compensation. Douleur <3/10 seule limite. Utile aussi hors séance, quotidien, 2 min.",
      },
      {
        id: 'legs-a-rehab-3',
        name: 'Heel slides',
        muscleGroup: 'GENOU — MOBILITÉ',
        sets: 3,
        targetReps: '12 /jambe',
        restSeconds: 30,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '—',
        essential: false,
        notes: "Allongé sur le dos, glisser le talon vers la fesse en fléchissant le genou puis revenir en extension complète, sans forcer au point de blocage. Vise l'amplitude de FLEXION, complémentaire de l'extension travaillée plus loin par le terminal knee extension. Une sensation d'ACCROCHAGE net (différent d'une simple raideur) est un signal d'arrêt, pas un obstacle à pousser. Progression = amplitude atteinte, pas vitesse ni charge. Douleur <3/10 seule limite.",
      },
      {
        id: 'legs-a-rehab-4',
        name: 'Crunch câble à genoux',
        muscleGroup: 'ABDOS',
        sets: 4,
        targetReps: '12-15',
        restSeconds: 60,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '15',
        essential: false,
        notes: "Inchangé depuis la V3.0 — un des 4 exercices abdos qui restent strictement les mêmes. Enrouler la colonne vertèbre par vertèbre, hanches FIXES. Devient un bloc indépendant (n'est plus en tri-set) : la séance passe en rééducation genou, l'attention doit rester sur l'exécution, pas sur l'enchaînement. Sans lien direct avec le genou : la vigilance porte sur le bas du dos. Charge inchangée (15 kg). Tempo 2-1-1. RIR 2-3.",
      },
      {
        id: 'legs-a-rehab-5',
        name: 'Terminal knee extension élastique',
        muscleGroup: 'GENOU — ACTIVATION',
        sets: 3,
        targetReps: '15-20 /jambe',
        restSeconds: 45,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'Élastique léger',
        essential: true,
        notes: "Le geste d'activation central de cette séance. Élastique fixé bas, boucle derrière le genou tendu : pousser en extension complète contre la résistance et tenir 1 s en verrouillage haut. Cible directement l'inhibition du quadriceps qui suit une atteinte du genou. Charge externe légère plutôt qu'à vide : même faible, une résistance contribue au gain d'amplitude que le travail au poids du corps seul n'apporte pas. Repos à 45 s (sous le plancher habituel de 120 s) : l'objectif est l'activation et l'amplitude, pas la fatigue proche de l'échec. Point de contrôle : le verrouillage COMPLET du genou en fin de mouvement, sans flexion résiduelle — c'est lui, pas la résistance de l'élastique, qui signe le retour de l'activation. Tempo 2-1-2. RIR indicatif 2-3 (repère d'effort, pas d'échec).",
      },
      {
        id: 'legs-a-rehab-6',
        name: 'Abduction hanche câble unilatéral',
        muscleGroup: 'GENOU — CONTRÔLE MOTEUR',
        sets: 3,
        targetReps: '15-20 /jambe',
        restSeconds: 45,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '5',
        essential: false,
        notes: "Reframé le 13/09/2026 en contrôle moteur de la hanche (stabilité du genou en valgus) plutôt qu'en objectif hypertrophie du moyen fessier — moyen fessier : contrôleur du valgus de genou, premier muscle à faire travailler après une blessure de ski. Poulie basse + sangle de cheville, buste stable. Sort du tri-set (bloc indépendant), repos désormais fixé à 45 s. Point de contrôle : le genou ne doit JAMAIS partir en valgus (vers l'intérieur) pendant le mouvement — c'est le seul point qui compte ici. Charge et fourchette inchangées (5 kg), aucune progression tant que le genou n'est pas explicitement libéré. Tempo 2-1-1.",
      },
      {
        id: 'legs-a-rehab-7',
        name: 'Reverse crunch (enroulement bassin)',
        muscleGroup: 'ABDOS',
        sets: 4,
        targetReps: '12-15',
        restSeconds: 60,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC',
        essential: false,
        notes: "Inchangé depuis la V3.0. Enrouler le bassin vers le sternum, sans élan des jambes. Devient un bloc indépendant, plus de tri-set. Sans lien direct avec le genou : la vigilance porte sur le bas du dos. Tempo 2-1-1. RIR 2-3.",
      },
    ],
  },
  // ── PULL B — Deltoïde postérieur / Biceps / Dos / Latéral ────────────────
  {
    id: 'pull-b',
    dayNumber: 4,
    name: 'Pull B',
    focus: "2ᵉ dose de postérieur + 3ᵉ dose hebdomadaire de latéral, biceps en position allongée (chef long), dos en tractions au tempo. Jambes en rééducation genou juste après (V4.0, Sem 9-11)",
    muscleGroups: 'Deltoïde postérieur / Biceps / Dos / Latéral',
    estimatedDuration: '≈ 65 min',
    exercises: [
      {
        id: 'pull-b-4',
        name: 'Face pull poulie haute (corde)',
        muscleGroup: 'DELTOÏDE POSTÉRIEUR',
        sets: 4,
        targetReps: '15-20 (S9) · 12-15 (S10-11)',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '24',
        essential: true,
        notes: "★ Priorité 1. Passe à 4 séries, charge remontée vers le niveau V3.0 (22-24 kg). HAUTEUR : Sem 9 encore à hauteur de POITRINE comme pendant la pause ; retour à hauteur de VISAGE en Sem 10 seulement si Sem 9 est muette (à hauteur de visage l'humérus monte à ~90° d'abduction, ce qui recrute le latéral et referme l'espace sous-acromial). Coudes au-dessus des poignets, tirage vers l'arrière et non vers le haut. S11 : partiels sur le tiers final de la traction (rétraction scapulaire max), 6 reps. Sem 9 : 20 kg hauteur poitrine, RIR 1-2. Sem 10 : 22 kg, hauteur visage si indolore. Sem 11 : 24 kg. Tempo 2-1-1. V4.2 (30/09) : Sem 9 validée ; Sem 10 à 50 lbs (≈ 22,7 kg) → 18/15/16/13, toutes les cibles atteintes → Sem 11 : 24 kg (+1 cran).",
      },
      {
        id: 'pull-b-1',
        name: 'Tractions supination lestées (barre)',
        muscleGroup: 'DOS',
        sets: 3,
        targetReps: '6-10',
        restSeconds: 180,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC+10',
        essential: true,
        notes: "Priorité 4, placé tôt (biceps frais). Lestage remonté par paliers : PDC+7,5 (Sem 9) → PDC+10 (Sem 10-11), puis plus aucune marge, le gilet est plein. Prise neutre définitivement écartée (question close le 10/09, une seule barre). En supination le chef long du biceps est en tension maximale en bas de suspension : épaule muette, pas de restriction, mais ne reste pas suspendu passivement entre les répétitions. Au-delà de PDC+10, la progression passera par le tempo excentrique comme au Jour 1. Sem 9 : PDC+7,5, RIR 2. Tempo 3-0-1. V4.2 (30/09) : Sem 9 validée (11/9/8) ; Sem 10 à PDC+10 → 15/11/10, confirmé : PDC+10 tenu en Sem 11 (gilet plein).",
      },
      {
        id: 'pull-b-2',
        name: 'Curl incliné haltères (banc 45°)',
        muscleGroup: 'BICEPS',
        sets: 4,
        targetReps: '12-15 · S11 : 10-12',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '23',
        essential: true,
        notes: "★ Priorité 2, RETOUR en V4.0 (il était sorti le 10/09 uniquement pour l'épaule). Sur banc à 45°, l'humérus part derrière le plan du tronc : étire directement le deltoïde antérieur et le chef long du biceps — seul exercice du programme qui charge le chef long en position allongée. Remplace le curl debout supination de la V3.1. ★ Point de vigilance n°3 : si ça réveille quelque chose (avec le développé-écarté du Jour 2), c'est celui-ci qui sort en premier — son apport n'est qu'un angle de biceps. S11 : partiels en position étirée (bras derrière le tronc), 5 reps. Sem 9 : 20 kg (départ prudent), RIR 1. Sem 10 : 23 kg. Sem 11 : 26 kg. Tempo 3-0-1. V4.2 (30/09) : Sem 9 à 20 kg → 15/13/13/11, NON validée → Sem 10 maintenue à 20 kg au RIR 0-1 ; Sem 10 faite → 26/17/16/17 pour 15/14/13/12 (charge notée 20 lbs, à vérifier), toutes cibles atteintes → Sem 11 : 23 kg (+1 cran). Si la saisie de Sem 10 était en lbs par haltère, redescends à la charge que tu as réellement tenue.",
      },
      {
        id: 'pull-b-3',
        name: 'Tractions prise large PDC, excentrique 4 s',
        muscleGroup: 'DOS — FINITION',
        sets: 3,
        targetReps: 'AMRAP (obj. ≥ 8)',
        restSeconds: 150,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC',
        essential: false,
        notes: "Conservé de la V3.1. Le gilet est plein sur les tractions lestées du Jour 1 et de ce jour : le tempo reste la seule variable de progression du dos. Le nombre de reps compte moins que le respect du tempo : objectif ≥ 8/série en Sem 9-10, puis passage à 5 s en Sem 11 (les reps vont baisser, c'est normal). L'excentrique lent augmente le temps passé en position basse donc la charge cumulée sur l'épaule : c'est l'exercice à surveiller le lendemain. Sem 9-10 : PDC, RIR 2. Tempo 4-0-1 (S11 : 5-0-1).",
      },
      {
        id: 'pull-b-5',
        name: 'Oiseau haltères buste penché',
        muscleGroup: 'DELTOÏDE POSTÉRIEUR — FINITION',
        sets: 3,
        targetReps: '15-20 · S11 : 12-15',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '14',
        essential: false,
        notes: "RETOUR en V4.0 (il était sorti le 10/09 par arbitrage de volume, pas pour une douleur) : 2ᵉ dose de postérieur de la rotation, profil de résistance complémentaire de la version poitrine appuyée du Jour 1 (gravité maximale bras à l'horizontale, contre pic en position contractée). Buste penché = maintien lombaire isométrique ; si le bas du dos parle avant l'épaule, bascule sur la version poitrine appuyée (voir onglet Conseils — Lombaires). Repère V3.0 : 23 kg — on n'y revient pas d'emblée après 4 semaines d'arrêt. Sem 9 : 17 kg, RIR 1-2. Sem 10-11 : 20 kg. Tempo 2-1-1. V4.2 (30/09) : Sem 9 à 17 kg → 20/18/18 pour 20/19/18, série 2 manquée, non validée. Sem 10 à 14 kg → 17/22/20, non validée → Sem 11 : 14 kg tenus, cibles 18/19/18 au RIR 0-1.",
      },
      {
        id: 'pull-b-6',
        name: 'Élévations latérales haltères (debout, séries longues)',
        muscleGroup: 'DELTOÏDE LATÉRAL — FINITION',
        sets: 3,
        targetReps: '18-25 · S11 : 15-20',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '16',
        essential: false,
        notes: "NOUVEAU en V4.0 : 3ᵉ dose hebdomadaire de deltoïde latéral (avec les Jours 2 et 5), porte le latéral de 6 à 11 séries par rotation (+83 % — la plus grosse marche de volume du fichier). Version série longue et charge basse en toute fin de séance : coût de fatigue quasi nul, le latéral arrive frais (pas sollicité par les tractions) malgré la place en fin de séance. Au premier signal douloureux, c'est cette 3ᵉ dose qu'on supprime en premier — pas les deux doses principales. S11 : partiels sur la moitié basse jusqu'à l'échec complet. Sem 9-10 : 14 kg, RIR 1, sans jamais chercher la charge. Sem 11 : 17 kg. Tempo 2-1-1. V4.1 : charges recalées de +3 kg (Sem 10 : 17 kg, Sem 11 : 20 kg) car la série 1 de Sem 9 dépassait la fourchette (27/25/24 à 14 kg pour un plafond à 25) ; V4.2 : Sem 10 faite à 16 kg → 23/19/16 pour 25/24/23, non validée → Sem 11 : 16 kg tenus, cibles 24/20/17 au RIR 0 + partiels bas.",
      },
    ],
  },
  // ── PUSH B — Deltoïde latéral / Pecs / Triceps / Antérieur ───────────────
  {
    id: 'push-b',
    dayNumber: 5,
    name: 'Push B',
    focus: "2ᵉ dose de latéral (haltères assis + poulie basse en fin de séance), pecs 100 % poids du corps (pompes lestées en mouvement principal), triceps. Plus de travail direct du deltoïde antérieur (V4.1). Jambes en rééducation genou juste après (V4.2, Sem 9-11)",
    muscleGroups: 'Deltoïde latéral ×2 / Pecs / Triceps',
    estimatedDuration: '≈ 60 min',
    exercises: [
      {
        id: 'push-b-6',
        name: 'Élévations latérales haltères assis',
        muscleGroup: 'DELTOÏDE LATÉRAL',
        sets: 4,
        targetReps: '15-20 · S11 : 12-15',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '17',
        essential: true,
        notes: "★ 2ᵉ dose principale du latéral, passe à 4 séries. Version ASSISE, dossier vertical : aucun élan possible, donc plus stricte que la version debout du Jour 2 à charge égale — d'où une charge systématiquement inférieure de 3 kg. Assis, toute compensation viendrait des trapèzes (haussement d'épaule) : si tu hausses, la charge est trop lourde. S11 : partiels sur la moitié basse d'amplitude après l'échec. Sem 9 : 14 kg (charge de la reprise, reconduite — version la plus stricte des trois), RIR 1-2. Sem 10 : 17 kg. Sem 11 : 20 kg. Tempo 2-1-1. V4.1 (29/09) : charges recalées après la Sem 9 (Fitness Park : 26/21/20 à 16 kg pour un plafond à 20). V4.2 (30/09) : Sem 9 validée → +1 cran = 17 kg en Sem 10 (pas 20 : la V4.1 sautait 2 crans). La Sem 11 dépend de la Sem 10 (4ᵉ série non saisie dans le fichier au 05/10) : si les 4 séries atteignent leurs reps, 20 kg ; sinon reste à 17 kg avec +1 rep sur les séries manquées.",
      },
      {
        id: 'push-b-2',
        name: 'Pompes lestées (gilet 10 kg, mains largeur pecs)',
        muscleGroup: 'PECS',
        sets: 4,
        targetReps: "S9 12-15 · S10 15/14/13/12 (étalonnage) · S11 : reps S10 +1",
        restSeconds: 150,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC+10',
        essential: true,
        notes: "Passe à 4 séries : mouvement de poussée principal de la séance, gilet plein donc plus aucune marge de charge — le volume et les reps sont les seules variables restantes (~58 kg de charge effective contre 68 kg au développé couché haltères de la V3.0). Progression en REPS uniquement sur les 3 semaines : 12-15 → 15-18 → 17-20. Mains au sol : les coudes ne peuvent pas descendre sous le plan du tronc, l'humérus ne part jamais en extension — la poussée la plus sûre du programme pour l'épaule. Si tu dépasses 20 reps propres en S11, surélève les pieds plutôt que d'allonger encore la série. S11 : partiels sur le tiers bas après l'échec. Sem 9 : PDC+10, RIR 2. Tempo 3-0-1. V4.2 (30/09) : le gilet n'avait jamais été porté sur cet exercice dans ce bloc (Sem 9 = machine) : la cible 18/17/16/15 de la Sem 10 était irréaliste avec +10 kg, donc Sem 10 = étalonnage à 15/14/13/12. Sem 10 faite → 8/7/6/5 ; Sem 11 = tes reps de Sem 10 +1 par série, soit 9/8/7/6.",
      },
      {
        id: 'push-b-1',
        name: "Extension triceps poulie haute, barre droite prise pronation",
        muscleGroup: 'TRICEPS',
        sets: 4,
        targetReps: '12-15 · S11 : 10-12',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '25',
        essential: true,
        notes: "★ Priorité 2. Passe à 4 séries. Prise supination = chef médial et latéral, angle complémentaire de la corde du Jour 2. Ta préférence documentée pour les séries longues sur le triceps est conservée (12-15, jamais en dessous de 10). Coude au corps, épaule neutre : aucun risque attendu. S11 : drop set unique (-30 % de charge, jusqu'à l'échec). Sem 9 : 24 kg, RIR 1. Sem 10 : 26 kg. Sem 11 : 28 kg. Tempo 2-0-1. V4.1 (29/09) : prise PRONATION dès la Sem 10 (ta préférence), la plus stable pour charger — même travail de fond (chefs latéral et médial, épaule neutre). V4.2 (30/09) : Sem 9 (Fitness Park) 18/14/12/12 non validée → 25 kg tenus en Sem 10 (14/15/11/10, non validée) → Sem 11 : 25 kg, cibles 15/14/12/11 + drop set.",
      },
      {
        id: 'push-a-5',
        name: 'Pompes diamant (mains serrées)',
        muscleGroup: 'TRICEPS — FINITION',
        sets: 3,
        targetReps: 'AMRAP (obj. ≥ 12)',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC',
        essential: false,
        notes: "Déplacée du Jour 2 vers ce Jour 5 en V4.0, pour tenir le plafond de 60 min sur le Push A (qui absorbe le développé-écarté et ses 4 séries à 150 s de repos). Triceps chef long et médial, coudes au corps, épaule quasi neutre : aucun risque attendu. Repère Sem 7 (V3.2) : 10/8/7 — nettement en dessous de la cible car elles arrivaient en 5ᵉ position d'une séance à 5 exercices de poussée ; ici en avant-dernier, sur un triceps moins cuit, attends-toi à mieux. Objectif ≥ 12 (S9), ≥ 13 (S10), ≥ 14 (S11) ; passe au gilet 10 kg si 3×20 sont tenues. Sem 9 : PDC, RIR 1. V4.2 : Sem 10 → 18/18/— (3ᵉ série non saisie au 05/10). Inchangée.",
      },
      {
        id: 'push-b-10',
        name: 'Élévations latérales poulie basse unilatéral (câble devant le corps)',
        muscleGroup: 'DELTOÏDE LATÉRAL',
        sets: 3,
        targetReps: '12-15 par bras',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '8',
        essential: false,
        notes: "NOUVEAU en V4.1 (29/09/2026), dès la Sem 10 : remplace les élévations frontales et les pompes prise large (retirées, voir ci-dessous). C'est l'étape 2 d'origine du protocole de retour (« la poulie avant les haltères ») : résistance continue et tension en position étirée, bras le long du corps, là où l'haltère ne donne presque rien. Câble DEVANT le corps plutôt que derrière le dos : l'humérus ne part pas en extension, ce qui ménage le deltoïde antérieur. 2 côtés enchaînés puis 90 s (≈ 125 s de repos réel par côté). Sem 10 : 7 kg, 12-15 par bras, RIR 1 (fait : 20/20/18). Sem 11 : 8 kg (+1 cran de pile), RIR 0-1. Si la série 1 dépasse 15 : un cran de plus dès la séance suivante. Dernière dose de latéral à sortir si l'épaule parle : c'est la version la plus douce. Pas d'élan, buste immobile, main libre en appui ; la main ne dépasse pas le plan de l'épaule. Retirés en V4.1 : pompes prise large (doublon du développé-écarté, variante de pompe la plus exigeante pour l'antérieur) et élévations frontales (l'antérieur reçoit déjà ≈ 8,5 séries effectives par rotation, et c'est le faisceau qui a fait mal le 10/09). Tempo 2-1-1.",
      },
    ],
  },
  // ── LEGS B — Rééducation genou droit / Abdos + anti-rotation ─────────────
  {
    id: 'legs-b-rehab',
    dayNumber: 6,
    name: 'Legs B',
    focus: "Rééducation genou droit pure (souplesse, geste cible) + gainage anti-rotation — sur demande d'Antoine (V3.2, 13/09/2026)",
    muscleGroups: 'Genou (souplesse / geste cible) / Abdos',
    estimatedDuration: '≈ 23 min',
    exercises: [
      {
        id: 'legs-b-rehab-1',
        name: 'Étirement quadriceps / psoas (couch stretch)',
        muscleGroup: 'GENOU — SOUPLESSE',
        sets: 2,
        targetReps: '45 s /jambe',
        restSeconds: 20,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '45',
        essential: false,
        notes: "Genou arrière au sol ou sur coussin, tibia contre un support (canapé, mur), bassin en rétroversion pour isoler le droit fémoral et le psoas plutôt que cambrer le bas du dos. Glisse une serviette pliée sous la rotule si l'appui direct gêne. Étirement doux, jamais poussé jusqu'à la douleur. Pas de progression chronométrée : ajuste le confort de l'appui, pas la durée — l'objectif est l'équilibre de souplesse entre les deux côtés. Douleur au GENOU (à distinguer d'un simple tiraillement musculaire de cuisse) = repositionne l'appui ou arrête. Recommandé aussi hors séance, 3-4×/semaine, 2×30-45 s/jambe.",
      },
      {
        id: 'legs-b-rehab-2',
        name: 'Étirement ischios doux',
        muscleGroup: 'GENOU — SOUPLESSE',
        sets: 2,
        targetReps: '30 s /jambe',
        restSeconds: 20,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '30',
        essential: false,
        notes: "Jambe tendue surélevée (chaise ou sangle au sol), dos plat, bascule du bassin vers l'avant plutôt que dos rond. Doux et progressif : les ischios peuvent freiner par réflexe l'extension complète du genou après une atteinte articulaire, sans en être la cause. Pas de progression chronométrée : ajuste l'amplitude, pas la durée, semaine après semaine, jamais en insistance forcée. Aucune sollicitation directe du genou dans ce mouvement — la vigilance porte sur le bas du dos.",
      },
      {
        id: 'legs-b-rehab-3',
        name: 'Gainage latéral (oblique)',
        muscleGroup: 'ABDOS',
        sets: 3,
        targetReps: 'Max sec /côté',
        restSeconds: 60,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '30',
        essential: false,
        notes: "Inchangé depuis la V3.0. Anti-inclinaison : obliques et carré des lombes, protection lombaire directe aux côtés de l'anti-extension (hollow) et de l'anti-rotation (Pallof, ajouté ci-dessous). Bassin haut, alignement épaule-hanche-cheville. 30 s de départ, +5 s dès que le temps est tenu proprement des deux côtés. Devient un bloc indépendant, plus de tri-set, repos inchangé à 60 s. Tempo iso. RIR 2-3.",
      },
      {
        id: 'legs-b-rehab-4',
        name: 'Squat profond assisté tenu',
        muscleGroup: 'GENOU — GESTE CIBLE',
        sets: 3,
        targetReps: 'Max sec tenu',
        restSeconds: 45,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '20',
        essential: true,
        notes: "Le geste cible lui-même : accroupissement complet, assisté par appui des bras (cadre de porte, rack, table) pour décharger une partie du poids du corps et descendre plus bas que ce que le genou tolérerait seul. Descente lente, arrêt à la profondeur où la douleur reste <3/10, tenue, remontée en s'aidant des bras autant que nécessaire. La profondeur dépend aussi de l'amplitude de cheville et de hanche (d'où la dorsiflexion en Legs A), pas du genou isolément. Progression = profondeur atteinte ET/OU temps tenu, ET réduction progressive de l'appui des bras — ne pas chercher la profondeur maximale d'emblée, exercice qui se gagne sur plusieurs semaines. Arrêt à la première douleur >3/10 ou sensation d'instabilité.",
      },
      {
        id: 'legs-b-rehab-5',
        name: 'Pallof press poulie basse',
        muscleGroup: 'ABDOS — ANTI-ROTATION',
        sets: 3,
        targetReps: '12 /côté',
        restSeconds: 60,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '10',
        essential: false,
        notes: "NOUVEAU (13/09). Anti-rotation : poulie basse, câble tendu perpendiculairement au buste, pousser bras tendus devant soi sans laisser le buste pivoter vers la poulie — c'est la résistance à la rotation qui est l'exercice, pas la poussée. Complète le trio de gainage anti-lombaire de cette séance (avec le gainage latéral et le hollow body hold) : anti-inclinaison et anti-extension étaient déjà couverts, l'anti-rotation manquait. Prescription reprise telle quelle de l'onglet Excel « Conseils — Lombaires ». Sans lien avec le genou : ajouté ici parce que Legs B regroupe déjà le gainage, pas pour une raison articulaire. Charge de départ prudente (10 kg) faute d'historique — ajuster dès Sem 7 si trop facile ou trop dur à charge constante. Tempo 2-1-2. RIR 2-3.",
      },
      {
        id: 'legs-b-rehab-6',
        name: 'Hollow body hold',
        muscleGroup: 'ABDOS',
        sets: 3,
        targetReps: 'Max sec',
        restSeconds: 60,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '35',
        essential: false,
        notes: "Inchangé depuis la V3.0. Anti-extension : protège directement le bas du dos sous charge. Bas du dos PLAQUÉ au sol, obligatoire — dès qu'il décolle, la série est terminée. 35 s de départ, +5 s dès que la série est tenue proprement. Devient un bloc indépendant, repos inchangé à 60 s. Tempo iso. RIR 2-3.",
      },
    ],
  },
];

// Toutes les séances de tous les programmes intégrés (Strict V3.2 + les
// programmes additionnels de extraPrograms.ts) — sert uniquement à la
// recherche par id ci-dessous, pour que l'historique/les écrans puissent
// toujours retrouver une séance même si le programme actif a changé
// depuis (voir workoutStore.ts → activeProgramId). LEGACY_LEGS_WORKOUTS
// (ids 'legs-a'/'legs-b', avant le 19/08/2026) et LEGACY_LEGS_V3_WORKOUTS
// (ids 'legs-a-v3'/'legs-b-v3', V3.0 du 30/08 au 13/09/2026) y figurent
// pour que l'historique déjà enregistré sous ces ids reste lisible malgré
// les changements d'exercices — voir legacyWorkouts.ts.
const ALL_KNOWN_WORKOUTS: WorkoutDay[] = [
  ...WORKOUTS,
  ...LEGACY_LEGS_WORKOUTS,
  ...LEGACY_LEGS_V3_WORKOUTS,
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
// Séances des programmes intégrés de la bibliothèque et du catalogue
// (programs.ts les enregistre au chargement, pour éviter un import circulaire).
export const EXTRA_BUILT_IN_WORKOUTS: WorkoutDay[] = [];
export const registerBuiltInWorkouts = (days: WorkoutDay[]) => {
  for (const d of days) {
    if (!EXTRA_BUILT_IN_WORKOUTS.some((w) => w.id === d.id)) EXTRA_BUILT_IN_WORKOUTS.push(d);
  }
};
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
  ALL_KNOWN_WORKOUTS.find((w) => w.id === id)
  ?? EXTRA_BUILT_IN_WORKOUTS.find((w) => w.id === id)
  ?? CUSTOM_WORKOUTS.find((w) => w.id === id);

export const getWorkout = (id: string): WorkoutDay | undefined =>
  (SESSION_WORKOUT_OVERRIDE && SESSION_WORKOUT_OVERRIDE.id === id ? SESSION_WORKOUT_OVERRIDE : undefined)
  ?? getBaseWorkout(id);
