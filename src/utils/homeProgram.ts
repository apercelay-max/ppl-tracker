// Petits formatages pour afficher le programme d'une séance sur l'accueil des
// grands écrans (iPad, Mac) — partagés par l'accueil du style actuel
// (HomeScreen.tsx) et par l'accueil Classique (HomeScreenClassic.tsx).

/** Nom d'exercice sans la précision entre parenthèses (« mains ≈ 1,5 × largeur
 *  d'épaules ») : utile en séance, mais elle allonge la ligne pour rien ici. */
export const shortExerciseName = (name: string): string =>
  name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

/** Les groupes musculaires sont stockés en capitales (« DOS — FINITION »). */
export const sentenceCase = (s: string): string => s.charAt(0) + s.slice(1).toLowerCase();

/** « 10-15 » → « 10–15 » (tiret demi-cadratin entre deux nombres). */
export const formatReps = (reps: string): string => reps.replace(/(\d)-(\d)/g, '$1–$2');
