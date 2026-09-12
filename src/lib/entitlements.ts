// ─── Ce que chaque palier d'abonnement débloque ────────────────────────────
//
// SOURCE DE VÉRITÉ UNIQUE. Ce fichier est lu à deux endroits, et la
// répartition des rôles compte :
//
//   - côté client (hooks/useEntitlement.ts) : sert à AFFICHER — masquer une
//     section, montrer un cadenas, limiter une liste. C'est du confort, pas
//     une sécurité : n'importe qui ouvre les outils de développement et
//     change la valeur.
//   - côté serveur (api/coach.ts) : sert à AUTORISER. C'est la seule
//     vérification qui compte, parce que c'est la seule que l'utilisateur ne
//     peut pas contourner. Tout ce qui coûte de l'argent (appel Gemini,
//     stockage) doit être vérifié là-bas, jamais ici.
//
// ÉTAT ACTUEL : c'est un TEST. Rien n'est branché sur un vrai paiement, et
// tant que « Tester les abonnements » est éteint dans Réglages → Données,
// l'appli se comporte exactement comme avant (tout débloqué). Voir
// hooks/useEntitlement.ts.

/** Les trois paliers. `free` inclut la publicité. */
export type Tier = 'free' | 'pro' | 'max';

/** Ordre croissant — sert aux comparaisons « au moins Pro ». */
export const TIER_ORDER: Tier[] = ['free', 'pro', 'max'];

export const TIER_LABEL: Record<Tier, string> = {
  free: 'Gratuit',
  pro: 'Pro',
  max: 'Max',
};

/** Prix affichés en boutique (TTC). Indicatif : la vérité vient d'App Store
 *  Connect, qui applique ses propres paliers de prix par pays. */
export const TIER_PRICE: Record<Tier, string> = {
  free: '0 €',
  pro: '5 €/mois',
  max: '15 €/mois',
};

/**
 * Ampleur de l'adaptation de séance (utils/gymAdapt.ts) :
 *   'none' → aucune adaptation
 *   'time' → uniquement « j'ai 35 minutes » (raccourcir la séance)
 *   'full' → + courbatures par zone, machine occupée, substitution
 */
export type SessionAdaptLevel = 'none' | 'time' | 'full';

/** Profondeur du suivi corporel : rien / courbe de poids / + mensurations et photos. */
export type WeightTrackingLevel = 'none' | 'basic' | 'full';

/** Personnalisation : thème seul / + couleurs d'accent / tout (icônes, effets, accueil, nav). */
export type ThemingLevel = 'basic' | 'accents' | 'full';

export interface Entitlements {
  /** Jours d'historique consultables. Au-delà : MASQUÉ, jamais supprimé. */
  historyDays: number;
  /** Programmes sélectionnables parmi le catalogue complet. */
  programs: number;
  /** Salles enregistrables (disques et matériel propres à chacune). */
  gyms: number;
  cloudSync: boolean;
  showAds: boolean;
  sessionAdapt: SessionAdaptLevel;
  weightTracking: WeightTrackingLevel;
  theming: ThemingLevel;
  /** Import Excel/CSV. Reste dès Pro : c'est le chemin de migration depuis
   *  une appli concurrente, le bloquer coûterait plus qu'il ne rapporte. */
  dataImport: boolean;
  /** Cardio : GPS, ceinture cardiaque BLE, capteur vélo BLE. */
  cardioSensors: boolean;
  garminSync: boolean;
  /** Volume par muscle, déséquilibres, projection de 1RM, comparaison annuelle. */
  advancedStats: boolean;
  /** Requêtes au coach IA par mois. C'est la seule limite qui a un coût réel
   *  (appels Gemini) : elle DOIT être comptée côté serveur. */
  coachAiPerMonth: number;
  /** Le coach peut proposer des modifications de programme (utils/coachPatch.ts). */
  coachPatch: boolean;
  /** Génération d'un programme sur mesure pilotée par l'IA. */
  aiProgramGen: boolean;
  /** Bilan hebdomadaire automatique poussé en notification le lundi. */
  weeklyReview: boolean;
  /** Détection de plateau et proposition de deload. */
  deloadDetection: boolean;
  monthlyReport: boolean;
  /** Lien de consultation en lecture seule, à envoyer à un coach ou un kiné. */
  coachShareLink: boolean;
}

export const ENTITLEMENTS: Record<Tier, Entitlements> = {
  free: {
    historyDays: 30,
    programs: 3,
    gyms: 1,
    cloudSync: false,
    showAds: true,
    sessionAdapt: 'none',
    weightTracking: 'none',
    theming: 'basic',
    dataImport: false,
    cardioSensors: false,
    garminSync: false,
    advancedStats: false,
    coachAiPerMonth: 1, // l'essai unique, pour donner le goût
    coachPatch: false,
    aiProgramGen: false,
    weeklyReview: false,
    deloadDetection: false,
    monthlyReport: false,
    coachShareLink: false,
  },
  pro: {
    historyDays: Infinity,
    programs: Infinity,
    gyms: 3,
    cloudSync: true,
    showAds: false,
    sessionAdapt: 'time',
    weightTracking: 'basic',
    theming: 'accents',
    dataImport: true,
    cardioSensors: false,
    garminSync: false,
    advancedStats: false,
    coachAiPerMonth: 1,
    coachPatch: false,
    aiProgramGen: false,
    weeklyReview: false,
    deloadDetection: false,
    monthlyReport: false,
    coachShareLink: false,
  },
  max: {
    historyDays: Infinity,
    programs: Infinity,
    gyms: Infinity,
    cloudSync: true,
    showAds: false,
    sessionAdapt: 'full',
    weightTracking: 'full',
    theming: 'full',
    dataImport: true,
    cardioSensors: true,
    garminSync: true,
    advancedStats: true,
    coachAiPerMonth: 150, // plafond souple : jamais affiché, sert de garde-fou
    coachPatch: true,
    aiProgramGen: true,
    weeklyReview: true,
    deloadDetection: true,
    monthlyReport: true,
    coachShareLink: true,
  },
};

/**
 * L'appli telle qu'elle est aujourd'hui : tout ouvert, aucune limite.
 * C'est ce que renvoie useEntitlement() tant que le mode test est éteint —
 * autrement dit tant qu'il n'y a pas de vrai paiement branché, PPL Tracker
 * continue de fonctionner exactement comme avant pour tout le monde.
 */
export const UNLIMITED: Entitlements = { ...ENTITLEMENTS.max, showAds: false };

/** « Est-ce qu'on est au moins à ce palier ? » — pour les cas où c'est le
 *  palier lui-même qui compte, pas une capacité précise. */
export const atLeast = (tier: Tier, min: Tier): boolean =>
  TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(min);

/** Le plus petit palier qui donne accès à une capacité booléenne. Sert à
 *  écrire « Disponible avec Max » sous un cadenas sans coder le palier en
 *  dur à chaque endroit. */
export const requiredTierFor = (
  key: {
    [K in keyof Entitlements]: Entitlements[K] extends boolean ? K : never;
  }[keyof Entitlements],
): Tier | null => TIER_ORDER.find((t) => ENTITLEMENTS[t][key]) ?? null;
