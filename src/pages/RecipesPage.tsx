import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import RecipeCard from '../components/recipes/RecipeCard'
import Button from '../components/ui/Button'
import Chip from '../components/ui/Chip'
import SectionHeader from '../components/ui/SectionHeader'
import { RecipeCardGridSkeleton } from '../components/ui/Skeleton'
import { getCategoryAmbience, getHomeCardStyle } from '../data/categoryStyles'
import { RECIPE_CATEGORIES } from '../data/recipeOptions'
import { getRecipes } from '../services/recipes'
import { getRecipeRatings, type RecipeRating } from '../services/reviews'
import type { Recipe } from '../types/recipe'

type SortOption = 'name' | 'time' | 'difficulty'

export default function RecipesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [ratings, setRatings] = useState<Map<number, RecipeRating>>(new Map())
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('name')

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

  const hasActiveFilters = search.trim().length > 0 || selectedCategory !== null

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
    setSearchParams({})
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
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)

               if (!event.target.value.trim() && !selectedCategory) {
                  setSearchParams({})
                }
              }}
              placeholder="Exemple : tarte, poulet, chocolat..."
              className="w-full rounded-2xl border border-orange-100 bg-cream-input px-4 py-4 text-base text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 sm:px-5"
            />

            <div className="mt-4 grid gap-3 md:grid-cols-2 md:gap-4">
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
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="w-full rounded-2xl border border-orange-100 bg-cream-input px-4 py-4 text-base text-stone-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 sm:px-5"
              >
                <option value="name">Trier par nom</option>
                <option value="time">Temps le plus court</option>
                <option value="difficulty">Difficulté</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </p>
      )}

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

              <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.18] sm:opacity-[0.26]">
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
              <div className="rounded-[1.75rem] bg-white/85 p-6 text-center shadow-sm ring-1 ring-white/70 sm:rounded-[2rem] sm:p-8">
                <p className="text-lg font-bold text-stone-950">
                  Aucune recette trouvée
                </p>

                <p className="mt-2 text-stone-600">
                  Essaie une autre recherche ou une autre catégorie.
                </p>

                <Button
                  type="button"
                  onClick={resetFilters}
                  size="lg"
                  fullWidth
                  className="mt-6 sm:w-auto"
                >
                  Revenir aux catégories
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    rating={ratings.get(recipe.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}