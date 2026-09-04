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

/**
 * Résultat d'une lecture d'abonnement.
 *
 * On distingue explicitement **« lecture réussie »** de **« lecture en
 * échec »** : renvoyer `null` dans les deux cas revenait à traiter une panne
 * réseau comme une absence d'abonnement, et donc à verrouiller des clients
 * qui paient.
 */
export type SubscriptionRead =
  | { ok: true; row: SubscriptionRow | null }
  | { ok: false; row: null }

/** Délais avant nouvelle tentative (une panne réseau est souvent passagère). */
const RETRY_DELAYS_MS = [400, 1200]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Lit l'abonnement de l'utilisateur (sa propre ligne, protégée par RLS).
 *
 * Réessaie quelques fois avant d'abandonner. En cas d'échec définitif, renvoie
 * `{ ok: false }` — à l'appelant de décider, sans jamais conclure « non
 * abonné » d'une erreur de lecture.
 */
export async function getSubscription(userId: string): Promise<SubscriptionRead> {
  for (let attempt = 0; ; attempt += 1) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status, plan, ends_at, renews_at, customer_portal_url')
      .eq('user_id', userId)
      .maybeSingle()

    if (!error) {
      if (!data) {
        return { ok: true, row: null }
      }

      return {
        ok: true,
        row: {
          status: (data.status as SubscriptionStatus) ?? 'none',
          plan: (data.plan as string | null) ?? null,
          endsAt: data.ends_at ?? null,
          renewsAt: data.renews_at ?? null,
          customerPortalUrl: data.customer_portal_url ?? null,
        },
      }
    }

    if (attempt >= RETRY_DELAYS_MS.length) {
      console.error('getSubscription', error)
      return { ok: false, row: null }
    }

    await wait(RETRY_DELAYS_MS[attempt])
  }
}
