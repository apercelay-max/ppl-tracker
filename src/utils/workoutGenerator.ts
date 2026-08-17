import { EXERCISE_CATALOG, type CatalogExercise, type Equipment } from '../data/exercisesCatalog';
import type { Exercise, WorkoutDay } from '../data/types';
import type { Program } from '../data/programs';
import { useWorkoutStore } from '../store/workoutStore';
import { setCustomWorkouts } from '../data/workouts';

/**
 * Générateur de programme : construit un programme complet (plusieurs séances)
 * à partir du catalogue d'exercices et des préférences de l'utilisateur.
 *
 * Rien n'est inventé ici — le générateur ne fait que SÉLECTIONNER des exercices
 * réels du catalogue et leur appliquer un schéma séries/reps/repos classique.
 * S'il ne trouve pas assez d'exercices (matériel trop limité par exemple), il
 * le dit dans `warnings` plutôt que de compléter avec n'importe quoi.
 */

// ─── Préférences ─────────────────────────────────────────────────────────────

export type Goal = 'force' | 'hypertrophie' | 'endurance';
export type SplitKind = 'auto' | 'fullbody' | 'upper-lower' | 'ppl';
export type Level = 'Débutant' | 'Intermédiaire' | 'Avancé';

export interface GeneratorPrefs {
  /** Nombre de séances par semaine (2 à 6). */
  daysPerWeek: number;
  /** Découpage voulu ; 'auto' choisit selon daysPerWeek. */
  split: SplitKind;
  /** Matériel disponible. Liste vide = aucune restriction. */
  equipment: Equipment[];
  /** Durée cible d'une séance, en minutes. */
  sessionMinutes: number;
  level: Level;
  goal: Goal;
  /** Groupes musculaires à prioriser (un exercice de plus quand la place le permet). */
  priorityGroups: string[];
  /** Exercices du catalogue à ne jamais proposer (ids du catalogue). */
  excludedIds: string[];
  /** Graine aléatoire — change à chaque "Régénérer" pour varier les choix. */
  seed: number;
}

export const DEFAULT_PREFS: GeneratorPrefs = {
  daysPerWeek: 4,
  split: 'auto',
  equipment: [],
  sessionMinutes: 60,
  level: 'Intermédiaire',
  goal: 'hypertrophie',
  priorityGroups: [],
  excludedIds: [],
  seed: 1,
};

// ─── Schémas séries / reps / repos ───────────────────────────────────────────

interface Scheme { sets: number; reps: string; rest: number; }

/**
 * Schémas classiques par objectif. Le polyarticulaire prend plus de repos que
 * l'isolation — c'est la seule règle qui change entre les deux.
 */
const SCHEMES: Record<Goal, { compound: Scheme; isolation: Scheme }> = {
  force: {
    compound: { sets: 5, reps: '5', rest: 180 },
    isolation: { sets: 3, reps: '8', rest: 120 },
  },
  hypertrophie: {
    compound: { sets: 4, reps: '6-10', rest: 150 },
    isolation: { sets: 3, reps: '10-15', rest: 90 },
  },
  endurance: {
    compound: { sets: 3, reps: '15-20', rest: 75 },
    isolation: { sets: 3, reps: '15-20', rest: 60 },
  },
};

/** Un exercice de gainage se compte en secondes, pas en répétitions. */
const HOLD_SCHEME: Scheme = { sets: 3, reps: '30-45 s', rest: 60 };

/** Secondes de travail estimées pour une série (hors repos). */
const SECONDS_PER_SET = 45;
/** Échauffement forfaitaire retiré du temps disponible. */
const WARMUP_MINUTES = 6;

// ─── Découpages ──────────────────────────────────────────────────────────────

interface DayTemplate {
  name: string;
  focus: string;
  typeLabel: string;
  accent: string;
  /** Groupes musculaires travaillés, dans l'ordre de passage. */
  groups: string[];
}

// Ordre volontaire : les groupes les plus gros (et les polyarticulaires) en
// premier, quand on est frais.
const PUSH: DayTemplate = {
  name: 'Push', focus: 'Poussée', typeLabel: 'PUSH', accent: '#e03030',
  groups: ['PECS', 'ÉPAULES', 'TRICEPS'],
};
const PULL: DayTemplate = {
  name: 'Pull', focus: 'Tirage', typeLabel: 'PULL', accent: '#7c6fcd',
  groups: ['DOS', 'DELTOÏDE POSTÉRIEUR', 'BICEPS'],
};
const LEGS: DayTemplate = {
  name: 'Legs', focus: 'Jambes', typeLabel: 'LEGS', accent: '#e8a020',
  groups: ['QUADRICEPS', 'ISCHIO-JAMBIERS', 'FESSIERS', 'MOLLETS'],
};
const UPPER: DayTemplate = {
  name: 'Upper', focus: 'Haut du corps', typeLabel: 'UPPER', accent: '#2563eb',
  groups: ['PECS', 'DOS', 'ÉPAULES', 'BICEPS', 'TRICEPS'],
};
const LOWER: DayTemplate = {
  name: 'Lower', focus: 'Bas du corps', typeLabel: 'LOWER', accent: '#16a34a',
  groups: ['QUADRICEPS', 'ISCHIO-JAMBIERS', 'FESSIERS', 'MOLLETS', 'ABDOS'],
};
const FULL: DayTemplate = {
  name: 'Full body', focus: 'Corps entier', typeLabel: 'FULL', accent: '#ea580c',
  groups: ['QUADRICEPS', 'PECS', 'DOS', 'ÉPAULES', 'ISCHIO-JAMBIERS', 'ABDOS'],
};

/** Quel découpage pour combien de séances par semaine. */
const resolveSplit = (prefs: GeneratorPrefs): Exclude<SplitKind, 'auto'> => {
  if (prefs.split !== 'auto') return prefs.split;
  if (prefs.daysPerWeek <= 3) return 'fullbody';
  if (prefs.daysPerWeek === 4) return 'upper-lower';
  return 'ppl';
};

/**
 * Suite de séances pour la semaine. On répète le motif du découpage autant de
 * fois que nécessaire ; les séances répétées sont suffixées A, B, C… et
 * recevront des exercices différents (voir pickExercise).
 */
const buildDayTemplates = (prefs: GeneratorPrefs): DayTemplate[] => {
  const split = resolveSplit(prefs);
  const pattern =
    split === 'fullbody' ? [FULL] :
    split === 'upper-lower' ? [UPPER, LOWER] :
    [PUSH, PULL, LEGS];

  const days: DayTemplate[] = [];
  for (let i = 0; i < prefs.daysPerWeek; i++) {
    const base = pattern[i % pattern.length];
    const round = Math.floor(i / pattern.length);
    // Une seule tournée : pas de suffixe. Plusieurs : Push A, Push B…
    const suffix = prefs.daysPerWeek > pattern.length ? ` ${String.fromCharCode(65 + round)}` : '';
    days.push({ ...base, name: `${base.name}${suffix}` });
  }
  return days;
};

// ─── Sélection des exercices ─────────────────────────────────────────────────

const LEVEL_RANK: Record<Level, number> = { 'Débutant': 1, 'Intermédiaire': 2, 'Avancé': 3 };

/** PRNG déterministe (mulberry32) : même graine → même programme, régénérable. */
const makeRandom = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Exercices utilisables compte tenu du matériel, du niveau et des exclusions.
 *
 * Deux garde-fous appris en testant le générateur :
 * - le poids du corps reste toujours autorisé (avoir des haltères n'empêche pas
 *   de faire des pompes) — sans ça, choisir "Haltères" supprimait tous les abdos ;
 * - si aucun exercice n'existe au niveau demandé pour ce groupe, on élargit d'un
 *   cran plutôt que de laisser le groupe sans rien.
 */
const eligibleFor = (group: string, prefs: GeneratorPrefs): CatalogExercise[] => {
  const equipOk = (ex: CatalogExercise) =>
    prefs.equipment.length === 0 ||
    prefs.equipment.includes(ex.equipment) ||
    ex.equipment === 'Poids du corps';

  const base = EXERCISE_CATALOG.filter((ex) =>
    ex.group === group && !prefs.excludedIds.includes(ex.id) && equipOk(ex)
  );

  for (let rank = LEVEL_RANK[prefs.level]; rank <= 3; rank++) {
    const atLevel = base.filter((ex) => LEVEL_RANK[ex.level] <= rank);
    if (atLevel.length > 0) return atLevel;
  }
  return base;
};

/**
 * Choisit un exercice pour un groupe donné.
 * Priorité : polyarticulaire d'abord si demandé, puis les "essentiels", puis
 * tirage aléatoire (graine) parmi les candidats restants. `used` évite de
 * reproposer le même exercice ailleurs dans le programme.
 */
const pickExercise = (
  group: string,
  wantCompound: boolean,
  prefs: GeneratorPrefs,
  used: Set<string>,
  usedToday: Set<string>,
  rand: () => number
): CatalogExercise | null => {
  const all = eligibleFor(group, prefs);
  // `used` = déjà pris ailleurs dans le programme → on préfère varier.
  // `usedToday` = déjà dans CETTE séance → interdit, sans exception : sinon un
  // programme "élastique uniquement" sortait deux fois le même exercice.
  const sameDayOk = all.filter((ex) => !usedToday.has(ex.id));
  const fresh = sameDayOk.filter((ex) => !used.has(ex.id));
  const pool = fresh.length > 0 ? fresh : sameDayOk;
  if (pool.length === 0) return null;

  // L'ordre compte : un exercice "essentiel" du bon type d'abord, puis n'importe
  // quel essentiel. Sans cette 2e ligne avant le type, un 5x5 de biceps tombait
  // sur "Drag curl" au lieu du curl à la barre, parce que la base source classe
  // quelques curls comme polyarticulaires.
  const wantedType = wantCompound ? 'Polyarticulaire' : 'Isolation';
  const tiers = [
    pool.filter((ex) => ex.type === wantedType && ex.essential),
    pool.filter((ex) => ex.essential),
    pool.filter((ex) => ex.type === wantedType),
    pool,
  ];
  const tier = tiers.find((t) => t.length > 0);
  if (!tier) return null;
  return tier[Math.floor(rand() * tier.length)];
};

/** Durée d'un exercice (travail + repos) en secondes. */
const exerciseSeconds = (ex: Exercise) => ex.sets * (SECONDS_PER_SET + ex.restSeconds);

/** Convertit un exercice du catalogue en exercice de séance. */
const toSessionExercise = (cat: CatalogExercise, goal: Goal, setsOverride?: number): Exercise => {
  const base = cat.pattern === 'Gainage'
    ? HOLD_SCHEME
    : cat.type === 'Polyarticulaire' ? SCHEMES[goal].compound : SCHEMES[goal].isolation;
  const scheme = setsOverride ? { ...base, sets: Math.max(2, setsOverride) } : base;
  return {
    // Préfixe `cat-` : l'id reste le même d'un programme généré à l'autre, donc
    // les records et les courbes de progression se cumulent au lieu de repartir
    // de zéro à chaque régénération.
    id: `cat-${cat.id}`,
    name: cat.name,
    muscleGroup: cat.group,
    sets: scheme.sets,
    targetReps: scheme.reps,
    restSeconds: scheme.rest,
    restMode: 'normal',
    isSuperset: false,
    defaultWeight: cat.equipment === 'Poids du corps' ? 'PDC' : '',
    notes: '',
  };
};

// ─── Génération ──────────────────────────────────────────────────────────────

export interface GeneratedProgram {
  program: Program;
  /** Problèmes rencontrés, à afficher honnêtement plutôt que de les cacher. */
  warnings: string[];
}

export const generateProgram = (prefs: GeneratorPrefs, name?: string): GeneratedProgram => {
  const rand = makeRandom(prefs.seed);
  const templates = buildDayTemplates(prefs);
  const used = new Set<string>();
  const warnings: string[] = [];
  const missingGroups = new Set<string>();
  const tightDays = new Set<string>();   // séries réduites pour tenir dans le temps
  const shortDays = new Set<string>();   // groupes retirés faute de temps

  const budgetSeconds = Math.max(0, prefs.sessionMinutes - WARMUP_MINUTES) * 60;
  const workouts: WorkoutDay[] = [];
  const dayAccents: Record<string, string> = {};
  const dayTypeLabels: Record<string, string> = {};

  templates.forEach((tpl, index) => {
    const dayId = `gen-${prefs.seed}-${index + 1}`;
    const usedToday = new Set<string>();

    // ── 1er passage : un exercice par groupe du jour, polyarticulaire d'abord.
    // Chaque groupe du découpage DOIT être servi : en testant, un full body de
    // 60 min s'arrêtait après 4 exercices et ne travaillait jamais les ischios
    // ni les abdos. Plutôt que de sacrifier des groupes entiers, on réduit le
    // nombre de séries — c'est ce que ferait un vrai programme.
    const picked: CatalogExercise[] = [];
    for (const group of tpl.groups) {
      const cat = pickExercise(group, true, prefs, used, usedToday, rand);
      if (!cat) { missingGroups.add(group); continue; }
      picked.push(cat);
      usedToday.add(cat.id);
      used.add(cat.id);
    }

    const buildAt = (setsOverride?: number) =>
      picked.map((cat) => toSessionExercise(cat, prefs.goal, setsOverride));
    const costOf = (list: Exercise[]) => list.reduce((sum, e) => sum + exerciseSeconds(e), 0);

    let exercises = buildAt();
    let trimmedSets = false;
    // `setsCap` est retenu pour l'appliquer aussi à l'isolation du 2e passage :
    // 2 séries de squat suivies de 3 séries de leg extension n'aurait aucun sens.
    let setsCap: number | undefined;
    for (let cap = 4; cap >= 2 && costOf(exercises) > budgetSeconds; cap--) {
      exercises = buildAt(cap);
      setsCap = cap;
      trimmedSets = true;
    }
    // Toujours trop long même à 2 séries : là seulement on retire des exercices,
    // en gardant l'ordre (donc les gros groupes, placés en premier).
    let droppedGroups = 0;
    while (exercises.length > 1 && costOf(exercises) > budgetSeconds) {
      exercises = exercises.slice(0, -1);
      droppedGroups++;
    }
    if (trimmedSets) tightDays.add(tpl.name);
    if (droppedGroups > 0) shortDays.add(tpl.name);

    // ── 2e passage : de l'isolation tant qu'il reste du temps, groupes
    // prioritaires d'abord.
    let spent = costOf(exercises);
    const priorityFirst = [
      ...tpl.groups.filter((g) => prefs.priorityGroups.includes(g)),
      ...tpl.groups.filter((g) => !prefs.priorityGroups.includes(g)),
    ];
    for (const group of priorityFirst) {
      const cat = pickExercise(group, false, prefs, used, usedToday, rand);
      if (!cat) continue;
      const exercise = toSessionExercise(cat, prefs.goal, setsCap);
      if (spent + exerciseSeconds(exercise) > budgetSeconds) continue;
      exercises.push(exercise);
      usedToday.add(cat.id);
      used.add(cat.id);
      spent += exerciseSeconds(exercise);
    }

    const minutes = Math.round(spent / 60) + WARMUP_MINUTES;
    workouts.push({
      id: dayId,
      dayNumber: index + 1,
      name: tpl.name,
      focus: tpl.focus,
      muscleGroups: tpl.groups.join(' / '),
      estimatedDuration: `≈ ${minutes} min`,
      exercises,
    });
    dayAccents[dayId] = tpl.accent;
    dayTypeLabels[dayId] = tpl.typeLabel;
  });

  if (missingGroups.size > 0) {
    warnings.push(
      `Aucun exercice trouvé pour : ${[...missingGroups].join(', ')}. ` +
      `Élargis le matériel disponible ou monte le niveau pour couvrir ces groupes.`
    );
  }
  if (tightDays.size > 0) {
    warnings.push(
      `Séries réduites sur ${[...tightDays].join(', ')} pour tenir en ${prefs.sessionMinutes} min ` +
      `tout en travaillant tous les groupes prévus.`
    );
  }
  if (shortDays.size > 0) {
    warnings.push(
      `${prefs.sessionMinutes} min ne suffisent pas pour ${[...shortDays].join(', ')} : ` +
      `certains groupes ont dû être retirés. Allonge la séance ou passe à un découpage ` +
      `avec plus de séances par semaine.`
    );
  }

  const splitLabel = resolveSplit(prefs) === 'fullbody' ? 'Full body'
    : resolveSplit(prefs) === 'upper-lower' ? 'Upper / Lower' : 'Push / Pull / Legs';

  const program: Program = {
    id: `genere-${prefs.seed}`,
    name: name?.trim() || `${splitLabel} ${prefs.daysPerWeek}x`,
    focusLabel: `${splitLabel} · ${goalLabel(prefs.goal)}`,
    shortDescription:
      `${prefs.daysPerWeek} séances/semaine, ${splitLabel.toLowerCase()}, ` +
      `~${prefs.sessionMinutes} min, niveau ${prefs.level.toLowerCase()}.`,
    source:
      'Programme construit automatiquement par l\'appli à partir du catalogue d\'exercices ' +
      'et de tes préférences. Ce n\'est pas un programme d\'un coach ni la copie d\'une méthode ' +
      'existante — à ajuster selon ton ressenti.',
    isCustom: true,
    workouts,
    dayAccents,
    dayTypeLabels,
  };

  return { program, warnings };
};

const goalLabel = (goal: Goal): string =>
  goal === 'force' ? 'Force' : goal === 'endurance' ? 'Endurance' : 'Hypertrophie';

// ─── Ajout d'un exercice à une séance existante ──────────────────────────────

/**
 * Renvoie une copie du programme avec un exercice du catalogue ajouté à la fin
 * d'une de ses séances. Ne modifie rien sur place (le store remplace l'objet).
 * Si l'exercice est déjà dans la séance, le programme est renvoyé inchangé.
 */
export const addCatalogExerciseToWorkout = (
  program: Program,
  dayId: string,
  cat: CatalogExercise,
  goal: Goal = 'hypertrophie'
): Program => {
  const exercise = toSessionExercise(cat, goal);
  return {
    ...program,
    workouts: program.workouts.map((w) => {
      if (w.id !== dayId) return w;
      if (w.exercises.some((e) => e.id === exercise.id)) return w;
      return { ...w, exercises: [...w.exercises, exercise] };
    }),
  };
};

/** Retire un exercice d'une séance (par id d'exercice de séance). */
export const removeExerciseFromWorkout = (
  program: Program,
  dayId: string,
  exerciseId: string
): Program => ({
  ...program,
  workouts: program.workouts.map((w) =>
    w.id === dayId ? { ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) } : w
  ),
});

// ─── Résumé pour l'écran ─────────────────────────────────────────────────────

/** Nombre de séries par groupe musculaire sur toute la semaine du programme. */
export const weeklySetsByGroup = (program: Program): { group: string; sets: number }[] => {
  const totals: Record<string, number> = {};
  for (const w of program.workouts) {
    for (const ex of w.exercises) {
      totals[ex.muscleGroup] = (totals[ex.muscleGroup] ?? 0) + ex.sets;
    }
  }
  return Object.entries(totals)
    .map(([group, sets]) => ({ group, sets }))
    .sort((a, b) => b.sets - a.sets);
};

/**
 * Remplace un programme importé et resynchronise le registre des séances.
 *
 * Vit ici plutôt que dans un composant : le catalogue d'exercices comme le
 * panneau des programmes en ont besoin, et les faire s'importer l'un l'autre
 * créerait un cycle de modules.
 */
export const replaceCustomProgram = (updated: Program) => {
  const { customPrograms } = useWorkoutStore.getState();
  const next = customPrograms.map((p) => (p.id === updated.id ? updated : p));
  useWorkoutStore.setState({ customPrograms: next });
  // Indispensable : c'est ce registre que getWorkout() interroge pour retrouver
  // une séance importée. Sans ça, la séance modifiée resterait introuvable.
  setCustomWorkouts(next.flatMap((p) => p.workouts));
};
