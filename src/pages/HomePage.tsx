import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RECIPE_CATEGORIES } from '../data/recipeOptions'
import { getRecipes } from '../services/recipes'
import type { Recipe } from '../types/recipe'

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

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

  const usedCategoriesCount = useMemo(() => {
    return categoriesWithCount.filter((category) => category.count > 0).length
  }, [categoriesWithCount])

  return (
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

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[1.5rem] bg-[#fff5ec] p-5">
                  <p className="text-4xl font-black text-stone-950">
                    {recipes.length}
                  </p>
                  <p className="mt-1 text-sm font-medium text-stone-600">
                    recette{recipes.length > 1 ? 's' : ''} enregistrée
                    {recipes.length > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-[#fff5ec] p-5">
                  <p className="text-4xl font-black text-stone-950">
                    {usedCategoriesCount}
                  </p>
                  <p className="mt-1 text-sm font-medium text-stone-600">
                    catégorie{usedCategoriesCount > 1 ? 's' : ''} utilisée
                    {usedCategoriesCount > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="col-span-2 rounded-[1.5rem] bg-[#f7eee6] p-5">
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
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-dashed border-orange-200 bg-orange-50/60 p-4 text-sm font-medium text-stone-600">
                💡 Astuce : ajoute tes recettes du quotidien, tes favoris et les
                ingrédients à ta liste de courses.
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
                to={`/recipes?category=${encodeURIComponent(category.value)}`}
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
                    <span className="text-6xl">{recipe.image || '🍽️'}</span>
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
  )
}