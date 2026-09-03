import { supabase } from '../lib/supabase'
import { CARNET } from '../config/subscription'

/** Statuts renvoyés par Lemon Squeezy (via la table `subscriptions`). */
export type SubscriptionStatus =
  | 'none'
  | 'on_trial'
  | 'active'
  | 'paused'
  | 'past_due'
  | 'unpaid'
  | 'cancelled'
  | 'expired'

export type SubscriptionRow = {
  status: SubscriptionStatus
  /** Carnet(s) débloqué(s) : 'recettes' | 'budget' | 'sport' | 'all' | null. */
  plan: string | null
  endsAt: string | null
  renewsAt: string | null
  customerPortalUrl: string | null
}

/** Un plan donne-t-il accès à ce carnet ? (null et 'all' = accès total.) */
export function planGrantsCarnet(plan: string | null): boolean {
  return plan === null || plan === 'all' || plan === CARNET
}

/** L'abonnement donne-t-il accès premium À CE CARNET à l'instant présent ? */
export function isSubscriptionActive(row: SubscriptionRow | null): boolean {
  if (!row) {
    return false
  }

  // Un abonnement à un autre carnet ne débloque pas celui-ci.
  if (!planGrantsCarnet(row.plan)) {
    return false
  }

  if (row.status === 'active' || row.status === 'on_trial') {
    return true
  }

  // Résilié mais encore dans la période payée → accès jusqu'à `endsAt`.
  if (row.status === 'cancelled' && row.endsAt) {
    return new Date(row.endsAt).getTime() > Date.now()
  }

  return false
}

/** Lit l'abonnement de l'utilisateur (sa propre ligne, protégée par RLS). */
export async function getSubscription(
  userId: string,
): Promise<SubscriptionRow | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, plan, ends_at, renews_at, customer_portal_url')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('getSubscription', error)
    return null
  }

  if (!data) {
    return null
  }

  return {
    status: (data.status as SubscriptionStatus) ?? 'none',
    plan: (data.plan as string | null) ?? null,
    endsAt: data.ends_at ?? null,
    renewsAt: data.renews_at ?? null,
    customerPortalUrl: data.customer_portal_url ?? null,
  }
}
