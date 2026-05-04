import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import RecipeCard from '../components/recipes/RecipeCard'
import { RECIPE_CATEGORIES } from '../data/recipeOptions'
import { getRecipes } from '../services/recipes'
import type { Recipe } from '../types/recipe'

type SortOption = 'name' | 'time' | 'difficulty'

type CategoryVisualStyle = {
  cardBg: string
  border: string
  iconBg: string
  badgeBg: string
  badgeText: string
  accentText: string
  subtleText: string
  topGlow: string
  bottomGlow: string
  miniIcons: string[]
}

type CategoryPageAmbience = {
  pageBg: string
  ring: string
  accentText: string
  buttonText: string
  buttonHover: string
  glowOne: string
  glowTwo: string
  emojis: string[]
}

const DEFAULT_CATEGORY_STYLE: CategoryVisualStyle = {
  cardBg: 'bg-gradient-to-br from-[#fffaf3] to-white',
  border: 'border-orange-100',
  iconBg: 'bg-[#fff1e6]',
  badgeBg: 'bg-[#f4e8dc]',
  badgeText: 'text-stone-700',
  accentText: 'text-orange-700',
  subtleText: 'text-stone-600',
  topGlow: 'bg-orange-100/70',
  bottomGlow: 'bg-amber-50/80',
  miniIcons: ['🍽️', '✨'],
}

const CATEGORY_STYLES: Record<string, CategoryVisualStyle> = {
  'Apéritifs & entrées': {
    cardBg: 'bg-gradient-to-br from-[#fffaf5] to-[#fffefb]',
    border: 'border-[#f1dcc8]',
    iconBg: 'bg-[#fff1e6]',
    badgeBg: 'bg-[#f8e7d8]',
    badgeText: 'text-[#8a5a35]',
    accentText: 'text-[#d06a2f]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#ffd8b5]/60',
    bottomGlow: 'bg-[#ffe8d6]/80',
    miniIcons: ['🫒', '🍅'],
  },

  'Plats & accompagnements': {
    cardBg: 'bg-gradient-to-br from-[#fff8f1] to-[#fffdf9]',
    border: 'border-[#ecd8c2]',
    iconBg: 'bg-[#fff0df]',
    badgeBg: 'bg-[#f8e5cf]',
    badgeText: 'text-[#8b5e34]',
    accentText: 'text-[#c96f30]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#ffd3a8]/60',
    bottomGlow: 'bg-[#ffe9d6]/80',
    miniIcons: ['🍝', '🥘'],
  },

  'Desserts & goûters': {
    cardBg: 'bg-gradient-to-br from-[#fff7f8] to-[#fffdfa]',
    border: 'border-[#f2d9df]',
    iconBg: 'bg-[#fff0f3]',
    badgeBg: 'bg-[#fde4ea]',
    badgeText: 'text-[#9b5a6d]',
    accentText: 'text-[#d46b87]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#ffc8d5]/55',
    bottomGlow: 'bg-[#ffe3ea]/75',
    miniIcons: ['🍓', '🧁'],
  },

  'Petit-déjeuner & brunch': {
    cardBg: 'bg-gradient-to-br from-[#fffaf0] to-[#fffef9]',
    border: 'border-[#f1e0b9]',
    iconBg: 'bg-[#fff4d9]',
    badgeBg: 'bg-[#f9edc8]',
    badgeText: 'text-[#8a6a1e]',
    accentText: 'text-[#c28a0c]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#ffe08c]/55',
    bottomGlow: 'bg-[#fff2c7]/75',
    miniIcons: ['☕', '🥐'],
  },

  Boissons: {
    cardBg: 'bg-gradient-to-br from-[#f3fbff] to-[#fbffff]',
    border: 'border-[#d7ebf4]',
    iconBg: 'bg-[#eaf7fd]',
    badgeBg: 'bg-[#dff1fb]',
    badgeText: 'text-[#46718a]',
    accentText: 'text-[#3b87a8]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#c5e8f8]/55',
    bottomGlow: 'bg-[#dbf7f0]/70',
    miniIcons: ['🍋', '🧊'],
  },

  Healthy: {
    cardBg: 'bg-gradient-to-br from-[#f6fcf4] to-[#fcfffb]',
    border: 'border-[#dcebd8]',
    iconBg: 'bg-[#ebf7e7]',
    badgeBg: 'bg-[#dff0d9]',
    badgeText: 'text-[#53774f]',
    accentText: 'text-[#5b9856]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#cfe8c8]/55',
    bottomGlow: 'bg-[#e8f8e3]/75',
    miniIcons: ['🥑', '🌿'],
  },
}

const FALLBACK_CATEGORY_STYLES: CategoryVisualStyle[] = [
  DEFAULT_CATEGORY_STYLE,
  {
    cardBg: 'bg-gradient-to-br from-[#fff8f2] to-white',
    border: 'border-[#f0dfcf]',
    iconBg: 'bg-[#fff1e6]',
    badgeBg: 'bg-[#f6e8db]',
    badgeText: 'text-[#8a5f3d]',
    accentText: 'text-[#cc6d2f]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#ffd7bb]/60',
    bottomGlow: 'bg-[#fff1e3]/80',
    miniIcons: ['🍴', '✨'],
  },
  {
    cardBg: 'bg-gradient-to-br from-[#f8fafc] to-white',
    border: 'border-[#e4e9ef]',
    iconBg: 'bg-[#eef3f7]',
    badgeBg: 'bg-[#e6edf4]',
    badgeText: 'text-[#566575]',
    accentText: 'text-[#64748b]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#dbe7f1]/60',
    bottomGlow: 'bg-[#f1f5f9]/80',
    miniIcons: ['🍽️', '⭐'],
  },
]

const DEFAULT_CATEGORY_PAGE_AMBIENCE: CategoryPageAmbience = {
  pageBg: 'bg-white/95',
  ring: 'ring-orange-100',
  accentText: 'text-orange-600',
  buttonText: 'text-orange-700',
  buttonHover: 'hover:bg-orange-50',
  glowOne: 'bg-orange-100/50',
  glowTwo: 'bg-amber-100/50',
  emojis: ['🍽️', '✨', '🥄'],
}

const CATEGORY_PAGE_AMBIENCES: Record<string, CategoryPageAmbience> = {
  'Apéritifs & entrées': {
    pageBg: 'bg-gradient-to-br from-[#f6fbef] via-[#fffdf8] to-[#fff3e8]',
    ring: 'ring-[#d9eacb]',
    accentText: 'text-[#4f8a3b]',
    buttonText: 'text-[#4f8a3b]',
    buttonHover: 'hover:bg-[#eef8e8]',
    glowOne: 'bg-[#b7df9a]/45',
    glowTwo: 'bg-[#ffb18a]/35',
    emojis: ['🫒', '🍅', '🥖', '🧀'],
  },

  'Plats & accompagnements': {
    pageBg: 'bg-gradient-to-br from-[#fff5e9] via-[#fffdf9] to-[#ffe8d2]',
    ring: 'ring-[#efd1b4]',
    accentText: 'text-[#c76525]',
    buttonText: 'text-[#c76525]',
    buttonHover: 'hover:bg-[#fff0df]',
    glowOne: 'bg-[#ffb879]/45',
    glowTwo: 'bg-[#f5c39c]/35',
    emojis: ['🍝', '🥘', '🧄', '🥔'],
  },

  'Desserts & goûters': {
    pageBg: 'bg-gradient-to-br from-[#fff3f6] via-[#fffdf9] to-[#ffe8f0]',
    ring: 'ring-[#f0cdd8]',
    accentText: 'text-[#cc5f7d]',
    buttonText: 'text-[#cc5f7d]',
    buttonHover: 'hover:bg-[#fff0f4]',
    glowOne: 'bg-[#ffb5c8]/45',
    glowTwo: 'bg-[#ffd6a5]/35',
    emojis: ['🍓', '🧁', '🍫', '🍰'],
  },

  'Petit-déjeuner & brunch': {
    pageBg: 'bg-gradient-to-br from-[#fff8dc] via-[#fffdf7] to-[#fff0c2]',
    ring: 'ring-[#ecd99b]',
    accentText: 'text-[#b47a12]',
    buttonText: 'text-[#b47a12]',
    buttonHover: 'hover:bg-[#fff4cf]',
    glowOne: 'bg-[#ffd970]/45',
    glowTwo: 'bg-[#f4b76b]/35',
    emojis: ['☕', '🥐', '🍯', '🥞'],
  },

  Boissons: {
    pageBg: 'bg-gradient-to-br from-[#eef9ff] via-[#fbffff] to-[#e8fff8]',
    ring: 'ring-[#cce8f2]',
    accentText: 'text-[#2f83a3]',
    buttonText: 'text-[#2f83a3]',
    buttonHover: 'hover:bg-[#eaf8ff]',
    glowOne: 'bg-[#a7ddf3]/45',
    glowTwo: 'bg-[#b7f0da]/35',
    emojis: ['🍋', '🧊', '🥤', '🍹'],
  },

  Healthy: {
    pageBg: 'bg-gradient-to-br from-[#effbea] via-[#fcfffb] to-[#e2f7dc]',
    ring: 'ring-[#cce5c5]',
    accentText: 'text-[#4d8f48]',
    buttonText: 'text-[#4d8f48]',
    buttonHover: 'hover:bg-[#eff9eb]',
    glowOne: 'bg-[#aad99f]/45',
    glowTwo: 'bg-[#d7efc7]/40',
    emojis: ['🥑', '🥦', '🌿', '🥬'],
  },
}

function getCategoryVisualStyle(categoryLabel: string, index: number) {
  return (
    CATEGORY_STYLES[categoryLabel] ??
    FALLBACK_CATEGORY_STYLES[index % FALLBACK_CATEGORY_STYLES.length]
  )
}

function getCategoryPageAmbience(categoryLabel: string | null) {
  if (!categoryLabel) return null

  return CATEGORY_PAGE_AMBIENCES[categoryLabel] ?? DEFAULT_CATEGORY_PAGE_AMBIENCE
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
      const difficultyOrder: Record<string, number> = {
        Facile: 1,
        Moyen: 2,
        Difficile: 3,
      }

      result.sort(
        (a, b) =>
          (difficultyOrder[a.difficulty] ?? 99) -
          (difficultyOrder[b.difficulty] ?? 99),
      )
    }

    return result
  }, [recipes, search, selectedCategory, sort])

  const hasActiveFilters =
    search.trim().length > 0 || selectedCategory !== null || showAllRecipes

  const activeCategoryAmbience = selectedCategory
    ? getCategoryPageAmbience(selectedCategory.label)
    : null

  const wallpaperEmojis = activeCategoryAmbience
    ? Array.from(
        { length: 72 },
        (_, index) =>
          activeCategoryAmbience.emojis[
            index % activeCategoryAmbience.emojis.length
          ],
      )
    : []

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
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-center">
          <div>
            <div className="mb-4 flex w-fit items-center gap-2 rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-orange-700">
              <span>📖</span>
              <span>Le carnet</span>
            </div>

            <h1 className="text-5xl font-black leading-tight text-stone-950 md:text-7xl">
              Trouver une recette
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
              Recherche par nom, ingrédient ou catégorie, puis retrouve
              rapidement tous les petits plats de la maison.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)

                if (!event.target.value.trim() && !selectedCategory) {
                  setSearchParams(showAllRecipes ? { view: 'all' } : {})
                }
              }}
              placeholder="Exemple : tarte, poulet, chocolat..."
              className="w-full rounded-2xl border border-orange-100 bg-[#fffdf9] px-5 py-4 text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />

            <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                className="rounded-2xl border border-orange-100 bg-[#fffdf9] px-5 py-4 text-stone-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
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
                className="rounded-2xl border border-orange-100 bg-[#fffdf9] px-5 py-4 text-stone-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                <option value="name">Trier par nom</option>
                <option value="time">Temps le plus court</option>
                <option value="difficulty">Difficulté</option>
              </select>
            </div>

            <button
              type="button"
              onClick={showAll}
              className="mt-5 w-full rounded-full bg-orange-500 px-7 py-4 font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md"
            >
              Voir tout le carnet
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </p>
      )}

      {!hasActiveFilters && (
        <div className="rounded-[2.5rem] bg-white/95 p-8 shadow-sm ring-1 ring-orange-100 md:p-10">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-bold text-orange-600">Catégories</p>

              <h2 className="text-3xl font-black text-stone-950 md:text-4xl">
                Parcourir par grandes familles
              </h2>

              <p className="mt-2 text-stone-600">
                Choisis une famille pour découvrir les recettes associées.
              </p>
            </div>

            <button
              type="button"
              onClick={showAll}
              className="w-fit rounded-full border border-orange-200 bg-white px-6 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
            >
              Afficher toutes les recettes
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categoriesWithCount.map((category, index) => {
              const visualStyle = getCategoryVisualStyle(category.label, index)

              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => selectCategory(category.value)}
                  className={`group relative overflow-hidden rounded-[2rem] border ${visualStyle.border} ${visualStyle.cardBg} p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(28,25,23,0.08)]`}
                >
                  <div
                    className={`pointer-events-none absolute right-0 top-0 h-28 w-28 -translate-y-6 translate-x-6 rounded-full blur-3xl ${visualStyle.topGlow}`}
                  />

                  <div
                    className={`pointer-events-none absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full blur-3xl ${visualStyle.bottomGlow}`}
                  />

                  <div className="relative z-10">
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div
                        className={`flex h-20 w-20 items-center justify-center rounded-[1.6rem] ${visualStyle.iconBg} text-4xl shadow-sm transition group-hover:scale-105`}
                      >
                        {category.emoji}
                      </div>

                      <span
                        className={`rounded-full ${visualStyle.badgeBg} px-4 py-2 text-sm font-bold ${visualStyle.badgeText}`}
                      >
                        {category.count} recette
                        {category.count > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="mb-4 flex gap-2">
                      {visualStyle.miniIcons.map((icon) => (
                        <span
                          key={icon}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-base shadow-sm ring-1 ring-black/5"
                        >
                          {icon}
                        </span>
                      ))}
                    </div>

                    <h3 className="mb-3 text-2xl font-black leading-tight text-stone-950">
                      {category.label}
                    </h3>

                    <p
                      className={`min-h-[84px] leading-7 ${visualStyle.subtleText}`}
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
                </button>
              )
            })}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div
          className={`relative overflow-hidden rounded-[2.5rem] p-8 shadow-sm ring-1 md:p-10 ${
            activeCategoryAmbience
              ? `${activeCategoryAmbience.pageBg} ${activeCategoryAmbience.ring}`
              : 'bg-white/95 ring-orange-100'
          }`}
        >
          {activeCategoryAmbience && (
            <>
              <div
                className={`pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full ${activeCategoryAmbience.glowOne} blur-3xl`}
              />

              <div
                className={`pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full ${activeCategoryAmbience.glowTwo} blur-3xl`}
              />

              <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.30]">
                <div className="grid h-full min-h-[560px] grid-cols-4 gap-x-12 gap-y-10 px-6 py-8 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
                  {wallpaperEmojis.map((emoji, index) => (
                    <div
                      key={`${emoji}-${index}`}
                      className={`flex items-center justify-center text-3xl md:text-4xl ${
                        index % 2 === 0 ? 'translate-y-3' : '-translate-y-3'
                      } ${
                        index % 3 === 0
                          ? 'rotate-[-10deg]'
                          : index % 3 === 1
                            ? 'rotate-[8deg]'
                            : 'rotate-[-4deg]'
                      }`}
                    >
                      <span className="select-none">{emoji}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pointer-events-none absolute inset-0 bg-white/35" />
            </>
          )}

          <div className="relative z-10">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p
                  className={`font-bold ${
                    activeCategoryAmbience?.accentText ?? 'text-orange-600'
                  }`}
                >
                  {selectedCategory
                    ? selectedCategory.label
                    : showAllRecipes
                      ? 'Tout le carnet'
                      : 'Recherche rapide'}
                </p>

                <h2 className="text-3xl font-black text-stone-950 md:text-4xl">
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
                className={`w-fit rounded-full border px-6 py-3 font-bold transition ${
                  activeCategoryAmbience
                    ? `border-white/70 bg-white/80 ${activeCategoryAmbience.buttonText} ${activeCategoryAmbience.buttonHover}`
                    : 'border-orange-200 bg-white text-orange-700 hover:bg-orange-50'
                }`}
              >
                Revenir aux catégories
              </button>
            </div>

            {filteredRecipes.length === 0 ? (
              <div className="rounded-[2rem] bg-white/85 p-8 text-center shadow-sm ring-1 ring-white/70">
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
        </div>
      )}
    </section>
  )
}