import { Link } from 'react-router-dom'
import { CalendarDays, Dice5, ShoppingCart, UtensilsCrossed } from 'lucide-react'

import IconTile from '../ui/IconTile'
import type { Recipe } from '../../types/recipe'

type DashboardHeroProps = {
  userName: string
  todayMealLabel: string
  todayRecipe: Recipe | null
  shoppingCount: number
  onSurprise: () => void
  surpriseDisabled: boolean
}

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 6) return 'Bonne nuit'
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bel après-midi'
  return 'Bonsoir'
}

export default function DashboardHero({
  userName,
  todayMealLabel,
  todayRecipe,
  shoppingCount,
  onSurprise,
  surpriseDisabled,
}: DashboardHeroProps) {
  return (
    <div className="overflow-hidden rounded-[2rem] bg-cream-50 p-5 shadow-card ring-1 ring-bark sm:rounded-[2.5rem] sm:p-8 md:p-10">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-terracotta">
          {getGreeting()}, {userName}
        </p>

        <h1 className="font-display text-3xl font-black leading-tight text-espresso sm:text-4xl md:text-5xl">
          On mijote quoi aujourd’hui&nbsp;?
        </h1>

        <p className="mt-1 max-w-2xl text-base leading-7 text-cacao/80 sm:text-lg">
          Ton carnet est prêt. Une idée, une envie&nbsp;? Tout est là, bien au
          chaud.
        </p>
      </div>

      <div className="mt-7 grid gap-3 sm:gap-4 md:grid-cols-3">
        {/* Repas du jour (depuis le planning) */}
        <Link
          to={todayRecipe ? `/recipes/${todayRecipe.id}` : '/planning'}
          className="group flex flex-col gap-3 rounded-card bg-card p-5 shadow-soft ring-1 ring-bark transition hover:-translate-y-0.5 hover:shadow-card"
        >
          <div className="flex items-center justify-between">
            <IconTile tone="terracotta" size="md">
              <UtensilsCrossed className="h-5 w-5 text-terracotta-deep" />
            </IconTile>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-hazel">
              {todayMealLabel}
            </span>
          </div>

          <div>
            <p className="font-display text-lg font-bold text-espresso">
              {todayRecipe ? todayRecipe.title : 'Rien de prévu'}
            </p>
            <p className="mt-1 text-sm text-hazel">
              {todayRecipe
                ? 'Voir la recette →'
                : 'Planifier un repas →'}
            </p>
          </div>
        </Link>

        {/* Liste de courses */}
        <Link
          to="/shopping-list"
          className="group flex flex-col gap-3 rounded-card bg-card p-5 shadow-soft ring-1 ring-bark transition hover:-translate-y-0.5 hover:shadow-card"
        >
          <div className="flex items-center justify-between">
            <IconTile tone="sage" size="md">
              <ShoppingCart className="h-5 w-5 text-sage-deep" />
            </IconTile>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-hazel">
              Courses
            </span>
          </div>

          <div>
            <p className="font-display text-lg font-bold text-espresso">
              {shoppingCount > 0
                ? `${shoppingCount} article${shoppingCount > 1 ? 's' : ''} à acheter`
                : 'Liste à jour'}
            </p>
            <p className="mt-1 text-sm text-hazel">Voir ma liste →</p>
          </div>
        </Link>

        {/* Surprise du carnet */}
        <button
          type="button"
          onClick={onSurprise}
          disabled={surpriseDisabled}
          className="group flex flex-col gap-3 rounded-card bg-terracotta p-5 text-left text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-terracotta-deep hover:shadow-card disabled:cursor-not-allowed disabled:opacity-70"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Dice5 className="h-6 w-6" />
            </span>
            <CalendarDays className="h-5 w-5 text-white/70" />
          </div>

          <div>
            <p className="font-display text-lg font-bold">
              Inspire-moi&nbsp;!
            </p>
            <p className="mt-1 text-sm text-white/85">
              Une recette au hasard du carnet
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}
