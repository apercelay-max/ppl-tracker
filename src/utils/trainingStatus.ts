import type { CardioEntry, HistoryEntry } from '../data/types';
import { isPerformedSet } from './weight';
import { getMuscleRecoverySummary } from './training';

// ─── Statut d'entraînement (dans l'esprit de celui des montres Garmin) ──────
//
// Garmin croise trois choses : la charge des 7 derniers jours comparée à celle
// des semaines d'avant, la tendance de performance (la VO2max, chez eux), et
// la VFC. Son algorithme n'est pas public : ceci est une ADAPTATION à la
// musculation, avec des seuils qui sont des heuristiques (tous regroupés dans
// THRESHOLDS pour pouvoir les ajuster) :
//   - charge       = RPE × minutes (méthode session-RPE de Foster, comme le
//                    reste de l'app), cardio compris ;
//   - performance  = évolution du 1RM estimé sur les exercices faits assez
//                    souvent (à la place de la VO2max) ;
//   - VFC, sommeil = signaux facultatifs (HealthSignals), vides tant que
//                    l'app n'est pas branchée à Apple Santé ou Garmin Connect.

const DAY_MS = 24 * 3600 * 1000;

export const THRESHOLDS = {
  /** RPE supposé quand la séance n'en a pas (échelle 1-10). */
  defaultRpe: 6,
  /** Minutes par série quand la durée n'est pas connue (import Fitbod…), repos compris. */
  minutesPerSetFallback: 2.5,
  /** Ratio charge aiguë / chronique. */
  ratioLow: 0.8,
  ratioHighFrom: 1.3,
  ratioVeryHighFrom: 1.5,
  /** Variation du 1RM estimé (en %) au-delà de laquelle on parle de hausse / baisse. */
  trendPct: 1.5,
  /** Jours sans aucune activité avant de parler de désentraînement. */
  detrainingDays: 10,
  /** Il faut au moins ce recul et ce nombre de séances pour donner un statut. */
  minSpanDays: 14,
  minSessions: 4,
} as const;

// ── Signaux de santé (Apple Santé, Garmin Connect…) ─────────────────────────
export interface HealthSignals {
  /** Score de sommeil de la dernière nuit, 0-100. */
  sleepScore?: number;
  /** Statut de VFC (variabilité de la fréquence cardiaque) par rapport à sa base personnelle. */
  hrvStatus?: 'balanced' | 'unbalanced' | 'low';
  restingHr?: number;
  source?: 'apple-sante' | 'garmin-connect' | 'manuel';
}

// ── Charge ──────────────────────────────────────────────────────────────────
interface LoadPoint { date: number; load: number; estimated: boolean }

const setsPerformed = (e: HistoryEntry): number =>
  Object.values(e.exerciseProgress).flat().filter(isPerformedSet).length;

/** Charge d'une séance de muscu : celle enregistrée, sinon estimée (et marquée comme telle). */
export const strengthLoad = (e: HistoryEntry): LoadPoint => {
  if (typeof e.trainingLoad === 'number') return { date: e.date, load: e.trainingLoad, estimated: false };
  const minutes = e.durationMs > 0 ? e.durationMs / 60000 : setsPerformed(e) * THRESHOLDS.minutesPerSetFallback;
  const rpe = e.rpe ?? THRESHOLDS.defaultRpe;
  // Sans RPE ni durée mesurée, la charge est une estimation.
  return { date: e.date, load: Math.round(rpe * minutes), estimated: e.rpe === undefined || e.durationMs <= 0 };
};

const cardioLoad = (c: CardioEntry): LoadPoint => ({
  date: c.date,
  load: Math.round((c.rpe ?? 5) * c.durationMin),
  estimated: c.rpe === undefined,
});

const allLoads = (history: HistoryEntry[], cardio: CardioEntry[]): LoadPoint[] =>
  [...history.map(strengthLoad), ...cardio.map(cardioLoad)];

/** Charge par semaine glissante (index 0 = semaine en cours), pour le graphique. */
export const weeklyLoads = (history: HistoryEntry[], cardio: CardioEntry[], weeks = 8, now = Date.now()): number[] => {
  const out = new Array<number>(weeks).fill(0);
  for (const p of allLoads(history, cardio)) {
    const w = Math.floor((now - p.date) / (7 * DAY_MS));
    if (w >= 0 && w < weeks) out[w] += p.load;
  }
  return out;
};

// ── Tendance de performance (1RM estimé) ────────────────────────────────────
export type PerformanceTrend = 'up' | 'flat' | 'down' | 'unknown';

const performanceTrend = (history: HistoryEntry[], now: number): { trend: PerformanceTrend; changePct: number | null; exercises: number } => {
  const recent = new Map<string, number>(); // 0-21 j
  const prior = new Map<string, number>();  // 22-63 j
  for (const e of history) {
    const age = (now - e.date) / DAY_MS;
    if (age < 0 || age > 63) continue;
    const bucket = age <= 21 ? recent : prior;
    for (const [exId, sets] of Object.entries(e.exerciseProgress)) {
      if (e.exerciseNameOverrides?.[exId]) continue; // autre mouvement que celui prévu
      let best = 0;
      for (const s of sets) {
        if (!s.completed) continue;
        const w = parseFloat(s.weight);
        const r = parseInt(s.reps, 10);
        // Epley n'est fiable qu'en séries courtes.
        if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0 || r > 12) continue;
        best = Math.max(best, w * (1 + r / 30));
      }
      if (best > (bucket.get(exId) ?? 0)) bucket.set(exId, best);
    }
  }
  const changes: number[] = [];
  for (const [exId, r] of recent) {
    const p = prior.get(exId);
    if (p) changes.push(((r - p) / p) * 100);
  }
  if (changes.length < 2) return { trend: 'unknown', changePct: null, exercises: changes.length };
  changes.sort((a, b) => a - b);
  const mid = Math.floor(changes.length / 2);
  const median = changes.length % 2 ? changes[mid] : (changes[mid - 1] + changes[mid]) / 2;
  const trend: PerformanceTrend = median > THRESHOLDS.trendPct ? 'up' : median < -THRESHOLDS.trendPct ? 'down' : 'flat';
  return { trend, changePct: Math.round(median * 10) / 10, exercises: changes.length };
};

// ── Statut ──────────────────────────────────────────────────────────────────
export type TrainingStatusKey =
  | 'productive' | 'maintaining' | 'peaking' | 'recovery'
  | 'unproductive' | 'overreaching' | 'detraining' | 'none';

export const STATUS_LABEL: Record<TrainingStatusKey, string> = {
  productive: 'Productif',
  maintaining: 'Maintien',
  peaking: 'Pic de forme',
  recovery: 'Récupération',
  unproductive: 'Improductif',
  overreaching: 'Surmenage',
  detraining: 'Désentraînement',
  none: 'Aucun statut',
};

export type LoadZone = 'low' | 'optimal' | 'high' | 'veryHigh';

export interface TrainingStatus {
  status: TrainingStatusKey;
  detail: string;
  /** Charge des 7 derniers jours. */
  acuteLoad: number;
  /** Charge hebdomadaire moyenne sur les 28 derniers jours. */
  chronicLoad: number;
  ratio: number | null;
  zone: LoadZone | null;
  /** Bornes de la zone optimale pour la charge aiguë (0,8 à 1,3 × chronique). */
  optimalRange: { min: number; max: number } | null;
  trend: PerformanceTrend;
  trendChangePct: number | null;
  /** Vrai si une part de la charge vient d'une estimation (RPE ou durée non saisis). */
  loadEstimated: boolean;
  daysSinceLastActivity: number | null;
}

export const computeTrainingStatus = (
  history: HistoryEntry[],
  cardio: CardioEntry[] = [],
  now = Date.now(),
): TrainingStatus => {
  const loads = allLoads(history, cardio);
  let acute = 0;
  let chronic28 = 0;
  let loadEstimated = false;
  for (const p of loads) {
    const age = (now - p.date) / DAY_MS;
    if (age < 0 || age >= 28) continue;
    chronic28 += p.load;
    if (p.estimated) loadEstimated = true;
    if (age < 7) acute += p.load;
  }
  const chronic = chronic28 / 4;
  const ratio = chronic > 0 ? acute / chronic : null;
  const zone: LoadZone | null = ratio === null ? null
    : ratio < THRESHOLDS.ratioLow ? 'low'
    : ratio > THRESHOLDS.ratioVeryHighFrom ? 'veryHigh'
    : ratio > THRESHOLDS.ratioHighFrom ? 'high' : 'optimal';
  const optimalRange = chronic > 0
    ? { min: Math.round(chronic * THRESHOLDS.ratioLow), max: Math.round(chronic * THRESHOLDS.ratioHighFrom) }
    : null;

  const dates = loads.map((p) => p.date);
  const last = dates.length ? Math.max(...dates) : null;
  const first = dates.length ? Math.min(...dates) : null;
  const daysSinceLast = last === null ? null : Math.floor((now - last) / DAY_MS);
  const { trend, changePct } = performanceTrend(history, now);

  const base = { acuteLoad: Math.round(acute), chronicLoad: Math.round(chronic), ratio: ratio === null ? null : Math.round(ratio * 100) / 100, zone, optimalRange, trend, trendChangePct: changePct, loadEstimated, daysSinceLastActivity: daysSinceLast };
  const make = (status: TrainingStatusKey, detail: string): TrainingStatus => ({ status, detail, ...base });

  const span = first === null ? 0 : (now - first) / DAY_MS;
  if (history.length < THRESHOLDS.minSessions || span < THRESHOLDS.minSpanDays) {
    return make('none', "Il faut au moins deux semaines et quelques séances pour établir un statut. Continue, il apparaîtra tout seul.");
  }
  if (daysSinceLast !== null && daysSinceLast >= THRESHOLDS.detrainingDays) {
    return make('detraining', `Aucune activité depuis ${daysSinceLast} jours : la forme commence à retomber. Une séance, même courte, relance la machine.`);
  }
  if (ratio === null) {
    return make('none', "Pas assez d'activité sur les 4 dernières semaines pour comparer ta charge.");
  }

  const trendTxt = changePct === null ? '' : ` (force ${changePct > 0 ? '+' : ''}${changePct} %)`;
  if (ratio > THRESHOLDS.ratioVeryHighFrom) {
    return trend === 'down'
      ? make('overreaching', `Charge très supérieure à ta moyenne et force en baisse${trendTxt} : le corps ne suit plus. Allège quelques jours.`)
      : make('productive', `Charge très supérieure à ta moyenne${trendTxt}, mais tu progresses encore. Surveille la fatigue : ça ne peut pas durer.`);
  }
  if (ratio < THRESHOLDS.ratioLow) {
    if (trend === 'up') return make('peaking', `Charge en baisse et force en hausse${trendTxt} : tu es frais et fort, bon moment pour tenter des records.`);
    if (trend === 'down' && daysSinceLast !== null && daysSinceLast >= 7) {
      return make('detraining', `Très peu de charge cette semaine et force en baisse${trendTxt}. Reprends progressivement.`);
    }
    return make('recovery', "Charge légère cette semaine : le corps a bien récupéré. Tu peux relancer une séance dès que l'envie est là.");
  }
  if (trend === 'up') return make('productive', `Charge adaptée et force en hausse${trendTxt} : ton entraînement porte ses fruits.`);
  if (trend === 'down') return make('unproductive', `Charge normale mais force en baisse${trendTxt} : sommeil, nutrition ou volume à revoir.`);
  return make('maintaining', trend === 'unknown'
    ? "Charge régulière. La tendance de force n'est pas encore lisible (il faut les mêmes exercices sur plusieurs semaines)."
    : "Charge régulière et force stable : tu entretiens tes acquis. Pour progresser, augmente un peu la charge ou le volume.");
};

// ── Aptitude à l'entraînement (état de forme du jour) ───────────────────────
export type ReadinessLevel = 'excellent' | 'high' | 'moderate' | 'low';

export const READINESS_LABEL: Record<ReadinessLevel, string> = {
  excellent: 'Excellente',
  high: 'Élevée',
  moderate: 'Modérée',
  low: 'Faible',
};

export interface Readiness {
  score: number; // 0-100
  level: ReadinessLevel;
  /** Ce qui pèse dans le score, du plus important au moins important. */
  factors: string[];
  /** Signaux qui manquent pour un score plus fin (proposés tant qu'aucune source n'est reliée). */
  missing: ('sommeil' | 'VFC')[];
}

export const computeReadiness = (
  history: HistoryEntry[],
  status: TrainingStatus,
  signals?: HealthSignals,
  now = Date.now(),
): Readiness => {
  let score = 100;
  const penalties: { pts: number; text: string }[] = [];
  const add = (pts: number, text: string) => { if (pts !== 0) { score -= pts; penalties.push({ pts: Math.abs(pts), text }); } };

  // Statut 'none' = pas assez de recul (moins de 4 séances / 2 semaines) : le
  // rapport charge aiguë / habituelle n'a alors aucune base (la 1re séance donne
  // « ×4 ») et ne doit pas faire baisser le score d'un débutant.
  if (status.status !== 'none') {
    if (status.zone === 'veryHigh') add(35, 'charge de la semaine très élevée');
    else if (status.zone === 'high') add(20, 'charge de la semaine élevée');
  }

  const lastStrength = history[0]?.date;
  if (lastStrength) {
    const hours = (now - (lastStrength + Math.max(0, history[0].durationMs))) / 3600000;
    if (hours < 24) add(20, 'dernière séance il y a moins de 24 h');
    else if (hours < 48) add(8, 'dernière séance il y a moins de 48 h');
  }

  const { averagePct } = getMuscleRecoverySummary(history);
  const muscleFatigue = Math.round((1 - averagePct) * 30);
  if (muscleFatigue >= 5) add(muscleFatigue, 'muscles pas encore récupérés');

  if (signals?.sleepScore !== undefined) {
    const adj = Math.max(-15, Math.min(15, Math.round((signals.sleepScore - 70) * 0.3)));
    add(-adj, adj < 0 ? 'sommeil moyen' : 'bon sommeil');
  }
  if (signals?.hrvStatus === 'low') add(15, 'VFC basse');
  else if (signals?.hrvStatus === 'unbalanced') add(7, 'VFC déséquilibrée');
  else if (signals?.hrvStatus === 'balanced') add(-3, 'VFC équilibrée');

  score = Math.max(0, Math.min(100, Math.round(score)));
  const level: ReadinessLevel = score >= 85 ? 'excellent' : score >= 65 ? 'high' : score >= 45 ? 'moderate' : 'low';
  const missing: Readiness['missing'] = [];
  if (signals?.sleepScore === undefined) missing.push('sommeil');
  if (signals?.hrvStatus === undefined) missing.push('VFC');
  return { score, level, factors: penalties.sort((a, b) => b.pts - a.pts).map((p) => p.text), missing };
};
