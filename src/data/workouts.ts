import { WorkoutDay, ProgressionWeek } from './types';
import { PPL_DEBUTANT_WORKOUTS, FULL_BODY_WORKOUTS, FORCE_5X5_WORKOUTS, WRIST_CONSOLIDATION_WORKOUTS } from './extraPrograms';
import {
  LEGACY_LEGS_WORKOUTS,
  LEGACY_LEGS_V3_WORKOUTS,
  LEGACY_LEGS_REHAB_WORKOUTS,
  LEGACY_STRICT_RETIRED_WORKOUTS,
} from './legacyWorkouts';

// ─── Phase 3 — Prise de masse, mésocycle 1 (03/11 → 14/12/2026) ─────────────
// Strict V5.3 : 5 semaines de progression + 1 semaine de décharge, soit 6
// semaines (le compteur de semaines repart de 1 : les 13 semaines de la sèche,
// Phase 1, sont terminées). Les semaines sont calendaires, du mardi au lundi.
// Le mésocycle 2 démarre le 15/12/2026.
export const MESOCYCLE_WEEKS = 6;

/** Premier jour de la Sem 1 (mardi 03/11/2026). Le mois est compté à partir de 0. */
export const MESOCYCLE_START = new Date(2026, 10, 3);

/**
 * Identifiant du mésocycle en cours. Il sert à reconnaître une sauvegarde faite
 * avec l'ancien cycle (sèche, 13 semaines) : son numéro de semaine n'a plus de
 * sens ici et doit être recalé (voir `merge` dans workoutStore.ts). À changer
 * à chaque nouveau mésocycle.
 */
export const MESOCYCLE_ID = 'phase3-meso1';

/**
 * Semaine du mésocycle (de 1 à MESOCYCLE_WEEKS) qui correspond à une date.
 * Sert à replacer la semaine courante d'un téléphone qui avait encore l'ancien
 * compteur (1-13) au moment du passage à ce mésocycle.
 */
export const getMesocycleWeekForDate = (date: Date): number => {
  // On compare des jours du calendrier (et non des millisecondes) : un
  // changement d'heure ne peut ainsi jamais décaler le résultat d'une semaine.
  const calendarDay = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const daysSinceStart = Math.floor((calendarDay(date) - calendarDay(MESOCYCLE_START)) / 86400000);
  const week = Math.floor(daysSinceStart / 7) + 1;
  // Avant le départ → Sem 1 ; après la décharge → on reste sur la dernière
  // semaine, en attendant le mésocycle suivant (nouveau MESOCYCLE_ID).
  return Math.min(MESOCYCLE_WEEKS, Math.max(1, week));
};

export const PROGRESSION_WEEKS: ProgressionWeek[] = [
  {
    label: 'Sem. 1',
    phase: 'REPRISE — 03/11→09/11',
    rir: 'RIR 3 poly · 2-3 isolations · 2 bras · 3-4 jambes',
    objective: "Premier jour de surplus calorique, volume de la maintenance (haut du corps 67 séries, jambes 16, total 92). Les charges repartent des dernières références validées ; pour les nouveaux exercices (tirages verticaux, jambes), la charge se calibre : celle qui donne la fourchette de reps au RIR prescrit. Aucune technique d'intensification.",
  },
  {
    label: 'Sem. 2',
    phase: 'CHARGE 1 — 10/11→16/11',
    rir: 'RIR 2-3 poly · 2 isolations · 1-2 bras · 3 jambes',
    objective: "Les séries sont rendues aux séances A (haut du corps 68 · jambes 19 · total 96). V5.3 : les curls passent en supination stricte (3 séries, RIR 3, progression en répétitions seulement) et le curl inversé est suspendu jusqu'à la fin de la décharge. Barre droite en pronation à la place de la corde (face pull, extension triceps) et développé-écarté en pronation. Double progression : toutes les séries à la cible au RIR prescrit → +1 cran, cibles −2 reps ; sinon même charge et +1 rep sur les séries manquées.",
  },
  {
    label: 'Sem. 3',
    phase: 'CHARGE 2 — 17/11→23/11',
    rir: 'RIR 2 poly · 1-2 isolations · 1 bras · 2-3 jambes',
    objective: "Les séries sont rendues aux séances B (haut du corps 72 · jambes 22 · total 103). Aucune technique d'intensification. Tractions prise large : on s'arrête au RIR prescrit, jamais de répétition ratée ou raccourcie ; si elles ne progressent pas en 3 semaines alors que le tirage lourd monte, 2 séances de tractions par rotation au mésocycle 2.",
  },
  {
    label: 'Sem. 4',
    phase: 'CHARGE 3 — 24/11→30/11',
    rir: 'RIR 1-2 poly · 1 isolations · 0-1 bras · 2 jambes',
    objective: "+3 séries sur les épaules et le triceps : oiseau buste penché, élévations latérales debout du Pull B, extension triceps du Push B (haut du corps 75 · jambes 25 · total 109). Hip thrust et mollets debout passent à 4 séries. Garde-fou : si la chute de répétitions à charge égale dépasse la tolérance ou si les charges reculent, la série ajoutée sort et le volume ne monte plus.",
  },
  {
    label: 'Sem. 5',
    phase: 'PIC — 01/12→07/12',
    rir: 'RIR 1 poly · 0-1 isolations · 0 bras · 2 jambes',
    objective: "+2 séries sur le latéral (assis au Push B) ; les curls restent plafonnés à 3 séries chacun (haut du corps 76 · jambes 25 · total 110). Techniques d'intensification : 1 exercice par groupe et par séance, sur la dernière série seulement — partiels en position étirée, drop set sur le triceps. Haut du corps uniquement : jamais sur les tractions, les dips, ni le bas du corps. Si la rotation de la Sem 5 se termine avant le 07/12, la refaire telle quelle jusqu'à la décharge, qui démarre le 08/12 quoi qu'il arrive.",
  },
  {
    label: 'Décharge',
    phase: 'DÉCHARGE — 08/12→14/12',
    rir: 'RIR 3-4 partout',
    objective: "Dissiper la fatigue avant le mésocycle 2 (15/12 → 25/01) : moitié des séries de la Sem 5 (arrondie au-dessus), charge −13 %, aucune technique d'intensification.",
  },
];

// Semaine du mésocycle (1-6) → index de phase dans PROGRESSION_WEEKS.
const WEEK_TO_PHASE_INDEX = [0, 1, 2, 3, 4, 5];

/** Phase du mésocycle correspondant à la semaine donnée (bornée 1 → 6). */
export const getProgressionWeek = (week: number): ProgressionWeek => {
  const w = Math.min(MESOCYCLE_WEEKS, Math.max(1, Math.round(week)));
  return PROGRESSION_WEEKS[WEEK_TO_PHASE_INDEX[w - 1]];
};

// ─── Les 6 séances PPL Strict V5.3 ──────────────────────────────────────────
// Programme actif de l'appli. Mise à jour du 14/11/2026 (V4.3 → V5.3), qui
// reprend les versions V5.0 à V5.3 du fichier de suivi :
//  · V5.0 — maintenance puis prise de masse ; les jambes reviennent
//    (fessiers et mollets d'abord, quadriceps au stade 1 à charge fixe, ischios
//    par la charnière de hanche) ; le dos passe aux tractions prise large et à
//    deux tirages verticaux à la poulie haute (les tractions prise serrée et
//    les tractions prise large excentriques sortent).
//  · V5.2 — le volume monte en rampe (séries et RIR) au fil des semaines.
//  · V5.3 — curls en supination stricte (3 séries, RIR 3), curl inversé
//    suspendu, barre droite en pronation à la place de la corde, prise neutre
//    écartée pour les haltères (paumes vers le bas, l'avant ou l'arrière).
//
// CONVENTIONS DE CE FICHIER
//  · `sets` = nombre de séries de la Sem 3 (la plus longue période du cycle) ;
//    la rampe des autres semaines est écrite dans les notes de chaque exercice.
//  · `defaultWeight` = la charge de la PROCHAINE séance à faire d'après le
//    fichier de suivi au 14/11/2026. Elle se met à jour à la main, le défaut du
//    programme passant avant la dernière charge saisie. Un exercice sans charge
//    de référence (tirages verticaux) n'en a pas : elle se calibre.
//  · `targetReps` = la fourchette de répétitions ; la cible exacte de chaque
//    série se calcule semaine après semaine (double progression, un cran à la
//    fois), voir les notes.
//  · IDS : un exercice qui reste le même mouvement garde son id ; un nouvel
//    exercice reçoit un id neuf ; un exercice retiré garde le sien dans
//    legacyWorkouts.ts (LEGACY_STRICT_RETIRED_WORKOUTS) pour que l'historique
//    reste lisible. Les séances Legs changent de génération : 'legs-a-v5' /
//    'legs-b-v5' remplacent 'legs-a-rehab' / 'legs-b-rehab', conservées dans
//    legacyWorkouts.ts (comme 'legs-a-v3' / 'legs-b-v3' avant elles).
export const WORKOUTS: WorkoutDay[] = [
  // ── PULL A — Deltoïde postérieur + latéral / Dos / Biceps ────────────────
  {
    id: 'pull-a',
    dayNumber: 1,
    name: 'Pull A',
    focus: "Épaules priorité 1 (postérieur et latéral), dos en tractions prise large placées tôt (biceps frais) puis tirage vertical en fin de séance, biceps priorité 2 en supination stricte. V5.3 : prise neutre écartée",
    muscleGroups: 'Deltoïde postérieur / Latéral / Dos / Biceps',
    estimatedDuration: '≈ 55 min',
    exercises: [
      {
        id: 'pull-a-5',
        name: 'Oiseau haltères poitrine appuyée (banc 30°)',
        muscleGroup: 'DELTOÏDE POSTÉRIEUR',
        sets: 4,
        targetReps: '10-15',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '26',
        essential: true,
        notes: "★ Priorité 1, ouvre la rotation. Séries : 3 en Sem 1, 4 dès la Sem 2. RIR 2-3 en Sem 1 → 0-1 en Sem 5. Double progression : toutes les séries à la cible au RIR prescrit → +1 cran (3 kg), cibles −2 reps (jamais sous 10) ; sinon même charge, +1 rep sur les séries manquées. Charge de départ 26 kg ; si elle n'est pas tenue, redescends d'un cran. Poitrine calée sur le dossier à 30°, zéro élan. L'humérus ne passe jamais au-dessus du plan des épaules en fin de course (sinon le latéral prend le relais et l'espace sous-acromial se referme). Sem 5 : dernière série en partiels en position étirée (5 reps sur le tiers bas d'amplitude après l'échec). Tempo 2-1-1. Échauffement : 2 séries.",
      },
      {
        id: 'pull-a-9',
        name: 'Élévations latérales haltères debout',
        muscleGroup: 'DELTOÏDE LATÉRAL',
        sets: 3,
        targetReps: '12-20',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '23',
        essential: false,
        notes: "★ Priorité 1. 3 séries à toutes les semaines. RIR 2-3 en Sem 1 → 0-1 en Sem 5. Fourchette élargie à 12-20 : au-delà de 20 reps l'estimation du RIR se dégrade, c'est la charge qui monte (cran de 3 kg, même règle de double progression). On repart de la charge validée (23 kg). Mains jamais au-dessus du plan des épaules, pouce légèrement plus haut que l'auriculaire. C'est la première dose à sortir si l'épaule gêne. Sem 5 : dernière série en partiels sur la moitié BASSE d'amplitude (position étirée) après l'échec. Tempo 2-1-1. Échauffement : 1 série.",
      },
      {
        id: 'pull-a-1',
        name: "Tractions pronation prise large (mains ≈ 1,5 × largeur d'épaules)",
        muscleGroup: 'DOS',
        sets: 3,
        targetReps: '6-12',
        restSeconds: 180,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC',
        essential: true,
        notes: "Priorité 4 mais placées tôt : le biceps doit être frais. Nouveau format V5.0 : on ne va plus à l'échec sur ce mouvement, tu t'arrêtes au RIR prescrit (3 en Sem 1 → 1 en Sem 5) ; une répétition ratée ou raccourcie n'apprend rien. Départ en suspension bras tendus, omoplates abaissées AVANT de tirer, menton au-dessus de la barre, 1 s de suspension en bas (le « 1 » du tempo). Mains à ≈ 1,5 × la largeur d'épaules, pas plus : la prise extrême raccourcit l'amplitude et retire l'étirement du grand dorsal. Progression en répétitions (cible = réel + 1) ; à 3 × 12 → +5 kg de gilet et cibles −2. Ton poids de corps va monter d'environ 1 kg sur le mésocycle : maintenir tes répétitions est déjà un progrès. Aucune technique d'intensification. Tempo 2-1-1. Échauffement : 1 série.",
      },
      {
        id: 'pull-a-10',
        name: 'Curl debout haltères, supination stricte (coudes au corps)',
        muscleGroup: 'BICEPS',
        sets: 3,
        targetReps: '10-15',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '26',
        essential: true,
        notes: "★ Priorité 2. NOUVEAU en V5.3 : remplace le curl marteau, la prise neutre (paumes face à face) est écartée pour toute la phase. EXERCICE À TESTER : première série sans charge ou très légère ; toute douleur ≥ 1/10 pendant ou après = arrêt de l'exercice et pause totale des biceps jusqu'à la fin de la décharge. 3 séries, RIR 3. Charge gelée : la progression se fait en répétitions seulement (cible +1, plafond 15) ; baisse d'un cran (3 kg) si la série 1 tombe sous 10. Départ à 26 kg (−6 kg par rapport au marteau, supination = charge plus légère). Coude au corps, humérus vertical : le deltoïde antérieur n'intervient pas. Aucune technique d'intensification. Tempo 2-0-1. Échauffement : 1 série.",
      },
      {
        id: 'pull-a-11',
        name: 'Tirage vertical poulie haute, barre large (assis sur le banc)',
        muscleGroup: 'DOS',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        essential: false,
        notes: "NOUVEAU en V5.0 : remplace les tractions prise serrée en AMRAP. Même geste et même prise que les tractions prise large, mais avec une charge inférieure à ton poids de corps : tu accumules des répétitions complètes jusqu'au RIR 1 sans que la prise ou le biceps cède avant le grand dorsal. CALIBRAGE : la charge qui donne ≈ 12 reps à RIR 2-3 (à saisir dans la 1ʳᵉ série). RIR 2-3 en Sem 1 → 0-1 en Sem 5. Double progression, cran de pile supposé 2,5 kg (à corriger si ta pile a un autre pas). 1 s d'étirement bras tendus en haut. Pas de cale-cuisses : si la charge te soulève du banc, pose un haltère lourd en travers des cuisses. Tempo 3-1-1. Échauffement : 1 série.",
      },
    ],
  },
  // ── PUSH A — Deltoïde latéral / Pecs / Triceps ───────────────────────────
  {
    id: 'push-a',
    dayNumber: 2,
    name: 'Push A',
    focus: "Deltoïde latéral priorité 1, pecs en développé-écarté (prise pronation) + dips lestés + pompes, triceps priorité 2 placé après les poussées",
    muscleGroups: 'Deltoïde latéral / Pecs / Triceps',
    estimatedDuration: '≈ 58 min',
    exercises: [
      {
        id: 'push-a-6',
        name: 'Élévations latérales haltères (debout)',
        muscleGroup: 'DELTOÏDE LATÉRAL',
        sets: 5,
        targetReps: '12-20',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '26',
        essential: true,
        notes: "★ Priorité 1, dose principale du latéral en ouverture de séance. Séries : 4 en Sem 1, 5 dès la Sem 2. RIR 2-3 en Sem 1 → 0-1 en Sem 5. Double progression, cran de 3 kg : charge de départ 23 kg, 26 kg dès que la Sem 2 est validée. Debout : léger élan toléré en fin de série. Mains jamais au-dessus du plan des épaules, pouce légèrement plus haut que l'auriculaire (rotation externe). Sem 5 : dernière série en partiels sur la moitié BASSE d'amplitude après l'échec. Tempo 2-1-1. Échauffement : 2 séries.",
      },
      {
        id: 'push-a-7',
        name: 'Développé-écarté haltères (fly press), banc plat — prise pronation',
        muscleGroup: 'PECS',
        sets: 4,
        targetReps: '8-12',
        restSeconds: 150,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '50',
        essential: true,
        notes: "★ Priorité 3. Séries : 3 en Sem 1, 4 dès la Sem 2. RIR 3 en Sem 1 → 1 en Sem 5. V5.3 : prise PRONATION (paumes vers l'avant) au lieu de la prise neutre. Hybride développé/écarté : coudes semi-fléchis, arc de cercle, jamais d'écarté bras tendus (étirement du deltoïde antérieur). Les coudes ne descendent pas sous le plan du tronc. ⚠ Plafond de 25 kg par haltère = 50 kg au total : départ à 47 kg (23,5 kg par haltère), le cran suivant (50 kg) est déjà le plafond. Une fois atteint, la progression passe par les reps (cible = réel + 1) puis par une pause de 2 s en bas : ce sera le premier frein du mésocycle sur les pecs. Écris la charge réellement tenue. Sem 5 : dernière série en partiels en position étirée (5 reps sur le tiers bas, coudes semi-fléchis). Tempo 3-1-1. Échauffement : 2 séries.",
      },
      {
        id: 'push-a-2',
        name: 'Dips (station), lestés au gilet',
        muscleGroup: 'PECS',
        sets: 3,
        targetReps: '8-15',
        restSeconds: 150,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC+10',
        essential: true,
        notes: "Gilet plein (10 kg) : la progression passe par les répétitions (cible = réel + 1), vraie fourchette 8-15. RIR 3 en Sem 1 → 1 en Sem 5. Mouvement le plus exposant pour le deltoïde antérieur : épaules basses, pas de descente au-delà de l'étirement confortable ; c'est le premier exercice à sortir si une gêne revient. Aucune technique d'intensification. Tempo 3-0-1. Échauffement : 1 série.",
      },
      {
        id: 'push-a-4',
        name: 'Pompes sur poignées / haltères (amplitude complète)',
        muscleGroup: 'PECS',
        sets: 3,
        targetReps: '12-20',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC',
        essential: false,
        notes: "Les poignées laissent la poitrine descendre sous le niveau des mains : seule façon d'obtenir un vrai étirement du pec au poids du corps. Progression en répétitions (cible = réel + 1) ; à 3 × 20 → +5 kg de gilet et cibles −2. RIR 3 en Sem 1 → 1 en Sem 5. Aucune technique d'intensification. Tempo 3-1-1. Échauffement : 1 série.",
      },
      {
        id: 'push-a-1',
        name: 'Extension triceps poulie haute, barre droite prise pronation',
        muscleGroup: 'TRICEPS',
        sets: 4,
        targetReps: '10-15',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '22.5',
        essential: true,
        notes: "★ Priorité 2, placé après les poussées (un triceps pré-fatigué ferait échouer les dips avant le pec). Séries : 3 en Sem 1, 4 dès la Sem 2. RIR 2 en Sem 1 → 0 en Sem 5. V5.3 : barre droite en pronation à la place de la corde (prise neutre) — même exercice qu'au Push B. Double progression, cran de pile 2,5 kg. Écris la charge réellement tenue. Coudes au corps, humérus vertical et immobile. Sem 5 : dernière série en drop set (−30 % de charge, enchaîné jusqu'à l'échec). Tempo 2-0-1. Échauffement : 1 série.",
      },
    ],
  },
  // ── LEGS A — Fessiers / Mollets debout / Quadriceps stade 1 / Abdos ──────
  {
    id: 'legs-a-v5',
    dayNumber: 3,
    name: 'Legs A',
    focus: "Les jambes reviennent : échauffement de souplesse et d'activation du genou, fessiers (hip thrust, abduction) en priorité 1 du bas du corps, mollets debout en priorité 2, quadriceps au stade 1 (charge fixe, RIR 4), abdos. Tout est unilatéral, aucune technique d'intensification",
    muscleGroups: 'Genou (échauffement) / Fessiers / Mollets / Quadriceps / Abdos',
    estimatedDuration: '≈ 61 min',
    exercises: [
      {
        id: 'legs-a-v5-1',
        name: 'Mobilisation rotulienne auto-appliquée',
        muscleGroup: 'GENOU — MOBILITÉ',
        sets: 1,
        targetReps: '10 /sens ×4 sens',
        restSeconds: 15,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '—',
        essential: false,
        notes: "Échauffement du genou, avant toute charge (≈ 6 min pour les 4 blocs de mobilité). Mobilisation manuelle de la rotule dans ses 4 axes (haut/bas/interne/externe), genou détendu en extension complète. Aucune charge, aucun RIR : seul le seuil de douleur < 3/10 encadre l'exercice (non croissante, disparue le lendemain). À refaire chaque matin si le genou est raide (2 min). Tempo lent.",
      },
      {
        id: 'legs-a-v5-2',
        name: 'Dorsiflexion cheville au mur',
        muscleGroup: 'GENOU — MOBILITÉ',
        sets: 2,
        targetReps: '10 /jambe',
        restSeconds: 15,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '—',
        essential: false,
        notes: "La profondeur d'accroupissement dépend de la cheville autant que du genou. Genou dirigé vers le mur sans décoller le talon ; note la distance orteil-mur à droite et à gauche. Le talon ne décolle JAMAIS du sol. Douleur < 3/10. Tempo 2-1-1.",
      },
      {
        id: 'legs-a-v5-3',
        name: 'Heel slides',
        muscleGroup: 'GENOU — MOBILITÉ',
        sets: 1,
        targetReps: '12 /jambe',
        restSeconds: 15,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '—',
        essential: false,
        notes: "Allongé sur le dos, glisser le talon vers la fesse puis revenir en extension complète, sans forcer au point de blocage. Vise l'amplitude de flexion : compare droite et gauche, c'est un des critères du stade 2. Une sensation d'accrochage net est un signal d'arrêt. Douleur < 3/10. Tempo lent.",
      },
      {
        id: 'legs-a-v5-4',
        name: 'Terminal knee extension élastique (activation)',
        muscleGroup: 'GENOU — ACTIVATION',
        sets: 2,
        targetReps: '15-20 /jambe',
        restSeconds: 15,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'Élastique léger',
        essential: false,
        notes: "Active le quadriceps avant la poulie : l'inhibition musculaire freine son recrutement après une atteinte du genou. Élastique fixé bas, boucle derrière le genou tendu : pousser en extension complète et tenir 1 s en verrouillage haut. Point de contrôle : le verrouillage COMPLET du genou, sans flexion résiduelle. Douleur < 3/10. Tempo 2-1-2.",
      },
      {
        id: 'legs-a-v5-5',
        name: 'Hip thrust unilatéral (épaules sur le banc, haltère sur la hanche)',
        muscleGroup: 'FESSIERS',
        sets: 3,
        targetReps: '10-15 /jambe',
        restSeconds: 60,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '11.5',
        essential: true,
        notes: "★ Fessier n°1 du bas du corps. Séries : 2 en Sem 1, 3 en Sem 2-3, 4 dès la Sem 4. RIR 3-4 en Sem 1 → 2 en Sem 5. Flexion de genou modérée et STATIQUE, aucune flexion profonde, aucun cisaillement : le hip thrust fait grossir le fessier autant que le squat sans charger le genou en flexion. Pause de 2 s en haut, bassin en rétroversion, talon sous le genou en haut du mouvement. Repère : 11,5 kg en 12-15 à RIR 2-3 ; recalibre si la série 1 sort hors fourchette. Double progression, cran de 1,5 kg. Plafond 25 kg par haltère : une fois atteint, gilet 10 kg en plus sur le bassin. Repos 60 s entre chaque côté (≈ 155 s réels par jambe). Aucune technique d'intensification sur le bas du corps. Tempo 2-0-1-2. Échauffement : 1 série.",
      },
      {
        id: 'legs-a-v5-6',
        name: 'Abduction hanche câble unilatéral',
        muscleGroup: 'FESSIERS',
        sets: 3,
        targetReps: '15-20 /jambe',
        restSeconds: 30,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '5',
        essential: false,
        notes: "Moyen fessier, buste légèrement incliné vers l'avant. Passe du contrôle moteur à un vrai travail d'hypertrophie : RIR 3-4 en Sem 1 → 2 en Sem 4-5. Séries : 2 en Sem 1-2, 3 dès la Sem 3. Double progression, cran de pile 2,5 kg. Le genou d'appui reste aligné sur le pied (jamais de valgus). Repos 30 s entre chaque côté. Si la séance déborde, c'est avec le crunch câble le premier exercice à sortir. Tempo 2-1-1. Aucune technique d'intensification sur le bas du corps.",
      },
      {
        id: 'legs-a-v5-7',
        name: 'Extensions mollets debout unilatéral (marche, haltère en main)',
        muscleGroup: 'MOLLETS',
        sets: 3,
        targetReps: '10-15 /jambe',
        restSeconds: 45,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '11.5',
        essential: true,
        notes: "★ Priorité 2 du bas du corps (gastrocnémiens). Séries : 2 en Sem 1, 3 en Sem 2-3, 4 dès la Sem 4. RIR 3-4 en Sem 1 → 2 en Sem 5. Genou TENDU (mais pas verrouillé en hyperextension), avant-pied sur la marche, pause de 2 s talon au plus bas : la position étirée est celle qui fait grossir le mollet, ne la sacrifie jamais pour une rep de plus. Main libre sur un appui pour l'équilibre. Double progression, cran de 1,5 kg. Repos 45 s entre chaque côté (≈ 125 s réels par jambe). Aucune technique d'intensification. Tempo 2-2-1-1. Échauffement : 1 série.",
      },
      {
        id: 'legs-a-v5-8',
        name: 'Leg extension unilatéral poulie basse (assis sur le banc, sangle de cheville)',
        muscleGroup: 'QUADRICEPS',
        sets: 2,
        targetReps: '15-20 /jambe',
        restSeconds: 45,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '5',
        essential: false,
        notes: "STADE 1 du protocole genou : charge minimale de la pile, 2 × 15-20 à RIR 4, tempo 3-1-3. Ce n'est pas encore de l'hypertrophie, c'est la réintroduction de la charge sur l'articulation : la charge ne bouge pas du mésocycle. Douleur 0-1/10 pendant et 48 h après → la semaine compte pour le passage au stade 2 (4 semaines consécutives sans douleur). ⚠ Douleur > 2/10 pendant l'effort, gonflement ou raideur > 24 h → arrêt et retour à la mobilité pure pendant 2 semaines minimum. Repos 45 s entre chaque côté.",
      },
      {
        id: 'legs-a-v5-9',
        name: 'Crunch câble à genoux',
        muscleGroup: 'ABDOS',
        sets: 3,
        targetReps: '12-15',
        restSeconds: 60,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '15',
        essential: false,
        notes: "Enrouler la colonne vertèbre par vertèbre, hanches fixes. Coussin sous les genoux ; si le genou proteste, version debout dos à la poulie. RIR 2-3 en Sem 1 → 1 en Sem 5. Double progression, cran de pile 2,5 kg. Si la séance déborde, avec l'abduction c'est le premier exercice à sortir. Tempo 2-1-1.",
      },
      {
        id: 'legs-a-v5-10',
        name: 'Reverse crunch (enroulement bassin)',
        muscleGroup: 'ABDOS',
        sets: 3,
        targetReps: '12-20',
        restSeconds: 60,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC',
        essential: false,
        notes: "Enrouler le bassin vers le sternum, sans élan des jambes. Progression en répétitions (cible = réel + 1). RIR 2-3 en Sem 1 → 1 en Sem 5. Tempo 2-1-1.",
      },
    ],
  },
  // ── PULL B — Deltoïde postérieur / Dos / Biceps / Latéral ────────────────
  {
    id: 'pull-b',
    dayNumber: 4,
    name: 'Pull B',
    focus: "2ᵉ dose de postérieur (face pull barre droite), dos en tractions supination lestées puis tirage vertical lourd à excentrique de 3 s, curl incliné en supination stricte, finitions postérieur et latéral",
    muscleGroups: 'Deltoïde postérieur / Dos / Biceps / Latéral',
    estimatedDuration: '≈ 60 min',
    exercises: [
      {
        id: 'pull-b-4',
        name: 'Face pull poulie haute, barre droite prise pronation',
        muscleGroup: 'DELTOÏDE POSTÉRIEUR',
        sets: 4,
        targetReps: '12-20',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '25',
        essential: true,
        notes: "★ Priorité 1. Séries : 3 en Sem 1-2, 4 dès la Sem 3. RIR 2-3 en Sem 1 → 0-1 en Sem 5. V5.3 : barre droite en pronation à la place de la corde (prise neutre). Tire vers le haut du front, coudes hauts et au-dessus des poignets, tirage vers l'arrière et non vers le haut. Double progression, cran de pile 2,5 kg ; écris la charge réellement tenue. Sem 5 : dernière série en partiels en position étirée (5 reps sur le tiers bas d'amplitude après l'échec). Tempo 2-1-1. Échauffement : 1 série.",
      },
      {
        id: 'pull-b-1',
        name: 'Tractions supination lestées (barre)',
        muscleGroup: 'DOS',
        sets: 3,
        targetReps: '6-12',
        restSeconds: 180,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC+9',
        essential: true,
        notes: "Priorité 4, placées tôt (biceps frais). C'est ta meilleure prise : on la garde telle quelle. Le lest est déjà à 9 kg sur un gilet de 10 kg : la progression passe par les répétitions (cible = réel + 1). RIR 3 en Sem 1 → 1 en Sem 5. Amorce scapulaire avant chaque répétition, pas de départ en suspension passive. Aucune technique d'intensification. Tempo 3-0-1. Échauffement : 1 série.",
      },
      {
        id: 'pull-b-2',
        name: 'Curl incliné haltères (banc 45°), supination stricte',
        muscleGroup: 'BICEPS',
        sets: 3,
        targetReps: '10-15',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '20',
        essential: true,
        notes: "★ Priorité 2. V5.3 : seul curl conservé du Pull B, 3 séries (5 prévues en Sem 5 avant V5.3), supination stricte, RIR 3. EXERCICE À TESTER : première série sans charge ou très légère ; si zéro douleur, reprends la charge de référence en gardant RIR 3 (départ conseillé : un cran en dessous). Toute douleur ≥ 1/10 pendant ou après = arrêt de l'exercice et pause totale des biceps jusqu'à la fin de la décharge. Charge gelée : la progression se fait en répétitions seulement (cible +1, plafond 15) ; baisse d'un cran (3 kg) si la série 1 tombe sous 10. Sur banc à 45°, l'humérus part derrière le plan du tronc : étirement du chef long qui croise l'épaule ; si l'épaule gêne, retour au curl debout en supination. Aucune technique d'intensification. Tempo 3-0-1.",
      },
      {
        id: 'pull-b-10',
        name: 'Tirage vertical poulie haute, barre large, excentrique 3 s',
        muscleGroup: 'DOS',
        sets: 3,
        targetReps: '8-12',
        restSeconds: 150,
        restMode: 'normal',
        isSuperset: false,
        essential: true,
        notes: "NOUVEAU en V5.0 : remplace les tractions prise large en excentrique 4-5 s. Version lourde du tirage du Pull A : fourchette 8-12, donc ≈ 1 à 2 crans au-dessus. C'est le travail de force spécifique qui manquait aux tractions : même trajectoire, même prise, mais une charge que tu peux monter cran par cran. CALIBRAGE : ≈ 10 reps à RIR 2-3. RIR 2-3 en Sem 1 → 0-1 en Sem 5. Double progression, cran de pile 2,5 kg. Objectif de fin de mésocycle : tirer ≈ 85 % de ton poids de corps sur 8 reps. Pas de cale-cuisses : haltère lourd en travers des cuisses si la charge te soulève. Tempo 3-1-1 (descente contrôlée de 3 s). Échauffement : 1 série.",
      },
      {
        id: 'pull-b-5',
        name: 'Oiseau haltères buste penché',
        muscleGroup: 'DELTOÏDE POSTÉRIEUR — FINITION',
        sets: 3,
        targetReps: '12-20',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '20',
        essential: false,
        notes: "2ᵉ dose de postérieur de la rotation. Séries : 3 de la Sem 1 à la Sem 3, 4 dès la Sem 4. RIR 2-3 en Sem 1 → 0-1 en Sem 5. Double progression, cran de 3 kg. Maintien lombaire isométrique : dos plat, genoux fléchis ; si le bas du dos parle avant l'épaule, bascule sur la version poitrine appuyée du Pull A. Tempo 2-1-1.",
      },
      {
        id: 'pull-b-6',
        name: 'Élévations latérales haltères (debout, séries longues)',
        muscleGroup: 'DELTOÏDE LATÉRAL — FINITION',
        sets: 3,
        targetReps: '15-25',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '20',
        essential: false,
        notes: "3ᵉ dose hebdomadaire de latéral : séries longues et charge basse en toute fin de séance, coût de fatigue quasi nul. Séries : 3 de la Sem 1 à la Sem 3, 4 dès la Sem 4. RIR 2-3 en Sem 1 → 0-1 en Sem 5. Double progression, cran de 3 kg. Au premier signal douloureux à l'épaule, c'est cette 3ᵉ dose qu'on supprime en premier. Sem 5 : dernière série en partiels sur la moitié BASSE d'amplitude après l'échec. Tempo 2-1-1.",
      },
    ],
  },
  // ── PUSH B — Deltoïde latéral ×2 / Pecs / Triceps ────────────────────────
  {
    id: 'push-b',
    dayNumber: 5,
    name: 'Push B',
    focus: "2ᵉ dose de latéral (haltères assis + poulie basse en fin de séance), pecs 100 % poids du corps (pompes lestées en mouvement principal), triceps en barre droite pronation + pompes diamant",
    muscleGroups: 'Deltoïde latéral ×2 / Pecs / Triceps',
    estimatedDuration: '≈ 54 min',
    exercises: [
      {
        id: 'push-b-6',
        name: 'Élévations latérales haltères assis',
        muscleGroup: 'DELTOÏDE LATÉRAL',
        sets: 4,
        targetReps: '12-20',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '20',
        essential: true,
        notes: "★ Priorité 1, 2ᵉ dose principale du latéral. Séries : 3 en Sem 1-2, 4 en Sem 3-4, 5 en Sem 5. RIR 2-3 en Sem 1 → 0-1 en Sem 5. Version ASSISE, dossier vertical : aucun élan possible. Assis, toute compensation viendrait des trapèzes : si tu hausses les épaules, la charge est trop lourde. Double progression, cran de 3 kg. Sem 5 : dernière série en partiels sur la moitié BASSE d'amplitude après l'échec. Tempo 2-1-1. Échauffement : 1 série.",
      },
      {
        id: 'push-b-2',
        name: 'Pompes lestées (gilet, mains largeur pecs)',
        muscleGroup: 'PECS',
        sets: 4,
        targetReps: '12-20',
        restSeconds: 150,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC+11',
        essential: true,
        notes: "Mouvement de poussée principal de la séance, 100 % poids du corps. Séries : 3 en Sem 1-2, 4 dès la Sem 3. RIR 3 en Sem 1 → 1 en Sem 5. Lest au maximum : la progression passe par les répétitions (cible = réel + 1). Mains au sol : les coudes ne descendent pas sous le plan du tronc, la poussée la plus sûre pour l'épaule. Aucune technique d'intensification. Tempo 3-0-1. Échauffement : 1 série.",
      },
      {
        id: 'push-b-1',
        name: 'Extension triceps poulie haute, barre droite prise pronation',
        muscleGroup: 'TRICEPS',
        sets: 4,
        targetReps: '10-15',
        restSeconds: 120,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '22.5',
        essential: true,
        notes: "★ Priorité 2. Séries : 3 en Sem 1-2, 4 en Sem 3, 5 dès la Sem 4. RIR 2 en Sem 1 → 0 en Sem 5. Même exercice qu'au Push A. Double progression, cran de pile 2,5 kg. Coude au corps, épaule neutre. Sem 5 : dernière série en drop set (−30 % de charge, enchaîné jusqu'à l'échec). Tempo 2-0-1. Échauffement : 1 série.",
      },
      {
        id: 'push-a-5',
        name: 'Pompes diamant (mains serrées)',
        muscleGroup: 'TRICEPS — FINITION',
        sets: 3,
        targetReps: '12-20',
        restSeconds: 90,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC',
        essential: false,
        notes: "Triceps chef long et médial, coudes au corps, épaule quasi neutre. Progression en répétitions ; à 3 × 20 → +5 kg de gilet. RIR 2-3 en Sem 1 → 0-1 en Sem 5. Aucune technique d'intensification. Tempo 2-0-1.",
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
        defaultWeight: '7.5',
        essential: false,
        notes: "Résistance continue et tension en position étirée, bras le long du corps. Câble DEVANT le corps : l'humérus ne part pas en extension, ce qui ménage le deltoïde antérieur. 2 côtés enchaînés puis 90 s (≈ 125 s de repos réel par côté). Reps par bras. Départ à 7,5 kg, à recalibrer ; double progression, cran de pile 2,5 kg. RIR 2-3 en Sem 1 → 0-1 en Sem 5. Pas d'élan, buste immobile, main libre en appui ; la main ne dépasse pas le plan de l'épaule. Dernière dose de latéral à sortir si l'épaule gêne : c'est la version la plus douce. Tempo 2-1-1.",
      },
    ],
  },
  // ── LEGS B — Fessiers + ischios / Mollets assis / Quadriceps stade 1 ─────
  {
    id: 'legs-b-v5',
    dayNumber: 6,
    name: 'Legs B',
    focus: "Souplesse du genou, fessiers et ischios (soulevé de terre jambe tendue, kickback), mollets assis (soléaire), quadriceps au stade 1 (split squat statique), gainage anti-rotation. Tout est unilatéral, aucune technique d'intensification",
    muscleGroups: 'Fessiers / Ischios / Mollets / Quadriceps / Abdos',
    estimatedDuration: '≈ 52 min',
    exercises: [
      {
        id: 'legs-b-v5-1',
        name: 'Étirement quadriceps / psoas (couch stretch)',
        muscleGroup: 'GENOU — SOUPLESSE',
        sets: 2,
        targetReps: '45 s /jambe',
        restSeconds: 15,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '45',
        essential: false,
        notes: "Souplesse du genou en flexion (≈ 4 min avec le squat profond). Genou arrière au sol ou sur coussin, tibia contre un support, bassin en rétroversion pour isoler le droit fémoral et le psoas plutôt que cambrer le bas du dos. Tiraillement musculaire normal ; douleur articulaire < 3/10, sinon repositionne l'appui ou arrête. Pas de progression chronométrée : ajuste le confort de l'appui.",
      },
      {
        id: 'legs-b-v5-2',
        name: 'Squat profond assisté tenu (geste cible)',
        muscleGroup: 'GENOU — GESTE CIBLE',
        sets: 2,
        targetReps: 'max s tenu',
        restSeconds: 30,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '—',
        essential: true,
        notes: "C'est le TEST du stade 2 : accroupissement complet tenu SANS appui des bras et sans douleur, sur deux séances de suite. Note la durée et le niveau d'appui des bras. Descente lente, arrêt à la profondeur où la douleur reste < 3/10, tenue, remontée en t'aidant des bras autant que nécessaire. Progression = profondeur atteinte et/ou temps tenu et réduction de l'appui des bras ; ne cherche pas la profondeur maximale d'emblée. Arrêt à la première douleur > 3/10 ou sensation d'instabilité.",
      },
      {
        id: 'legs-b-v5-3',
        name: 'Soulevé de terre jambe tendue unilatéral (haltère)',
        muscleGroup: 'ISCHIOS',
        sets: 3,
        targetReps: '8-12 /jambe',
        restSeconds: 60,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '13',
        essential: true,
        notes: "★ Fessiers / ischios (priorité 1 du bas du corps). Séries : 2 en Sem 1-2, 3 dès la Sem 3. RIR 3-4 en Sem 1 → 2 en Sem 5. Grand fessier et ischios en position allongée. Genou d'appui légèrement fléchi (15-20°) et FIXE : le genou ne travaille pas, c'est la hanche qui recule. Dos NEUTRE gainé : la série s'arrête quand le bas du dos s'arrondit, pas quand les ischios lâchent. Repère : 13 kg en 10-12 à RIR 2-3. Double progression, cran de 1,5 kg (plafond 25 kg). Main libre en appui si l'équilibre limite. Premier exercice de fessier à sortir si le genou réagit. Repos 60 s entre chaque côté. Aucune technique d'intensification. Tempo 3-1-1. Échauffement : 1 série.",
      },
      {
        id: 'legs-b-v5-4',
        name: 'Kickback fessier poulie basse unilatéral (sangle de cheville)',
        muscleGroup: 'FESSIERS',
        sets: 3,
        targetReps: '12-20 /jambe',
        restSeconds: 30,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '5',
        essential: false,
        notes: "Buste penché, mains sur la poulie, hanche en extension complète avec 1 s de contraction. Genou presque tendu : aucune contrainte articulaire. Séries : 2 en Sem 1, 3 dès la Sem 2. RIR 3-4 en Sem 1 → 2 en Sem 5. Double progression, cran de pile 2,5 kg. Repos 30 s entre chaque côté. Aucune technique d'intensification. Tempo 2-1-1.",
      },
      {
        id: 'legs-b-v5-5',
        name: 'Extensions mollets assis unilatéral (haltère sur la cuisse)',
        muscleGroup: 'MOLLETS',
        sets: 3,
        targetReps: '15-20 /jambe',
        restSeconds: 45,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '22',
        essential: true,
        notes: "★ Priorité 2 du bas du corps (soléaire), genou à 90°. Séries : 2 en Sem 1-2, 3 en Sem 3, 4 dès la Sem 4. RIR 3-4 en Sem 1 → 2 en Sem 5. Haltère sur le BAS DE LA CUISSE, jamais sur la rotule (serviette pliée dessous). Pause de 2 s talon au plus bas, position étirée. Repère : 22 kg en 15-20. Double progression, cran de 1,5 kg ; au plafond de 25 kg, gilet posé sur la cuisse en plus de l'haltère. Repos 45 s entre chaque côté. Aucune technique d'intensification. Tempo 2-2-1-1. Échauffement : 1 série.",
      },
      {
        id: 'legs-b-v5-6',
        name: 'Split squat statique au poids du corps (amplitude indolore)',
        muscleGroup: 'QUADRICEPS',
        sets: 2,
        targetReps: '12-15 /jambe',
        restSeconds: 45,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: 'PDC',
        essential: false,
        notes: "STADE 1 du protocole genou (remplace la presse légère du plan, absente du matériel). 2 × 12-15 à RIR 4 du début à la fin. Amplitude limitée à la zone indolore, appui d'une main autorisé, buste vertical. C'est le pont vers le squat bulgare du stade 2. Aucune progression de charge : l'amplitude peut augmenter si la douleur reste à 0-1/10. ⚠ Douleur > 2/10 pendant l'effort, gonflement ou raideur > 24 h → arrêt et retour à la mobilité pure pendant 2 semaines minimum. Repos 45 s entre chaque côté. Tempo 3-1-1.",
      },
      {
        id: 'legs-b-v5-7',
        name: 'Pallof press poulie basse',
        muscleGroup: 'ABDOS — ANTI-ROTATION',
        sets: 3,
        targetReps: '10-15 /côté',
        restSeconds: 30,
        restMode: 'normal',
        isSuperset: false,
        defaultWeight: '10',
        essential: false,
        notes: "Anti-rotation : poulie basse, câble perpendiculaire au buste, pousser bras tendus devant soi sans laisser le buste pivoter vers la poulie — c'est la résistance à la rotation qui est l'exercice. Reps par côté ; bassin et épaules immobiles, bras tendus 2 s. RIR 2-3 en Sem 1 → 1 en Sem 5. Double progression, cran de pile 2,5 kg. Repos 30 s entre chaque côté. Tempo 2-1-2.",
      },
    ],
  },
];

// Toutes les séances de tous les programmes intégrés (Strict V5.3 + les
// programmes additionnels de extraPrograms.ts) — sert uniquement à la
// recherche par id ci-dessous, pour que l'historique/les écrans puissent
// toujours retrouver une séance même si le programme actif a changé
// depuis (voir workoutStore.ts → activeProgramId). Les anciennes générations
// de séances Legs y figurent pour que l'historique déjà enregistré sous leurs
// ids reste lisible malgré les changements d'exercices — voir
// legacyWorkouts.ts : LEGACY_LEGS_WORKOUTS ('legs-a'/'legs-b', avant le
// 19/08/2026), LEGACY_LEGS_V3_WORKOUTS ('legs-a-v3'/'legs-b-v3', 30/08 →
// 13/09/2026) et LEGACY_LEGS_REHAB_WORKOUTS ('legs-a-rehab'/'legs-b-rehab',
// 13/09 → 03/11/2026). LEGACY_STRICT_RETIRED_WORKOUTS ne sert qu'à retrouver
// le nom et le muscle des exercices retirés en V5.3 (voir utils/muscleMap.ts).
const ALL_KNOWN_WORKOUTS: WorkoutDay[] = [
  ...WORKOUTS,
  ...LEGACY_LEGS_WORKOUTS,
  ...LEGACY_LEGS_V3_WORKOUTS,
  ...LEGACY_LEGS_REHAB_WORKOUTS,
  ...LEGACY_STRICT_RETIRED_WORKOUTS,
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
