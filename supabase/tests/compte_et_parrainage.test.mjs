import { PGlite } from '@electric-sql/pglite';
// Test de la migration 20261008120000_compte_et_parrainage.sql sur une vraie base PostgreSQL
// embarquée (PGlite), avec un décor minimal de Supabase (rôles, auth.users, auth.uid()).
// Lancer :  npm install --no-save @electric-sql/pglite && node supabase/tests/compte_et_parrainage.test.mjs
// À relancer à chaque modification de la migration.
import { readFileSync } from 'node:fs';

const db = new PGlite();
const sql = readFileSync(new URL('../migrations/20261008120000_compte_et_parrainage.sql', import.meta.url), 'utf8');

// Décor minimal de Supabase : rôles, schéma auth, auth.uid(), deux tables de l'appli.
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now());
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table public.app_data (user_id uuid primary key references auth.users(id) on delete cascade, data jsonb);
  create table public.push_subscriptions (user_id uuid references auth.users(id) on delete cascade, endpoint text);
  grant usage on schema public, auth to anon, authenticated;
`);
await db.exec(sql);
console.log('migration appliquée sans erreur');

let ok = 0, ko = 0;
const check = (name, cond, extra='') => { if (cond) { ok++; console.log('  ✓', name); } else { ko++; console.log('  ✗', name, extra); } };
const as = async (uid) => { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false); set role authenticated;`); };
const q = async (text) => (await db.query(text)).rows;
const fails = async (text, word) => { try { await db.query(text); return false; } catch (e) { return String(e.message).includes(word) ? true : (console.log('   message:', e.message), false); } };

await db.exec('reset role');
const mk = async (ageDays = 0) => (await q(`insert into auth.users (created_at) values (now() - interval '${ageDays} days') returning id`))[0].id;
const A = await mk(40), B = await mk(), C = await mk(), OLD = await mk(30);

console.log('Code de parrainage');
await as(A);
const codeA = (await q('select public.referral_my_code() as c'))[0].c;
check('code à 8 caractères hexadécimaux', /^[0-9A-F]{8}$/.test(codeA), codeA);
check('même code à chaque appel', (await q('select public.referral_my_code() as c'))[0].c === codeA);

console.log('Utilisation du code');
await as(B);
check('un nouveau compte peut utiliser le code', (await q(`select public.referral_claim('${codeA.toLowerCase()}') as r`))[0].r.ok === true);
check('deuxième utilisation refusée', await fails(`select public.referral_claim('${codeA}')`, 'deja_utilise'));
await as(C);
const codeC = (await q('select public.referral_my_code() as c'))[0].c;
check('on ne peut pas utiliser son propre code', await fails(`select public.referral_claim('${codeC}')`, 'propre_code'));
check('code inexistant refusé', await fails(`select public.referral_claim('ZZZZZZZZ')`, 'code_invalide'));
await as(OLD);
check('compte de plus de 7 jours refusé', await fails(`select public.referral_claim('${codeA}')`, 'compte_trop_ancien'));
await as(null);
check('sans connexion : refusé', await fails(`select public.referral_state()`, 'connexion_requise'));

console.log('Le parrain gagne un mois');
await as(A);
let st = (await q('select public.referral_state() as s'))[0].s;
check('1 filleul', st.filleuls === 1, JSON.stringify(st));
const days = (new Date(st.bonus_until) - Date.now()) / 86400000;
check('environ 30 jours offerts', days > 29 && days < 31, String(days));
check('pas de parrain pour A', st.a_un_parrain === false);
await as(B);
st = (await q('select public.referral_state() as s'))[0].s;
check('B sait qu\'il a un parrain', st.a_un_parrain === true);

console.log('Plafond de 6 mois');
await db.exec('reset role');
for (let i = 0; i < 7; i++) {
  const u = await mk(); await as(u);
  await q(`select public.referral_claim('${codeA}')`);
  await db.exec('reset role');
}
await as(A);
st = (await q('select public.referral_state() as s'))[0].s;
const days2 = (new Date(st.bonus_until) - Date.now()) / 86400000;
check('8 filleuls comptés', st.filleuls === 8, String(st.filleuls));
check('bonus plafonné à ~6 mois (180 j)', days2 > 179 && days2 < 181, days2.toFixed(1));

console.log('Les tables sont fermées');
await as(B);
check('lecture directe de referral_claims refusée', await fails('select * from public.referral_claims', 'permission denied'));
check('lecture directe de referral_bonus refusée', await fails('select * from public.referral_bonus', 'permission denied'));
await db.exec(`reset role; set role anon;`);
check('anonyme : fonctions refusées', await fails('select public.referral_state()', 'permission denied'));
check('anonyme : suppression de compte refusée', await fails('select public.delete_my_account()', 'permission denied'));

console.log('Suppression de compte');
await db.exec('reset role');
await db.exec(`insert into public.app_data values ('${B}', '{}'), ('${C}', '{}'); insert into public.push_subscriptions values ('${B}', 'x');`);
await as(B);
await q('select public.delete_my_account()');
await db.exec('reset role');
check('le compte n\'existe plus', (await q(`select count(*)::int n from auth.users where id='${B}'`))[0].n === 0);
check('ses données cloud sont effacées', (await q(`select count(*)::int n from public.app_data where user_id='${B}'`))[0].n === 0);
check('ses abonnements push sont effacés', (await q(`select count(*)::int n from public.push_subscriptions where user_id='${B}'`))[0].n === 0);
check('son parrainage est effacé', (await q(`select count(*)::int n from public.referral_claims where invitee='${B}'`))[0].n === 0);
check('les données des autres sont intactes', (await q(`select count(*)::int n from public.app_data where user_id='${C}'`))[0].n === 1);
await as(null);
check('sans connexion : suppression refusée', await fails('select public.delete_my_account()', 'connexion_requise'));
await as(A);
await q('select public.delete_my_account()');
await db.exec('reset role');
check('suppression du parrain : ses codes et bonus partent aussi', (await q(`select (select count(*) from public.referral_codes where user_id='${A}')::int + (select count(*) from public.referral_bonus where user_id='${A}')::int as n`))[0].n === 0);

console.log(`\n${ok} réussis, ${ko} échoués`);
process.exit(ko ? 1 : 0);
