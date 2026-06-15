import { useState } from 'react'
import { Check, Minus, Sparkles } from 'lucide-react'

import { LINKS, PRICING } from '../config'
import Button from './Button'
import SectionHeader from './SectionHeader'

type Plan = { label: string; free: boolean; premium: boolean }

const PLAN_FEATURES: Plan[] = [
  { label: 'Recettes illimitées', free: true, premium: true },
  { label: 'Liste de courses par rayon', free: true, premium: true },
  { label: 'Mode frigo & anti-gaspi', free: true, premium: true },
  { label: 'Planning de la semaine', free: true, premium: true },
  { label: 'Favoris & collections', free: true, premium: true },
  { label: 'Adaptation des portions', free: true, premium: true },
  { label: 'Carnet partagé en famille', free: false, premium: true },
  { label: 'Synchronisation multi-appareils', free: false, premium: true },
  { label: 'Export & impression PDF soignés', free: false, premium: true },
  { label: 'Sauvegarde automatique', free: false, premium: true },
  { label: 'Support prioritaire', free: false, premium: true },
]

const REASSURANCE = [
  '🔒 Paiement sécurisé',
  '↩️ Sans engagement, résiliable à tout moment',
  '🔐 Vos données restent privées',
]

export default function Pricing() {
  const [yearly, setYearly] = useState(false)
  const hasCheckout = Boolean(LINKS.CHECKOUT_URL)

  const premiumPrice = yearly
    ? PRICING.premium.priceYearly
    : PRICING.premium.priceMonthly
  const premiumPeriod = yearly
    ? PRICING.premium.periodYearly
    : PRICING.premium.periodMonthly

  return (
    <section id="tarifs" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <SectionHeader
          centered
          eyebrow="Offres & tarifs"
          title="Un carnet gratuit, une famille encore mieux servie"
          subtitle="Commencez gratuitement, sans carte bancaire. Passez à Premium le jour où vous voulez cuisiner à plusieurs."
        />

        {/* Bascule mensuel / annuel */}
        <div className="mt-7 flex items-center justify-center gap-3">
          <span
            className={`text-sm font-bold ${yearly ? 'text-hazel' : 'text-espresso'}`}
          >
            Mensuel
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={yearly}
            onClick={() => setYearly((v) => !v)}
            className={`relative h-7 w-12 rounded-full ring-1 transition ${
              yearly ? 'bg-terracotta ring-terracotta' : 'bg-linen ring-bark'
            }`}
            aria-label="Basculer entre tarif mensuel et annuel"
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-soft transition ${
                yearly ? 'left-[1.4rem]' : 'left-0.5'
              }`}
            />
          </button>

          <span
            className={`text-sm font-bold ${yearly ? 'text-espresso' : 'text-hazel'}`}
          >
            Annuel
          </span>

          <span className="rounded-full bg-sage-soft px-2.5 py-1 text-xs font-black text-sage-deep">
            {PRICING.premium.yearlySavings}
          </span>
        </div>

        {/* Cartes */}
        <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-2">
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
                {PRICING.free.price}
              </span>
              <span className="mb-1.5 text-sm font-semibold text-hazel">
                {PRICING.free.period}
              </span>
            </div>

            <ul className="mt-7 space-y-3">
              {PLAN_FEATURES.filter((f) => f.free).map((f) => (
                <li
                  key={f.label}
                  className="flex items-start gap-3 text-sm font-medium leading-6 text-cacao"
                >
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-sage-deep" />
                  {f.label}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <Button href={LINKS.SIGNUP_URL} variant="secondary" size="lg" fullWidth>
                Créer mon carnet gratuit
              </Button>
            </div>
          </div>

          {/* Premium */}
          <div className="relative flex flex-col overflow-hidden rounded-[2rem] bg-espresso p-6 text-white shadow-lift ring-1 ring-espresso sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-terracotta/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-honey/20 blur-3xl" />

            <div className="relative flex flex-1 flex-col">
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
                <span className="font-display text-5xl font-black">
                  {premiumPrice}
                </span>
                <span className="mb-1.5 text-sm font-semibold text-cream-100/80">
                  {premiumPeriod}
                </span>
              </div>

              <p className="mt-1 text-sm text-cream-100/70">
                Soit moins qu'un café par mois pour toute la famille.
              </p>

              <ul className="mt-7 space-y-3">
                {PLAN_FEATURES.map((f) => (
                  <li
                    key={f.label}
                    className={`flex items-start gap-3 text-sm font-medium leading-6 ${
                      f.premium ? 'text-cream-100' : 'text-cream-100/40'
                    }`}
                  >
                    {f.premium ? (
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-honey" />
                    ) : (
                      <Minus className="mt-0.5 h-5 w-5 shrink-0 text-cream-100/30" />
                    )}
                    {f.label}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                {hasCheckout ? (
                  <Button href={LINKS.CHECKOUT_URL} variant="honey" size="lg" fullWidth>
                    Passer au Premium
                  </Button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed rounded-full bg-honey/40 px-7 py-4 text-center font-bold text-white/60"
                  >
                    Bientôt disponible
                  </button>
                )}

                <p className="mt-3 text-center text-xs font-semibold text-cream-100/70">
                  Sans engagement · résiliable à tout moment
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Réassurance */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
          {REASSURANCE.map((item) => (
            <span key={item} className="text-sm font-semibold text-hazel">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
