// ─── Calcul des disques ────────────────────────────────────────────────────
// « 42,5 kg » ne veut rien dire tant qu'on ne sait pas ce qu'on met sur la
// barre. Ce module répond à deux questions concrètes, à partir du matériel
// réellement disponible dans la salle (voir gymProfile dans le store) :
//   1. quels disques mettre de chaque côté pour atteindre une charge ;
//   2. si la charge est impossible, quelles sont les charges les plus proches
//      réellement faisables (au-dessus et en dessous).
//
// Tout est fait en entiers de centièmes de kg en interne : les additions de
// 2,5 / 1,25 en virgule flottante finissent sinon par produire des 42,49999
// et des comparaisons fausses.

export interface PlatePair {
  /** Poids d'UN disque (kg) — il en faut deux, un par côté. */
  plate: number;
  /** Nombre de disques par côté. */
  count: number;
}

export interface PlateSolution {
  /** Disques à mettre de chaque côté, du plus lourd au plus léger. */
  perSide: PlatePair[];
  /** Charge totale réellement obtenue (barre comprise). */
  achieved: number;
  /** Vrai si `achieved` correspond exactement à la charge demandée. */
  exact: boolean;
}

/** Nombre max de disques par côté — au-delà ça ne rentre plus sur la barre. */
const MAX_PLATES_PER_SIDE = 8;

const toCents = (kg: number): number => Math.round(kg * 100);
const fromCents = (c: number): number => c / 100;

/**
 * Toutes les charges par côté atteignables avec les disques dispo, avec le
 * détail des disques utilisés. Programmation dynamique classique : on part de
 * 0 et on ajoute les disques un par un, en gardant pour chaque somme la
 * première combinaison trouvée (donc celle avec le moins de disques, puisque
 * l'exploration se fait par nombre de disques croissant).
 */
const reachablePerSide = (plates: number[], limitCents: number): Map<number, PlatePair[]> => {
  const sorted = [...new Set(plates.filter((p) => p > 0))].sort((a, b) => b - a);
  const reached = new Map<number, PlatePair[]>();
  reached.set(0, []);
  let frontier: number[] = [0];

  for (let depth = 0; depth < MAX_PLATES_PER_SIDE && frontier.length > 0; depth++) {
    const next: number[] = [];
    for (const sum of frontier) {
      const combo = reached.get(sum)!;
      for (const plate of sorted) {
        // On n'ajoute qu'un disque ≤ au plus léger déjà posé : ça évite
        // d'explorer 10+2,5 ET 2,5+10 (même combinaison, deux chemins).
        const lightest = combo.length > 0 ? combo[combo.length - 1].plate : Infinity;
        if (plate > lightest) continue;
        const sumNext = sum + toCents(plate);
        if (sumNext > limitCents) continue;
        if (reached.has(sumNext)) continue;
        const nextCombo = combo.length > 0 && combo[combo.length - 1].plate === plate
          ? [...combo.slice(0, -1), { plate, count: combo[combo.length - 1].count + 1 }]
          : [...combo, { plate, count: 1 }];
        reached.set(sumNext, nextCombo);
        next.push(sumNext);
      }
    }
    frontier = next;
  }
  return reached;
};

/**
 * Décompose une charge en disques. Renvoie null si la charge est inférieure à
 * la barre (ou si aucun disque n'est configuré) — dans ce cas il n'y a rien
 * d'utile à afficher.
 */
export const solvePlates = (
  targetKg: number,
  barKg: number,
  plates: number[]
): PlateSolution | null => {
  if (!isFinite(targetKg) || targetKg <= 0 || plates.length === 0) return null;
  if (targetKg < barKg) return null;

  const perSideCents = toCents((targetKg - barKg) / 2);
  if (perSideCents === 0) return { perSide: [], achieved: barKg, exact: true };

  // Marge d'exploration : un cran au-dessus de la cible pour pouvoir aussi
  // proposer la charge faisable juste au-dessus.
  const heaviest = Math.max(...plates);
  const reached = reachablePerSide(plates, perSideCents + toCents(heaviest));

  const exact = reached.get(perSideCents);
  if (exact) {
    return { perSide: exact, achieved: targetKg, exact: true };
  }

  // Pas exact : on renvoie la combinaison faisable la plus proche en dessous.
  let bestBelow = -1;
  for (const sum of reached.keys()) {
    if (sum <= perSideCents && sum > bestBelow) bestBelow = sum;
  }
  if (bestBelow < 0) return null;
  return {
    perSide: reached.get(bestBelow)!,
    achieved: barKg + fromCents(bestBelow) * 2,
    exact: false,
  };
};

/**
 * Les deux charges réellement faisables qui encadrent une charge impossible.
 * Sert à dire « 42,5 impossible ici → 40 ou 45 ».
 */
export const nearestAchievable = (
  targetKg: number,
  barKg: number,
  plates: number[]
): { below: number | null; above: number | null } => {
  if (plates.length === 0 || targetKg < barKg) return { below: null, above: null };
  const perSideCents = toCents((targetKg - barKg) / 2);
  const heaviest = Math.max(...plates);
  const reached = reachablePerSide(plates, perSideCents + toCents(heaviest));

  let below: number | null = null;
  let above: number | null = null;
  for (const sum of reached.keys()) {
    const total = barKg + fromCents(sum) * 2;
    if (sum < perSideCents && (below === null || total > below)) below = total;
    if (sum > perSideCents && (above === null || total < above)) above = total;
  }
  return { below, above };
};

/**
 * Arrondit une charge à ce qui est réellement faisable sur la barre, en
 * préférant la valeur du dessous (on ne « monte » jamais une charge sans le
 * vouloir — utilisé notamment par le mode « pas en forme » qui baisse de 10 %).
 */
export const roundToAchievable = (targetKg: number, barKg: number, plates: number[]): number => {
  const solved = solvePlates(targetKg, barKg, plates);
  if (solved) return solved.achieved;
  return Math.max(barKg, targetKg);
};

/** Arrondit à un incrément simple (haltères, machines à goupille). */
export const roundToIncrement = (kg: number, incrementKg: number): number => {
  if (!incrementKg || incrementKg <= 0) return kg;
  return Math.round(kg / incrementKg) * incrementKg;
};

const fmt = (n: number): string =>
  (Math.round(n * 100) / 100).toString().replace('.', ',');

/** « 20 + 10 + 2×2,5 » — lecture directe au moment de charger la barre. */
export const describePlates = (solution: PlateSolution): string => {
  if (solution.perSide.length === 0) return 'barre à vide';
  return solution.perSide
    .map((p) => (p.count > 1 ? `${p.count}×${fmt(p.plate)}` : fmt(p.plate)))
    .join(' + ');
};

export const formatKg = fmt;
