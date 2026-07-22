import { useEffect } from 'react'

import { SUBSCRIPTION_HUB_URL } from '../config/subscription'
import { useDocumentTitle } from '../lib/useDocumentTitle'

/**
 * L'abonnement (souscription et gestion) est centralisé sur la vitrine
 * « Les Carnets ». Cette page redirige donc vers le hub — grâce au SSO,
 * l'utilisateur y arrive déjà connecté.
 */
export default function SubscriptionPage() {
  useDocumentTitle('Abonnement')

  useEffect(() => {
    window.location.replace(SUBSCRIPTION_HUB_URL)
  }, [])

  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-lg font-semibold text-hazel">
        Redirection vers votre espace abonnement…
      </p>

      <a
        href={SUBSCRIPTION_HUB_URL}
        className="mt-5 inline-flex rounded-full bg-terracotta px-6 py-3 font-bold text-white shadow-soft transition hover:bg-terracotta-deep"
      >
        Continuer vers Les Carnets
      </a>
    </section>
  )
}
