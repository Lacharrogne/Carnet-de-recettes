import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'

import { useEntitlement } from '../lib/useEntitlement'
import { SUBSCRIPTION_HUB_URL } from '../config/subscription'

/**
 * Écran affiché à la place d'une fonctionnalité premium quand l'essai est
 * terminé et que l'utilisateur n'est pas abonné. On reste chaleureux : la
 * consultation des recettes, elle, demeure gratuite.
 */
export default function PremiumLockScreen() {
  const { status } = useEntitlement()
  const isExpired = status === 'expired'

  return (
    <section className="mx-auto max-w-xl rounded-card bg-card p-8 text-center shadow-card ring-1 ring-bark sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-terracotta-soft">
        <Lock className="h-7 w-7 text-terracotta-deep" />
      </div>

      <h1 className="mt-6 font-display text-2xl font-black text-espresso sm:text-3xl">
        {isExpired
          ? 'Votre essai gratuit est terminé'
          : 'Une fonctionnalité de l’abonnement'}
      </h1>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-cacao/80">
        Créer et enregistrer des recettes, le planning, la liste de courses et
        le mode frigo font partie de l’abonnement <strong>Les Carnets</strong>.
        Bonne nouvelle : <strong>parcourir et consulter les recettes reste
        gratuit</strong>.
      </p>

      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={SUBSCRIPTION_HUB_URL}
          className="w-full rounded-full bg-terracotta px-6 py-3 font-bold text-white shadow-soft transition hover:bg-terracotta-deep sm:w-auto"
        >
          Voir l’offre
        </a>

        <Link
          to="/recipes"
          className="w-full rounded-full px-6 py-3 font-bold text-cacao ring-1 ring-bark transition hover:bg-linen sm:w-auto"
        >
          Continuer à parcourir les recettes
        </Link>
      </div>
    </section>
  )
}
