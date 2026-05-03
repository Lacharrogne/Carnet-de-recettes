import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

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
      <section className="space-y-14">
        <div className="overflow-hidden rounded-[2.5rem] bg-[#fffaf3] shadow-sm ring-1 ring-orange-100">
          <div className="grid gap-10 px-6 py-10 md:grid-cols-[1.1fr_0.9fr] md:px-12 md:py-14">
            <div className="flex flex-col justify-center">
              <div className="mb-6 flex w-fit items-center gap-3 rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-orange-700">
                <span>🍲</span>
                <span>Carnet de cuisine familial</span>
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight text-stone-950 md:text-6xl">
                Les recettes de la maison, toujours sous la main.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
                Un petit carnet chaleureux pour retrouver vos plats préférés,
                garder les idées de Chloé & Maxime et préparer facilement les
                prochains repas.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/recipes"
                  className="rounded-full bg-orange-500 px-7 py-4 font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md"
                >
                  Voir les recettes
                </Link>

                <Link
                  to="/add-recipe"
                  className="rounded-full border border-orange-200 bg-white px-7 py-4 font-bold text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-50"
                >
                  Ajouter une recette
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-orange-100/70 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-amber-100/80 blur-2xl" />

              <div className="relative rounded-[2.25rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
                <div className="mb-6 flex items-center gap-5">
                  <div className="relative h-24 w-24 shrink-0 overflow-visible">
                    <img
                      src="/ChatGPT Image 1 mai 2026, 04_35_16.png"
                      alt="Logo Carnet de recettes"
                      className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-md"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
                      Aujourd’hui
                    </p>
                    <p className="text-xl font-black text-stone-950">
                      On cuisine quoi ?
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={launchRandomRecipe}
                  disabled={loading || recipes.length === 0 || randomizing}
                  className="group w-full rounded-[2rem] bg-orange-500 p-7 text-left text-white shadow-sm transition hover:-translate-y-1 hover:bg-orange-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <div className="flex items-center justify-between gap-5">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-orange-100">
                        Bouton magique
                      </p>

                      <p className="mt-4 text-3xl font-black leading-tight">
                        Me proposer une recette
                      </p>

                      <p className="mt-4 max-w-sm text-base font-bold leading-7 text-orange-50">
                        Clique ici et le carnet choisit une recette au hasard.
                      </p>
                    </div>

                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem] bg-white/20 text-4xl transition group-hover:rotate-12 group-hover:scale-105">
                      🎲
                    </div>
                  </div>
                </button>

                <div className="mt-5 rounded-[1.5rem] bg-[#f7eee6] p-5">
                  <p className="text-sm font-bold text-stone-500">
                    Dernière recette ajoutée
                  </p>

                  <p className="mt-2 text-2xl font-black text-stone-950">
                    {latestRecipes[0]?.title ?? 'Aucune recette pour le moment'}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {latestRecipes[0]?.description ??
                      'Ajoute une première recette pour commencer ton carnet.'}
                  </p>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-dashed border-orange-200 bg-orange-50/60 p-4 text-sm font-medium text-stone-600">
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

        <div>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-bold text-orange-600">Explorer</p>
              <h2 className="text-3xl font-black text-stone-950">
                Les grandes familles de recettes
              </h2>
              <p className="mt-2 text-stone-600">
                Parcours le carnet selon tes envies du moment.
              </p>
            </div>

            <Link
              to="/recipes"
              className="hidden font-bold text-orange-600 hover:text-orange-700 md:block"
            >
              Toutes les recettes →
            </Link>
          </div>

          {loading ? (
            <div className="rounded-[2rem] bg-white p-8 text-stone-600 shadow-sm ring-1 ring-orange-100">
              Chargement des catégories...
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {categoriesWithCount.map((category) => (
                <Link
                  key={category.value}
                  to={`/recipes?category=${encodeURIComponent(
                    category.value,
                  )}`}
                  className="group rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#fff1e6] text-3xl transition group-hover:scale-105">
                      {category.emoji}
                    </div>

                    <span className="rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-stone-700">
                      {category.count}{' '}
                      {category.count > 1 ? 'recettes' : 'recette'}
                    </span>
                  </div>

                  <h3 className="mt-8 text-2xl font-black text-stone-950">
                    {category.label}
                  </h3>

                  <p className="mt-3 leading-7 text-stone-600">
                    {category.description}
                  </p>

                  <p className="mt-6 font-bold text-orange-600 transition group-hover:text-orange-700">
                    Voir les recettes →
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-bold text-orange-600">Nouveautés</p>
              <h2 className="text-3xl font-black text-stone-950">
                Les dernières recettes ajoutées
              </h2>
              <p className="mt-2 text-stone-600">
                Les nouvelles idées à tester à la maison.
              </p>
            </div>

            <Link
              to="/recipes"
              className="hidden font-bold text-orange-600 hover:text-orange-700 md:block"
            >
              Voir plus →
            </Link>
          </div>

          {loading ? (
            <div className="rounded-[2rem] bg-white p-8 text-stone-600 shadow-sm ring-1 ring-orange-100">
              Chargement des recettes...
            </div>
          ) : latestRecipes.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
              <p className="text-lg font-bold text-stone-950">
                Aucune recette pour le moment.
              </p>

              <p className="mt-2 text-stone-600">
                Ajoute ta première recette pour la voir apparaître ici.
              </p>

              <Link
                to="/add-recipe"
                className="mt-6 inline-block rounded-full bg-orange-500 px-7 py-4 font-bold text-white transition hover:bg-orange-600"
              >
                Ajouter une recette
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {latestRecipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  to={`/recipes/${recipe.id}`}
                  className="group overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-48 items-center justify-center bg-[#fff1e6]">
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-6xl">
                        {recipe.image || '🍽️'}
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
                      {recipe.category}
                    </span>

                    <h3 className="mt-4 text-xl font-black text-stone-950">
                      {recipe.title}
                    </h3>

                    <p className="mt-3 line-clamp-2 leading-7 text-stone-600">
                      {recipe.description ||
                        'Aucune description pour cette recette.'}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-stone-500">
                      <span>⏱️ {recipe.prepTime + recipe.cookTime} min</span>
                      <span>🍽️ {recipe.servings} pers.</span>
                    </div>

                    <p className="mt-5 border-t border-orange-100 pt-4 font-bold text-orange-600">
                      Voir la recette →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {randomModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/45 px-5 py-8 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-[2.5rem] bg-white p-6 shadow-2xl ring-1 ring-orange-100">
            <button
              type="button"
              onClick={closeRandomModal}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff5ec] text-xl font-black text-stone-700 transition hover:bg-orange-100"
              aria-label="Fermer"
            >
              ×
            </button>

            {randomizing ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-orange-500 text-6xl shadow-lg">
                  <span className="animate-spin">🎲</span>
                </div>

                <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                  Le carnet choisit...
                </p>

                <h2 className="mt-3 text-3xl font-black text-stone-950">
                  On mélange les idées
                </h2>

                <p className="mt-3 max-w-sm text-stone-600">
                  Une recette arrive dans quelques secondes.
                </p>
              </div>
            ) : randomRecipe ? (
              <div>
                <div className="mb-5 flex items-center gap-4 pr-12">
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

                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                      Recette surprise
                    </p>

                    <h2 className="text-2xl font-black text-stone-950">
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
                  <div className="rounded-2xl bg-[#fff5ec] p-4">
                    <p className="text-sm font-bold text-stone-500">
                      Temps total
                    </p>
                    <p className="mt-1 text-xl font-black text-stone-950">
                      {randomRecipe.prepTime + randomRecipe.cookTime} min
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#fff5ec] p-4">
                    <p className="text-sm font-bold text-stone-500">
                      Portions
                    </p>
                    <p className="mt-1 text-xl font-black text-stone-950">
                      {randomRecipe.servings} pers.
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    to={`/recipes/${randomRecipe.id}`}
                    onClick={closeRandomModal}
                    className="rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600"
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