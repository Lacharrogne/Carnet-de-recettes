import { Check, Heart, Sparkles, Minus } from 'lucide-react'

import Button from '../components/ui/Button'
import Chip from '../components/ui/Chip'
import { useAuth } from '../context/useAuth'
import { useDocumentTitle } from '../lib/useDocumentTitle'

type PlanFeature = {
  label: string
  free: boolean
  premium: boolean
}

const FEATURES: PlanFeature[] = [
  { label: 'Recettes illimitées', free: true, premium: true },
  { label: 'Liste de courses par rayon', free: true, premium: true },
  { label: 'Mode frigo & anti-gaspi', free: true, premium: true },
  { label: 'Planning de la semaine', free: true, premium: true },
  { label: 'Favoris & recherche avancée', free: true, premium: true },
  { label: 'Carnet partagé en famille', free: false, premium: true },
  { label: 'Synchronisation multi-appareils', free: false, premium: true },
  { label: 'Export & impression PDF soignés', free: false, premium: true },
  { label: 'Sauvegarde automatique du carnet', free: false, premium: true },
  { label: 'Support prioritaire', free: false, premium: true },
]

export default function PricingPage() {
  useDocumentTitle('Offres & tarifs')
  const { user } = useAuth()

  return (
    <section className="space-y-10 sm:space-y-14">
      {/* En-tête */}
      <div className="text-center">
        <Chip emoji="🧡" className="mx-auto mb-5">
          Offres & tarifs
        </Chip>

        <h1 className="mx-auto max-w-3xl font-display text-3xl font-black leading-tight text-espresso sm:text-5xl">
          Un carnet gratuit, une famille encore mieux servie.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-cacao/80 sm:text-lg sm:leading-8">
          Commence gratuitement, sans carte bancaire. Passe à Premium le jour
          où tu veux cuisiner à plusieurs et garder ton carnet en sécurité.
        </p>
      </div>

      {/* Cartes d'offres */}
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        {/* Gratuit */}
        <div className="flex flex-col rounded-[2rem] bg-card p-6 shadow-card ring-1 ring-bark sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-soft text-2xl">
              🌱
            </span>
            <div>
              <p className="font-display text-xl font-bold text-espresso">
                Gratuit
              </p>
              <p className="text-sm text-hazel">Pour bien démarrer</p>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-1">
            <span className="font-display text-5xl font-black text-espresso">
              0 €
            </span>
            <span className="mb-1.5 text-sm font-semibold text-hazel">
              / pour toujours
            </span>
          </div>

          <ul className="mt-7 space-y-3">
            {FEATURES.filter((feature) => feature.free).map((feature) => (
              <li
                key={feature.label}
                className="flex items-start gap-3 text-sm font-medium leading-6 text-cacao"
              >
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-sage-deep" />
                {feature.label}
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-8">
            <Button
              to={user ? '/recipes' : '/auth'}
              variant="secondary"
              size="lg"
              fullWidth
            >
              {user ? 'Continuer gratuitement' : 'Créer mon carnet gratuit'}
            </Button>
          </div>
        </div>

        {/* Premium (mis en avant) */}
        <div className="relative flex flex-col overflow-hidden rounded-[2rem] bg-espresso p-6 text-white shadow-lift ring-1 ring-espresso sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-terracotta/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-honey/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                  🧡
                </span>
                <div>
                  <p className="font-display text-xl font-bold">
                    Famille Premium
                  </p>
                  <p className="text-sm text-cream-100/80">
                    Pour cuisiner à plusieurs
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-honey px-3 py-1.5 text-xs font-black text-espresso">
                <Sparkles className="h-3.5 w-3.5" />
                Populaire
              </span>
            </div>

            <div className="mt-6 flex items-end gap-1">
              <span className="font-display text-5xl font-black">3,99 €</span>
              <span className="mb-1.5 text-sm font-semibold text-cream-100/80">
                / mois
              </span>
            </div>

            <p className="mt-1 text-sm text-cream-100/70">
              Soit moins qu'un café par mois pour toute la famille.
            </p>

            <ul className="mt-7 space-y-3">
              {FEATURES.map((feature) => (
                <li
                  key={feature.label}
                  className={`flex items-start gap-3 text-sm font-medium leading-6 ${
                    feature.premium ? 'text-cream-100' : 'text-cream-100/40'
                  }`}
                >
                  {feature.premium ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-honey" />
                  ) : (
                    <Minus className="mt-0.5 h-5 w-5 shrink-0 text-cream-100/30" />
                  )}
                  {feature.label}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button
                to={user ? '/profile' : '/auth'}
                size="lg"
                fullWidth
                className="bg-honey text-espresso hover:bg-[#e7a94e]"
              >
                Choisir Premium
              </Button>

              <p className="mt-3 text-center text-xs font-semibold text-cream-100/70">
                Paiement bientôt disponible · sans engagement, résiliable à tout
                moment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Réassurance */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Heart,
            title: 'Fait avec amour',
            text: 'Un vrai carnet de famille, pensé pour la cuisine de tous les jours.',
          },
          {
            icon: Sparkles,
            title: 'Sans publicité',
            text: 'Aucune pub, aucune revente de données. Ton carnet reste à toi.',
          },
          {
            icon: Check,
            title: 'Sans engagement',
            text: 'Tu commences gratuitement et tu changes d’avis quand tu veux.',
          },
        ].map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="rounded-card bg-paper p-5 ring-1 ring-bark"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-terracotta-soft">
                <Icon className="h-5 w-5 text-terracotta-deep" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-espresso">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-cacao/80">
                {item.text}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
