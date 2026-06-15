import { ArrowRight, Sparkles } from 'lucide-react'

import { LINKS } from '../config'
import Button from './Button'

const PREVIEW_RECIPES = [
  { emoji: '🍝', name: 'Pasta e fagioli', time: '35 min', cat: 'Pâtes' },
  { emoji: '🥘', name: 'Gratin dauphinois', time: '1h15', cat: 'Gratins' },
  { emoji: '🥗', name: 'Salade César maison', time: '20 min', cat: 'Salades' },
]

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 pb-12 pt-12 sm:pb-16 sm:pt-16 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* ── Texte ── */}
          <div className="reveal flex flex-col">
            <span className="flex w-fit items-center gap-2 rounded-full bg-terracotta-soft px-4 py-2 text-sm font-bold text-terracotta-deep">
              <Sparkles className="h-4 w-4" />
              Le carnet de cuisine familial
            </span>

            <h1 className="mt-5 font-display text-4xl font-black leading-[1.08] text-espresso sm:text-5xl lg:text-6xl">
              Votre cuisine,
              <br />
              <span className="text-terracotta">enfin organisée</span>.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-cacao/80">
              Réunissez vos recettes, planifiez vos repas et préparez vos
              courses — tout dans un seul carnet, simple et chaleureux. Pensé
              pour les repas du quotidien, sans perdre le plaisir de cuisiner.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={LINKS.SIGNUP_URL} size="lg">
                Commencer maintenant
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button href="#fonctionnalites" external={false} variant="secondary" size="lg">
                Découvrir les fonctionnalités
              </Button>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
              {['Gratuit pour démarrer', 'Sans publicité', 'Prêt en 30 secondes'].map(
                (label) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 text-sm font-semibold text-hazel"
                  >
                    <span className="text-sage-deep">✓</span>
                    {label}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* ── Aperçu de l'application ── */}
          <div className="reveal relative mx-auto w-full max-w-sm lg:mx-0">
            <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-terracotta/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-honey/20 blur-3xl" />

            <div className="absolute -right-3 -top-3 z-10 flex items-center gap-1.5 rounded-full bg-espresso px-3 py-1.5 shadow-lift">
              <Sparkles className="h-3 w-3 text-honey" />
              <span className="text-xs font-black text-white">Premium</span>
            </div>

            <div className="relative rounded-[2rem] bg-linen p-4 shadow-lift ring-1 ring-bark">
              {/* En-tête mockup */}
              <div className="mb-4 flex items-center justify-between px-1">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-terracotta">
                    Mon carnet
                  </p>
                  <p className="font-display text-lg font-bold text-espresso">
                    Cette semaine
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta text-lg font-bold text-white shadow-soft">
                  +
                </div>
              </div>

              {/* Recettes */}
              <div className="space-y-2">
                {PREVIEW_RECIPES.map((r, i) => (
                  <div
                    key={r.name}
                    className={`flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ${
                      i === 0 ? 'ring-terracotta/40' : 'ring-bark'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cream-200 text-xl">
                      {r.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-espresso">
                        {r.name}
                      </p>
                      <p className="text-xs text-hazel">{r.time}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-sage-soft px-2 py-0.5 text-xs font-bold text-sage-deep">
                      {r.cat}
                    </span>
                  </div>
                ))}
              </div>

              {/* Liste de courses */}
              <div className="mt-3 rounded-xl bg-honey-soft p-3 ring-1 ring-bark">
                <p className="mb-2 text-xs font-bold text-hazel">
                  🛒 Liste de courses
                </p>
                {['Carottes', 'Oignons', 'Crème fraîche'].map((item) => (
                  <div key={item} className="flex items-center gap-2 py-0.5">
                    <div className="h-3 w-3 rounded-full border-2 border-honey" />
                    <span className="text-xs text-cacao">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
