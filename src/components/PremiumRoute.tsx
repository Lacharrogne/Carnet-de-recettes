import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { useAuth } from '../context/useAuth'
import { useEntitlement } from '../lib/useEntitlement'
import PremiumLockScreen from './PremiumLockScreen'

/**
 * Protège une page premium : exige d'être connecté, puis un accès valide
 * (abonné ou essai en cours). Le verrou d'accès est inerte tant que
 * `ENFORCE_TRIAL` est `false` (`hasAccess` vaut alors toujours vrai), donc
 * ce composant se comporte comme un simple `ProtectedRoute` en attendant le
 * lancement du paiement.
 */
export default function PremiumRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { hasAccess, loading: entitlementLoading } = useEntitlement()

  if (authLoading || entitlementLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terracotta" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (!hasAccess) {
    return <PremiumLockScreen />
  }

  return <>{children}</>
}
