import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { webOrigin } from './appUrl';

// ─── Parrainage ─────────────────────────────────────────────────────────────
// Chaque compte a un code. Quand une personne crée son compte et saisit le code
// d'un parrain, le parrain gagne 1 mois de PPL Pro offert (6 mois au plus).
// Tout le calcul est côté serveur (supabase/migrations/20261008120000_…) :
// l'appli ne fait qu'afficher et envoyer. Un mois offert est un cadeau, pas un
// achat : il ne passe pas par Apple, et ne s'obtient jamais contre un avis.

export interface ReferralState {
  code: string;
  filleuls: number;
  /** Fin du Pro offert, en millisecondes, ou null s'il n'y en a pas (ou plus). */
  bonusUntil: number | null;
  aUnParrain: boolean;
}

const MESSAGES: Record<string, string> = {
  connexion_requise: 'Connecte-toi pour utiliser le parrainage.',
  compte_trop_ancien: 'Un code de parrainage ne s’utilise que dans les 7 jours qui suivent la création du compte.',
  code_invalide: 'Ce code n’existe pas. Vérifie-le avec la personne qui te l’a donné.',
  propre_code: 'C’est ton propre code. Donne-le à quelqu’un d’autre.',
  deja_utilise: 'Tu as déjà utilisé un code de parrainage.',
};
const NOT_DEPLOYED = /could not find the function|schema cache|does not exist/i;

const translate = (raw: string | undefined): string => {
  if (!raw) return 'Le parrainage ne répond pas. Réessaie dans un instant.';
  if (NOT_DEPLOYED.test(raw)) return 'Le parrainage n’est pas encore disponible sur ce serveur.';
  const key = Object.keys(MESSAGES).find((k) => raw.includes(k));
  return key ? MESSAGES[key] : 'Le parrainage ne répond pas. Réessaie dans un instant.';
};

export type Result<T> = { ok: true; data: T } | { ok: false; message: string };

export const isReferralAvailable = (): boolean => isSupabaseConfigured && supabase !== null;

/** « 3F9A0C21 » → « 3F9A-0C21 », lisible à voix haute. */
export const formatReferralCode = (code: string): string => code.replace(/(.{4})(?=.)/g, '$1-');

/** Lien à envoyer : ouvre le site, qui reconnaît le code (voir readReferralCodeFromUrl). */
export const referralLink = (code: string): string => `${webOrigin()}/?parrain=${code}`;

/** Message prêt à partager. */
export const referralShareText = (code: string): string =>
  `Je m’entraîne avec PPL Tracker. Crée ton compte avec mon code ${formatReferralCode(code)} (ou ce lien) : ${referralLink(code)}`;

const CODE_PATTERN = /^[0-9A-F]{8}$/;

export const normalizeReferralCode = (raw: string): string | null => {
  const code = raw.toUpperCase().replace(/[^0-9A-F]/g, '');
  return CODE_PATTERN.test(code) ? code : null;
};

// Le code arrive par le lien (?parrain=…), puis la personne crée son compte : on le
// garde en mémoire locale jusqu'à ce qu'elle soit connectée, puis on l'utilise.
const PENDING_KEY = 'ppl-referral-pending';

export const readReferralCodeFromUrl = (): string | null => {
  const raw = new URLSearchParams(window.location.search).get('parrain');
  return raw ? normalizeReferralCode(raw) : null;
};

export const rememberPendingReferral = (code: string): void => {
  try { localStorage.setItem(PENDING_KEY, code); } catch { /* le code devra être ressaisi */ }
};
export const getPendingReferral = (): string | null => {
  try { return localStorage.getItem(PENDING_KEY); } catch { return null; }
};
export const clearPendingReferral = (): void => {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* rien à effacer */ }
};

/** Retire `?parrain=` de la barre d'adresse : un rechargement ne doit pas réutiliser le code. */
export const clearReferralCodeFromUrl = (): void => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('parrain')) return;
  url.searchParams.delete('parrain');
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
};

const rpc = async <T>(fn: string, args?: Record<string, unknown>): Promise<Result<T>> => {
  if (!supabase) return { ok: false, message: 'Le parrainage n’est pas disponible : compte non configuré.' };
  try {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) return { ok: false, message: translate(error.message) };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, message: translate(undefined) };
  }
};

interface RawState { code: string; filleuls: number; bonus_until: string | null; a_un_parrain: boolean }

export const fetchReferralState = async (): Promise<Result<ReferralState>> => {
  const r = await rpc<RawState>('referral_state');
  if (!r.ok) return r;
  return {
    ok: true,
    data: {
      code: r.data.code,
      filleuls: Number(r.data.filleuls) || 0,
      bonusUntil: r.data.bonus_until ? new Date(r.data.bonus_until).getTime() : null,
      aUnParrain: !!r.data.a_un_parrain,
    },
  };
};

export const claimReferralCode = (code: string): Promise<Result<{ ok: true }>> =>
  rpc<{ ok: true }>('referral_claim', { p_code: code });

// ─── État partagé ───────────────────────────────────────────────────────────
// Lu par l'écran PPL Pro et les widgets : un mini-store non persisté (l'état
// appartient au serveur, comme pour le binôme).
interface ReferralStore { state: ReferralState | null; loading: boolean; error: string | null }
export const useReferralStore = create<ReferralStore>(() => ({ state: null, loading: false, error: null }));

export const refreshReferral = async (): Promise<void> => {
  if (!isReferralAvailable()) return;
  useReferralStore.setState({ loading: true });
  const r = await fetchReferralState();
  useReferralStore.setState(r.ok ? { state: r.data, loading: false, error: null } : { loading: false, error: r.message });
};

export const clearReferralState = (): void => useReferralStore.setState({ state: null, error: null });

/** Utilise le code gardé en attente, une seule fois, quand la personne est connectée. */
export const applyPendingReferral = async (): Promise<Result<true> | null> => {
  const code = getPendingReferral();
  if (!code) return null;
  const r = await claimReferralCode(code);
  // Code consommé, refusé ou déjà utilisé : dans tous les cas on ne le rejoue pas.
  clearPendingReferral();
  await refreshReferral();
  return r.ok ? { ok: true, data: true } : r;
};
