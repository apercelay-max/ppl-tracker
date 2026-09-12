// ─── Ce à quoi l'utilisateur a droit, côté interface ───────────────────────
//
// UN SEUL point d'entrée pour toute l'appli : aucun écran ne doit lire
// `paywallTestEnabled` directement, sinon on se retrouve avec deux règles qui
// divergent. Les écrans posent une question (`ent.cardioSensors`), ils ne
// décident pas.
//
// DEUX RÉGIMES :
//
//   1. Mode test ÉTEINT (le cas par défaut, et le seul en production
//      aujourd'hui) → `UNLIMITED` : tout est ouvert, aucune limite, pas de
//      publicité. L'appli se comporte exactement comme avant l'ajout de ce
//      fichier. C'est volontaire : tant qu'aucun paiement n'existe, il serait
//      malhonnête de bloquer quoi que ce soit.
//
//   2. Mode test ALLUMÉ (Réglages → Données → Tester les abonnements) → les
//      droits du palier simulé. Sert à voir l'appli avec les yeux d'un
//      utilisateur gratuit, Pro ou Max, sans avoir à payer ni à créer de
//      compte de test.
//
// RAPPEL : ce hook ne protège rien. Il masque. Ce qui coûte de l'argent (les
// appels au coach IA) est vérifié dans api/coach.ts, côté serveur, et c'est
// la seule vérification qui compte.

import { useWorkoutStore } from '../store/workoutStore';
import { ENTITLEMENTS, UNLIMITED, type Entitlements, type Tier } from '../lib/entitlements';

export interface EntitlementState {
  /** Droits effectifs à appliquer ici et maintenant. */
  ent: Entitlements;
  /** Palier simulé. Vaut 'max' hors mode test, mais ne t'en sers pas pour
   *  décider : passe par `ent`, qui tient compte des deux régimes. */
  tier: Tier;
  /** Vrai seulement quand le banc d'essai est allumé. Sert à afficher le
   *  bandeau « mode test » pour qu'on ne confonde jamais une limite simulée
   *  avec un bug. */
  testMode: boolean;
}

export const useEntitlement = (): EntitlementState => {
  const testMode = useWorkoutStore((s) => s.paywallTestEnabled);
  const tier = useWorkoutStore((s) => s.paywallTestTier);

  return {
    ent: testMode ? ENTITLEMENTS[tier] : UNLIMITED,
    tier: testMode ? tier : 'max',
    testMode,
  };
};

/**
 * Date avant laquelle l'historique est masqué, ou `null` si tout est visible.
 *
 * Masqué, PAS supprimé : les entrées restent dans le store et reviennent
 * intactes dès que le palier remonte. C'est le seul comportement acceptable —
 * effacer les données de quelqu'un parce qu'il ne paie plus serait
 * indéfendable, et de toute façon la sauvegarde locale les garde.
 */
export const historyCutoff = (ent: Entitlements): number | null =>
  Number.isFinite(ent.historyDays)
    ? Date.now() - ent.historyDays * 24 * 60 * 60 * 1000
    : null;
