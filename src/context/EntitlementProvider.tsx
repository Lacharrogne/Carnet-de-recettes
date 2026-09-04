import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { useAuth } from './useAuth'
import { ENFORCE_TRIAL, TRIAL_DURATION_DAYS } from '../config/subscription'
import {
  getSubscription,
  isSubscriptionActive,
  type SubscriptionRow,
} from '../services/subscriptionService'
import {
  decideEntitlement,
  readLastKnownPremium,
  rememberPremium,
} from '../lib/entitlementDecision'
import { EntitlementContext, type Entitlement } from './entitlement-context'

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
  const [loadFailed, setLoadFailed] = useState(false)
  const [lastKnownPremium, setLastKnownPremium] = useState(false)
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
          setLoadFailed(false)
          setLastKnownPremium(false)
          setLoading(false)
        }
        return
      }

      setLoading(true)
      const result = await getSubscription(userId)

      if (!ignore) {
        if (result.ok) {
          const premium = isSubscriptionActive(result.row)
          rememberPremium(userId, premium)
          setLastKnownPremium(premium)
          setSubscription(result.row)
          setLoadFailed(false)
        } else {
          // Lecture impossible : on ne conclut pas « non abonné ».
          setLastKnownPremium(readLastKnownPremium(userId))
          setSubscription(null)
          setLoadFailed(true)
        }
        setLoading(false)
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [userId])

  const value = useMemo<Entitlement>(() => {
    const decision = decideEntitlement({
      subscriptionActive: isSubscriptionActive(subscription),
      loadFailed,
      lastKnownPremium,
      accountCreatedAt: user?.created_at ? new Date(user.created_at) : null,
      now,
      enforceTrial: ENFORCE_TRIAL,
      trialDurationDays: TRIAL_DURATION_DAYS,
    })

    return { ...decision, loading, subscription }
  }, [subscription, loadFailed, lastKnownPremium, user, now, loading])

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  )
}
