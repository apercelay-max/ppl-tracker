// ─── binome-nudge : « mets-lui un coup de pied » ───────────────────────────
//
// Fonction Edge Supabase (Deno). Déploiement :
//   supabase functions deploy binome-nudge
//
// DEUX ÉTAPES, ET POURQUOI DANS CET ORDRE :
//
//   1. La relance est enregistrée EN TANT QUE L'UTILISATEUR, via la fonction
//      SQL `binome_send_nudge`. C'est elle qui vérifie l'appartenance au
//      binôme et la limite d'une relance toutes les 6 heures. Cette fonction
//      Edge ne peut donc pas servir à contourner ces règles : elle n'a pas son
//      mot à dire dessus.
//
//   2. Seulement si c'est accepté, la notification part, avec la clé serveur :
//      c'est la seule façon de lire les abonnements push du PARTENAIRE, que
//      l'utilisateur n'a évidemment pas le droit de voir.
//
// SANS NOTIFICATION, LA RELANCE N'EST PAS PERDUE. Si le partenaire n'a pas
// activé les notifications, ou si les clés VAPID ne sont pas configurées, la
// relance reste en base et s'affiche dans l'app à sa prochaine ouverture.
//
// SECRETS À DÉFINIR (Supabase → Edge Functions → Secrets) :
//   VAPID_PUBLIC_KEY   la clé publique déjà utilisée côté app (SettingsScreen)
//   VAPID_PRIVATE_KEY  la clé privée qui va avec
//   VAPID_SUBJECT      mailto: de contact, exigé par le protocole Web Push
// SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont fournis
// d'office par Supabase. La fonction existante `recovery-push-check` envoie
// déjà des notifications : si ses secrets VAPID portent d'autres noms, soit on
// les recopie sous ces noms, soit on adapte les trois lignes plus bas.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

// L'app appelle cette fonction depuis le navigateur : il faut répondre au
// pré-vol CORS, sinon l'appel échoue avant même d'arriver ici.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const reply = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

interface NudgeResult {
  ok: boolean;
  raison?: string;
  prochain?: string;
  nudge_id?: number;
  from_name?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reply(405, { ok: false, raison: 'methode_non_autorisee' });

  const authorization = req.headers.get('Authorization');
  if (!authorization) return reply(401, { ok: false, raison: 'connexion_requise' });

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return reply(500, { ok: false, raison: 'configuration_serveur' });

  // ── 1. Enregistrer la relance en tant que l'utilisateur ──
  const asUser = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data, error } = await asUser.rpc('binome_send_nudge');
  if (error) return reply(400, { ok: false, raison: error.message });

  const result = data as NudgeResult;
  if (!result?.ok || !result.nudge_id) return reply(200, result);

  // La réponse à l'app ne contient ni l'identifiant de la relance ni rien du
  // partenaire : elle n'en a pas besoin.
  const forApp = { ok: true, from_name: result.from_name };

  // ── 2. Envoyer la notification ──
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const subject = Deno.env.get('VAPID_SUBJECT');
  if (!publicKey || !privateKey || !subject) return reply(200, { ...forApp, push: 'non_configure' });

  webpush.setVapidDetails(subject, publicKey, privateKey);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: nudge } = await admin
    .from('binome_nudges')
    .select('to_user')
    .eq('id', result.nudge_id)
    .single();
  if (!nudge) return reply(200, { ...forApp, push: 'aucun_abonnement' });

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', nudge.to_user);

  // Format lu par le service worker (public/sw.js, écouteur « push »).
  const payload = JSON.stringify({
    title: 'PPL Tracker',
    body: `${result.from_name ?? 'Ton binôme'} te met un coup de pied. C'est l'heure d'aller à la salle.`,
    url: '/',
  });

  let sent = 0;
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
        // 6 heures : au-delà, la relance suivante est de toute façon possible,
        // et une notification de la veille ne relance plus personne.
        { TTL: 6 * 60 * 60, urgency: 'high' },
      );
      sent++;
    } catch (e) {
      // 404 / 410 : l'abonnement n'existe plus (app désinstallée, permission
      // retirée). On le supprime pour ne pas réessayer à chaque relance.
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) {
        await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      }
    }
  }

  return reply(200, { ...forApp, push: sent > 0 ? 'envoye' : 'aucun_abonnement' });
});
