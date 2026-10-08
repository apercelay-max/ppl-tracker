// ─── Binôme — côté client ──────────────────────────────────────────────────
//
// Enveloppe typée autour des fonctions SQL de
// supabase/migrations/20260913120000_binome.sql. L'app ne lit ni n'écrit
// JAMAIS les tables du binôme directement — elles sont fermées côté base —
// elle ne fait qu'appeler ces fonctions, qui vérifient elles-mêmes qui a le
// droit de voir quoi.
//
// Chaque appel renvoie un `Result` plutôt que de lever : un binôme est une
// fonctionnalité secondaire, et une erreur réseau ne doit jamais faire tomber
// l'accueil ou les réglages.

import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { webOrigin } from './appUrl';

export type Result<T> = { ok: true; data: T } | { ok: false; message: string };

export interface BinomeMember {
  nom: string;
  objectif: number;
  /** Séances terminées sur les 7 derniers jours. */
  semaine: number;
}

export interface BinomePartner extends BinomeMember {
  /** ISO. Null tant que le partenaire n'a déclaré aucune séance. */
  derniere_seance: string | null;
}

export type BinomeState =
  | { connecte: false }
  | { connecte: true; en_binome: false; invitation: { code: string; expires_at: string } | null }
  | {
      connecte: true;
      en_binome: true;
      depuis: string;
      moi: BinomeMember;
      /** Null quand le partenaire a supprimé son compte. */
      partenaire: BinomePartner | null;
      relances_recues: number;
      ma_derniere_relance: string | null;
    };

// ─── Messages ──────────────────────────────────────────────────────────────
//
// Les fonctions SQL lèvent des mots stables (« code_expire »). On les traduit
// ici, en un seul endroit, avec ce qui s'est passé ET quoi faire.

const MESSAGES: Record<string, string> = {
  connexion_requise: 'Connecte-toi pour utiliser le binôme.',
  nom_invalide: 'Ton prénom doit faire entre 1 et 40 caractères.',
  deja_en_binome: 'Tu es déjà en binôme. Quitte-le d’abord pour en former un autre.',
  code_invalide: 'Ce code d’invitation n’existe pas. Vérifie-le, ou demande un nouveau lien.',
  code_deja_utilise: 'Ce lien a déjà servi. Demande un nouveau lien à ton binôme.',
  code_expire: 'Ce lien a expiré (7 jours). Demande un nouveau lien à ton binôme.',
  propre_invitation: 'C’est ton propre lien. Envoie-le à la personne avec qui tu veux t’entraîner.',
  binome_deja_forme: 'Cette personne vient de rejoindre un autre binôme.',
  pas_de_binome: 'Tu n’es pas en binôme.',
  date_invalide: 'Séance trop ancienne pour être partagée.',
};

/** Tables absentes : la migration n’a pas encore été passée dans Supabase. */
const NOT_DEPLOYED = /could not find the function|schema cache|does not exist/i;

const translate = (raw: string | undefined): string => {
  if (!raw) return 'Le binôme ne répond pas. Réessaie dans un instant.';
  if (NOT_DEPLOYED.test(raw)) return 'Le binôme n’est pas encore disponible sur ce serveur.';
  const key = Object.keys(MESSAGES).find((k) => raw.includes(k));
  return key ? MESSAGES[key] : 'Le binôme ne répond pas. Réessaie dans un instant.';
};

// ─── Utilitaires ───────────────────────────────────────────────────────────

export const isBinomeAvailable = (): boolean => isSupabaseConfigured && supabase !== null;

/** « 3F9A0C21B7E4 » → « 3F9A-0C21-B7E4 », lisible à voix haute ou à recopier. */
export const formatCode = (code: string): string => code.replace(/(.{4})(?=.)/g, '$1-');

export const inviteLink = (code: string): string => `${webOrigin()}/?binome=${code}`;

/** Code d'invitation présent dans l'URL d'ouverture, sinon null. */
export const readInviteCodeFromUrl = (): string | null => {
  const raw = new URLSearchParams(window.location.search).get('binome');
  const code = (raw ?? '').toUpperCase().replace(/[^0-9A-F]/g, '');
  return code.length === 12 ? code : null;
};

/** Retire `?binome=` de la barre d'adresse sans recharger la page : sinon un
 *  rechargement relancerait l'acceptation d'un code déjà utilisé. */
export const clearInviteCodeFromUrl = (): void => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('binome')) return;
  url.searchParams.delete('binome');
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
};

const rpc = async <T>(fn: string, args?: Record<string, unknown>): Promise<Result<T>> => {
  if (!supabase) return { ok: false, message: 'Le binôme n’est pas disponible : compte non configuré.' };
  try {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) return { ok: false, message: translate(error.message) };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, message: translate(undefined) };
  }
};

// ─── Appels ────────────────────────────────────────────────────────────────

export const fetchBinomeState = (): Promise<Result<BinomeState>> => rpc<BinomeState>('binome_state');

export const createInvite = (name: string, weeklyGoal: number) =>
  rpc<{ code: string; expires_at: string }>('binome_create_invite', {
    p_display_name: name,
    p_weekly_goal: weeklyGoal,
  });

export const acceptInvite = (code: string, name: string, weeklyGoal: number) =>
  rpc<{ binome_id: string; partner_name: string }>('binome_accept_invite', {
    p_code: code,
    p_display_name: name,
    p_weekly_goal: weeklyGoal,
  });

/** Qui a envoyé cette invitation. Null quand le code n'est pas (ou plus)
 *  valable — le serveur ne dit pas pourquoi, exprès. */
export const previewInvite = (code: string) =>
  rpc<{ inviteur: string } | null>('binome_invite_preview', { p_code: code });

export const leaveBinome = () => rpc<null>('binome_leave');

export const markNudgesSeen = () => rpc<null>('binome_mark_nudges_seen');

export interface SessionToShare {
  /** Identifiant de l'entrée d'historique : garantit qu'on ne compte jamais deux fois. */
  id: string;
  /** Début de la séance, en ms. */
  date: number;
  durationMs: number;
  tonnage?: number;
  dayName: string;
}

/** Vrai quand la séance a été ajoutée, faux quand on n'est pas en binôme ou
 *  qu'elle l'était déjà. */
export const logSession = (s: SessionToShare) =>
  rpc<boolean>('binome_log_session', {
    p_session_key: s.id,
    p_done_at: new Date(s.date).toISOString(),
    p_day_name: s.dayName,
    p_duration_min: Math.round(s.durationMs / 60000),
    p_tonnage_kg: typeof s.tonnage === 'number' ? Math.round(s.tonnage) : null,
  });

export type NudgeOutcome =
  | { sent: true; push: 'envoye' | 'aucun_abonnement' | 'non_configure' | 'fonction_absente' }
  | { sent: false; nextAllowedAt: string };

/**
 * Relancer son binôme.
 *
 * Passe par la fonction Edge `binome-nudge`, qui enregistre la relance ET
 * envoie la notification. Si la fonction n'est pas encore déployée, on se
 * rabat sur la fonction SQL seule : la relance est enregistrée et apparaîtra
 * dans l'app du partenaire, simplement sans notification.
 *
 * On ne se rabat QUE si la fonction est injoignable. Si elle a répondu par une
 * erreur, la relance a peut-être déjà été enregistrée : réessayer en SQL
 * tomberait sur la limite des 6 heures et afficherait un message faux.
 */
export const sendNudge = async (): Promise<Result<NudgeOutcome>> => {
  if (!supabase) return { ok: false, message: 'Le binôme n’est pas disponible : compte non configuré.' };

  type Body = { ok: boolean; raison?: string; prochain?: string; push?: NudgeOutcome extends { push: infer P } ? P : never };
  const interpret = (b: Body | null): Result<NudgeOutcome> => {
    if (!b) return { ok: false, message: translate(undefined) };
    if (b.ok) return { ok: true, data: { sent: true, push: b.push ?? 'aucun_abonnement' } };
    if (b.raison === 'trop_tot' && b.prochain) return { ok: true, data: { sent: false, nextAllowedAt: b.prochain } };
    return { ok: false, message: translate(b.raison) };
  };

  try {
    const { data, error } = await supabase.functions.invoke<Body>('binome-nudge', { body: {} });
    if (!error) return interpret(data);

    const status = (error as { context?: { status?: number } }).context?.status;
    const unreachable =
      error instanceof FunctionsFetchError ||
      ((error instanceof FunctionsRelayError || error instanceof FunctionsHttpError) && status === 404);

    if (!unreachable) {
      try {
        const body = await (error as { context: Response }).context.json();
        return interpret(body as Body);
      } catch {
        return { ok: false, message: translate(undefined) };
      }
    }
  } catch {
    /* fonction injoignable : repli ci-dessous */
  }

  const fallback = await rpc<Body>('binome_send_nudge');
  if (!fallback.ok) return fallback;
  const r = interpret(fallback.data);
  return r.ok && r.data.sent ? { ok: true, data: { sent: true, push: 'fonction_absente' } } : r;
};
