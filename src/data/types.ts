// ─── Types principaux ─────────────────────────────────────────────────────

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

// ─── State de session ───────────────────────────────────────────────────────

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

// ─── History ──────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  dayId: string;
  date: number;                  // timestamp ms
  exerciseProgress: ExerciseProgress;
  durationMs: number;
  rpe?: number;                  // Auto-évaluation séance (1-10)
  tonnage?: number;              // Total kg soulevés (poids × reps sommés)
  trainingLoad?: number;         // Charge d'entraînement : RPE × durée en minutes
  note?: string;                 // Ressenti libre noté par l'utilisateur à la fin
}

// ─── Timer ────────────────────────────────────────────────────────────────

export interface TimerState {
  isRunning: boolean;
  endTimestamp: number | null;   // Date.now() + duration*1000 au démarrage
  totalSeconds: number;          // Durée initiale (pour la progress bar)
}

// ─── Cardio (hors-programme PPL) ────────────────────────────────────────────

export type CardioActivityType = 'velo' | 'marche' | 'course' | 'autre';

export interface CardioEntry {
  id: string;
  type: CardioActivityType;
  date: number;          // timestamp ms
  durationMin: number;
  calories: number;      // calculées à l'ajout (durationMin/60 * kcal/h de l'activité)
  rpe?: number;          // Ressenti 1-10, facultatif
}

// ─── Poids du corps (fonctionnalité en essai) ───────────────────────────────

export interface BodyWeightEntry {
  id: string;
  date: number;      // timestamp ms
  weightKg: number;
}

// ─── Barre de navigation : clé de chaque onglet possible ───────────────────

export type NavTabKey =
  | 'home' | 'objectifs' | 'historique' | 'cardio' | 'exercices' | 'poids' | 'dashboard' | 'profil' | 'settings';
