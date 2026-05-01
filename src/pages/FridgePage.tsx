import { useEffect, useMemo, useState } from 'react'

import RecipeCard from '../components/recipes/RecipeCard'
import { getRecipes } from '../services/recipes'
import type { Recipe } from '../types/recipe'

type FridgeRecipeMatch = {
  recipe: Recipe
  matchedIngredients: string[]
  missingIngredients: string[]
  missingCount: number
  score: number
}

const QUICK_INGREDIENTS = [
  'Œufs',
  'Pâtes',
  'Riz',
  'Pommes de terre',
  'Farine',
  'Lait',
  'Crème',
  'Beurre',
  'Fromage',
  'Jambon',
  'Poulet',
  'Tomates',
  'Oignons',
  'Courgettes',
  'Chocolat',
]

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

function parseFridgeIngredients(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,;]+/)
        .map((ingredient) => ingredient.trim())
        .filter(Boolean),
    ),
  )
}

function ingredientMatches(
  recipeIngredient: string,
  availableIngredients: string[],
) {
  const normalizedRecipeIngredient = normalizeText(recipeIngredient)

  return availableIngredients.some((availableIngredient) => {
    const normalizedAvailableIngredient = normalizeText(availableIngredient)

    if (!normalizedAvailableIngredient) {
      return false
    }

    return normalizedRecipeIngredient.includes(normalizedAvailableIngredient)
  })
}

function analyzeRecipe(
  recipe: Recipe,
  availableIngredients: string[],
): FridgeRecipeMatch {
  const recipeIngredients = recipe.ingredients.filter(Boolean)

  const matchedIngredients = recipeIngredients.filter((ingredient) =>
    ingredientMatches(ingredient, availableIngredients),
  )

  const missingIngredients = recipeIngredients.filter(
    (ingredient) => !ingredientMatches(ingredient, availableIngredients),
  )

  const score =
    recipeIngredients.length > 0
      ? Math.round((matchedIngredients.length / recipeIngredients.length) * 100)
      : 0

  return {
    recipe,
    matchedIngredients,
    missingIngredients,
    missingCount: missingIngredients.length,
    score,
  }
}

function MatchSummary({ match }: { match: FridgeRecipeMatch }) {
  return (
    <div className="mb-4 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-orange-600">Compatibilité</p>

          <p className="text-2xl font-black text-stone-950">
            {match.score} %
          </p>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-sm font-black ${
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

      {match.matchedIngredients.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-green-700">
            Tu as déjà
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {match.matchedIngredients.slice(0, 4).map((ingredient) => (
              <span
                key={ingredient}
                className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
              >
                {ingredient}
              </span>
            ))}
          </div>
        </div>
      )}

      {match.missingIngredients.length > 0 && match.missingCount <= 4 && (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
            Il manque
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {match.missingIngredients.slice(0, 4).map((ingredient) => (
              <span
                key={ingredient}
                className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700"
              >
                {ingredient}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MatchSection({
  title,
  description,
  emptyMessage,
  matches,
}: {
  title: string
  description: string
  emptyMessage: string
  matches: FridgeRecipeMatch[]
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-stone-950">{title}</h2>

        <p className="mt-2 text-stone-600">{description}</p>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-6 text-stone-600 shadow-sm ring-1 ring-orange-100">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <div key={match.recipe.id}>
              <MatchSummary match={match} />
              <RecipeCard recipe={match.recipe} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function FridgePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [fridgeValue, setFridgeValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

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

  const analyzedRecipes = useMemo(() => {
    if (fridgeIngredients.length === 0) {
      return []
    }

    return recipes
      .map((recipe) => analyzeRecipe(recipe, fridgeIngredients))
      .filter((match) => match.matchedIngredients.length > 0)
      .sort((firstRecipe, secondRecipe) => {
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
  }, [fridgeIngredients, recipes])

  const readyRecipes = analyzedRecipes.filter(
    (match) => match.missingCount === 0,
  )

  const almostReadyRecipes = analyzedRecipes.filter(
    (match) => match.missingCount > 0 && match.missingCount <= 2,
  )

  const inspiredRecipes = analyzedRecipes.filter(
    (match) => match.missingCount > 2,
  )

  function addQuickIngredient(ingredient: string) {
    const currentIngredients = parseFridgeIngredients(fridgeValue)
    const ingredientAlreadyExists = currentIngredients.some(
      (currentIngredient) =>
        normalizeText(currentIngredient) === normalizeText(ingredient),
    )

    if (ingredientAlreadyExists) {
      return
    }

    setFridgeValue([...currentIngredients, ingredient].join(', '))
  }

  function removeIngredient(ingredientToRemove: string) {
    const nextIngredients = fridgeIngredients.filter(
      (ingredient) =>
        normalizeText(ingredient) !== normalizeText(ingredientToRemove),
    )

    setFridgeValue(nextIngredients.join(', '))
  }

  function useExampleFridge() {
    setFridgeValue('Œufs, pâtes, crème, jambon, fromage, oignons')
  }

  return (
    <section className="space-y-12">
      <div className="overflow-hidden rounded-[2.5rem] bg-[#fffaf3] shadow-sm ring-1 ring-orange-100">
        <div className="grid gap-10 px-6 py-10 md:grid-cols-[1fr_0.8fr] md:px-12 md:py-14">
          <div>
            <div className="mb-6 flex w-fit items-center gap-3 rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-orange-700">
              <span>🥕</span>
              <span>Mode Frigo</span>
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight text-stone-950 md:text-6xl">
              Que peux-tu cuisiner avec ce que tu as déjà ?
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
              Écris les ingrédients disponibles dans ton frigo, tes placards ou
              ton congélateur. Le carnet te propose ensuite les recettes les
              plus faciles à faire maintenant.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={useExampleFridge}
                className="rounded-full bg-orange-500 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-orange-600"
              >
                Essayer un exemple
              </button>

              <button
                type="button"
                onClick={() => setFridgeValue('')}
                className="rounded-full border border-orange-200 bg-white px-6 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
              >
                Vider mon frigo
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
              Ton frigo
            </p>

            <textarea
              value={fridgeValue}
              onChange={(event) => setFridgeValue(event.target.value)}
              placeholder="Exemple : œufs, pâtes, crème, jambon, fromage..."
              className="mt-4 min-h-40 w-full resize-none rounded-[1.5rem] border border-orange-100 bg-[#fffaf3] px-5 py-4 text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
            />

            <p className="mt-3 text-sm text-stone-500">
              Sépare les ingrédients avec une virgule ou écris-les sur plusieurs
              lignes.
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
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
        <p className="font-bold text-orange-600">Ingrédients rapides</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_INGREDIENTS.map((ingredient) => (
            <button
              key={ingredient}
              type="button"
              onClick={() => addQuickIngredient(ingredient)}
              className="rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-orange-100 hover:text-orange-700"
            >
              + {ingredient}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </p>
      )}

      {loading ? (
        <div className="rounded-[2rem] bg-white p-8 text-stone-600 shadow-sm ring-1 ring-orange-100">
          Chargement des recettes...
        </div>
      ) : fridgeIngredients.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
          <p className="text-xl font-black text-stone-950">
            Commence par remplir ton frigo.
          </p>

          <p className="mt-2 text-stone-600">
            Ajoute quelques ingrédients pour découvrir les recettes possibles.
          </p>
        </div>
      ) : analyzedRecipes.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
          <p className="text-xl font-black text-stone-950">
            Aucune recette trouvée avec ces ingrédients.
          </p>

          <p className="mt-2 text-stone-600">
            Essaie avec des ingrédients plus simples, comme œufs, pâtes, riz,
            tomates ou fromage.
          </p>
        </div>
      ) : (
        <div className="space-y-14">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
              <p className="text-4xl font-black text-green-700">
                {readyRecipes.length}
              </p>

              <p className="mt-1 font-bold text-stone-700">
                faisable maintenant
              </p>
            </div>

            <div className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
              <p className="text-4xl font-black text-orange-700">
                {almostReadyRecipes.length}
              </p>

              <p className="mt-1 font-bold text-stone-700">
                presque faisable
              </p>
            </div>

            <div className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
              <p className="text-4xl font-black text-stone-700">
                {inspiredRecipes.length}
              </p>

              <p className="mt-1 font-bold text-stone-700">idées proches</p>
            </div>
          </div>

          <MatchSection
            title="Je peux cuisiner maintenant"
            description="Ces recettes utilisent uniquement les ingrédients que tu as indiqués."
            emptyMessage="Aucune recette complète pour le moment."
            matches={readyRecipes}
          />

          <MatchSection
            title="Il me manque 1 ou 2 ingrédients"
            description="Ces recettes sont presque prêtes : il manque seulement quelques éléments."
            emptyMessage="Aucune recette presque complète pour le moment."
            matches={almostReadyRecipes}
          />

          <MatchSection
            title="Idées proches"
            description="Ces recettes peuvent t’inspirer, même s’il manque plusieurs ingrédients."
            emptyMessage="Aucune idée proche trouvée."
            matches={inspiredRecipes}
          />
        </div>
      )}
    </section>
  )
}