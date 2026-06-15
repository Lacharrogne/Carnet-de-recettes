import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import PrintableRecipeSheet from '../components/recipes/PrintableRecipeSheet'
import RecipeCard from '../components/recipes/RecipeCard'
import RecipeReviews from '../components/reviews/RecipeReviews'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import { RecipeDetailSkeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/useAuth'
import { useFavorites } from '../context/useFavorites'
import { scaleIngredientText } from '../lib/ingredientScaling'
import { findLinkedRecipe } from '../lib/recipeLinks'
import {
  formatTimerTime,
  getStepTimers,
  type StepTimer,
} from '../lib/stepTimers'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import {
  DAYS,
  MEALS,
  getDayLabel,
  getMealLabel,
  getSavedPlanner,
  saveRecipeToPlanner,
  type DayKey,
  type MealKey,
} from '../lib/weeklyPlanner'
import { getProfile, type UserProfile } from '../services/profiles'
import { deleteRecipe, getRecipeById, getRecipes } from '../services/recipes'
import { addRecipeIngredientsToShoppingList } from '../services/shoppingList'
import type { Recipe } from '../types/recipe'

export default function RecipeDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isFavorite: isFavoriteCtx, toggleFavorite: toggleFavoriteCtx } =
    useFavorites()

  const recipeId = Number(id)
  const invalidRecipeId = !id || Number.isNaN(recipeId)
  const viewerId = user?.id
  const isFavorite = !!viewerId && isFavoriteCtx(recipeId)

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null)

  useDocumentTitle(recipe?.title)
  const [similarRecipes, setSimilarRecipes] = useState<Recipe[]>([])
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([])

  const [loading, setLoading] = useState(!invalidRecipeId)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [isDeleting, setIsDeleting] = useState(false)
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
  if (invalidRecipeId) return

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'auto',
  })
}, [invalidRecipeId, recipeId])

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

        const recipesPromise = getRecipes().catch((error) => {
          console.error(error)
          return []
        })

        const [loadedAuthorProfile, allRecipes] = await Promise.all([
          authorProfilePromise,
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
          setSimilarRecipes(relatedRecipes)
          setAllRecipes(allRecipes)
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

      const newValue = await toggleFavoriteCtx(recipe.id)

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

      const ingredientsToAdd = recipe.ingredients.map((ingredient) =>
        scaleIngredientText(ingredient, recipe.servings, selectedServings),
      )

      const addedItems = await addRecipeIngredientsToShoppingList(
        recipe.id,
        ingredientsToAdd,
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
        <Alert tone="error" className="mb-6">
          Recette introuvable.
        </Alert>

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
    return <RecipeDetailSkeleton />
  }

  if (!recipe) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 shadow-sm ring-1 ring-orange-100">
        <Alert tone="error" className="mb-6">
          {errorMessage || 'Recette introuvable.'}
        </Alert>

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

  // Liens créés manuellement dans le formulaire, résolus en recettes.
  const manualLinkedRecipes = recipe.relatedRecipeIds
    .map((relatedId) => allRecipes.find((item) => item.id === relatedId))
    .filter((item): item is Recipe => Boolean(item))

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
    <PrintableRecipeSheet
      recipe={recipe}
      imageToDisplay={typeof imageToDisplay === 'string' ? imageToDisplay : undefined}
      scaledIngredients={scaledIngredients}
      selectedServings={selectedServings}
      totalTime={totalTime}
    />
      {guidedCookingOpen && currentStep && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-cream-50 px-4 py-4 print:hidden sm:px-5 sm:py-6">
          <div className="mx-auto flex min-h-full max-w-5xl flex-col">
            <div className="mb-5 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-orange-600 sm:text-sm">
                  Mode cuisson guidée
                </p>

                <h1 className="mt-2 line-clamp-2 text-2xl font-black text-stone-950 sm:text-3xl md:text-5xl">
                  {recipe.title}
                </h1>
              </div>

              <button
                type="button"
                onClick={closeGuidedCooking}
                className="w-full rounded-full border border-orange-200 bg-white px-5 py-3 font-black text-orange-700 shadow-sm transition hover:bg-orange-50 sm:w-auto"
              >
                Quitter
              </button>
            </div>

            <div className="mb-5 rounded-full bg-white p-2 shadow-sm ring-1 ring-orange-100 sm:mb-8">
              <div
                className="h-3 rounded-full bg-orange-500 transition-all sm:h-4"
                style={{ width: `${guidedProgress}%` }}
              />
            </div>

            <div className="grid flex-1 gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
              <aside className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-orange-100 sm:rounded-[2rem] sm:p-6">
                <p className="font-black text-orange-600">Ingrédients</p>

                <p className="mt-1 text-sm font-semibold text-stone-500">
                  Quantités pour {selectedServings} personne
                  {selectedServings > 1 ? 's' : ''}
                </p>

                <ul className="mt-5 max-h-[320px] space-y-3 overflow-y-auto pr-1 lg:max-h-none lg:overflow-visible">
                  {scaledIngredients.map((ingredient, index) => (
                    <li
                      key={`${ingredient}-${index}`}
                      className="rounded-2xl bg-cream-50 px-4 py-3 text-sm font-semibold text-stone-700 sm:text-base"
                    >
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </aside>

              <main className="flex flex-col justify-between rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100 sm:p-8 md:rounded-[2.5rem] md:p-10">
                <div>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
                    <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700 sm:px-5">
                      Étape {currentStepIndex + 1} sur {recipe.steps.length}
                    </span>

                    <span className="rounded-full bg-cream-50 px-4 py-2 text-sm font-black text-stone-700 ring-1 ring-orange-100 sm:px-5">
                      {guidedProgress} %
                    </span>
                  </div>

                  <p className="text-2xl font-black leading-relaxed text-stone-950 sm:text-3xl md:text-5xl md:leading-relaxed">
                    {currentStep}
                  </p>

                  {currentStepTimers.length > 0 && (
                    <div className="mt-6 rounded-[1.75rem] bg-cream-50 p-5 ring-1 ring-orange-100 sm:mt-8 sm:rounded-[2rem]">
                      <p className="font-black text-orange-600">
                        Minuteur détecté
                      </p>

                      <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
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
                    <div className="mt-6 rounded-[1.75rem] bg-stone-950 p-5 text-white shadow-sm sm:mt-8 sm:rounded-[2rem] sm:p-6">
                      <p className="text-sm font-black uppercase tracking-wide text-orange-300">
                        Minuteur {activeTimerLabel}
                      </p>

                      <p className="mt-3 text-4xl font-black sm:text-5xl">
                        {formatTimerTime(remainingTimerSeconds)}
                      </p>

                      {remainingTimerSeconds === 0 && (
                        <p className="mt-3 font-bold text-green-300">
                          Minuteur terminé !
                        </p>
                      )}

                      <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
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

                <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2">
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

      <section className="space-y-8 sm:space-y-10 print:hidden">
        <div className="print:hidden">
          <Link
            to="/recipes"
            className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 font-bold text-orange-700 shadow-sm ring-1 ring-orange-100 transition hover:bg-orange-50 sm:w-auto"
          >
            ← Retour aux recettes
          </Link>
        </div>

        {successMessage && (
          <div className="fixed bottom-24 left-4 right-4 z-[90] rounded-2xl bg-espresso px-5 py-4 text-sm font-bold text-white shadow-lift print:hidden sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm">
            ✅ {successMessage}
          </div>
        )}

        {errorMessage && (
          <Alert tone="error" className="print:hidden">
            {errorMessage}
          </Alert>
        )}

        <article className="overflow-hidden rounded-[2rem] bg-cream-50 shadow-card ring-1 ring-bark sm:rounded-[2.5rem]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[260px] bg-cream-200 sm:min-h-[340px]">
              {typeof imageToDisplay === 'string' &&
              imageToDisplay.startsWith('http') ? (
                <img
                  src={imageToDisplay}
                  alt={recipe.title}
                  className="h-full max-h-[360px] min-h-[260px] w-full object-cover sm:max-h-[560px] sm:min-h-[340px] lg:h-full"
                />
              ) : (
                <div className="flex min-h-[260px] items-center justify-center text-7xl sm:min-h-[340px] sm:text-8xl">
                  {recipe.image || '🍽️'}
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center px-5 py-7 sm:px-6 sm:py-8 lg:px-10">
              <div className="mb-5 flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="rounded-full bg-terracotta-soft px-4 py-2 text-xs font-bold text-terracotta-deep sm:text-sm">
                  {recipe.category}
                </span>

                <span className="rounded-full bg-card px-4 py-2 text-xs font-bold text-cacao shadow-soft ring-1 ring-bark sm:text-sm">
                  {recipe.difficulty}
                </span>
              </div>

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-terracotta sm:text-sm">
                Recette maison
              </p>

              <h1 className="text-3xl font-black tracking-tight text-stone-950 sm:text-4xl md:text-5xl">
                {recipe.title}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 sm:mt-5 sm:text-lg sm:leading-8">
                {recipe.description}
              </p>

              {recipe.userId && (
                <Link
                  to={`/users/${recipe.userId}`}
                  className="mt-6 block rounded-[1.75rem] bg-white p-4 shadow-sm ring-1 ring-orange-100 transition hover:bg-orange-50 print:hidden sm:mt-7 sm:rounded-[2rem] sm:p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-500 text-xl font-black text-white ring-2 ring-white sm:h-16 sm:w-16 sm:text-2xl">
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

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-500">
                        Recette proposée par
                      </p>

                      <p className="truncate text-lg font-black text-stone-950">
                        {authorName}
                      </p>

                      <p className="mt-1 text-sm font-bold text-orange-700">
                        Voir le profil →
                      </p>
                    </div>
                  </div>

                  {authorBio && (
                    <p className="mt-4 line-clamp-3 leading-7 text-stone-600">
                      {authorBio}
                    </p>
                  )}
                </Link>
              )}

              <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
                <div className="rounded-[1.35rem] bg-white px-4 py-4 shadow-sm ring-1 ring-orange-100 sm:rounded-[1.5rem]">
                  <p className="text-xs font-medium text-stone-500 sm:text-sm">
                    Préparation
                  </p>

                  <p className="mt-1 text-lg font-black text-stone-950 sm:text-xl">
                    {recipe.prepTime} min
                  </p>
                </div>

                <div className="rounded-[1.35rem] bg-white px-4 py-4 shadow-sm ring-1 ring-orange-100 sm:rounded-[1.5rem]">
                  <p className="text-xs font-medium text-stone-500 sm:text-sm">
                    Cuisson
                  </p>

                  <p className="mt-1 text-lg font-black text-stone-950 sm:text-xl">
                    {recipe.cookTime} min
                  </p>
                </div>

                <div className="rounded-[1.35rem] bg-white px-4 py-4 shadow-sm ring-1 ring-orange-100 sm:rounded-[1.5rem]">
                  <p className="text-xs font-medium text-stone-500 sm:text-sm">
                    Total
                  </p>

                  <p className="mt-1 text-lg font-black text-stone-950 sm:text-xl">
                    {totalTime} min
                  </p>
                </div>

                <div className="rounded-[1.35rem] bg-white px-4 py-4 shadow-sm ring-1 ring-orange-100 sm:rounded-[1.5rem]">
                  <p className="text-xs font-medium text-stone-500 sm:text-sm">
                    Portions
                  </p>

                  <p className="mt-1 text-lg font-black text-stone-950 sm:text-xl">
                    {selectedServings} pers.
                  </p>
                </div>
              </div>

              {recipe.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-cream-300 px-3 py-1 text-sm font-semibold text-stone-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-7 rounded-[1.75rem] bg-white p-4 shadow-sm ring-1 ring-orange-100 print:hidden sm:mt-8 sm:rounded-[2rem] sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-wide text-orange-600 sm:text-sm">
                    Actions rapides
                  </p>

                  {isOwner && (
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                      Ta recette
                    </span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    onClick={openGuidedCooking}
                    disabled={recipe.steps.length === 0}
                    fullWidth
                  >
                    <span>▶</span>
                    <span>Lancer la recette</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                    variant="secondary"
                    fullWidth
                  >
                    <span>{isFavorite ? '♥' : '♡'}</span>

                    <span>
                      {isFavorite
                        ? 'Retirer des favoris'
                        : 'Ajouter aux favoris'}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleCopyLink}
                    variant="ghost"
                    fullWidth
                  >
                    🔗 Copier le lien
                  </Button>

                  <Button
                    type="button"
                    onClick={handlePrint}
                    variant="ghost"
                    fullWidth
                  >
                    🖨️ Imprimer
                  </Button>

                  {isOwner && (
                    <>
                      <Button
                        to={`/recipes/${recipe.id}/edit`}
                        variant="secondary"
                        fullWidth
                      >
                        ✏️ Modifier
                      </Button>

                      <Button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        variant="danger"
                        fullWidth
                      >
                        🗑️ {isDeleting ? 'Suppression...' : 'Supprimer'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-7 rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-orange-100 print:hidden sm:mt-8 sm:rounded-[2rem] sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-orange-600 sm:text-sm">
                      Planning de semaine
                    </p>

                    <h2 className="mt-2 text-xl font-black text-stone-950 sm:text-2xl">
                      Ajouter cette recette au planning
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-stone-600 sm:text-base">
                      Choisis un jour et un repas pour retrouver cette recette
                      dans ton planning.
                    </p>
                  </div>

                  <Link
                    to="/planning"
                    className="w-full rounded-full border border-orange-200 bg-cream-50 px-5 py-3 text-center text-sm font-bold text-orange-700 transition hover:bg-orange-50 sm:w-auto"
                  >
                    Voir le planning
                  </Link>
                </div>

                <div className="mt-5 space-y-4">
  <div>
    <p className="mb-2 text-sm font-black uppercase tracking-wide text-stone-500">
      Jour
    </p>

    <select
      value={selectedPlanningDay}
      onChange={(event) =>
        setSelectedPlanningDay(event.target.value as DayKey)
      }
      aria-label="Jour du planning"
      className="w-full rounded-2xl border border-orange-100 bg-cream-50 px-4 py-4 font-bold text-stone-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
    >
      {DAYS.map((day) => (
        <option key={day.key} value={day.key}>
          {day.label}
        </option>
      ))}
    </select>
  </div>

  <div>
    <p className="mb-2 text-sm font-black uppercase tracking-wide text-stone-500">
      Repas
    </p>

    <div className="grid grid-cols-2 gap-3">
      {MEALS.map((meal) => {
        const isSelected = selectedPlanningMeal === meal.key

        return (
          <button
            key={meal.key}
            type="button"
            onClick={() => setSelectedPlanningMeal(meal.key)}
            className={`rounded-2xl px-4 py-4 text-left font-black transition ${
              isSelected
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-cream-50 text-stone-800 ring-1 ring-orange-100 hover:bg-orange-50'
            }`}
          >
            <span className="block text-2xl">{meal.emoji}</span>
            <span className="mt-2 block">{meal.label}</span>
          </button>
        )
      })}
    </div>
  </div>

  <button
    type="button"
    onClick={handleAddRecipeToPlanning}
    className="w-full rounded-2xl bg-orange-500 px-6 py-4 font-black text-white shadow-sm transition hover:bg-orange-600"
  >
    Ajouter au planning
  </button>
</div>
              </div>
            </div>
          </div>
        </article>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100 sm:p-6">
            <div>
              <p className="font-bold text-orange-600">À préparer</p>

              <h2 className="text-2xl font-black text-stone-950">
                Ingrédients
              </h2>

              <p className="mt-1 text-sm leading-6 text-stone-500 print:hidden">
                Clique sur + pour ajouter uniquement les ingrédients souhaités à
                ta liste de courses.
              </p>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-cream-50 p-4 ring-1 ring-orange-100 print:hidden sm:p-5">
              <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                Adapter les portions
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-stone-500">
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

                <div className="flex-1 rounded-full bg-white px-5 py-3 text-center font-black text-stone-950 shadow-sm ring-1 ring-orange-100 sm:flex-none sm:px-6">
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
                  className="w-full rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-50 sm:w-auto"
                >
                  Revenir à {recipe.servings} pers.
                </button>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
                {[2, 4, 6, 8].map((servingValue) => (
                  <button
                    key={servingValue}
                    type="button"
                    onClick={() => setSelectedServings(servingValue)}
                    className={`rounded-full px-3 py-2 text-sm font-black transition sm:px-4 ${
                      selectedServings === servingValue
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-orange-700 ring-1 ring-orange-100 hover:bg-orange-50'
                    }`}
                  >
                    {servingValue}
                  </button>
                ))}
              </div>
            </div>

            {recipe.ingredients.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {scaledIngredients.map((ingredient, index) => {
                  const linkedRecipe = findLinkedRecipe(
                    ingredient,
                    allRecipes,
                    recipe.id,
                  )

                  return (
                    <li
                      key={`${ingredient}-${index}`}
                      className="rounded-[1.4rem] bg-cream-100 px-4 py-3 text-stone-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-black text-orange-600">•</span>

                        <span className="min-w-0 flex-1 text-sm font-medium leading-6 sm:text-base">
                          {ingredient}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleAddIngredientToShoppingList(ingredient, index)
                          }
                          disabled={addingIngredientIndex === index}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-lg font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 print:hidden"
                          aria-label={`Ajouter ${ingredient} à la liste de courses`}
                          title="Ajouter à la liste de courses"
                        >
                          {addingIngredientIndex === index ? '…' : '+'}
                        </button>
                      </div>

                      {linkedRecipe && (
                        <Link
                          to={`/recipes/${linkedRecipe.id}`}
                          className="mt-2 ml-6 inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 transition hover:bg-orange-200 print:hidden"
                          title={`Voir la recette « ${linkedRecipe.title} »`}
                        >
                          🔗 Voir la recette « {linkedRecipe.title} »
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-4 text-stone-500">Aucun ingrédient renseigné.</p>
            )}
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                className="w-full rounded-full bg-orange-500 px-5 py-3 font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 print:hidden sm:w-auto"
              >
                ▶ Lancer
              </button>
            </div>

            {recipe.steps.length > 0 ? (
              <ol className="mt-6 space-y-4">
                {recipe.steps.map((step, index) => (
                  <li
                    key={`${step}-${index}`}
                    className="flex gap-3 rounded-[1.4rem] bg-cream-50 px-4 py-4 text-stone-700 ring-1 ring-orange-50 sm:gap-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-black text-white">
                      {index + 1}
                    </span>

                    <span className="text-sm leading-7 sm:text-base">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-stone-500">Aucune étape renseignée.</p>
            )}
          </section>
        </div>

        <RecipeReviews recipeId={recipe.id} />

        {manualLinkedRecipes.length > 0 && (
          <section className="print:hidden">
            <div className="mb-6">
              <p className="font-bold text-orange-600">Recettes liées</p>

              <h2 className="text-2xl font-black text-stone-950 sm:text-3xl">
                À préparer avec cette recette
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-600 sm:text-base">
                Les recettes-composants reliées à cette fiche.
              </p>
            </div>

            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {manualLinkedRecipes.map((linkedRecipe) => (
                <RecipeCard key={linkedRecipe.id} recipe={linkedRecipe} />
              ))}
            </div>
          </section>
        )}

        {similarRecipes.length > 0 && (
          <section className="print:hidden">
            <div className="mb-6">
              <p className="font-bold text-orange-600">Suggestions</p>

              <h2 className="text-2xl font-black text-stone-950 sm:text-3xl">
                Recettes similaires
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-600 sm:text-base">
                Des idées proches par catégorie ou par tags.
              </p>
            </div>

            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
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