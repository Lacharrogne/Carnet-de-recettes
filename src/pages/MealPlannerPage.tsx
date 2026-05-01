import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
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

type MealKey = 'lunch' | 'dinner'

type MealPlannerState = Record<DayKey, Record<MealKey, string>>

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

const MEALS: { key: MealKey; label: string; emoji: string }[] = [
  { key: 'lunch', label: 'Déjeuner', emoji: '☀️' },
  { key: 'dinner', label: 'Dîner', emoji: '🌙' },
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
  }
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

export default function MealPlannerPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [planner, setPlanner] = useState<MealPlannerState>(() =>
    getSavedPlanner(),
  )

  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [selectedDay, setSelectedDay] = useState<DayKey>('monday')
  const [selectedMeal, setSelectedMeal] = useState<MealKey>('dinner')

  const [loading, setLoading] = useState(true)
  const [generatingShoppingList, setGeneratingShoppingList] = useState(false)
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
    return DAYS.flatMap((day) =>
      MEALS.map((meal) => planner[day.key][meal.key]).filter(Boolean),
    )
  }, [planner])

  const uniquePlannedRecipes = useMemo(() => {
    const uniqueIds = Array.from(new Set(plannedRecipeIds))

    return uniqueIds
      .map((recipeId) => recipesById.get(recipeId))
      .filter((recipe): recipe is Recipe => Boolean(recipe))
  }, [plannedRecipeIds, recipesById])

  const plannedMealsCount = plannedRecipeIds.length

  const plannedDaysCount = DAYS.filter((day) =>
    MEALS.some((meal) => planner[day.key][meal.key]),
  ).length

  const estimatedIngredientsCount = uniquePlannedRecipes.reduce(
    (total, recipe) => total + recipe.ingredients.length,
    0,
  )

  function updatePlannerSlot(
    day: DayKey,
    meal: MealKey,
    recipeId: string,
    message?: string,
  ) {
    const nextPlanner: MealPlannerState = {
      ...planner,
      [day]: {
        ...planner[day],
        [meal]: recipeId,
      },
    }

    setPlanner(nextPlanner)
    savePlanner(nextPlanner)
    setErrorMessage('')
    setSuccessMessage(message || '')
  }

  function handleAddRecipeToPlanning() {
    if (!selectedRecipeId) {
      setSuccessMessage('')
      setErrorMessage('Choisis une recette avant de l’ajouter au planning.')
      return
    }

    const recipe = recipesById.get(selectedRecipeId)

    updatePlannerSlot(
      selectedDay,
      selectedMeal,
      selectedRecipeId,
      recipe
        ? `"${recipe.title}" a été ajouté au planning.`
        : 'Recette ajoutée au planning.',
    )
  }

  function handleRemoveRecipe(day: DayKey, meal: MealKey) {
    updatePlannerSlot(day, meal, '', 'La recette a été retirée du planning.')
  }

  function handleClearPlanning() {
    const confirmClear = window.confirm(
      'Voulez-vous vraiment vider tout le planning de la semaine ?',
    )

    if (!confirmClear) return

    const emptyPlanner = createEmptyPlanner()

    setPlanner(emptyPlanner)
    savePlanner(emptyPlanner)
    setErrorMessage('')
    setSuccessMessage('Le planning a été vidé.')
  }

  async function handleGenerateShoppingList() {
    if (!user) {
      navigate('/auth')
      return
    }

    if (uniquePlannedRecipes.length === 0) {
      setSuccessMessage('')
      setErrorMessage(
        'Ajoute au moins une recette au planning avant de générer la liste de courses.',
      )
      return
    }

    try {
      setGeneratingShoppingList(true)
      setErrorMessage('')
      setSuccessMessage('')

      let addedItemsCount = 0

      for (const recipe of uniquePlannedRecipes) {
        const addedItems = await addRecipeIngredientsToShoppingList(
          recipe.id,
          recipe.ingredients,
        )

        addedItemsCount += addedItems.length
      }

      if (addedItemsCount === 0) {
        setSuccessMessage(
          'Les ingrédients du planning sont déjà dans ta liste de courses.',
        )
      } else {
        setSuccessMessage(
          `${addedItemsCount} ingrédient${
            addedItemsCount > 1 ? 's ont' : ' a'
          } été ajouté${addedItemsCount > 1 ? 's' : ''} à ta liste de courses.`,
        )
      }
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de générer la liste de courses.')
    } finally {
      setGeneratingShoppingList(false)
    }
  }

  function selectPlanningSlot(day: DayKey, meal: MealKey) {
    setSelectedDay(day)
    setSelectedMeal(meal)
    setErrorMessage('')
    setSuccessMessage('Choisis maintenant une recette dans le formulaire.')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <section className="mx-auto max-w-6xl space-y-8 pt-4">
      <div className="rounded-[2.5rem] bg-[#fffaf3] p-6 shadow-sm ring-1 ring-orange-100 md:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-5 flex w-fit items-center gap-3 rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-orange-700">
              <span>📅</span>
              <span>Planning de semaine</span>
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight text-stone-950 md:text-5xl">
              Organise tes repas simplement.
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
              Prévois les déjeuners et les dîners, puis transforme ton planning
              en liste de courses.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[390px]">
            <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
              <p className="text-3xl font-black text-orange-600">
                {plannedMealsCount}
              </p>
              <p className="text-sm font-bold text-stone-600">repas</p>
            </div>

            <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
              <p className="text-3xl font-black text-green-700">
                {plannedDaysCount}
              </p>
              <p className="text-sm font-bold text-stone-600">jours</p>
            </div>

            <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
              <p className="text-3xl font-black text-stone-800">
                {estimatedIngredientsCount}
              </p>
              <p className="text-sm font-bold text-stone-600">ingrédients</p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerateShoppingList}
            disabled={generatingShoppingList}
            className="rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generatingShoppingList
              ? 'Génération en cours...'
              : 'Générer la liste de courses'}
          </button>

          <Link
            to="/shopping-list"
            className="rounded-full border border-orange-200 bg-white px-6 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
          >
            Voir ma liste
          </Link>

          <button
            type="button"
            onClick={handleClearPlanning}
            className="rounded-full border border-red-100 bg-white px-6 py-3 font-bold text-red-600 transition hover:bg-red-50"
          >
            Vider le planning
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl bg-red-50 px-5 py-4 font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl bg-green-50 px-5 py-4 font-bold text-green-700">
          {successMessage}
        </div>
      )}

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-orange-600">Ajouter rapidement</p>

            <h2 className="text-2xl font-black text-stone-950">
              Choisir une recette pour un repas
            </h2>

            <p className="mt-1 text-sm font-semibold text-stone-500">
              Sélectionne une recette, un jour, puis le déjeuner ou le dîner à
              remplir.
            </p>
          </div>

          <Link
            to="/recipes"
            className="rounded-full bg-[#fffaf3] px-5 py-3 text-sm font-bold text-orange-700 ring-1 ring-orange-100 transition hover:bg-orange-50"
          >
            Parcourir les recettes
          </Link>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.7fr_auto]">
          <select
            value={selectedRecipeId}
            onChange={(event) => {
              setSelectedRecipeId(event.target.value)
              setErrorMessage('')
              setSuccessMessage('')
            }}
            className="rounded-2xl border border-orange-100 bg-[#fffaf3] px-4 py-3 font-semibold text-stone-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          >
            <option value="">Choisir une recette</option>

            {recipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.title}
              </option>
            ))}
          </select>

          <select
            value={selectedDay}
            onChange={(event) => {
              setSelectedDay(event.target.value as DayKey)
              setErrorMessage('')
              setSuccessMessage('')
            }}
            className="rounded-2xl border border-orange-100 bg-[#fffaf3] px-4 py-3 font-semibold text-stone-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          >
            {DAYS.map((day) => (
              <option key={day.key} value={day.key}>
                {day.label}
              </option>
            ))}
          </select>

          <select
            value={selectedMeal}
            onChange={(event) => {
              setSelectedMeal(event.target.value as MealKey)
              setErrorMessage('')
              setSuccessMessage('')
            }}
            className="rounded-2xl border border-orange-100 bg-[#fffaf3] px-4 py-3 font-semibold text-stone-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          >
            {MEALS.map((meal) => (
              <option key={meal.key} value={meal.key}>
                {meal.emoji} {meal.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAddRecipeToPlanning}
            className="rounded-2xl bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600"
          >
            Ajouter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[2rem] bg-white p-8 text-stone-600 shadow-sm ring-1 ring-orange-100">
          Chargement du planning...
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.map((day) => {
            const dayMealsCount = MEALS.filter(
              (meal) => planner[day.key][meal.key],
            ).length

            return (
              <section
                key={day.key}
                className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100"
              >
                <div className="grid gap-5 lg:grid-cols-[180px_1fr] lg:items-stretch">
                  <div className="flex items-center justify-between rounded-[1.5rem] bg-[#fffaf3] px-5 py-4 ring-1 ring-orange-100 lg:block">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                        {day.shortLabel}
                      </p>

                      <h2 className="text-3xl font-black text-stone-950">
                        {day.label}
                      </h2>

                      <p className="mt-2 text-sm font-semibold text-stone-500">
                        Déjeuner et dîner
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-stone-600 shadow-sm ring-1 ring-orange-100 lg:mt-5 lg:inline-block">
                      {dayMealsCount}/2 repas
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {MEALS.map((meal) => {
                      const recipeId = planner[day.key][meal.key]
                      const recipe = recipeId ? recipesById.get(recipeId) : null
                      const image = recipe ? getRecipeImage(recipe) : null
                      const isImageUrl =
                        typeof image === 'string' && image.startsWith('http')

                      const mealDescription =
                        meal.key === 'lunch'
                          ? 'Repas du midi'
                          : 'Repas du soir'

                      return (
                        <div
                          key={meal.key}
                          className={`rounded-[1.5rem] border p-4 transition ${
                            recipe
                              ? 'border-orange-200 bg-[#fffaf3]'
                              : 'border-dashed border-orange-200 bg-white/70'
                          }`}
                        >
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-black text-stone-900">
                                {meal.emoji} {meal.label}
                              </p>

                              <p className="mt-1 text-sm font-semibold text-stone-500">
                                {mealDescription}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                selectPlanningSlot(day.key, meal.key)
                              }
                              className="rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700 transition hover:bg-orange-200"
                            >
                              {recipe ? 'Changer' : '+ Ajouter'}
                            </button>
                          </div>

                          {recipe ? (
                            <div className="flex gap-4 rounded-[1.25rem] bg-white p-3 shadow-sm ring-1 ring-orange-100">
                              <Link
                                to={`/recipes/${recipe.id}`}
                                className="h-24 w-24 shrink-0 overflow-hidden rounded-[1rem] bg-[#fff1e6]"
                              >
                                {isImageUrl ? (
                                  <img
                                    src={image}
                                    alt={recipe.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-4xl">
                                    {image}
                                  </div>
                                )}
                              </Link>

                              <div className="min-w-0 flex-1">
                                <Link
                                  to={`/recipes/${recipe.id}`}
                                  className="line-clamp-2 font-black text-stone-950 transition hover:text-orange-600"
                                >
                                  {recipe.title}
                                </Link>

                                <p className="mt-1 text-sm font-semibold text-stone-500">
                                  {recipe.prepTime + recipe.cookTime} min ·{' '}
                                  {recipe.servings} pers.
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      selectPlanningSlot(day.key, meal.key)
                                    }
                                    className="rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 transition hover:bg-orange-100"
                                  >
                                    Remplacer
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveRecipe(day.key, meal.key)
                                    }
                                    className="rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                                  >
                                    Retirer
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-[1.25rem] border border-dashed border-orange-200 bg-white/70 px-4 py-5">
                              <p className="font-bold text-stone-500">
                                Aucun repas prévu.
                              </p>

                              <p className="mt-1 text-sm font-semibold text-stone-400">
                                Clique sur “+ Ajouter” pour choisir une recette
                                dans le formulaire du haut.
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </section>
  )
}