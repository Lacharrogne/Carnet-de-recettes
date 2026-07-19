import { useEffect, useState } from 'react'

import { useAuth } from '../context/useAuth'
import {
  ENFORCE_TRIAL,
  IS_BILLING_CONFIGURED,
  TRIAL_DURATION_DAYS,
} from '../config/subscription'
import {
  getSubscription,
  isSubscriptionActive,
  type SubscriptionRow,
} from '../services/subscriptionService'

const DAY_MS = 24 * 60 * 60 * 1000

export type EntitlementStatus = 'premium' | 'trialing' | 'expired'

export type Entitlement = {
  status: EntitlementStatus
  /** Abonné payant (abonnement actif / en essai payant). */
  isPremium: boolean
  /** L'utilisateur a-t-il accès à l'app ? (toujours vrai si ENFORCE_TRIAL=false) */
  hasAccess: boolean
  /** Jours d'essai restants (0 si terminé ou abonné). */
  daysLeft: number
  /** Fin de l'essai gratuit, ou null si la date de création est inconnue. */
  trialEndsAt: Date | null
  /** Chargement de l'abonnement en cours. */
  loading: boolean
  subscription: SubscriptionRow | null
}

/**
 * Statut d'accès de l'utilisateur (abonné / essai en cours / essai terminé).
 *
 * - L'essai est calculé depuis la date de création du compte Supabase
 *   (`user.created_at`) + `TRIAL_DURATION_DAYS`.
 * - Le statut premium vient de la table `subscriptions` (source de vérité
 *   écrite par le webhook Lemon Squeezy). On ne l'interroge que si le paiement
 *   est configuré.
 */
export function useEntitlement(): Entitlement {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [now, setNow] = useState(() => Date.now())
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null)
  const [loading, setLoading] = useState(
    () => IS_BILLING_CONFIGURED && Boolean(userId),
  )

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 60 * 1000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    let ignore = false

    const load = async () => {
      if (!userId || !IS_BILLING_CONFIGURED) {
        if (!ignore) {
          setSubscription(null)
          setLoading(false)
        }
        return
      }

      const row = await getSubscription(userId)

      if (!ignore) {
        setSubscription(row)
        setLoading(false)
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [userId])

  const isPremium = isSubscriptionActive(subscription)

  const createdAt = user?.created_at ? new Date(user.created_at) : null
  const trialEndsAt = createdAt
    ? new Date(createdAt.getTime() + TRIAL_DURATION_DAYS * DAY_MS)
    : null

  const msLeft = trialEndsAt
    ? trialEndsAt.getTime() - now
    : TRIAL_DURATION_DAYS * DAY_MS

  const isTrialing = msLeft > 0
  const daysLeft = Math.max(0, Math.ceil(msLeft / DAY_MS))

  const status: EntitlementStatus = isPremium
    ? 'premium'
    : isTrialing
      ? 'trialing'
      : 'expired'

  const hasAccess = !ENFORCE_TRIAL || isPremium || isTrialing

  return {
    status,
    isPremium,
    hasAccess,
    daysLeft,
    trialEndsAt,
    loading,
    subscription,
  }
}
