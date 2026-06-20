// ─── Types principaux ───────────────────────────────────────────────────────

/**
 * restMode:
 *  - 'normal'    → repos simple après la série
 *  - 'superset'  → pas de repos entre les deux exercices SS, repos après la paire
 *  - 'bilateral' → 45 s entre jambe gauche/droite, puis 120 s après la paire
 */
export type RestMode = 'normal' | 'superset' | 'bilateral';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  targetReps: string;        // "6-10" | "AMRAP" | "45 s" | "Max sec" | "10/jambe"
  restSeconds: number;       // Durée de repos après l'exercice (ou après la paire SS)
  restMode: RestMode;
  bilateralRestSeconds?: number; // Pour restMode=bilateral : repos inter-jambes (ex: 45)
  isSuperset: boolean;
  supersetGroupId?: string;  // ID partagé entre les deux exos d'un SS
  supersetOrder?: 1 | 2;     // 1 = pas de repos après, 2 = repos après
  defaultWeight?: string;    // Suggestion de départ (ex: "PDC", "45", "20")
  notes: string;
}

export interface WorkoutDay {
  id: string;
  dayNumber: number;         // 1, 2, 3, 5, 6, 7
  name: string;              // "Pull A", "Push B"…
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

// ─── State de session ────────────────────────────────────────────────────────

export interface SetEntry {
  weight: string;   // Saisie libre ("PDC", "45.5", …)
  reps: string;     // Saisie libre ("10", "AMRAP", "45 s", …)
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

// ─── History ─────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  dayId: string;
  date: number;                  // timestamp ms
  exerciseProgress: ExerciseProgress;
  durationMs: number;
}

// ─── Timer ───────────────────────────────────────────────────────────────────

export interface TimerState {
  isRunning: boolean;
  endTimestamp: number | null;   // Date.now() + duration*1000 au démarrage
  totalSeconds: number;          // Durée initiale (pour la progress bar)
}
