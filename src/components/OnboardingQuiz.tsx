import React, { useMemo, useState } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { CATALOG_EQUIPMENT, CATALOG_GROUPS, type Equipment } from '../data/exercisesCatalog';
import { ZONE_LABELS, type SoreZone } from '../utils/gymAdapt';
import {
  DEFAULT_PROFILE, PLACE_EQUIPMENT, buildProgramFromProfile, deriveDefaultRest,
  programName, resolvedSplitLabel, sideEffectLines, whyLines,
  ACTIVITY_LABELS, BREATH_LABELS, EXPERIENCE_LABELS, GOAL_LABELS, PLACE_LABELS,
  type QuizActivity, type QuizBreath, type QuizExperience, type QuizGoal,
  type QuizPlace, type QuizSex, type TrainingProfile,
} from '../utils/onboardingQuiz';
import type { SplitKind } from '../utils/workoutGenerator';
import {
  IconActivity, IconAlert, IconArrowLeft, IconBattery, IconBiceps, IconCalendar,
  IconCheck, IconClock, IconClose, IconDumbbell, IconFlame, IconHandWave, IconHeart,
  IconHome, IconPalette, IconScale, IconSparkles, IconTarget, IconTrendingUp,
  IconTrophy, IconUser, IconWalk, IconWind, IconZap,
} from './Icons';

/**
 * Quiz de démarrage — l'écran du tout premier lancement (voir App.tsx).
 *
 * Il remplace l'ancien mini-choix "personnalisation ou simplicité" (qui est
 * devenu l'avant-dernière question) : au lieu de lâcher l'utilisateur sur le
 * programme par défaut de Léo, on lui pose les questions d'un vrai entretien
 * de coach — objectif, expérience, condition physique, temps disponible,
 * matériel, blessures — puis on construit un programme réel avec le
 * générateur existant (utils/workoutGenerator.ts), en montrant l'aperçu
 * complet AVANT d'enregistrer quoi que ce soit.
 *
 * Deux principes tenus dans tout l'écran :
 *  - rien n'est enregistré tant que le dernier bouton n'a pas été appuyé —
 *    on peut revenir en arrière sur n'importe quelle question ;
 *  - tout ce que le quiz va changer dans l'appli est listé en clair sur le
 *    dernier écran, y compris le fait qu'aucun programme existant n'est
 *    supprimé.
 *
 * Le quiz est aussi rejouable à tout moment (Réglages → Séance → « Refaire le
 * quiz »), auquel cas il repart des réponses précédentes.
 */

interface OnboardingQuizProps {
  /** Réponses déjà données, pour pré-remplir quand on refait le quiz. */
  initialProfile?: TrainingProfile | null;
  /** Vrai quand le quiz est relancé depuis les Réglages : on peut en sortir. */
  canDismiss?: boolean;
  onClose: () => void;
}

// ─── Brouillon (les questions "identité" démarrent sans réponse) ─────────────

interface Draft {
  firstName: string;
  sex: QuizSex;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: QuizGoal | null;
  experience: QuizExperience | null;
  activity: QuizActivity | null;
  breath: QuizBreath | null;
  place: QuizPlace | null;
  equipment: Equipment[];
  priorityGroups: string[];
  soreZones: SoreZone[];
  daysPerWeek: number;
  sessionMinutes: number;
  split: SplitKind;
  wantsCardio: boolean;
  simplicity: 'perso' | 'simple' | null;
}

const emptyDraft = (p?: TrainingProfile | null): Draft => ({
  firstName: p?.firstName ?? '',
  sex: p?.sex ?? 'nsp',
  age: p?.age ?? null,
  heightCm: p?.heightCm ?? null,
  weightKg: p?.weightKg ?? null,
  // Une reprise du quiz repart des réponses précédentes ; un premier
  // lancement démarre vraiment vide pour ne rien suggérer à la place de
  // l'utilisateur.
  goal: p?.goal ?? null,
  experience: p?.experience ?? null,
  activity: p?.activity ?? null,
  breath: p?.breath ?? null,
  place: p?.place ?? null,
  equipment: p?.equipment ?? [],
  priorityGroups: p?.priorityGroups ?? [],
  soreZones: p?.soreZones ?? [],
  daysPerWeek: p?.daysPerWeek ?? DEFAULT_PROFILE.daysPerWeek,
  sessionMinutes: p?.sessionMinutes ?? DEFAULT_PROFILE.sessionMinutes,
  split: p?.split ?? 'auto',
  wantsCardio: p?.wantsCardio ?? false,
  simplicity: null,
});

const toProfile = (d: Draft): TrainingProfile => ({
  version: 1,
  completedAt: Date.now(),
  firstName: d.firstName.trim(),
  sex: d.sex,
  age: d.age,
  heightCm: d.heightCm,
  weightKg: d.weightKg,
  goal: d.goal ?? DEFAULT_PROFILE.goal,
  experience: d.experience ?? DEFAULT_PROFILE.experience,
  activity: d.activity ?? DEFAULT_PROFILE.activity,
  breath: d.breath ?? DEFAULT_PROFILE.breath,
  daysPerWeek: d.daysPerWeek,
  sessionMinutes: d.sessionMinutes,
  place: d.place ?? DEFAULT_PROFILE.place,
  equipment: d.equipment,
  priorityGroups: d.priorityGroups,
  soreZones: d.soreZones,
  split: d.split,
  wantsCardio: d.wantsCardio,
});

// ─── Étapes ──────────────────────────────────────────────────────────────────

const STEPS = [
  'intro', 'objectif', 'experience', 'forme', 'souffle', 'frequence', 'duree',
  'organisation', 'lieu', 'materiel', 'priorites', 'sensible', 'toi', 'reglages', 'recap',
] as const;
type StepId = typeof STEPS[number];

const SORE_ZONES: SoreZone[] = ['epaule', 'coude-poignet', 'lombaires', 'genou'];

export const OnboardingQuiz: React.FC<OnboardingQuizProps> = ({ initialProfile, canDismiss, onClose }) => {
  const addCustomProgram = useWorkoutStore((s) => s.addCustomProgram);
  const setActiveProgram = useWorkoutStore((s) => s.setActiveProgram);
  const setWeeklySessionGoal = useWorkoutStore((s) => s.setWeeklySessionGoal);
  const setDefaultRestSeconds = useWorkoutStore((s) => s.setDefaultRestSeconds);
  const addBodyWeightEntry = useWorkoutStore((s) => s.addBodyWeightEntry);
  const saveTrainingProfile = useWorkoutStore((s) => s.saveTrainingProfile);
  const completeOnboarding = useWorkoutStore((s) => s.completeOnboarding);
  const bodyWeightHistory = useWorkoutStore((s) => s.bodyWeightHistory);

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(initialProfile));
  // La graine change à chaque « Proposer d'autres exercices » : mêmes réponses,
  // autre tirage dans le catalogue.
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000) + 1);
  const [activate, setActivate] = useState(true);

  const step: StepId = STEPS[stepIndex];
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const profile = useMemo(() => toProfile(draft), [draft]);
  // Le programme n'est calculé qu'une fois arrivé au récapitulatif : inutile de
  // faire tourner le générateur à chaque clic des 14 écrans précédents.
  const result = useMemo(
    () => (step === 'recap' ? buildProgramFromProfile(profile, seed) : null),
    [step, profile, seed]
  );

  const canContinue = (): boolean => {
    switch (step) {
      case 'objectif': return draft.goal !== null;
      case 'experience': return draft.experience !== null;
      case 'forme': return draft.activity !== null;
      case 'souffle': return draft.breath !== null;
      case 'lieu': return draft.place !== null;
      case 'reglages': return draft.simplicity !== null;
      default: return true;
    }
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  // Choisir un lieu remet le matériel sur le préréglage correspondant :
  // repartir du matériel d'une salle complète après avoir cliqué « dehors »
  // n'aurait aucun sens. L'écran suivant permet ensuite de tout ajuster.
  const choosePlace = (place: QuizPlace) =>
    setDraft((d) => ({ ...d, place, equipment: [...PLACE_EQUIPMENT[place]] }));

  const toggle = <T extends string>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  /** Sortie sans rien construire : l'appli garde le programme par défaut. */
  const skipQuiz = () => {
    completeOnboarding('perso');
    onClose();
  };

  const finish = () => {
    if (!result) return;
    addCustomProgram(result.program);
    if (activate) setActiveProgram(result.program.id);
    setWeeklySessionGoal(profile.daysPerWeek);
    setDefaultRestSeconds(deriveDefaultRest(profile));
    // Première pesée seulement s'il n'y a pas déjà un suivi en cours : on
    // n'écrase jamais des mesures réelles avec un chiffre saisi au vol.
    if (profile.weightKg && bodyWeightHistory.length === 0) addBodyWeightEntry(profile.weightKg);
    saveTrainingProfile(profile);
    completeOnboarding(draft.simplicity ?? 'perso');
    onClose();
  };

  const progress = (stepIndex / (STEPS.length - 1)) * 100;
  const hello = draft.firstName.trim() !== '' ? `, ${draft.firstName.trim()}` : '';

  return (
    <div style={overlay}>
      <div style={panel} className="fade-in">
        {/* ── En-tête : progression + sortie ───────────────────────────── */}
        <div style={header}>
          <div style={progressTrack}>
            <div style={{ ...progressFill, width: `${progress}%` }} />
          </div>
          <div style={headerRow}>
            <span style={stepCounter}>Étape {stepIndex + 1} / {STEPS.length}</span>
            {canDismiss && (
              <button onClick={onClose} style={dismissBtn} aria-label="Fermer le quiz">
                <IconClose size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Corps ─────────────────────────────────────────────────────── */}
        <div style={body} key={step} className="fade-in">
          {step === 'intro' && (
            <Step
              icon={<IconHandWave size={26} />}
              title="On construit ton programme"
              subtitle="Quelques questions (2 minutes) sur ton objectif, ton niveau et le temps que tu as. À la fin, l'appli te propose un vrai programme, séance par séance — tu vois tout avant de valider."
            >
              <p style={fieldLabel}>Ton prénom (facultatif)</p>
              <input
                type="text"
                value={draft.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                placeholder="ex : Léo"
                style={textInput}
              />
              <div style={introList}>
                <IntroLine icon={<IconTarget size={15} />} text="Ton objectif décide des séries, des reps et du repos." />
                <IntroLine icon={<IconClock size={15} />} text="Ton temps dispo décide du nombre d'exercices." />
                <IntroLine icon={<IconDumbbell size={15} />} text="Ton matériel décide des exercices proposés." />
                <IntroLine icon={<IconAlert size={15} />} text="Tes articulations sensibles retirent les mouvements à risque." />
              </div>
              <p style={honestNote}>
                Le programme est bâti à partir du catalogue de 225 exercices de l'appli. Ce n'est pas
                un programme de coach ni une méthode commerciale : c'est une trame classique, à ajuster
                selon ton ressenti.
              </p>
              {!canDismiss && (
                <button onClick={skipQuiz} style={skipBtn}>
                  Passer le quiz et garder le programme par défaut
                </button>
              )}
            </Step>
          )}

          {step === 'objectif' && (
            <Step
              icon={<IconTarget size={26} />}
              title={`Ton objectif principal${hello} ?`}
              subtitle="Un seul — c'est lui qui fixe le nombre de répétitions et le temps de repos."
            >
              <OptionCard
                icon={<IconBiceps size={20} />} label={GOAL_LABELS.muscle}
                desc="Prendre du volume : séries de 6 à 15 reps, repos moyens."
                active={draft.goal === 'muscle'} onClick={() => set('goal', 'muscle')}
              />
              <OptionCard
                icon={<IconFlame size={20} />} label={GOAL_LABELS.seche}
                desc="Garder le muscle pendant la perte de gras. Le cardio et l'alimentation font le reste."
                active={draft.goal === 'seche'} onClick={() => set('goal', 'seche')}
              />
              <OptionCard
                icon={<IconTrophy size={20} />} label={GOAL_LABELS.force}
                desc="Soulever lourd : 5 séries de 5, 3 minutes de repos."
                active={draft.goal === 'force'} onClick={() => set('goal', 'force')}
              />
              <OptionCard
                icon={<IconActivity size={20} />} label={GOAL_LABELS.endurance}
                desc="Tenir longtemps : séries de 15 à 20, repos courts."
                active={draft.goal === 'endurance'} onClick={() => set('goal', 'endurance')}
              />
              <OptionCard
                icon={<IconHeart size={20} />} label={GOAL_LABELS.forme}
                desc="Reprendre en douceur, sans se blesser."
                active={draft.goal === 'forme'} onClick={() => set('goal', 'forme')}
              />
            </Step>
          )}

          {step === 'experience' && (
            <Step
              icon={<IconTrendingUp size={26} />}
              title="Ton expérience en musculation ?"
              subtitle="Ça décide de la difficulté technique des exercices proposés — pas de la charge."
            >
              {(['jamais', 'debut', 'regulier', 'confirme'] as QuizExperience[]).map((v) => (
                <OptionCard
                  key={v}
                  icon={<IconDumbbell size={20} />}
                  label={EXPERIENCE_LABELS[v]}
                  desc={
                    v === 'jamais' ? 'On part sur des mouvements simples et guidés.'
                    : v === 'debut' ? 'Bases en place, exercices classiques.'
                    : v === 'regulier' ? 'Tu peux encaisser des mouvements plus techniques.'
                    : 'Tout le catalogue est ouvert, y compris les exercices avancés.'
                  }
                  active={draft.experience === v}
                  onClick={() => set('experience', v)}
                />
              ))}
            </Step>
          )}

          {step === 'forme' && (
            <Step
              icon={<IconBattery size={26} />}
              title="Ta condition physique aujourd'hui ?"
              subtitle="Hors musculation : ton activité de tous les jours (boulot, école, marche, sport)."
            >
              {(['sedentaire', 'leger', 'actif', 'tres-actif'] as QuizActivity[]).map((v) => (
                <OptionCard
                  key={v}
                  icon={v === 'sedentaire' ? <IconHome size={20} /> : v === 'tres-actif' ? <IconZap size={20} /> : <IconWalk size={20} />}
                  label={ACTIVITY_LABELS[v]}
                  desc={
                    v === 'sedentaire' ? 'Assis la majeure partie de la journée, peu de marche.'
                    : v === 'leger' ? 'Un peu de marche, une activité de temps en temps.'
                    : v === 'actif' ? 'Bouge tous les jours, ou du sport 1 à 2 fois par semaine.'
                    : 'Sport plusieurs fois par semaine ou métier physique.'
                  }
                  active={draft.activity === v}
                  onClick={() => set('activity', v)}
                />
              ))}
            </Step>
          )}

          {step === 'souffle' && (
            <Step
              icon={<IconWind size={26} />}
              title="Et ton souffle ?"
              subtitle="Monter deux étages d'escaliers d'un coup, ça donne quoi ?"
            >
              {(['faible', 'moyen', 'bon', 'excellent'] as QuizBreath[]).map((v) => (
                <OptionCard
                  key={v}
                  icon={<IconHeart size={20} />}
                  label={BREATH_LABELS[v]}
                  desc={
                    v === 'faible' ? 'Essoufflé en haut, il faut souffler un moment.'
                    : v === 'moyen' ? 'Un peu essoufflé, ça passe vite.'
                    : v === 'bon' ? 'Aucun souci, tu pourrais continuer.'
                    : 'Tu cours ou pédales déjà régulièrement.'
                  }
                  active={draft.breath === v}
                  onClick={() => set('breath', v)}
                />
              ))}
              <label style={switchRow}>
                <input
                  type="checkbox"
                  checked={draft.wantsCardio}
                  onChange={(e) => set('wantsCardio', e.target.checked)}
                  style={checkbox}
                />
                <span style={switchLabel}>Je veux aussi faire du cardio à côté (vélo, marche, course)</span>
              </label>
              <p style={honestNote}>
                Le cardio ne rentre pas dans le programme de muscu : il se note dans l'onglet Cardio,
                qui compte les calories et la durée à part.
              </p>
            </Step>
          )}

          {step === 'frequence' && (
            <Step
              icon={<IconCalendar size={26} />}
              title="Combien de séances par semaine ?"
              subtitle="Sois honnête : un programme à 3 séances vraiment faites bat un programme à 6 séances jamais faites."
            >
              <div style={bigChoiceRow}>
                {[2, 3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    onClick={() => set('daysPerWeek', d)}
                    style={{ ...bigChoice, ...(draft.daysPerWeek === d ? bigChoiceActive : {}) }}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p style={helperText}>
                {draft.daysPerWeek <= 3
                  ? 'Chaque séance travaillera tout le corps.'
                  : draft.daysPerWeek === 4
                  ? 'Deux séances haut du corps, deux séances bas du corps.'
                  : 'Découpage Push / Pull / Legs, chaque muscle revient environ 2 fois par semaine.'}
              </p>
              <p style={honestNote}>
                Cette valeur devient aussi ton objectif hebdomadaire sur l'accueil.
              </p>
            </Step>
          )}

          {step === 'duree' && (
            <Step
              icon={<IconClock size={26} />}
              title="Combien de temps par séance ?"
              subtitle="Échauffement compris. Le nombre d'exercices s'adapte à ce budget."
            >
              <div style={bigChoiceRow}>
                {[30, 45, 60, 75, 90].map((m) => (
                  <button
                    key={m}
                    onClick={() => set('sessionMinutes', m)}
                    style={{ ...bigChoice, ...(draft.sessionMinutes === m ? bigChoiceActive : {}), fontSize: 15 }}
                  >
                    {m}
                    <span style={{ display: 'block', fontSize: 9, fontWeight: 600, opacity: 0.7 }}>min</span>
                  </button>
                ))}
              </div>
              <p style={helperText}>
                {draft.sessionMinutes <= 30
                  ? 'Court : on garde les mouvements de base, peu ou pas d\'isolation.'
                  : draft.sessionMinutes >= 75
                  ? 'Large : de la place pour de l\'isolation sur chaque groupe.'
                  : 'Format classique : les bases plus une ou deux isolations.'}
              </p>
            </Step>
          )}

          {step === 'organisation' && (
            <Step
              icon={<IconSparkles size={26} />}
              title="Comment tu veux organiser tes séances ?"
              subtitle="Si tu ne sais pas, laisse « Au choix de l'appli » — c'est déduit de ta fréquence."
            >
              <OptionCard
                icon={<IconSparkles size={20} />} label="Au choix de l'appli"
                desc={`Avec ${draft.daysPerWeek} séances, ça donnerait : ${resolvedSplitLabel({ ...profile, split: 'auto' })}.`}
                active={draft.split === 'auto'} onClick={() => set('split', 'auto')}
              />
              <OptionCard
                icon={<IconUser size={20} />} label="Full body"
                desc="Tout le corps à chaque séance. Idéal à 2-3 séances par semaine."
                active={draft.split === 'fullbody'} onClick={() => set('split', 'fullbody')}
              />
              <OptionCard
                icon={<IconScale size={20} />} label="Upper / Lower"
                desc="Haut du corps / bas du corps en alternance. Idéal à 4 séances."
                active={draft.split === 'upper-lower'} onClick={() => set('split', 'upper-lower')}
              />
              <OptionCard
                icon={<IconDumbbell size={20} />} label="Push / Pull / Legs"
                desc="Poussée, tirage, jambes. Idéal à 5-6 séances."
                active={draft.split === 'ppl'} onClick={() => set('split', 'ppl')}
              />
            </Step>
          )}

          {step === 'lieu' && (
            <Step
              icon={<IconHome size={26} />}
              title="Tu t'entraînes où ?"
              subtitle="Ça pré-remplit le matériel disponible — tu ajustes juste après."
            >
              {(['salle', 'maison-equipee', 'maison-mini', 'exterieur'] as QuizPlace[]).map((v) => (
                <OptionCard
                  key={v}
                  icon={v === 'salle' ? <IconDumbbell size={20} /> : v === 'exterieur' ? <IconWalk size={20} /> : <IconHome size={20} />}
                  label={PLACE_LABELS[v]}
                  desc={
                    v === 'salle' ? 'Machines, poulies, barres, haltères : aucune restriction.'
                    : v === 'maison-equipee' ? 'Barre, haltères, élastiques.'
                    : v === 'maison-mini' ? 'Quelques haltères ou élastiques.'
                    : 'Poids du corps et élastiques uniquement.'
                  }
                  active={draft.place === v}
                  onClick={() => choosePlace(v)}
                />
              ))}
            </Step>
          )}

          {step === 'materiel' && (
            <Step
              icon={<IconDumbbell size={26} />}
              title="Ton matériel exactement"
              subtitle="Décoche ce que tu n'as pas, coche ce qui manque. Rien de coché = tout le catalogue."
            >
              <div style={chipWrap}>
                {CATALOG_EQUIPMENT.map((eq) => (
                  <Chip
                    key={eq}
                    label={eq}
                    active={draft.equipment.includes(eq)}
                    onClick={() => set('equipment', toggle(draft.equipment, eq))}
                  />
                ))}
              </div>
              <p style={helperText}>
                {draft.equipment.length === 0
                  ? 'Aucune restriction : les 225 exercices sont utilisables.'
                  : `${draft.equipment.length} type(s) de matériel coché(s).`}
              </p>
              <p style={honestNote}>
                Le poids du corps reste toujours autorisé, même décoché : avoir des haltères
                n'empêche pas de faire des pompes.
              </p>
            </Step>
          )}

          {step === 'priorites' && (
            <Step
              icon={<IconBiceps size={26} />}
              title="Des muscles à prioriser ?"
              subtitle="Facultatif. Ils passent en premier quand il reste du temps pour un exercice en plus."
            >
              <div style={chipWrap}>
                {CATALOG_GROUPS.map((g) => (
                  <Chip
                    key={g}
                    label={g}
                    active={draft.priorityGroups.includes(g)}
                    onClick={() => set('priorityGroups', toggle(draft.priorityGroups, g))}
                  />
                ))}
              </div>
              <p style={honestNote}>
                Prioriser ne fait pas disparaître le reste : tous les groupes du découpage sont
                travaillés de toute façon.
              </p>
            </Step>
          )}

          {step === 'sensible' && (
            <Step
              icon={<IconAlert size={26} />}
              title="Une articulation sensible ?"
              subtitle="Facultatif. Les mouvements connus pour taper dessus sont retirés du programme."
            >
              {SORE_ZONES.map((z) => (
                <OptionCard
                  key={z}
                  icon={<IconAlert size={20} />}
                  label={ZONE_LABELS[z]}
                  desc={
                    z === 'epaule' ? 'Retire développés verticaux, dips, écartés, pull-over.'
                    : z === 'coude-poignet' ? 'Retire les barres droites/EZ, dips, extensions nuque.'
                    : z === 'lombaires' ? 'Retire soulevé de terre, rowing barre, good morning, squat barre.'
                    : 'Retire squats, fentes, presse, leg extension.'
                  }
                  active={draft.soreZones.includes(z)}
                  onClick={() => set('soreZones', toggle(draft.soreZones, z))}
                  multi
                />
              ))}
              <p style={honestNote}>
                Ce n'est pas un avis médical. En cas de douleur qui dure, va voir un médecin —
                l'appli ne fait que retirer des exercices d'une liste.
              </p>
            </Step>
          )}

          {step === 'toi' && (
            <Step
              icon={<IconUser size={26} />}
              title="Quelques chiffres sur toi"
              subtitle="Facultatif. Le poids sert à démarrer ton suivi ; le reste n'est gardé que pour se souvenir de tes réponses."
            >
              <div style={fieldRow}>
                <NumberField label="Âge" value={draft.age} onChange={(v) => set('age', v)} placeholder="ans" min={10} max={99} />
                <NumberField label="Taille" value={draft.heightCm} onChange={(v) => set('heightCm', v)} placeholder="cm" min={100} max={230} />
                <NumberField label="Poids" value={draft.weightKg} onChange={(v) => set('weightKg', v)} placeholder="kg" min={25} max={250} />
              </div>
              <p style={fieldLabel}>Sexe</p>
              <div style={chipWrap}>
                {([['homme', 'Homme'], ['femme', 'Femme'], ['nsp', 'Je préfère ne pas dire']] as [QuizSex, string][]).map(([v, l]) => (
                  <Chip key={v} label={l} active={draft.sex === v} onClick={() => set('sex', v)} />
                ))}
              </div>
              <p style={honestNote}>
                Ces chiffres ne changent pas le programme : l'appli ne calcule ni tes calories ni tes
                charges à ta place. Le poids, lui, apparaîtra dans l'onglet Poids.
              </p>
            </Step>
          )}

          {step === 'reglages' && (
            <Step
              icon={<IconPalette size={26} />}
              title="Dernière question"
              subtitle="Tu es plutôt du genre à aimer personnaliser un maximum de trucs (couleurs, icônes, animations...), ou à préférer que ce soit simple direct ?"
            >
              <OptionCard
                icon={<IconPalette size={20} />} label="J'aime personnaliser"
                desc="Tous les réglages restent visibles."
                active={draft.simplicity === 'perso'} onClick={() => set('simplicity', 'perso')}
              />
              <OptionCard
                icon={<IconSparkles size={20} />} label="Je préfère simple"
                desc="Seuls les réglages essentiels sont affichés."
                active={draft.simplicity === 'simple'} onClick={() => set('simplicity', 'simple')}
              />
              <p style={honestNote}>
                Modifiable à tout moment dans Réglages → Apparence → « Réglages avancés ».
              </p>
            </Step>
          )}

          {step === 'recap' && result && (
            <Step
              icon={<IconCheck size={26} />}
              title={`Voilà ton programme${hello}`}
              subtitle={`${programName(profile)} · ${resolvedSplitLabel(profile)} · ${profile.daysPerWeek} séances/semaine · ~${profile.sessionMinutes} min`}
            >
              {result.warnings.length > 0 && (
                <div style={warnBox}>
                  <p style={warnTitle}><IconAlert size={13} /> À savoir</p>
                  {result.warnings.map((w, i) => <p key={i} style={warnLine}>{w}</p>)}
                </div>
              )}

              <p style={blockLabel}>LES SÉANCES</p>
              {result.program.workouts.map((w) => (
                <div key={w.id} style={dayBox}>
                  <p style={dayTitle}>
                    {w.name}
                    <span style={dayDuration}> · {w.estimatedDuration} · {w.exercises.length} exercices</span>
                  </p>
                  {w.exercises.map((ex) => (
                    <p key={ex.id} style={exLine}>
                      <span style={{ color: 'var(--text-secondary)' }}>{ex.name}</span>
                      {' — '}{ex.sets} × {ex.targetReps}
                      <span style={{ color: 'var(--text-micro)' }}> · {ex.restSeconds}s</span>
                    </p>
                  ))}
                </div>
              ))}

              <p style={blockLabel}>VOLUME HEBDOMADAIRE (SÉRIES)</p>
              <div style={volBox}>
                {result.volume.map(({ group, sets }) => {
                  const max = result.volume[0]?.sets || 1;
                  return (
                    <div key={group} style={volRow}>
                      <span style={volLabel}>{group}</span>
                      <span style={volTrack}>
                        <span style={{ ...volFill, width: `${(sets / max) * 100}%` }} />
                      </span>
                      <span style={volValue}>{sets}</span>
                    </div>
                  );
                })}
              </div>

              <p style={blockLabel}>POURQUOI CE PROGRAMME</p>
              <div style={whyBox}>
                {whyLines(profile).map((line, i) => (
                  <div key={i} style={whyRow}>
                    <span style={whyBullet}><IconCheck size={11} /></span>
                    <span>
                      <span style={whyTitle}>{line.title}</span>
                      <span style={whyDetail}>{line.detail}</span>
                    </span>
                  </div>
                ))}
              </div>

              <p style={blockLabel}>CE QUI VA CHANGER DANS L'APPLI</p>
              <div style={whyBox}>
                {sideEffectLines(profile, activate).map((line, i) => (
                  <p key={i} style={effectLine}>• {line}</p>
                ))}
                <p style={{ ...effectLine, color: 'var(--text-dim)' }}>
                  • Aucun programme existant n'est supprimé, et ton historique n'est pas touché.
                </p>
              </div>

              <label style={switchRow}>
                <input
                  type="checkbox"
                  checked={activate}
                  onChange={(e) => setActivate(e.target.checked)}
                  style={checkbox}
                />
                <span style={switchLabel}>En faire mon programme actif tout de suite</span>
              </label>

              <button
                onClick={() => setSeed(Math.floor(Math.random() * 1_000_000) + 1)}
                style={secondaryBtn}
              >
                Proposer d'autres exercices
              </button>
              <p style={honestNote}>{result.program.source}</p>
            </Step>
          )}
        </div>

        {/* ── Pied : navigation ─────────────────────────────────────────── */}
        <div style={footer}>
          {stepIndex > 0 && (
            <button onClick={goBack} style={backBtn} aria-label="Question précédente">
              <IconArrowLeft size={16} />
            </button>
          )}
          {step === 'recap' ? (
            <button onClick={finish} style={primaryBtn}>C'est parti, j'enregistre</button>
          ) : (
            <button
              onClick={goNext}
              disabled={!canContinue()}
              style={{ ...primaryBtn, ...(canContinue() ? {} : primaryDisabled) }}
            >
              {step === 'reglages' ? 'Construire mon programme' : 'Continuer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Briques d'interface ─────────────────────────────────────────────────────

const Step: React.FC<{
  icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode;
}> = ({ icon, title, subtitle, children }) => (
  <div>
    <div style={stepBadge}>{icon}</div>
    <h2 style={stepTitle}>{title}</h2>
    <p style={stepSubtitle}>{subtitle}</p>
    {children}
  </div>
);

/**
 * Carte de réponse. `multi` change juste la forme de l'indicateur (carré pour
 * un choix multiple, rond pour un choix unique) — le même repère visuel que
 * partout ailleurs, pour qu'on sache d'un coup d'œil si on peut en cocher
 * plusieurs.
 */
const OptionCard: React.FC<{
  icon: React.ReactNode; label: string; desc: string;
  active: boolean; onClick: () => void; multi?: boolean;
}> = ({ icon, label, desc, active, onClick, multi }) => (
  <button onClick={onClick} style={{ ...optionCard, ...(active ? optionCardActive : {}) }}>
    <span style={{ ...optionIcon, ...(active ? optionIconActive : {}) }}>{icon}</span>
    <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
      <span style={optionLabel}>{label}</span>
      <span style={optionDesc}>{desc}</span>
    </span>
    <span style={{ ...optionMark, borderRadius: multi ? 6 : 999, ...(active ? optionMarkActive : {}) }}>
      {active && <IconCheck size={11} color="#fff" />}
    </span>
  </button>
);

const Chip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ ...chip, ...(active ? chipActive : {}) }}>{label}</button>
);

const IntroLine: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div style={introRow}>
    <span style={{ color: 'var(--brand-1)', display: 'inline-flex', flexShrink: 0 }}>{icon}</span>
    <span>{text}</span>
  </div>
);

const NumberField: React.FC<{
  label: string; value: number | null; onChange: (v: number | null) => void;
  placeholder: string; min: number; max: number;
}> = ({ label, value, onChange, placeholder, min, max }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <p style={fieldLabel}>{label}</p>
    <input
      type="number"
      inputMode="numeric"
      value={value ?? ''}
      min={min}
      max={max}
      onChange={(e) => {
        const n = parseFloat(e.target.value);
        // Une saisie vide efface la valeur au lieu d'enregistrer NaN, et on
        // ne retient rien d'aberrant (doigt qui glisse sur le pavé).
        onChange(Number.isFinite(n) && n >= min && n <= max ? n : null);
      }}
      placeholder={placeholder}
      style={{ ...textInput, marginBottom: 0 }}
    />
  </div>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 300,
  background: 'var(--bg-base)',
  display: 'flex', justifyContent: 'center',
};
const panel: React.CSSProperties = {
  width: '100%', maxWidth: 480, height: '100dvh',
  display: 'flex', flexDirection: 'column', position: 'relative',
};
const header: React.CSSProperties = {
  padding: '0 18px 10px',
  paddingTop: 'max(18px, env(safe-area-inset-top))',
  flexShrink: 0,
};
const progressTrack: React.CSSProperties = {
  height: 5, borderRadius: 999, background: 'var(--bg-elevated)', overflow: 'hidden',
};
const progressFill: React.CSSProperties = {
  height: '100%', borderRadius: 999,
  background: 'linear-gradient(90deg, var(--brand-1), var(--brand-2))',
  transition: 'width 0.35s cubic-bezier(0.34, 1.2, 0.64, 1)',
};
const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8,
};
const stepCounter: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 10.5, fontWeight: 700, letterSpacing: 1,
};
const dismissBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 10, background: 'var(--bg-elevated)',
  border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const body: React.CSSProperties = {
  flex: 1, overflowY: 'auto', padding: '10px 18px 18px',
};
const footer: React.CSSProperties = {
  display: 'flex', gap: 8, padding: '12px 18px',
  paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
  borderTop: '1px solid var(--border-subtle)', flexShrink: 0,
  background: 'var(--bg-base)',
};

const stepBadge: React.CSSProperties = {
  width: 56, height: 56, borderRadius: 18,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
  color: 'var(--brand-1)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  marginBottom: 14,
};
const stepTitle: React.CSSProperties = {
  color: 'var(--text-primary)', fontSize: 21, fontWeight: 800,
  letterSpacing: -0.4, lineHeight: '27px', marginBottom: 8,
};
const stepSubtitle: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 13, lineHeight: '19px', marginBottom: 18,
};

const optionCard: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
  padding: '13px 14px', marginBottom: 9, borderRadius: 16, cursor: 'pointer',
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  transition: 'border-color 0.15s, background 0.15s',
};
const optionCardActive: React.CSSProperties = {
  background: 'var(--bg-elevated)', border: '1px solid var(--brand-1)',
};
const optionIcon: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 13, flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'var(--bg-elevated)', color: 'var(--text-muted)',
  border: '1px solid var(--border)',
};
const optionIconActive: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  color: '#fff', border: '1px solid transparent',
};
const optionLabel: React.CSSProperties = {
  display: 'block', color: 'var(--text-primary)', fontSize: 14.5, fontWeight: 700,
};
const optionDesc: React.CSSProperties = {
  display: 'block', color: 'var(--text-dim)', fontSize: 11.5, lineHeight: '16px', marginTop: 2,
};
const optionMark: React.CSSProperties = {
  width: 20, height: 20, flexShrink: 0,
  border: '1px solid var(--border-strong)', background: 'transparent',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const optionMarkActive: React.CSSProperties = {
  background: 'var(--brand-1)', border: '1px solid transparent',
};

const bigChoiceRow: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 14 };
const bigChoice: React.CSSProperties = {
  flex: 1, padding: '16px 0', borderRadius: 16, cursor: 'pointer',
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  color: 'var(--text-secondary)', fontSize: 19, fontWeight: 800,
};
const bigChoiceActive: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  border: '1px solid transparent', color: '#fff',
};

const chipWrap: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 };
const chip: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-mid)',
};
const chipActive: React.CSSProperties = {
  background: 'var(--brand-1)', color: '#fff', border: '1px solid transparent',
};

const textInput: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 12, marginBottom: 14,
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
};
const fieldLabel: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, marginBottom: 6,
};
const fieldRow: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 14 };

const switchRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  borderRadius: 14, padding: '12px 14px', marginTop: 4, marginBottom: 12,
};
const checkbox: React.CSSProperties = { width: 18, height: 18, accentColor: 'var(--brand-1)', flexShrink: 0 };
const switchLabel: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: 12.5, lineHeight: '17px' };

const helperText: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 12.5, lineHeight: '18px', marginBottom: 10,
};
const honestNote: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 11, lineHeight: '16px', marginTop: 10,
};
const introList: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4,
};
const introRow: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10,
  color: 'var(--text-muted)', fontSize: 12.5, lineHeight: '18px',
};

const primaryBtn: React.CSSProperties = {
  flex: 1, padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
  background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))',
  border: '1px solid transparent', color: '#fff', fontSize: 14.5, fontWeight: 800,
};
const primaryDisabled: React.CSSProperties = {
  background: 'var(--bg-elevated)', color: 'var(--text-dim)',
  border: '1px solid var(--border-mid)', cursor: 'not-allowed',
};
const secondaryBtn: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
  background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)',
  color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 700, marginTop: 2,
};
const backBtn: React.CSSProperties = {
  width: 48, borderRadius: 14, cursor: 'pointer', flexShrink: 0,
  background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)',
  color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const skipBtn: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 18, padding: '10px 0',
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-dim)', fontSize: 11.5, textDecoration: 'underline',
};

// ─── Récapitulatif ───────────────────────────────────────────────────────────

const blockLabel: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
  marginTop: 18, marginBottom: 8,
};
const dayBox: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  borderRadius: 12, padding: '11px 13px', marginBottom: 8,
};
const dayTitle: React.CSSProperties = {
  color: 'var(--text-primary)', fontSize: 13, fontWeight: 800, marginBottom: 6,
};
const dayDuration: React.CSSProperties = {
  color: 'var(--text-dim)', fontSize: 11, fontWeight: 400,
};
const exLine: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 11.5, lineHeight: '18px',
};
const volBox: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  borderRadius: 12, padding: '12px 13px',
};
const volRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 };
const volLabel: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 10.5, width: 120, flexShrink: 0 };
const volTrack: React.CSSProperties = {
  flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden',
};
const volFill: React.CSSProperties = {
  display: 'block', height: '100%', borderRadius: 3,
  background: 'linear-gradient(90deg, var(--brand-1), var(--brand-2))',
};
const volValue: React.CSSProperties = { color: 'var(--text-dim)', fontSize: 10.5, width: 22, textAlign: 'right' };

const whyBox: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
  borderRadius: 12, padding: '13px 14px',
};
const whyRow: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 11,
};
const whyBullet: React.CSSProperties = {
  width: 18, height: 18, borderRadius: 999, flexShrink: 0, marginTop: 1,
  background: 'var(--brand-1)', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const whyTitle: React.CSSProperties = {
  display: 'block', color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 700,
};
const whyDetail: React.CSSProperties = {
  display: 'block', color: 'var(--text-dim)', fontSize: 11.5, lineHeight: '16px', marginTop: 2,
};
const effectLine: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 11.5, lineHeight: '18px',
};

const warnBox: React.CSSProperties = {
  background: 'rgba(232, 160, 32, 0.10)', border: '1px solid rgba(232, 160, 32, 0.32)',
  borderRadius: 12, padding: '11px 13px', marginBottom: 12,
};
const warnTitle: React.CSSProperties = {
  color: '#e8a020', fontSize: 11, fontWeight: 800, letterSpacing: 0.6,
  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5,
};
const warnLine: React.CSSProperties = {
  color: 'var(--text-muted)', fontSize: 11.5, lineHeight: '17px',
};
