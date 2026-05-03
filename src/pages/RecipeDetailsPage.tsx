import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import RecipeCard from '../components/recipes/RecipeCard'
import RecipeReviews from '../components/reviews/RecipeReviews'
import { useAuth } from '../context/useAuth'
import { isRecipeFavorite, toggleFavorite } from '../services/favorites'
import { getProfile, type UserProfile } from '../services/profiles'
import { deleteRecipe, getRecipeById, getRecipes } from '../services/recipes'
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

type StepTimer = {
  label: string
  seconds: number
}

const STORAGE_KEY = 'carnet-recettes-weekly-planner'

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
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

function saveRecipeToPlanner(
  day: DayKey,
  meal: MealKey,
  recipeId: Recipe['id'],
) {
  const currentPlanner = getSavedPlanner()

  const nextPlanner: MealPlannerState = {
    ...currentPlanner,
    [day]: {
      ...currentPlanner[day],
      [meal]: String(recipeId),
    },
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlanner))
}

function getDayLabel(day: DayKey) {
  return DAYS.find((currentDay) => currentDay.key === day)?.label ?? day
}

function getMealLabel(meal: MealKey) {
  return MEALS.find((currentMeal) => currentMeal.key === meal)?.label ?? meal
}

function formatTimerTime(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(remainingSeconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`
}

function getStepTimers(step: string): StepTimer[] {
  const timers: StepTimer[] = []
  const timerKeys = new Set<string>()
  const normalizedStep = step.replace(/,/g, '.')

  function addTimer(label: string, seconds: number) {
    if (seconds <= 0) return

    const cleanedLabel = label.replace(/\s+/g, ' ').trim()
    const key = `${cleanedLabel}-${seconds}`

    if (timerKeys.has(key)) return

    timerKeys.add(key)

    timers.push({
      label: cleanedLabel,
      seconds,
    })
  }

  for (const match of normalizedStep.matchAll(/\b(\d+)\s*h\s*(\d{1,2})?\b/gi)) {
    const hours = Number(match[1])
    const minutes = Number(match[2] || 0)

    addTimer(match[0], hours * 3600 + minutes * 60)
  }

  for (const match of normalizedStep.matchAll(/\b(\d+)\s*heures?\b/gi)) {
    const hours = Number(match[1])

    addTimer(match[0], hours * 3600)
  }

  for (const match of normalizedStep.matchAll(
    /\b(\d+)(?:\s*(?:a|à|-)\s*(\d+))?\s*(minutes?|mins?|min)\b/gi,
  )) {
    const startMinutes = Number(match[1])
    const endMinutes = match[2] ? Number(match[2]) : null

    addTimer(match[0], (endMinutes ?? startMinutes) * 60)
  }

  for (const match of normalizedStep.matchAll(
    /\b(\d+)\s*(secondes?|secs?|sec)\b/gi,
  )) {
    const seconds = Number(match[1])

    addTimer(match[0], seconds)
  }

  return timers
}

function formatScaledQuantity(value: number) {
  if (Number.isInteger(value)) {
    return String(value)
  }

  const roundedValue = Math.round(value * 100) / 100

  return String(roundedValue).replace('.', ',')
}

function parseFraction(value: string) {
  const [topValue, bottomValue] = value.split('/').map(Number)

  if (!topValue || !bottomValue) {
    return null
  }

  return topValue / bottomValue
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const INGREDIENT_AGREEMENTS = [
  {
    singular: 'œuf',
    plural: 'œufs',
    variants: ['œuf', 'œufs', 'oeuf', 'oeufs'],
  },
  {
    singular: 'tomate',
    plural: 'tomates',
    variants: ['tomate', 'tomates'],
  },
  {
    singular: 'oignon',
    plural: 'oignons',
    variants: ['oignon', 'oignons'],
  },
  {
    singular: 'courgette',
    plural: 'courgettes',
    variants: ['courgette', 'courgettes'],
  },
  {
    singular: 'carotte',
    plural: 'carottes',
    variants: ['carotte', 'carottes'],
  },
  {
    singular: 'pomme',
    plural: 'pommes',
    variants: ['pomme', 'pommes'],
  },
  {
    singular: 'pomme de terre',
    plural: 'pommes de terre',
    variants: ['pomme de terre', 'pommes de terre', 'patate', 'patates'],
  },
  {
    singular: 'citron',
    plural: 'citrons',
    variants: ['citron', 'citrons'],
  },
  {
    singular: 'banane',
    plural: 'bananes',
    variants: ['banane', 'bananes'],
  },
  {
    singular: 'gousse',
    plural: 'gousses',
    variants: ['gousse', 'gousses'],
  },
  {
    singular: 'tranche',
    plural: 'tranches',
    variants: ['tranche', 'tranches'],
  },
  {
    singular: 'boîte',
    plural: 'boîtes',
    variants: ['boîte', 'boîtes', 'boite', 'boites'],
  },
  {
    singular: 'sachet',
    plural: 'sachets',
    variants: ['sachet', 'sachets'],
  },
  {
    singular: 'verre',
    plural: 'verres',
    variants: ['verre', 'verres'],
  },
  {
    singular: 'cuillère',
    plural: 'cuillères',
    variants: ['cuillère', 'cuillères', 'cuillere', 'cuilleres'],
  },
  {
    singular: 'pincée',
    plural: 'pincées',
    variants: ['pincée', 'pincées', 'pincee', 'pincees'],
  },
  {
    singular: 'filet',
    plural: 'filets',
    variants: ['filet', 'filets'],
  },
  {
    singular: 'escalope',
    plural: 'escalopes',
    variants: ['escalope', 'escalopes'],
  },
  {
    singular: 'boule',
    plural: 'boules',
    variants: ['boule', 'boules'],
  },
  {
    singular: 'dé',
    plural: 'dés',
    variants: ['dé', 'dés', 'de', 'des'],
  },
  {
    singular: 'gramme',
    plural: 'grammes',
    variants: ['gramme', 'grammes'],
  },
  {
    singular: 'litre',
    plural: 'litres',
    variants: ['litre', 'litres'],
  },
]

function adjustIngredientAgreement(quantity: number, ingredientRest: string) {
  const shouldUsePlural = quantity > 1

  for (const agreement of INGREDIENT_AGREEMENTS) {
    const variants = [...agreement.variants].sort(
      (firstVariant, secondVariant) =>
        secondVariant.length - firstVariant.length,
    )

    const variantPattern = variants.map(escapeRegExp).join('|')

    const pattern = new RegExp(
      `^(\\s*)(${variantPattern})(?=\\s|$|,|\\.|-)`,
      'iu',
    )

    if (pattern.test(ingredientRest)) {
      return ingredientRest.replace(
        pattern,
        `$1${shouldUsePlural ? agreement.plural : agreement.singular}`,
      )
    }
  }

  return ingredientRest
}

function scaleIngredientText(
  ingredient: string,
  originalServings: number,
  selectedServings: number,
) {
  if (originalServings <= 0 || selectedServings <= 0) {
    return ingredient
  }

  const multiplier = selectedServings / originalServings
  const trimmedIngredient = ingredient.trim()

  const fractionMatch = trimmedIngredient.match(/^(\d+)\/(\d+)(.*)$/)

  if (fractionMatch) {
    const quantity = parseFraction(`${fractionMatch[1]}/${fractionMatch[2]}`)

    if (!quantity) {
      return ingredient
    }

    const scaledQuantity = quantity * multiplier
    const restOfIngredient = fractionMatch[3] ?? ''
    const adjustedRest = adjustIngredientAgreement(
      scaledQuantity,
      restOfIngredient,
    )

    return `${formatScaledQuantity(scaledQuantity)}${adjustedRest}`
  }

  const decimalMatch = trimmedIngredient.match(/^(\d+(?:[.,]\d+)?)(.*)$/)

  if (!decimalMatch) {
    return ingredient
  }

  const quantity = Number(decimalMatch[1].replace(',', '.'))

  if (Number.isNaN(quantity)) {
    return ingredient
  }

  const scaledQuantity = quantity * multiplier
  const restOfIngredient = decimalMatch[2] ?? ''
  const adjustedRest = adjustIngredientAgreement(
    scaledQuantity,
    restOfIngredient,
  )

  return `${formatScaledQuantity(scaledQuantity)}${adjustedRest}`
}

export default function RecipeDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const recipeId = Number(id)
  const invalidRecipeId = !id || Number.isNaN(recipeId)
  const viewerId = user?.id

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null)
  const [similarRecipes, setSimilarRecipes] = useState<Recipe[]>([])

  const [loading, setLoading] = useState(!invalidRecipeId)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [isDeleting, setIsDeleting] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [addingIngredientIndex, setAddingIngredientIndex] = useState<
    number | null
  >(null)

  const [selectedPlanningDay, setSelectedPlanningDay] =
    useState<DayKey>('monday')
  const [selectedPlanningMeal, setSelectedPlanningMeal] =
    useState<MealKey>('dinner')

  const [selectedServings, setSelectedServings] = useState(1)

  const [guidedCookingOpen, setGuidedCookingOpen] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number | null>(
    null,
  )
  const [activeTimerLabel, setActiveTimerLabel] = useState('')
  const [remainingTimerSeconds, setRemainingTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)

  const successTimeoutRef = useRef<number | null>(null)

  const isOwner = !!viewerId && !!recipe && recipe.userId === viewerId

  function hideSuccessMessage() {
    if (successTimeoutRef.current !== null) {
      window.clearTimeout(successTimeoutRef.current)
      successTimeoutRef.current = null
    }

    setSuccessMessage('')
  }

  function showSuccessMessage(message: string, duration = 3000) {
    if (successTimeoutRef.current !== null) {
      window.clearTimeout(successTimeoutRef.current)
    }

    setSuccessMessage(message)

    successTimeoutRef.current = window.setTimeout(() => {
      setSuccessMessage('')
      successTimeoutRef.current = null
    }, duration)
  }

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current !== null) {
        window.clearTimeout(successTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let ignore = false

    if (invalidRecipeId) return

    getRecipeById(recipeId)
      .then(async (data) => {
        if (!data) {
          throw new Error('Recette introuvable.')
        }

        const authorProfilePromise = data.userId
          ? getProfile(data.userId).catch((error) => {
              console.error(error)
              return null
            })
          : Promise.resolve(null)

        const favoriteStatusPromise = viewerId
          ? isRecipeFavorite(recipeId).catch((error) => {
              console.error(error)
              return false
            })
          : Promise.resolve(false)

        const recipesPromise = getRecipes().catch((error) => {
          console.error(error)
          return []
        })

        const [loadedAuthorProfile, loadedFavoriteStatus, allRecipes] =
          await Promise.all([
            authorProfilePromise,
            favoriteStatusPromise,
            recipesPromise,
          ])

        const currentRecipeTags = data.tags.map((tag) => tag.toLowerCase())

        const relatedRecipes = allRecipes
          .filter((item) => item.id !== data.id)
          .filter((item) => {
            const sameCategory = item.category === data.category

            const hasCommonTag = item.tags.some((tag) =>
              currentRecipeTags.includes(tag.toLowerCase()),
            )

            return sameCategory || hasCommonTag
          })
          .sort((a, b) => {
            const aSameCategory = a.category === data.category ? 1 : 0
            const bSameCategory = b.category === data.category ? 1 : 0

            if (aSameCategory !== bSameCategory) {
              return bSameCategory - aSameCategory
            }

            const aCommonTags = a.tags.filter((tag) =>
              currentRecipeTags.includes(tag.toLowerCase()),
            ).length

            const bCommonTags = b.tags.filter((tag) =>
              currentRecipeTags.includes(tag.toLowerCase()),
            ).length

            return bCommonTags - aCommonTags
          })
          .slice(0, 3)

        if (!ignore) {
          setRecipe(data)
          setSelectedServings(Math.max(1, data.servings))
          setAuthorProfile(loadedAuthorProfile)
          setIsFavorite(loadedFavoriteStatus)
          setSimilarRecipes(relatedRecipes)
          setCurrentStepIndex(0)
          setGuidedCookingOpen(false)
          setActiveTimerSeconds(null)
          setActiveTimerLabel('')
          setRemainingTimerSeconds(0)
          setTimerRunning(false)
          hideSuccessMessage()
        }
      })
      .catch((error) => {
        if (!ignore) {
          console.error(error)
          setErrorMessage('Impossible de charger cette recette.')
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
  }, [invalidRecipeId, recipeId, viewerId])

  useEffect(() => {
    if (!guidedCookingOpen || !timerRunning) return

    const intervalId = window.setInterval(() => {
      setRemainingTimerSeconds((currentSeconds) => {
        if (currentSeconds <= 1) {
          setTimerRunning(false)
          return 0
        }

        return currentSeconds - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [guidedCookingOpen, timerRunning])

  async function handleDelete() {
    if (!recipe) return

    const confirmDelete = window.confirm(
      `Voulez-vous vraiment supprimer la recette "${recipe.title}" ?`,
    )

    if (!confirmDelete) return

    try {
      setIsDeleting(true)
      await deleteRecipe(recipe.id)
      navigate('/recipes')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer cette recette.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleToggleFavorite() {
    if (!user) {
      navigate('/auth')
      return
    }

    if (!recipe) return

    try {
      setFavoriteLoading(true)
      setErrorMessage('')
      hideSuccessMessage()

      const newValue = await toggleFavorite(recipe.id)
      setIsFavorite(newValue)

      showSuccessMessage(
        newValue
          ? 'Recette ajoutée aux favoris.'
          : 'Recette retirée des favoris.',
        2500,
      )
    } catch (error) {
      console.error(error)
      hideSuccessMessage()
      setErrorMessage('Impossible de modifier les favoris.')
    } finally {
      setFavoriteLoading(false)
    }
  }

  async function handleAddIngredientToShoppingList(
    ingredient: string,
    index: number,
  ) {
    if (!user) {
      navigate('/auth')
      return
    }

    if (!recipe) return

    try {
      setAddingIngredientIndex(index)
      setErrorMessage('')
      hideSuccessMessage()

      const addedItems = await addRecipeIngredientsToShoppingList(recipe.id, [
        ingredient,
      ])

      if (addedItems.length === 0) {
        showSuccessMessage(`"${ingredient}" est déjà dans ta liste de courses.`)
      } else {
        showSuccessMessage(`"${ingredient}" a été ajouté à ta liste de courses.`)
      }
    } catch (error) {
      console.error(error)

      hideSuccessMessage()
      setErrorMessage(
        'Impossible d’ajouter cet ingrédient à la liste de courses.',
      )
    } finally {
      setAddingIngredientIndex(null)
    }
  }

  async function handleAddRecipeToPlanning() {
    if (!user) {
      navigate('/auth')
      return
    }

    if (!recipe) return

    const currentPlanner = getSavedPlanner()
    const currentRecipeId =
      currentPlanner[selectedPlanningDay][selectedPlanningMeal]

    const dayLabel = getDayLabel(selectedPlanningDay)
    const mealLabel = getMealLabel(selectedPlanningMeal)

    if (currentRecipeId && currentRecipeId !== String(recipe.id)) {
      const confirmReplace = window.confirm(
        `Il y a déjà une recette prévue pour ${dayLabel.toLowerCase()} ${mealLabel.toLowerCase()}.\n\nVeux-tu vraiment la remplacer par "${recipe.title}" ?`,
      )

      if (!confirmReplace) {
        return
      }
    }

    try {
      setErrorMessage('')
      hideSuccessMessage()

      saveRecipeToPlanner(selectedPlanningDay, selectedPlanningMeal, recipe.id)

      const addedItems = await addRecipeIngredientsToShoppingList(
  recipe.id,
  scaledIngredients,
  {
    allowDuplicates: true,
  },
)

      if (currentRecipeId && currentRecipeId !== String(recipe.id)) {
        showSuccessMessage(
          `Recette remplacée dans le planning pour ${dayLabel.toLowerCase()} ${mealLabel.toLowerCase()}.`,
        )
      } else if (addedItems.length > 0) {
        showSuccessMessage(
          'Recette ajoutée au planning. Les ingrédients ont aussi été ajoutés à la liste de courses.',
        )
      } else {
        showSuccessMessage(
          'Recette ajoutée au planning. Les ingrédients étaient déjà dans la liste de courses.',
        )
      }
    } catch (error) {
      console.error(error)

      hideSuccessMessage()

      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('déjà dans la liste')
      ) {
        showSuccessMessage(
          'Recette ajoutée au planning. Les ingrédients étaient déjà dans la liste de courses.',
        )
        return
      }

      setErrorMessage(
        'La recette a peut-être été ajoutée au planning, mais impossible d’ajouter les ingrédients à la liste de courses.',
      )
    }
  }

  function decreaseServings() {
    setSelectedServings((currentValue) => Math.max(1, currentValue - 1))
  }

  function increaseServings() {
    setSelectedServings((currentValue) => currentValue + 1)
  }

  function resetServings() {
    if (!recipe) return

    setSelectedServings(Math.max(1, recipe.servings))
  }

  function clearTimerState() {
    setActiveTimerSeconds(null)
    setActiveTimerLabel('')
    setRemainingTimerSeconds(0)
    setTimerRunning(false)
  }

  function openGuidedCooking() {
    if (!recipe || recipe.steps.length === 0) return

    clearTimerState()
    setCurrentStepIndex(0)
    setGuidedCookingOpen(true)
  }

  function closeGuidedCooking() {
    clearTimerState()
    setGuidedCookingOpen(false)
  }

  function goToPreviousStep() {
    clearTimerState()
    setCurrentStepIndex((currentIndex) => Math.max(currentIndex - 1, 0))
  }

  function goToNextStep() {
    if (!recipe) return

    clearTimerState()
    setCurrentStepIndex((currentIndex) =>
      Math.min(currentIndex + 1, recipe.steps.length - 1),
    )
  }

  function startTimer(timer: StepTimer) {
    setActiveTimerSeconds(timer.seconds)
    setActiveTimerLabel(timer.label)
    setRemainingTimerSeconds(timer.seconds)
    setTimerRunning(true)
  }

  function toggleTimer() {
    if (activeTimerSeconds === null) return

    if (remainingTimerSeconds === 0) {
      setRemainingTimerSeconds(activeTimerSeconds)
      setTimerRunning(true)
      return
    }

    setTimerRunning((currentValue) => !currentValue)
  }

  function resetTimer() {
    if (activeTimerSeconds === null) return

    setRemainingTimerSeconds(activeTimerSeconds)
    setTimerRunning(false)
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)

      setErrorMessage('')
      showSuccessMessage('Lien copié dans le presse-papiers.', 2500)
    } catch (error) {
      console.error(error)

      hideSuccessMessage()
      setErrorMessage('Impossible de copier le lien.')
    }
  }

  function handlePrint() {
    window.print()
  }

  if (invalidRecipeId) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 shadow-sm ring-1 ring-orange-100">
        <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-red-700">
          Recette introuvable.
        </p>

        <Link
          to="/recipes"
          className="font-bold text-orange-700 hover:text-orange-800"
        >
          ← Retour aux recettes
        </Link>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 shadow-sm ring-1 ring-orange-100">
        <p className="text-stone-600">Chargement de la recette...</p>
      </section>
    )
  }

  if (!recipe) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 shadow-sm ring-1 ring-orange-100">
        <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-red-700">
          {errorMessage || 'Recette introuvable.'}
        </p>

        <Link
          to="/recipes"
          className="font-bold text-orange-700 hover:text-orange-800"
        >
          ← Retour aux recettes
        </Link>
      </section>
    )
  }

  const totalTime = recipe.prepTime + recipe.cookTime
  const imageToDisplay = recipe.imageUrl || recipe.image

  const scaledIngredients = recipe.ingredients.map((ingredient) =>
    scaleIngredientText(ingredient, recipe.servings, selectedServings),
  )

  const authorName = authorProfile?.username || 'Utilisateur'
  const authorBio = authorProfile?.bio ?? ''
  const authorAvatarUrl = authorProfile?.avatarUrl ?? ''
  const authorLetter = authorName.charAt(0).toUpperCase() || 'U'

  const currentStep = recipe.steps[currentStepIndex]
  const currentStepTimers = getStepTimers(currentStep || '')

  const guidedProgress =
    recipe.steps.length > 0
      ? Math.round(((currentStepIndex + 1) / recipe.steps.length) * 100)
      : 0

  return (
    <>
      {guidedCookingOpen && currentStep && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#fffaf3] px-5 py-6 print:hidden">
          <div className="mx-auto flex min-h-full max-w-5xl flex-col">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                  Mode cuisson guidée
                </p>

                <h1 className="mt-2 text-3xl font-black text-stone-950 md:text-5xl">
                  {recipe.title}
                </h1>
              </div>

              <button
                type="button"
                onClick={closeGuidedCooking}
                className="rounded-full border border-orange-200 bg-white px-5 py-3 font-black text-orange-700 shadow-sm transition hover:bg-orange-50"
              >
                Quitter
              </button>
            </div>

            <div className="mb-8 rounded-full bg-white p-2 shadow-sm ring-1 ring-orange-100">
              <div
                className="h-4 rounded-full bg-orange-500 transition-all"
                style={{ width: `${guidedProgress}%` }}
              />
            </div>

            <div className="grid flex-1 gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <aside className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
                <p className="font-black text-orange-600">Ingrédients</p>

                <p className="mt-1 text-sm font-semibold text-stone-500">
                  Quantités pour {selectedServings} personne
                  {selectedServings > 1 ? 's' : ''}
                </p>

                <ul className="mt-5 space-y-3">
                  {scaledIngredients.map((ingredient, index) => (
                    <li
                      key={`${ingredient}-${index}`}
                      className="rounded-2xl bg-[#fffaf3] px-4 py-3 font-semibold text-stone-700"
                    >
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </aside>

              <main className="flex flex-col justify-between rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-orange-100 md:p-10">
                <div>
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <span className="rounded-full bg-orange-100 px-5 py-2 text-sm font-black text-orange-700">
                      Étape {currentStepIndex + 1} sur {recipe.steps.length}
                    </span>

                    <span className="rounded-full bg-[#fffaf3] px-5 py-2 text-sm font-black text-stone-700 ring-1 ring-orange-100">
                      {guidedProgress} %
                    </span>
                  </div>

                  <p className="text-3xl font-black leading-relaxed text-stone-950 md:text-5xl md:leading-relaxed">
                    {currentStep}
                  </p>

                  {currentStepTimers.length > 0 && (
                    <div className="mt-8 rounded-[2rem] bg-[#fffaf3] p-5 ring-1 ring-orange-100">
                      <p className="font-black text-orange-600">
                        Minuteur détecté
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {currentStepTimers.map((timer) => (
                          <button
                            key={`${timer.label}-${timer.seconds}`}
                            type="button"
                            onClick={() => startTimer(timer)}
                            className="rounded-full bg-orange-500 px-5 py-3 font-black text-white shadow-sm transition hover:bg-orange-600"
                          >
                            Lancer {timer.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTimerSeconds !== null && (
                    <div className="mt-8 rounded-[2rem] bg-stone-950 p-6 text-white shadow-sm">
                      <p className="text-sm font-black uppercase tracking-wide text-orange-300">
                        Minuteur {activeTimerLabel}
                      </p>

                      <p className="mt-3 text-5xl font-black">
                        {formatTimerTime(remainingTimerSeconds)}
                      </p>

                      {remainingTimerSeconds === 0 && (
                        <p className="mt-3 font-bold text-green-300">
                          Minuteur terminé !
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={toggleTimer}
                          className="rounded-full bg-white px-5 py-3 font-black text-stone-950 transition hover:bg-orange-50"
                        >
                          {timerRunning
                            ? 'Pause'
                            : remainingTimerSeconds === 0
                              ? 'Relancer'
                              : 'Reprendre'}
                        </button>

                        <button
                          type="button"
                          onClick={resetTimer}
                          className="rounded-full border border-white/20 px-5 py-3 font-black text-white transition hover:bg-white/10"
                        >
                          Réinitialiser
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    disabled={currentStepIndex === 0}
                    className="rounded-full border border-orange-200 bg-white px-6 py-4 font-black text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Précédent
                  </button>

                  {currentStepIndex === recipe.steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={closeGuidedCooking}
                      className="rounded-full bg-green-600 px-6 py-4 font-black text-white shadow-sm transition hover:bg-green-700"
                    >
                      Terminer la recette
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="rounded-full bg-orange-500 px-6 py-4 font-black text-white shadow-sm transition hover:bg-orange-600"
                    >
                      Suivant →
                    </button>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      )}

      <section className="space-y-10">
        <div className="print:hidden">
          <Link
            to="/recipes"
            className="inline-flex items-center rounded-full bg-white px-5 py-3 font-bold text-orange-700 shadow-sm ring-1 ring-orange-100 transition hover:bg-orange-50"
          >
            ← Retour aux recettes
          </Link>
        </div>

        {successMessage && (
          <div className="fixed bottom-6 right-6 z-[90] max-w-sm rounded-2xl bg-stone-950 px-5 py-4 text-sm font-bold text-white shadow-xl print:hidden">
            ✅ {successMessage}
          </div>
        )}

        {errorMessage && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 font-medium text-red-700 print:hidden">
            {errorMessage}
          </p>
        )}

        <article className="overflow-hidden rounded-[2.5rem] bg-[#fffaf3] shadow-sm ring-1 ring-orange-100">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="min-h-[340px] bg-[#fff1e6]">
              {typeof imageToDisplay === 'string' &&
              imageToDisplay.startsWith('http') ? (
                <img
                  src={imageToDisplay}
                  alt={recipe.title}
                  className="h-full max-h-[560px] w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[340px] items-center justify-center text-8xl">
                  {recipe.image || '🍽️'}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center px-6 py-8 lg:px-10">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700">
                  {recipe.category}
                </span>

                <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-stone-700 shadow-sm ring-1 ring-orange-100">
                  {recipe.difficulty}
                </span>
              </div>

              <p className="mb-2 text-sm font-black uppercase tracking-wide text-orange-600">
                Recette maison
              </p>

              <h1 className="text-4xl font-black tracking-tight text-stone-950 md:text-5xl">
                {recipe.title}
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
                {recipe.description}
              </p>

              {recipe.userId && (
                <Link
                  to={`/users/${recipe.userId}`}
                  className="mt-7 block rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100 transition hover:bg-orange-50 print:hidden"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-500 text-2xl font-black text-white ring-2 ring-white">
                      {authorAvatarUrl ? (
                        <img
                          src={authorAvatarUrl}
                          alt={authorName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        authorLetter
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-stone-500">
                        Recette proposée par
                      </p>

                      <p className="text-lg font-black text-stone-950">
                        {authorName}
                      </p>

                      <p className="mt-1 text-sm font-bold text-orange-700">
                        Voir le profil →
                      </p>
                    </div>
                  </div>

                  {authorBio && (
                    <p className="mt-4 leading-7 text-stone-600">{authorBio}</p>
                  )}
                </Link>
              )}

              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-[1.5rem] bg-white px-4 py-4 shadow-sm ring-1 ring-orange-100">
                  <p className="text-sm font-medium text-stone-500">
                    Préparation
                  </p>

                  <p className="mt-1 text-xl font-black text-stone-950">
                    {recipe.prepTime} min
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-white px-4 py-4 shadow-sm ring-1 ring-orange-100">
                  <p className="text-sm font-medium text-stone-500">Cuisson</p>

                  <p className="mt-1 text-xl font-black text-stone-950">
                    {recipe.cookTime} min
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-white px-4 py-4 shadow-sm ring-1 ring-orange-100">
                  <p className="text-sm font-medium text-stone-500">Total</p>

                  <p className="mt-1 text-xl font-black text-stone-950">
                    {totalTime} min
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-white px-4 py-4 shadow-sm ring-1 ring-orange-100">
                  <p className="text-sm font-medium text-stone-500">Portions</p>

                  <p className="mt-1 text-xl font-black text-stone-950">
                    {selectedServings} pers.
                  </p>
                </div>
              </div>

              {recipe.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#f4e8dc] px-3 py-1 text-sm font-semibold text-stone-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-8 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100 print:hidden">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                    Actions rapides
                  </p>

                  {isOwner && (
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                      Ta recette
                    </span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={openGuidedCooking}
                    disabled={recipe.steps.length === 0}
                    className="flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-4 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>▶</span>
                    <span>Lancer la recette</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                    className="flex items-center justify-center gap-2 rounded-full border border-orange-200 bg-[#fffaf3] px-5 py-4 font-black text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>{isFavorite ? '♥' : '♡'}</span>

                    <span>
                      {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 rounded-full border border-orange-100 bg-white px-5 py-3 font-bold text-stone-700 transition hover:-translate-y-0.5 hover:bg-orange-50"
                  >
                    🔗 Copier le lien
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 rounded-full border border-orange-100 bg-white px-5 py-3 font-bold text-stone-700 transition hover:-translate-y-0.5 hover:bg-orange-50"
                  >
                    🖨️ Imprimer
                  </button>

                  {isOwner && (
                    <>
                      <Link
                        to={`/recipes/${recipe.id}/edit`}
                        className="flex items-center justify-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-5 py-3 text-center font-bold text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-100"
                      >
                        ✏️ Modifier
                      </Link>

                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        🗑️ {isDeleting ? 'Suppression...' : 'Supprimer'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                      Planning de semaine
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-stone-950">
                      Ajouter cette recette au planning
                    </h2>

                    <p className="mt-2 text-stone-600">
                      Choisis un jour et un repas pour retrouver cette recette
                      dans ton planning.
                    </p>
                  </div>

                  <Link
                    to="/planning"
                    className="rounded-full border border-orange-200 bg-[#fffaf3] px-5 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-50"
                  >
                    Voir le planning
                  </Link>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <select
                    value={selectedPlanningDay}
                    onChange={(event) =>
                      setSelectedPlanningDay(event.target.value as DayKey)
                    }
                    className="rounded-2xl border border-orange-100 bg-[#fffaf3] px-4 py-3 font-semibold text-stone-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  >
                    {DAYS.map((day) => (
                      <option key={day.key} value={day.key}>
                        {day.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedPlanningMeal}
                    onChange={(event) =>
                      setSelectedPlanningMeal(event.target.value as MealKey)
                    }
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
            </div>
          </div>
        </article>

        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <div>
              <p className="font-bold text-orange-600">À préparer</p>

              <h2 className="text-2xl font-black text-stone-950">
                Ingrédients
              </h2>

              <p className="mt-1 text-sm text-stone-500 print:hidden">
                Clique sur + pour ajouter uniquement les ingrédients souhaités à
                ta liste de courses.
              </p>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-[#fffaf3] p-5 ring-1 ring-orange-100 print:hidden">
              <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                Adapter les portions
              </p>

              <p className="mt-2 text-sm font-semibold text-stone-500">
                Recette prévue pour {recipe.servings} personne
                {recipe.servings > 1 ? 's' : ''}. Les quantités sont
                recalculées automatiquement.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={decreaseServings}
                  disabled={selectedServings <= 1}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-orange-200 bg-white text-xl font-black text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>

                <div className="rounded-full bg-white px-6 py-3 font-black text-stone-950 shadow-sm ring-1 ring-orange-100">
                  {selectedServings} personne{selectedServings > 1 ? 's' : ''}
                </div>

                <button
                  type="button"
                  onClick={increaseServings}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-xl font-black text-white transition hover:bg-orange-600"
                >
                  +
                </button>

                <button
                  type="button"
                  onClick={resetServings}
                  className="rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-50"
                >
                  Revenir à {recipe.servings} pers.
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[2, 4, 6, 8].map((servingValue) => (
                  <button
                    key={servingValue}
                    type="button"
                    onClick={() => setSelectedServings(servingValue)}
                    className={`rounded-full px-4 py-2 text-sm font-black transition ${
                      selectedServings === servingValue
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-orange-700 ring-1 ring-orange-100 hover:bg-orange-50'
                    }`}
                  >
                    {servingValue} pers.
                  </button>
                ))}
              </div>
            </div>

            {recipe.ingredients.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {scaledIngredients.map((ingredient, index) => (
                  <li
                    key={`${ingredient}-${index}`}
                    className="flex items-center gap-3 rounded-[1.4rem] bg-[#fff5ec] px-4 py-3 text-stone-700"
                  >
                    <span className="font-black text-orange-600">•</span>

                    <span className="flex-1 font-medium">{ingredient}</span>

                    <button
                      type="button"
                      onClick={() =>
                        handleAddIngredientToShoppingList(ingredient, index)
                      }
                      disabled={addingIngredientIndex === index}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-lg font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 print:hidden"
                      aria-label={`Ajouter ${ingredient} à la liste de courses`}
                      title="Ajouter à la liste de courses"
                    >
                      {addingIngredientIndex === index ? '…' : '+'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-stone-500">Aucun ingrédient renseigné.</p>
            )}
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-bold text-orange-600">En cuisine</p>

                <h2 className="text-2xl font-black text-stone-950">
                  Préparation
                </h2>
              </div>

              <button
                type="button"
                onClick={openGuidedCooking}
                disabled={recipe.steps.length === 0}
                className="rounded-full bg-orange-500 px-5 py-3 font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 print:hidden"
              >
                ▶ Lancer
              </button>
            </div>

            {recipe.steps.length > 0 ? (
              <ol className="mt-6 space-y-4">
                {recipe.steps.map((step, index) => (
                  <li
                    key={`${step}-${index}`}
                    className="flex gap-4 rounded-[1.4rem] bg-[#fffaf3] px-4 py-4 text-stone-700 ring-1 ring-orange-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-black text-white">
                      {index + 1}
                    </span>

                    <span className="leading-7">{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-stone-500">Aucune étape renseignée.</p>
            )}
          </section>
        </div>

        <RecipeReviews recipeId={recipe.id} />

        {similarRecipes.length > 0 && (
          <section className="print:hidden">
            <div className="mb-6">
              <p className="font-bold text-orange-600">Suggestions</p>

              <h2 className="text-3xl font-black text-stone-950">
                Recettes similaires
              </h2>

              <p className="mt-2 text-stone-600">
                Des idées proches par catégorie ou par tags.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {similarRecipes.map((similarRecipe) => (
                <RecipeCard key={similarRecipe.id} recipe={similarRecipe} />
              ))}
            </div>
          </section>
        )}
      </section>
    </>
  )
}