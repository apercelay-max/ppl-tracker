// ─── Rapprochement programme ↔ catalogue ───────────────────────────────────
// Extrait de ExerciseCatalog.tsx (aout 2026) pour pouvoir etre utilise par du
// code non-React (adaptation de seance, calcul des disques) sans importer un
// composant — et sans dependance circulaire avec le store.

import { EXERCISE_CATALOG, type CatalogExercise } from '../data/exercisesCatalog';

/** Recherche insensible à la casse ET aux accents (taper "developpe" trouve "Développé"). */
export const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();


/**
 * Retrouve l'exercice du catalogue correspondant à une ligne de programme.
 *
 * Trois niveaux, du plus sûr au plus permissif :
 *  1. identifiant `cat-<slug>` — les programmes bâtis sur le catalogue ;
 *  2. nom identique (accents et ponctuation ignorés) ;
 *  3. rapprochement par mots-clés — indispensable pour les programmes écrits à
 *     la main, où les noms sont personnalisés : « Curl poulie basse à la corde »
 *     doit retrouver « Curl à la poulie basse ».
 *
 * Le niveau 3 exige au moins 2 mots significatifs communs ET que le candidat
 * couvre plus de la moitié des mots du nom cherché : sans ce garde-fou, on
 * associerait n'importe quel curl à n'importe quel autre curl.
 */
const STOP_WORDS = new Set([
  'a', 'la', 'le', 'les', 'de', 'du', 'des', 'en', 'au', 'aux', 'avec', 'sur',
  'un', 'une', 'et', 'ou', 'pour', 'par', 'l', 'd',
]);

const tokenize = (s: string): string[] =>
  normalize(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w));

const byNormalizedName = new Map(
  EXERCISE_CATALOG.map((ex) => [normalize(ex.name), ex] as const)
);

/**
 * Poids de chaque mot (IDF) : « curl », « halteres » ou « poulie » reviennent
 * partout et ne distinguent presque rien, alors que « marteau », « incline » ou
 * « pullover » identifient un exercice précis. Sans cette pondération, « Curl
 * marteau haltères » se faisait illustrer par un curl classique.
 */
const DOC_FREQ = new Map<string, number>();
for (const ex of EXERCISE_CATALOG) {
  for (const w of new Set(tokenize(ex.name))) DOC_FREQ.set(w, (DOC_FREQ.get(w) ?? 0) + 1);
}
const idf = (w: string) => Math.log(EXERCISE_CATALOG.length / (1 + (DOC_FREQ.get(w) ?? 0))) + 1;

const catalogTokens = EXERCISE_CATALOG.map((ex) => {
  const tokens = new Set(tokenize(ex.name));
  let norm = 0;
  for (const w of tokens) norm += idf(w) ** 2;
  return { ex, tokens, norm: Math.sqrt(norm) };
});

export const findCatalogExercise = (
  exerciseId: string,
  exerciseName: string
): CatalogExercise | null => {
  if (exerciseId.startsWith('cat-')) {
    const slug = exerciseId.slice(4);
    const hit = EXERCISE_CATALOG.find((ex) => ex.id === slug);
    if (hit) return hit;
  }

  const exact = byNormalizedName.get(normalize(exerciseName));
  if (exact) return exact;

  const wanted = [...new Set(tokenize(exerciseName))];
  if (wanted.length === 0) return null;
  let wantedNorm = 0;
  for (const w of wanted) wantedNorm += idf(w) ** 2;
  wantedNorm = Math.sqrt(wantedNorm);
  if (wantedNorm === 0) return null;

  // Similarité cosinus sur les mots pondérés.
  let best: CatalogExercise | null = null;
  let bestScore = 0;
  for (const { ex, tokens, norm } of catalogTokens) {
    let dot = 0;
    let common = 0;
    for (const w of wanted) if (tokens.has(w)) { dot += idf(w) ** 2; common++; }
    if (common < 2 || norm === 0) continue;
    const score = dot / (wantedNorm * norm);
    if (score > bestScore) { bestScore = score; best = ex; }
  }
  // Seuil volontairement haut : mieux vaut pas de photo qu'une photo trompeuse.
  return bestScore >= 0.62 ? best : null;
};
