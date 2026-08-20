import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { useAuth } from './useAuth'
import { ENFORCE_TRIAL, TRIAL_DURATION_DAYS } from '../config/subscription'
import {
  getSubscription,
  isSubscriptionActive,
  type SubscriptionRow,
} from '../services/subscriptionService'
import {
  EntitlementContext,
  type Entitlement,
  type EntitlementStatus,
} from './entitlement-context'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Fournit l'état d'accès (abonné / essai / expiré) à toute l'app, avec un seul
 * chargement de l'abonnement partagé (au lieu d'un fetch par composant). Sert
 * aussi bien au verrou des pages premium qu'au verrou des actions inline
 * (favoris, ajout au planning, à la liste de courses…).
 *
 * - L'essai est calculé depuis `user.created_at` + `TRIAL_DURATION_DAYS`.
 * - Le statut premium vient de la table `subscriptions` (écrite par le webhook
 *   Lemon Squeezy).
 * - Tant que `ENFORCE_TRIAL` est `false`, `hasAccess` reste toujours vrai.
 */
export default function EntitlementProvider({
  children,
}: {
  children: ReactNode
}) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [now, setNow] = useState(() => Date.now())
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null)
  const [loading, setLoading] = useState(() => Boolean(userId))

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 60 * 1000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    let ignore = false

    const load = async () => {
      if (!userId) {
        if (!ignore) {
          setSubscription(null)
          setLoading(false)
        }
        return
      }

      setLoading(true)
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

  const value = useMemo<Entitlement>(() => {
    const isPremium = isSubscriptionActive(subscription)

    const createdAt = user?.created_at ? new Date(user.created_at) : null
    const trialEndsAt = createdAt
      ? new Date(createdAt.getTime() + TRIAL_DURATION_DAYS * DAY_MS)
      : null

    const msLeft = trialEndsAt
      ? trialEndsAt.getTime() - now
      : TRIAL_DURATION_DAYS * DAY_MS

    // Dès qu'on est abonné, l'essai est considéré terminé (il ne « reste » plus).
    const isTrialing = !isPremium && msLeft > 0
    const daysLeft = isPremium ? 0 : Math.max(0, Math.ceil(msLeft / DAY_MS))

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
  }, [subscription, user, now, loading])

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  )
}
