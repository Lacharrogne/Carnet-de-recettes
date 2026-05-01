import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getRecipes } from '../services/recipes'
import { addShoppingListItem } from '../services/shoppingList'
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

type PlannedMeal = {
  day: DayKey
  meal: MealKey
  recipe: Recipe
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

function getInitialPlanner() {
  try {
    const savedPlanner = window.localStorage.getItem(STORAGE_KEY)

    if (!savedPlanner) {
      return createEmptyPlanner()
    }

    return {
      ...createEmptyPlanner(),
      ...JSON.parse(savedPlanner),
    } as MealPlannerState
  } catch {
    return createEmptyPlanner()
  }
}

function getRecipeTotalTime(recipe: Recipe) {
  return recipe.prepTime + recipe.cookTime
}

function getMealLabel(meal: MealKey) {
  return MEALS.find((currentMeal) => currentMeal.key === meal)?.label ?? meal
}

function getDayLabel(day: DayKey) {
  return DAYS.find((currentDay) => currentDay.key === day)?.label ?? day
}

function RecipeMiniCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="mt-4 block rounded-[1.5rem] bg-[#fffaf3] p-4 ring-1 ring-orange-100 transition hover:bg-orange-50"
    >
      <div className="flex gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] bg-white text-4xl shadow-sm">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{recipe.image || '🍽️'}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
              {recipe.category}
            </span>

            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700">
              {recipe.difficulty}
            </span>
          </div>

          <h3 className="mt-2 line-clamp-2 font-black text-stone-950">
            {recipe.title}
          </h3>

          <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-stone-600">
            <span>⏱️ {getRecipeTotalTime(recipe)} min</span>
            <span>🍽️ {recipe.servings} pers.</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function MealPlannerPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [planner, setPlanner] = useState<MealPlannerState>(getInitialPlanner)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
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

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(planner))
  }, [planner])

  const recipeById = useMemo(() => {
    return new Map(recipes.map((recipe) => [String(recipe.id), recipe]))
  }, [recipes])

  const plannedMeals = useMemo(() => {
    const meals: PlannedMeal[] = []

    DAYS.forEach((day) => {
      MEALS.forEach((meal) => {
        const recipeId = planner[day.key][meal.key]
        const recipe = recipeById.get(recipeId)

        if (recipe) {
          meals.push({
            day: day.key,
            meal: meal.key,
            recipe,
          })
        }
      })
    })

    return meals
  }, [planner, recipeById])

  const plannedRecipeCount = plannedMeals.length

  const totalIngredientsCount = plannedMeals.reduce((total, plannedMeal) => {
    return total + plannedMeal.recipe.ingredients.filter(Boolean).length
  }, 0)

  const uniqueRecipeCount = new Set(
    plannedMeals.map((plannedMeal) => plannedMeal.recipe.id),
  ).size

  function updateMeal(day: DayKey, meal: MealKey, recipeId: string) {
    setPlanner((currentPlanner) => ({
      ...currentPlanner,
      [day]: {
        ...currentPlanner[day],
        [meal]: recipeId,
      },
    }))

    setErrorMessage('')
    setSuccessMessage('')
  }

  function clearMeal(day: DayKey, meal: MealKey) {
    updateMeal(day, meal, '')
  }

  function clearPlanner() {
    const confirmClear = window.confirm(
      'Voulez-vous vraiment vider tout le planning de la semaine ?',
    )

    if (!confirmClear) return

    setPlanner(createEmptyPlanner())
    setErrorMessage('')
    setSuccessMessage('Le planning a été vidé.')
  }

  async function generateShoppingList() {
    if (plannedMeals.length === 0) {
      setErrorMessage('Ajoute au moins une recette dans le planning.')
      return
    }

    const ingredientsToAdd = plannedMeals.flatMap((plannedMeal) =>
      plannedMeal.recipe.ingredients.filter(Boolean),
    )

    if (ingredientsToAdd.length === 0) {
      setErrorMessage('Les recettes sélectionnées n’ont pas d’ingrédients.')
      return
    }

    try {
      setGenerating(true)
      setErrorMessage('')
      setSuccessMessage('')

      await Promise.all(
        ingredientsToAdd.map((ingredient) => addShoppingListItem(ingredient)),
      )

      setSuccessMessage(
        `${ingredientsToAdd.length} ingrédient${
          ingredientsToAdd.length > 1 ? 's ont' : ' a'
        } été ajouté${ingredientsToAdd.length > 1 ? 's' : ''} à ta liste de courses.`,
      )
    } catch (error) {
      console.error(error)

      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('utilisateur non connecté')
      ) {
        setErrorMessage(
          'Connecte-toi pour générer la liste de courses depuis ton planning.',
        )
      } else {
        setErrorMessage(
          'Impossible de générer la liste de courses pour le moment.',
        )
      }
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-[2rem] bg-white p-8 text-stone-600 shadow-sm ring-1 ring-orange-100">
        Chargement du planning...
      </div>
    )
  }

  return (
    <section className="space-y-10">
      <div className="overflow-hidden rounded-[2.5rem] bg-[#fffaf3] shadow-sm ring-1 ring-orange-100">
        <div className="grid gap-10 px-6 py-10 lg:grid-cols-[1fr_0.8fr] lg:px-12 lg:py-14">
          <div>
            <div className="mb-6 flex w-fit items-center gap-3 rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-orange-700">
              <span>📅</span>
              <span>Planning de semaine</span>
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight text-stone-950 md:text-6xl">
              Prépare tes repas de la semaine
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
              Choisis une recette pour chaque jour, puis génère automatiquement
              ta liste de courses avec tous les ingrédients nécessaires.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={generateShoppingList}
                disabled={generating || plannedMeals.length === 0}
                className="rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating
                  ? 'Génération...'
                  : 'Générer ma liste de courses'}
              </button>

              <button
                type="button"
                onClick={clearPlanner}
                className="rounded-full border border-orange-200 bg-white px-6 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
              >
                Vider le planning
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
              <p className="text-4xl font-black text-orange-700">
                {plannedRecipeCount}
              </p>
              <p className="mt-1 font-bold text-stone-700">
                repas planifié{plannedRecipeCount > 1 ? 's' : ''}
              </p>
            </div>

            <div className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
              <p className="text-4xl font-black text-stone-950">
                {uniqueRecipeCount}
              </p>
              <p className="mt-1 font-bold text-stone-700">
                recette{uniqueRecipeCount > 1 ? 's' : ''} différente
                {uniqueRecipeCount > 1 ? 's' : ''}
              </p>
            </div>

            <div className="rounded-[1.75rem] bg-green-50 p-6 shadow-sm ring-1 ring-green-100">
              <p className="text-4xl font-black text-green-800">
                {totalIngredientsCount}
              </p>
              <p className="mt-1 font-bold text-green-800">
                ingrédient{totalIngredientsCount > 1 ? 's' : ''} à prévoir
              </p>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl bg-red-50 px-5 py-4 text-red-700">
          <p className="font-bold">{errorMessage}</p>

          {errorMessage.includes('Connecte-toi') && (
            <Link
              to="/auth"
              className="mt-2 inline-block font-black text-red-800 underline"
            >
              Aller à la connexion
            </Link>
          )}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl bg-green-50 px-5 py-4 text-green-700">
          <p className="font-bold">{successMessage}</p>

          <Link
            to="/shopping-list"
            className="mt-2 inline-block font-black text-green-800 underline"
          >
            Voir ma liste de courses
          </Link>
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
          <p className="text-2xl font-black text-stone-950">
            Aucune recette disponible
          </p>

          <p className="mt-3 text-stone-600">
            Ajoute d’abord quelques recettes pour pouvoir créer un planning.
          </p>

          <Link
            to="/add-recipe"
            className="mt-6 inline-flex rounded-full bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
          >
            Ajouter une recette
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {DAYS.map((day) => (
            <article
              key={day.key}
              className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100"
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                    {day.shortLabel}
                  </p>

                  <h2 className="text-3xl font-black text-stone-950">
                    {day.label}
                  </h2>
                </div>

                <span className="rounded-full bg-[#fffaf3] px-4 py-2 text-sm font-black text-stone-700 ring-1 ring-orange-100">
                  {
                    MEALS.filter((meal) => planner[day.key][meal.key]).length
                  }
                  /2 repas
                </span>
              </div>

              <div className="space-y-5">
                {MEALS.map((meal) => {
                  const selectedRecipeId = planner[day.key][meal.key]
                  const selectedRecipe = recipeById.get(selectedRecipeId)

                  return (
                    <div
                      key={meal.key}
                      className="rounded-[2rem] bg-[#fffaf3] p-5 ring-1 ring-orange-100"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="flex items-center gap-2 text-lg font-black text-stone-950">
                          <span>{meal.emoji}</span>
                          {meal.label}
                        </h3>

                        {selectedRecipe && (
                          <button
                            type="button"
                            onClick={() => clearMeal(day.key, meal.key)}
                            className="text-sm font-black text-orange-700 underline"
                          >
                            Retirer
                          </button>
                        )}
                      </div>

                      <select
                        value={selectedRecipeId}
                        onChange={(event) =>
                          updateMeal(day.key, meal.key, event.target.value)
                        }
                        className="mt-4 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 font-semibold text-stone-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                      >
                        <option value="">Choisir une recette</option>

                        {recipes.map((recipe) => (
                          <option key={recipe.id} value={String(recipe.id)}>
                            {recipe.title} — {getRecipeTotalTime(recipe)} min
                          </option>
                        ))}
                      </select>

                      {selectedRecipe ? (
                        <RecipeMiniCard recipe={selectedRecipe} />
                      ) : (
                        <p className="mt-4 rounded-[1.5rem] bg-white p-4 text-sm font-semibold text-stone-500 ring-1 ring-orange-100">
                          Aucun repas choisi pour le {getMealLabel(meal.key).toLowerCase()}.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      )}

      {plannedMeals.length > 0 && (
        <div className="rounded-[2.5rem] bg-[#fffaf3] p-6 shadow-sm ring-1 ring-orange-100 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
                Récapitulatif
              </p>

              <h2 className="mt-2 text-3xl font-black text-stone-950">
                Repas prévus cette semaine
              </h2>
            </div>

            <button
              type="button"
              onClick={generateShoppingList}
              disabled={generating}
              className="rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? 'Génération...' : 'Envoyer en liste de courses'}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plannedMeals.map((plannedMeal) => (
              <Link
                key={`${plannedMeal.day}-${plannedMeal.meal}`}
                to={`/recipes/${plannedMeal.recipe.id}`}
                className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100 transition hover:bg-orange-50"
              >
                <p className="text-xs font-black uppercase tracking-wide text-orange-600">
                  {getDayLabel(plannedMeal.day)} ·{' '}
                  {getMealLabel(plannedMeal.meal)}
                </p>

                <p className="mt-2 font-black text-stone-950">
                  {plannedMeal.recipe.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}