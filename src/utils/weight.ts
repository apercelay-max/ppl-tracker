// ─── Unité de poids (kg / lbs) ──────────────────────────────────────────────
//
// Tout est stocké en interne en kg (SetEntry.weight, tonnage, calculs de
// utils/training.ts...) — ce fichier ne sert qu'à la conversion d'AFFICHAGE
// et de SAISIE quand Léo choisit "lbs" dans Réglages (voir
// workoutStore.weightUnit / setWeightUnit). Les valeurs non numériques
// ("PDC", vide, etc.) sont toujours retournées inchangées.

export type WeightUnit = 'kg' | 'lbs';

const KG_TO_LBS = 2.20462262;

export const kgToLbs = (kg: number): number => kg * KG_TO_LBS;
export const lbsToKg = (lbs: number): number => lbs / KG_TO_LBS;

const parseFreeWeight = (value: string): number | null => {
const trimmed = (value ?? '').trim();
if (trimmed === '') return null;
const n = parseFloat(trimmed.replace(',', '.'));
return isNaN(n) ? null : n;
};

// Poids stocké en kg (string libre) → valeur affichée dans l'unité choisie.
export const formatWeightForDisplay = (kgValue: string, unit: WeightUnit): string => {
if (unit === 'kg') return kgValue;
const n = parseFreeWeight(kgValue);
if (n === null) return kgValue; // "PDC", vide, texte libre : inchangé
return (Math.round(kgToLbs(n) * 10) / 10).toString();
};

// Saisie utilisateur dans l'unité affichée → valeur à stocker en kg.
export const parseWeightInputToKg = (displayValue: string, unit: WeightUnit): string => {
if (unit === 'kg') return displayValue;
const n = parseFreeWeight(displayValue);
if (n === null) return displayValue; // "PDC", vide, texte libre : inchangé
return (Math.round(lbsToKg(n) * 10) / 10).toString();
};

export const weightUnitLabel = (unit: WeightUnit): string => (unit === 'kg' ? 'kg' : 'lbs');

// ─── Saisie : nettoyage et validation ───────────────────────────────────────

export const MAX_WEIGHT_KG = 1000;
export const MAX_REPS = 999;

/** Ne garde que chiffres et un séparateur décimal ; la virgule (clavier FR) devient un point. */
export const cleanWeightInput = (raw: string): string => {
  const v = (raw ?? '').replace(',', '.').replace(/[^0-9.]/g, '');
  const dot = v.indexOf('.');
  const normalized = dot === -1 ? v : v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '');
  return normalized.slice(0, 7);
};

/** Reps : entiers uniquement, 3 chiffres max. */
export const cleanRepsInput = (raw: string): string => (raw ?? '').replace(/\D/g, '').slice(0, 3);

/** Une série est valide si les reps sont ≥ 1 et le poids (facultatif = poids du corps) est plausible. */
export const isValidSetInput = (weightDisplay: string, reps: string, unit: WeightUnit): boolean => {
  const r = parseInt(reps, 10);
  if (isNaN(r) || r < 1 || r > MAX_REPS) return false;
  const w = (weightDisplay ?? '').trim();
  if (w === '') return true;
  const n = parseFloat(w.replace(',', '.'));
  if (isNaN(n) || n < 0) return false;
  const kg = unit === 'kg' ? n : lbsToKg(n);
  return kg <= MAX_WEIGHT_KG;
};

/** Série réellement faite : validée ET pas simplement « passée » (reps = « — »). */
export const isPerformedSet = (s: { completed: boolean; reps: string }): boolean =>
  s.completed && s.reps !== '—';
