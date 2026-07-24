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
