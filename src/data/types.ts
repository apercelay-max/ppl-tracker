// ââ Types principaux ââââââââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * restMode:
 *  - 'normal'    â repos simple aprÃ¨s la sÃ©rie
 *  - 'superset'  â pas de repos entre les deux exercices SS, repos aprÃ¨s la paire
 *  - 'bilateral' â 45 s entre jambe gauche/droite, puis 120 s aprÃ¨s la paire
 */
export type RestMode = 'normal' | 'superset' | 'bilateral';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  targetReps: string;        // "6-10" | "AMRAP" | "45 s" | "Max sec" | "10/jambe"
  restSeconds: number;       // DurÃ©e de repos aprÃ¨s l'exercice (ou aprÃ¨s la paire SS)
  restMode: RestMode;
  bilateralRestSeconds?: number; // Pour restMode=bilateral : repos inter-jambes (ex: 45)
  isSuperset: boolean;
  supersetGroupId?: string;  // ID partagÃ© entre les deux exos d'un SS
  supersetOrder?: 1 | 2;     // 1 = pas de repos aprÃ¨s, 2 = repos aprÃ¨s
  defaultWeight?: string;    // Suggestion de dÃ©part (ex: "PDC", "45", "20")
  notes: string;
}

export interface WorkoutDay {
  id: string;
  dayNumber: number;         // 1, 2, 3, 5, 6, 7
  name: string;              // "Pull A", "Push B"â¦
  focus: string;
  muscleGroups: string;
  estimatedDuration: string;
  exercises: Exercise[];
}

export interface ProgressionWeek {
  label: string;             // "Sem. 1-2"
  phase: string;
  rir: string;
  objective: string;
}

// ââ State de session âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface SetEntry {
  weight: string;   // Saisie libre ("PDC", "45.5", â¦)
  reps: string;     // Saisie libre ("10", "AMRAP", "45 s", â¦)
  completed: boolean;
}

export interface ExerciseProgress {
  [exerciseId: string]: SetEntry[];
}

export interface WorkoutSession {
  dayId: string;
  startTime: number;                    // timestamp ms
  exerciseProgress: ExerciseProgress;   // poids/reps saisis
  currentExerciseIndex: number;
  currentSetIndex: number;
  isComplete: boolean;
}

// ââ History ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface HistoryEntry {
  id: string;
  dayId: string;
  date: number;                  // timestamp ms
  exerciseProgress: ExerciseProgress;
  durationMs: number;
  rpe?: number;                  // Auto-Ã©valuation sÃ©ance (1-10)
  tonnage?: number;              // Total kg soulevÃ©s (poids Ã reps sommÃ©s)
  trainingLoad?: number;         // Charge d'entraÃ®nement : RPE Ã durÃ©e en minutes
}

// ââ Timer ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface TimerState {
  isRunning: boolean;
  endTimestamp: number | null;   // Date.now() + duration*1000 au dÃ©marrage
  totalSeconds: number;          // DurÃ©e initiale (pour la progress bar)
}
