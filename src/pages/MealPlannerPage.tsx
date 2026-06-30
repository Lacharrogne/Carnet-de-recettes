import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import PlannerExtrasPanel from '../components/planner/PlannerExtrasPanel'
import PlannerPrintView from '../components/planner/PlannerPrintView'
import PlannerWeekGrid from '../components/planner/PlannerWeekGrid'
import RecipeMiniCard from '../components/planner/RecipeMiniCard'
import RecipePickerModal from '../components/planner/RecipePickerModal'
import Alert from '../components/ui/Alert'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabase'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import {
  PLANNER_STORAGE_KEY,
  createEmptyPlanner,
  getSavedPlanner,
} from '../lib/weeklyPlanner'
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

function savePlanner(planner: MealPlannerState) {
  window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(planner))
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
  useDocumentTitle('Planning des repas')
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
        : `"${recipe.title}" a été ajouté au planning. Connectez-vous pour synchroniser la liste de courses.`,
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

  return (
    <>
      <PlannerPrintView
        weekCompletion={weekCompletion}
        plannedMealsCount={plannedMealsCount}
        plannedDaysCount={plannedDaysCount}
        estimatedIngredientsCount={estimatedIngredientsCount}
        planner={planner}
        recipesById={recipesById}
        days={DAYS}
        mainMeals={MAIN_MEALS}
        extraMeals={EXTRA_MEALS}
      />

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
                Prévoyez vos déjeuners, vos dîners et vos petites envies de la
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
                  💡 Votre planning est enregistré sur cet appareil. Connectez-vous
                  pour synchroniser automatiquement la liste de courses.
                </div>
              )}
            </div>

            <PlannerExtrasPanel
              extraMeals={EXTRA_MEALS}
              weeklyExtras={planner.weeklyExtras}
              recipesById={recipesById}
              getRecipeImage={getRecipeImage}
              onAddExtra={(meal) => openRecipePicker({ type: 'extra', meal })}
              onRemoveExtra={handleRemoveExtraRecipe}
            />
          </div>
        </div>

        {errorMessage && (
          <Alert tone="error">
            <p className="font-bold">{errorMessage}</p>
          </Alert>
        )}

        {successMessage && (
          <Alert tone="success">
            <p className="font-bold">{successMessage}</p>
          </Alert>
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
              {uniquePlannedRecipes.map((recipe) => (
                <RecipeMiniCard
                  key={recipe.id}
                  recipe={recipe}
                  getRecipeImage={getRecipeImage}
                />
              ))}
            </div>
          </section>
        )}

        <PlannerWeekGrid
          loading={loading}
          days={DAYS}
          mainMeals={MAIN_MEALS}
          planner={planner}
          recipesById={recipesById}
          getRecipeImage={getRecipeImage}
          onPickMain={(day, meal) =>
            openRecipePicker({ type: 'main', day, meal })
          }
          onRemoveMain={handleRemoveMainRecipe}
        />
      </section>

      {openPickerSlot && (
        <RecipePickerModal
          title={
            openPickerSlot.type === 'main'
              ? `${getDayLabel(openPickerSlot.day)} — ${getMealLabel(
                  openPickerSlot.meal,
                )}`
              : getMealLabel(openPickerSlot.meal)
          }
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          allCategoriesValue={ALL_CATEGORIES_VALUE}
          filteredRecipes={filteredRecipes}
          syncingRecipeId={syncingRecipeId}
          getRecipeImage={getRecipeImage}
          onClose={closeRecipePicker}
          onChooseRecipe={handleChooseRecipe}
        />
      )}
    </>
  )
}