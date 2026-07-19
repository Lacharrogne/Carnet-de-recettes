import { supabase } from '../lib/supabase'

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
  endsAt: string | null
  renewsAt: string | null
  customerPortalUrl: string | null
}

/** L'abonnement donne-t-il accès premium à l'instant présent ? */
export function isSubscriptionActive(row: SubscriptionRow | null): boolean {
  if (!row) {
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
    .select('status, ends_at, renews_at, customer_portal_url')
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
    endsAt: data.ends_at ?? null,
    renewsAt: data.renews_at ?? null,
    customerPortalUrl: data.customer_portal_url ?? null,
  }
}

/**
 * Construit l'URL de checkout Lemon Squeezy : pré-remplit l'email et joint le
 * `user_id` en donnée custom (renvoyée par le webhook pour rattacher le
 * paiement au bon compte).
 */
export function buildCheckoutUrl(
  baseUrl: string,
  { userId, email }: { userId: string; email?: string },
): string {
  if (!baseUrl) {
    return ''
  }

  const url = new URL(baseUrl)

  if (email) {
    url.searchParams.set('checkout[email]', email)
  }

  url.searchParams.set('checkout[custom][user_id]', userId)

  return url.toString()
}
