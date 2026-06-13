import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import RecipeCard from '../components/recipes/RecipeCard'
import Button from '../components/ui/Button'
import Chip from '../components/ui/Chip'
import SectionHeader from '../components/ui/SectionHeader'
import { RecipeCardGridSkeleton } from '../components/ui/Skeleton'
import { getHomeCardStyle } from '../data/categoryStyles'
import { RECIPE_CATEGORIES } from '../data/recipeOptions'
import { getRecipes } from '../services/recipes'
import type { Recipe } from '../types/recipe'

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

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

  const latestRecipes = useMemo(() => {
    return recipes.slice(0, 3)
  }, [recipes])

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

              <div className="relative rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100 sm:rounded-[2.25rem] sm:p-6">
                <div className="mb-5 flex items-center gap-4 sm:mb-6 sm:gap-5">
                  <div className="relative h-20 w-20 shrink-0 overflow-visible sm:h-24 sm:w-24">
                    <img
                      src="/ChatGPT Image 1 mai 2026, 04_35_16.png"
                      alt="Logo Carnet de recettes"
                      className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-md sm:h-32 sm:w-32"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-600 sm:text-sm">
                      Aujourd’hui
                    </p>
                    <p className="text-lg font-black text-stone-950 sm:text-xl">
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

                <div className="mt-5 rounded-[1.5rem] bg-[#f7eee6] p-4 sm:p-5">
                  <p className="text-sm font-bold text-stone-500">
                    Dernière recette ajoutée
                  </p>

                  <p className="mt-2 line-clamp-2 text-xl font-black text-stone-950 sm:text-2xl">
                    {latestRecipes[0]?.title ?? 'Aucune recette pour le moment'}
                  </p>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
                    {latestRecipes[0]?.description ??
                      'Ajoute une première recette pour commencer ton carnet.'}
                  </p>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-dashed border-orange-200 bg-orange-50/60 p-4 text-sm font-medium leading-6 text-stone-600 sm:mt-6">
                  💡 Astuce : ajoute tes recettes du quotidien, tes favoris et
                  les ingrédients à ta liste de courses.
                </div>
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-orange-100 sm:rounded-[2.5rem] sm:p-8 md:p-10">
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
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-orange-100 sm:rounded-[2.5rem] sm:p-8 md:p-10">
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

      {randomModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/45 px-4 py-5 backdrop-blur-sm sm:px-5 sm:py-8">
          <div className="relative max-h-[calc(100dvh-40px)] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl ring-1 ring-orange-100 sm:rounded-[2.5rem] sm:p-6">
            <button
              type="button"
              onClick={closeRandomModal}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-cream-100 text-xl font-black text-stone-700 transition hover:bg-orange-100 sm:right-5 sm:top-5"
              aria-label="Fermer"
            >
              ×
            </button>

            {randomizing ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center sm:min-h-[360px]">
                <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-orange-500 text-5xl shadow-lg sm:mb-8 sm:h-28 sm:w-28 sm:rounded-[2rem] sm:text-6xl">
                  <span className="animate-spin">🎲</span>
                </div>

                <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                  Le carnet choisit...
                </p>

                <h2 className="mt-3 text-2xl font-black text-stone-950 sm:text-3xl">
                  On mélange les idées
                </h2>

                <p className="mt-3 max-w-sm text-stone-600">
                  Une recette arrive dans quelques secondes.
                </p>
              </div>
            ) : randomRecipe ? (
              <div>
                <div className="mb-5 flex items-center gap-4 pr-10 sm:pr-12">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#fff1e6] text-4xl">
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
                    <p className="text-xs font-black uppercase tracking-wide text-orange-600 sm:text-sm">
                      Recette surprise
                    </p>

                    <h2 className="line-clamp-2 text-xl font-black text-stone-950 sm:text-2xl">
                      {randomRecipe.title}
                    </h2>
                  </div>
                </div>

                <span className="inline-block rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700">
                  {randomRecipe.category}
                </span>

                <p className="mt-5 leading-7 text-stone-600">
                  {randomRecipe.description ||
                    'Aucune description pour cette recette.'}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-cream-100 p-4">
                    <p className="text-sm font-bold text-stone-500">
                      Temps total
                    </p>
                    <p className="mt-1 text-lg font-black text-stone-950 sm:text-xl">
                      {randomRecipe.prepTime + randomRecipe.cookTime} min
                    </p>
                  </div>

                  <div className="rounded-2xl bg-cream-100 p-4">
                    <p className="text-sm font-bold text-stone-500">
                      Portions
                    </p>
                    <p className="mt-1 text-lg font-black text-stone-950 sm:text-xl">
                      {randomRecipe.servings} pers.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
                  <Link
                    to={`/recipes/${randomRecipe.id}`}
                    onClick={closeRandomModal}
                    className="rounded-full bg-orange-500 px-6 py-3 text-center font-black text-white shadow-sm transition hover:bg-orange-600"
                  >
                    Voir la recette
                  </Link>

                  <button
                    type="button"
                    onClick={launchRandomRecipe}
                    className="rounded-full border border-orange-200 bg-white px-6 py-3 font-black text-orange-700 transition hover:bg-orange-50"
                  >
                    Relancer 🎲
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-lg font-black text-stone-950">
                  Aucune recette disponible.
                </p>

                <p className="mt-2 text-stone-600">
                  Ajoute une recette pour utiliser le bouton magique.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}