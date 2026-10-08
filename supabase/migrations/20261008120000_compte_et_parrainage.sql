-- ─── Suppression de compte + parrainage ────────────────────────────────────
--
-- À exécuter dans Supabase → SQL Editor (ou `supabase db push`), PAR L'ADULTE
-- RESPONSABLE DU COMPTE SUPABASE. Rien dans l'appli actuelle n'en dépend :
-- tant que ce fichier n'a pas été passé, l'appli répond « pas encore
-- disponible » au lieu de planter.
--
-- 1. delete_my_account() — exigé par Apple (règle 5.1.1(v)) : toute appli qui
--    permet de créer un compte doit permettre de le supprimer depuis l'appli.
--    Efface les données du cloud puis le compte lui-même. Les données stockées
--    sur le téléphone ne sont pas touchées (elles ne quittent jamais l'appareil
--    sans synchronisation) : l'appli le dit à l'utilisateur.
--
-- 2. Parrainage — chaque compte a un code. Quand une personne crée son compte
--    et saisit le code d'un parrain, le parrain gagne 1 mois de PPL Pro offert
--    (cumulable, 6 mois au plus). Comme pour le binôme, les tables sont
--    FERMÉES (RLS sans politique, droits retirés) : tout passe par les
--    fonctions ci-dessous, qui vérifient elles-mêmes qui a le droit de quoi.
--
-- Pourquoi ça ne triche pas avec Apple : le mois offert n'est pas un achat
-- intégré, c'est un cadeau de notre part qui débloque les mêmes fonctions.
-- Il ne remplace aucun paiement et ne s'obtient pas en échange d'un avis.

-- ── Suppression de compte ─────────────────────────────────────────────────

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'connexion_requise';
  end if;

  -- Tables de l'appli créées hors de ce dépôt : on ne les vide que si elles
  -- existent (to_regclass renvoie null sinon), pour que la fonction marche
  -- quel que soit l'état du projet.
  if to_regclass('public.app_data') is not null then
    execute 'delete from public.app_data where user_id = $1' using uid;
  end if;
  if to_regclass('public.push_subscriptions') is not null then
    execute 'delete from public.push_subscriptions where user_id = $1' using uid;
  end if;

  -- Le binôme, ses séances partagées, les relances et le parrainage partent
  -- avec le compte : toutes ces tables ont `on delete cascade` vers auth.users.
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ── Parrainage : tables ───────────────────────────────────────────────────

create table if not exists public.referral_codes (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  code       text not null unique check (code ~ '^[0-9A-F]{8}$'),
  created_at timestamptz not null default now()
);

-- Une ligne par filleul : la clé primaire est `invitee`, donc UN SEUL parrain
-- par compte, par construction. Impossible de réclamer deux fois.
create table if not exists public.referral_claims (
  invitee    uuid primary key references auth.users (id) on delete cascade,
  inviter    uuid not null references auth.users (id) on delete cascade,
  claimed_at timestamptz not null default now(),
  check (invitee <> inviter)
);
create index if not exists referral_claims_inviter_idx on public.referral_claims (inviter);

-- Fin du Pro offert de chaque parrain. Une ligne, mise à jour à chaque filleul.
create table if not exists public.referral_bonus (
  user_id uuid primary key references auth.users (id) on delete cascade,
  until   timestamptz not null
);

alter table public.referral_codes enable row level security;
alter table public.referral_claims enable row level security;
alter table public.referral_bonus enable row level security;
revoke all on public.referral_codes, public.referral_claims, public.referral_bonus from anon, authenticated;

-- ── Parrainage : fonctions ────────────────────────────────────────────────

-- Mon code (créé la première fois). 8 caractères hexadécimaux en majuscules.
create or replace function public.referral_my_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  c text;
begin
  if uid is null then raise exception 'connexion_requise'; end if;
  select code into c from public.referral_codes where user_id = uid;
  if c is not null then return c; end if;
  loop
    c := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      insert into public.referral_codes (user_id, code) values (uid, c);
      return c;
    exception when unique_violation then
      -- Soit quelqu'un a pris ce code à l'instant, soit mon propre code vient d'être créé par un autre appel.
      select code into c from public.referral_codes where user_id = uid;
      if c is not null then return c; end if;
    end;
  end loop;
end;
$$;

-- Utiliser le code d'un parrain. Conditions : compte créé il y a moins de
-- 7 jours (le parrainage sert à faire venir de NOUVELLES personnes), jamais
-- son propre code, une seule fois par compte. Le parrain gagne 30 jours,
-- dans la limite de 6 filleuls (6 mois).
create or replace function public.referral_claim(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  parrain uuid;
  created timestamptz;
  n int;
begin
  if uid is null then raise exception 'connexion_requise'; end if;

  select created_at into created from auth.users where id = uid;
  if created is null or created < now() - interval '7 days' then
    raise exception 'compte_trop_ancien';
  end if;

  select user_id into parrain from public.referral_codes where code = upper(btrim(p_code));
  if parrain is null then raise exception 'code_invalide'; end if;
  if parrain = uid then raise exception 'propre_code'; end if;

  begin
    insert into public.referral_claims (invitee, inviter) values (uid, parrain);
  exception when unique_violation then
    raise exception 'deja_utilise';
  end;

  select count(*) into n from public.referral_claims where inviter = parrain;
  if n <= 6 then
    insert into public.referral_bonus (user_id, until)
    values (parrain, now() + interval '30 days')
    on conflict (user_id) do update
      set until = greatest(public.referral_bonus.until, now()) + interval '30 days';
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- Ce que l'appli affiche : mon code, combien de personnes ont rejoint grâce à
-- moi, jusqu'à quand mon Pro est offert, et si j'ai moi-même utilisé un code.
create or replace function public.referral_state()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  b timestamptz;
begin
  if uid is null then raise exception 'connexion_requise'; end if;
  select until into b from public.referral_bonus where user_id = uid;
  return jsonb_build_object(
    'code', public.referral_my_code(),
    'filleuls', (select count(*) from public.referral_claims where inviter = uid),
    'bonus_until', case when b is not null and b > now() then b else null end,
    'a_un_parrain', exists (select 1 from public.referral_claims where invitee = uid)
  );
end;
$$;

revoke all on function public.referral_my_code(), public.referral_claim(text), public.referral_state() from public, anon;
grant execute on function public.referral_my_code(), public.referral_claim(text), public.referral_state() to authenticated;
