import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/useAuth'
import { useEntitlement } from '../../lib/useEntitlement'

const DISMISS_KEY = 'recettes-trial-banner-dismissed'

/**
 * Bandeau discret rappelant l'essai gratuit (ou sa fin) aux utilisateurs non
 * abonnés, avec un lien vers la page d'abonnement. Les abonnés (payants ou
 * accès offert) ne le voient jamais. Masquable pour la session.
 */
export default function TrialBanner() {
  const { user } = useAuth()
  const { status, daysLeft, loading } = useEntitlement()

  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let ignore = false

    async function readDismissed() {
      let value = false

      try {
        value = sessionStorage.getItem(DISMISS_KEY) === '1'
      } catch {
        // sessionStorage indisponible : on laisse la valeur par défaut (visible).
      }

      if (!ignore) {
        setDismissed(value)
      }
    }

    void readDismissed()

    return () => {
      ignore = true
    }
  }, [])

  if (!user || loading || dismissed) {
    return null
  }

  if (status !== 'trialing' && status !== 'expired') {
    return null
  }

  const isExpired = status === 'expired'

  function handleDismiss() {
    setDismissed(true)

    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // sessionStorage indisponible : on masque juste pour l'affichage courant.
    }
  }

  return (
    <div className="border-b border-honey/30 bg-honey-soft print:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-sm">
        <span className="text-base" aria-hidden="true">
          {isExpired ? '⏳' : '🎁'}
        </span>

        <p className="min-w-0 flex-1 font-semibold text-honey-deep">
          {isExpired
            ? 'Votre essai gratuit est terminé.'
            : `Essai gratuit — il vous reste ${daysLeft} jour${daysLeft > 1 ? 's' : ''}.`}
        </p>

        <Link
          to="/premium"
          className="shrink-0 rounded-full bg-terracotta px-4 py-1.5 font-bold text-white shadow-soft transition hover:bg-terracotta-deep"
        >
          {isExpired ? "S'abonner" : "Voir l'offre"}
        </Link>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Masquer ce bandeau"
          className="shrink-0 rounded-full px-2 py-1 font-bold text-honey-deep/70 transition hover:bg-honey/20 hover:text-honey-deep"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
