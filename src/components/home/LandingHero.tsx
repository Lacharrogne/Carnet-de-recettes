import { ArrowRight, Sparkles } from 'lucide-react'
import Button from '../ui/Button'
import Chip from '../ui/Chip'

const APP_PREVIEW_RECIPES = [
  { emoji: '🍝', name: 'Pasta e fagioli', time: '35 min', cat: 'Pâtes' },
  { emoji: '🍲', name: 'Gratin dauphinois', time: '1h15', cat: 'Gratins' },
  { emoji: '🥗', name: 'Salade César maison', time: '20 min', cat: 'Salades' },
]

export default function LandingHero() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-card shadow-lift ring-1 ring-bark sm:rounded-[2.5rem]">
      <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-terracotta/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-honey/15 blur-3xl" />

      <div className="relative grid gap-8 px-6 py-10 sm:py-12 md:grid-cols-[1fr_auto] md:items-center md:gap-12 md:px-12 md:py-16">
        {/* ── Texte ── */}
        <div className="flex flex-col">
          <Chip emoji="🍳" className="mb-5 self-start">
            Carnet de cuisine familial
          </Chip>

          <h1 className="font-display text-4xl font-black leading-[1.1] text-espresso sm:text-5xl lg:text-6xl">
            Votre cuisine,{' '}
            <span className="text-terracotta">enfin organisée</span>.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-cacao/80 sm:text-lg sm:leading-8">
            Réunissez vos recettes de famille, planifiez vos repas et préparez
            vos courses — tout dans un seul carnet, simple et chaleureux.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/auth" size="lg">
              Créer mon carnet
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button to="/recipes" variant="secondary" size="lg">
              Explorer les recettes
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {['Gratuit', 'Sans publicité', 'Prêt en 30 secondes'].map(
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

        {/* ── Aperçu de l'application (masqué sur mobile) ── */}
        <div className="relative hidden w-[290px] shrink-0 md:block">
          <div className="absolute -right-3 -top-3 z-10 flex items-center gap-1.5 rounded-full bg-espresso px-3 py-1.5 shadow-lift">
            <Sparkles className="h-3 w-3 text-honey" />
            <span className="text-xs font-black text-white">Premium</span>
          </div>

          <div className="rounded-[2rem] bg-linen p-4 shadow-card ring-1 ring-bark">
            {/* En-tête mockup */}
            <div className="mb-4 flex items-center justify-between px-1">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-terracotta">
                  Mon carnet
                </p>
                <p className="font-display text-lg font-bold text-espresso">
                  3 recettes
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta text-sm font-bold text-white shadow-soft">
                +
              </div>
            </div>

            {/* Recettes mockup */}
            <div className="space-y-2">
              {APP_PREVIEW_RECIPES.map((r, i) => (
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

            {/* Courses mockup */}
            <div className="mt-3 rounded-xl bg-honey-soft p-3 ring-1 ring-bark">
              <p className="mb-2 text-xs font-bold text-hazel">
                🛒 Liste de courses
              </p>
              {['Carottes', 'Oignons', 'Ail'].map((item) => (
                <div key={item} className="flex items-center gap-2 py-0.5">
                  <div className="h-3 w-3 rounded-full border-2 border-honey" />
                  <span className="text-xs text-cacao">{item}</span>
                </div>
              ))}
            </div>

            {/* Planning mockup */}
            <div className="mt-3 rounded-xl bg-sage-soft/60 p-3 ring-1 ring-bark">
              <p className="text-xs font-bold text-hazel">📅 Cette semaine</p>
              <div className="mt-1.5 flex gap-1">
                {['L', 'M', 'M', 'J', 'V'].map((day, i) => (
                  <div
                    key={`${day}-${i}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                      i === 1
                        ? 'bg-terracotta text-white'
                        : 'bg-card text-hazel ring-1 ring-bark'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
