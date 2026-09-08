import type { Equipment } from '../data/exercisesCatalog';
import type { SoreZone } from './gymAdapt';
import { ZONE_LABELS, catalogIdsToAvoid } from './gymAdapt';
import {
  DEFAULT_PREFS, generateProgram, weeklySetsByGroup,
  type GeneratorPrefs, type Goal, type Level, type SplitKind,
} from './workoutGenerator';
import type { Program } from '../data/programs';

/**
 * Quiz de démarrage : ce que l'appli demande au tout premier lancement, et
 * comment ces réponses deviennent un vrai programme.
 *
 * Deux règles pour tout ce fichier :
 *  - rien n'est inventé : les réponses ne font que régler le générateur déjà
 *    existant (workoutGenerator.ts), qui pioche dans le catalogue réel ;
 *  - chaque déduction est justifiable à voix haute — `whyLines()` affiche
 *    exactement le raisonnement à l'écran, donc pas de règle magique ici.
 */

// ─── Réponses ────────────────────────────────────────────────────────────────

export type QuizGoal = 'muscle' | 'seche' | 'force' | 'endurance' | 'forme';
export type QuizExperience = 'jamais' | 'debut' | 'regulier' | 'confirme';
export type QuizActivity = 'sedentaire' | 'leger' | 'actif' | 'tres-actif';
export type QuizBreath = 'faible' | 'moyen' | 'bon' | 'excellent';
export type QuizPlace = 'salle' | 'maison-equipee' | 'maison-mini' | 'exterieur';
export type QuizSex = 'homme' | 'femme' | 'nsp';

/** Ce que le quiz retient de l'utilisateur, conservé dans le store. */
export interface TrainingProfile {
  /** Version du questionnaire, pour pouvoir migrer plus tard sans casser. */
  version: 1;
  completedAt: number;
  firstName: string;
  sex: QuizSex;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: QuizGoal;
  experience: QuizExperience;
  activity: QuizActivity;
  breath: QuizBreath;
  daysPerWeek: number;
  sessionMinutes: number;
  place: QuizPlace;
  equipment: Equipment[];
  priorityGroups: string[];
  soreZones: SoreZone[];
  /** Découpage imposé par l'utilisateur, 'auto' = on déduit du reste. */
  split: SplitKind;
  /** Vrai si l'utilisateur veut du cardio en plus de la muscu. */
  wantsCardio: boolean;
}

export const DEFAULT_PROFILE: TrainingProfile = {
  version: 1,
  completedAt: 0,
  firstName: '',
  sex: 'nsp',
  age: null,
  heightCm: null,
  weightKg: null,
  goal: 'muscle',
  experience: 'debut',
  activity: 'leger',
  breath: 'moyen',
  daysPerWeek: 4,
  sessionMinutes: 60,
  place: 'salle',
  equipment: [],
  priorityGroups: [],
  soreZones: [],
  split: 'auto',
  wantsCardio: false,
};

// ─── Libellés (partagés par le quiz et le récapitulatif) ─────────────────────

export const GOAL_LABELS: Record<QuizGoal, string> = {
  muscle: 'Prendre du muscle',
  seche: 'Perdre du gras / sécher',
  force: 'Devenir plus fort',
  endurance: 'Endurance musculaire',
  forme: 'Me remettre en forme',
};

export const EXPERIENCE_LABELS: Record<QuizExperience, string> = {
  jamais: 'Jamais fait de muscu',
  debut: 'Moins de 6 mois',
  regulier: 'Entre 6 mois et 2 ans',
  confirme: 'Plus de 2 ans',
};

export const ACTIVITY_LABELS: Record<QuizActivity, string> = {
  sedentaire: 'Sédentaire',
  leger: 'Un peu actif',
  actif: 'Actif',
  'tres-actif': 'Très actif',
};

export const BREATH_LABELS: Record<QuizBreath, string> = {
  faible: 'Vite essoufflé',
  moyen: 'Correct',
  bon: 'Bon souffle',
  excellent: 'Excellent souffle',
};

export const PLACE_LABELS: Record<QuizPlace, string> = {
  salle: 'En salle de sport',
  'maison-equipee': 'À la maison, bien équipé',
  'maison-mini': 'À la maison, peu de matériel',
  exterieur: 'Dehors / en voyage',
};

/**
 * Matériel supposé présent selon le lieu. C'est un point de départ : l'écran
 * suivant du quiz laisse tout cocher/décocher à la main.
 * Liste vide (salle) = aucune restriction, tout le catalogue est utilisable.
 */
export const PLACE_EQUIPMENT: Record<QuizPlace, Equipment[]> = {
  salle: [],
  'maison-equipee': ['Barre', 'Barre EZ', 'Haltères', 'Élastique', 'Poids du corps'],
  'maison-mini': ['Haltères', 'Élastique', 'Poids du corps'],
  exterieur: ['Poids du corps', 'Élastique'],
};

// ─── Déductions ──────────────────────────────────────────────────────────────

/**
 * Niveau du générateur (= complexité des exercices proposés).
 *
 * C'est l'expérience en musculation qui décide, pas la forme physique : on
 * peut être coureur de fond et n'avoir jamais tenu une barre. Seule exception,
 * quelqu'un de sédentaire qui se dit confirmé redescend d'un cran — après une
 * longue coupure, on ne reprend pas au niveau où on s'était arrêté.
 */
export const deriveLevel = (p: TrainingProfile): Level => {
  const base: Level =
    p.experience === 'jamais' || p.experience === 'debut' ? 'Débutant'
    : p.experience === 'regulier' ? 'Intermédiaire'
    : 'Avancé';
  if (p.activity === 'sedentaire' && base === 'Avancé') return 'Intermédiaire';
  return base;
};

/**
 * Objectif du générateur (= schéma séries/reps/repos).
 * "Sèche" tape dans le même schéma qu'une prise de muscle : ce qui fait perdre
 * du gras c'est l'alimentation et le cardio, pas des séries de 20 — la muscu
 * sert à garder le muscle. On le dit tel quel dans `whyLines()`.
 */
export const deriveGoal = (p: TrainingProfile): Goal => {
  if (p.goal === 'force') return 'force';
  if (p.goal === 'endurance') return 'endurance';
  if (p.goal === 'forme') {
    // Remise en forme sans passé de muscu : séries longues et charges légères,
    // le temps que les tendons suivent.
    return p.experience === 'jamais' || p.experience === 'debut' ? 'endurance' : 'hypertrophie';
  }
  return 'hypertrophie';
};

/**
 * Découpage. 'auto' laisse le générateur décider selon le nombre de séances
 * (≤3 full body, 4 upper/lower, 5+ PPL), sauf pour un objectif force : là on
 * force le full body / upper-lower, parce qu'un PPL éclate les gros
 * mouvements sur trop de jours pour progresser en force.
 */
export const deriveSplit = (p: TrainingProfile): SplitKind => {
  if (p.split !== 'auto') return p.split;
  if (p.goal === 'force') return p.daysPerWeek <= 2 ? 'fullbody' : 'upper-lower';
  return 'auto';
};

/** Temps de repos par défaut de l'appli, cohérent avec l'objectif choisi. */
export const deriveDefaultRest = (p: TrainingProfile): number => {
  const goal = deriveGoal(p);
  return goal === 'force' ? 180 : goal === 'endurance' ? 90 : 150;
};

/** Réponses du quiz → réglages du générateur de programme. */
export const profileToPrefs = (p: TrainingProfile, seed: number): GeneratorPrefs => ({
  ...DEFAULT_PREFS,
  daysPerWeek: p.daysPerWeek,
  split: deriveSplit(p),
  equipment: p.equipment,
  sessionMinutes: p.sessionMinutes,
  level: deriveLevel(p),
  goal: deriveGoal(p),
  priorityGroups: p.priorityGroups,
  excludedIds: catalogIdsToAvoid(p.soreZones),
  seed,
});

/** Nom par défaut du programme créé — le prénom si on l'a, sinon générique. */
export const programName = (p: TrainingProfile): string =>
  p.firstName.trim() !== '' ? `Programme de ${p.firstName.trim()}` : 'Mon programme';

export interface QuizProgramResult {
  program: Program;
  warnings: string[];
  /** Volume hebdo par groupe musculaire, pour l'aperçu. */
  volume: { group: string; sets: number }[];
}

export const buildProgramFromProfile = (p: TrainingProfile, seed: number): QuizProgramResult => {
  const { program, warnings } = generateProgram(profileToPrefs(p, seed), programName(p));
  return { program, warnings, volume: weeklySetsByGroup(program) };
};

// ─── Explication du programme ────────────────────────────────────────────────

export interface WhyLine {
  /** Ce qui a été décidé. */
  title: string;
  /** Pourquoi, en une phrase, à partir des réponses données. */
  detail: string;
}

const SPLIT_LABELS: Record<Exclude<SplitKind, 'auto'>, string> = {
  fullbody: 'Full body',
  'upper-lower': 'Upper / Lower',
  ppl: 'Push / Pull / Legs',
};

/** Découpage réellement retenu, une fois 'auto' résolu comme le générateur. */
export const resolvedSplitLabel = (p: TrainingProfile): string => {
  const wanted = deriveSplit(p);
  if (wanted !== 'auto') return SPLIT_LABELS[wanted];
  if (p.daysPerWeek <= 3) return SPLIT_LABELS.fullbody;
  if (p.daysPerWeek === 4) return SPLIT_LABELS['upper-lower'];
  return SPLIT_LABELS.ppl;
};

/**
 * Le raisonnement, affiché tel quel à la fin du quiz. Volontairement honnête :
 * quand une réponse ne change rien au programme (le souffle par exemple), on
 * le dit au lieu de faire semblant d'en tenir compte.
 */
export const whyLines = (p: TrainingProfile): WhyLine[] => {
  const lines: WhyLine[] = [];
  const goal = deriveGoal(p);
  const level = deriveLevel(p);

  lines.push({
    title: `${resolvedSplitLabel(p)}, ${p.daysPerWeek} séances par semaine`,
    detail: p.split === 'auto'
      ? `Découpage choisi pour ${p.daysPerWeek} séances : c'est ce qui répartit le mieux le volume sur la semaine.`
      : 'Découpage que tu as choisi toi-même à la question sur l\'organisation.',
  });

  lines.push({
    title: goal === 'force' ? 'Séries lourdes, 5 reps, 3 min de repos'
      : goal === 'endurance' ? 'Séries longues, 15-20 reps, repos courts'
      : 'Séries de 6 à 15 reps, 1 min 30 à 2 min 30 de repos',
    detail: p.goal === 'seche'
      ? 'Objectif sèche : la muscu sert surtout à garder le muscle pendant la perte de gras, donc on garde un schéma de prise de muscle. C\'est l\'alimentation et le cardio qui font la sèche.'
      : p.goal === 'forme' && goal === 'endurance'
      ? 'Remise en forme sans passé de muscu : charges légères et séries longues le temps que les articulations et les tendons s\'habituent.'
      : `Schéma classique pour l'objectif « ${GOAL_LABELS[p.goal].toLowerCase()} ».`,
  });

  lines.push({
    title: `Exercices niveau ${level.toLowerCase()}`,
    detail: p.activity === 'sedentaire' && p.experience === 'confirme'
      ? 'Tu as de l\'expérience mais tu reviens de loin : on redescend d\'un cran pour la reprise, tu pourras régénérer un programme plus dur plus tard.'
      : `Basé sur ton expérience en muscu (${EXPERIENCE_LABELS[p.experience].toLowerCase()}).`,
  });

  lines.push({
    title: `Séances calées sur ${p.sessionMinutes} min`,
    detail: 'Le nombre d\'exercices et de séries est calculé pour tenir dans ce temps, échauffement compris (6 min).',
  });

  lines.push({
    title: p.equipment.length === 0
      ? 'Tout le matériel du catalogue'
      : `Matériel : ${p.equipment.join(', ')}`,
    detail: p.equipment.length === 0
      ? 'Aucune restriction : le générateur peut piocher dans les 225 exercices.'
      : 'Seuls des exercices faisables avec ce matériel sont proposés (le poids du corps reste toujours autorisé).',
  });

  if (p.priorityGroups.length > 0) {
    lines.push({
      title: `Priorité : ${p.priorityGroups.join(', ')}`,
      detail: 'Ces groupes passent en premier quand il reste du temps pour un exercice d\'isolation en plus.',
    });
  }

  if (p.soreZones.length > 0) {
    lines.push({
      title: `Zones ménagées : ${p.soreZones.map((z) => ZONE_LABELS[z].toLowerCase()).join(', ')}`,
      detail: 'Les mouvements connus pour taper sur ces articulations sont retirés du tirage. Si un groupe se retrouve vide, c\'est signalé plus bas.',
    });
  }

  lines.push({
    title: `Objectif hebdo réglé sur ${p.daysPerWeek} séances`,
    detail: 'Utilisé par l\'accueil et les badges de régularité. Modifiable dans Réglages.',
  });

  if (p.breath === 'faible' || p.wantsCardio) {
    lines.push({
      title: 'Cardio à noter dans l\'onglet Cardio',
      detail: p.breath === 'faible'
        ? 'Tu t\'essouffles vite : 2 sorties vélo ou marche par semaine feront plus pour ton souffle que n\'importe quel réglage de séries. L\'appli les compte à part.'
        : 'Tu veux du cardio en plus : l\'onglet Cardio enregistre vélo, marche et course, sans toucher au programme de muscu.',
    });
  }

  return lines;
};

/**
 * Ce que le quiz va modifier dans l'appli, listé avant validation — pas de
 * réglage changé en douce derrière le dos de l'utilisateur.
 */
const formatRest = (seconds: number): string => {
  const min = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${min} min` : `${min} min ${rest}`;
};

export const sideEffectLines = (p: TrainingProfile, activate: boolean): string[] => {
  const lines = [
    `Le programme « ${programName(p)} » est ajouté à tes programmes.`,
  ];
  if (activate) lines.push('Il devient ton programme actif (les autres restent disponibles).');
  else lines.push('Ton programme actif ne change pas — tu pourras l\'activer plus tard dans Réglages.');
  lines.push(`Objectif hebdomadaire : ${p.daysPerWeek} séances.`);
  lines.push(`Temps de repos par défaut : ${formatRest(deriveDefaultRest(p))}.`);
  if (p.weightKg) lines.push(`Ton poids (${p.weightKg} kg) est enregistré comme première mesure.`);
  return lines;
};
