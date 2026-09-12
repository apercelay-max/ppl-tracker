-- ─── Abonnements et compteur du coach IA ──────────────────────────────────
--
-- À exécuter dans Supabase → SQL Editor. Rien dans l'appli n'en dépend tant
-- que PAYWALL_ENFORCE ne vaut pas 1 sur Vercel : ces tables peuvent exister
-- sans être utilisées, et l'appli continue de tourner comme avant.
--
-- PRINCIPE DE SÉCURITÉ : l'utilisateur peut LIRE son abonnement (l'interface
-- en a besoin pour afficher le bon palier), il ne peut jamais l'ÉCRIRE. Sinon
-- il suffirait d'une requête depuis la console du navigateur pour se donner
-- Max. Seule la clé `service_role`, qui ne vit que dans les variables
-- d'environnement Vercel, écrit ici.

-- ── Qui paie quoi ─────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  tier               text        not null default 'free' check (tier in ('free', 'pro', 'max')),
  status             text        not null default 'inactive'
                       check (status in ('active', 'trialing', 'canceled', 'expired', 'inactive')),
  -- Fin de la période PAYÉE, pas date de résiliation : quelqu'un qui annule
  -- garde son palier jusqu'au bout de ce qu'il a réglé.
  current_period_end timestamptz,
  -- D'où vient l'abonnement : 'apple' (StoreKit), 'stripe' (web), ou 'manual'
  -- pour les comptes offerts (testeurs, influenceurs, remboursements).
  source             text        not null default 'manual'
                       check (source in ('apple', 'stripe', 'manual')),
  -- Identifiant chez le vendeur, pour rapprocher un webhook d'une ligne.
  external_id        text,
  updated_at         timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Lecture de SA ligne, et rien d'autre.
drop policy if exists "lecture de son propre abonnement" on public.subscriptions;
create policy "lecture de son propre abonnement"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Aucune policy d'insertion/mise à jour : avec RLS activé, l'absence de
-- policy vaut refus. Seul `service_role`, qui contourne RLS, peut écrire.

-- ── Combien de requêtes coach ce mois-ci ──────────────────────────────────
create table if not exists public.coach_usage (
  user_id uuid  not null references auth.users (id) on delete cascade,
  -- Mois au format '2026-09'. Du texte et pas une date : la période est une
  -- étiquette de regroupement, pas un instant, et ça rend la table lisible.
  period  text  not null,
  count   integer not null default 0,
  primary key (user_id, period)
);

alter table public.coach_usage enable row level security;

drop policy if exists "lecture de sa propre consommation" on public.coach_usage;
create policy "lecture de sa propre consommation"
  on public.coach_usage for select
  using (auth.uid() = user_id);

-- ── Incrément atomique ────────────────────────────────────────────────────
-- En une seule instruction côté base. Un lire-puis-écrire depuis la fonction
-- serverless perdrait des requêtes dès que deux appels arrivent ensemble —
-- et comme chaque requête perdue est un appel Gemini offert, ça se paie.
create or replace function public.increment_coach_usage(p_user_id uuid, p_period text)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.coach_usage (user_id, period, count)
  values (p_user_id, p_period, 1)
  on conflict (user_id, period) do update set count = public.coach_usage.count + 1
  returning count;
$$;

-- Cette fonction est appelée avec la clé service_role uniquement. On la retire
-- donc aux rôles publics : elle est `security definer`, la laisser ouverte
-- permettrait à n'importe qui d'incrémenter le compteur de n'importe qui.
revoke all on function public.increment_coach_usage(uuid, text) from public, anon, authenticated;
