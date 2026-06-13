import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import { RECIPE_CATEGORIES } from '../data/recipeOptions'
import { supabase } from '../lib/supabase'
import { getRecipes } from '../services/recipes'
import { addRecipeIngredientsToShoppingList } from '../services/shoppingList'
import type { Recipe } from '../types/recipe'

type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

type MainMealKey = 'lunch' | 'dinner'
type ExtraMealKey = 'breakfast' | 'snack' | 'dessert'

type DayPlannerState = Record<DayKey, Record<MainMealKey, string>>
type WeeklyExtrasState = Record<ExtraMealKey, string[]>

type MealPlannerState = DayPlannerState & {
  weeklyExtras: WeeklyExtrasState
}

type OpenPickerSlot =
  | {
      type: 'main'
      day: DayKey
      meal: MainMealKey
    }
  | {
      type: 'extra'
      meal: ExtraMealKey
    }

const STORAGE_KEY = 'carnet-recettes-weekly-planner'
const ALL_CATEGORIES_VALUE = 'all'

const DAYS: { key: DayKey; label: string; shortLabel: string; emoji: string }[] =
  [
    { key: 'monday', label: 'Lundi', shortLabel: 'Lun.', emoji: '🌱' },
    { key: 'tuesday', label: 'Mardi', shortLabel: 'Mar.', emoji: '🍅' },
    { key: 'wednesday', label: 'Mercredi', shortLabel: 'Mer.', emoji: '🥕' },
    { key: 'thursday', label: 'Jeudi', shortLabel: 'Jeu.', emoji: '🍋' },
    { key: 'friday', label: 'Vendredi', shortLabel: 'Ven.', emoji: '🍝' },
    { key: 'saturday', label: 'Samedi', shortLabel: 'Sam.', emoji: '🥘' },
    { key: 'sunday', label: 'Dimanche', shortLabel: 'Dim.', emoji: '🍰' },
  ]

const MAIN_MEALS: { key: MainMealKey; label: string; emoji: string }[] = [
  { key: 'lunch', label: 'Déjeuner', emoji: '☀️' },
  { key: 'dinner', label: 'Dîner', emoji: '🌙' },
]

const EXTRA_MEALS: {
  key: ExtraMealKey
  label: string
  emoji: string
  description: string
  emptyText: string
}[] = [
  {
    key: 'breakfast',
    label: 'Petit déjeuner',
    emoji: '🥐',
    description: 'Une ou plusieurs idées pour la semaine',
    emptyText: 'Aucune idée prévue pour le petit déjeuner.',
  },
  {
    key: 'snack',
    label: 'Goûter',
    emoji: '🍪',
    description: 'Des idées rapides pour les pauses',
    emptyText: 'Aucune idée prévue pour le goûter.',
  },
  {
    key: 'dessert',
    label: 'Dessert',
    emoji: '🍰',
    description: 'Des desserts à prévoir pour la semaine',
    emptyText: 'Aucun dessert prévu.',
  },
]

function createEmptyPlanner(): MealPlannerState {
  return {
    monday: { lunch: '', dinner: '' },
    tuesday: { lunch: '', dinner: '' },
    wednesday: { lunch: '', dinner: '' },
    thursday: { lunch: '', dinner: '' },
    friday: { lunch: '', dinner: '' },
    saturday: { lunch: '', dinner: '' },
    sunday: { lunch: '', dinner: '' },
    weeklyExtras: {
      breakfast: [],
      snack: [],
      dessert: [],
    },
  }
}

function cleanRecipeIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => String(item))
    .filter((item) => item.trim().length > 0)
}

function getSavedPlanner(): MealPlannerState {
  if (typeof window === 'undefined') {
    return createEmptyPlanner()
  }

  try {
    const savedPlanner = window.localStorage.getItem(STORAGE_KEY)
    const emptyPlanner = createEmptyPlanner()

    if (!savedPlanner) {
      return emptyPlanner
    }

    const parsedPlanner = JSON.parse(savedPlanner) as Partial<MealPlannerState>

    return {
      monday: { ...emptyPlanner.monday, ...parsedPlanner.monday },
      tuesday: { ...emptyPlanner.tuesday, ...parsedPlanner.tuesday },
      wednesday: { ...emptyPlanner.wednesday, ...parsedPlanner.wednesday },
      thursday: { ...emptyPlanner.thursday, ...parsedPlanner.thursday },
      friday: { ...emptyPlanner.friday, ...parsedPlanner.friday },
      saturday: { ...emptyPlanner.saturday, ...parsedPlanner.saturday },
      sunday: { ...emptyPlanner.sunday, ...parsedPlanner.sunday },
      weeklyExtras: {
        breakfast: cleanRecipeIds(parsedPlanner.weeklyExtras?.breakfast),
        snack: cleanRecipeIds(parsedPlanner.weeklyExtras?.snack),
        dessert: cleanRecipeIds(parsedPlanner.weeklyExtras?.dessert),
      },
    }
  } catch {
    return createEmptyPlanner()
  }
}

function savePlanner(planner: MealPlannerState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(planner))
}

function getRecipeImage(recipe: Recipe) {
  return recipe.imageUrl || recipe.image || '🍽️'
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .trim()
}

function getDayLabel(day: DayKey) {
  return DAYS.find((currentDay) => currentDay.key === day)?.label ?? day
}

function getMealLabel(meal: MainMealKey | ExtraMealKey) {
  const mainMeal = MAIN_MEALS.find((currentMeal) => currentMeal.key === meal)

  if (mainMeal) {
    return mainMeal.label
  }

  const extraMeal = EXTRA_MEALS.find((currentMeal) => currentMeal.key === meal)

  return extraMeal?.label ?? meal
}

function getAllPlannedRecipeIds(planner: MealPlannerState) {
  const mainRecipeIds = DAYS.flatMap((day) =>
    MAIN_MEALS.map((meal) => planner[day.key][meal.key]).filter(Boolean),
  )

  const extraRecipeIds = EXTRA_MEALS.flatMap(
    (extraMeal) => planner.weeklyExtras[extraMeal.key],
  ).filter(Boolean)

  return [...mainRecipeIds, ...extraRecipeIds]
}

function plannerUsesRecipe(planner: MealPlannerState, recipeId: Recipe['id']) {
  return getAllPlannedRecipeIds(planner).includes(String(recipeId))
}

async function deleteRecipeIngredientsFromShoppingList(recipeId: Recipe['id']) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error('Utilisateur non connecté.')
  }

  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('user_id', user.id)
    .eq('recipe_id', recipeId)

  if (error) {
    throw error
  }
}

export default function MealPlannerPage() {
  const { user } = useAuth()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [planner, setPlanner] = useState<MealPlannerState>(() =>
    getSavedPlanner(),
  )

  const [loading, setLoading] = useState(true)
  const [openPickerSlot, setOpenPickerSlot] = useState<OpenPickerSlot | null>(
    null,
  )
  const [searchValue, setSearchValue] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES_VALUE)
  const [syncingRecipeId, setSyncingRecipeId] = useState<Recipe['id'] | null>(
    null,
  )

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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

  const recipesById = useMemo(() => {
    return new Map<string, Recipe>(
      recipes.map((recipe) => [String(recipe.id), recipe]),
    )
  }, [recipes])

  const plannedRecipeIds = useMemo(() => {
    return getAllPlannedRecipeIds(planner)
  }, [planner])

  const uniquePlannedRecipes = useMemo(() => {
    const uniqueIds = Array.from(new Set(plannedRecipeIds))

    return uniqueIds
      .map((recipeId) => recipesById.get(recipeId))
      .filter((recipe): recipe is Recipe => Boolean(recipe))
  }, [plannedRecipeIds, recipesById])

  const mainPlannedMealsCount = useMemo(() => {
    return DAYS.reduce((total, day) => {
      const dayCount = MAIN_MEALS.filter(
        (meal) => planner[day.key][meal.key],
      ).length

      return total + dayCount
    }, 0)
  }, [planner])

  const plannedMealsCount = plannedRecipeIds.length

  const plannedDaysCount = DAYS.filter((day) =>
    MAIN_MEALS.some((meal) => planner[day.key][meal.key]),
  ).length

  const estimatedIngredientsCount = uniquePlannedRecipes.reduce(
    (total, recipe) => total + recipe.ingredients.length,
    0,
  )

  const estimatedCookingTime = plannedRecipeIds.reduce((total, recipeId) => {
    const recipe = recipesById.get(recipeId)

    if (!recipe) return total

    return total + recipe.prepTime + recipe.cookTime
  }, 0)

  const weekCompletion = Math.round((mainPlannedMealsCount / 14) * 100)

  const filteredRecipes = useMemo(() => {
    const query = normalizeText(searchValue)

    return recipes
      .filter((recipe) => {
        if (
          selectedCategory !== ALL_CATEGORIES_VALUE &&
          recipe.category !== selectedCategory
        ) {
          return false
        }

        if (!query) {
          return true
        }

        const searchableContent = normalizeText(
          [
            recipe.title,
            recipe.description,
            recipe.category,
            recipe.difficulty,
            ...recipe.tags,
            ...recipe.ingredients,
          ].join(' '),
        )

        return searchableContent.includes(query)
      })
      .slice(0, query ? 60 : 36)
  }, [recipes, searchValue, selectedCategory])

  function clearMessages() {
    setErrorMessage('')
    setSuccessMessage('')
  }

  async function addRecipeIngredientsAutomatically(recipe: Recipe) {
    if (!user) {
      return false
    }

    try {
      setSyncingRecipeId(recipe.id)

      await addRecipeIngredientsToShoppingList(recipe.id, recipe.ingredients)

      return true
    } catch (error) {
      console.error(error)

      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('déjà')
      ) {
        return true
      }

      setErrorMessage(
        'La recette a été ajoutée au planning, mais la liste de courses n’a pas pu être mise à jour.',
      )

      return false
    } finally {
      setSyncingRecipeId(null)
    }
  }

  async function removeRecipeIngredientsIfUnused(
    nextPlanner: MealPlannerState,
    recipeId: Recipe['id'],
  ) {
    if (!user) {
      return false
    }

    if (plannerUsesRecipe(nextPlanner, recipeId)) {
      return true
    }

    try {
      await deleteRecipeIngredientsFromShoppingList(recipeId)

      return true
    } catch (error) {
      console.error(error)

      setErrorMessage(
        'La recette a été retirée du planning, mais les ingrédients n’ont pas pu être supprimés de la liste de courses.',
      )

      return false
    }
  }

  function openRecipePicker(slot: OpenPickerSlot) {
    setOpenPickerSlot(slot)
    setSearchValue('')
    setSelectedCategory(ALL_CATEGORIES_VALUE)
    clearMessages()
  }

  function closeRecipePicker() {
    setOpenPickerSlot(null)
    setSearchValue('')
    setSelectedCategory(ALL_CATEGORIES_VALUE)
  }

  async function handleChooseRecipe(recipe: Recipe) {
    if (!openPickerSlot) {
      return
    }

    let oldRecipeId = ''
    let nextPlanner: MealPlannerState = planner

    if (openPickerSlot.type === 'main') {
      oldRecipeId = planner[openPickerSlot.day][openPickerSlot.meal]

      nextPlanner = {
        ...planner,
        [openPickerSlot.day]: {
          ...planner[openPickerSlot.day],
          [openPickerSlot.meal]: String(recipe.id),
        },
      }
    }

    if (openPickerSlot.type === 'extra') {
      const currentExtraRecipes = planner.weeklyExtras[openPickerSlot.meal]

      if (currentExtraRecipes.includes(String(recipe.id))) {
        closeRecipePicker()
        setSuccessMessage(
          `"${recipe.title}" est déjà présent dans cette section.`,
        )

        window.setTimeout(() => {
          setSuccessMessage('')
        }, 3000)

        return
      }

      nextPlanner = {
        ...planner,
        weeklyExtras: {
          ...planner.weeklyExtras,
          [openPickerSlot.meal]: [...currentExtraRecipes, String(recipe.id)],
        },
      }
    }

    setPlanner(nextPlanner)
    savePlanner(nextPlanner)
    closeRecipePicker()

    clearMessages()

    const shoppingListUpdated = await addRecipeIngredientsAutomatically(recipe)

    if (oldRecipeId && oldRecipeId !== String(recipe.id)) {
      await removeRecipeIngredientsIfUnused(nextPlanner, Number(oldRecipeId))
    }

    setSuccessMessage(
      shoppingListUpdated
        ? `"${recipe.title}" a été ajouté au planning. La liste de courses a été mise à jour.`
        : `"${recipe.title}" a été ajouté au planning. Connecte-toi pour synchroniser la liste de courses.`,
    )

    window.setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }

  async function handleRemoveMainRecipe(day: DayKey, meal: MainMealKey) {
    const recipeId = planner[day][meal]

    if (!recipeId) {
      return
    }

    const nextPlanner: MealPlannerState = {
      ...planner,
      [day]: {
        ...planner[day],
        [meal]: '',
      },
    }

    setPlanner(nextPlanner)
    savePlanner(nextPlanner)

    clearMessages()

    const shoppingListUpdated = await removeRecipeIngredientsIfUnused(
      nextPlanner,
      Number(recipeId),
    )

    setSuccessMessage(
      shoppingListUpdated
        ? 'La recette a été retirée du planning. La liste de courses a été mise à jour.'
        : 'La recette a été retirée du planning.',
    )

    window.setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }

  async function handleRemoveExtraRecipe(meal: ExtraMealKey, recipeId: string) {
    const nextPlanner: MealPlannerState = {
      ...planner,
      weeklyExtras: {
        ...planner.weeklyExtras,
        [meal]: planner.weeklyExtras[meal].filter(
          (currentRecipeId) => currentRecipeId !== recipeId,
        ),
      },
    }

    setPlanner(nextPlanner)
    savePlanner(nextPlanner)

    clearMessages()

    const shoppingListUpdated = await removeRecipeIngredientsIfUnused(
      nextPlanner,
      Number(recipeId),
    )

    setSuccessMessage(
      shoppingListUpdated
        ? 'La recette a été retirée du planning. La liste de courses a été mise à jour.'
        : 'La recette a été retirée du planning.',
    )

    window.setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }

  async function handleClearPlanning() {
    if (plannedRecipeIds.length === 0) {
      return
    }

    const confirmClear = window.confirm(
      'Voulez-vous vraiment vider tout le planning de la semaine ?',
    )

    if (!confirmClear) {
      return
    }

    const recipeIdsToRemove = Array.from(new Set(plannedRecipeIds))
    const emptyPlanner = createEmptyPlanner()

    setPlanner(emptyPlanner)
    savePlanner(emptyPlanner)

    clearMessages()

    if (user) {
      for (const recipeId of recipeIdsToRemove) {
        await removeRecipeIngredientsIfUnused(emptyPlanner, Number(recipeId))
      }
    }

    setSuccessMessage(
      user
        ? 'Le planning a été vidé. La liste de courses a été mise à jour.'
        : 'Le planning a été vidé.',
    )

    window.setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }

  function handlePrintPlanning() {
    window.print()
  }

  function renderRecipeMiniCard(recipe: Recipe, actions?: ReactNode) {
    const image = getRecipeImage(recipe)
    const isImageUrl = typeof image === 'string' && image.startsWith('http')

    return (
      <div className="group/card flex items-center gap-4 rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:shadow-md">
        <Link
          to={`/recipes/${recipe.id}`}
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] bg-cream-200 text-3xl"
        >
          {isImageUrl ? (
            <img
              src={image}
              alt={recipe.title}
              className="h-full w-full object-cover transition group-hover/card:scale-105"
            />
          ) : (
            image
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            to={`/recipes/${recipe.id}`}
            className="block truncate text-lg font-black text-stone-950 transition hover:text-orange-700"
          >
            {recipe.title}
          </Link>

          <p className="mt-1 text-sm font-bold text-stone-500">
            {recipe.prepTime + recipe.cookTime} min · {recipe.servings} pers.
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
              {recipe.category}
            </span>

            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
              {recipe.difficulty}
            </span>
          </div>

          {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    )
  }

  return (
    <>
      <style>
        {`
          .print-planning {
            display: none;
          }

          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }

            body {
              background: white !important;
            }

            body * {
              visibility: hidden !important;
            }

            .print-planning,
            .print-planning * {
              visibility: visible !important;
            }

            .print-planning {
              display: block !important;
              position: absolute;
              inset: 0;
              width: 100%;
              padding: 0;
              color: #1c1917;
              background: white;
              font-family: Arial, sans-serif;
            }

            .print-card {
              border: 1px solid #eadfd3;
              border-radius: 14px;
              padding: 12px;
              break-inside: avoid;
              background: #fffaf3;
            }

            .print-day-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }

            .print-section-title {
              margin-top: 18px;
              margin-bottom: 8px;
              color: #ea580c;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }

            .print-muted {
              color: #78716c;
            }
          }
        `}
      </style>

      <div className="print-planning">
        <div className="mb-5 flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
              Carnet de recettes
            </p>

            <h1 className="mt-1 text-3xl font-black">
              Planning de la semaine
            </h1>

            <p className="mt-1 text-sm text-stone-500">
              Imprimé le {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-cream-50 px-4 py-3">
            <img
              src="/ChatGPT Image 1 mai 2026, 04_35_16.png"
              alt="Carnet de recettes"
              className="h-14 w-14 object-contain"
            />

            <div>
              <p className="text-lg font-black">Carnet de recettes</p>
              <p className="text-xs font-bold text-stone-500">
                Cuisine maison & petits plats
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="print-card">
            <p className="text-2xl font-black text-orange-600">
              {weekCompletion} %
            </p>
            <p className="text-xs font-bold">semaine remplie</p>
          </div>

          <div className="print-card">
            <p className="text-2xl font-black text-orange-600">
              {plannedMealsCount}
            </p>
            <p className="text-xs font-bold">repas prévus</p>
          </div>

          <div className="print-card">
            <p className="text-2xl font-black text-green-700">
              {plannedDaysCount}
            </p>
            <p className="text-xs font-bold">jours organisés</p>
          </div>

          <div className="print-card">
            <p className="text-2xl font-black">{estimatedIngredientsCount}</p>
            <p className="text-xs font-bold">ingrédients estimés</p>
          </div>
        </div>

        <p className="print-section-title">Habitudes et envies</p>

        <div className="grid grid-cols-3 gap-3">
          {EXTRA_MEALS.map((extraMeal) => {
            const recipeIds = planner.weeklyExtras[extraMeal.key]
            const extraRecipes = recipeIds
              .map((recipeId) => recipesById.get(recipeId))
              .filter((recipe): recipe is Recipe => Boolean(recipe))

            return (
              <div key={extraMeal.key} className="print-card">
                <p className="mb-2 font-black">
                  {extraMeal.emoji} {extraMeal.label}
                </p>

                {extraRecipes.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {extraRecipes.map((recipe) => (
                      <li key={recipe.id}>• {recipe.title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm print-muted">Aucun prévu.</p>
                )}
              </div>
            )
          })}
        </div>

        <p className="print-section-title">Semaine détaillée</p>

        <div className="print-day-grid">
          {DAYS.map((day) => {
            const dayMealsCount = MAIN_MEALS.filter(
              (meal) => planner[day.key][meal.key],
            ).length

            return (
              <div key={day.key} className="print-card">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-orange-600">
                      {day.shortLabel}
                    </p>

                    <h2 className="text-xl font-black">{day.label}</h2>
                  </div>

                  <p className="rounded-full border border-orange-100 bg-white px-3 py-1 text-xs font-black">
                    {dayMealsCount}/2
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {MAIN_MEALS.map((meal) => {
                    const recipeId = planner[day.key][meal.key]
                    const recipe = recipeId ? recipesById.get(recipeId) : null

                    return (
                      <div key={meal.key}>
                        <p className="mb-1 font-black text-orange-600">
                          {meal.emoji} {meal.label}
                        </p>

                        {recipe ? (
                          <div>
                            <p className="font-extrabold">{recipe.title}</p>

                            <p className="text-xs print-muted">
                              {recipe.prepTime + recipe.cookTime} min ·{' '}
                              {recipe.servings} pers.
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm print-muted">
                            Aucun repas prévu.
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <section className="space-y-10">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-cream-50 shadow-sm ring-1 ring-orange-100">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-orange-100/80 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-amber-100/80 blur-3xl" />

          <div className="relative z-10 grid gap-10 px-6 py-10 xl:grid-cols-[0.9fr_1.1fr] xl:px-10">
            <div>
              <div className="mb-6 flex w-fit items-center gap-3 rounded-full bg-cream-300 px-4 py-2 text-sm font-bold text-orange-700">
                <span>🗓️</span>
                <span>Planning de semaine</span>
              </div>

              <h1 className="max-w-xl text-4xl font-black leading-tight text-stone-950 md:text-6xl">
                Organise tes repas sans prise de tête.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">
                Prévois tes déjeuners, tes dîners et tes petites envies de la
                semaine. Le carnet peut aussi alimenter automatiquement ta liste
                de courses.
              </p>

              <div className="mt-8 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                      Progression
                    </p>

                    <p className="mt-1 text-2xl font-black text-stone-950">
                      {weekCompletion} % de la semaine remplie
                    </p>
                  </div>

                  <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700">
                    {mainPlannedMealsCount}/14 repas
                  </span>
                </div>

                <div className="mt-5 rounded-full bg-cream-200 p-1.5">
                  <div
                    className="h-4 rounded-full bg-orange-500 transition-all"
                    style={{ width: `${weekCompletion}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
                  <p className="text-3xl font-black text-orange-600">
                    {plannedMealsCount}
                  </p>
                  <p className="mt-1 text-sm font-bold text-stone-700">
                    repas
                  </p>
                </div>

                <div className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
                  <p className="text-3xl font-black text-green-800">
                    {plannedDaysCount}
                  </p>
                  <p className="mt-1 text-sm font-bold text-stone-700">
                    jours
                  </p>
                </div>

                <div className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
                  <p className="text-3xl font-black text-stone-950">
                    {estimatedIngredientsCount}
                  </p>
                  <p className="mt-1 text-sm font-bold text-stone-700">
                    ingrédients
                  </p>
                </div>

                <div className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
                  <p className="text-3xl font-black text-stone-950">
                    {estimatedCookingTime}
                  </p>
                  <p className="mt-1 text-sm font-bold text-stone-700">
                    minutes
                  </p>
                </div>
              </div>

              <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
                <Link
                  to="/shopping-list"
                  className="rounded-full bg-orange-500 px-6 py-4 text-center font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md"
                >
                  Voir ma liste de courses
                </Link>

                <Link
                  to="/recipes"
                  className="rounded-full border border-orange-200 bg-white px-6 py-4 text-center font-black text-stone-900 transition hover:-translate-y-0.5 hover:bg-orange-50"
                >
                  Parcourir les catégories
                </Link>

                <button
                  type="button"
                  onClick={handlePrintPlanning}
                  disabled={plannedRecipeIds.length === 0}
                  className="rounded-full border border-orange-200 bg-white px-6 py-4 font-black text-stone-900 transition hover:-translate-y-0.5 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Imprimer le planning
                </button>

                <button
                  type="button"
                  onClick={handleClearPlanning}
                  disabled={plannedRecipeIds.length === 0}
                  className="rounded-full border border-red-100 bg-white px-6 py-4 font-black text-red-600 transition hover:-translate-y-0.5 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Vider le planning
                </button>
              </div>

              {!user && (
                <div className="mt-6 rounded-[1.5rem] bg-white/80 p-4 text-sm font-bold leading-6 text-stone-600 ring-1 ring-orange-100">
                  💡 Ton planning est enregistré sur cet appareil. Connecte-toi
                  pour synchroniser automatiquement la liste de courses.
                </div>
              )}
            </div>

            <div className="rounded-[2rem] bg-white/90 p-6 shadow-sm ring-1 ring-orange-100 backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                    Habitudes et envies
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-stone-950">
                    Petits plus de la semaine
                  </h2>

                  <p className="mt-2 font-semibold text-stone-500">
                    Petit déjeuner, goûter et dessert sans jour imposé.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {EXTRA_MEALS.map((extraMeal) => {
                  const recipeIds = planner.weeklyExtras[extraMeal.key]
                  const extraRecipes = recipeIds
                    .map((recipeId) => recipesById.get(recipeId))
                    .filter((recipe): recipe is Recipe => Boolean(recipe))

                  return (
                    <div
                      key={extraMeal.key}
                      className="rounded-[1.8rem] bg-cream-50 p-5 ring-1 ring-orange-100"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-black text-stone-950">
                            {extraMeal.emoji} {extraMeal.label}
                          </h3>

                          <p className="mt-1 font-semibold text-stone-500">
                            {extraMeal.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openRecipePicker({
                              type: 'extra',
                              meal: extraMeal.key,
                            })
                          }
                          className="rounded-full bg-orange-100 px-5 py-3 font-black text-orange-700 transition hover:bg-orange-200"
                        >
                          + Ajouter
                        </button>
                      </div>

                      <div className="mt-4 space-y-3 rounded-[1.4rem] border border-dashed border-orange-200 bg-white/70 p-4">
                        {extraRecipes.length > 0 ? (
                          extraRecipes.map((recipe) => (
                            <div key={`${extraMeal.key}-${recipe.id}`}>
                              {renderRecipeMiniCard(recipe, (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveExtraRecipe(
                                      extraMeal.key,
                                      String(recipe.id),
                                    )
                                  }
                                  className="rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                                >
                                  Retirer
                                </button>
                              ))}
                            </div>
                          ))
                        ) : (
                          <div>
                            <p className="font-bold text-stone-500">
                              {extraMeal.emptyText}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                openRecipePicker({
                                  type: 'extra',
                                  meal: extraMeal.key,
                                })
                              }
                              className="mt-3 rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700 transition hover:bg-orange-200"
                            >
                              + Ajouter une idée
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-2xl bg-red-50 px-5 py-4 text-red-700">
            <p className="font-bold">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl bg-green-50 px-5 py-4 text-green-700">
            <p className="font-bold">{successMessage}</p>
          </div>
        )}

        {uniquePlannedRecipes.length > 0 && (
          <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 md:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-bold text-orange-600">Récapitulatif</p>

                <h2 className="text-3xl font-black text-stone-950">
                  Recettes prévues cette semaine
                </h2>

                <p className="mt-2 text-stone-600">
                  Toutes les recettes déjà placées dans ton planning.
                </p>
              </div>

              <Link
                to="/shopping-list"
                className="rounded-full bg-orange-500 px-5 py-3 font-black text-white shadow-sm transition hover:bg-orange-600"
              >
                Préparer les courses
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {uniquePlannedRecipes.map((recipe) =>
                renderRecipeMiniCard(recipe),
              )}
            </div>
          </section>
        )}

        {loading ? (
          <div className="rounded-[2rem] bg-white p-8 text-stone-600 shadow-sm ring-1 ring-orange-100">
            Chargement du planning...
          </div>
        ) : (
          <div className="space-y-6">
            {DAYS.map((day) => {
              const dayMealsCount = MAIN_MEALS.filter(
                (meal) => planner[day.key][meal.key],
              ).length

              return (
                <section
                  key={day.key}
                  className="rounded-[2.5rem] bg-white shadow-sm ring-1 ring-orange-100"
                >
                  <div className="grid gap-6 p-6 xl:grid-cols-[260px_minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="relative overflow-hidden rounded-[1.8rem] bg-cream-50 p-6 ring-1 ring-orange-100">
                      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-100 blur-3xl" />

                      <div className="relative z-10">
                        <p className="text-3xl">{day.emoji}</p>

                        <p className="mt-4 text-sm font-black uppercase tracking-wide text-orange-600">
                          {day.shortLabel}
                        </p>

                        <h2 className="mt-2 break-words text-3xl font-black text-stone-950 2xl:text-4xl">
                          {day.label}
                        </h2>

                        <p className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-black text-stone-700 shadow-sm ring-1 ring-orange-100">
                          {dayMealsCount}/2 repas
                        </p>
                      </div>
                    </div>

                    {MAIN_MEALS.map((meal) => {
                      const recipeId = planner[day.key][meal.key]
                      const recipe = recipeId ? recipesById.get(recipeId) : null
                      const mealDescription =
                        meal.key === 'lunch' ? 'Repas du midi' : 'Repas du soir'

                      return (
                        <div
                          key={meal.key}
                          className="rounded-[1.8rem] bg-cream-50 p-5 ring-1 ring-orange-100"
                        >
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-black text-stone-950">
                                {meal.emoji} {meal.label}
                              </h3>

                              <p className="mt-1 font-semibold text-stone-500">
                                {mealDescription}
                              </p>
                            </div>

                            {recipe && (
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-orange-700 ring-1 ring-orange-100">
                                Prévu
                              </span>
                            )}
                          </div>

                          {recipe ? (
                            renderRecipeMiniCard(recipe, (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openRecipePicker({
                                      type: 'main',
                                      day: day.key,
                                      meal: meal.key,
                                    })
                                  }
                                  className="rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700 transition hover:bg-orange-200"
                                >
                                  Changer
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveMainRecipe(day.key, meal.key)
                                  }
                                  className="rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                                >
                                  Retirer
                                </button>
                              </>
                            ))
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                openRecipePicker({
                                  type: 'main',
                                  day: day.key,
                                  meal: meal.key,
                                })
                              }
                              className="flex min-h-40 w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-orange-200 bg-white/70 px-5 py-6 text-center transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-sm"
                            >
                              <span className="text-lg font-black text-stone-500">
                                Aucun repas prévu.
                              </span>

                              <span className="mt-4 rounded-full bg-orange-100 px-5 py-3 font-black text-orange-700">
                                + Ajouter une recette
                              </span>
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </section>

      {openPickerSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/40 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[88vh] w-full max-w-5xl flex-col rounded-[2rem] bg-cream-50 p-6 shadow-2xl ring-1 ring-orange-100 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                  Ajouter une recette
                </p>

                <h2 className="mt-2 text-3xl font-black text-stone-950">
                  {openPickerSlot.type === 'main'
                    ? `${getDayLabel(openPickerSlot.day)} — ${getMealLabel(
                        openPickerSlot.meal,
                      )}`
                    : getMealLabel(openPickerSlot.meal)}
                </h2>

                <p className="mt-2 max-w-2xl font-semibold leading-7 text-stone-500">
                  Recherche une recette, filtre par catégorie, puis ajoute-la au
                  planning.
                </p>
              </div>

              <button
                type="button"
                onClick={closeRecipePicker}
                className="rounded-full border border-orange-200 bg-white px-5 py-3 font-black text-orange-700 transition hover:bg-orange-50"
              >
                Fermer
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-[1fr_0.45fr]">
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Rechercher : pâtes, gâteau, poulet..."
                autoFocus
                className="w-full rounded-[1.5rem] border border-orange-200 bg-white px-5 py-4 text-lg font-semibold text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="w-full rounded-[1.5rem] border border-orange-200 bg-white px-5 py-4 text-lg font-semibold text-stone-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              >
                <option value={ALL_CATEGORIES_VALUE}>
                  Toutes les catégories
                </option>

                {RECIPE_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.emoji} {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory(ALL_CATEGORIES_VALUE)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  selectedCategory === ALL_CATEGORIES_VALUE
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-orange-700 ring-1 ring-orange-100 hover:bg-orange-50'
                }`}
              >
                Toutes
              </button>

              {RECIPE_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setSelectedCategory(category.value)}
                  className={`rounded-full px-4 py-2 text-sm font-black transition ${
                    selectedCategory === category.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-stone-700 ring-1 ring-orange-100 hover:bg-orange-50 hover:text-orange-700'
                  }`}
                >
                  {category.emoji} {category.label}
                </button>
              ))}
            </div>

            <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-2">
              {filteredRecipes.length === 0 ? (
                <div className="rounded-[1.5rem] bg-white p-6 text-center text-stone-500 shadow-sm ring-1 ring-orange-100">
                  Aucune recette trouvée.
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {filteredRecipes.map((recipe) => {
                    const image = getRecipeImage(recipe)
                    const isImageUrl =
                      typeof image === 'string' && image.startsWith('http')
                    const isSyncing = syncingRecipeId === recipe.id

                    return (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => handleChooseRecipe(recipe)}
                        disabled={isSyncing}
                        className="group flex w-full items-center gap-4 rounded-[1.5rem] bg-white p-4 text-left shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] bg-cream-200 text-3xl">
                          {isImageUrl ? (
                            <img
                              src={image}
                              alt={recipe.title}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          ) : (
                            image
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xl font-black text-stone-950">
                            {recipe.title}
                          </p>

                          <p className="mt-1 line-clamp-1 font-semibold text-stone-500">
                            {recipe.description}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                              {recipe.category}
                            </span>

                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-600 ring-1 ring-orange-100">
                              {recipe.prepTime + recipe.cookTime} min
                            </span>

                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-600 ring-1 ring-orange-100">
                              {recipe.servings} pers.
                            </span>
                          </div>
                        </div>

                        <span className="hidden rounded-full bg-orange-500 px-5 py-3 font-black text-white md:block">
                          Ajouter
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}