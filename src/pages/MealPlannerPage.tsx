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

type MainMealKey = 'lunch' | 'dinner'
type ExtraMealKey = 'breakfast' | 'snack' | 'dessert'

type MealPlannerState = {
  days: Record<DayKey, Record<MainMealKey, string>>
  extras: Record<ExtraMealKey, string[]>
}

type ActiveModal =
  | {
      type: 'daily'
      day: DayKey
      meal: MainMealKey
    }
  | {
      type: 'extra'
      extra: ExtraMealKey
    }
  | null

const STORAGE_KEY = 'carnet-recettes-weekly-planner'
const SITE_LOGO_URL = '/ChatGPT Image 1 mai 2026, 04_35_16.png'

const DAYS: { key: DayKey; shortLabel: string; label: string }[] = [
  { key: 'monday', shortLabel: 'Lun.', label: 'Lundi' },
  { key: 'tuesday', shortLabel: 'Mar.', label: 'Mardi' },
  { key: 'wednesday', shortLabel: 'Mer.', label: 'Mercredi' },
  { key: 'thursday', shortLabel: 'Jeu.', label: 'Jeudi' },
  { key: 'friday', shortLabel: 'Ven.', label: 'Vendredi' },
  { key: 'saturday', shortLabel: 'Sam.', label: 'Samedi' },
  { key: 'sunday', shortLabel: 'Dim.', label: 'Dimanche' },
]

const MAIN_MEALS: {
  key: MainMealKey
  label: string
  description: string
  emoji: string
}[] = [
  {
    key: 'lunch',
    label: 'Déjeuner',
    description: 'Repas du midi',
    emoji: '☀️',
  },
  {
    key: 'dinner',
    label: 'Dîner',
    description: 'Repas du soir',
    emoji: '🌙',
  },
]

const EXTRA_MEALS: {
  key: ExtraMealKey
  label: string
  description: string
  emptyMessage: string
  emoji: string
}[] = [
  {
    key: 'breakfast',
    label: 'Petit déjeuner',
    description: 'Une ou plusieurs idées pour la semaine',
    emptyMessage: 'Ajouter une idée pour petit déjeuner.',
    emoji: '🥐',
  },
  {
    key: 'snack',
    label: 'Goûter',
    description: 'Des idées rapides pour les pauses',
    emptyMessage: 'Ajouter une idée pour goûter.',
    emoji: '🍪',
  },
  {
    key: 'dessert',
    label: 'Dessert',
    description: 'Des desserts à prévoir pour la semaine',
    emptyMessage: 'Ajouter une idée pour dessert.',
    emoji: '🍰',
  },
]

function createEmptyPlanner(): MealPlannerState {
  return {
    days: {
      monday: { lunch: '', dinner: '' },
      tuesday: { lunch: '', dinner: '' },
      wednesday: { lunch: '', dinner: '' },
      thursday: { lunch: '', dinner: '' },
      friday: { lunch: '', dinner: '' },
      saturday: { lunch: '', dinner: '' },
      sunday: { lunch: '', dinner: '' },
    },
    extras: {
      breakfast: [],
      snack: [],
      dessert: [],
    },
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

    const parsedPlanner = JSON.parse(savedPlanner) as Partial<
      MealPlannerState & Record<DayKey, Record<MainMealKey, string>>
    >

    if (parsedPlanner.days) {
      return {
        days: {
          monday: { ...emptyPlanner.days.monday, ...parsedPlanner.days.monday },
          tuesday: {
            ...emptyPlanner.days.tuesday,
            ...parsedPlanner.days.tuesday,
          },
          wednesday: {
            ...emptyPlanner.days.wednesday,
            ...parsedPlanner.days.wednesday,
          },
          thursday: {
            ...emptyPlanner.days.thursday,
            ...parsedPlanner.days.thursday,
          },
          friday: { ...emptyPlanner.days.friday, ...parsedPlanner.days.friday },
          saturday: {
            ...emptyPlanner.days.saturday,
            ...parsedPlanner.days.saturday,
          },
          sunday: { ...emptyPlanner.days.sunday, ...parsedPlanner.days.sunday },
        },
        extras: {
          breakfast: parsedPlanner.extras?.breakfast ?? [],
          snack: parsedPlanner.extras?.snack ?? [],
          dessert: parsedPlanner.extras?.dessert ?? [],
        },
      }
    }

    return {
      ...emptyPlanner,
      days: {
        monday: { ...emptyPlanner.days.monday, ...parsedPlanner.monday },
        tuesday: { ...emptyPlanner.days.tuesday, ...parsedPlanner.tuesday },
        wednesday: {
          ...emptyPlanner.days.wednesday,
          ...parsedPlanner.wednesday,
        },
        thursday: { ...emptyPlanner.days.thursday, ...parsedPlanner.thursday },
        friday: { ...emptyPlanner.days.friday, ...parsedPlanner.friday },
        saturday: { ...emptyPlanner.days.saturday, ...parsedPlanner.saturday },
        sunday: { ...emptyPlanner.days.sunday, ...parsedPlanner.sunday },
      },
    }
  } catch {
    return createEmptyPlanner()
  }
}

function savePlanner(planner: MealPlannerState) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(planner))
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getDayLabel(day: DayKey) {
  return DAYS.find((currentDay) => currentDay.key === day)?.label ?? day
}

function getMainMealLabel(meal: MainMealKey) {
  return MAIN_MEALS.find((currentMeal) => currentMeal.key === meal)?.label ?? meal
}

function getExtraMealLabel(extra: ExtraMealKey) {
  return EXTRA_MEALS.find((currentExtra) => currentExtra.key === extra)?.label ?? extra
}

function getRecipeByStoredId(recipes: Recipe[], recipeId: string) {
  return recipes.find((recipe) => String(recipe.id) === recipeId) ?? null
}

function getRecipeImage(recipe: Recipe) {
  return recipe.imageUrl || recipe.image
}

function getRecipeTotalTime(recipe: Recipe) {
  return recipe.prepTime + recipe.cookTime
}

function getAllPlannedRecipeIds(planner: MealPlannerState) {
  const ids: string[] = []

  DAYS.forEach((day) => {
    MAIN_MEALS.forEach((meal) => {
      const recipeId = planner.days[day.key][meal.key]

      if (recipeId) {
        ids.push(recipeId)
      }
    })
  })

  EXTRA_MEALS.forEach((extra) => {
    ids.push(...planner.extras[extra.key])
  })

  return ids
}

function getUniquePlannedRecipes(planner: MealPlannerState, recipes: Recipe[]) {
  const recipeIds = Array.from(new Set(getAllPlannedRecipeIds(planner)))

  return recipeIds
    .map((recipeId) => getRecipeByStoredId(recipes, recipeId))
    .filter((recipe): recipe is Recipe => !!recipe)
}

function RecipeMiniature({ recipe }: { recipe: Recipe }) {
  const imageToDisplay = getRecipeImage(recipe)

  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] bg-[#fff1e6] text-4xl">
      {imageToDisplay && imageToDisplay.startsWith('http') ? (
        <img
          src={imageToDisplay}
          alt={recipe.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{recipe.image || '🍽️'} </span>
      )}
    </div>
  )
}

export default function MealPlannerPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [planner, setPlanner] = useState<MealPlannerState>(() =>
    getSavedPlanner(),
  )

  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [addingRecipeId, setAddingRecipeId] = useState<Recipe['id'] | null>(
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
          setErrorMessage('Impossible de charger les recettes pour le moment.')
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
    savePlanner(planner)
  }, [planner])

  const filteredRecipes = useMemo(() => {
    const search = normalizeText(recipeSearch)

    if (!search) {
      return recipes
    }

    return recipes.filter((recipe) => {
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

      return searchableContent.includes(search)
    })
  }, [recipeSearch, recipes])

  const plannedMealCount = useMemo(() => {
    return DAYS.reduce((count, day) => {
      return (
        count +
        MAIN_MEALS.filter((meal) => planner.days[day.key][meal.key]).length
      )
    }, 0)
  }, [planner])

  const organizedDayCount = useMemo(() => {
    return DAYS.filter((day) => {
      return MAIN_MEALS.some((meal) => planner.days[day.key][meal.key])
    }).length
  }, [planner])

  const estimatedIngredientCount = useMemo(() => {
    const uniqueIngredients = new Set<string>()

    getUniquePlannedRecipes(planner, recipes).forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        const normalizedIngredient = normalizeText(ingredient)

        if (normalizedIngredient) {
          uniqueIngredients.add(normalizedIngredient)
        }
      })
    })

    return uniqueIngredients.size
  }, [planner, recipes])

  function clearMessages() {
    setErrorMessage('')
    setSuccessMessage('')
  }

  function openDailyModal(day: DayKey, meal: MainMealKey) {
    clearMessages()
    setRecipeSearch('')
    setActiveModal({ type: 'daily', day, meal })
  }

  function openExtraModal(extra: ExtraMealKey) {
    clearMessages()
    setRecipeSearch('')
    setActiveModal({ type: 'extra', extra })
  }

  function closeModal() {
    setActiveModal(null)
    setRecipeSearch('')
    setAddingRecipeId(null)
  }

  function removeDailyRecipe(day: DayKey, meal: MainMealKey) {
    setPlanner((currentPlanner) => ({
      ...currentPlanner,
      days: {
        ...currentPlanner.days,
        [day]: {
          ...currentPlanner.days[day],
          [meal]: '',
        },
      },
    }))

    setSuccessMessage('La recette a été retirée du planning.')
    setErrorMessage('')
  }

  function removeExtraRecipe(extra: ExtraMealKey, recipeIdToRemove: string) {
    setPlanner((currentPlanner) => ({
      ...currentPlanner,
      extras: {
        ...currentPlanner.extras,
        [extra]: currentPlanner.extras[extra].filter(
          (recipeId) => recipeId !== recipeIdToRemove,
        ),
      },
    }))

    setSuccessMessage('La recette a été retirée du planning.')
    setErrorMessage('')
  }

  function clearPlanner() {
    const confirmClear = window.confirm(
      'Voulez-vous vraiment vider tout le planning ?',
    )

    if (!confirmClear) return

    setPlanner(createEmptyPlanner())
    setSuccessMessage('Le planning a été vidé.')
    setErrorMessage('')
  }

  async function addRecipeToShoppingListAutomatically(recipe: Recipe) {
    if (recipe.ingredients.length === 0) {
      return 0
    }

    const createdItems = await addRecipeIngredientsToShoppingList(
      recipe.id,
      recipe.ingredients,
    )

    return createdItems.length
  }

  async function handleSelectRecipe(recipe: Recipe) {
    if (!activeModal) return

    if (!user) {
      navigate('/auth')
      return
    }

    try {
      setAddingRecipeId(recipe.id)
      setErrorMessage('')
      setSuccessMessage('')

      if (activeModal.type === 'daily') {
        setPlanner((currentPlanner) => ({
          ...currentPlanner,
          days: {
            ...currentPlanner.days,
            [activeModal.day]: {
              ...currentPlanner.days[activeModal.day],
              [activeModal.meal]: String(recipe.id),
            },
          },
        }))
      }

      if (activeModal.type === 'extra') {
        setPlanner((currentPlanner) => {
          const currentRecipes = currentPlanner.extras[activeModal.extra]
          const recipeAlreadyAdded = currentRecipes.includes(String(recipe.id))

          return {
            ...currentPlanner,
            extras: {
              ...currentPlanner.extras,
              [activeModal.extra]: recipeAlreadyAdded
                ? currentRecipes
                : [...currentRecipes, String(recipe.id)],
            },
          }
        })
      }

      let createdIngredientsCount = 0

      try {
        createdIngredientsCount =
          await addRecipeToShoppingListAutomatically(recipe)
      } catch (error) {
        console.error(error)
      }

      const slotText =
        activeModal.type === 'daily'
          ? `${getDayLabel(activeModal.day).toLowerCase()} ${getMainMealLabel(
              activeModal.meal,
            ).toLowerCase()}`
          : getExtraMealLabel(activeModal.extra).toLowerCase()

      setSuccessMessage(
        createdIngredientsCount > 0
          ? `"${recipe.title}" a été ajouté au planning pour ${slotText}. ${createdIngredientsCount} ingrédient${
              createdIngredientsCount > 1 ? 's ont' : ' a'
            } été ajouté${
              createdIngredientsCount > 1 ? 's' : ''
            } automatiquement à ta liste de courses.`
          : `"${recipe.title}" a été ajouté au planning pour ${slotText}. La liste de courses est déjà à jour.`,
      )

      closeModal()
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible d’ajouter cette recette au planning.')
    } finally {
      setAddingRecipeId(null)
    }
  }

  function handlePrintPlanner() {
    window.print()
  }

  function renderDailyMealSlot(day: DayKey, meal: MainMealKey) {
    const recipeId = planner.days[day][meal]
    const recipe = recipeId ? getRecipeByStoredId(recipes, recipeId) : null
    const mealData = MAIN_MEALS.find((currentMeal) => currentMeal.key === meal)

    return (
      <div className="rounded-[2rem] bg-[#fffaf3] p-5 ring-1 ring-orange-100">
        <div>
          <p className="text-xl font-black text-stone-950">
            <span className="mr-2">{mealData?.emoji}</span>
            {mealData?.label}
          </p>

          <p className="mt-1 text-sm font-semibold text-stone-500">
            {mealData?.description}
          </p>
        </div>

        {recipe ? (
          <div className="mt-5 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
            <div className="flex gap-4">
              <RecipeMiniature recipe={recipe} />

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-lg font-black text-stone-950">
                  {recipe.title}
                </p>

                <p className="mt-1 text-sm font-semibold text-stone-500">
                  {getRecipeTotalTime(recipe)} min · {recipe.servings} pers.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openDailyModal(day, meal)}
                    className="rounded-full bg-orange-500 px-4 py-2 text-sm font-black text-white transition hover:bg-orange-600"
                  >
                    Changer
                  </button>

                  <button
                    type="button"
                    onClick={() => removeDailyRecipe(day, meal)}
                    className="rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-600 transition hover:bg-red-50"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openDailyModal(day, meal)}
            className="mt-5 flex min-h-32 w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-orange-200 bg-white px-5 py-6 text-center transition hover:border-orange-400 hover:bg-orange-50"
          >
            <span className="text-sm font-bold text-stone-400">
              Aucun repas prévu pour ce moment.
            </span>

            <span className="mt-3 rounded-full bg-orange-100 px-5 py-2 font-black text-orange-700">
              + Ajouter une recette
            </span>
          </button>
        )}
      </div>
    )
  }

  function renderExtraMeal(extra: ExtraMealKey) {
    const extraData = EXTRA_MEALS.find((currentExtra) => currentExtra.key === extra)
    const recipeIds = planner.extras[extra]
    const extraRecipes = recipeIds
      .map((recipeId) => getRecipeByStoredId(recipes, recipeId))
      .filter((recipe): recipe is Recipe => !!recipe)

    return (
      <div className="rounded-[2rem] bg-[#fffaf3] p-5 ring-1 ring-orange-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xl font-black text-stone-950">
              <span className="mr-2">{extraData?.emoji}</span>
              {extraData?.label}
            </p>

            <p className="mt-1 text-sm font-semibold text-stone-500">
              {extraData?.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => openExtraModal(extra)}
            className="rounded-full bg-orange-100 px-5 py-2 font-black text-orange-700 transition hover:bg-orange-200"
          >
            + Ajouter
          </button>
        </div>

        {extraRecipes.length > 0 ? (
          <div className="mt-5 space-y-3">
            {extraRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="flex items-center gap-4 rounded-[1.4rem] bg-white p-3 shadow-sm ring-1 ring-orange-100"
              >
                <RecipeMiniature recipe={recipe} />

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-black text-stone-950">
                    {recipe.title}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-stone-500">
                    {getRecipeTotalTime(recipe)} min · {recipe.servings} pers.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeExtraRecipe(extra, String(recipe.id))}
                  className="rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-600 transition hover:bg-red-50"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openExtraModal(extra)}
            className="mt-5 w-full rounded-[1.5rem] border border-dashed border-orange-200 bg-white px-5 py-6 text-left transition hover:border-orange-400 hover:bg-orange-50"
          >
            <span className="block font-bold text-stone-500">
              Aucune recette prévue.
            </span>

            <span className="mt-2 inline-block rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700">
              {extraData?.emptyMessage}
            </span>
          </button>
        )}
      </div>
    )
  }

  const modalTitle =
    activeModal?.type === 'daily'
      ? `${getDayLabel(activeModal.day)} — ${getMainMealLabel(activeModal.meal)}`
      : activeModal?.type === 'extra'
        ? getExtraMealLabel(activeModal.extra)
        : ''

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }

            html,
            body,
            #root {
              background: white !important;
            }

            body header:not(.planner-print-header) {
              display: none !important;
            }

            body nav {
              display: none !important;
            }

            .planner-print-page {
              display: block !important;
              color: #111827 !important;
              font-family: Arial, sans-serif !important;
            }

            .planner-print-card {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .planner-print-grid {
              display: grid !important;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }

            .planner-print-extra-grid {
              display: grid !important;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>

      <section className="mx-auto max-w-7xl space-y-8 print:hidden">
        {successMessage && (
          <div className="rounded-2xl bg-green-50 px-5 py-4 font-bold text-green-700 ring-1 ring-green-100">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl bg-red-50 px-5 py-4 font-bold text-red-700 ring-1 ring-red-100">
            {errorMessage}
          </div>
        )}

        <section className="grid gap-8 rounded-[2.5rem] bg-[#fffaf3] p-6 shadow-sm ring-1 ring-orange-100 lg:grid-cols-[0.75fr_1fr] lg:p-10">
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-8 flex w-fit items-center gap-3 rounded-full bg-[#f4e8dc] px-5 py-3 font-bold text-orange-700">
                <span>🗓️</span>
                <span>Planning de semaine</span>
              </div>

              <h1 className="text-5xl font-black leading-tight text-stone-950 md:text-6xl">
                Organise tes repas simplement.
              </h1>

              <p className="mt-7 max-w-xl text-xl leading-9 text-stone-600">
                Clique directement sur un repas, choisis une recette, et les
                ingrédients sont ajoutés automatiquement à ta liste de courses.
              </p>
            </div>

            <div className="mt-10">
              <div className="grid max-w-xl grid-cols-3 gap-3">
                <div className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-orange-100">
                  <p className="text-4xl font-black text-orange-600">
                    {plannedMealCount}
                  </p>

                  <p className="mt-1 font-bold text-stone-700">repas</p>
                </div>

                <div className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-orange-100">
                  <p className="text-4xl font-black text-green-800">
                    {organizedDayCount}
                  </p>

                  <p className="mt-1 font-bold text-stone-700">jours</p>
                </div>

                <div className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-orange-100">
                  <p className="text-4xl font-black text-stone-900">
                    {estimatedIngredientCount}
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
                  onClick={handlePrintPlanner}
                  className="rounded-full border border-orange-200 bg-white px-6 py-4 font-black text-stone-900 transition hover:bg-orange-50"
                >
                  Imprimer le planning
                </button>

                <button
                  type="button"
                  onClick={clearPlanner}
                  className="rounded-full border border-red-100 bg-white px-6 py-4 font-black text-red-600 transition hover:bg-red-50"
                >
                  Vider le planning
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <p className="font-black uppercase tracking-wide text-orange-600">
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
              {EXTRA_MEALS.map((extra) => (
                <div key={extra.key}>{renderExtraMeal(extra.key)}</div>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-[2rem] bg-white p-8 text-stone-600 shadow-sm ring-1 ring-orange-100">
            Chargement des recettes...
          </div>
        ) : (
          <section className="space-y-6">
            {DAYS.map((day) => {
              const dayMealCount = MAIN_MEALS.filter(
                (meal) => planner.days[day.key][meal.key],
              ).length

              return (
                <article
                  key={day.key}
                  className="grid gap-6 rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 lg:grid-cols-[0.35fr_1fr_1fr]"
                >
                  <div className="rounded-[2rem] bg-[#fffaf3] p-6 ring-1 ring-orange-100">
                    <p className="font-black uppercase tracking-wide text-orange-600">
                      {day.shortLabel}
                    </p>

                    <h2 className="mt-2 text-4xl font-black text-stone-950">
                      {day.label}
                    </h2>

                    <div className="mt-7 inline-flex rounded-full bg-white px-5 py-3 font-black text-stone-700 shadow-sm ring-1 ring-orange-100">
                      {dayMealCount}/2
                    </div>
                  </div>

                  {renderDailyMealSlot(day.key, 'lunch')}
                  {renderDailyMealSlot(day.key, 'dinner')}
                </article>
              )
            })}
          </section>
        )}
      </section>

      <section className="planner-print-page hidden print:block">
        <header className="planner-print-header mb-5 flex items-start justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-orange-100">
              <img
                src={SITE_LOGO_URL}
                alt="Logo Carnet de recettes"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-600">
                Carnet de recettes
              </p>

              <h1 className="mt-1 text-3xl font-black text-stone-950">
                Planning de la semaine
              </h1>

              <p className="mt-1 text-sm text-stone-500">
                Cuisine maison & petits plats
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-100 px-4 py-3 text-right">
            <p className="text-xs font-black uppercase text-stone-500">
              Résumé
            </p>

            <p className="mt-1 text-2xl font-black text-orange-600">
              {plannedMealCount}
            </p>

            <p className="text-xs font-bold text-stone-600">repas prévus</p>
          </div>
        </header>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="planner-print-card rounded-2xl border border-stone-200 p-3">
            <p className="text-2xl font-black text-orange-600">
              {plannedMealCount}
            </p>

            <p className="text-xs font-bold text-stone-600">repas prévus</p>
          </div>

          <div className="planner-print-card rounded-2xl border border-stone-200 p-3">
            <p className="text-2xl font-black text-green-800">
              {organizedDayCount}
            </p>

            <p className="text-xs font-bold text-stone-600">jours organisés</p>
          </div>

          <div className="planner-print-card rounded-2xl border border-stone-200 p-3">
            <p className="text-2xl font-black text-stone-950">
              {estimatedIngredientCount}
            </p>

            <p className="text-xs font-bold text-stone-600">
              ingrédients estimés
            </p>
          </div>
        </div>

        <section className="planner-print-card mb-5 rounded-2xl border border-stone-200 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-orange-600">
            Habitudes et envies
          </p>

          <h2 className="mt-1 text-xl font-black text-stone-950">
            Petit déjeuner, goûter et dessert
          </h2>

          <div className="planner-print-extra-grid mt-4">
            {EXTRA_MEALS.map((extra) => {
              const extraRecipes = planner.extras[extra.key]
                .map((recipeId) => getRecipeByStoredId(recipes, recipeId))
                .filter((recipe): recipe is Recipe => !!recipe)

              return (
                <div key={extra.key} className="rounded-xl bg-stone-50 p-3">
                  <p className="font-black text-stone-950">
                    {extra.emoji} {extra.label}
                  </p>

                  {extraRecipes.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm">
                      {extraRecipes.map((recipe) => (
                        <li key={recipe.id}>• {recipe.title}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-stone-500">
                      Aucun prévu.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <p className="text-xs font-black uppercase tracking-wide text-orange-600">
            Semaine détaillée
          </p>

          <h2 className="mt-1 text-xl font-black text-stone-950">
            Déjeuner et dîner
          </h2>

          <div className="planner-print-grid mt-4">
            {DAYS.map((day) => {
              const lunchRecipe = getRecipeByStoredId(
                recipes,
                planner.days[day.key].lunch,
              )
              const dinnerRecipe = getRecipeByStoredId(
                recipes,
                planner.days[day.key].dinner,
              )

              return (
                <div
                  key={day.key}
                  className="planner-print-card rounded-2xl border border-stone-200 p-4"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black uppercase text-orange-600">
                        {day.shortLabel}
                      </p>

                      <h3 className="text-xl font-black text-stone-950">
                        {day.label}
                      </h3>
                    </div>

                    <p className="text-xs font-black text-stone-500">
                      {
                        [lunchRecipe, dinnerRecipe].filter(
                          (recipe) => !!recipe,
                        ).length
                      }
                      /2
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="font-black text-orange-600">☀️ Déjeuner</p>

                      <p className="mt-1 text-sm text-stone-700">
                        {lunchRecipe
                          ? `${lunchRecipe.title} — ${getRecipeTotalTime(
                              lunchRecipe,
                            )} min`
                          : 'Aucun repas prévu.'}
                      </p>
                    </div>

                    <div>
                      <p className="font-black text-orange-600">🌙 Dîner</p>

                      <p className="mt-1 text-sm text-stone-700">
                        {dinnerRecipe
                          ? `${dinnerRecipe.title} — ${getRecipeTotalTime(
                              dinnerRecipe,
                            )} min`
                          : 'Aucun repas prévu.'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <p className="mt-5 border-t border-stone-200 pt-3 text-xs text-stone-400">
          Imprimé avec Carnet de recettes.
        </p>
      </section>

      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-sm print:hidden">
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-[#fffaf3] shadow-2xl ring-1 ring-orange-100">
            <div className="shrink-0 border-b border-orange-100 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-black uppercase tracking-wide text-orange-600">
                    Ajouter une recette
                  </p>

                  <h2 className="mt-1 text-3xl font-black text-stone-950">
                    {modalTitle}
                  </h2>

                  <p className="mt-2 max-w-2xl font-semibold leading-7 text-stone-500">
                    Recherche une recette, puis clique dessus pour l’ajouter. La
                    liste de courses sera mise à jour automatiquement.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-orange-200 bg-white px-5 py-3 font-black text-orange-700 transition hover:bg-orange-50"
                >
                  Fermer
                </button>
              </div>

              <input
                autoFocus
                value={recipeSearch}
                onChange={(event) => setRecipeSearch(event.target.value)}
                placeholder="Rechercher une recette : pâtes, gâteau, poulet..."
                className="mt-5 w-full rounded-[1.5rem] border border-orange-200 bg-white px-5 py-4 text-lg font-semibold text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {filteredRecipes.length === 0 ? (
                <div className="rounded-[1.5rem] bg-white p-6 text-center font-bold text-stone-500 ring-1 ring-orange-100">
                  Aucune recette ne correspond à ta recherche.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRecipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => handleSelectRecipe(recipe)}
                      disabled={addingRecipeId === recipe.id}
                      className="flex w-full gap-4 rounded-[1.5rem] bg-white p-4 text-left shadow-sm ring-1 ring-orange-100 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RecipeMiniature recipe={recipe} />

                      <div className="min-w-0 flex-1">
                        <p className="text-xl font-black text-stone-950">
                          {recipe.title}
                        </p>

                        <p className="mt-1 line-clamp-2 font-semibold text-stone-500">
                          {recipe.description}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                            {recipe.category}
                          </span>

                          <span className="rounded-full bg-[#fffaf3] px-3 py-1 text-xs font-black text-stone-600 ring-1 ring-orange-100">
                            {getRecipeTotalTime(recipe)} min
                          </span>

                          <span className="rounded-full bg-[#fffaf3] px-3 py-1 text-xs font-black text-stone-600 ring-1 ring-orange-100">
                            {recipe.servings} pers.
                          </span>
                        </div>
                      </div>

                      <span className="hidden rounded-full bg-orange-500 px-5 py-3 font-black text-white md:block">
                        {addingRecipeId === recipe.id ? 'Ajout...' : 'Ajouter'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}