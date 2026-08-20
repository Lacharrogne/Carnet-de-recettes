import { useContext } from 'react'

import { EntitlementContext } from '../context/entitlement-context'

export type {
  Entitlement,
  EntitlementStatus,
} from '../context/entitlement-context'

/**
 * Statut d'accès de l'utilisateur (abonné / essai en cours / essai terminé).
 * Lit le contexte partagé fourni par `EntitlementProvider` (un seul
 * chargement de l'abonnement pour toute l'app).
 */
export function useEntitlement() {
  return useContext(EntitlementContext)
}
