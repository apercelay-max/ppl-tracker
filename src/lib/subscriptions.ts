import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { create } from 'zustand';

// ─── Abonnements PPL Pro (iOS uniquement) ───────────────────────────────────
// Les achats passent obligatoirement par Apple (achats intégrés) : sur le web
// (navigateur, PWA) il n'y a ni boutique ni prix, et `isPro` reste faux.
// Plugin natif : ios/App/App/SubscriptionsPlugin.swift (StoreKit 2).

// Mêmes identifiants que dans App Store Connect et ios/App/PPLTracker.storekit.
// Basés sur l'identifiant provisoire de l'appli : à confirmer avec l'adulte
// responsable du compte Apple Developer avant de créer les produits.
export const PRODUCT_YEARLY = 'com.ppltracker.app.pro.yearly';
export const PRODUCT_MONTHLY = 'com.ppltracker.app.pro.monthly';
export const PRODUCT_IDS = [PRODUCT_YEARLY, PRODUCT_MONTHLY];

/**
 * Offre de lancement : les 50 premiers abonnés paient moitié prix, et le gardent.
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
  regularPrice: { [PRODUCT_YEARLY]: '14,99 €', [PRODUCT_MONTHLY]: '1,99 €' } as Record<string, string>,
};

// Textes montrés sur l'écran d'offre. À garder alignés avec ce que Pro verrouille
// réellement : on ne promet pas ce qui est déjà gratuit.
export const PRO_BENEFITS: { icon: string; title: string; text: string }[] = [
  { icon: '🤖', title: 'Coach IA sans limite', text: 'Résumé du jour et conseils personnalisés à chaque séance.' },
  { icon: '📱', title: 'Widgets et écran verrouillé', text: 'Prochaine séance, série, record, minuteur de repos.' },
  { icon: '👥', title: 'Binôme', text: 'Suivez vos semaines côte à côte et relancez-vous.' },
  { icon: '📊', title: 'Stats avancées', text: 'Récupération musculaire, charge d\'entraînement, records.' },
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

/** Vrai tant qu'un abonnement (essai gratuit compris) est actif. */
export const useIsPro = (): boolean => useSubscriptionStore((s) => s.entitlements.length > 0);

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
