-- ─── Binôme : s'entraîner à deux ───────────────────────────────────────────
--
-- À exécuter dans Supabase → SQL Editor (ou `supabase db push`).
--
-- CE QUE LA FONCTIONNALITÉ PROMET : deux comptes associés voient la
-- régularité l'un de l'autre — prénom, objectif hebdo, nombre de séances sur
-- 7 jours, date de la dernière — et peuvent se relancer. JAMAIS le détail des
-- séries, des charges ou de l'historique : la redevabilité suffit, le
-- voyeurisme la tue.
--
-- PRINCIPE DE SÉCURITÉ, ET POURQUOI IL EST STRICT : on donne à quelqu'un une
-- fenêtre sur le compte d'un autre. Les tables sont donc FERMÉES : RLS activé,
-- aucune politique, droits retirés à anon et authenticated. Rien ne se lit ni
-- ne s'écrit directement par l'API. Tout passe par les fonctions en bas de ce
-- fichier, qui vérifient elles-mêmes l'appartenance au binôme. Il n'existe
-- aucun chemin pour lire l'activité de quelqu'un d'autre en contournant l'app.
--
-- Rien dans l'app actuelle n'en dépend : ces tables peuvent exister sans être
-- utilisées, et tant qu'elles n'existent pas l'app affiche « pas encore
-- disponible » au lieu de planter.

-- ── Tables ────────────────────────────────────────────────────────────────

create table if not exists public.binomes (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- La clé primaire est `user_id` : UN SEUL binôme par personne, par
-- construction. Même deux acceptations d'invitation simultanées ne peuvent pas
-- en créer deux — la seconde échoue sur la contrainte.
create table if not exists public.binome_members (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  binome_id    uuid not null references public.binomes (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  weekly_goal  smallint not null default 4 check (weekly_goal between 1 and 14),
  joined_at    timestamptz not null default now()
);
create index if not exists binome_members_binome_idx on public.binome_members (binome_id);

-- 12 caractères hexadécimaux = 48 bits. Usage unique, 7 jours. Le prénom et
-- l'objectif de celui qui invite sont figés ici : au moment où l'invité
-- accepte, l'inviteur n'est pas là pour les saisir.
create table if not exists public.binome_invites (
  code         text primary key check (code ~ '^[0-9A-F]{12}$'),
  inviter      uuid not null references auth.users (id) on delete cascade,
  inviter_name text not null check (char_length(btrim(inviter_name)) between 1 and 40),
  inviter_goal smallint not null default 4 check (inviter_goal between 1 and 14),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '7 days',
  used_by      uuid references auth.users (id) on delete set null,
  used_at      timestamptz
);
create index if not exists binome_invites_inviter_idx on public.binome_invites (inviter);

-- Une ligne par séance terminée, et rien de plus que ce qu'on montre.
-- `session_key` est l'identifiant de l'entrée d'historique côté app : la même
-- séance envoyée deux fois (réseau qui hoquette, deux appareils) ne compte
-- qu'une fois.
create table if not exists public.binome_activity (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  binome_id    uuid not null references public.binomes (id) on delete cascade,
  session_key  text not null check (char_length(session_key) between 1 and 120),
  done_at      timestamptz not null,
  day_name     text not null check (char_length(day_name) between 1 and 60),
  duration_min smallint check (duration_min between 0 and 600),
  tonnage_kg   integer check (tonnage_kg between 0 and 1000000),
  unique (user_id, session_key)
);
create index if not exists binome_activity_recent_idx on public.binome_activity (binome_id, done_at desc);

create table if not exists public.binome_nudges (
  id         bigint generated always as identity primary key,
  binome_id  uuid not null references public.binomes (id) on delete cascade,
  from_user  uuid not null references auth.users (id) on delete cascade,
  to_user    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  seen_at    timestamptz
);
create index if not exists binome_nudges_to_idx on public.binome_nudges (to_user, seen_at);
create index if not exists binome_nudges_from_idx on public.binome_nudges (from_user, created_at desc);

-- ── Fermeture ─────────────────────────────────────────────────────────────
-- RLS activé SANS politique = refus total pour anon et authenticated. On
-- retire aussi les droits de table : deux verrous valent mieux qu'un. Les
-- fonctions `security definer` ci-dessous, propriété de postgres, passent
-- outre — et sont donc le seul accès.

alter table public.binomes         enable row level security;
alter table public.binome_members  enable row level security;
alter table public.binome_invites  enable row level security;
alter table public.binome_activity enable row level security;
alter table public.binome_nudges   enable row level security;

revoke all on table
  public.binomes, public.binome_members, public.binome_invites,
  public.binome_activity, public.binome_nudges
from anon, authenticated;

-- ── Fonctions ─────────────────────────────────────────────────────────────
-- Toutes : `security definer` + `search_path` fixé (sinon un objet homonyme
-- créé dans un autre schéma pourrait être appelé à leur place), et les codes
-- d'erreur sont des mots stables que l'app traduit (src/lib/binome.ts).

-- Créer (ou retrouver) son lien d'invitation.
create or replace function public.binome_create_invite(p_display_name text, p_weekly_goal int default 4)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid     := auth.uid();
  v_name    text     := btrim(coalesce(p_display_name, ''));
  v_goal    smallint := greatest(1, least(14, coalesce(p_weekly_goal, 4)));
  v_code    text;
  v_expires timestamptz;
begin
  if v_uid is null then raise exception 'connexion_requise'; end if;
  if char_length(v_name) not between 1 and 40 then raise exception 'nom_invalide'; end if;
  if exists (select 1 from public.binome_members where user_id = v_uid) then
    raise exception 'deja_en_binome';
  end if;

  delete from public.binome_invites
   where inviter = v_uid and (used_at is not null or expires_at < now());

  -- Une invitation encore valide est réutilisée plutôt que multipliée : sinon
  -- chaque appui sur « inviter » créerait un code de plus en circulation.
  select code, expires_at into v_code, v_expires
    from public.binome_invites
   where inviter = v_uid and used_at is null and expires_at > now()
   order by created_at desc
   limit 1;

  if v_code is not null then
    update public.binome_invites
       set inviter_name = v_name, inviter_goal = v_goal
     where code = v_code;
    return json_build_object('code', v_code, 'expires_at', v_expires);
  end if;

  loop
    v_code := upper(substr(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 12));
    begin
      insert into public.binome_invites (code, inviter, inviter_name, inviter_goal)
      values (v_code, v_uid, v_name, v_goal)
      returning expires_at into v_expires;
      exit;
    exception when unique_violation then
      -- Collision sur 48 bits : improbable, mais on retire un code plutôt
      -- que d'échouer.
    end;
  end loop;

  return json_build_object('code', v_code, 'expires_at', v_expires);
end;
$$;

-- Accepter une invitation : crée le binôme et ses deux membres, ou rien.
create or replace function public.binome_accept_invite(p_code text, p_display_name text, p_weekly_goal int default 4)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid     := auth.uid();
  v_name   text     := btrim(coalesce(p_display_name, ''));
  v_goal   smallint := greatest(1, least(14, coalesce(p_weekly_goal, 4)));
  -- Tolère la saisie à la main : tirets, espaces, minuscules.
  v_code   text     := upper(regexp_replace(coalesce(p_code, ''), '[^0-9A-Fa-f]', '', 'g'));
  v_inv    public.binome_invites;
  v_binome uuid;
begin
  if v_uid is null then raise exception 'connexion_requise'; end if;
  if char_length(v_name) not between 1 and 40 then raise exception 'nom_invalide'; end if;
  if char_length(v_code) <> 12 then raise exception 'code_invalide'; end if;

  -- Verrou sur la ligne : deux personnes qui acceptent le même code en même
  -- temps passent l'une après l'autre, et la seconde voit `used_at` rempli.
  select * into v_inv from public.binome_invites where code = v_code for update;
  if not found then raise exception 'code_invalide'; end if;
  if v_inv.used_at is not null then raise exception 'code_deja_utilise'; end if;
  if v_inv.expires_at < now() then raise exception 'code_expire'; end if;
  if v_inv.inviter = v_uid then raise exception 'propre_invitation'; end if;
  if exists (select 1 from public.binome_members where user_id = v_uid) then
    raise exception 'deja_en_binome';
  end if;

  insert into public.binomes default values returning id into v_binome;

  begin
    insert into public.binome_members (user_id, binome_id, display_name, weekly_goal)
    values (v_inv.inviter, v_binome, v_inv.inviter_name, v_inv.inviter_goal),
           (v_uid,         v_binome, v_name,             v_goal);
  exception when unique_violation then
    -- L'un des deux a rejoint un autre binôme entre-temps. La nouvelle
    -- exception annule toute la fonction, binôme vide compris.
    raise exception 'binome_deja_forme';
  end;

  update public.binome_invites set used_by = v_uid, used_at = now() where code = v_code;

  return json_build_object('binome_id', v_binome, 'partner_name', v_inv.inviter_name);
end;
$$;

-- Quitter : le binôme disparaît pour les deux, avec l'activité partagée.
-- L'historique personnel n'est pas touché — il vit dans app_data.
create or replace function public.binome_leave()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_binome uuid;
begin
  if auth.uid() is null then raise exception 'connexion_requise'; end if;
  select binome_id into v_binome from public.binome_members where user_id = auth.uid();
  if v_binome is null then return; end if;
  delete from public.binomes where id = v_binome;
end;
$$;

-- Déclarer une séance terminée. Renvoie faux sans erreur quand on n'est pas en
-- binôme : l'app appelle cette fonction après chaque séance, binôme ou non.
create or replace function public.binome_log_session(
  p_session_key  text,
  p_done_at      timestamptz,
  p_day_name     text,
  p_duration_min int,
  p_tonnage_kg   int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_binome uuid;
  v_rows   int;
begin
  if v_uid is null then raise exception 'connexion_requise'; end if;
  select binome_id into v_binome from public.binome_members where user_id = v_uid;
  if v_binome is null then return false; end if;

  -- Fenêtre de 14 jours : assez pour rattraper une semaine hors ligne et
  -- remplir l'anneau dès l'association, pas assez pour gonfler un compteur
  -- avec de vieilles séances.
  if p_done_at is null
     or p_done_at > now() + interval '1 hour'
     or p_done_at < now() - interval '14 days' then
    raise exception 'date_invalide';
  end if;

  insert into public.binome_activity (user_id, binome_id, session_key, done_at, day_name, duration_min, tonnage_kg)
  values (
    v_uid,
    v_binome,
    left(btrim(coalesce(p_session_key, '')), 120),
    p_done_at,
    left(coalesce(nullif(btrim(p_day_name), ''), 'Séance'), 60),
    case when p_duration_min between 0 and 600 then p_duration_min end,
    case when p_tonnage_kg between 0 and 1000000 then p_tonnage_kg end
  )
  on conflict (user_id, session_key) do nothing;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

-- Relancer son binôme. Une relance toutes les 6 heures au plus.
-- Ne renvoie ni l'identifiant du binôme ni celui du partenaire : la fonction
-- Edge qui envoie la notification les retrouve elle-même, avec la clé serveur.
create or replace function public.binome_send_nudge()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_binome    uuid;
  v_from_name text;
  v_partner   uuid;
  v_last      timestamptz;
  v_id        bigint;
begin
  if v_uid is null then raise exception 'connexion_requise'; end if;

  select binome_id, display_name into v_binome, v_from_name
    from public.binome_members where user_id = v_uid;
  if v_binome is null then raise exception 'pas_de_binome'; end if;

  select user_id into v_partner
    from public.binome_members where binome_id = v_binome and user_id <> v_uid;
  if v_partner is null then raise exception 'pas_de_binome'; end if;

  -- Sérialise les appels d'une même personne : sans ce verrou, deux appuis
  -- rapprochés passaient tous les deux la vérification des 6 heures.
  perform pg_advisory_xact_lock(hashtext('binome_nudge:' || v_uid::text));

  select max(created_at) into v_last from public.binome_nudges where from_user = v_uid;
  if v_last is not null and v_last > now() - interval '6 hours' then
    return json_build_object('ok', false, 'raison', 'trop_tot', 'prochain', v_last + interval '6 hours');
  end if;

  insert into public.binome_nudges (binome_id, from_user, to_user)
  values (v_binome, v_uid, v_partner)
  returning id into v_id;

  return json_build_object('ok', true, 'nudge_id', v_id, 'from_name', v_from_name);
end;
$$;

create or replace function public.binome_mark_nudges_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.binome_nudges set seen_at = now()
   where to_user = auth.uid() and seen_at is null;
$$;

-- Tout ce que l'app affiche, en un seul aller-retour.
create or replace function public.binome_state()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_me      public.binome_members;
  v_partner public.binome_members;
  v_code    text;
  v_expires timestamptz;
begin
  if v_uid is null then return json_build_object('connecte', false); end if;

  select * into v_me from public.binome_members where user_id = v_uid;

  if not found then
    select code, expires_at into v_code, v_expires
      from public.binome_invites
     where inviter = v_uid and used_at is null and expires_at > now()
     order by created_at desc
     limit 1;
    return json_build_object(
      'connecte', true,
      'en_binome', false,
      'invitation', case when v_code is null then null
                         else json_build_object('code', v_code, 'expires_at', v_expires) end
    );
  end if;

  select * into v_partner
    from public.binome_members where binome_id = v_me.binome_id and user_id <> v_uid;

  return json_build_object(
    'connecte', true,
    'en_binome', true,
    'depuis', v_me.joined_at,
    'moi', json_build_object(
      'nom', v_me.display_name,
      'objectif', v_me.weekly_goal,
      'semaine', (select count(*) from public.binome_activity
                   where user_id = v_uid and done_at > now() - interval '7 days')
    ),
    -- Null quand le partenaire a supprimé son compte : la ligne a disparu en
    -- cascade, et l'app propose alors de quitter le binôme.
    'partenaire', case when v_partner.user_id is null then null else json_build_object(
      'nom', v_partner.display_name,
      'objectif', v_partner.weekly_goal,
      'semaine', (select count(*) from public.binome_activity
                   where user_id = v_partner.user_id and done_at > now() - interval '7 days'),
      'derniere_seance', (select max(done_at) from public.binome_activity
                           where user_id = v_partner.user_id)
    ) end,
    'relances_recues', (select count(*) from public.binome_nudges
                         where to_user = v_uid and seen_at is null),
    'ma_derniere_relance', (select max(created_at) from public.binome_nudges
                             where from_user = v_uid)
  );
end;
$$;

-- Qui m'invite ? Pour afficher « Léo t'invite à être son binôme » avant
-- d'accepter, plutôt qu'un code nu. Ne répond que pour un code valide, non
-- utilisé, non expiré, et qui n'est pas le sien : un code faux ne révèle rien.
-- Exige d'être connecté, ce qui rend l'énumération de codes coûteuse.
create or replace function public.binome_invite_preview(p_code text)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^0-9A-Fa-f]', '', 'g'));
  v_name text;
begin
  if auth.uid() is null then raise exception 'connexion_requise'; end if;
  if char_length(v_code) <> 12 then return null; end if;

  select inviter_name into v_name
    from public.binome_invites
   where code = v_code and used_at is null and expires_at > now() and inviter <> auth.uid();

  if v_name is null then return null; end if;
  return json_build_object('inviteur', v_name);
end;
$$;

-- ── Droits d'exécution ────────────────────────────────────────────────────
-- Par défaut une fonction est exécutable par PUBLIC : on le retire, et on ne
-- l'accorde qu'aux utilisateurs connectés.

revoke all on function public.binome_create_invite(text, int)                          from public, anon;
revoke all on function public.binome_accept_invite(text, text, int)                    from public, anon;
revoke all on function public.binome_leave()                                           from public, anon;
revoke all on function public.binome_log_session(text, timestamptz, text, int, int)    from public, anon;
revoke all on function public.binome_send_nudge()                                      from public, anon;
revoke all on function public.binome_mark_nudges_seen()                                from public, anon;
revoke all on function public.binome_state()                                           from public, anon;
revoke all on function public.binome_invite_preview(text)                              from public, anon;

grant execute on function public.binome_create_invite(text, int)                       to authenticated;
grant execute on function public.binome_accept_invite(text, text, int)                 to authenticated;
grant execute on function public.binome_leave()                                        to authenticated;
grant execute on function public.binome_log_session(text, timestamptz, text, int, int) to authenticated;
grant execute on function public.binome_send_nudge()                                   to authenticated;
grant execute on function public.binome_mark_nudges_seen()                             to authenticated;
grant execute on function public.binome_state()                                        to authenticated;
grant execute on function public.binome_invite_preview(text)                           to authenticated;
