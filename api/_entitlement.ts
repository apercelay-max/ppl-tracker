// ─── Contrôle d'abonnement côté serveur ────────────────────────────────────
//
// POURQUOI CE FICHIER EXISTE : le paywall de l'interface (hooks/useEntitlement)
// ne protège rien. Il masque des boutons, et n'importe qui ouvre les outils de
// développement et remet la valeur qu'il veut. Tant que la vérification n'est
// pas ICI, « 1 requête coach par mois » est une suggestion, pas une limite —
// et c'est nous qui payons les appels Gemini.
//
// Le préfixe `_` du nom de fichier n'est pas décoratif : Vercel ne crée pas de
// route pour les fichiers de `api/` qui commencent par un underscore. Ce
// module est donc importable par api/coach.ts sans être exposé sur le web.
//
// ÉTEINT PAR DÉFAUT. Tant que la variable d'environnement `PAYWALL_ENFORCE`
// ne vaut pas `1`, tout passe exactement comme avant : aucune authentification
// exigée, aucun compteur, aucune régression possible. C'est volontaire —
// aujourd'hui il n'y a pas de paiement, donc il n'y a rien à faire respecter.
//
// AUCUNE DÉPENDANCE npm : `npm install` échoue dans ce dépôt (xlsx se
// télécharge depuis cdn.sheetjs.com), donc pas de @supabase/supabase-js ici.
// On parle à Supabase par son API REST, avec `fetch`, comme api/coach.ts parle
// à Google.

import { ENTITLEMENTS, type Tier } from '../src/lib/entitlements';

const env = (key: string): string | undefined =>
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[key];

/** Le contrôle ne s'applique que si on l'a explicitement demandé. */
export const enforcementOn = (): boolean => env('PAYWALL_ENFORCE') === '1';

/** Clé `service_role` : elle contourne les politiques RLS, donc elle ne doit
 *  JAMAIS être préfixée `VITE_` (Vite inline ces variables dans le bundle
 *  client — ce serait publier un passe-partout sur la base entière). */
const adminHeaders = (): Record<string, string> => {
  const key = env('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
};

export type GateResult =
  | { ok: true; tier: Tier; userId: string | null; enforced: boolean }
  | { ok: false; status: number; code: 'CONNEXION_REQUISE' | 'QUOTA_ABONNEMENT'; message: string };

/** Mois courant au format `2026-09`, la granularité du compteur. */
const currentPeriod = (): string => new Date().toISOString().slice(0, 7);

/**
 * Qui appelle ? On demande à Supabase de valider le jeton plutôt que de le
 * décoder nous-mêmes : vérifier une signature JWT à la main sans bibliothèque,
 * c'est exactement le genre de code où une erreur passe inaperçue et laisse
 * entrer n'importe quel jeton fabriqué.
 */
const resolveUserId = async (authHeader: string | undefined): Promise<string | null> => {
  const token = (authHeader ?? '').replace(/^Bearer\s+/i, '').trim();
  const url = env('SUPABASE_URL');
  if (!token || !url) return null;

  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: env('SUPABASE_ANON_KEY') ?? '' },
    });
    if (!r.ok) return null;
    const user = (await r.json()) as { id?: unknown };
    return typeof user.id === 'string' ? user.id : null;
  } catch {
    return null;
  }
};

/** Palier payé par cet utilisateur. Absence de ligne = `free` : on ne donne
 *  jamais un palier par défaut généreux en cas de doute. */
const resolveTier = async (userId: string): Promise<Tier> => {
  const url = env('SUPABASE_URL');
  if (!url) return 'free';

  try {
    const r = await fetch(
      `${url}/rest/v1/subscriptions?user_id=eq.${userId}&select=tier,status,current_period_end`,
      { headers: adminHeaders() },
    );
    if (!r.ok) return 'free';
    const rows = (await r.json()) as { tier?: string; status?: string; current_period_end?: string }[];
    const row = rows[0];
    if (!row) return 'free';

    // `active` couvre aussi la période déjà payée d'un abonnement résilié :
    // quelqu'un qui a annulé garde ce qu'il a payé jusqu'au bout.
    const live = row.status === 'active' || row.status === 'trialing';
    const notExpired = !row.current_period_end || new Date(row.current_period_end).getTime() > Date.now();
    if (!live || !notExpired) return 'free';

    return row.tier === 'pro' || row.tier === 'max' ? row.tier : 'free';
  } catch {
    return 'free';
  }
};

/** Nombre de requêtes coach déjà consommées ce mois-ci. */
const usedThisMonth = async (userId: string): Promise<number> => {
  const url = env('SUPABASE_URL');
  if (!url) return 0;

  try {
    const r = await fetch(
      `${url}/rest/v1/coach_usage?user_id=eq.${userId}&period=eq.${currentPeriod()}&select=count`,
      { headers: adminHeaders() },
    );
    if (!r.ok) return 0;
    const rows = (await r.json()) as { count?: number }[];
    return typeof rows[0]?.count === 'number' ? rows[0].count : 0;
  } catch {
    return 0;
  }
};

/**
 * Cet appel au coach IA est-il autorisé ?
 *
 * `usesOwnKey` : quand l'utilisateur a saisi SA clé Gemini dans l'écran Coach,
 * c'est lui qui paie les appels. Lui compter un quota n'aurait aucun sens — on
 * le laisse passer quel que soit son palier.
 */
export const checkCoachAccess = async (
  authHeader: string | undefined,
  usesOwnKey: boolean,
): Promise<GateResult> => {
  if (!enforcementOn()) return { ok: true, tier: 'max', userId: null, enforced: false };

  const userId = await resolveUserId(authHeader);
  if (!userId) {
    return {
      ok: false,
      status: 401,
      code: 'CONNEXION_REQUISE',
      message: 'Connecte-toi pour utiliser le coach IA. Le coach local reste disponible sans compte.',
    };
  }

  const tier = await resolveTier(userId);
  if (usesOwnKey) return { ok: true, tier, userId, enforced: true };

  const allowed = ENTITLEMENTS[tier].coachAiPerMonth;
  const used = await usedThisMonth(userId);
  if (used >= allowed) {
    return {
      ok: false,
      status: 402,
      code: 'QUOTA_ABONNEMENT',
      message:
        tier === 'max'
          ? 'Beaucoup de demandes ce mois-ci. Réessaie un peu plus tard — le coach local reste disponible.'
          : 'Tu as utilisé tes demandes au coach IA de ce mois. Le coach local reste disponible, et Max donne un accès illimité.',
    };
  }

  return { ok: true, tier, userId, enforced: true };
};

/**
 * Décompte une requête, APRÈS une réponse réussie. Jamais avant : un appel qui
 * échoue (Google injoignable, réponse illisible) ne doit pas coûter son quota
 * à l'utilisateur.
 *
 * Ne lève jamais. Si le compteur tombe en panne, on préfère offrir une requête
 * que casser une réponse déjà payée et déjà obtenue.
 */
export const recordCoachUse = async (userId: string | null): Promise<void> => {
  const url = env('SUPABASE_URL');
  if (!userId || !url) return;

  try {
    // `increment_coach_usage` est une fonction SQL : l'incrément se fait en une
    // seule instruction côté base. Le faire en lire-puis-écrire depuis ici
    // perdrait des requêtes quand deux appels arrivent en même temps.
    await fetch(`${url}/rest/v1/rpc/increment_coach_usage`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ p_user_id: userId, p_period: currentPeriod() }),
    });
  } catch {
    /* compteur indisponible : on laisse passer, voir ci-dessus */
  }
};
