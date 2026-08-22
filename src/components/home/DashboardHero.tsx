import { Link } from 'react-router-dom'
import { ShoppingCart, UtensilsCrossed } from 'lucide-react'

import Button from '../ui/Button'
import IconTile from '../ui/IconTile'
import MagicRecipeButton from './MagicRecipeButton'
import { LOGO_SRC } from '../../data/brand'
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
    <div className="relative overflow-hidden rounded-[2rem] bg-cream-50 shadow-card ring-1 ring-bark sm:rounded-[2.5rem]">
      {/* Décor doux */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-100/70 blur-3xl" />

      <div className="relative grid gap-8 px-5 py-8 md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:px-12 md:py-14">
        {/* Colonne gauche : accueil personnalisé */}
        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-terracotta sm:text-sm">
            {getGreeting()}, {userName}
          </p>

          <h1 className="mt-3 font-display text-4xl font-black leading-[1.05] text-espresso sm:text-5xl md:text-6xl">
            On mijote quoi aujourd’hui&nbsp;?
          </h1>

          <p className="mt-5 max-w-md text-base leading-7 text-cacao/80 sm:text-lg sm:leading-8">
            Ton carnet est prêt. Une envie, une idée&nbsp;? Tout est là, bien au
            chaud.
          </p>

          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
            <Button to="/add-recipe" size="lg" fullWidth className="sm:w-auto">
              Ajouter une recette
            </Button>

            <Button
              to="/planning"
              variant="secondary"
              size="lg"
              fullWidth
              className="sm:w-auto"
            >
              Voir mon planning
            </Button>
          </div>
        </div>

        {/* Colonne droite : la carte « On cuisine quoi ? » */}
        <div className="relative">
          <div className="rounded-[2rem] bg-card p-5 shadow-card ring-1 ring-bark sm:rounded-[2.25rem] sm:p-6">
            <div className="mb-5 flex items-center gap-4 sm:mb-6 sm:gap-5">
              <div className="relative h-16 w-16 shrink-0 overflow-visible sm:h-20 sm:w-20">
                <img
                  src={LOGO_SRC}
                  alt="Logo Carnet de recettes"
                  className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-md sm:h-28 sm:w-28"
                />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-terracotta sm:text-sm">
                  Aujourd’hui
                </p>
                <p className="font-display text-xl font-bold text-espresso sm:text-2xl">
                  On cuisine quoi&nbsp;?
                </p>
              </div>
            </div>

            <MagicRecipeButton onClick={onSurprise} disabled={surpriseDisabled} />

            <div className="mt-4 grid gap-3 sm:mt-5">
              {/* Repas du jour */}
              <Link
                to={todayRecipe ? `/recipes/${todayRecipe.id}` : '/planning'}
                className="group flex items-center gap-3 rounded-[1.4rem] bg-linen p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-soft"
              >
                <IconTile tone="terracotta" size="md">
                  <UtensilsCrossed className="h-5 w-5 text-terracotta-deep" />
                </IconTile>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-hazel">
                    {todayMealLabel}
                  </p>
                  <p className="truncate font-display text-lg font-bold text-espresso">
                    {todayRecipe ? todayRecipe.title : 'Rien de prévu'}
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="text-hazel transition group-hover:translate-x-0.5 group-hover:text-terracotta"
                >
                  →
                </span>
              </Link>

              {/* Liste de courses */}
              <Link
                to="/shopping-list"
                className="group flex items-center gap-3 rounded-[1.4rem] bg-linen p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-soft"
              >
                <IconTile tone="sage" size="md">
                  <ShoppingCart className="h-5 w-5 text-sage-deep" />
                </IconTile>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-hazel">
                    Courses
                  </p>
                  <p className="truncate font-display text-lg font-bold text-espresso">
                    {shoppingCount > 0
                      ? `${shoppingCount} article${shoppingCount > 1 ? 's' : ''} à acheter`
                      : 'Liste à jour'}
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="text-hazel transition group-hover:translate-x-0.5 group-hover:text-terracotta"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
