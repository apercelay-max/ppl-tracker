// ─── Coach vocal — ce qu'il dit, et quand ──────────────────────────────────
//
// ARCHITECTURE, ET POURQUOI ELLE EST COMME ÇA : ce hook n'est branché sur
// aucun bouton. Il OBSERVE le store et parle quand l'état change. Concrètement,
// il ne sait pas si la série a été validée par un appui, par une secousse
// (hooks/useShakeToValidate.ts) ou par un saut d'exercice — il voit juste que
// `currentSetIndex` a bougé, et il annonce la suite.
//
// L'alternative aurait été d'appeler `speak()` depuis SessionScreen à chaque
// endroit qui fait avancer la séance. Ça voulait dire une dizaine de points
// d'appel à tenir synchronisés, et une annonce oubliée à chaque fois qu'on
// ajoute un chemin (skipSet, addSet, switchToExercise, adaptation en cours de
// séance...). En observant l'état, tous ces chemins sont couverts par
// construction, et SessionScreen n'a pas une ligne à changer.
//
// CONSÉQUENCE À CONNAÎTRE : on parle APRÈS le changement d'état, donc on ne
// peut rien annoncer avant qu'il ait eu lieu. C'est sans importance ici — tout
// ce qu'on dit commente ce qui vient de se passer ou ce qui arrive ensuite.

import { useEffect, useRef } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { getWorkout } from '../data/workouts';
import { getLastExerciseSets } from '../utils/training';
import {
  installVoicePrimer, isVoiceSupported, sayDuration, sayExerciseName,
  sayReps, sayWeight, speak, stopVoice,
} from '../utils/voiceCoach';

/** Jalons du repos, en secondes restantes. Au-delà de 45 s de repos seulement :
 *  sur un repos court, annoncer « 30 secondes » juste après « repos 40
 *  secondes » revient à parler pour ne rien dire. */
const REST_MARKS = [30, 10];

export const useVoiceCoach = (): void => {
  const enabled = useWorkoutStore((s) => s.voiceCoachEnabled);
  const rate = useWorkoutStore((s) => s.voiceRate);
  const verbosity = useWorkoutStore((s) => s.voiceVerbosity);
  const session = useWorkoutStore((s) => s.session);
  const timer = useWorkoutStore((s) => s.timer);
  const unit = useWorkoutStore((s) => s.weightUnit);
  const history = useWorkoutStore((s) => s.history);

  const full = verbosity === 'complet';
  const say = (text: string, urgent = false) => speak(text, { rate, urgent });

  // Ce qu'on a déjà annoncé, pour ne pas répéter à chaque re-render. React
  // re-rend pour des tas de raisons (un champ de saisie, une bascule d'accent) ;
  // sans ces repères, la moindre frappe relancerait la phrase.
  const lastDayId = useRef<string | null>(null);
  const lastExIdx = useRef<number | null>(null);
  const lastSetIdx = useRef<number | null>(null);
  const lastRestEnd = useRef<number | null>(null);
  const marksSaid = useRef<Set<number>>(new Set());

  useEffect(() => { installVoicePrimer(); }, []);

  // Extinction : on coupe la phrase en cours plutôt que de la laisser finir.
  // Quelqu'un qui éteint le coach au milieu d'une séance veut le silence tout
  // de suite, pas dans quatre secondes.
  useEffect(() => {
    if (!enabled) {
      stopVoice();
      lastDayId.current = null;
      lastExIdx.current = null;
      lastSetIdx.current = null;
      lastRestEnd.current = null;
      marksSaid.current.clear();
    }
  }, [enabled]);

  // ── Séance : début, exercice, série, fin ────────────────────────────────
  useEffect(() => {
    if (!enabled || !isVoiceSupported()) return;

    // Fin de séance (ou abandon) : on remet les compteurs à zéro pour que la
    // prochaine séance soit annoncée depuis le début.
    if (!session) {
      if (lastDayId.current !== null) {
        lastDayId.current = null;
        lastExIdx.current = null;
        lastSetIdx.current = null;
      }
      return;
    }

    const workout = getWorkout(session.dayId);
    if (!workout) return;
    const exercises = workout.exercises ?? [];

    // ── Début de séance ──
    if (lastDayId.current !== session.dayId) {
      lastDayId.current = session.dayId;
      lastExIdx.current = null;
      lastSetIdx.current = null;
      if (full) {
        say(`${sayExerciseName(workout.name)}. ${exercises.length} exercices. C'est parti.`, true);
      } else {
        say(`${sayExerciseName(workout.name)}. C'est parti.`, true);
      }
    }

    const exIdx = session.currentExerciseIndex;
    const setIdx = session.currentSetIndex;
    const ex = exercises[exIdx];
    if (!ex) return;

    const exChanged = lastExIdx.current !== exIdx;
    const setChanged = lastSetIdx.current !== setIdx;
    if (!exChanged && !setChanged) return;

    lastExIdx.current = exIdx;
    lastSetIdx.current = setIdx;

    const parts: string[] = [];
    const done = session.exerciseProgress[ex.id] ?? [];
    const total = done.length || ex.sets;

    // ── Nouvel exercice ──
    // Le nombre de séries est annoncé dans les DEUX modes, pas seulement en
    // « complet » : savoir combien il en reste est exactement ce qu'on ne peut
    // pas deviner sans regarder l'écran. C'est le cœur de la fonctionnalité,
    // pas du confort.
    if (exChanged) {
      parts.push(sayExerciseName(ex.name));
      const reps = sayReps(ex.targetReps);
      parts.push(reps ? `${total} séries de ${reps}` : `${total} séries`);
    }

    // ── Série à venir ──
    parts.push(
      exChanged && setIdx === 0 ? 'Première série' : `Série ${setIdx + 1} sur ${total}`,
    );

    // ── Charge ──
    // Par ordre de fiabilité décroissante. La série 1 est le cas qui compte :
    // c'est le moment où on charge la barre, donc le moment où on a le plus
    // besoin du chiffre — et c'est précisément là qu'il n'y a rien à reprendre
    // dans la séance en cours. On va donc le chercher dans l'historique.
    //
    // On ne dit JAMAIS un poids inventé : si aucune des quatre sources n'a de
    // valeur, on se tait. Annoncer une charge fausse à quelqu'un qui ne
    // regarde pas son écran est la seule faute vraiment grave ici.
    const spokenUnit = unit === 'kg' ? 'kilos' : 'livres';
    const lastTime = getLastExerciseSets(history, ex.id);

    let weight = '';
    let source = '';
    if (done[setIdx]?.weight) {
      weight = sayWeight(done[setIdx].weight, spokenUnit);
    } else if (setIdx > 0 && done[setIdx - 1]?.weight) {
      weight = sayWeight(done[setIdx - 1].weight, spokenUnit);
    } else if (lastTime?.[setIdx]?.weight || lastTime?.[0]?.weight) {
      weight = sayWeight(lastTime[setIdx]?.weight ?? lastTime[0].weight, spokenUnit);
      source = 'comme la dernière fois';
    } else if (ex.defaultWeight) {
      weight = sayWeight(ex.defaultWeight, spokenUnit);
      source = 'au programme';
    }

    if (weight) parts.push(full && source ? `${weight}, ${source}` : weight);

    say(`${parts.join('. ')}.`, exChanged);
  }, [enabled, full, rate, unit, history, session]);

  // ── Repos : annonce, jalons, reprise ────────────────────────────────────
  useEffect(() => {
    if (!enabled || !isVoiceSupported()) return;

    const end = timer.endTimestamp;

    // Repos terminé ou sauté : on ne dit RIEN.
    //
    // Une première version annonçait « Reprise. » ici. Deux problèmes, vus en
    // test : la phrase arrivait APRÈS « Série 2 sur 3 » (les deux effets
    // partent du même changement d'état, et celui de la séance est déclaré en
    // premier), et surtout elle était inutile — l'annonce de la série suivante
    // dit déjà que le repos est fini. À la salle, une phrase de moins vaut
    // mieux qu'une phrase juste.
    if (!timer.isRunning || !end) {
      if (lastRestEnd.current !== null) {
        lastRestEnd.current = null;
        marksSaid.current.clear();
      }
      return;
    }

    // ── Nouveau repos ──
    if (lastRestEnd.current !== end) {
      lastRestEnd.current = end;
      marksSaid.current.clear();
      const left = Math.round((end - Date.now()) / 1000);
      if (left > 0) say(`Repos. ${sayDuration(left)}.`);
    }

    if (timer.isPaused) return;

    // ── Jalons ──
    // Un intervalle propre à ce hook plutôt qu'un branchement sur
    // useRestTimer : ce dernier est monté par l'écran de séance, et le coach
    // vocal doit continuer de parler même si on est parti sur un autre onglet.
    const id = setInterval(() => {
      const left = Math.round((end - Date.now()) / 1000);
      const total = timer.totalSeconds;

      for (const mark of REST_MARKS) {
        if (total > 45 && left === mark && !marksSaid.current.has(mark)) {
          marksSaid.current.add(mark);
          say(`${mark} secondes.`, true);
        }
      }
    }, 500);

    return () => clearInterval(id);
  }, [enabled, full, rate, timer.isRunning, timer.endTimestamp, timer.isPaused, timer.totalSeconds]);
};
