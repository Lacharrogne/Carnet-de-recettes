-- Abonnements (paiement Lemon Squeezy).
--
-- Écrit UNIQUEMENT par le webhook (fonction Edge, service role) ; chaque
-- utilisateur peut lire sa propre ligne (RLS). Sert de source de vérité au
-- front (déblocage immédiat au retour du paiement, sans refresh de session).

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Statuts Lemon Squeezy : on_trial | active | paused | past_due | unpaid |
  -- cancelled | expired (+ 'none' par défaut).
  status text not null default 'none',
  variant_id text,
  ls_subscription_id text,
  -- Prochaine échéance de renouvellement.
  renews_at timestamptz,
  -- Fin d'accès effective (après résiliation, accès jusqu'à cette date).
  ends_at timestamptz,
  customer_portal_url text,
  update_payment_url text,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Lecture : chacun voit sa propre ligne.
drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- Aucune policy insert/update/delete pour les utilisateurs : seul le service
-- role (webhook) écrit, en contournant la RLS.
