// ─── Coach ────────────────────────────────────────────────────────────────
//
// Moteur de conseils. Tout est calculé en local, à partir de l'historique
// déjà stocké : pas d'appel réseau, pas de clé d'API, ça marche dans une
// salle en sous-sol et le conseil s'affiche instantanément.
//
// Les seuils ci-dessous ne sont pas inventés : ils viennent d'une revue des
// positions officielles et méta-analyses pour un pratiquant ADOLESCENT
// (12-15 ans) — NSCA / Lloyd et al. 2014, AAP, ACSM, ISSN, matrice RPE/RIR
// de Helms & Tuchscherer, Schoenfeld & Aragon (fenêtre anabolique),
// Milewski et al. 2014 (sommeil), et côté français la HAS (guide « Activité
// physique à des fins de santé chez l'enfant et l'adolescent », octobre 2025)
// plus l'ANSES.
//
// Attention aux deux avis de l'ANSES, ils ne disent pas la même chose et
// l'en-tête de ce fichier les confondait :
//   - saisine 2012-SA-0155 (février 2016) = repères d'activité physique et de
//     sédentarité. C'est celui des règles de VOLUME et d'alimentation.
//   - saisine 2014-SA-0008 (novembre 2016) = compléments alimentaires pour
//     sportifs. C'est celui de la règle « aucun complément », uniquement.
// Le détail de chaque source, avec ses liens, est dans
// `src/data/referentiels.ts` — c'est affiché dans l'appli, donc vérifiable.
// Chaque constante porte sa source : si un jour tu changes un chiffre,
// tu sais ce que tu contredis.

import type { HistoryEntry, SetEntry, WorkoutDay } from '../data/types';
import { computeTonnage, parseRepRange, detectPlateaus, getEffectiveWeeklySets } from './training';

export const COACH_LIMITS = {
  /** Séries effectives / muscle / semaine — sous ce seuil, c'est trop peu pour progresser. (NSCA, Lloyd 2014) */
  volumeMin: 4,
  /** Zone optimale basse / haute pour un ado. (NSCA, Lloyd 2014) */
  volumeGoodMin: 8,
  volumeGoodMax: 12,
  /** Au-delà : sur-volume, risque de tendinopathie de traction. (NSCA, Lloyd 2014) */
  volumeMax: 14,
  /** Baisse de tonnage qui compte comme une vraie chute de performance. */
  perfDropPct: 10,
  /** Ajustement de charge quand on est ≥2 reps sous la fourchette. (Helms) */
  loadDownPct: 6,
  /** Ajustement quand on dépasse la fourchette de ≥3 reps. (Helms) */
  loadUpPct: 3.5,
  /** Écart de reps à partir duquel on corrige la charge en séance. (Helms) */
  repsGapToAct: 2,
  repsOverToAct: 3,
  /** Protéines : g/kg/jour, cible par défaut. (ACSM / ISSN) */
  proteinPerKg: 1.6,
  /** Nombre de repas sur lesquels étaler les protéines. (Schoenfeld / Aragon) */
  proteinMeals: 4,
  /** Délai réel pour manger après la séance, en heures — la « fenêtre de 30 min » est un mythe. (Schoenfeld & Aragon) */
  postWorkoutHours: 2,
  /** Sommeil : en dessous, le risque de blessure est multiplié par 1,7. (Milewski et al. 2014) */
  sleepMinHours: 8,
} as const;

export type CoachTone = 'up' | 'down' | 'hold' | 'warn' | 'good';

export interface CoachTip {
  text: string;
  tone: CoachTone;
}

/** Arrondi propre à un incrément de salle (2,5 kg à la barre, 1 kg aux haltères…). */
const roundTo = (kg: number, increment: number, mode: 'down' | 'up'): number => {
  const steps = kg / increment;
  const rounded = (mode === 'down' ? Math.floor(steps) : Math.ceil(steps)) * increment;
  return Math.round(rounded * 100) / 100;
};

/** Décimale à la française : 1.6 → « 1,6 ». */
const fr = (n: number): string => String(n).replace('.', ',');

const numericReps = (entry: SetEntry): number | null => {
  const n = parseInt(entry.reps, 10);
  return isFinite(n) && n > 0 ? n : null;
};

/**
 * Conseil sur la PROCHAINE série d'un exercice, lu sur la dernière série
 * réellement faite. C'est le retour immédiat qu'un coach donne au moment où
 * tu reposes la barre : « tu es tombé sous la fourchette, allège ».
 *
 * On part de la dernière série faite et pas de l'index de la série courante,
 * parce que pendant le repos aucune série n'est encore « courante » : le
 * conseil doit s'afficher tout de suite, quand il est encore temps de
 * changer les haltères, pas à la fin du minuteur.
 *
 * Renvoie null quand il n'y a rien d'utile à dire — une série pile dans la
 * fourchette n'a pas besoin de commentaire, et un conseil à chaque série
 * deviendrait du bruit qu'on arrête de lire.
 *
 * `formatKg` est fourni par l'appelant pour que le poids s'affiche dans
 * l'unité choisie (kg ou lbs) sans que ce module ait à la connaître.
 */
export const getSetCoaching = (
  sets: SetEntry[],
  targetReps: string,
  incrementKg: number,
  formatKg: (kg: number) => string
): CoachTip | null => {
  const range = parseRepRange(targetReps);
  if (!range || !isFinite(incrementKg) || incrementKg <= 0) return null;

  // Plus rien à faire sur cet exercice : un conseil de charge n'aurait plus
  // de série sur laquelle s'appliquer.
  if (sets.length === 0 || sets.every((s) => s.completed)) return null;

  // On remonte jusqu'à la dernière série réellement faite : une série
  // « passée » (reps = '—') ne dit rien sur la charge.
  let previous: SetEntry | null = null;
  let previousNumber = 0;
  for (let i = sets.length - 1; i >= 0; i--) {
    const s = sets[i];
    if (s.completed && numericReps(s) !== null) { previous = s; previousNumber = i + 1; break; }
  }
  if (!previous) return null;

  const reps = numericReps(previous);
  const weight = parseFloat(previous.weight);
  if (reps === null) return null;
  // Poids du corps ou saisie non chiffrée : on peut encore commenter les
  // reps, mais pas proposer de charge.
  const hasWeight = isFinite(weight) && weight > 0;

  const head = `Série ${previousNumber} : ${reps} reps`;

  // ── Sous la fourchette de ≥2 reps → on allège tout de suite (Helms) ──
  if (reps <= range.min - COACH_LIMITS.repsGapToAct) {
    if (!hasWeight) {
      return { text: `${head} pour ${range.min} minimum. Réduis l'amplitude de charge ou repose-toi plus longtemps.`, tone: 'down' };
    }
    let target = roundTo(weight * (1 - COACH_LIMITS.loadDownPct / 100), incrementKg, 'down');
    if (target >= weight) target = weight - incrementKg;
    if (target <= 0) return { text: `${head} pour ${range.min} minimum. Allonge le repos avant la série suivante.`, tone: 'down' };
    return { text: `${head} pour ${range.min} minimum → descends à ${formatKg(target)} pour tenir la fourchette.`, tone: 'down' };
  }

  // ── 1 rep sous la fourchette → on ne bouge rien, c'est dans le bruit ──
  if (reps === range.min - 1) {
    return { text: `${head}, il en manque 1. Garde la même charge et soigne la descente.`, tone: 'hold' };
  }

  // ── Largement au-dessus → la charge est trop légère, on monte (Helms) ──
  if (reps >= range.max + COACH_LIMITS.repsOverToAct) {
    if (!hasWeight) {
      return { text: `${head} pour ${range.max} visées : ajoute de la charge ou ralentis le mouvement.`, tone: 'up' };
    }
    let target = roundTo(weight * (1 + COACH_LIMITS.loadUpPct / 100), incrementKg, 'up');
    if (target <= weight) target = weight + incrementKg;
    return { text: `${head} pour ${range.max} visées → monte à ${formatKg(target)} dès maintenant.`, tone: 'up' };
  }

  // ── 1 à 2 reps au-dessus → on finit la séance à cette charge ──
  // La montée se fait à la séance SUIVANTE : changer de charge en cours de
  // série fausse la comparaison entre les séries de la même séance.
  if (reps > range.max) {
    return { text: `${head}, au-dessus de la fourchette. Garde cette charge aujourd'hui, tu monteras la prochaine fois.`, tone: 'hold' };
  }

  // ── Pile en haut de fourchette → c'est le signal de la double progression ──
  if (reps === range.max && range.max !== range.min) {
    return { text: `${head}, haut de fourchette tenu. Refais-le sur toutes les séries et tu montes la prochaine fois.`, tone: 'good' };
  }

  return null;
};

// ─── Récap d'accueil ───────────────────────────────────────────────────────

export interface CoachBrief {
  /** Ligne 1 — ce qui s'est passé la dernière fois, chiffré. */
  recap: string;
  /** Ligne 2 — le seul point à corriger, celui qui compte le plus. */
  focus: string;
  /** Ligne 3 — quoi faire concrètement aujourd'hui. */
  action: string;
  tone: CoachTone;
}

const agoLabel = (ts: number): string => {
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  return `il y a ${days} j`;
};

const countCompletedSets = (entry: HistoryEntry): number =>
  Object.values(entry.exerciseProgress).reduce((sum, sets) => sum + sets.filter((s) => s.completed).length, 0);

const tonnageOf = (entry: HistoryEntry): number => entry.tonnage ?? computeTonnage(entry.exerciseProgress);

/**
 * Compte, sur une séance passée, les exercices dont la DERNIÈRE série faite
 * est tombée sous la fourchette (charge trop lourde) et ceux dont TOUTES les
 * séries ont atteint le haut de la fourchette (charge trop légère). C'est la
 * lecture que fait un coach en relisant un carnet d'entraînement.
 */
const readLoadFit = (entry: HistoryEntry, workout: WorkoutDay | undefined): { tooHeavy: number; tooLight: number } => {
  let tooHeavy = 0;
  let tooLight = 0;
  if (!workout) return { tooHeavy, tooLight };

  for (const exercise of workout.exercises) {
    const sets = entry.exerciseProgress[exercise.id];
    if (!sets) continue;
    // Un exercice remplacé en séance a été fait sur un autre mouvement : sa
    // fourchette n'est plus celle du programme, on ne le juge pas.
    if (entry.exerciseNameOverrides?.[exercise.id]) continue;
    const range = parseRepRange(exercise.targetReps);
    if (!range) continue;
    const done = sets.filter((s) => s.completed).map(numericReps).filter((r): r is number => r !== null);
    if (done.length === 0) continue;

    if (done[done.length - 1] <= range.min - COACH_LIMITS.repsGapToAct) tooHeavy++;
    else if (range.max !== range.min && done.length >= sets.length && done.every((r) => r >= range.max)) tooLight++;
  }
  return { tooHeavy, tooLight };
};

/**
 * Le récap de l'accueil : trois lignes, pas une de plus. On ne remonte QUE
 * le problème le plus prioritaire — un coach qui liste six points à corriger
 * n'en fait corriger aucun. L'ordre de priorité va du plus risqué pour le
 * corps (sur-volume, fatigue installée) au plus anodin (réglage de charge).
 */
export const getCoachBrief = (
  history: HistoryEntry[],
  resolveWorkout: (dayId: string) => WorkoutDay | undefined
): CoachBrief | null => {
  const last = history[0];
  if (!last) return null;

  const workout = resolveWorkout(last.dayId);
  const name = workout?.name ?? last.dayId;
  const sets = countCompletedSets(last);
  const tonnage = tonnageOf(last);

  // ── Ligne 1 : le récap chiffré, comparé à la même séance d'avant ──
  const sameDay = history.filter((h) => h.dayId === last.dayId);
  const previous = sameDay[1];
  let deltaLabel = '';
  let tonnageDropPct: number | null = null;
  if (previous) {
    const previousTonnage = tonnageOf(previous);
    if (previousTonnage > 0 && tonnage > 0) {
      const pct = Math.round(((tonnage - previousTonnage) / previousTonnage) * 100);
      if (pct !== 0) deltaLabel = ` (${pct > 0 ? '+' : '−'}${Math.abs(pct)} % vs la fois d'avant)`;
      if (pct < 0) tonnageDropPct = -pct;
    }
  }
  const recap = `${name}, ${agoLabel(last.date)} : ${sets} séries, ${tonnage.toLocaleString('fr-FR')} kg${deltaLabel}.`;

  // ── Ligne 2 et 3 : un seul point, le plus prioritaire ──

  // 1. Sur-volume : le seul cas où continuer comme ça abîme quelque chose.
  const volume = getEffectiveWeeklySets(history, 1);
  const overloaded = volume.find((v) => v.perWeek > COACH_LIMITS.volumeMax);
  if (overloaded) {
    return {
      recap,
      focus: `Trop de volume sur ${overloaded.group.toLowerCase()} : ${overloaded.perWeek} séries cette semaine, ${COACH_LIMITS.volumeMax} est le plafond à ton âge.`,
      action: `Coupe une série d'isolation sur ce groupe aujourd'hui.`,
      tone: 'warn',
    };
  }

  // 2. Deux baisses de suite : fatigue installée, c'est le signal de décharge.
  if (tonnageDropPct !== null && tonnageDropPct > COACH_LIMITS.perfDropPct && sameDay[2]) {
    const previousTonnage = tonnageOf(sameDay[1]);
    const beforeTonnage = tonnageOf(sameDay[2]);
    if (beforeTonnage > 0 && previousTonnage < beforeTonnage * (1 - COACH_LIMITS.perfDropPct / 100)) {
      return {
        recap,
        focus: `Deuxième séance de suite en baisse (−${tonnageDropPct} %) : c'est de la fatigue accumulée, pas un manque de motivation.`,
        action: `Semaine de décharge : 2 séries par exercice au lieu de 3, −15 % de charge, pendant 7 jours.`,
        tone: 'warn',
      };
    }
  }

  // 3. Plateau : le 1RM estimé ne bouge plus depuis des semaines.
  const plateau = detectPlateaus(history)[0];
  if (plateau) {
    return {
      recap,
      focus: `${plateau.exerciseName} stagne depuis ${plateau.weeksStuck} semaines au même niveau.`,
      action: `Change l'angle du mouvement, ou baisse de 10 % une semaine avant de relancer.`,
      tone: 'warn',
    };
  }

  // 4 et 5. Réglage de charge : le correctif le plus courant, et le plus simple.
  const fit = readLoadFit(last, workout);
  if (fit.tooHeavy > 0) {
    return {
      recap,
      focus: `Sur ${fit.tooHeavy} exercice${fit.tooHeavy > 1 ? 's' : ''} tu finis sous la fourchette de reps : la charge est un cran trop lourde.`,
      action: `Enlève environ 5 % sur ces exercices — la fourchette compte plus que le chiffre sur la barre.`,
      tone: 'down',
    };
  }
  if (fit.tooLight > 0) {
    return {
      recap,
      focus: `Tu as passé toutes tes séries en haut de fourchette sur ${fit.tooLight} exercice${fit.tooLight > 1 ? 's' : ''}.`,
      action: `Monte d'un cran dessus aujourd'hui et repars en bas de fourchette.`,
      tone: 'up',
    };
  }

  // 6. Sous-volume : moins urgent, mais c'est ce qui bloque la progression.
  const underworked = volume.filter((v) => v.perWeek < COACH_LIMITS.volumeMin).sort((a, b) => a.perWeek - b.perWeek)[0];
  if (underworked) {
    return {
      recap,
      focus: `${underworked.group.charAt(0) + underworked.group.slice(1).toLowerCase()} : ${underworked.perWeek} séries cette semaine, il en faut au moins ${COACH_LIMITS.volumeMin}.`,
      action: `Ajoute 1 à 2 séries sur ce groupe dès que ta séance le permet.`,
      tone: 'hold',
    };
  }

  // Rien à corriger : on le dit, et on rappelle la règle qui fait progresser.
  return {
    recap,
    focus: `Rien à corriger sur cette séance, tu es dans les clous.`,
    action: `Vise le haut de la fourchette sur toutes tes séries : c'est ça qui déclenche la montée de charge.`,
    tone: 'good',
  };
};

// ─── Nutrition ─────────────────────────────────────────────────────────────

export interface NutritionAdvice {
  /** Le conseil principal, chiffré quand on connaît le poids de corps. */
  main: string;
  /** Le rappel court en dessous (sommeil, hydratation). */
  secondary: string;
}

/**
 * Conseil nutrition. Deux choses volontairement absentes, et ce n'est pas
 * un oubli :
 *  - aucune notion de déficit calorique ou de « sèche ». Pendant la poussée
 *    de croissance, la restriction énergétique compromet la minéralisation
 *    osseuse et augmente les blessures (ANSES 2012-SA-0155, AAP, HAS 2025) ;
 *  - aucune recommandation de complément alimentaire. L'ANSES (avis
 *    2014-SA-0008, novembre 2016) a documenté des effets indésirables
 *    cardiovasculaires et psychiatriques ; le guide HAS d'octobre 2025
 *    signale en plus que les adolescents qui font de la musculation sont
 *    particulièrement sollicités par leur entourage pour en prendre.
 *
 * La « fenêtre anabolique de 30 minutes » a aussi disparu : Schoenfeld et
 * Aragon l'ont infirmée, la sensibilité du muscle dure 24 à 48 h.
 */
export const getNutritionAdvice = (bodyWeightKg?: number): NutritionAdvice => {
  if (bodyWeightKg && bodyWeightKg > 0) {
    const daily = Math.round(bodyWeightKg * COACH_LIMITS.proteinPerKg);
    const perMeal = Math.round(daily / COACH_LIMITS.proteinMeals / 5) * 5;
    return {
      main: `Un vrai repas dans les ${COACH_LIMITS.postWorkoutHours} h qui suivent, pas de course contre la montre. Sur la journée : ${daily} g de protéines, soit ~${perMeal} g par repas sur ${COACH_LIMITS.proteinMeals}.`,
      secondary: `${COACH_LIMITS.sleepMinHours} h de sommeil minimum — en dessous, le risque de blessure est multiplié par 1,7.`,
    };
  }
  return {
    main: `Un vrai repas dans les ${COACH_LIMITS.postWorkoutHours} h qui suivent, pas de course contre la montre. Vise ${fr(COACH_LIMITS.proteinPerKg)} g de protéines par kg de poids de corps sur la journée, répartis sur ${COACH_LIMITS.proteinMeals} repas.`,
    secondary: `${COACH_LIMITS.sleepMinHours} h de sommeil minimum — en dessous, le risque de blessure est multiplié par 1,7.`,
  };
};
