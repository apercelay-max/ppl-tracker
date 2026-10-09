import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { create } from 'zustand';
import { useReferralStore } from './referral';

// ─── Abonnements PPL Pro (iOS uniquement) ───────────────────────────────────
// Les achats passent obligatoirement par Apple (achats intégrés) : sur le web
// (navigateur, PWA) il n'y a ni boutique ni prix, et `isPro` reste faux.
// Plugin natif : ios/App/App/SubscriptionsPlugin.swift (StoreKit 2).

// Deux formules dans le MÊME groupe d'abonnement Apple (niveaux) : on ne peut être abonné qu'à une
// seule à la fois, on passe de l'une à l'autre dans les réglages d'Apple, et l'essai gratuit n'est
// donné qu'une fois. Mêmes identifiants que dans App Store Connect et ios/App/PPLTracker.storekit,
// basés sur l'identifiant provisoire de l'appli : à confirmer avec l'adulte responsable du compte
// Apple Developer avant de créer les produits.
export const PRODUCT_PLUS = 'com.ppltracker.app.plus.monthly';
export const PRODUCT_PRO = 'com.ppltracker.app.pro.monthly';
export const PRODUCT_IDS = [PRODUCT_PLUS, PRODUCT_PRO];

export type Tier = 'free' | 'plus' | 'pro';
const TIER_RANK: Record<Tier, number> = { free: 0, plus: 1, pro: 2 };
const TIER_OF_PRODUCT: Record<string, Tier> = { [PRODUCT_PLUS]: 'plus', [PRODUCT_PRO]: 'pro' };

export const TIER_NAME: Record<Tier, string> = { free: 'Gratuit', plus: 'PPL Plus', pro: 'PPL Pro' };

/** Vrai si `tier` donne au moins les droits de `min`. */
export const tierAtLeast = (tier: Tier, min: Tier): boolean => TIER_RANK[tier] >= TIER_RANK[min];

/**
 * Offre de lancement : les 50 premiers abonnés de chaque formule paient moitié prix, et le gardent.
 *
 * Comment ça marche côté Apple : l'abonnement est mis en vente AU PRIX DE LANCEMENT.
 * Une fois les 50 abonnés atteints (à suivre dans App Store Connect > Ventes), on relève
 * le prix normal en cochant « Conserver le prix actuel pour les abonnés existants » :
 * ceux qui sont déjà abonnés continuent de payer le prix de lancement, pour toujours.
 *
 * Les prix réellement facturés viennent d'Apple (`displayPrice`). Les prix « normaux »
 * ci-dessous ne servent qu'à les barrer à l'écran : ils doivent être ceux qu'on appliquera
 * vraiment après le lancement, sinon on annonce un faux prix. Passer `active` à false
 * dès que les 50 places sont prises, pour retirer le bandeau.
 */
export const LAUNCH_OFFER = {
  active: true,
  places: 50,
  regularPrice: { [PRODUCT_PLUS]: '4,99 €', [PRODUCT_PRO]: '14,99 €' } as Record<string, string>,
};

// Limites du coach IA (résumé du jour, bilans, chat), en nombre d'appels réussis.
// Il coûte de l'argent à chaque appel (Google) : c'est ce qui sépare les formules.
// La limite est comptée sur le téléphone : elle règle l'usage normal, elle n'est pas
// inviolable (un serveur qui connaîtrait l'abonné serait nécessaire pour l'être).
export const AI_LIMITS: Record<Tier, { count: number; per: 'week' | 'month' } | null> = {
  free: { count: 3, per: 'week' },
  plus: { count: 15, per: 'month' },
  pro: null, // illimité
};

// Ce que chaque formule débloque. Apple exige que ces textes décrivent ce qui est RÉELLEMENT
// verrouillé (règle 3.1.2) : à garder alignés avec le code (tierAtLeast / hasTier).
export interface TierPlan {
  tier: Exclude<Tier, 'free'>;
  productId: string;
  tagline: string;
  /** Ce que cette formule ajoute ; `inherits` : « tout de la formule du dessous ». */
  inherits?: string;
  benefits: { icon: string; title: string; text: string }[];
}

export const TIER_PLANS: TierPlan[] = [
  {
    tier: 'plus',
    productId: PRODUCT_PLUS,
    tagline: 'Pour bien démarrer',
    benefits: [
      { icon: '📱', title: 'Widgets petits et moyens', text: 'Prochaine séance, série, record, poids, objectifs et récupération sur ton écran d\'accueil.' },
      { icon: '🏝️', title: 'Séance en direct', text: 'Exercice, repos, volume et durée sur l\'écran verrouillé et dans la Dynamic Island.' },
      { icon: '🎙️', title: 'Siri et Raccourcis', text: '« Démarre ma séance », « Où j\'en suis cette semaine ? » sans ouvrir l\'appli.' },
      { icon: '🤖', title: 'Coach IA : 15 par mois', text: 'Résumé du jour, bilans et chat.' },
      { icon: '🔋', title: 'Récupération musculaire', text: 'Où en est chaque muscle de sa récupération.' },
    ],
  },
  {
    tier: 'pro',
    productId: PRODUCT_PRO,
    tagline: 'Pour les sportifs sérieux',
    inherits: 'Tout PPL Plus, et :',
    benefits: [
      { icon: '🤖', title: 'Coach IA illimité', text: 'Autant de résumés, bilans et questions que tu veux.' },
      { icon: '🧠', title: 'Programme adapté par l\'IA', text: 'Le coach propose de modifier tes séances et tes charges.' },
      { icon: '📊', title: 'Stats avancées', text: 'Charge d\'entraînement, statut de forme et tendances semaine par semaine.' },
      { icon: '🧱', title: 'Grands widgets', text: 'Objectifs et récupération musculaire en grand format.' },
      { icon: '🧾', title: 'Analyse de séance par l\'IA', text: 'Un bilan à la fin de chaque séance : ce qui progresse, ce qui stagne, quoi changer.' },
      { icon: '🗓️', title: 'Planificateur de semaine', text: 'Dis tes jours, ton objectif et ton temps : le coach te construit un programme complet.' },
      { icon: '📤', title: 'Rapports à partager', text: 'Ta semaine ou ton mois en une image, avec volume, jours actifs et records.' },
      { icon: '📊', title: 'Export Excel complet', text: 'Séances, séries, records, poids et cardio dans un classeur.' },
      { icon: '🔐', title: 'Sauvegarde chiffrée', text: 'Une copie de tes données chiffrée avec ton mot de passe.' },
      { icon: '🎨', title: 'Thèmes exclusifs', text: 'Six palettes réservées à PPL Pro.' },
    ],
  },
];

export type PeriodUnit = 'day' | 'week' | 'month' | 'year';

export interface SubscriptionProduct {
  id: string;
  displayName: string;
  description: string;
  displayPrice: string;
  price: number;
  currencyCode: string;
  period?: { unit: PeriodUnit; value: number };
  introOffer?: { paymentMode: string; period: { unit: PeriodUnit; value: number }; periodCount: number; displayPrice: string };
  /** Faux si cette personne a déjà utilisé son essai gratuit. */
  introEligible?: boolean;
}

export interface Entitlement {
  productId: string;
  isTrial: boolean;
  /** Timestamp en millisecondes. */
  expirationDate?: number;
  /** Faux si l'abonnement a été annulé (il reste actif jusqu'à la date de fin). */
  willRenew?: boolean;
}

interface SubscriptionsPlugin {
  getProducts(options: { ids: string[] }): Promise<{ products: SubscriptionProduct[] }>;
  purchase(options: { id: string }): Promise<{ status: 'success' | 'cancelled' | 'pending' | 'unknown'; entitlements?: Entitlement[] }>;
  restore(): Promise<{ entitlements: Entitlement[] }>;
  getEntitlements(): Promise<{ entitlements: Entitlement[] }>;
  manage(): Promise<void>;
  requestReview(): Promise<void>;
  addListener(event: 'entitlementsChanged', cb: (data: { entitlements: Entitlement[] }) => void): Promise<PluginListenerHandle>;
}

const Subscriptions = registerPlugin<SubscriptionsPlugin>('Subscriptions');

export const subscriptionsAvailable = (): boolean => Capacitor.getPlatform() === 'ios';

interface SubscriptionState {
  /** Faux tant que l'état Pro n'a pas été lu : ne rien verrouiller ni proposer avant. */
  ready: boolean;
  products: SubscriptionProduct[];
  entitlements: Entitlement[];
  busy: boolean;
  error: string | null;
}

export const useSubscriptionStore = create<SubscriptionState>(() => ({
  ready: false,
  products: [],
  entitlements: [],
  busy: false,
  error: null,
}));

const patch = (p: Partial<SubscriptionState>) => useSubscriptionStore.setState(p);

/** Fin du Pro offert par le parrainage (ms), ou null. */
export const bonusUntilNow = (): number | null => {
  const until = useReferralStore.getState().state?.bonusUntil ?? null;
  return until !== null && until > Date.now() ? until : null;
};

const paidTier = (entitlements: Entitlement[]): Tier =>
  entitlements.reduce<Tier>((best, e) => {
    const t = TIER_OF_PRODUCT[e.productId] ?? 'free';
    return tierAtLeast(t, best) ? t : best;
  }, 'free');

// Le mois offert par le parrainage donne PPL Plus (pas Pro : l'IA illimitée a un coût réel).
const BONUS_TIER: Tier = 'plus';

/** Formule active : l'abonnement payant le plus haut, sinon le mois offert, sinon gratuit. */
export const currentTier = (): Tier => {
  const paid = paidTier(useSubscriptionStore.getState().entitlements);
  return bonusUntilNow() !== null && !tierAtLeast(paid, BONUS_TIER) ? BONUS_TIER : paid;
};

export const hasTier = (min: Tier): boolean => tierAtLeast(currentTier(), min);

export const useTier = (): Tier => {
  const entitlements = useSubscriptionStore((s) => s.entitlements);
  const bonusUntil = useReferralStore((s) => s.state?.bonusUntil ?? null);
  const paid = paidTier(entitlements);
  const bonusOn = bonusUntil !== null && bonusUntil > Date.now();
  return bonusOn && !tierAtLeast(paid, BONUS_TIER) ? BONUS_TIER : paid;
};

/** Vrai si une formule payante est active (hors mois offert). */
export const usePaidTier = (): Tier => paidTier(useSubscriptionStore((s) => s.entitlements));

/**
 * Les formules n'existent que dans l'appli iPhone. Sur le web et la PWA, personne n'est limité :
 * les utilisateurs actuels gardent tout. `ready` : tant que l'abonnement n'est pas lu, on ne limite rien.
 */
export const tiersEnforced = (): boolean => subscriptionsAvailable() && useSubscriptionStore.getState().ready;

/** Accès à une fonction réservée à `min` : toujours vrai hors appli iPhone. */
export const canUse = (min: Tier): boolean => !tiersEnforced() || hasTier(min);

export const useCanUse = (min: Tier): boolean => {
  const ready = useSubscriptionStore((s) => s.ready);
  const tier = useTier();
  return !subscriptionsAvailable() || !ready || tierAtLeast(tier, min);
};

// ─── Limite du coach IA ─────────────────────────────────────────────────────
const USAGE_KEY = 'ppl-ai-usage';

/** Début de la période en cours : le lundi de la semaine, ou le mois, en date locale. */
const periodKey = (per: 'week' | 'month'): string => {
  const d = new Date();
  if (per === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
};

const readUsage = (key: string): number => {
  try {
    const u = JSON.parse(localStorage.getItem(USAGE_KEY) ?? 'null') as { key: string; count: number } | null;
    return u && u.key === key ? u.count : 0;
  } catch { return 0; }
};

export interface AiQuota { allowed: boolean; used: number; limit: number | null; per: 'week' | 'month' | null; tier: Tier }

/** Où en est la personne de ses appels au coach IA. Illimité hors appli iPhone et pour Pro. */
export const aiQuota = (): AiQuota => {
  const tier = currentTier();
  const rule = tiersEnforced() ? AI_LIMITS[tier] : null;
  if (!rule) return { allowed: true, used: 0, limit: null, per: null, tier };
  const used = readUsage(`${tier}|${periodKey(rule.per)}`);
  return { allowed: used < rule.count, used, limit: rule.count, per: rule.per, tier };
};

/** À appeler après un appel réussi au coach IA. */
export const recordAiCall = (): void => {
  const q = aiQuota();
  if (q.limit === null || q.per === null) return;
  const key = `${q.tier}|${periodKey(q.per)}`;
  try { localStorage.setItem(USAGE_KEY, JSON.stringify({ key, count: readUsage(key) + 1 })); } catch { /* compteur indisponible : on ne bloque pas */ }
};

export const loadProducts = async (): Promise<void> => {
  if (!subscriptionsAvailable()) return;
  try {
    const { products } = await Subscriptions.getProducts({ ids: PRODUCT_IDS });
    // Annuel d'abord : c'est l'offre mise en avant.
    products.sort((a, b) => PRODUCT_IDS.indexOf(a.id) - PRODUCT_IDS.indexOf(b.id));
    patch({ products, error: products.length === 0 ? 'Les offres ne sont pas disponibles pour le moment.' : null });
  } catch (e) {
    patch({ error: e instanceof Error ? e.message : 'Les offres ne sont pas disponibles pour le moment.' });
  }
};

export const initSubscriptions = async (): Promise<void> => {
  if (!subscriptionsAvailable()) return;
  try {
    const { entitlements } = await Subscriptions.getEntitlements();
    patch({ entitlements, ready: true });
  } catch {
    patch({ ready: true });
  }
  void Subscriptions.addListener('entitlementsChanged', ({ entitlements }) => patch({ entitlements }));
  void loadProducts();
};

export type PurchaseOutcome = 'success' | 'cancelled' | 'pending' | 'error';

export const buy = async (id: string): Promise<PurchaseOutcome> => {
  patch({ busy: true, error: null });
  try {
    const r = await Subscriptions.purchase({ id });
    if (r.entitlements) patch({ entitlements: r.entitlements });
    return r.status === 'success' ? 'success' : r.status === 'pending' ? 'pending' : 'cancelled';
  } catch (e) {
    patch({ error: e instanceof Error ? e.message : 'Achat impossible pour le moment.' });
    return 'error';
  } finally {
    patch({ busy: false });
  }
};

export const restorePurchases = async (): Promise<number> => {
  patch({ busy: true, error: null });
  try {
    const { entitlements } = await Subscriptions.restore();
    patch({ entitlements });
    return entitlements.length;
  } catch (e) {
    patch({ error: e instanceof Error ? e.message : 'Restauration impossible pour le moment.' });
    return 0;
  } finally {
    patch({ busy: false });
  }
};

export const manageSubscription = (): Promise<void> => Subscriptions.manage().catch(() => undefined);

/** Fenêtre d'avis d'Apple. Rien n'est offert en échange (règle 5.6.1 de l'App Store). */
export const askForReview = (): Promise<void> => Subscriptions.requestReview().catch(() => undefined);

// ─── Libellés ───────────────────────────────────────────────────────────────

const UNIT_LABEL: Record<PeriodUnit, [string, string]> = {
  day: ['jour', 'jours'], week: ['semaine', 'semaines'], month: ['mois', 'mois'], year: ['an', 'ans'],
};

export const periodLabel = (p: { unit: PeriodUnit; value: number }): string => {
  const [one, many] = UNIT_LABEL[p.unit];
  return p.value === 1 ? one : `${p.value} ${many}`;
};

/** « 7 jours » pour l'essai gratuit de ce produit, ou null s'il n'y en a pas / déjà utilisé. */
export const freeTrialLabel = (p: SubscriptionProduct | undefined): string | null => {
  if (!p?.introOffer || p.introOffer.paymentMode !== 'freeTrial' || p.introEligible === false) return null;
  const { period, periodCount } = p.introOffer;
  const days = (period.unit === 'week' ? 7 : period.unit === 'month' ? 30 : period.unit === 'year' ? 365 : 1) * period.value * periodCount;
  return `${days} jours`;
};
