import { Exercise } from '../data/types';

// ─── Rotation des supersets et tri-sets ─────────────────────────────────────
//
// Un superset (⟳ SS) ou un tri-set (⟳ TS) se fait en TOURS : une série de A,
// une série de B, une série de C, PUIS le repos, puis on recommence. Avant le
// 19/08/2026 l'appli enchaînait toutes les séries de A sans aucun repos avant
// de passer à B, ce qui n'est pas la même chose du tout (et devient franchement
// mauvais sur un tri-set jambes : 3 squats bulgares d'affilée sans repos).
//
// Tout le calcul « où va-t-on après cette série ? » est centralisé ici, pour
// que l'écran de séance (repos ou pas) et le store (position suivante) ne
// puissent pas diverger.

/** Membres d'un groupe SS/TS, dans l'ordre de la séance. */
export const supersetMemberIndexes = (exercises: Exercise[], groupId: string): number[] =>
  exercises.reduce<number[]>((acc, e, i) => (e.supersetGroupId === groupId ? [...acc, i] : acc), []);

/** Vrai si cet exercice est réellement enchaîné (le groupe peut être désactivé à la volée). */
export const isChained = (ex: Exercise | undefined, disabledGroupIds: string[] = []): boolean =>
  !!ex && ex.restMode === 'superset' && !!ex.supersetGroupId && !disabledGroupIds.includes(ex.supersetGroupId);

export interface NextStep {
  /** Index de l'exercice suivant, ou null si la séance est terminée. */
  exerciseIndex: number | null;
  setIndex: number;
  /** false = on enchaîne sans repos (on est au milieu d'un tour de SS/TS). */
  rest: boolean;
}

/**
 * Où aller après avoir validé la série `setIndex` de l'exercice `exerciseIndex`.
 *
 * `setsOf` renvoie le nombre de séries RÉEL de l'exercice pendant la séance
 * (l'utilisateur peut en ajouter une), pas seulement celui du programme.
 */
export const getNextStep = (
  exercises: Exercise[],
  exerciseIndex: number,
  setIndex: number,
  setsOf: (ex: Exercise) => number,
  disabledGroupIds: string[] = [],
  /** Série déjà validée ? Si fourni, on saute les exercices déjà faits (faits dans le
   *  désordre via « Faire ») et on revient sur ceux laissés derrière avant de conclure
   *  que la séance est terminée. La série `setIndex` en cours compte comme faite. */
  isSetDone?: (ex: Exercise, setIndex: number) => boolean,
): NextStep => {
  const ex = exercises[exerciseIndex];
  if (!ex) return { exerciseIndex: null, setIndex: 0, rest: false };

  const after = (idx: number): NextStep => {
    if (!isSetDone) {
      return { exerciseIndex: idx < exercises.length ? idx : null, setIndex: 0, rest: true };
    }
    const n = exercises.length;
    for (let k = 0; k < n; k++) {
      const j = (idx + k) % n;
      const cand = exercises[j];
      for (let s = 0; s < setsOf(cand); s++) {
        if (!((cand === ex && s === setIndex) || isSetDone(cand, s))) {
          return { exerciseIndex: j, setIndex: s, rest: true };
        }
      }
    }
    return { exerciseIndex: null, setIndex: 0, rest: true };
  };

  if (isChained(ex, disabledGroupIds)) {
    const members = supersetMemberIndexes(exercises, ex.supersetGroupId as string);
    const pos = members.indexOf(exerciseIndex);

    // 1) Même tour : l'exercice suivant du groupe qui a encore une série à cet index.
    for (let k = pos + 1; k < members.length; k++) {
      if (setsOf(exercises[members[k]]) > setIndex) {
        return { exerciseIndex: members[k], setIndex, rest: false };
      }
    }
    // 2) Tour suivant : on prend le repos, puis on repart du premier membre concerné.
    for (let k = 0; k < members.length; k++) {
      if (setsOf(exercises[members[k]]) > setIndex + 1) {
        return { exerciseIndex: members[k], setIndex: setIndex + 1, rest: true };
      }
    }
    // 3) Groupe terminé → exercice qui suit le dernier membre du groupe.
    return after(members[members.length - 1] + 1);
  }

  // Exercice normal : série suivante, sinon exercice suivant.
  if (setIndex + 1 < setsOf(ex)) return { exerciseIndex, setIndex: setIndex + 1, rest: true };
  return after(exerciseIndex + 1);
};

/** Fabrique le `isSetDone` de getNextStep à partir de la progression d'une séance. */
export const setDoneIn = (progress: Record<string, { completed: boolean }[]> | undefined) =>
  (ex: Exercise, setIndex: number): boolean => !!progress?.[ex.id]?.[setIndex]?.completed;
