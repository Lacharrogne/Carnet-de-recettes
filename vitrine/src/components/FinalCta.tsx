import { Sparkles } from 'lucide-react'

import { LINKS } from '../config'
import Button from './Button'

export default function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <div className="relative overflow-hidden rounded-[2rem] bg-espresso px-6 py-12 text-center shadow-lift sm:rounded-[2.5rem] sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-terracotta/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-honey/20 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-cream-100">
            <Sparkles className="h-4 w-4" />
            Gratuit · sans engagement
          </span>

          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-black leading-tight text-white sm:text-4xl">
            Commencez votre carnet de cuisine aujourd'hui
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-cream-100/85">
            Réunissez enfin toutes vos recettes, vos courses et vos idées de
            repas au même endroit. Il ne reste plus qu'à cuisiner.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href={LINKS.SIGNUP_URL} size="lg" className="w-full sm:w-auto">
              Créer mon carnet
            </Button>

            <Button
              href={LINKS.LOGIN_URL}
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto"
            >
              J'ai déjà un compte
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
