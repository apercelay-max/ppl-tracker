// ─── Adaptation d'une séance ───────────────────────────────────────────────
// Trois besoins réels, un seul moteur : on part de la séance du programme et
// on produit un plan de modifications (`SessionAdaptation`), appliqué ensuite
// par `applyAdaptation` pour obtenir la séance réellement faite.
//
//   1. « J'ai 35 minutes »  → raccourcir sans casser la séance : on rogne les
//      repos, puis les séries des isolations, puis on retire des isolations —
//      jamais le mouvement principal.
//   2. « Pas en forme »     → baisser les charges cibles, allonger les repos,
//      et remplacer les mouvements qui tapent sur une articulation sensible.
//   3. « Salle inconnue »   → remplacer les exercices dont le matériel n'est
//      pas disponible par l'équivalent le plus proche du catalogue.
//
// Le plan est volontairement explicite (une entrée par exercice modifié) :
// c'est ce qui permet d'afficher « voilà ce que j'ai changé » avant de
// démarrer, et de rejouer exactement la même adaptation après un rechargement
// de l'appli.

import type { Exercise, WorkoutDay, HistoryEntry } from '../data/types';
import { EXERCISE_CATALOG, type CatalogExercise, type Equipment } from '../data/exercisesCatalog';
import { findCatalogExercise, normalize } from './catalogMatch';
import { getLastExerciseSets } from './training';
import { roundToAchievable, roundToIncrement } from './plates';

// ─── Types ─────────────────────────────────────────────────────────────────

/** Articulations que Léo peut signaler comme sensibles avant une séance. */
export type SoreZone = 'epaule' | 'coude-poignet' | 'lombaires' | 'genou';

export interface GymProfile {
  barKg: number;
  ezBarKg: number;
  /** Poids d'un disque disponible, en kg (on suppose qu'on en a une paire). */
  plates: number[];
  /** Incrément le plus fin ailleurs (haltères, machines à goupille). */
  otherIncrementKg: number;
  /** Matériel disponible dans cette salle. */
  availableEquipment: Equipment[];
  /** Machines présentes, en toutes lettres (« presse à cuisses », « pec-deck »). */
  machines?: string[];
  /**
   * Vrai quand la liste ci-dessus est exhaustive. Tant que c'est faux, la
   * liste est purement indicative : on ne va pas déclarer un exercice
   * infaisable juste parce que Léo n'a pas fini de saisir ses machines.
   */
  machinesListComplete?: boolean;
}

/** Une salle enregistrée (voir Réglages → Mes salles). */
export interface Gym extends GymProfile {
  id: string;
  name: string;
}

export interface AdaptOptions {
  /** Minutes disponibles, null = pas de contrainte de temps. */
  timeBudgetMin: number | null;
  tired: boolean;
  soreZones: SoreZone[];
  /** Vrai quand on limite la séance au matériel coché (`availableEquipment`). */
  awayGym: boolean;
}

export interface ExerciseOverride {
  sets?: number;
  restSeconds?: number;
  name?: string;
  defaultWeight?: string;
}

export interface SessionAdaptation {
  dayId: string;
  options: AdaptOptions;
  removedIds: string[];
  overrides: Record<string, ExerciseOverride>;
  /** Lignes « ce que j'ai changé », affichées avant de démarrer. */
  summary: string[];
  /** Durée estimée après adaptation, en minutes. */
  estimatedMin: number;
  /** Durée estimée de la séance d'origine, en minutes. */
  baseMin: number;
  createdAt: number;
}

export const EMPTY_OPTIONS: AdaptOptions = {
  timeBudgetMin: null, tired: false, soreZones: [], awayGym: false,
};

export const isAdaptationActive = (a: SessionAdaptation | null): boolean =>
  !!a && (a.removedIds.length > 0 || Object.keys(a.overrides).length > 0);

// ─── Estimation de durée ───────────────────────────────────────────────────

/** Exercice d'isolation (par opposition à un gros polyarticulaire). */
const isIsolation = (ex: Exercise): boolean => {
  const cat = findCatalogExercise(ex.id, ex.name);
  if (cat) return cat.type === 'Isolation';
  return /curl|[ée]l[ée]vation|extension|[ée]cart|mollet|crunch|face pull|shrug|kickback/i.test(ex.name);
};

/** Temps d'exécution d'UNE série, hors repos. */
const setWorkSeconds = (targetReps: string): number => {
  const secondes = targetReps.match(/(\d+)\s*s/i);
  if (secondes) return parseInt(secondes[1]) + 10;
  if (/amrap|max/i.test(targetReps)) return 60;
  const range = targetReps.match(/(\d+)\s*-\s*(\d+)/);
  const reps = range ? (parseInt(range[1]) + parseInt(range[2])) / 2 : parseInt(targetReps) || 10;
  // ~3,5 s par rep (tempo contrôlé) + mise en place de la série.
  return Math.round(reps * 3.5) + 12;
};

/** Temps de mise en place/déplacement entre deux exercices. */
const TRANSITION_SECONDS = 60;
/** Séries d'échauffement avant un gros exercice (pas dans le programme). */
const WARMUP_SECONDS = 90;

export const estimateExerciseSeconds = (ex: Exercise): number => {
  const work = setWorkSeconds(ex.targetReps) * ex.sets;
  // Un exercice de superset en 1re position n'a pas de repos après lui.
  // Sinon on compte un repos par série : celui de la dernière série sert de
  // transition vers l'exercice suivant, il est bien pris.
  const rest = ex.restMode === 'superset' && ex.supersetOrder === 1 ? 0 : ex.restSeconds * ex.sets;
  const bilateral = ex.restMode === 'bilateral' ? (ex.bilateralRestSeconds ?? 45) * ex.sets : 0;
  const warmup = isIsolation(ex) ? 0 : WARMUP_SECONDS;
  return work + rest + bilateral + warmup;
};

export const estimateWorkoutMinutes = (exercises: Exercise[]): number => {
  const seconds = exercises.reduce((sum, ex) => sum + estimateExerciseSeconds(ex), 0)
    + TRANSITION_SECONDS * exercises.length;
  return Math.round(seconds / 60);
};

// ─── Matériel : ce qu'un exercice demande ──────────────────────────────────

const EQUIPMENT_KEYWORDS: [RegExp, Equipment][] = [
  [/poulie|c[aâ]ble|tirage vertical|tirage horizontal/i, 'Poulie'],
  [/haltere|halt[eè]re|dumbbell/i, 'Haltères'],
  [/machine|presse|leg curl|leg extension|pec deck|convergent|guid[ée]/i, 'Machine'],
  [/barre ez|ez/i, 'Barre EZ'],
  [/barre|soulev[ée] de terre|squat|d[ée]velopp[ée] couch[ée]|rowing/i, 'Barre'],
  [/traction|dips|pompe|gainage|planche|poids du corps|pdc|crunch|l-sit/i, 'Poids du corps'],
  [/elastique|[ée]lastique/i, 'Élastique'],
  [/kettlebell/i, 'Kettlebell'],
];

/**
 * Matériel nécessaire pour un exercice de programme. On passe d'abord par la
 * fiche catalogue (fiable quand elle est trouvée), sinon par mots-clés du nom.
 */
export const inferEquipment = (ex: Exercise): Equipment => {
  // Les noms de programme sont écrits à la main et disent explicitement le
  // matériel (« ... haltères », « ... poulie ») : quand c'est le cas, ils sont
  // plus fiables que le rapprochement catalogue, qui peut renvoyer la version
  // barre d'un mouvement fait aux haltères.
  for (const [re, eq] of EQUIPMENT_KEYWORDS) {
    if (re.test(ex.name)) return eq;
  }
  const cat = findCatalogExercise(ex.id, ex.name);
  if (cat) return cat.equipment;
  return 'Autre';
};

/**
 * La salle a-t-elle la machine que demande cet exercice ? Comparaison par mots
 * significatifs (« Presse à cuisses 45° » couvre « presse à cuisses »), et on
 * répond toujours oui tant que la liste n'est pas déclarée complète.
 */
export const gymHasMachineFor = (exerciseName: string, gym: GymProfile): boolean => {
  if (!gym.machinesListComplete) return true;
  const machines = gym.machines ?? [];
  if (machines.length === 0) return false;
  const words = (s: string) =>
    new Set(normalize(s).split(/[^a-z0-9]+/).filter((w) => w.length > 3));
  const wanted = words(exerciseName);
  if (wanted.size === 0) return true;
  return machines.some((m) => {
    const mots = words(m);
    if (mots.size === 0) return false;
    let commun = 0;
    for (const w of mots) if (wanted.has(w)) commun++;
    // Au moins un mot fort en commun, et il doit couvrir la moitié du nom
    // de la machine — « poulie » seul ne doit pas valider « pec-deck ».
    return commun > 0 && commun >= Math.min(2, mots.size);
  });
};

/** Vrai si l'exercice se charge sur une barre (donc calcul de disques utile). */
export const usesBarbell = (ex: Exercise): 'Barre' | 'Barre EZ' | null => {
  const eq = inferEquipment(ex);
  return eq === 'Barre' || eq === 'Barre EZ' ? eq : null;
};

// ─── Articulations sensibles ───────────────────────────────────────────────

interface ZoneRule {
  label: string;
  /** Mouvements à éviter quand la zone est sensible. */
  risky: RegExp;
  /** Matériel préféré pour le remplaçant (plus guidé = moins de contrainte). */
  prefer: Equipment[];
}

const ZONE_RULES: Record<SoreZone, ZoneRule> = {
  epaule: {
    label: 'épaule',
    risky: /d[ée]velopp[ée] (militaire|nuque|[ée]paules?|vertical)|dips|[ée]cart[ée]|arnold|pull-?over|tirage nuque|rowing menton|[ée]l[ée]vations? lat[ée]rales? barre/i,
    prefer: ['Machine', 'Poulie'],
  },
  'coude-poignet': {
    label: 'coude / poignet',
    risky: /barre (droite|ez)?|extension (nuque|triceps) barre|curl barre|dips|skull ?crusher|prise pronation/i,
    prefer: ['Poulie', 'Haltères', 'Machine'],
  },
  lombaires: {
    label: 'lombaires',
    risky: /soulev[ée] de terre|rowing barre|good ?morning|squat (barre|arri[eè]re)|fente barre|buste pench[ée]|hyperextension/i,
    prefer: ['Machine', 'Poulie'],
  },
  genou: {
    label: 'genou',
    risky: /squat|fente|leg extension|presse|step-?up|sissy/i,
    prefer: ['Machine', 'Poulie'],
  },
};

// ─── Recherche d'un remplaçant dans le catalogue ───────────────────────────

interface SubstituteQuery {
  exercise: Exercise;
  allowedEquipment: Equipment[] | null;
  /** Regex des mouvements à éviter (articulation sensible). */
  avoid?: RegExp;
  preferEquipment?: Equipment[];
  /**
   * Salle où l'exercice sera fait : sert à ne pas proposer une machine qui
   * n'y est pas non plus (quand la liste des machines est déclarée complète).
   */
  gym?: GymProfile;
}

/**
 * Meilleur remplaçant possible : même groupe musculaire avant tout, puis même
 * famille de mouvement (poly/isolation, poussée/tirage), avec du matériel
 * autorisé. Renvoie null plutôt qu'un remplaçant douteux — mieux vaut retirer
 * l'exercice que proposer n'importe quoi.
 */
export const findSubstitute = ({
  exercise, allowedEquipment, avoid, preferEquipment, gym,
}: SubstituteQuery): CatalogExercise | null => {
  const original = findCatalogExercise(exercise.id, exercise.name);
  const group = original?.group ?? exercise.muscleGroup;
  const originalName = normalize(exercise.name);

  const candidates = EXERCISE_CATALOG.filter((c) => {
    if (c.group !== group) return false;
    if (normalize(c.name) === originalName) return false;
    if (allowedEquipment && !allowedEquipment.includes(c.equipment)) return false;
    if (avoid && avoid.test(c.name)) return false;
    if (c.equipment === 'Machine' && gym && !gymHasMachineFor(c.name, gym)) return false;
    return true;
  });
  if (candidates.length === 0) return null;

  // Même quand la fiche d'origine est introuvable au catalogue (noms de
  // programme trop personnalisés), on sait au moins si c'est une isolation :
  // remplacer un écarté par un développé couché serait un contresens.
  const wantIsolation = original ? original.type === 'Isolation' : isIsolation(exercise);
  const originalWords = new Set(
    normalize(exercise.name).split(/[^a-z0-9]+/).filter((w) => w.length > 3)
  );

  const score = (c: CatalogExercise): number => {
    let s = 0;
    if (preferEquipment?.includes(c.equipment)) s += 5;
    if ((c.type === 'Isolation') === wantIsolation) s += 6;
    if (original) {
      if (c.pattern === original.pattern) s += 3;
      // Muscles ciblés en commun : c'est ça qui fait un vrai équivalent.
      const primary = new Set(original.primary);
      s += c.primary.filter((m) => primary.has(m)).length * 2;
    }
    // Mots en commun avec le nom d'origine : « écarté » retrouve « écarté ».
    const words = normalize(c.name).split(/[^a-z0-9]+/);
    s += words.filter((w) => w.length > 3 && originalWords.has(w)).length * 2;
    if (c.essential) s += 2;
    if (c.level === 'Débutant') s += 1;
    return s;
  };

  let best = candidates[0];
  let bestScore = score(best);
  for (const c of candidates.slice(1)) {
    const sc = score(c);
    if (sc > bestScore) { best = c; bestScore = sc; }
  }
  // Un remplaçant qui ne partage ni le type ni un muscle principal n'en est
  // pas un : on préfère ne rien proposer.
  return bestScore >= 6 ? best : null;
};

// ─── Construction du plan d'adaptation ─────────────────────────────────────

/** Poids de travail de la dernière fois sur cet exercice (kg), si connu. */
const lastWorkingWeight = (history: HistoryEntry[], exerciseId: string): number | null => {
  const sets = getLastExerciseSets(history, exerciseId);
  if (!sets) return null;
  let best = 0;
  for (const s of sets) {
    if (!s.completed || s.reps === '—') continue;
    const w = parseFloat(s.weight);
    if (!isNaN(w) && w > best) best = w;
  }
  return best > 0 ? best : null;
};

/** Les exercices d'un même superset doivent être traités ensemble. */
const groupKey = (ex: Exercise): string => ex.supersetGroupId ?? ex.id;

const fmtKg = (n: number): string => (Math.round(n * 100) / 100).toString();

export const buildAdaptation = (
  workout: WorkoutDay,
  options: AdaptOptions,
  history: HistoryEntry[],
  gym: GymProfile
): SessionAdaptation => {
  const summary: string[] = [];
  const removedIds: string[] = [];
  const overrides: Record<string, ExerciseOverride> = {};
  const baseMin = estimateWorkoutMinutes(workout.exercises);

  // Copie de travail : c'est elle qu'on modifie et qu'on ré-estime.
  let working: Exercise[] = workout.exercises.map((ex) => ({ ...ex }));

  const setOverride = (id: string, patch: ExerciseOverride) => {
    overrides[id] = { ...overrides[id], ...patch };
  };

  // ── 1. Salle inconnue : remplacer ce qui n'est pas faisable ──────────────
  if (options.awayGym && gym.availableEquipment.length > 0) {
    for (const ex of working) {
      const needed = inferEquipment(ex);
      const equipementOk = needed === 'Autre' || gym.availableEquipment.includes(needed);
      // Une machine peut être « disponible » en catégorie mais absente de
      // cette salle en particulier (liste des machines déclarée complète).
      const machineOk = needed !== 'Machine' || gymHasMachineFor(ex.name, gym);
      if (equipementOk && machineOk) continue;
      const raison = !equipementOk ? `${needed} indisponible` : 'machine absente de cette salle';
      const sub = findSubstitute({ exercise: ex, allowedEquipment: gym.availableEquipment, gym });
      if (sub) {
        const before = ex.name;
        ex.name = sub.name;
        setOverride(ex.id, { name: sub.name });
        summary.push(`${before} → ${sub.name} (${raison})`);
      } else {
        removedIds.push(ex.id);
        summary.push(`${ex.name} retiré : ${raison}, aucun équivalent`);
      }
    }
    working = working.filter((ex) => !removedIds.includes(ex.id));
  }

  // ── 2. Articulation sensible : remplacer les mouvements à risque ─────────
  for (const zone of options.soreZones) {
    const rule = ZONE_RULES[zone];
    for (const ex of working) {
      if (removedIds.includes(ex.id)) continue;
      if (!rule.risky.test(ex.name)) continue;
      const sub = findSubstitute({
        exercise: ex,
        allowedEquipment: options.awayGym ? gym.availableEquipment : null,
        avoid: rule.risky,
        preferEquipment: rule.prefer,
        gym: options.awayGym ? gym : undefined,
      });
      if (sub) {
        const before = ex.name;
        ex.name = sub.name;
        setOverride(ex.id, { name: sub.name });
        summary.push(`${before} → ${sub.name} (${rule.label} sensible)`);
      } else {
        removedIds.push(ex.id);
        summary.push(`${ex.name} retiré (${rule.label} sensible, pas d'équivalent)`);
      }
    }
    working = working.filter((ex) => !removedIds.includes(ex.id));
  }

  // ── 3. Pas en forme : charges en baisse, repos plus longs ────────────────
  if (options.tired) {
    const LOAD_FACTOR = 0.9;
    const REST_FACTOR = 1.2;
    let adjusted = 0;
    for (const ex of working) {
      const last = lastWorkingWeight(history, ex.id);
      if (last !== null) {
        const target = last * LOAD_FACTOR;
        const bar = usesBarbell(ex);
        const rounded = bar
          ? roundToAchievable(target, bar === 'Barre EZ' ? gym.ezBarKg : gym.barKg, gym.plates)
          : roundToIncrement(target, gym.otherIncrementKg);
        if (rounded > 0 && rounded < last) {
          ex.defaultWeight = fmtKg(rounded);
          setOverride(ex.id, { defaultWeight: fmtKg(rounded) });
          adjusted++;
        }
      }
      const newRest = Math.round((ex.restSeconds * REST_FACTOR) / 5) * 5;
      if (newRest !== ex.restSeconds) {
        ex.restSeconds = newRest;
        setOverride(ex.id, { restSeconds: newRest });
      }
    }
    summary.push(`Charges cibles à -10 %${adjusted > 0 ? ` (${adjusted} exercices)` : ''} et repos rallongés de 20 %`);
  }

  // ── 4. Budget temps : rogner jusqu'à ce que ça rentre ────────────────────
  if (options.timeBudgetMin && options.timeBudgetMin > 0) {
    const budget = options.timeBudgetMin;
    const fits = () => estimateWorkoutMinutes(working) <= budget;

    // 4a. Repos raccourcis (planchers : 45 s isolation, 90 s polyarticulaire).
    if (!fits()) {
      let trimmed = false;
      for (const ex of working) {
        if (ex.restMode === 'superset' && ex.supersetOrder === 1) continue;
        const floor = isIsolation(ex) ? 45 : 90;
        const target = Math.max(floor, Math.round((ex.restSeconds * 0.75) / 5) * 5);
        if (target < ex.restSeconds) {
          ex.restSeconds = target;
          setOverride(ex.id, { restSeconds: target });
          trimmed = true;
        }
      }
      if (trimmed) summary.push('Repos resserrés (45 s minimum sur les isolations)');
    }

    // 4b. Une série en moins sur les isolations, en partant de la fin.
    if (!fits()) {
      let cut = 0;
      for (let i = working.length - 1; i >= 0 && !fits(); i--) {
        const ex = working[i];
        if (!isIsolation(ex) || ex.sets <= 2) continue;
        ex.sets -= 1;
        setOverride(ex.id, { sets: ex.sets });
        cut++;
      }
      if (cut > 0) summary.push(`${cut} série${cut > 1 ? 's' : ''} d'isolation en moins`);
    }

    // 4c. Retrait d'isolations complètes, en partant de la fin. On garde
    // toujours au moins 3 exercices et on ne touche jamais au premier
    // (le mouvement principal de la séance).
    if (!fits()) {
      const dropped: string[] = [];
      let progress = true;
      while (!fits() && progress) {
        progress = false;
        // On retire le dernier bloc d'isolation retirable, puis on ré-estime.
        for (let i = working.length - 1; i >= 1; i--) {
          const ex = working[i];
          if (!isIsolation(ex)) continue;
          // Un superset se retire en entier ou pas du tout.
          const key = groupKey(ex);
          const pair = working.filter((e) => groupKey(e) === key);
          if (pair.some((e) => !isIsolation(e))) continue;
          if (working.length - pair.length < 3) continue;
          for (const p of pair) {
            removedIds.push(p.id);
            dropped.push(p.name);
          }
          working = working.filter((e) => !removedIds.includes(e.id));
          progress = true;
          break;
        }
      }
      if (dropped.length > 0) summary.push(`Retiré : ${dropped.join(', ')}`);
    }

    // 4d. Dernier recours : une série en moins sur les polyarticulaires.
    if (!fits()) {
      let cut = 0;
      for (let i = working.length - 1; i >= 0 && !fits(); i--) {
        const ex = working[i];
        if (ex.sets <= 2) continue;
        ex.sets -= 1;
        setOverride(ex.id, { sets: ex.sets });
        cut++;
      }
      if (cut > 0) summary.push(`${cut} série${cut > 1 ? 's' : ''} en moins sur les gros exercices`);
    }

    const finalMin = estimateWorkoutMinutes(working);
    if (finalMin > budget) {
      summary.push(`Impossible de descendre sous ${finalMin} min sans casser la séance`);
    }
  }

  return {
    dayId: workout.id,
    options,
    removedIds,
    overrides,
    summary,
    estimatedMin: estimateWorkoutMinutes(working),
    baseMin,
    createdAt: Date.now(),
  };
};

/** Applique un plan à la séance du programme. Fonction pure. */
export const applyAdaptation = (workout: WorkoutDay, adaptation: SessionAdaptation | null): WorkoutDay => {
  if (!adaptation || adaptation.dayId !== workout.id) return workout;
  if (!isAdaptationActive(adaptation)) return workout;

  const exercises = workout.exercises
    .filter((ex) => !adaptation.removedIds.includes(ex.id))
    .map((ex) => {
      const o = adaptation.overrides[ex.id];
      if (!o) return ex;
      return {
        ...ex,
        sets: o.sets ?? ex.sets,
        restSeconds: o.restSeconds ?? ex.restSeconds,
        name: o.name ?? ex.name,
        defaultWeight: o.defaultWeight ?? ex.defaultWeight,
      };
    });

  return {
    ...workout,
    exercises,
    estimatedDuration: `≈ ${adaptation.estimatedMin} min`,
  };
};

export const ZONE_LABELS: Record<SoreZone, string> = {
  epaule: 'Épaule',
  'coude-poignet': 'Coude / poignet',
  lombaires: 'Lombaires',
  genou: 'Genou',
};
