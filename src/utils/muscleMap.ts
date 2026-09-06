// ─── Quel muscle travaille vraiment, et combien ? ──────────────────────────
//
// Jusqu'ici l'appli répondait à cette question avec une seule table
// « exerciceId → muscleGroup » construite à partir de workouts.ts, c'est-à-dire
// du SEUL programme Strict. Deux conséquences :
//   1. tous les autres programmes (catalogue, bibliothèque, générés, importés)
//      étaient invisibles pour les stats de volume, la récupération et le
//      schéma corporel — activer « PPL 6x/semaine » revenait à ne plus rien
//      compter du tout ;
//   2. un exercice ne comptait que pour un muscle. Un développé couché ne
//      créditait rien aux triceps ni aux épaules, alors qu'ils travaillent
//      réellement.
//
// Ce module répond aux deux : il retrouve l'exercice dans N'IMPORTE quel
// programme (ou directement dans le catalogue), puis renvoie la liste des
// muscles sollicités avec leur poids — 1 pour le muscle principal, 0,5 pour
// les synergistes. Cette pondération à 0,5 est la convention utilisée par
// Liftosaur et reprise dans l'analyse comparative des apps de sport : une
// série de développé couché compte 1 série pour les pecs, 0,5 pour les
// triceps et 0,5 pour les épaules.

import { BUILT_IN_PROGRAMS } from '../data/programs';
import { LEGACY_LEGS_WORKOUTS } from '../data/legacyWorkouts';
import { findCatalogExercise } from './catalogMatch';

/** Poids d'un muscle synergiste dans le décompte des séries effectives. */
export const SYNERGIST_WEIGHT = 0.5;

export interface MuscleContribution {
  group: string;
  /** 1 = muscle principal, 0,5 = synergiste. */
  weight: number;
}

// ─── Vocabulaire des muscles ───────────────────────────────────────────────
//
// Le catalogue et le programme Strict ne parlent pas tout à fait la même
// langue : le catalogue dit « Épaules » et « Ischio-jambiers » là où le
// programme de Léo dit « DELTOÏDE ANTÉRIEUR », « DELTOÏDE LATÉRAL » ou
// « ISCHIOS ». On traduit les noms du catalogue vers les groupes affichés,
// sans jamais renommer un groupe existant : l'historique déjà enregistré
// continue de s'afficher sous son nom d'origine.

const CATALOG_MUSCLE_TO_GROUP: Record<string, string> = {
  'Pectoraux': 'PECS',
  'Grand dorsal': 'DOS',
  'Milieu du dos': 'DOS',
  'Lombaires': 'LOMBAIRES',
  'Trapèzes': 'TRAPÈZES',
  'Épaules': 'ÉPAULES',
  'Biceps': 'BICEPS',
  'Triceps': 'TRICEPS',
  'Avant-bras': 'AVANT-BRAS',
  'Quadriceps': 'QUADRICEPS',
  'Ischio-jambiers': 'ISCHIO-JAMBIERS',
  'Fessiers': 'FESSIERS',
  'Mollets': 'MOLLETS',
  'Abdominaux': 'ABDOS',
  // Le catalogue n'a pas de groupe dédié pour ces deux-là : on les rattache
  // au groupe où vivent déjà leurs machines (la machine à adducteurs est
  // classée QUADRICEPS, la machine à abducteurs est classée FESSIERS).
  'Adducteurs': 'QUADRICEPS',
  'Abducteurs': 'FESSIERS',
};

// ─── Index de tous les exercices connus ────────────────────────────────────
//
// Construit une fois, à partir de TOUS les programmes intégrés (Strict,
// extras, catalogue, bibliothèque des autres apps) plus les séances Legs
// historiques : sert à retrouver le nom et le groupe déclaré d'un exercice
// à partir du seul id enregistré dans l'historique.

interface IndexedExercise { name: string; muscleGroup: string }

const EXERCISE_INDEX: Record<string, IndexedExercise> = {};
for (const program of BUILT_IN_PROGRAMS) {
  for (const workout of program.workouts) {
    for (const ex of workout.exercises) {
      // Premier arrivé, premier servi : un id partagé entre programmes
      // (les `cat-…`) désigne de toute façon le même exercice.
      if (!EXERCISE_INDEX[ex.id]) {
        EXERCISE_INDEX[ex.id] = { name: ex.name, muscleGroup: ex.muscleGroup };
      }
    }
  }
}
for (const workout of LEGACY_LEGS_WORKOUTS) {
  for (const ex of workout.exercises) {
    if (!EXERCISE_INDEX[ex.id]) {
      EXERCISE_INDEX[ex.id] = { name: ex.name, muscleGroup: ex.muscleGroup };
    }
  }
}

/** Nom et groupe déclarés d'un exercice, tous programmes confondus. */
export const lookupExercise = (exerciseId: string): IndexedExercise | null =>
  EXERCISE_INDEX[exerciseId] ?? null;

// ─── Correspondances écrites à la main ─────────────────────────────────────
//
// Les exercices du programme Strict portent les noms que Léo utilise, pas ceux
// du catalogue : « Squat bulgare unilatéral haltères » ne ressemble pas assez
// à « Fente bulgare aux haltères » pour que le rapprochement automatique par
// le nom le trouve. Sur 33 exercices, 10 seulement étaient reconnus — donc
// 23 ne créditaient aucun synergiste.
//
// Ces paires sont écrites à la main, une par une : le rapprochement
// automatique a déjà été mesuré comme peu fiable sur ce programme, et une
// fausse correspondance attribuerait du volume au mauvais muscle. Seuls les
// équivalents francs sont listés ; en cas de doute, on laisse l'exercice sans
// correspondance (il compte alors pour son seul muscle déclaré).
const MANUAL_CATALOG_MATCH: Record<string, string> = {
  'pull-a-1': 'oiseau-assis-buste-penche',
  'pull-a-4': 'curl-marteau',
  'pull-a-5': 'rowing-haltere-a-un-bras',
  'pull-a-6': 'machine-a-abducteurs',
  'pull-a-7': 'fente-bulgare-aux-halteres',
  'pull-a-8': 'crunch-a-la-corde',
  'push-a-1': 'elevations-laterales',
  'push-a-2': 'elevations-frontales-halteres',
  'push-a-4': 'ecarte-incline-halteres',
  'push-a-5': 'extension-triceps-a-la-corde',
  'push-a-7': 'extensions-mollets-debout-a-l-haltere',
  'push-a-8': 'crunch-inverse',
  'pull-b-1': 'oiseau-elevations-posterieures',
  'pull-b-3': 'curl-incline',
  'pull-b-5': 'curl-inverse-pronation',
  'pull-b-7': 'extensions-mollets-assis',
  'push-b-2': 'elevations-laterales-assis',
  'push-b-4': 'ecarte-couche-halteres',
  'push-b-5': 'extension-couche-barre-ez',
  'push-b-6': 'dips-aux-barres-paralleles',
  'push-b-7': 'souleve-de-terre-jambes-tendues-halteres',
  'push-b-8': 'fentes-aux-halteres',
  'push-b-9': 'gainage-planche',
};

// ─── Vocabulaire unifié pour le décompte des séries ────────────────────────
//
// Le programme Strict découpe les épaules en trois faisceaux et dit
// « ISCHIOS » là où le catalogue dit « ISCHIO-JAMBIERS ». Tant qu'on ne
// comptait qu'un muscle par exercice ça passait, mais dès qu'un synergiste du
// catalogue vient s'ajouter, le même muscle apparaît sous deux noms dans le
// même graphique (« ISCHIOS 3 » et « ISCHIO-JAMBIERS 6,5 »), ce qui ne veut
// plus rien dire.
//
// Cette table ramène tout à un seul vocabulaire, uniquement pour le décompte
// des séries effectives. Les autres écrans (volume, récupération, schéma
// corporel) gardent les noms d'origine : rien de ce qui est déjà affiché ne
// change.
const VOLUME_GROUP_ALIASES: Record<string, string> = {
  'ISCHIOS': 'ISCHIO-JAMBIERS',
  'ISCHIOS & FESSIERS': 'ISCHIO-JAMBIERS',
  'AVANT-BRAS / BRACHIAL': 'AVANT-BRAS',
  'ABDOS & LOMBAIRES': 'ABDOS',
  // Les trois faisceaux du programme Strict sont regroupés : le catalogue ne
  // distingue pas les faisceaux dans ses muscles secondaires, donc les garder
  // séparés reviendrait à comparer une ligne « directe uniquement » à une
  // ligne « indirecte uniquement ».
  'DELTOÏDE ANTÉRIEUR': 'ÉPAULES',
  'DELTOÏDE LATÉRAL': 'ÉPAULES',
  'DELTOÏDE POSTÉRIEUR': 'ÉPAULES',
};

/** Nom de groupe à utiliser dans le décompte des séries effectives. */
export const volumeGroupOf = (group: string): string =>
  VOLUME_GROUP_ALIASES[group] ?? group;

// ─── Résolution des muscles ────────────────────────────────────────────────

const contributionCache = new Map<string, MuscleContribution[]>();

/**
 * Muscles travaillés par un exercice, avec leur poids (1 = principal,
 * 0,5 = synergiste).
 *
 * Le muscle principal reste TOUJOURS le groupe déclaré par le programme quand
 * il est connu — c'est le nom déjà affiché partout dans l'appli. Le catalogue
 * ne sert qu'à ajouter les synergistes. Sans cette règle, « Élévations
 * latérales haltères » (déclaré DELTOÏDE LATÉRAL) basculerait sur le groupe
 * ÉPAULES du catalogue et le volume se retrouverait coupé en deux noms.
 *
 * Le rapprochement avec le catalogue se fait dans cet ordre : correspondance
 * écrite à la main, puis id `cat-…`, puis nom exact. Si rien ne sort,
 * l'exercice compte pour son seul muscle déclaré.
 *
 * `fallbackName` sert quand l'id n'est dans aucun programme (exercice importé
 * ou substitué) : on tente quand même le rapprochement par le nom.
 */
export const resolveExerciseMuscles = (
  exerciseId: string,
  fallbackName?: string
): MuscleContribution[] => {
  const cacheKey = `${exerciseId} ${fallbackName ?? ''}`;
  const cached = contributionCache.get(cacheKey);
  if (cached) return cached;

  const indexed = EXERCISE_INDEX[exerciseId];
  const name = indexed?.name ?? fallbackName ?? '';
  const manual = MANUAL_CATALOG_MATCH[exerciseId];
  const catalogHit = manual
    ? findCatalogExercise(`cat-${manual}`, '')
    : name !== '' || exerciseId.startsWith('cat-')
    ? findCatalogExercise(exerciseId, name)
    : null;

  const result: MuscleContribution[] = [];
  const primaries = new Set<string>();

  if (indexed) {
    primaries.add(indexed.muscleGroup);
  } else if (catalogHit) {
    primaries.add(catalogHit.group);
    for (const muscle of catalogHit.primary) {
      const group = CATALOG_MUSCLE_TO_GROUP[muscle];
      if (group) primaries.add(group);
    }
  }
  for (const group of primaries) result.push({ group, weight: 1 });

  if (catalogHit) {
    for (const muscle of catalogHit.secondary) {
      const group = CATALOG_MUSCLE_TO_GROUP[muscle];
      if (group && !primaries.has(group)) {
        result.push({ group, weight: SYNERGIST_WEIGHT });
      }
    }
  }

  contributionCache.set(cacheKey, result);
  return result;
};

/**
 * Groupe musculaire principal d'un exercice — le groupe déclaré au programme
 * s'il est connu (c'est celui qui s'affiche déjà partout dans l'appli), sinon
 * celui du catalogue. Remplace l'ancienne table EXERCISE_MUSCLE_GROUP, qui ne
 * connaissait que le programme Strict.
 */
export const primaryGroupOf = (exerciseId: string, fallbackName?: string): string | null => {
  const indexed = EXERCISE_INDEX[exerciseId];
  if (indexed) return indexed.muscleGroup;
  const contributions = resolveExerciseMuscles(exerciseId, fallbackName);
  const primary = contributions.find((c) => c.weight === 1);
  return primary?.group ?? null;
};
