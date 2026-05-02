import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
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

const DAYS: { key: DayKey; label: string; shortLabel: string }[] = [
  { key: 'monday', label: 'Lundi', shortLabel: 'Lun.' },
  { key: 'tuesday', label: 'Mardi', shortLabel: 'Mar.' },
  { key: 'wednesday', label: 'Mercredi', shortLabel: 'Mer.' },
  { key: 'thursday', label: 'Jeudi', shortLabel: 'Jeu.' },
  { key: 'friday', label: 'Vendredi', shortLabel: 'Ven.' },
  { key: 'saturday', label: 'Samedi', shortLabel: 'Sam.' },
  { key: 'sunday', label: 'Dimanche', shortLabel: 'Dim.' },
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
  const navigate = useNavigate()
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
    return new Map(recipes.map((recipe) => [String(recipe.id), recipe]))
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

  const plannedMealsCount = plannedRecipeIds.length

  const plannedDaysCount = DAYS.filter((day) =>
    MAIN_MEALS.some((meal) => planner[day.key][meal.key]),
  ).length

  const estimatedIngredientsCount = uniquePlannedRecipes.reduce(
    (total, recipe) => total + recipe.ingredients.length,
    0,
  )

  const filteredRecipes = useMemo(() => {
    const query = normalizeText(searchValue)

    if (!query) {
      return recipes.slice(0, 30)
    }

    return recipes
      .filter((recipe) => {
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
      .slice(0, 50)
  }, [recipes, searchValue])

  async function addRecipeIngredientsAutomatically(recipe: Recipe) {
    if (!user) {
      navigate('/auth')
      return
    }

    try {
      setSyncingRecipeId(recipe.id)

      await addRecipeIngredientsToShoppingList(recipe.id, recipe.ingredients)
    } catch (error) {
      console.error(error)

      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('déjà')
      ) {
        return
      }

      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('utilisateur non connecté')
      ) {
        navigate('/auth')
        return
      }

      setErrorMessage(
        'La recette a été ajoutée au planning, mais la liste de courses n’a pas pu être mise à jour.',
      )
    } finally {
      setSyncingRecipeId(null)
    }
  }

  async function removeRecipeIngredientsIfUnused(
    nextPlanner: MealPlannerState,
    recipeId: Recipe['id'],
  ) {
    if (plannerUsesRecipe(nextPlanner, recipeId)) {
      return
    }

    try {
      await deleteRecipeIngredientsFromShoppingList(recipeId)
    } catch (error) {
      console.error(error)

      setErrorMessage(
        'La recette a été retirée du planning, mais les ingrédients n’ont pas pu être supprimés de la liste de courses.',
      )
    }
  }

  function openRecipePicker(slot: OpenPickerSlot) {
    setOpenPickerSlot(slot)
    setSearchValue('')
    setErrorMessage('')
    setSuccessMessage('')
  }

  function closeRecipePicker() {
    setOpenPickerSlot(null)
    setSearchValue('')
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

    setErrorMessage('')
    setSuccessMessage(
      `"${recipe.title}" a été ajouté au planning. La liste de courses se met à jour automatiquement.`,
    )

    await addRecipeIngredientsAutomatically(recipe)

    if (oldRecipeId && oldRecipeId !== String(recipe.id)) {
      await removeRecipeIngredientsIfUnused(nextPlanner, Number(oldRecipeId))
    }

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

    setErrorMessage('')
    setSuccessMessage(
      'La recette a été retirée du planning. La liste de courses se met à jour automatiquement.',
    )

    await removeRecipeIngredientsIfUnused(nextPlanner, Number(recipeId))

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

    setErrorMessage('')
    setSuccessMessage(
      'La recette a été retirée du planning. La liste de courses se met à jour automatiquement.',
    )

    await removeRecipeIngredientsIfUnused(nextPlanner, Number(recipeId))

    window.setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }

  async function handleClearPlanning() {
    const confirmClear = window.confirm(
      'Voulez-vous vraiment vider tout le planning de la semaine ? Les ingrédients liés aux recettes du planning seront aussi retirés de la liste de courses.',
    )

    if (!confirmClear) {
      return
    }

    const recipeIdsToRemove = Array.from(new Set(plannedRecipeIds))
    const emptyPlanner = createEmptyPlanner()

    setPlanner(emptyPlanner)
    savePlanner(emptyPlanner)

    setErrorMessage('')
    setSuccessMessage(
      'Le planning a été vidé. La liste de courses se met à jour automatiquement.',
    )

    for (const recipeId of recipeIdsToRemove) {
      await removeRecipeIngredientsIfUnused(emptyPlanner, Number(recipeId))
    }

    window.setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }

  function handlePrintPlanning() {
    window.print()
  }

  function renderRecipeMiniCard(recipe: Recipe, actions?: React.ReactNode) {
    const image = getRecipeImage(recipe)
    const isImageUrl = typeof image === 'string' && image.startsWith('http')

    return (
      <div className="flex items-center gap-4 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] bg-[#fff1e6] text-3xl">
          {isImageUrl ? (
            <img
              src={image}
              alt={recipe.title}
              className="h-full w-full object-cover"
            />
          ) : (
            image
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-black text-stone-950">
            {recipe.title}
          </p>

          <p className="mt-1 text-sm font-bold text-stone-500">
            {recipe.prepTime + recipe.cookTime} min · {recipe.servings} pers.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">{actions}</div>
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

            .print-page {
              page-break-after: always;
            }

            .print-page:last-child {
              page-break-after: auto;
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

            .print-recipe-title {
              font-weight: 800;
            }

            .print-muted {
              color: #78716c;
            }
          }
        `}
      </style>

      <div className="print-planning">
        <div className="print-page">
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

            <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-[#fffaf3] px-4 py-3">
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

          <div className="grid grid-cols-3 gap-3">
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
                              <p className="print-recipe-title">
                                {recipe.title}
                              </p>

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
      </div>

      <section className="space-y-10">
        <div className="overflow-hidden rounded-[2.5rem] bg-[#fffaf3] shadow-sm ring-1 ring-orange-100">
          <div className="grid gap-10 px-6 py-10 xl:grid-cols-[0.9fr_1.1fr] xl:px-10">
            <div>
              <div className="mb-6 flex w-fit items-center gap-3 rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-orange-700">
                <span>🗓️</span>
                <span>Planning de semaine</span>
              </div>

              <h1 className="max-w-xl text-4xl font-black leading-tight text-stone-950 md:text-6xl">
                Organise tes repas simplement.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">
                Clique directement sur un repas, choisis une recette, et les
                ingrédients sont ajoutés automatiquement à ta liste de courses.
              </p>

              <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                <div className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-orange-100">
                  <p className="text-4xl font-black text-orange-600">
                    {plannedMealsCount}
                  </p>
                  <p className="mt-1 font-bold text-stone-700">repas</p>
                </div>

                <div className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-orange-100">
                  <p className="text-4xl font-black text-green-800">
                    {plannedDaysCount}
                  </p>
                  <p className="mt-1 font-bold text-stone-700">jours</p>
                </div>

                <div className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-orange-100">
                  <p className="text-4xl font-black text-stone-950">
                    {estimatedIngredientsCount}
                  </p>
                  <p className="mt-1 font-bold text-stone-700">ingrédients</p>
                </div>
              </div>

              <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
                <Link
                  to="/shopping-list"
                  className="rounded-full bg-orange-500 px-6 py-4 text-center font-black text-white shadow-sm transition hover:bg-orange-600"
                >
                  Voir ma liste de courses
                </Link>

                <Link
                  to="/recipes"
                  className="rounded-full border border-orange-200 bg-white px-6 py-4 text-center font-black text-stone-900 transition hover:bg-orange-50"
                >
                  Parcourir les recettes
                </Link>

                <button
                  type="button"
                  onClick={handlePrintPlanning}
                  className="rounded-full border border-orange-200 bg-white px-6 py-4 font-black text-stone-900 transition hover:bg-orange-50"
                >
                  Imprimer le planning
                </button>

                <button
                  type="button"
                  onClick={handleClearPlanning}
                  className="rounded-full border border-red-100 bg-white px-6 py-4 font-black text-red-600 transition hover:bg-red-50"
                >
                  Vider le planning
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
              <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                Habitudes et envies
              </p>

              <h2 className="mt-2 text-3xl font-black text-stone-950">
                Petit déjeuner, goûter et dessert
              </h2>

              <p className="mt-2 font-semibold text-stone-500">
                Ajoute plusieurs idées pour la semaine, sans devoir choisir un
                jour précis.
              </p>

              <div className="mt-6 space-y-5">
                {EXTRA_MEALS.map((extraMeal) => {
                  const recipeIds = planner.weeklyExtras[extraMeal.key]
                  const extraRecipes = recipeIds
                    .map((recipeId) => recipesById.get(recipeId))
                    .filter((recipe): recipe is Recipe => Boolean(recipe))

                  return (
                    <div
                      key={extraMeal.key}
                      className="rounded-[1.8rem] bg-[#fffaf3] p-5 ring-1 ring-orange-100"
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
                  className="grid gap-6 rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 xl:grid-cols-[0.35fr_1fr_1fr]"
                >
                  <div className="rounded-[1.8rem] bg-[#fffaf3] p-6 ring-1 ring-orange-100">
                    <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                      {day.shortLabel}
                    </p>

                    <h2 className="mt-2 text-4xl font-black text-stone-950">
                      {day.label}
                    </h2>

                    <p className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-black text-stone-700 shadow-sm ring-1 ring-orange-100">
                      {dayMealsCount}/2 repas
                    </p>
                  </div>

                  {MAIN_MEALS.map((meal) => {
                    const recipeId = planner[day.key][meal.key]
                    const recipe = recipeId ? recipesById.get(recipeId) : null
                    const mealDescription =
                      meal.key === 'lunch' ? 'Repas du midi' : 'Repas du soir'

                    return (
                      <div
                        key={meal.key}
                        className="rounded-[1.8rem] bg-[#fffaf3] p-5 ring-1 ring-orange-100"
                      >
                        <div className="mb-4">
                          <h3 className="text-xl font-black text-stone-950">
                            {meal.emoji} {meal.label}
                          </h3>

                          <p className="mt-1 font-semibold text-stone-500">
                            {mealDescription}
                          </p>
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
                            className="flex min-h-40 w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-orange-200 bg-white/70 px-5 py-6 text-center transition hover:bg-orange-50"
                          >
                            <span className="text-lg font-black text-stone-500">
                              Aucun repas prévu pour ce moment.
                            </span>

                            <span className="mt-4 rounded-full bg-orange-100 px-5 py-3 font-black text-orange-700">
                              + Ajouter une recette
                            </span>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </section>
              )
            })}
          </div>
        )}
      </section>

      {openPickerSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/40 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-[2rem] bg-[#fffaf3] p-6 shadow-2xl ring-1 ring-orange-100 md:p-8">
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
                  Recherche une recette, puis clique dessus pour l’ajouter. La
                  liste de courses sera mise à jour automatiquement.
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

            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Rechercher une recette : pâtes, gâteau, poulet..."
              autoFocus
              className="mt-6 w-full rounded-[1.5rem] border border-orange-200 bg-white px-5 py-4 text-lg font-semibold text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />

            <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-2">
              {filteredRecipes.length === 0 ? (
                <div className="rounded-[1.5rem] bg-white p-6 text-center text-stone-500 shadow-sm ring-1 ring-orange-100">
                  Aucune recette trouvée.
                </div>
              ) : (
                <div className="space-y-3">
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
                        className="flex w-full items-center gap-4 rounded-[1.5rem] bg-white p-4 text-left shadow-sm ring-1 ring-orange-100 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] bg-[#fff1e6] text-3xl">
                          {isImageUrl ? (
                            <img
                              src={image}
                              alt={recipe.title}
                              className="h-full w-full object-cover"
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