import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import DashboardHero from '../components/home/DashboardHero'
import RecipeCard from '../components/recipes/RecipeCard'
import Button from '../components/ui/Button'
import Chip from '../components/ui/Chip'
import IconTile, { type IconTileTone } from '../components/ui/IconTile'
import Modal from '../components/ui/Modal'
import SectionHeader from '../components/ui/SectionHeader'
import { RecipeCardGridSkeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/useAuth'
import { getHomeCardStyle } from '../data/categoryStyles'
import { RECIPE_CATEGORIES } from '../data/recipeOptions'
import { getProfile } from '../services/profiles'
import { getRecipes } from '../services/recipes'
import { getRecipeRatings, type RecipeRating } from '../services/reviews'
import { getShoppingListItems } from '../services/shoppingList'
import type { Recipe } from '../types/recipe'

const PLANNER_STORAGE_KEY = 'carnet-recettes-weekly-planner'

const WEEK_DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

// Lit le planning local pour proposer le repas du jour sur le dashboard.
function getTodayPlan(): { mealLabel: string; recipeId: string | null } {
  const hour = new Date().getHours()
  const fallbackLabel = hour < 14 ? 'Au déjeuner' : 'Au dîner'

  try {
    const raw = window.localStorage.getItem(PLANNER_STORAGE_KEY)
    if (!raw) return { mealLabel: fallbackLabel, recipeId: null }

    const planner = JSON.parse(raw) as Record<
      string,
      { lunch?: string; dinner?: string }
    >
    const day = planner[WEEK_DAY_KEYS[new Date().getDay()]] ?? {}

    if (hour < 14 && day.lunch) {
      return { mealLabel: 'Au déjeuner', recipeId: day.lunch }
    }
    if (day.dinner) return { mealLabel: 'Au dîner', recipeId: day.dinner }
    if (day.lunch) return { mealLabel: 'Au déjeuner', recipeId: day.lunch }

    return { mealLabel: fallbackLabel, recipeId: null }
  } catch {
    return { mealLabel: fallbackLabel, recipeId: null }
  }
}

const QUICK_LINKS: {
  to: string
  emoji: string
  label: string
  description: string
  tone: IconTileTone
}[] = [
  {
    to: '/frigo',
    emoji: '🥕',
    label: 'Mode frigo',
    description: 'Cuisiner avec ce que tu as',
    tone: 'sage',
  },
  {
    to: '/shopping-list',
    emoji: '🛒',
    label: 'Liste de courses',
    description: 'Tes ingrédients à acheter',
    tone: 'terracotta',
  },
  {
    to: '/planning',
    emoji: '📅',
    label: 'Planning',
    description: 'Les repas de la semaine',
    tone: 'honey',
  },
]

export default function HomePage() {
  const { user } = useAuth()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [ratings, setRatings] = useState<Map<number, RecipeRating>>(new Map())

  const [userName, setUserName] = useState('')
  const [shoppingCount, setShoppingCount] = useState(0)
  const todayPlan = getTodayPlan()

  const [randomRecipe, setRandomRecipe] = useState<Recipe | null>(null)
  const [randomModalOpen, setRandomModalOpen] = useState(false)
  const [randomizing, setRandomizing] = useState(false)

  useEffect(() => {
    let ignore = false

    getRecipes()
      .then((data) => {
        if (!ignore) {
          setRecipes(data)
        }
      })
      .catch((error) => {
        console.error(error)

        if (!ignore) {
          setErrorMessage('Impossible de charger les recettes pour le moment.')
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (recipes.length === 0) return

    let ignore = false

    getRecipeRatings(recipes.slice(0, 3).map((recipe) => recipe.id))
      .then((map) => {
        if (!ignore) {
          setRatings(map)
        }
      })
      .catch((error) => {
        console.error(error)
      })

    return () => {
      ignore = true
    }
  }, [recipes])

  // Données du dashboard connecté : prénom + nombre d'articles de courses.
  useEffect(() => {
    if (!user) return

    let ignore = false

    getProfile(user.id)
      .then((profile) => {
        if (ignore) return
        setUserName(
          profile?.username || user.email?.split('@')[0] || 'chef',
        )
      })
      .catch((error) => console.error(error))

    getShoppingListItems()
      .then((items) => {
        if (!ignore) {
          setShoppingCount(items.filter((item) => !item.checked).length)
        }
      })
      .catch((error) => console.error(error))

    return () => {
      ignore = true
    }
  }, [user])

  const latestRecipes = useMemo(() => {
    return recipes.slice(0, 3)
  }, [recipes])

  const todayRecipe = useMemo(() => {
    if (!todayPlan.recipeId) return null
    return (
      recipes.find((recipe) => String(recipe.id) === todayPlan.recipeId) ?? null
    )
  }, [recipes, todayPlan.recipeId])

  const categoriesWithCount = useMemo(() => {
    return RECIPE_CATEGORIES.map((category) => {
      const count = recipes.filter(
        (recipe) => recipe.category === category.value,
      ).length

      return {
        ...category,
        count,
      }
    })
  }, [recipes])

  function launchRandomRecipe() {
    if (recipes.length === 0 || randomizing) return

    setRandomModalOpen(true)
    setRandomRecipe(null)
    setRandomizing(true)

    window.setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * recipes.length)
      setRandomRecipe(recipes[randomIndex])
      setRandomizing(false)
    }, 900)
  }

  function closeRandomModal() {
    setRandomModalOpen(false)
    setRandomRecipe(null)
    setRandomizing(false)
  }

  return (
    <>
      <section className="space-y-8 sm:space-y-10 lg:space-y-14">
        {user ? (
          <DashboardHero
            userName={userName || 'chef'}
            todayMealLabel={todayPlan.mealLabel}
            todayRecipe={todayRecipe}
            shoppingCount={shoppingCount}
            onSurprise={launchRandomRecipe}
            surpriseDisabled={loading || recipes.length === 0 || randomizing}
          />
        ) : (
          <div className="overflow-hidden rounded-[2rem] bg-cream-50 shadow-sm ring-1 ring-orange-100 sm:rounded-[2.5rem]">
          <div className="grid gap-8 px-5 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-12 md:py-14">
            <div className="flex flex-col justify-center">
              <Chip emoji="🍲" className="mb-5">
                Carnet de cuisine familial
              </Chip>

              <h1 className="max-w-3xl text-3xl font-black leading-tight text-stone-950 sm:text-5xl md:text-6xl">
                Les recettes de la maison, toujours sous la main.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 sm:mt-6 sm:text-lg sm:leading-8">
                Un petit carnet chaleureux pour retrouver vos plats préférés,
                garder les idées de Chloé & Maxime et préparer facilement les
                prochains repas.
              </p>

              <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
                <Button to="/recipes" size="lg" fullWidth className="sm:w-auto">
                  Voir les recettes
                </Button>

                <Button
                  to="/add-recipe"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  className="sm:w-auto"
                >
                  Ajouter une recette
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-orange-100/70 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-amber-100/80 blur-2xl" />

              <div className="relative rounded-[2rem] bg-card p-5 shadow-card ring-1 ring-bark sm:rounded-[2.25rem] sm:p-6">
                <div className="mb-5 flex items-center gap-4 sm:mb-6 sm:gap-5">
                  <div className="relative h-20 w-20 shrink-0 overflow-visible sm:h-24 sm:w-24">
                    <img
                      src="/ChatGPT Image 1 mai 2026, 04_35_16.png"
                      alt="Logo Carnet de recettes"
                      className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-md sm:h-32 sm:w-32"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-terracotta sm:text-sm">
                      Aujourd’hui
                    </p>
                    <p className="font-display text-xl font-bold text-espresso sm:text-2xl">
                      On cuisine quoi ?
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={launchRandomRecipe}
                  disabled={loading || recipes.length === 0 || randomizing}
                  className="group w-full rounded-[1.75rem] bg-orange-500 p-5 text-left text-white shadow-sm transition hover:-translate-y-1 hover:bg-orange-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 sm:rounded-[2rem] sm:p-7"
                >
                  <div className="flex items-center justify-between gap-4 sm:gap-5">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wide text-orange-100 sm:text-sm">
                        Bouton magique
                      </p>

                      <p className="mt-3 text-2xl font-black leading-tight sm:mt-4 sm:text-3xl">
                        Me proposer une recette
                      </p>

                      <p className="mt-3 max-w-sm text-sm font-bold leading-6 text-orange-50 sm:mt-4 sm:text-base sm:leading-7">
                        Clique ici et le carnet choisit une recette au hasard.
                      </p>
                    </div>

                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-white/20 text-3xl transition group-hover:rotate-12 group-hover:scale-105 sm:h-20 sm:w-20 sm:rounded-[1.5rem] sm:text-4xl">
                      🎲
                    </div>
                  </div>
                </button>

                <div className="mt-5 rounded-[1.5rem] bg-linen p-4 sm:p-5">
                  <p className="text-sm font-bold text-hazel">
                    Dernière recette ajoutée
                  </p>

                  <p className="mt-2 line-clamp-2 font-display text-xl font-bold text-espresso sm:text-2xl">
                    {latestRecipes[0]?.title ?? 'Aucune recette pour le moment'}
                  </p>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-cacao/80">
                    {latestRecipes[0]?.description ??
                      'Ajoute une première recette pour commencer ton carnet.'}
                  </p>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-dashed border-honey/50 bg-honey-soft/50 p-4 text-sm font-medium leading-6 text-cacao sm:mt-6">
                  💡 Astuce : ajoute tes recettes du quotidien, tes favoris et
                  les ingrédients à ta liste de courses.
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group flex items-center gap-3 rounded-card bg-card p-4 shadow-card ring-1 ring-bark transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <IconTile tone={link.tone} size="md">
                {link.emoji}
              </IconTile>

              <div className="min-w-0">
                <p className="font-display font-bold text-espresso">
                  {link.label}
                </p>
                <p className="truncate text-sm text-hazel">{link.description}</p>
              </div>

              <span className="ml-auto text-hazel transition group-hover:translate-x-0.5 group-hover:text-terracotta">
                →
              </span>
            </Link>
          ))}
        </div>

        {errorMessage && (
          <p className="rounded-2xl bg-[#f7e3de] px-4 py-3 font-medium text-[#b23b2e]">
            {errorMessage}
          </p>
        )}

        <div className="rounded-[2rem] bg-card/95 p-5 shadow-card ring-1 ring-bark sm:rounded-[2.5rem] sm:p-8 md:p-10">
          <SectionHeader
            className="mb-6 sm:mb-8"
            eyebrow="Nouveautés"
            title="Les dernières recettes ajoutées"
            subtitle="Les nouvelles idées à tester à la maison."
            action={
              <Button
                to="/recipes"
                variant="secondary"
                fullWidth
                className="sm:w-fit"
              >
                Explorer les catégories →
              </Button>
            }
          />

          {loading ? (
            <RecipeCardGridSkeleton count={3} />
          ) : latestRecipes.length === 0 ? (
            <div className="rounded-[1.5rem] bg-white p-6 text-center shadow-sm ring-1 ring-orange-100 sm:rounded-[2rem] sm:p-8">
              <p className="text-lg font-bold text-stone-950">
                Aucune recette pour le moment.
              </p>

              <p className="mt-2 text-stone-600">
                Ajoute ta première recette pour la voir apparaître ici.
              </p>

              <Button
                to="/add-recipe"
                size="lg"
                fullWidth
                className="mt-6 sm:w-auto"
              >
                Ajouter une recette
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {latestRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  rating={ratings.get(recipe.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] bg-card/95 p-5 shadow-card ring-1 ring-bark sm:rounded-[2.5rem] sm:p-8 md:p-10">
          <SectionHeader
            className="mb-6 sm:mb-8"
            eyebrow="Explorer"
            title="Les grandes familles de recettes"
            subtitle="Parcours le carnet selon tes envies du moment."
            action={
              <Button
                to="/recipes"
                variant="secondary"
                fullWidth
                className="sm:w-fit"
              >
                Toutes les recettes →
              </Button>
            }
          />

          {loading ? (
            <RecipeCardGridSkeleton count={6} />
          ) : (
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categoriesWithCount.map((category, index) => {
                const visualStyle = getHomeCardStyle(category.label, index)

                return (
                  <Link
                    key={category.value}
                    to={`/recipes?category=${encodeURIComponent(
                      category.value,
                    )}`}
                    className={`group relative overflow-hidden rounded-[1.75rem] border ${visualStyle.border} ${visualStyle.cardBg} p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(28,25,23,0.08)] sm:rounded-[2rem] sm:p-6`}
                  >
                    <div
                      className={`pointer-events-none absolute right-0 top-0 h-24 w-24 -translate-y-6 translate-x-6 rounded-full blur-3xl sm:h-28 sm:w-28 ${visualStyle.topGlow}`}
                    />

                    <div
                      className={`pointer-events-none absolute bottom-0 left-0 h-20 w-20 -translate-x-6 translate-y-6 rounded-full blur-3xl sm:h-24 sm:w-24 ${visualStyle.bottomGlow}`}
                    />

                    <div className="relative z-10">
                      <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6 sm:gap-4">
                        <div
                          className={`flex h-16 w-16 items-center justify-center rounded-[1.35rem] ${visualStyle.iconBg} text-3xl shadow-sm transition group-hover:scale-105 sm:h-20 sm:w-20 sm:rounded-[1.6rem] sm:text-4xl`}
                        >
                          {category.emoji}
                        </div>

                        <span
                          className={`shrink-0 rounded-full ${visualStyle.badgeBg} px-3 py-2 text-xs font-bold ${visualStyle.badgeText} sm:px-4 sm:text-sm`}
                        >
                          {category.count} recette
                          {category.count > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="mb-4 flex gap-2">
                        {visualStyle.miniIcons.map((icon) => (
                          <span
                            key={icon}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow-sm ring-1 ring-black/5 sm:h-9 sm:w-9 sm:text-base"
                          >
                            {icon}
                          </span>
                        ))}
                      </div>

                      <h3 className="mb-3 text-xl font-black leading-tight text-stone-950 sm:text-2xl">
                        {category.label}
                      </h3>

                      <p
                        className={`leading-7 ${visualStyle.subtleText} sm:min-h-[84px]`}
                      >
                        {category.description}
                      </p>

                      <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4">
                        <span className={`font-bold ${visualStyle.accentText}`}>
                          Voir les recettes
                        </span>

                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${visualStyle.badgeBg} ${visualStyle.badgeText} transition group-hover:translate-x-1`}
                        >
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <Modal open={randomModalOpen} onClose={closeRandomModal}>
        {randomizing ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center sm:min-h-[340px]">
            <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-terracotta text-5xl shadow-card sm:mb-8 sm:h-28 sm:w-28 sm:rounded-[2rem] sm:text-6xl">
              <span className="animate-spin">🎲</span>
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.12em] text-terracotta">
              Le carnet choisit...
            </p>

            <h2 className="mt-3 text-2xl font-bold text-espresso sm:text-3xl">
              On mélange les idées
            </h2>

            <p className="mt-3 max-w-sm text-cacao/80">
              Une recette arrive dans quelques secondes.
            </p>
          </div>
        ) : randomRecipe ? (
          <div>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream-200 text-4xl">
                {randomRecipe.imageUrl ? (
                  <img
                    src={randomRecipe.imageUrl}
                    alt={randomRecipe.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  randomRecipe.image || '🍽️'
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-terracotta sm:text-sm">
                  Recette surprise
                </p>

                <h2 className="line-clamp-2 text-xl font-bold text-espresso sm:text-2xl">
                  {randomRecipe.title}
                </h2>
              </div>
            </div>

            <span className="inline-block rounded-full bg-terracotta-soft px-4 py-2 text-sm font-bold text-terracotta-deep">
              {randomRecipe.category}
            </span>

            <p className="mt-5 leading-7 text-cacao/80">
              {randomRecipe.description ||
                'Aucune description pour cette recette.'}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-linen p-4">
                <p className="text-sm font-bold text-hazel">Temps total</p>
                <p className="mt-1 text-lg font-bold text-espresso sm:text-xl">
                  {randomRecipe.prepTime + randomRecipe.cookTime} min
                </p>
              </div>

              <div className="rounded-2xl bg-linen p-4">
                <p className="text-sm font-bold text-hazel">Portions</p>
                <p className="mt-1 text-lg font-bold text-espresso sm:text-xl">
                  {randomRecipe.servings} pers.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <Button to={`/recipes/${randomRecipe.id}`}>Voir la recette</Button>

              <Button
                type="button"
                variant="secondary"
                onClick={launchRandomRecipe}
              >
                Relancer 🎲
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-lg font-bold text-espresso">
              Aucune recette disponible.
            </p>

            <p className="mt-2 text-cacao/80">
              Ajoute une recette pour utiliser le bouton magique.
            </p>
          </div>
        )}
      </Modal>
    </>
  )
}