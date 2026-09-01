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
  /**
   * Exercice à garder en priorité si la séance est raccourcie (bouton
   * "Raccourcir la séance" quand on est en retard). Un exercice déjà
   * entamé (au moins une série faite) n'est jamais coupé, essentiel ou
   * pas — voir workoutStore.shortenSession.
   */
  essential?: boolean;
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
    exerciseNameOverrides?: { [exerciseId: string]: string };
    disabledSupersetGroupIds?: string[];
    /** Salle où la séance est faite (voir Réglages → Mes salles). */
    gymId?: string;
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
  gymId?: string;                // Salle où la séance a été faite
  // Exercices remplacés pendant la séance, par id d'origine. Sans cette
  // trace, une série faite sur un AUTRE mouvement venait grossir la courbe et
  // les records de l'exercice prévu au programme.
  exerciseNameOverrides?: { [exerciseId: string]: string };
}

// ─── Timer ────────────────────────────────────────────────────────────────

export interface TimerState {
    isRunning: boolean;
    endTimestamp: number | null;   // Date.now() + duration*1000 au démarrage
  totalSeconds: number;          // Durée initiale (pour la progress bar)
  isPaused?: boolean;             // vrai quand le repos est mis en pause manuellement
  pausedRemainingSeconds?: number | null; // secondes figées pendant la pause
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
  // Relevés du mode vélo. Tous facultatifs : une entrée saisie à la main n'en
  // a aucun, une entrée enregistrée avec un vélo sans capteur de puissance
  // n'aura que la cadence, etc.
  stats?: CardioStats;
}

/** Ce qu'un vélo connecté a réellement mesuré pendant la séance. */
export interface CardioStats {
  avgPower?: number;       // watts
  maxPower?: number;       // watts
  avgCadence?: number;     // tours/min
  maxCadence?: number;     // tours/min
  avgSpeed?: number;       // km/h
  distanceKm?: number;
  avgHr?: number;
  maxHr?: number;
  /** D'où viennent les chiffres : utile pour ne pas comparer des pommes et des poires. */
  source?: 'bluetooth' | 'gps' | 'manuel';
  deviceName?: string;
}

// ─── Poids du corps (fonctionnalité en essai) ───────────────────────────────

// Une mesure de composition corporelle peut être saisie soit en pourcentage,
// soit en kg — on garde l'unité choisie par l'utilisateur plutôt que de
// forcer une conversion (on ne connaît pas son poids total au moment de la
// bascule / pas de règle fiable sans plus d'infos).
export type MassUnit = 'percent' | 'kg';

export interface MassMeasurement {
    value: number;
    unit: MassUnit;
}

export interface BodyWeightEntry {
    id: string;
    date: number;      // timestamp ms
  weightKg: number;
    bodyFat?: MassMeasurement;     // masse graisseuse, en % ou en kg
  muscleMass?: MassMeasurement;  // masse musculaire, en % ou en kg
}

// ─── Barre de navigation : clé de chaque onglet possible ───────────────────

export type NavTabKey =
    | 'home' | 'objectifs' | 'historique' | 'cardio' | 'exercices' | 'catalogue' | 'poids' | 'dashboard' | 'profil' | 'settings';
