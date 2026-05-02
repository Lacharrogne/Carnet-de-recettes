import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getRecipes } from '../services/recipes'
import { addRecipeIngredientsToShoppingList } from '../services/shoppingList'
import type { Recipe } from '../types/recipe'

type FridgeRecipeMatch = {
  recipe: Recipe
  matchedIngredients: string[]
  missingIngredients: string[]
  missingCount: number
  score: number
}

const ANTI_WASTE_INGREDIENTS = [
  'Courgettes',
  'Tomates',
  'Œufs',
  'Crème',
  'Jambon',
  'Fromage',
  'Poulet',
  'Pommes de terre',
  'Carottes',
  'Riz',
]

const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  oeuf: ['oeuf', 'oeufs', 'œuf', 'œufs'],
  pate: [
    'pate',
    'pates',
    'pâtes',
    'spaghetti',
    'spaghettis',
    'tagliatelle',
    'tagliatelles',
    'penne',
    'coquillette',
    'coquillettes',
  ],
  riz: ['riz'],
  creme: [
    'creme',
    'crème',
    'creme fraiche',
    'crème fraîche',
    'creme liquide',
    'crème liquide',
    'creme epaisse',
    'crème épaisse',
  ],
  fromage: [
    'fromage',
    'fromages',
    'emmental',
    'gruyere',
    'gruyère',
    'mozzarella',
    'mozza',
    'cheddar',
    'comte',
    'comté',
    'parmesan',
  ],
  tomate: ['tomate', 'tomates', 'tomate cerise', 'tomates cerises'],
  oignon: ['oignon', 'oignons'],
  ail: ['ail', 'gousse ail', "gousse d'ail", 'gousses ail', "gousses d'ail"],
  pommeDeTerre: [
    'pomme de terre',
    'pommes de terre',
    'patate',
    'patates',
  ],
  poulet: ['poulet', 'blanc de poulet', 'filet de poulet', 'escalope de poulet'],
  jambon: ['jambon', 'dés de jambon', 'des de jambon', 'tranche de jambon'],
  viandeHachee: [
    'viande hachee',
    'viande hachée',
    'steak hache',
    'steak haché',
    'boeuf hache',
    'bœuf haché',
  ],
  courgette: ['courgette', 'courgettes'],
  carotte: ['carotte', 'carottes'],
  chocolat: ['chocolat', 'chocolat noir', 'chocolat au lait'],
  lait: ['lait'],
  farine: ['farine'],
  beurre: ['beurre'],
  sucre: ['sucre', 'sucre en poudre', 'cassonade'],
  huile: ['huile', 'huile olive', "huile d'olive", 'huile de tournesol'],
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

function removeIngredientDetails(value: string) {
  return normalizeText(value)
    .replace(/\b\d+([.,]\d+)?\b/g, ' ')
    .replace(
      /\b(g|gr|gramme|grammes|kg|kilo|kilos|ml|cl|l|litre|litres|cuillere|cuilleres|cafe|soupe|cas|cac|pincee|pincees|tranche|tranches|boite|boites|sachet|sachets|verre|verres)\b/g,
      ' ',
    )
    .replace(/\b(de|du|des|d|la|le|les|un|une|a|au|aux|et|ou)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function singularizeText(value: string) {
  return value
    .split(' ')
    .map((word) => {
      if (word.length > 3 && word.endsWith('s')) {
        return word.slice(0, -1)
      }

      return word
    })
    .join(' ')
}

function getIngredientTerms(value: string) {
  const base = normalizeText(value)
  const simplified = removeIngredientDetails(value)

  const terms = new Set<string>()

  const rawTerms = [
    base,
    simplified,
    singularizeText(base),
    singularizeText(simplified),
  ]

  rawTerms.filter(Boolean).forEach((term) => terms.add(term))

  Object.values(INGREDIENT_SYNONYMS).forEach((synonyms) => {
    const normalizedSynonyms = synonyms.map((synonym) => normalizeText(synonym))

    const hasSynonym = normalizedSynonyms.some((synonym) => {
      return Array.from(terms).some((term) => {
        return (
          term === synonym ||
          term.includes(synonym) ||
          synonym.includes(term)
        )
      })
    })

    if (hasSynonym) {
      normalizedSynonyms.forEach((synonym) => terms.add(synonym))

      normalizedSynonyms
        .map((synonym) => singularizeText(synonym))
        .forEach((synonym) => terms.add(synonym))
    }
  })

  return Array.from(terms).filter(Boolean)
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

function getUniqueIngredients(ingredients: string[]) {
  const uniqueIngredients = new Map<string, string>()

  ingredients.forEach((ingredient) => {
    const normalizedIngredient = normalizeText(ingredient)

    if (normalizedIngredient) {
      uniqueIngredients.set(normalizedIngredient, ingredient)
    }
  })

  return Array.from(uniqueIngredients.values())
}

function ingredientMatches(
  recipeIngredient: string,
  availableIngredients: string[],
) {
  const recipeTerms = getIngredientTerms(recipeIngredient)

  return availableIngredients.some((availableIngredient) => {
    const availableTerms = getIngredientTerms(availableIngredient)

    return recipeTerms.some((recipeTerm) => {
      return availableTerms.some((availableTerm) => {
        if (!recipeTerm || !availableTerm) {
          return false
        }

        return (
          recipeTerm === availableTerm ||
          recipeTerm.includes(availableTerm) ||
          availableTerm.includes(recipeTerm)
        )
      })
    })
  })
}

function recipeUsesIngredient(recipe: Recipe, ingredient: string) {
  if (!ingredient.trim()) {
    return false
  }

  return recipe.ingredients.some((recipeIngredient) =>
    ingredientMatches(recipeIngredient, [ingredient]),
  )
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
      <div className="border-b border-orange-100 bg-[#fffaf3] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-orange-600">
              Compatibilité
            </p>

            <p className="mt-1 text-3xl font-black text-stone-950">
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

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-green-700">
              Tu as déjà
            </p>

            {match.matchedIngredients.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {match.matchedIngredients.slice(0, 5).map((ingredient) => (
                  <span
                    key={ingredient}
                    className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700"
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
                    className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700"
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
        className="block p-5 transition hover:bg-orange-50/40"
      >
        <div className="flex gap-5">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#fff1e6] text-5xl">
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

            <h3 className="mt-3 text-xl font-black text-stone-950">
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
        <div className="border-t border-orange-100 p-5">
          <button
            type="button"
            onClick={() => onAddMissingIngredients(match)}
            disabled={adding}
            className="w-full rounded-full bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
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
        } été ajouté${createdItems.length > 1 ? 's' : ''} à ta liste de courses.`,
      )
    } catch (error) {
      console.error(error)

      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('utilisateur non connecté')
      ) {
        setErrorMessage(
          'Connecte-toi pour ajouter les ingrédients à ta liste de courses.',
        )
      } else if (
        error instanceof Error &&
        error.message.toLowerCase().includes('déjà dans la liste')
      ) {
        setErrorMessage(
          'Ces ingrédients sont déjà dans ta liste de courses pour cette recette.',
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
    <section className="space-y-12">
      <div className="overflow-hidden rounded-[2.5rem] bg-[#fffaf3] shadow-sm ring-1 ring-orange-100">
        <div className="grid gap-10 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:py-12">
          <div className="flex flex-col justify-center">
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
              plus simples à faire maintenant.
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
                onClick={clearFridge}
                className="rounded-full border border-orange-200 bg-white px-6 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
              >
                Vider mon frigo
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
                    Ton frigo
                  </p>

                  <p className="mt-1 text-sm text-stone-500">
                    Note ce que tu as déjà chez toi.
                  </p>
                </div>

                <span className="rounded-full bg-[#fffaf3] px-3 py-1 text-xs font-black text-stone-600 ring-1 ring-orange-100">
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
                placeholder="Exemple : œufs, pâtes, crème, jambon, fromage..."
                className="mt-4 min-h-36 w-full resize-none rounded-[1.5rem] border border-orange-100 bg-[#fffaf3] px-5 py-4 text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              />

              <p className="mt-3 text-sm text-stone-500">
                Sépare les ingrédients avec une virgule ou écris-les sur
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

            <div className="rounded-[2rem] bg-green-50 p-6 shadow-sm ring-1 ring-green-100">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                  ♻️
                </span>

                <div>
                  <p className="font-black text-green-800">Mode anti-gaspi</p>

                  <p className="text-sm text-green-700">
                    Mets en priorité un ingrédient à finir.
                  </p>
                </div>
              </div>

              <input
                value={priorityIngredient}
                onChange={(event) => {
                  setPriorityIngredient(event.target.value)
                  clearMessages()
                }}
                placeholder="Exemple : courgettes"
                className="mt-5 w-full rounded-[1.4rem] border border-green-100 bg-white px-5 py-4 font-semibold text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
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

      {loading ? (
        <div className="rounded-[2rem] bg-white p-8 text-stone-600 shadow-sm ring-1 ring-orange-100">
          Chargement des recettes...
        </div>
      ) : effectiveAvailableIngredients.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
          <p className="text-xl font-black text-stone-950">
            Commence par remplir ton frigo.
          </p>

          <p className="mt-2 text-stone-600">
            Ajoute quelques ingrédients ou choisis un ingrédient anti-gaspi pour
            découvrir les recettes possibles.
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
        <section className="rounded-[2.5rem] bg-[#fffaf3]/95 p-6 shadow-sm ring-1 ring-orange-100 md:p-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                Résultats
              </p>

              <h2 className="mt-2 text-3xl font-black text-stone-950 md:text-4xl">
                Recettes proposées
              </h2>

              <p className="mt-2 max-w-3xl leading-7 text-stone-600">
                Les recettes sont triées automatiquement : d’abord celles qui
                utilisent ton ingrédient anti-gaspi, puis celles avec le moins
                d’ingrédients manquants.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
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

          <div className="grid gap-6 xl:grid-cols-2">
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