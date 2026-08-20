import { createContext } from 'react'

import type { SubscriptionRow } from '../services/subscriptionService'

export type EntitlementStatus = 'premium' | 'trialing' | 'expired'

export type Entitlement = {
  status: EntitlementStatus
  /** Abonné payant (abonnement actif / en essai payant). */
  isPremium: boolean
  /** L'utilisateur a-t-il accès aux fonctions premium ? (toujours vrai si ENFORCE_TRIAL=false) */
  hasAccess: boolean
  /** Jours d'essai restants (0 si terminé ou abonné). */
  daysLeft: number
  /** Fin de l'essai gratuit, ou null si la date de création est inconnue. */
  trialEndsAt: Date | null
  /** Chargement de l'abonnement en cours. */
  loading: boolean
  subscription: SubscriptionRow | null
}

/** Valeur par défaut : accès ouvert (le verrou ne s'active qu'une fois chargé). */
export const DEFAULT_ENTITLEMENT: Entitlement = {
  status: 'trialing',
  isPremium: false,
  hasAccess: true,
  daysLeft: 0,
  trialEndsAt: null,
  loading: true,
  subscription: null,
}

export const EntitlementContext = createContext<Entitlement>(DEFAULT_ENTITLEMENT)
