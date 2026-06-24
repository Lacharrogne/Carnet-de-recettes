import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Alert from '../components/ui/Alert'
import EmptyState from '../components/ui/EmptyState'
import { RecipeCardGridSkeleton } from '../components/ui/Skeleton'
import {
  ANTI_WASTE_INGREDIENTS,
  analyzeRecipe,
  getUniqueIngredients,
  normalizeText,
  parseFridgeIngredients,
  recipeUsesIngredient,
  type FridgeRecipeMatch,
} from '../lib/fridgeMatching'
import { getRecipes } from '../services/recipes'
import { addRecipeIngredientsToShoppingList } from '../services/shoppingList'
import type { Recipe } from '../types/recipe'

function FridgeResultCard({
  match,
  adding,
  onAddMissingIngredients,
}: {
  match: FridgeRecipeMatch
  adding: boolean
  onAddMissingIngredients: (match: FridgeRecipeMatch) => void
}) {
  const totalTime = match.recipe.prepTime + match.recipe.cookTime
  const imageToDisplay = match.recipe.imageUrl || match.recipe.image

  return (
    <article className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-md">
      <div className="border-b border-orange-100 bg-cream-50 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-orange-600">
              Compatibilité
            </p>

            <p className="mt-1 text-3xl font-black text-stone-950 sm:text-4xl">
              {match.score} %
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-4 py-2 text-sm font-black ${
              match.missingCount === 0
                ? 'bg-green-100 text-green-700'
                : match.missingCount <= 2
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-stone-100 text-stone-600'
            }`}
          >
            {match.missingCount === 0
              ? 'Tout est disponible'
              : `${match.missingCount} ingrédient${
                  match.missingCount > 1 ? 's' : ''
                } manquant${match.missingCount > 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-green-700">
              Vous avez déjà
            </p>

            {match.matchedIngredients.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {match.matchedIngredients.slice(0, 5).map((ingredient) => (
                  <span
                    key={ingredient}
                    className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm font-medium text-stone-500">
                Aucun ingrédient reconnu.
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wide text-orange-700">
              Il manque
            </p>

            {match.missingIngredients.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {match.missingIngredients.slice(0, 5).map((ingredient) => (
                  <span
                    key={ingredient}
                    className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm font-medium text-green-700">
                Rien à acheter.
              </p>
            )}
          </div>
        </div>
      </div>

      <Link
        to={`/recipes/${match.recipe.id}`}
        className="block p-5 transition hover:bg-orange-50/40 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
          <div className="flex h-44 w-full shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] bg-cream-200 text-6xl sm:h-24 sm:w-24 sm:text-5xl">
            {imageToDisplay && imageToDisplay.startsWith('http') ? (
              <img
                src={imageToDisplay}
                alt={match.recipe.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{match.recipe.image || '🍽️'}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                {match.recipe.category}
              </span>

              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700">
                {match.recipe.difficulty}
              </span>
            </div>

            <h3 className="mt-3 text-xl font-black leading-tight text-stone-950 sm:text-2xl">
              {match.recipe.title}
            </h3>

            <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
              {match.recipe.description ||
                'Aucune description pour cette recette.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-stone-600">
              <span>⏱️ {totalTime} min</span>
              <span>🍽️ {match.recipe.servings} pers.</span>
            </div>
          </div>
        </div>
      </Link>

      {match.missingIngredients.length > 0 && (
        <div className="border-t border-orange-100 p-5 sm:p-6">
          <button
            type="button"
            onClick={() => onAddMissingIngredients(match)}
            disabled={adding}
            className="w-full rounded-full bg-orange-500 px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adding
              ? 'Ajout en cours...'
              : 'Ajouter les ingrédients manquants'}
          </button>
        </div>
      )}
    </article>
  )
}

export default function FridgePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [fridgeValue, setFridgeValue] = useState('')
  const [priorityIngredient, setPriorityIngredient] = useState('')
  const [loading, setLoading] = useState(true)
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

  const fridgeIngredients = useMemo(() => {
    return parseFridgeIngredients(fridgeValue)
  }, [fridgeValue])

  const effectiveAvailableIngredients = useMemo(() => {
    return getUniqueIngredients([
      ...fridgeIngredients,
      ...(priorityIngredient.trim() ? [priorityIngredient.trim()] : []),
    ])
  }, [fridgeIngredients, priorityIngredient])

  const analyzedRecipes = useMemo(() => {
    if (effectiveAvailableIngredients.length === 0) {
      return []
    }

    return recipes
      .map((recipe) => analyzeRecipe(recipe, effectiveAvailableIngredients))
      .filter((match) => match.matchedIngredients.length > 0)
      .sort((firstRecipe, secondRecipe) => {
        const firstUsesPriority = recipeUsesIngredient(
          firstRecipe.recipe,
          priorityIngredient,
        )

        const secondUsesPriority = recipeUsesIngredient(
          secondRecipe.recipe,
          priorityIngredient,
        )

        if (firstUsesPriority !== secondUsesPriority) {
          return firstUsesPriority ? -1 : 1
        }

        if (firstRecipe.missingCount !== secondRecipe.missingCount) {
          return firstRecipe.missingCount - secondRecipe.missingCount
        }

        if (secondRecipe.score !== firstRecipe.score) {
          return secondRecipe.score - firstRecipe.score
        }

        const firstRecipeTime =
          firstRecipe.recipe.prepTime + firstRecipe.recipe.cookTime

        const secondRecipeTime =
          secondRecipe.recipe.prepTime + secondRecipe.recipe.cookTime

        return firstRecipeTime - secondRecipeTime
      })
  }, [effectiveAvailableIngredients, priorityIngredient, recipes])

  const bestScore = analyzedRecipes[0]?.score ?? 0

  const antiWasteCount = useMemo(() => {
    if (!priorityIngredient.trim()) {
      return 0
    }

    return analyzedRecipes.filter((match) =>
      recipeUsesIngredient(match.recipe, priorityIngredient),
    ).length
  }, [analyzedRecipes, priorityIngredient])

  function clearMessages() {
    setErrorMessage('')
    setSuccessMessage('')
  }

  function removeIngredient(ingredientToRemove: string) {
    const nextIngredients = fridgeIngredients.filter(
      (ingredient) =>
        normalizeText(ingredient) !== normalizeText(ingredientToRemove),
    )

    setFridgeValue(nextIngredients.join(', '))
    clearMessages()
  }

  function useExampleFridge() {
    setFridgeValue('Œufs, pâtes, crème, jambon, fromage, oignons')
    setPriorityIngredient('Courgettes')
    clearMessages()
  }

  function clearFridge() {
    setFridgeValue('')
    setPriorityIngredient('')
    clearMessages()
  }

  async function handleAddMissingIngredients(match: FridgeRecipeMatch) {
    if (match.missingIngredients.length === 0) {
      return
    }

    try {
      setAddingRecipeId(match.recipe.id)
      clearMessages()

      const createdItems = await addRecipeIngredientsToShoppingList(
        match.recipe.id,
        match.missingIngredients,
      )

      setSuccessMessage(
        `${createdItems.length} ingrédient${
          createdItems.length > 1 ? 's ont' : ' a'
        } été ajouté${createdItems.length > 1 ? 's' : ''} à votre liste de courses.`,
      )
    } catch (error) {
      console.error(error)

      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('utilisateur non connecté')
      ) {
        setErrorMessage(
          'Connectez-vous pour ajouter les ingrédients à votre liste de courses.',
        )
      } else if (
        error instanceof Error &&
        error.message.toLowerCase().includes('déjà dans la liste')
      ) {
        setErrorMessage(
          'Ces ingrédients sont déjà dans votre liste de courses pour cette recette.',
        )
      } else {
        setErrorMessage(
          'Impossible d’ajouter les ingrédients à la liste de courses.',
        )
      }
    } finally {
      setAddingRecipeId(null)
    }
  }

  return (
    <section className="space-y-8 sm:space-y-12">
      <div className="overflow-hidden rounded-[2rem] bg-cream-50 shadow-sm ring-1 ring-orange-100 sm:rounded-[2.5rem]">
        <div className="grid gap-7 px-5 py-7 sm:px-6 sm:py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:py-12">
          <div className="flex flex-col justify-center">
            <div className="mb-5 flex w-fit items-center gap-3 rounded-full bg-cream-300 px-4 py-2 text-sm font-bold text-orange-700 sm:mb-6">
              <span>🥕</span>
              <span>Mode Frigo</span>
            </div>

            <h1 className="max-w-3xl text-3xl font-black leading-tight text-stone-950 sm:text-4xl md:text-6xl">
              Que pouvez-vous cuisiner avec ce que vous avez déjà ?
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 sm:mt-6 sm:text-lg sm:leading-8">
              Écrivez les ingrédients disponibles dans votre frigo, vos placards ou
              votre congélateur. Le carnet vous propose ensuite les recettes les
              plus simples à faire maintenant.
            </p>

            <div className="mt-6 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={useExampleFridge}
                className="rounded-full bg-orange-500 px-6 py-3.5 font-bold text-white shadow-sm transition hover:bg-orange-600"
              >
                Essayer un exemple
              </button>

              <button
                type="button"
                onClick={clearFridge}
                className="rounded-full border border-orange-200 bg-white px-6 py-3.5 font-bold text-orange-700 transition hover:bg-orange-50"
              >
                Vider mon frigo
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-orange-100 sm:rounded-[2rem] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
                    Votre frigo
                  </p>

                  <p className="mt-1 text-sm text-stone-500">
                    Notez ce que vous avez déjà chez vous.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-cream-50 px-3 py-1 text-xs font-black text-stone-600 ring-1 ring-orange-100">
                  {fridgeIngredients.length} ingrédient
                  {fridgeIngredients.length > 1 ? 's' : ''}
                </span>
              </div>

              <textarea
                value={fridgeValue}
                onChange={(event) => {
                  setFridgeValue(event.target.value)
                  clearMessages()
                }}
                aria-label="Ingrédients présents dans votre frigo" placeholder="Exemple : œufs, pâtes, crème, jambon, fromage..."
                className="mt-4 min-h-36 w-full resize-none rounded-[1.5rem] border border-orange-100 bg-cream-50 px-4 py-4 text-base text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100 sm:px-5"
              />

              <p className="mt-3 text-sm leading-6 text-stone-500">
                Séparez les ingrédients avec une virgule ou écrivez-les sur
                plusieurs lignes.
              </p>

              {fridgeIngredients.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {fridgeIngredients.map((ingredient) => (
                    <button
                      key={ingredient}
                      type="button"
                      onClick={() => removeIngredient(ingredient)}
                      className="rounded-full bg-orange-100 px-3 py-2 text-sm font-bold text-orange-700 transition hover:bg-orange-200"
                    >
                      {ingredient} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] bg-green-50 p-5 shadow-sm ring-1 ring-green-100 sm:rounded-[2rem] sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                  ♻️
                </span>

                <div>
                  <p className="font-black text-green-800">Mode anti-gaspi</p>

                  <p className="text-sm leading-6 text-green-700">
                    Mettez en priorité un ingrédient à finir.
                  </p>
                </div>
              </div>

              <input
                value={priorityIngredient}
                onChange={(event) => {
                  setPriorityIngredient(event.target.value)
                  clearMessages()
                }}
                aria-label="Ajouter un ingrédient" placeholder="Exemple : courgettes"
                className="mt-5 w-full rounded-[1.4rem] border border-green-100 bg-white px-4 py-4 font-semibold text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-green-300 focus:ring-4 focus:ring-green-100 sm:px-5"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {ANTI_WASTE_INGREDIENTS.map((ingredient) => (
                  <button
                    key={ingredient}
                    type="button"
                    onClick={() => {
                      setPriorityIngredient(ingredient)
                      clearMessages()
                    }}
                    className="rounded-full bg-white px-4 py-2 text-sm font-bold text-green-800 shadow-sm ring-1 ring-green-100 transition hover:bg-green-100"
                  >
                    {ingredient}
                  </button>
                ))}
              </div>

              {priorityIngredient && (
                <button
                  type="button"
                  onClick={() => {
                    setPriorityIngredient('')
                    clearMessages()
                  }}
                  className="mt-4 text-sm font-black text-green-800 underline"
                >
                  Retirer l’ingrédient anti-gaspi
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <Alert tone="error">
          <p className="font-bold">{errorMessage}</p>

          {errorMessage.includes('Connectez-vous') && (
            <Link
              to="/auth"
              className="mt-2 inline-block font-black text-red-800 underline"
            >
              Aller à la connexion
            </Link>
          )}
        </Alert>
      )}

      {successMessage && (
        <Alert tone="success">
          <p className="font-bold">{successMessage}</p>

          <Link
            to="/shopping-list"
            className="mt-2 inline-block font-black text-green-800 underline"
          >
            Voir ma liste de courses
          </Link>
        </Alert>
      )}

      {loading ? (
        <RecipeCardGridSkeleton count={3} />
      ) : effectiveAvailableIngredients.length === 0 ? (
        <EmptyState
          tone="sage"
          emoji="🥕"
          title="Commencez par remplir votre frigo"
          description="Ajoutez quelques ingrédients ci-dessus, ou choisissez un ingrédient anti-gaspi, et le carnet vous propose aussitôt les recettes possibles."
        />
      ) : analyzedRecipes.length === 0 ? (
        <EmptyState
          tone="honey"
          emoji="🔍"
          title="Aucune recette avec ces ingrédients"
          description="Essayez avec des ingrédients plus courants comme œufs, pâtes, riz, tomates ou fromage."
        />
      ) : (
        <section className="rounded-[2rem] bg-cream-50/95 p-5 shadow-sm ring-1 ring-orange-100 sm:rounded-[2.5rem] sm:p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                Résultats
              </p>

              <h2 className="mt-2 text-2xl font-black text-stone-950 sm:text-3xl md:text-4xl">
                Recettes proposées
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600 sm:text-base sm:leading-7">
                Les recettes sont triées automatiquement : d’abord celles qui
                utilisent votre ingrédient anti-gaspi, puis celles avec le moins
                d’ingrédients manquants.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm ring-1 ring-orange-100">
                {analyzedRecipes.length} recette
                {analyzedRecipes.length > 1 ? 's' : ''}
              </span>

              <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-green-800 shadow-sm ring-1 ring-green-100">
                meilleur score : {bestScore} %
              </span>

              {priorityIngredient && (
                <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-black text-green-800 shadow-sm ring-1 ring-green-100">
                  {antiWasteCount} anti-gaspi
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:gap-6 xl:grid-cols-2">
            {analyzedRecipes.map((match) => (
              <FridgeResultCard
                key={match.recipe.id}
                match={match}
                adding={addingRecipeId === match.recipe.id}
                onAddMissingIngredients={handleAddMissingIngredients}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  )
}