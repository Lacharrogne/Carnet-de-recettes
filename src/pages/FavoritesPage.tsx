import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import RecipeCard from '../components/recipes/RecipeCard'
import { RECIPE_CATEGORIES } from '../data/recipeOptions'
import { getFavoriteRecipes } from '../services/favorites'
import type { Recipe, RecipeCategory } from '../types/recipe'

type SortOption = 'recent' | 'name' | 'time' | 'difficulty'

export default function FavoritesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | ''>(
    '',
  )
  const [sort, setSort] = useState<SortOption>('recent')

  function refreshFavorites() {
    setLoading(true)
    setErrorMessage('')
    setRefreshKey((currentValue) => currentValue + 1)
  }

  useEffect(() => {
    let ignore = false

    getFavoriteRecipes()
      .then((data) => {
        if (!ignore) {
          setRecipes(data)
        }
      })
      .catch((error) => {
        if (!ignore) {
          console.error(error)
          setErrorMessage('Impossible de charger tes favoris.')
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
  }, [refreshKey])

  const filteredRecipes = useMemo(() => {
    let result = [...recipes]

    if (selectedCategory) {
      result = result.filter((recipe) => recipe.category === selectedCategory)
    }

    if (search.trim()) {
      const normalizedSearch = search.toLowerCase().trim()

      result = result.filter((recipe) => {
        const titleMatch = recipe.title.toLowerCase().includes(normalizedSearch)

        const descriptionMatch = recipe.description
          .toLowerCase()
          .includes(normalizedSearch)

        const categoryMatch = recipe.category
          .toLowerCase()
          .includes(normalizedSearch)

        const tagMatch = recipe.tags.some((tag) =>
          tag.toLowerCase().includes(normalizedSearch),
        )

        const ingredientMatch = recipe.ingredients.some((ingredient) =>
          ingredient.toLowerCase().includes(normalizedSearch),
        )

        return (
          titleMatch ||
          descriptionMatch ||
          categoryMatch ||
          tagMatch ||
          ingredientMatch
        )
      })
    }

    if (sort === 'recent') {
      result.sort((a, b) => b.id - a.id)
    }

    if (sort === 'name') {
      result.sort((a, b) => a.title.localeCompare(b.title))
    }

    if (sort === 'time') {
      result.sort(
        (a, b) => a.prepTime + a.cookTime - (b.prepTime + b.cookTime),
      )
    }

    if (sort === 'difficulty') {
      const difficultyOrder = {
        Facile: 1,
        Moyen: 2,
        Difficile: 3,
      }

      result.sort(
        (a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty],
      )
    }

    return result
  }, [recipes, search, selectedCategory, sort])

  const favoriteCategoriesCount = useMemo(() => {
    return new Set(recipes.map((recipe) => recipe.category)).size
  }, [recipes])

  const hasActiveFilters = search.trim().length > 0 || selectedCategory !== ''

  function resetFilters() {
    setSearch('')
    setSelectedCategory('')
    setSort('recent')
  }

  if (loading) {
    return (
      <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-orange-100">
        <p className="font-medium text-stone-600">Chargement des favoris...</p>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] bg-[#fff5ec] p-8 shadow-sm ring-1 ring-orange-100">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-white text-3xl shadow-sm ring-1 ring-orange-100">
              ♥
            </div>

            <div>
              <p className="font-bold text-orange-700">Espace personnel</p>

              <h1 className="mt-2 text-4xl font-black leading-tight text-stone-950">
                Mes favoris
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                Retrouve les recettes que tu as gardées de côté pour les refaire
                plus tard, les partager ou préparer tes repas.
              </p>
            </div>
          </div>

          <Link
            to="/recipes"
            className="w-fit rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700"
          >
            Explorer les recettes
          </Link>
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 font-medium text-red-700 ring-1 ring-red-100">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
            ❤️
          </div>

          <p className="mt-5 text-sm font-bold text-stone-500">Total</p>

          <p className="mt-2 text-4xl font-black text-stone-950">
            {recipes.length}
          </p>

          <p className="mt-1 text-sm text-stone-500">
            recette{recipes.length > 1 ? 's' : ''} favorite
            {recipes.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
            🔎
          </div>

          <p className="mt-5 text-sm font-bold text-stone-500">Résultats</p>

          <p className="mt-2 text-4xl font-black text-stone-950">
            {filteredRecipes.length}
          </p>

          <p className="mt-1 text-sm text-stone-500">
            recette{filteredRecipes.length > 1 ? 's' : ''} affichée
            {filteredRecipes.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
            🧺
          </div>

          <p className="mt-5 text-sm font-bold text-stone-500">
            Catégories favorites
          </p>

          <p className="mt-2 text-4xl font-black text-stone-950">
            {favoriteCategoriesCount}
          </p>

          <p className="mt-1 text-sm text-stone-500">
            sur {RECIPE_CATEGORIES.length} catégories
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
        <div className="mb-5">
          <p className="font-bold text-orange-700">Recherche</p>

          <h2 className="mt-1 text-2xl font-black text-stone-950">
            Filtrer mes recettes favorites
          </h2>

          <p className="mt-2 text-stone-600">
            Cherche une recette par nom, ingrédient, tag ou catégorie.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher dans mes favoris..."
            className="rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3 outline-none transition focus:border-orange-500"
          />

          <select
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(event.target.value as RecipeCategory | '')
            }
            className="rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3 outline-none transition focus:border-orange-500"
          >
            <option value="">Toutes les catégories</option>

            {RECIPE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3 outline-none transition focus:border-orange-500"
          >
            <option value="recent">Plus récentes</option>
            <option value="name">Trier par nom</option>
            <option value="time">Temps le plus court</option>
            <option value="difficulty">Difficulté</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-2xl border border-orange-200 bg-white px-5 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl">
            ❤️
          </div>

          <p className="mt-5 text-lg font-black text-stone-950">
            Aucune recette favorite pour le moment
          </p>

          <p className="mt-2 text-stone-600">
            Ajoute des recettes en favori avec le bouton cœur pour les retrouver
            ici facilement.
          </p>

          <Link
            to="/recipes"
            className="mt-6 inline-block rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700"
          >
            Explorer les recettes
          </Link>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl">
            🔎
          </div>

          <p className="mt-5 text-lg font-black text-stone-950">
            Aucun favori trouvé
          </p>

          <p className="mt-2 text-stone-600">
            Essaie une autre recherche ou une autre catégorie.
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700"
          >
            Voir tous mes favoris
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <p className="font-bold text-orange-700">Recettes gardées</p>

            <h2 className="mt-1 text-3xl font-black text-stone-950">
              Mes recettes favorites
            </h2>

            <p className="mt-2 text-stone-600">
              {filteredRecipes.length} recette
              {filteredRecipes.length > 1 ? 's' : ''} affichée
              {filteredRecipes.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onFavoriteChange={refreshFavorites}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}