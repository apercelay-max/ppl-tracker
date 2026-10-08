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
import { findCatalogExercise, normalize } from './catalogMatch';

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
// Le catalogue ne connaît pas forcément un exercice sous le nom que Léo
// utilise (ex. « Fente bulgare aux haltères » du catalogue pour un « Squat
// bulgare unilatéral haltères » du programme) : le rapprochement automatique
// par nom (catalogMatch.ts) rate alors une correspondance pourtant fiable.
// Ces paires-là sont écrites à la main pour créditer leurs synergistes.
//
// Reconstruite le 16/09/2026 : la précédente table datait des versions
// V2.x/V3.0 (Push A/Pull B à 8-9 exercices) et n'avait pas suivi les refontes
// V3.1/V3.2/V4.0, qui réattribuent les mêmes ids ('push-a-1', 'pull-b-5'...)
// à des exercices totalement différents — chaque entrée pointait donc vers
// un synergiste sans rapport, silencieusement (seul le widget « Séries
// effectives / semaine » du Dashboard lit cette table ; le muscle PRINCIPAL
// vient toujours de workouts.ts). Reconstruite de zéro à partir du contenu
// réel de workouts.ts (V4.0) et legacyWorkouts.ts (V2.x et V3.0 — encore
// potentiellement dans la fenêtre d'historique récente).
//
// Volontairement absents de cette table :
//  - les ids qui n'existent plus dans aucun programme (orphelins depuis une
//    refonte) — impossible de vérifier ce qu'ils désignaient encore ;
//  - les exercices dont le meilleur équivalent catalogue n'a aucun muscle
//    secondaire renseigné (la plupart des oiseaux, curls, élévations) :
//    les lister ne changerait aucun chiffre, seulement du bruit ;
//  - les séances de rééducation genou ('legs-a-rehab-*'/'legs-b-rehab-*') :
//    leur objectif explicite (voir leurs notes et l'en-tête de WORKOUTS) est
//    de ne PAS créditer d'hypertrophie tant que le genou n'est pas libéré —
//    leur ajouter un synergiste irait à l'encontre de cette décision ;
//  - les étirements et exercices de mobilité pure (dorsiflexion, heel
//    slides, couch stretch...), absents du catalogue.
// En cas de doute, on laisse l'exercice sans correspondance (il compte alors
// pour son seul muscle déclaré) — mieux vaut aucune correspondance qu'une
// fausse.
const MANUAL_CATALOG_MATCH: Record<string, string> = {
  // Pull A (V4.0)
  'pull-a-4': 'tractions-pronation',
  // Push A (V4.0)
  'push-a-2': 'dips-version-pectoraux',
  'push-a-4': 'pompes',
  'push-a-7': 'developpe-couche-halteres',
  // Push B (V4.0) — 'push-a-5' y a été déplacé (Pompes diamant, Jour 2 → Jour 5)
  'push-a-5': 'pompes',
  'push-b-2': 'pompes',
  // Legs — générations antérieures (V2.x pré-19/08/2026, V3.0 30/08→13/09/2026),
  // gardées pour que l'historique déjà enregistré sous ces ids continue de
  // créditer les bons synergistes (voir legacyWorkouts.ts).
  'legs-a-2': 'fentes-marchees-au-poids-du-corps',
  'legs-b-3': 'fente-bulgare-aux-halteres',
  'legs-a-v3-2': 'fente-bulgare-aux-halteres',
  'legs-b-v3-4': 'souleve-de-terre-jambes-tendues-halteres',
  'legs-b-v3-5': 'fentes-marchees-au-poids-du-corps',
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

  let indexed: IndexedExercise | undefined = EXERCISE_INDEX[exerciseId];
  const name = indexed?.name ?? fallbackName ?? '';
  const manual: string | undefined = MANUAL_CATALOG_MATCH[exerciseId];
  let catalogHit = manual
    ? findCatalogExercise(`cat-${manual}`, '')
    : name !== '' || exerciseId.startsWith('cat-')
    ? findCatalogExercise(exerciseId, name)
    : null;

  // Exercice REMPLACÉ en séance : `fallbackName` est alors le nom du remplaçant,
  // et les séries doivent créditer SES muscles, pas ceux de l'exercice prévu
  // (une machine occupée remplacée par des pompes ne travaille plus les mêmes
  // muscles). Si le remplaçant est introuvable au catalogue, on garde le repli
  // sur l'exercice d'origine.
  if (indexed && fallbackName && normalize(fallbackName) !== normalize(indexed.name)) {
    const substitute = findCatalogExercise('', fallbackName);
    if (substitute) {
      indexed = undefined;
      catalogHit = substitute;
    }
  }

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
