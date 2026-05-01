import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import RecipeCard from '../components/recipes/RecipeCard'
import { RECIPE_CATEGORIES } from '../data/recipeOptions'
import { getRecipes } from '../services/recipes'
import type { Recipe } from '../types/recipe'

type SortOption = 'name' | 'time' | 'difficulty'

type RecipeCategoryOption = (typeof RECIPE_CATEGORIES)[number]

type PageBackground = {
  backgroundColor: string
  backgroundImage: string
  backgroundSize: string
  backgroundAttachment: string
  backgroundRepeat: string
}

function createEmojiWallpaper(emoji: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" fill="transparent" />

      <text x="18" y="48" font-size="36" opacity="0.28">${emoji}</text>
      <text x="100" y="108" font-size="40" opacity="0.24">${emoji}</text>
      <text x="45" y="140" font-size="26" opacity="0.16">${emoji}</text>
    </svg>
  `

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function getCategoryBackground(
  category: RecipeCategoryOption | null,
): PageBackground | null {
  if (!category) return null

  const categoryName = category.label.toLowerCase()

  if (categoryName.includes('boisson')) {
    return {
      backgroundColor: '#9BEAFF',
      backgroundImage: createEmojiWallpaper('🥤'),
      backgroundSize: '160px 160px',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'repeat',
    }
  }

  return null
}

export default function RecipesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('name')

  const categoryParam = searchParams.get('category')
  const viewParam = searchParams.get('view')

  const showAllRecipes = viewParam === 'all'

  const selectedCategory = useMemo(() => {
    if (!categoryParam) return null

    return (
      RECIPE_CATEGORIES.find((category) => category.value === categoryParam) ??
      null
    )
  }, [categoryParam])

  const categoryBackground = useMemo(() => {
    return getCategoryBackground(selectedCategory)
  }, [selectedCategory])

  useEffect(() => {
    const previousBackgroundColor = document.body.style.backgroundColor
    const previousBackgroundImage = document.body.style.backgroundImage
    const previousBackgroundSize = document.body.style.backgroundSize
    const previousBackgroundAttachment = document.body.style.backgroundAttachment
    const previousBackgroundRepeat = document.body.style.backgroundRepeat

    if (categoryBackground) {
      document.body.style.backgroundColor = categoryBackground.backgroundColor
      document.body.style.backgroundImage = categoryBackground.backgroundImage
      document.body.style.backgroundSize = categoryBackground.backgroundSize
      document.body.style.backgroundAttachment =
        categoryBackground.backgroundAttachment
      document.body.style.backgroundRepeat = categoryBackground.backgroundRepeat
    } else {
      document.body.style.backgroundColor = ''
      document.body.style.backgroundImage = ''
      document.body.style.backgroundSize = ''
      document.body.style.backgroundAttachment = ''
      document.body.style.backgroundRepeat = ''
    }

    return () => {
      document.body.style.backgroundColor = previousBackgroundColor
      document.body.style.backgroundImage = previousBackgroundImage
      document.body.style.backgroundSize = previousBackgroundSize
      document.body.style.backgroundAttachment = previousBackgroundAttachment
      document.body.style.backgroundRepeat = previousBackgroundRepeat
    }
  }, [categoryBackground])

  useEffect(() => {
    let ignore = false

    getRecipes()
      .then((data) => {
        if (!ignore) {
          setRecipes(data)
        }
      })
      .catch((error) => {
        if (!ignore) {
          console.error(error)
          setErrorMessage('Impossible de charger les recettes.')
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

  const filteredRecipes = useMemo(() => {
    let result = [...recipes]

    if (selectedCategory) {
      result = result.filter(
        (recipe) => recipe.category === selectedCategory.value,
      )
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

  const hasActiveFilters =
    search.trim().length > 0 || selectedCategory !== null || showAllRecipes

  function selectCategory(categoryValue: string) {
    setSearchParams({ category: categoryValue })
  }

  function showAll() {
    setSearchParams({ view: 'all' })
  }

  function resetFilters() {
    setSearch('')
    setSort('name')
    setSearchParams({})
  }

  if (loading) {
    return (
      <section className="rounded-[2rem] bg-white p-8 text-stone-600 shadow-sm ring-1 ring-orange-100">
        Chargement des recettes...
      </section>
    )
  }

  return (
    <section className="space-y-10">
      <div className="overflow-hidden rounded-[2.5rem] bg-[#fffaf3]/95 p-8 shadow-sm ring-1 ring-orange-100 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex w-fit items-center gap-2 rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-orange-700">
              <span>📖</span>
              <span>Le carnet</span>
            </div>

            <h1 className="text-4xl font-black leading-tight text-stone-950 md:text-5xl">
              Toutes les recettes
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
              Parcours le carnet par grandes familles, retrouve une recette avec
              la recherche ou affiche directement tous les petits plats de la
              maison.
            </p>
          </div>

          <button
            type="button"
            onClick={showAll}
            className="w-fit rounded-full bg-orange-500 px-7 py-4 font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md"
          >
            Voir tout le carnet
          </button>
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <p className="text-sm font-bold text-stone-500">Recettes du carnet</p>

          <p className="mt-3 text-4xl font-black text-stone-950">
            {recipes.length}
          </p>

          <p className="mt-1 text-sm font-medium text-stone-500">
            recette{recipes.length > 1 ? 's' : ''} enregistrée
            {recipes.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <p className="text-sm font-bold text-stone-500">Résultats affichés</p>

          <p className="mt-3 text-4xl font-black text-stone-950">
            {hasActiveFilters ? filteredRecipes.length : recipes.length}
          </p>

          <p className="mt-1 text-sm font-medium text-stone-500">
            recette
            {(hasActiveFilters ? filteredRecipes.length : recipes.length) > 1
              ? 's'
              : ''}{' '}
            disponible
            {(hasActiveFilters ? filteredRecipes.length : recipes.length) > 1
              ? 's'
              : ''}
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <p className="text-sm font-bold text-stone-500">
            Familles utilisées
          </p>

          <p className="mt-3 text-4xl font-black text-stone-950">
            {usedCategoriesCount}
          </p>

          <p className="mt-1 text-sm font-medium text-stone-500">
            sur {RECIPE_CATEGORIES.length} catégories
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
        <div className="mb-5">
          <p className="font-bold text-orange-600">Recherche rapide</p>
          <h2 className="text-2xl font-black text-stone-950">
            Trouver une recette
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)

              if (!event.target.value.trim() && !selectedCategory) {
                setSearchParams(showAllRecipes ? { view: 'all' } : {})
              }
            }}
            placeholder="Nom, ingrédient, tag..."
            className="rounded-2xl border border-orange-100 bg-[#fffdf9] px-4 py-3 text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />

          <select
            value={selectedCategory?.value ?? ''}
            onChange={(event) => {
              const value = event.target.value

              if (!value) {
                if (showAllRecipes || search.trim()) {
                  setSearchParams(showAllRecipes ? { view: 'all' } : {})
                } else {
                  setSearchParams({})
                }

                return
              }

              selectCategory(value)
            }}
            className="rounded-2xl border border-orange-100 bg-[#fffdf9] px-4 py-3 text-stone-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
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
            className="rounded-2xl border border-orange-100 bg-[#fffdf9] px-4 py-3 text-stone-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          >
            <option value="name">Trier par nom</option>
            <option value="time">Temps le plus court</option>
            <option value="difficulty">Difficulté</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-full border border-orange-200 bg-white px-5 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
          >
            Revenir aux catégories
          </button>
        )}
      </div>

      {!hasActiveFilters && (
        <div>
          <div className="mb-6">
            <p className="font-bold text-orange-600">Catégories</p>

            <h2 className="text-3xl font-black text-stone-950">
              Parcourir par grandes familles
            </h2>

            <p className="mt-2 text-stone-600">
              Choisis une famille pour découvrir les recettes associées.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categoriesWithCount.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => selectCategory(category.value)}
                className="group rounded-[2rem] border border-orange-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[#fff1e6] text-4xl transition group-hover:scale-105">
                    {category.emoji}
                  </div>

                  <span className="rounded-full bg-[#f4e8dc] px-3 py-1 text-sm font-bold text-stone-700">
                    {category.count} recette{category.count > 1 ? 's' : ''}
                  </span>
                </div>

                <h3 className="mb-2 text-2xl font-black text-stone-950">
                  {category.label}
                </h3>

                <p className="leading-7 text-stone-600">
                  {category.description}
                </p>

                <p className="mt-5 font-bold text-orange-700">
                  Voir les recettes →
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-bold text-orange-600">
                {selectedCategory
                  ? selectedCategory.label
                  : showAllRecipes
                    ? 'Tout le carnet'
                    : 'Recherche rapide'}
              </p>

              <h2 className="text-3xl font-black text-stone-950">
                {selectedCategory
                  ? `Recettes : ${selectedCategory.label}`
                  : showAllRecipes
                    ? 'Toutes les recettes'
                    : 'Résultats'}
              </h2>

              <p className="mt-2 text-stone-600">
                {filteredRecipes.length} recette
                {filteredRecipes.length > 1 ? 's' : ''} trouvée
                {filteredRecipes.length > 1 ? 's' : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="w-fit rounded-full border border-orange-200 bg-white px-5 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
            >
              Revenir aux catégories
            </button>
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
              <p className="text-lg font-bold text-stone-950">
                Aucune recette trouvée
              </p>

              <p className="mt-2 text-stone-600">
                Essaie une autre recherche ou une autre catégorie.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 rounded-full bg-orange-500 px-7 py-4 font-bold text-white transition hover:bg-orange-600"
              >
                Revenir aux catégories
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}