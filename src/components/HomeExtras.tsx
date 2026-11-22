import React from 'react';
import { IconSparkles } from './Icons';
import { useWorkoutStore } from '../store/workoutStore';
import type { DailyBriefState } from '../hooks/useDailyBrief';
import type { DailyPlanExercise } from '../utils/dailyBrief';
import { formatReps, shortExerciseName } from '../utils/homeProgram';
import { formatWeightForDisplay, weightUnitLabel } from '../utils/weight';

// Trois petites pièces de l'accueil, partagées par les deux présentations
// (HomeScreen et HomeScreenClassic) pour qu'elles disent la même chose partout :
//  - GreetingButton : « Bonjour <prénom> » en grand, avec une grosse flèche qui ouvre le
//    résumé du jour (écrit par l'IA) ;
//  - AiCoachCard    : le conseil du jour de l'IA, avec la même flèche ;
//  - TodayLoads     : les charges conseillées pour la séance du jour (calculées par l'appli,
//    pas par l'IA).
// Les styles sont dans index.css (.greet-*, .ai-*, .today-loads).

// Un chevron (une barre pliée en deux, sans tige), le même dessin que dans la barre du haut.
const ArrowIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

interface GreetingButtonProps {
  firstName: string;
  onOpen: () => void;
  /** Le résumé du jour est prêt : la flèche fait un petit signe quelques fois. */
  fresh?: boolean;
  /** « classic » : la présentation Classique, qui n'utilise ni la police ni les couleurs du reste. */
  variant?: 'classic';
}

export const GreetingButton: React.FC<GreetingButtonProps> = ({ firstName, onOpen, fresh, variant }) => (
  <button
    type="button"
    className={`greet-btn${variant === 'classic' ? ' greet-classic' : ''}`}
    onClick={onOpen}
    aria-label={`Bonjour ${firstName} : ouvrir le résumé du jour`}
  >
    <span className="greet-txt">Bonjour {firstName}</span>
    <span className={`greet-arrow${fresh ? ' fresh' : ''}`}><ArrowIcon /></span>
  </button>
);

interface AiCoachCardProps {
  brief: DailyBriefState;
  /** Ouvre le résumé du jour, en plein écran. */
  onOpenSummary: () => void;
  /** Ouvre l'écran Coach, où l'on peut brancher une clé quand il n'y en a pas. */
  onOpenCoach: () => void;
}

export const AiCoachCard: React.FC<AiCoachCardProps> = ({ brief, onOpenSummary, onOpenCoach }) => {
  const daily = brief.cached?.daily;
  // Quatre états, du meilleur au moins bon : le conseil est prêt, la clé manque, la
  // dernière tentative a échoué, ou le coach est encore en train d'écrire.
  let tone: 'ready' | 'warn' | 'wait' = 'ready';
  let line: string;
  let sub: string;
  let go: () => void = onOpenSummary;
  if (daily) {
    line = daily.conseil || daily.resume;
    sub = 'Touche pour lire ton résumé du jour';
  } else if (brief.needsKey) {
    tone = 'warn';
    line = 'Branche ton coach IA : colle une clé gratuite (Groq ou Gemini).';
    sub = 'Touche pour le brancher';
    go = onOpenCoach;
  } else if (brief.error && !brief.loading) {
    tone = 'warn';
    line = 'Le coach n’a pas pu préparer ton résumé.';
    sub = 'Touche pour réessayer';
    go = brief.refresh;
  } else {
    tone = 'wait';
    line = 'Ton coach prépare ton résumé du jour…';
    sub = 'Ça prend quelques secondes';
  }
  return (
    <button type="button" className={`ai-card glass-card ai-${tone}`} onClick={go}>
      <span className="ai-head">
        <span className="ai-eyebrow"><IconSparkles size={14} />Coach IA</span>
        {tone === 'wait' && <i className="ai-dot" aria-hidden="true" />}
      </span>
      <span className="ai-line">{line}</span>
      <span className="ai-sub">{sub}</span>
      <span className="ai-arrow" aria-hidden="true"><ArrowIcon /></span>
    </button>
  );
};

interface TodayLoadsProps {
  exercises: DailyPlanExercise[];
  /** Nombre d'exercices montrés, les autres sont résumés en « + N autres ». */
  max?: number;
}

export const TodayLoads: React.FC<TodayLoadsProps> = ({ exercises, max = 3 }) => {
  const unit = useWorkoutStore((s) => s.weightUnit);
  // Tant qu'aucune charge n'est connue (tout premier lancement), il n'y a rien d'utile à lister.
  if (!exercises.some((ex) => ex.suggestedKg !== undefined)) return null;
  const shown = exercises.slice(0, max);
  const more = exercises.length - shown.length;
  return (
    <div>
      <ul className="today-loads" aria-label="Charges conseillées pour aujourd’hui">
        {shown.map((ex) => (
          <li key={ex.name}>
            <span>{shortExerciseName(ex.name)}</span>
            <b>
              {ex.suggestedKg !== undefined ? `${formatWeightForDisplay(String(ex.suggestedKg), unit)} ${weightUnitLabel(unit)}` : '—'}
              <i>{ex.sets} × {formatReps(ex.reps)}</i>
            </b>
          </li>
        ))}
      </ul>
      {more > 0 && <p className="today-loads-more">+ {more} autre{more > 1 ? 's' : ''} exercice{more > 1 ? 's' : ''}</p>}
    </div>
  );
};
