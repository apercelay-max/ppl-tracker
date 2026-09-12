// ─── Modifications de programme proposées par le coach IA ─────────────────
//
// Le coach peut proposer de changer le programme ; il ne le change jamais
// lui-même. Ce module fait les trois choses qui rendent ça sûr :
//
//   1. `buildProgramView` : ce qu'on montre au modèle (les vrais identifiants,
//      sinon il invente des exercices qui n'existent pas).
//   2. `validateProposal` : ce qu'on accepte de sa réponse. Chaque opération
//      est vérifiée contre le programme réel ET contre les garde-fous ado.
//      Une opération douteuse est REJETÉE, pas corrigée en silence.
//   3. `applyOps` : l'application, sur une COPIE du programme. L'original
//      reste dans la liste des programmes, on peut y revenir.
//
// Principe repris du reste du coach : le texte vient du modèle, les chiffres
// et le « avant → après » sont calculés ici, à partir du programme réel. Comme
// ça, ce qui s'affiche dans la carte de validation est vrai par construction —
// même le jour où le modèle raconte n'importe quoi.

import type { Exercise, WorkoutDay } from '../data/types';
import type { Program } from '../data/programs';
import { parseRepRange } from './training';
import { findCatalogExercise } from './catalogMatch';
import { EXERCISE_CATALOG } from '../data/exercisesCatalog';
import type { CatalogExercise } from '../data/exercisesCatalog';
import { addCatalogExerciseToWorkout, removeExerciseFromWorkout } from './workoutGenerator';

// ─── Garde-fous ───────────────────────────────────────────────────────────
//
// Ce sont les mêmes repères que utils/coach.ts, mais appliqués ici comme des
// LIMITES DURES, pas comme des conseils : le modèle a le droit de se tromper,
// le validateur n'a pas le droit de le laisser passer.

export const PATCH_LIMITS = {
  /** Séries par exercice. */
  setsMin: 1,
  setsMax: 8,
  /** Jamais moins de 6 répétitions à cet âge : au-delà, la charge devient
   *  trop lourde pour un contrôle moteur encore en construction.
   *  (NSCA / Lloyd et al. 2014, ACSM) */
  repsMin: 6,
  repsMax: 30,
  /** Repos, en secondes. Le plancher de 120 s sur les polyarticulaires est
   *  pédiatrique : c'est la vigilance et le contrôle du mouvement qui
   *  redescendent, pas la phosphocréatine. (NSCA / Lloyd et al. 2014) */
  restMin: 45,
  restMax: 300,
  restFloorCompound: 120,
  /** Une proposition reste une proposition : au-delà, ce n'est plus un
   *  ajustement qu'on relit en dix secondes avant de valider. */
  maxOps: 8,
  /** Une séance vidée de ses exercices casserait l'accueil et le cycle. */
  minExercisesPerDay: 2,
} as const;

// ─── Ce que le modèle voit du programme ───────────────────────────────────

export interface CoachProgramExerciseView {
  id: string;
  nom: string;
  groupe: string;
  series: number;
  reps: string;
  reposS: number;
  /** Présent seulement si l'exercice est en superset : le modèle doit savoir
   *  qu'il ne peut pas le retirer sans casser la paire. */
  superset?: true;
}

export interface CoachProgramDayView {
  id: string;
  nom: string;
  exercices: CoachProgramExerciseView[];
}

export interface CoachProgramView {
  nom: string;
  jours: CoachProgramDayView[];
}

export const buildProgramView = (program: Program): CoachProgramView => ({
  nom: program.name,
  jours: program.workouts.map((day) => ({
    id: day.id,
    nom: day.name,
    exercices: day.exercises.map((ex) => ({
      id: ex.id,
      nom: ex.name,
      groupe: ex.muscleGroup,
      series: ex.sets,
      reps: ex.targetReps,
      reposS: ex.restSeconds,
      ...(ex.isSuperset ? { superset: true as const } : {}),
    })),
  })),
});

// ─── Catalogue envoyé au modèle ───────────────────────────────────────────
//
// Le coach choisit un exercice dans CETTE liste, par son identifiant. C'est
// la correction d'une vraie erreur de conception : au départ il donnait un
// nom libre, et l'appli le rapprochait du catalogue. Mesuré, c'était mauvais
// — « Tirage vertical poitrine » ne trouvait rien alors que six « Tirage
// vertical … » existent, et « Tirage poulie haute » tombait sur « Curl à la
// poulie haute », un exercice de biceps. Un mauvais appariement est pire
// qu'un refus : il mettrait le mauvais exercice dans la séance.
//
// L'index pèse environ 12 Ko, envoyé au PREMIER message d'une conversation
// seulement (ensuite l'échange est gardé côté Google). C'est le prix de
// l'exactitude, et il est payé une fois.

/** Une ligne par exercice : « identifiant|Nom ». */
export const buildCatalogIndex = (): string[] =>
  EXERCISE_CATALOG.map((ex) => `${ex.id}|${ex.name}`);

const catalogById = new Map<string, CatalogExercise>(EXERCISE_CATALOG.map((ex) => [ex.id, ex]));

/** Résolution EXACTE par identifiant. Le repli par nom ne sert qu'aux
 *  propositions d'un modèle qui aurait ignoré la consigne, et n'accepte
 *  qu'une correspondance de nom exacte — jamais une approximation. */
const resolveCatalog = (catalogueId?: string, nom?: string): CatalogExercise | null => {
  const byId = catalogueId ? catalogById.get(catalogueId.trim()) : undefined;
  if (byId) return byId;
  if (!nom) return null;
  const guess = findCatalogExercise('', nom);
  return guess && guess.name.toLowerCase() === nom.trim().toLowerCase() ? guess : null;
};

// ─── Ce que le modèle renvoie ─────────────────────────────────────────────

export type CoachPatchOp =
  | { op: 'reglages'; jourId: string; exerciceId: string; series?: number; reps?: string; reposS?: number }
  | { op: 'retirer'; jourId: string; exerciceId: string }
  | { op: 'ajouter'; jourId: string; catalogueId: string; nom?: string }
  | { op: 'remplacer'; jourId: string; exerciceId: string; catalogueId: string; parNom?: string };

export interface CoachProposal {
  titre: string;
  /** Pourquoi ce changement, dans les mots du coach. */
  raison: string;
  ops: CoachPatchOp[];
}

// ─── Validation ───────────────────────────────────────────────────────────

/** Une ligne de la carte de validation : entièrement calculée ici. */
export interface PatchChange {
  jour: string;
  exercice: string;
  /** Ce qui change, ex. « séries », « répétitions », « repos », « retiré ». */
  champ: string;
  avant?: string;
  apres?: string;
}

export interface ValidatedPatch {
  ops: CoachPatchOp[];
  changes: PatchChange[];
  /** Opérations écartées, avec la raison — affichée telle quelle : mieux vaut
   *  dire « je n'ai pas appliqué ça et voilà pourquoi » que faire semblant. */
  rejets: string[];
}

const findDay = (program: Program, dayId: string): WorkoutDay | undefined =>
  program.workouts.find((d) => d.id === dayId);

const findExercise = (day: WorkoutDay, exerciseId: string): Exercise | undefined =>
  day.exercises.find((e) => e.id === exerciseId);

const isCompound = (ex: Exercise): boolean => {
  const cat = findCatalogExercise(ex.id, ex.name);
  return cat?.type === 'Polyarticulaire';
};

/**
 * Un exercice du catalogue est-il déjà présent dans la séance ? Comparer les
 * seuls identifiants `cat-<id>` ne suffit pas : les programmes intégrés
 * (dont celui de Léo, actif par défaut) utilisent leurs propres identifiants
 * (`push-a-6`, etc.), jamais le préfixe `cat-`. Sans passer chaque exercice
 * existant par `findCatalogExercise` (même résolution qu'`isCompound`), un
 * « ajouter » ou un « remplacer » sur un mouvement déjà présent dans ces
 * programmes ne serait jamais reconnu comme un doublon.
 */
const alreadyInDay = (day: WorkoutDay, cat: CatalogExercise): boolean =>
  day.exercises.some((e) => e.id === `cat-${cat.id}` || findCatalogExercise(e.id, e.name)?.id === cat.id);

/**
 * Vérifie une proposition contre le programme réel. Ne modifie rien : renvoie
 * les opérations retenues, le « avant → après » à afficher, et les rejets.
 */
export const validateProposal = (program: Program, proposal: CoachProposal): ValidatedPatch => {
  const ops: CoachPatchOp[] = [];
  const changes: PatchChange[] = [];
  const rejets: string[] = [];

  const proposed = Array.isArray(proposal?.ops) ? proposal.ops : [];
  if (proposed.length > PATCH_LIMITS.maxOps) {
    rejets.push(
      `Le coach proposait ${proposed.length} modifications d'un coup : seules les ${PATCH_LIMITS.maxOps} premières sont retenues.`
    );
  }

  // Combien d'exercices il resterait dans chaque séance, en tenant compte des
  // retraits déjà acceptés : deux retraits sur la même séance pourraient
  // passer un par un et la vider à deux.
  const removedPerDay = new Map<string, number>();

  for (const op of proposed.slice(0, PATCH_LIMITS.maxOps)) {
    const day = findDay(program, op?.jourId ?? '');
    if (!day) {
      rejets.push(`Séance inconnue (${op?.jourId ?? '?'}) : modification ignorée.`);
      continue;
    }

    if (op.op === 'reglages') {
      const ex = findExercise(day, op.exerciceId);
      if (!ex) {
        rejets.push(`${day.name} : exercice inconnu, modification ignorée.`);
        continue;
      }
      const kept: CoachPatchOp = { op: 'reglages', jourId: day.id, exerciceId: ex.id };
      let any = false;

      if (typeof op.series === 'number' && op.series !== ex.sets) {
        const s = Math.round(op.series);
        if (s < PATCH_LIMITS.setsMin || s > PATCH_LIMITS.setsMax) {
          rejets.push(`${ex.name} : ${s} séries, c'est hors des limites (${PATCH_LIMITS.setsMin}-${PATCH_LIMITS.setsMax}).`);
        } else {
          kept.series = s; any = true;
          changes.push({ jour: day.name, exercice: ex.name, champ: 'séries', avant: String(ex.sets), apres: String(s) });
        }
      }

      if (typeof op.reps === 'string' && op.reps.trim() !== '' && op.reps !== ex.targetReps) {
        const range = parseRepRange(op.reps);
        if (!range) {
          rejets.push(`${ex.name} : « ${op.reps} » n'est pas une fourchette de répétitions lisible.`);
        } else if (range.min < PATCH_LIMITS.repsMin) {
          rejets.push(`${ex.name} : ${op.reps} descend sous ${PATCH_LIMITS.repsMin} répétitions, ce n'est pas conseillé à ton âge.`);
        } else if (range.max > PATCH_LIMITS.repsMax) {
          rejets.push(`${ex.name} : ${op.reps} monte trop haut (plus de ${PATCH_LIMITS.repsMax} répétitions).`);
        } else {
          kept.reps = op.reps.trim(); any = true;
          changes.push({ jour: day.name, exercice: ex.name, champ: 'répétitions', avant: ex.targetReps, apres: kept.reps });
        }
      }

      if (typeof op.reposS === 'number' && Math.round(op.reposS) !== ex.restSeconds) {
        const r = Math.round(op.reposS);
        const floor = isCompound(ex) ? PATCH_LIMITS.restFloorCompound : PATCH_LIMITS.restMin;
        if (r < floor) {
          rejets.push(
            isCompound(ex)
              ? `${ex.name} : ${r} s de repos, c'est sous le plancher de ${floor} s sur un exercice polyarticulaire.`
              : `${ex.name} : ${r} s de repos, c'est trop court.`
          );
        } else if (r > PATCH_LIMITS.restMax) {
          rejets.push(`${ex.name} : ${r} s de repos, c'est trop long (plafond ${PATCH_LIMITS.restMax} s).`);
        } else {
          kept.reposS = r; any = true;
          changes.push({ jour: day.name, exercice: ex.name, champ: 'repos', avant: `${ex.restSeconds} s`, apres: `${r} s` });
        }
      }

      if (any) ops.push(kept);
      continue;
    }

    if (op.op === 'retirer' || op.op === 'remplacer') {
      const ex = findExercise(day, op.exerciceId);
      if (!ex) {
        rejets.push(`${day.name} : exercice inconnu, modification ignorée.`);
        continue;
      }
      if (ex.isSuperset) {
        rejets.push(`${ex.name} fait partie d'un superset : le toucher casserait la paire, je ne l'ai pas fait.`);
        continue;
      }
      const alreadyRemoved = removedPerDay.get(day.id) ?? 0;
      const removing = op.op === 'retirer' ? 1 : 0;
      if (day.exercises.length - alreadyRemoved - removing < PATCH_LIMITS.minExercisesPerDay) {
        rejets.push(`${day.name} : il ne resterait presque plus rien dans la séance, retrait ignoré.`);
        continue;
      }

      if (op.op === 'retirer') {
        removedPerDay.set(day.id, alreadyRemoved + 1);
        ops.push({ op: 'retirer', jourId: day.id, exerciceId: ex.id });
        changes.push({ jour: day.name, exercice: ex.name, champ: 'retiré de la séance' });
        continue;
      }

      const cat = resolveCatalog(op.catalogueId, op.parNom);
      if (!cat) {
        rejets.push(`Exercice de remplacement introuvable dans le catalogue (${op.catalogueId ?? op.parNom ?? '?'}) : ignoré.`);
        continue;
      }
      if (alreadyInDay(day, cat)) {
        rejets.push(`${cat.name} est déjà dans ${day.name} : remplacement ignoré.`);
        continue;
      }
      ops.push({ op: 'remplacer', jourId: day.id, exerciceId: ex.id, catalogueId: cat.id });
      changes.push({ jour: day.name, exercice: ex.name, champ: 'remplacé par', apres: cat.name });
      continue;
    }

    if (op.op === 'ajouter') {
      const cat = resolveCatalog(op.catalogueId, op.nom);
      if (!cat) {
        rejets.push(`Exercice introuvable dans le catalogue (${op.catalogueId ?? op.nom ?? '?'}) : ajout ignoré.`);
        continue;
      }
      if (alreadyInDay(day, cat)) {
        rejets.push(`${cat.name} est déjà dans ${day.name} : ajout ignoré.`);
        continue;
      }
      ops.push({ op: 'ajouter', jourId: day.id, catalogueId: cat.id });
      changes.push({ jour: day.name, exercice: cat.name, champ: 'ajouté à la séance' });
      continue;
    }

    rejets.push("Modification d'un type inconnu : ignorée.");
  }

  return { ops, changes, rejets };
};

// ─── Application ──────────────────────────────────────────────────────────

const patchExercise = (program: Program, dayId: string, exerciseId: string, patch: Partial<Exercise>): Program => ({
  ...program,
  workouts: program.workouts.map((day) =>
    day.id !== dayId
      ? day
      : { ...day, exercises: day.exercises.map((ex) => (ex.id === exerciseId ? { ...ex, ...patch } : ex)) }
  ),
});

/** Applique les opérations validées sur une COPIE du programme. */
export const applyOps = (program: Program, ops: CoachPatchOp[]): Program => {
  let next = program;

  for (const op of ops) {
    if (op.op === 'reglages') {
      const patch: Partial<Exercise> = {};
      if (typeof op.series === 'number') patch.sets = op.series;
      if (typeof op.reps === 'string') patch.targetReps = op.reps;
      if (typeof op.reposS === 'number') patch.restSeconds = op.reposS;
      next = patchExercise(next, op.jourId, op.exerciceId, patch);
      continue;
    }
    if (op.op === 'retirer') {
      next = removeExerciseFromWorkout(next, op.jourId, op.exerciceId);
      continue;
    }
    if (op.op === 'ajouter') {
      const cat = catalogById.get(op.catalogueId);
      if (cat) next = addCatalogExerciseToWorkout(next, op.jourId, cat);
      continue;
    }
    if (op.op === 'remplacer') {
      const cat = catalogById.get(op.catalogueId);
      if (!cat) continue;
      // L'ordre de la séance compte (échauffement d'abord, isolation ensuite) :
      // on ajoute puis on remet le nouvel exercice à la place de l'ancien,
      // au lieu de le laisser à la fin.
      const withNew = addCatalogExerciseToWorkout(next, op.jourId, cat);
      next = {
        ...withNew,
        workouts: withNew.workouts.map((day) => {
          if (day.id !== op.jourId) return day;
          const added = day.exercises.find((e) => e.id === `cat-${cat.id}`);
          if (!added) return day;
          const slot = day.exercises.findIndex((e) => e.id === op.exerciceId);
          const without = day.exercises.filter((e) => e.id !== op.exerciceId && e.id !== added.id);
          if (slot < 0) return { ...day, exercises: [...without, added] };
          return { ...day, exercises: [...without.slice(0, slot), added, ...without.slice(slot)] };
        }),
      };
      continue;
    }
  }

  return next;
};

// ─── Programme « ajusté par le coach » ────────────────────────────────────
//
// On ne modifie jamais un programme intégré : ils sont écrits dans le code,
// pas dans des données. Les modifications produisent donc un programme
// personnalisé dérivé, avec un id STABLE (un seul « ajusté par le coach »
// dans la liste, pas un par validation), et l'original reste disponible.

export const COACH_PROGRAM_PREFIX = 'coach-';

/** Id du programme ajusté correspondant à un programme de base. */
export const coachProgramIdFor = (baseId: string): string =>
  baseId.startsWith(COACH_PROGRAM_PREFIX) ? baseId : `${COACH_PROGRAM_PREFIX}${baseId}`;

export const isCoachProgram = (id: string): boolean => id.startsWith(COACH_PROGRAM_PREFIX);

/** Nom de base, sans le suffixe du coach — pour ne pas empiler
 *  « · ajusté par le coach · ajusté par le coach ». */
const COACH_SUFFIX = ' · ajusté par le coach';

export const buildCoachProgram = (base: Program, ops: CoachPatchOp[]): Program => {
  const patched = applyOps(base, ops);
  const cleanName = base.name.replace(COACH_SUFFIX, '');
  return {
    ...patched,
    id: coachProgramIdFor(base.id),
    name: `${cleanName}${COACH_SUFFIX}`,
    focusLabel: base.focusLabel,
    shortDescription: base.shortDescription,
    source: `Dérivé de « ${cleanName} », modifié sur proposition du coach IA et validé par toi.`,
    isCustom: true,
  };
};
