import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, Search, X } from 'lucide-react'

import RecipeCard from '../components/recipes/RecipeCard'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Chip from '../components/ui/Chip'
import EmptyState from '../components/ui/EmptyState'
import SectionHeader from '../components/ui/SectionHeader'
import { RecipeCardGridSkeleton } from '../components/ui/Skeleton'
import { getCategoryAmbience, getHomeCardStyle } from '../data/categoryStyles'
import { RECIPE_CATEGORIES, RECIPE_DIFFICULTIES } from '../data/recipeOptions'
import { useDebounce } from '../lib/useDebounce'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { getRecipes } from '../services/recipes'
import { getRecipeRatings, type RecipeRating } from '../services/reviews'
import type { Difficulty, Recipe } from '../types/recipe'

type SortOption = 'name' | 'time' | 'difficulty'
type DifficultyFilter = 'all' | Difficulty

/** Options de temps maximum (préparation + cuisson), en minutes. 0 = illimité. */
const MAX_TIME_OPTIONS = [15, 30, 45, 60]

/** Nombre de recettes affichées par page (pagination « Voir plus »). */
const PAGE_SIZE = 12

export default function RecipesPage() {
  useDocumentTitle('Toutes les recettes')
  const [searchParams, setSearchParams] = useSearchParams()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [ratings, setRatings] = useState<Map<number, RecipeRating>>(new Map())
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [sort, setSort] = useState<SortOption>('name')
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all')
  const [maxTime, setMaxTime] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showTags, setShowTags] = useState(false)

  const categoryParam = searchParams.get('category')

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

  useEffect(() => {
    if (recipes.length === 0) return

    let ignore = false

    getRecipeRatings(recipes.map((recipe) => recipe.id))
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

  // Tags réellement présents dans les recettes (pour des filtres pertinents).
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()

    recipes.forEach((recipe) => {
      recipe.tags.forEach((tag) => tagSet.add(tag))
    })

    return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
  }, [recipes])

  const filteredRecipes = useMemo(() => {
    let result = [...recipes]

    if (selectedCategory) {
      result = result.filter(
        (recipe) => recipe.category === selectedCategory.value,
      )
    }

    if (difficulty !== 'all') {
      result = result.filter((recipe) => recipe.difficulty === difficulty)
    }

    if (maxTime > 0) {
      result = result.filter(
        (recipe) => recipe.prepTime + recipe.cookTime <= maxTime,
      )
    }

    if (selectedTags.length > 0) {
      result = result.filter((recipe) =>
        selectedTags.every((tag) => recipe.tags.includes(tag)),
      )
    }

    if (debouncedSearch.trim()) {
      const normalizedSearch = debouncedSearch.toLowerCase().trim()

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
  }, [
    recipes,
    debouncedSearch,
    selectedCategory,
    sort,
    difficulty,
    maxTime,
    selectedTags,
  ])

  const hasActiveFilters =
    debouncedSearch.trim().length > 0 ||
    selectedCategory !== null ||
    difficulty !== 'all' ||
    maxTime > 0 ||
    selectedTags.length > 0

  // Pagination : on réinitialise le nombre visible dès qu'un filtre change
  // (ajustement d'état pendant le rendu, sans effet).
  const filtersKey = `${debouncedSearch.trim().toLowerCase()}|${
    selectedCategory?.value ?? ''
  }|${sort}|${difficulty}|${maxTime}|${[...selectedTags].sort().join(',')}`

  const [paginationKey, setPaginationKey] = useState(filtersKey)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  if (paginationKey !== filtersKey) {
    setPaginationKey(filtersKey)
    setVisibleCount(PAGE_SIZE)
  }

  const visibleRecipes = filteredRecipes.slice(0, visibleCount)
  const remainingCount = filteredRecipes.length - visibleRecipes.length

  const activeCategoryAmbience = selectedCategory
    ? getCategoryAmbience(selectedCategory.label)
    : null

  const wallpaperEmojis = activeCategoryAmbience
    ? Array.from(
        { length: 56 },
        (_, index) =>
          activeCategoryAmbience.emojis[
            index % activeCategoryAmbience.emojis.length
          ],
      )
    : []

  function selectCategory(categoryValue: string) {
    setSearchParams({ category: categoryValue })
  }

  function resetFilters() {
    setSearch('')
    setSort('name')
    setDifficulty('all')
    setMaxTime(0)
    setSelectedTags([])
    setSearchParams({})
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...current, tag],
    )
  }

  if (loading) {
    return (
      <section className="space-y-8 sm:space-y-10">
        <RecipeCardGridSkeleton count={6} />
      </section>
    )
  }

  return (
    <section className="space-y-8 sm:space-y-10">
      <div className="overflow-hidden rounded-[2rem] bg-cream-50/95 p-5 shadow-sm ring-1 ring-orange-100 sm:rounded-[2.5rem] sm:p-8 md:p-10">
        <div className="grid gap-7 lg:grid-cols-[0.9fr_1fr] lg:items-center">
          <div>
            <Chip emoji="📖" className="mb-4">
              Le carnet
            </Chip>

            <h1 className="text-3xl font-black leading-tight text-stone-950 sm:text-5xl md:text-7xl">
              Trouver une recette
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 sm:mt-6 sm:text-lg sm:leading-8">
              Recherche par nom, ingrédient ou catégorie, puis retrouve
              rapidement tous les petits plats de la maison.
            </p>
          </div>

          <div className="rounded-[1.75rem] bg-white p-4 shadow-sm ring-1 ring-orange-100 sm:rounded-[2rem] sm:p-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)

                 if (!event.target.value.trim() && !selectedCategory) {
                    setSearchParams({})
                  }
                }}
                aria-label="Rechercher une recette"
                placeholder="Exemple : tarte, poulet, chocolat..."
                className="w-full rounded-2xl border border-orange-100 bg-cream-input py-4 pl-12 pr-12 text-base text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    if (!selectedCategory) setSearchParams({})
                  }}
                  aria-label="Effacer la recherche"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
              <select
                value={selectedCategory?.value ?? ''}
                onChange={(event) => {
                  const value = event.target.value

                 if (!value) {
                    setSearchParams({})
                    return
                  }

                  selectCategory(value)
                }}
                aria-label="Filtrer par catégorie"
                className="w-full rounded-2xl border border-orange-100 bg-cream-input px-4 py-4 text-base text-stone-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 sm:px-5"
              >
                <option value="">Toutes les catégories</option>

                {RECIPE_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as DifficultyFilter)
                }
                aria-label="Filtrer par difficulté"
                className="w-full rounded-2xl border border-orange-100 bg-cream-input px-4 py-4 text-base text-stone-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 sm:px-5"
              >
                <option value="all">Toutes difficultés</option>

                {RECIPE_DIFFICULTIES.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>

              <select
                value={maxTime}
                onChange={(event) => setMaxTime(Number(event.target.value))}
                aria-label="Filtrer par temps maximum"
                className="w-full rounded-2xl border border-orange-100 bg-cream-input px-4 py-4 text-base text-stone-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 sm:px-5"
              >
                <option value={0}>Tous les temps</option>

                {MAX_TIME_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes < 60
                      ? `≤ ${minutes} min`
                      : `≤ ${minutes / 60} h`}
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                aria-label="Trier les recettes"
                className="w-full rounded-2xl border border-orange-100 bg-cream-input px-4 py-4 text-base text-stone-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 sm:px-5"
              >
                <option value="name">Trier par nom</option>
                <option value="time">Temps le plus court</option>
                <option value="difficulty">Difficulté</option>
              </select>
            </div>

            {availableTags.length > 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowTags((current) => !current)}
                  aria-expanded={showTags}
                  className="flex w-full items-center justify-between rounded-2xl border border-orange-100 bg-cream-input px-4 py-3 text-sm font-bold text-stone-600 transition hover:border-orange-300 hover:text-orange-700 sm:px-5"
                >
                  <span>
                    Filtrer par tag
                    {selectedTags.length > 0 && (
                      <span className="ml-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                        {selectedTags.length}
                      </span>
                    )}
                  </span>

                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition ${
                      showTags ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showTags && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const active = selectedTags.includes(tag)

                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          aria-pressed={active}
                          className={`rounded-full border px-3 py-1.5 text-sm font-bold transition ${
                            active
                              ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                              : 'border-orange-100 bg-cream-input text-stone-600 hover:border-orange-300 hover:text-orange-700'
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

      {!hasActiveFilters && (
        <div className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-orange-100 sm:rounded-[2.5rem] sm:p-8 md:p-10">
          <SectionHeader
            className="mb-6 sm:mb-8"
            eyebrow="Catégories"
            title="Parcourir par grandes familles"
            subtitle="Choisis une famille pour découvrir les recettes associées."
          />

          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categoriesWithCount.map((category, index) => {
              const visualStyle = getHomeCardStyle(category.label, index)

              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => selectCategory(category.value)}
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
                </button>
              )
            })}
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div
          className={`relative overflow-hidden rounded-[2rem] p-5 shadow-sm ring-1 sm:rounded-[2.5rem] sm:p-8 md:p-10 ${
            activeCategoryAmbience
              ? `${activeCategoryAmbience.pageBg} ${activeCategoryAmbience.ring}`
              : 'bg-white/95 ring-orange-100'
          }`}
        >
          {activeCategoryAmbience && (
            <>
              <div
                className={`pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl sm:h-80 sm:w-80 ${activeCategoryAmbience.glowOne}`}
              />

              <div
                className={`pointer-events-none absolute -bottom-28 -left-24 h-64 w-64 rounded-full blur-3xl sm:h-80 sm:w-80 ${activeCategoryAmbience.glowTwo}`}
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.18] sm:opacity-[0.26]"
              >
                <div className="grid h-full min-h-[460px] grid-cols-4 gap-x-8 gap-y-8 px-4 py-6 sm:min-h-[560px] sm:grid-cols-5 sm:gap-x-10 sm:gap-y-10 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
                  {wallpaperEmojis.map((emoji, index) => (
                    <div
                      key={`${emoji}-${index}`}
                      className={`flex items-center justify-center text-2xl sm:text-3xl md:text-4xl ${
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
            <SectionHeader
              className="mb-6 sm:mb-8"
              eyebrowClassName={
                activeCategoryAmbience?.accentText ?? 'text-orange-600'
              }
              eyebrow={
                selectedCategory ? selectedCategory.label : 'Recherche rapide'
              }
              title={
                selectedCategory
                  ? `Recettes : ${selectedCategory.label}`
                  : 'Résultats'
              }
              subtitle={`${filteredRecipes.length} recette${
                filteredRecipes.length > 1 ? 's' : ''
              } trouvée${filteredRecipes.length > 1 ? 's' : ''}`}
              action={
                <button
                  type="button"
                  onClick={resetFilters}
                  className={`w-full rounded-full border px-6 py-3 font-bold transition sm:w-fit ${
                    activeCategoryAmbience
                      ? `border-white/70 bg-white/80 ${activeCategoryAmbience.buttonText} ${activeCategoryAmbience.buttonHover}`
                      : 'border-orange-200 bg-white text-orange-700 hover:bg-orange-50'
                  }`}
                >
                  Revenir aux catégories
                </button>
              }
            />

            {filteredRecipes.length === 0 ? (
              <EmptyState
                tone="honey"
                emoji="🔍"
                title="Aucune recette trouvée"
                description="Essaie d’élargir tes filtres (catégorie, difficulté, temps, tags) ou une autre recherche."
                action={
                  <Button type="button" onClick={resetFilters} size="lg">
                    Réinitialiser les filtres
                  </Button>
                }
              />
            ) : (
              <>
                <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {visibleRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      rating={ratings.get(recipe.id)}
                    />
                  ))}
                </div>

                {remainingCount > 0 && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      onClick={() =>
                        setVisibleCount((current) => current + PAGE_SIZE)
                      }
                    >
                      Voir plus de recettes ({remainingCount} restante
                      {remainingCount > 1 ? 's' : ''})
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}