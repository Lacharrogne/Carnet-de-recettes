import { Link } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { useEntitlement } from '../lib/useEntitlement'
import {
  CONTACT_EMAIL,
  IS_BILLING_CONFIGURED,
  LEMONSQUEEZY,
} from '../config/subscription'
import { buildCheckoutUrl } from '../services/subscriptionService'

function formatDate(value: string | null): string {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(
    new Date(value),
  )
}

export default function SubscriptionPage() {
  useDocumentTitle('Abonnement')

  const { user } = useAuth()
  const { isPremium, status, daysLeft, subscription, loading } =
    useEntitlement()

  const checkoutUrl = (baseUrl: string) =>
    user
      ? buildCheckoutUrl(baseUrl, {
          userId: user.id,
          email: user.email ?? undefined,
        })
      : ''

  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-5">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-terracotta">
          Abonnement
        </p>

        <h1 className="mt-2 font-display text-3xl font-black text-espresso sm:text-4xl">
          Un abonnement, tous les carnets
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-hazel">
          Un seul abonnement « Les Carnets » débloque toutes les fonctionnalités
          de vos carnets (recettes, budget, sport…). Essai gratuit de 14 jours,
          puis simple à résilier à tout moment.
        </p>
      </div>

      {loading ? (
        <div className="rounded-[2rem] bg-card p-8 text-center text-hazel shadow-card ring-1 ring-bark">
          Chargement…
        </div>
      ) : isPremium ? (
        <div className="rounded-[2rem] bg-card p-8 text-center shadow-card ring-1 ring-bark">
          <p className="text-4xl">🎉</p>

          <h2 className="mt-3 text-2xl font-black text-espresso">
            Vous êtes abonné
          </h2>

          <p className="mt-2 text-hazel">
            {subscription?.renewsAt
              ? `Prochain renouvellement le ${formatDate(subscription.renewsAt)}.`
              : 'Merci de votre soutien !'}
            {subscription?.status === 'cancelled' && subscription.endsAt
              ? ` Accès jusqu'au ${formatDate(subscription.endsAt)}.`
              : ''}
          </p>

          {subscription?.customerPortalUrl && (
            <a
              href={subscription.customerPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-full bg-terracotta px-6 py-3 font-bold text-white shadow-soft transition hover:bg-terracotta-deep"
            >
              Gérer mon abonnement
            </a>
          )}
        </div>
      ) : (
        <>
          <div
            className={`rounded-2xl px-5 py-4 text-center text-sm font-bold ring-1 ${
              status === 'expired'
                ? 'bg-honey-soft text-honey-deep ring-honey/40'
                : 'bg-sage-soft text-sage-deep ring-sage/30'
            }`}
          >
            {status === 'expired'
              ? 'Votre essai gratuit est terminé.'
              : `Il vous reste ${daysLeft} jour${daysLeft > 1 ? 's' : ''} d'essai gratuit.`}
          </div>

          {!IS_BILLING_CONFIGURED ? (
            <div className="rounded-[2rem] bg-card p-8 text-center shadow-card ring-1 ring-bark">
              <h2 className="text-2xl font-black text-espresso">
                Abonnement bientôt disponible
              </h2>

              <p className="mt-2 text-hazel">
                Le paiement arrive très vite. En attendant, l'accès reste
                ouvert. Une question ?{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-bold text-terracotta underline"
                >
                  Écrivez-nous
                </a>
                .
              </p>
            </div>
          ) : !user ? (
            <div className="rounded-[2rem] bg-card p-8 text-center shadow-card ring-1 ring-bark">
              <p className="text-hazel">
                Connectez-vous pour vous abonner et retrouver votre carnet sur
                tous vos appareils.
              </p>

              <Link
                to="/auth"
                className="mt-5 inline-flex rounded-full bg-terracotta px-6 py-3 font-bold text-white shadow-soft transition hover:bg-terracotta-deep"
              >
                Se connecter
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <PlanCard
                title="Mensuel"
                price={LEMONSQUEEZY.monthlyPrice}
                period="/ mois"
                description="Sans engagement, résiliable à tout moment."
                href={checkoutUrl(LEMONSQUEEZY.monthlyUrl)}
              />

              <PlanCard
                title="Annuel"
                price={LEMONSQUEEZY.yearlyPrice}
                period="/ an"
                description="2 mois offerts par rapport au mensuel."
                highlighted
                href={checkoutUrl(LEMONSQUEEZY.yearlyUrl)}
              />
            </div>
          )}
        </>
      )}
    </section>
  )
}

function PlanCard({
  title,
  price,
  period,
  description,
  href,
  highlighted = false,
}: {
  title: string
  price: string
  period: string
  description: string
  href: string
  highlighted?: boolean
}) {
  return (
    <div
      className={`flex flex-col rounded-[2rem] bg-card p-6 shadow-card ring-1 ${
        highlighted ? 'ring-2 ring-terracotta' : 'ring-bark'
      }`}
    >
      {highlighted && (
        <span className="mb-3 w-fit rounded-full bg-terracotta-soft px-3 py-1 text-xs font-bold text-terracotta-deep">
          Le plus avantageux
        </span>
      )}

      <h3 className="text-lg font-black text-espresso">{title}</h3>

      <p className="mt-2">
        <span className="text-3xl font-black text-espresso">{price}</span>
        <span className="ml-1 text-sm font-bold text-hazel">{period}</span>
      </p>

      <p className="mt-2 flex-1 text-sm leading-6 text-hazel">{description}</p>

      {href ? (
        <a
          href={href}
          className="mt-5 inline-flex justify-center rounded-full bg-terracotta px-6 py-3 font-bold text-white shadow-soft transition hover:bg-terracotta-deep"
        >
          S'abonner
        </a>
      ) : (
        <span className="mt-5 inline-flex justify-center rounded-full bg-linen px-6 py-3 font-bold text-hazel">
          Bientôt
        </span>
      )}
    </div>
  )
}
