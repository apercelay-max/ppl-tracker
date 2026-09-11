// ─── Digest pour le coach IA ───────────────────────────────────────────────
//
// Le moteur local (utils/coach.ts) reste la CALCULATRICE : tonnage, 1RM
// estimé, plateaux, séries effectives, seuils franchis. Ce module ne calcule
// rien de nouveau — il rassemble ces chiffres déjà fiables dans un objet
// compact, prêt à partir vers un modèle de langage qui joue, lui, le rôle
// d'ANALYSTE : il commente et priorise, il ne compte pas.
//
// D'où deux règles de conception :
//  1. tout ce qui est chiffré ici sort de utils/training.ts, jamais d'un
//     calcul improvisé — sinon deux endroits de l'appli donneraient deux
//     réponses différentes à la même question ;
//  2. c'est un RÉSUMÉ. L'historique brut de Léo fait ~200 Ko de séries : on
//     l'envoie agrégé et arrondi, autour de 2 à 4 Ko. Un digest plus gros
//     coûte des jetons, ralentit la réponse, et noie l'information utile.
//
// Aucun appel réseau ici, aucune dépendance au store : une fonction pure,
// qu'on peut appeler dans un test avec un historique fabriqué.

import type { BodyWeightEntry, HistoryEntry, WorkoutDay } from '../data/types';
import type { TrainingProfile } from './onboardingQuiz';
import { EXPERIENCE_LABELS, GOAL_LABELS } from './onboardingQuiz';
import { COACH_LIMITS } from './coach';
import {
  ALL_EXERCISES,
  bucketByWeek,
  computeTonnage,
  detectPlateaus,
  getEffectiveWeeklySets,
  getExerciseE1RMHistory,
  parseRepRange,
  wasSubstituted,
} from './training';
import { lookupExercise, primaryGroupOf } from './muscleMap';

const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;

/** Fenêtre d'historique par défaut, en semaines. Bornée à 8-12 : en dessous
 *  on ne voit pas une tendance, au-dessus on paye des jetons pour des
 *  séances qui ne disent plus rien de la forme actuelle. */
export const DIGEST_WEEKS_DEFAULT = 10;
export const DIGEST_WEEKS_MIN = 8;
export const DIGEST_WEEKS_MAX = 12;

/** Nombre d'exercices détaillés. Au-delà, on ajoute du volume de texte sans
 *  ajouter de sujet de conseil : les exercices rares ne portent pas de
 *  tendance exploitable. Fixé à 10 pour tenir dans la cible de 2-4 Ko même
 *  avec les noms d'exercices à rallonge du catalogue. */
const MAX_EXERCISES = 10;

/** Nombre de séances détaillées, les plus récentes. Le reste de l'évolution
 *  passe par le tonnage hebdomadaire, qui suffit à voir la pente. */
const MAX_SESSIONS = 10;

// ─── Forme du digest ───────────────────────────────────────────────────────

/** Ce qu'on sait de l'athlète. Tout est facultatif : le quiz de démarrage
 *  peut n'avoir jamais été rempli, et on préfère un champ absent à un champ
 *  vide que le modèle interpréterait. */
export interface DigestAthlete {
  ageYears?: number;
  bodyWeightKg?: number;
  heightCm?: number;
  /** Libellé français du quiz, ex. « Prendre du muscle ». */
  goal?: string;
  /** Libellé français du quiz, ex. « Moins de 6 mois ». */
  experience?: string;
  daysPerWeekTarget?: number;
  /** Zones douloureuses déclarées au quiz : à ne pas charger davantage. */
  soreZones?: string[];
}

export interface DigestExercise {
  name: string;
  group?: string;
  /** Fourchette de reps visée au programme, ex. « 6-10 ». */
  target?: string;
  /** Séances où l'exercice a été fait dans la fenêtre. */
  sessions: number;
  /** Dernière charge chiffrée utilisée, en kg. */
  lastKg?: number;
  /** Reps de la dernière série faite (la série qui décide de la charge suivante). */
  lastReps?: number;
  /** Meilleur 1RM ESTIMÉ (Epley) sur la fenêtre — une tendance, pas une mesure. */
  bestE1rm?: number;
  /** Évolution du 1RM estimé du début à la fin de la fenêtre, en %. */
  e1rmTrendPct?: number;
  /** Position de la dernière séance par rapport à la fourchette visée. */
  fit?: 'sous' | 'dans' | 'haut' | 'au-dessus';
}

export interface DigestVolume {
  group: string;
  /** Séries effectives cette semaine (principal ×1, synergiste ×0,5). */
  thisWeek: number;
  /** Moyenne par semaine sur la fenêtre. */
  avgPerWeek: number;
}

export interface DigestPlateau {
  name: string;
  weeksStuck: number;
  bestE1rm: number;
}

export interface DigestSession {
  /** Jours écoulés depuis cette séance (0 = aujourd'hui). Plus lisible qu'un
   *  timestamp pour un modèle, et ça ne fuite pas de date réelle. */
  daysAgo: number;
  /** Nom de la séance au programme, ex. « Push A ». */
  name: string;
  tonnageKg: number;
  sets: number;
  durationMin: number;
  /** Ressenti déclaré en fin de séance (1-10), s'il a été saisi. */
  rpe?: number;
}

export interface DigestConsistency {
  /** Séances faites par semaine, moyenne sur la fenêtre. */
  sessionsPerWeek: number;
  /** Objectif hebdomadaire réglé dans l'appli. */
  weeklyGoal?: number;
  /** Semaines de la fenêtre où l'objectif n'a pas été atteint. */
  weeksBelowGoal: number;
  /** Semaines complètes sans aucune séance. */
  emptyWeeks: number;
  /** Plus longue coupure entre deux séances, en jours. */
  longestGapDays: number;
  /** Heures écoulées depuis la FIN de la dernière séance (date + durationMs :
   *  `date` est l'heure de début, la durée est stockée à part). */
  hoursSinceLastSession: number;
}

/** Les seuils que le modèle doit respecter. On les envoie explicitement pour
 *  qu'il n'aille pas chercher dans ses souvenirs des chiffres d'adulte. */
export interface DigestLimits {
  volumeMin: number;
  volumeGoodMin: number;
  volumeGoodMax: number;
  volumeMax: number;
  perfDropPct: number;
  proteinPerKg: number;
  proteinMeals: number;
  postWorkoutHours: number;
  sleepMinHours: number;
}

export interface CoachDigest {
  /** Semaines couvertes par l'agrégation. */
  windowWeeks: number;
  /** Séances terminées dans la fenêtre. */
  sessions: number;
  athlete: DigestAthlete;
  /** Nom du programme suivi en ce moment. */
  program?: string;
  exercises: DigestExercise[];
  volume: DigestVolume[];
  plateaus: DigestPlateau[];
  /** Tonnage par semaine, du plus ancien au plus récent (kg). */
  weeklyTonnage: number[];
  recentSessions: DigestSession[];
  consistency: DigestConsistency;
  limits: DigestLimits;
}

export interface CoachDigestInput {
  /** Historique tel qu'il est stocké : trié du plus récent au plus ancien. */
  history: HistoryEntry[];
  /** Même contrat que getCoachBrief : l'appelant sait résoudre un dayId. */
  resolveWorkout: (dayId: string) => WorkoutDay | undefined;
  profile?: TrainingProfile | null;
  bodyWeightHistory?: BodyWeightEntry[];
  programName?: string;
  weeklySessionGoal?: number;
  /** Fenêtre en semaines, ramenée dans [8, 12]. */
  weeks?: number;
}

// ─── Contrat avec la fonction serverless (api/coach.ts) ────────────────────
//
// Ces types décrivent ce qui circule entre l'appli et /api/coach. Ils vivent
// ici, du côté client, et api/coach.ts les importe en `import type` : une
// seule définition, et aucun code serveur embarqué dans le bundle.

export type CoachAiMode = 'brief' | 'chat';

export interface CoachAiRequest {
  mode: CoachAiMode;
  digest: CoachDigest;
  /** Question libre de l'utilisateur. Obligatoire en mode « chat ». */
  question?: string;
  /** Conversation en cours (mode « chat ») : identifiant de l'échange
   *  précédent, renvoyé par l'API. C'est Google qui garde l'historique — on
   *  ne réexpédie donc ni les messages passés ni le digest à chaque tour. */
  previousInteractionId?: string;
  /** Clé d'API saisie dans l'appli (Coach → Clé d'API). Quand elle est là,
   *  elle prime sur celle du serveur : c'est un geste explicite de
   *  l'utilisateur, il doit voir son effet. Sinon, le serveur utilise la
   *  sienne (variable d'environnement GEMINI_API_KEY sur Vercel). */
  apiKey?: string;
}

export type CoachAiPriority = 'haute' | 'moyenne' | 'basse';

export interface CoachAiPoint {
  titre: string;
  /** Ce que disent les chiffres du digest. */
  constat: string;
  /** Quoi faire concrètement. */
  action: string;
  priorite: CoachAiPriority;
}

/** Bilan rédigé à partir du digest (mode « brief »). */
export interface CoachAiBrief {
  resume: string;
  points: CoachAiPoint[];
  encouragement: string;
}

/** Codes d'erreur renvoyés par /api/coach, pour que l'UI choisisse quoi
 *  afficher sans avoir à lire le message. */
export type CoachAiErrorCode =
  | 'METHODE_NON_AUTORISEE'
  | 'REQUETE_INVALIDE'
  | 'CORPS_TROP_GROS'
  | 'CLE_MANQUANTE'
  /** Panne réseau ou fonction injoignable — détecté côté client, jamais
   *  renvoyé par /api/coach. */
  | 'RESEAU'
  | 'CLE_INVALIDE'
  | 'QUOTA_DEPASSE'
  | 'DELAI_DEPASSE'
  | 'REPONSE_VIDE'
  /** L'échange précédent n'est plus connu de Google (expiré). Le client
   *  repart d'une conversation neuve, en rejoignant le digest. */
  | 'CONVERSATION_PERDUE'
  | 'ERREUR_MODELE';

export type CoachAiResponse =
  | { ok: true; mode: 'brief'; model: string; brief: CoachAiBrief }
  | { ok: true; mode: 'chat'; model: string; reponse: string; interactionId?: string }
  | { ok: false; code: CoachAiErrorCode; message: string };

// ─── Petits utilitaires ────────────────────────────────────────────────────

const round1 = (n: number): number => Math.round(n * 10) / 10;

const numericReps = (reps: string): number | null => {
  const n = parseInt(reps, 10);
  return isFinite(n) && n > 0 ? n : null;
};

const tonnageOf = (entry: HistoryEntry): number => entry.tonnage ?? computeTonnage(entry.exerciseProgress);

const countCompletedSets = (entry: HistoryEntry): number =>
  Object.values(entry.exerciseProgress).reduce((sum, sets) => sum + sets.filter((s) => s.completed).length, 0);

/**
 * Où se situe la dernière série faite par rapport à la fourchette visée.
 * Même lecture que readLoadFit dans coach.ts, mais rendue par exercice pour
 * que le modèle puisse dire « celui-là d'abord » plutôt qu'un total.
 */
const fitOf = (lastReps: number | null, target: string | undefined): DigestExercise['fit'] => {
  if (lastReps === null || !target) return undefined;
  const range = parseRepRange(target);
  if (!range) return undefined;
  if (lastReps < range.min) return 'sous';
  if (lastReps > range.max) return 'au-dessus';
  if (lastReps === range.max && range.max !== range.min) return 'haut';
  return 'dans';
};

/** Nom lisible d'un exercice, quel que soit le programme d'où il vient. */
const nameOf = (exerciseId: string): string | null => {
  const indexed = lookupExercise(exerciseId);
  if (indexed) return indexed.name;
  const fromProgram = ALL_EXERCISES.find((e) => e.id === exerciseId);
  return fromProgram?.name ?? null;
};

/**
 * Fourchette de reps prévue au programme pour un exercice. On cherche dans
 * les séances effectivement faites : c'est le seul endroit où on sait quel
 * jour de programme contenait cet exercice.
 */
const findTargetReps = (exerciseId: string, input: CoachDigestInput): string | undefined => {
  for (const entry of input.history) {
    if (!entry.exerciseProgress[exerciseId]) continue;
    const workout = input.resolveWorkout(entry.dayId);
    const exercise = workout?.exercises.find((e) => e.id === exerciseId);
    if (exercise?.targetReps) return exercise.targetReps;
  }
  return undefined;
};

// ─── Construction ──────────────────────────────────────────────────────────

/**
 * Agrège l'historique en un résumé envoyable à un modèle de langage.
 *
 * Fonction pure : mêmes entrées → même sortie (à l'horloge près, puisque
 * « il y a N jours » et les fenêtres glissantes dépendent de Date.now()).
 * Ne touche jamais au store, n'écrit rien.
 */
export const buildCoachDigest = (input: CoachDigestInput): CoachDigest => {
  const weeks = Math.min(DIGEST_WEEKS_MAX, Math.max(DIGEST_WEEKS_MIN, Math.round(input.weeks ?? DIGEST_WEEKS_DEFAULT)));
  const now = Date.now();
  const cutoff = now - weeks * WEEK_MS;

  // Fenêtre de travail : l'historique complet ne sert qu'aux fonctions qui
  // ont besoin de tout voir (détection de plateau sur le meilleur de tous les
  // temps). Tout le reste se lit sur la fenêtre.
  const windowed = input.history.filter((h) => h.date >= cutoff);

  // ── Profil ──
  const profile = input.profile ?? null;
  const bodyWeightKg = input.bodyWeightHistory?.[0]?.weightKg ?? profile?.weightKg ?? undefined;
  const athlete: DigestAthlete = {};
  if (profile?.age != null && profile.age > 0) athlete.ageYears = profile.age;
  if (bodyWeightKg != null && bodyWeightKg > 0) athlete.bodyWeightKg = round1(bodyWeightKg);
  if (profile?.heightCm != null && profile.heightCm > 0) athlete.heightCm = profile.heightCm;
  if (profile?.goal) athlete.goal = GOAL_LABELS[profile.goal];
  if (profile?.experience) athlete.experience = EXPERIENCE_LABELS[profile.experience];
  if (profile?.daysPerWeek) athlete.daysPerWeekTarget = profile.daysPerWeek;
  if (profile?.soreZones?.length) athlete.soreZones = profile.soreZones.slice(0, 4);

  // ── Exercices ──
  // On parcourt la fenêtre du plus récent au plus ancien : la première fois
  // qu'on croise un exercice, c'est sa dernière séance.
  interface Agg {
    id: string;
    sessions: number;
    lastKg?: number;
    lastReps?: number;
    seen: boolean;
  }
  const aggs = new Map<string, Agg>();
  for (const entry of windowed) {
    for (const [exId, sets] of Object.entries(entry.exerciseProgress)) {
      // Une séance où l'exercice a été REMPLACÉ a été faite sur un autre
      // mouvement : la mélanger à la série de l'exercice prévu fausserait la
      // tendance (même filtre que training.ts).
      if (wasSubstituted(entry, exId)) continue;
      const done = sets.filter((s) => s.completed);
      if (done.length === 0) continue;

      let agg = aggs.get(exId);
      if (!agg) { agg = { id: exId, sessions: 0, seen: false }; aggs.set(exId, agg); }
      agg.sessions += 1;

      if (!agg.seen) {
        agg.seen = true;
        const last = done[done.length - 1];
        const kg = parseFloat(last.weight);
        if (isFinite(kg) && kg > 0) agg.lastKg = round1(kg);
        const reps = numericReps(last.reps);
        if (reps !== null) agg.lastReps = reps;
      }
    }
  }

  const exercises: DigestExercise[] = [];
  // Les plus travaillés d'abord : c'est là que se joue la progression.
  const ordered = Array.from(aggs.values()).sort((a, b) => b.sessions - a.sessions).slice(0, MAX_EXERCISES);
  for (const agg of ordered) {
    const name = nameOf(agg.id);
    if (!name) continue; // exercice inconnu de tous les programmes : rien à en dire

    // Le 1RM estimé se lit sur la fenêtre uniquement, sinon la « tendance »
    // partirait d'une séance vieille de six mois.
    const points = getExerciseE1RMHistory(input.history, agg.id).filter((p) => p.date >= cutoff);
    let bestE1rm: number | undefined;
    let trendPct: number | undefined;
    if (points.length > 0) {
      bestE1rm = round1(Math.max(...points.map((p) => p.e1rm)));
      const first = points[0].e1rm;
      const last = points[points.length - 1].e1rm;
      // Deux points minimum : une seule séance ne fait pas une pente.
      if (points.length >= 2 && first > 0) trendPct = Math.round(((last - first) / first) * 100);
    }

    const target = findTargetReps(agg.id, input);

    const item: DigestExercise = { name, sessions: agg.sessions };
    const group = primaryGroupOf(agg.id);
    if (group) item.group = group;
    if (target) item.target = target;
    if (agg.lastKg !== undefined) item.lastKg = agg.lastKg;
    if (agg.lastReps !== undefined) item.lastReps = agg.lastReps;
    if (bestE1rm !== undefined) item.bestE1rm = bestE1rm;
    if (trendPct !== undefined) item.e1rmTrendPct = trendPct;
    const fit = fitOf(agg.lastReps ?? null, target);
    if (fit) item.fit = fit;
    exercises.push(item);
  }

  // ── Volume par groupe musculaire ──
  const thisWeek = getEffectiveWeeklySets(input.history, 1);
  const overWindow = getEffectiveWeeklySets(input.history, weeks);
  const thisWeekByGroup = new Map(thisWeek.map((v) => [v.group, v.perWeek]));
  const volume: DigestVolume[] = overWindow.map((v) => ({
    group: v.group,
    thisWeek: thisWeekByGroup.get(v.group) ?? 0,
    avgPerWeek: v.perWeek,
  }));

  // ── Plateaux ──
  // detectPlateaus lit tout l'historique : un plateau se définit par rapport
  // au meilleur de TOUS les temps, pas au meilleur des 10 dernières semaines.
  const plateaus: DigestPlateau[] = detectPlateaus(input.history)
    .slice(0, 4)
    .map((p) => ({ name: p.exerciseName, weeksStuck: p.weeksStuck, bestE1rm: p.bestE1RM }));

  // ── Tonnage hebdomadaire et régularité ──
  const buckets = bucketByWeek(input.history, weeks); // plus ancien → plus récent
  const weeklyTonnage = buckets.map((b) => b.tonnage);
  const weeklyGoal = input.weeklySessionGoal;
  const emptyWeeks = buckets.filter((b) => b.sessionCount === 0).length;
  const weeksBelowGoal = weeklyGoal ? buckets.filter((b) => b.sessionCount < weeklyGoal).length : 0;

  // Plus longue coupure : on compare la FIN d'une séance au début de la
  // suivante — `date` est l'heure de début, la durée est à part dans
  // durationMs. Sans ça, une séance de 1 h 30 compterait comme un point.
  let longestGapDays = 0;
  const chronological = windowed.slice().reverse();
  for (let i = 1; i < chronological.length; i++) {
    const previousEnd = chronological[i - 1].date + (chronological[i - 1].durationMs || 0);
    const gap = (chronological[i].date - previousEnd) / DAY_MS;
    if (gap > longestGapDays) longestGapDays = gap;
  }

  const last = input.history[0];
  const lastEnd = last ? last.date + (last.durationMs || 0) : now;
  const consistency: DigestConsistency = {
    sessionsPerWeek: round1(windowed.length / weeks),
    weeksBelowGoal,
    emptyWeeks,
    longestGapDays: Math.round(longestGapDays),
    hoursSinceLastSession: Math.max(0, Math.round((now - lastEnd) / 3600000)),
  };
  if (weeklyGoal) consistency.weeklyGoal = weeklyGoal;

  // ── Dernières séances ──
  const recentSessions: DigestSession[] = windowed.slice(0, MAX_SESSIONS).map((entry) => {
    const workout = input.resolveWorkout(entry.dayId);
    const session: DigestSession = {
      daysAgo: Math.max(0, Math.floor((now - entry.date) / DAY_MS)),
      name: workout?.name ?? entry.dayId,
      tonnageKg: Math.round(tonnageOf(entry)),
      sets: countCompletedSets(entry),
      durationMin: Math.round((entry.durationMs || 0) / 60000),
    };
    if (typeof entry.rpe === 'number') session.rpe = entry.rpe;
    return session;
  });

  const digest: CoachDigest = {
    windowWeeks: weeks,
    sessions: windowed.length,
    athlete,
    exercises,
    volume,
    plateaus,
    weeklyTonnage,
    recentSessions,
    consistency,
    limits: {
      volumeMin: COACH_LIMITS.volumeMin,
      volumeGoodMin: COACH_LIMITS.volumeGoodMin,
      volumeGoodMax: COACH_LIMITS.volumeGoodMax,
      volumeMax: COACH_LIMITS.volumeMax,
      perfDropPct: COACH_LIMITS.perfDropPct,
      proteinPerKg: COACH_LIMITS.proteinPerKg,
      proteinMeals: COACH_LIMITS.proteinMeals,
      postWorkoutHours: COACH_LIMITS.postWorkoutHours,
      sleepMinHours: COACH_LIMITS.sleepMinHours,
    },
  };
  if (input.programName) digest.program = input.programName;

  return digest;
};

/**
 * Taille du digest une fois sérialisé, en octets (UTF-8). Sert à vérifier
 * qu'on reste dans l'ordre de 2-4 Ko, et c'est aussi ce que la fonction
 * serverless mesure pour refuser un corps anormalement gros.
 */
export const digestSizeBytes = (digest: CoachDigest): number => {
  const json = JSON.stringify(digest);
  // TextEncoder est présent dans les navigateurs modernes et dans Node ≥ 11 ;
  // le repli sert aux environnements de test minimalistes.
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(json).length;
  return json.length;
};
