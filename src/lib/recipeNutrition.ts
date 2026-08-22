import { parseQuantityInfo, type QuantityInfo } from './shoppingAggregation'
import {
  INGREDIENT_NUTRITION,
  type NutritionFacts,
} from '../data/ingredientNutrition'
import type { Recipe } from '../types/recipe'

/**
 * Estimation NUTRITION + COÛT d'une recette à partir de ses ingrédients
 * (texte libre). On parse chaque ligne (quantité + unité + nom), on convertit
 * en grammes, puis on somme via la table de référence. C'est une ESTIMATION :
 * `coverage` indique la part d'ingrédients reconnus.
 */
export type RecipeNutrition = {
  perServing: { kcal: number; prot: number; carb: number; fat: number }
  totalCost: number
  costPerServing: number
  recognized: number
  totalIngredients: number
  /** Part d'ingrédients reconnus (0 → 1). */
  coverage: number
}

// Poids approximatif (g) d'une unité « contenant ».
const CONTAINER_GRAMS: Record<string, number> = {
  'cuillere-a-soupe': 15,
  'cuillere-a-cafe': 5,
  pincee: 1,
  gousse: 5,
  tranche: 20,
  verre: 200,
}

const DEFAULT_PIECE_GRAMS = 60

/** Découpe un nom nettoyé en mots (sans vides). */
function toWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
}

/** Variante singulier d'un mot (retire un « s » ou « x » final). */
function singular(word: string): string {
  if (word.length > 3 && (word.endsWith('s') || word.endsWith('x'))) {
    return word.slice(0, -1)
  }
  return word
}

/**
 * Retrouve les infos nutritionnelles d'un nom nettoyé.
 *
 * On travaille MOT À MOT (et non par sous-chaîne) pour éviter les faux positifs
 * du type « volaille » qui contient « ail », ou « the » qui apparaît dans
 * beaucoup de mots. Une clé n'est retenue que si TOUS ses mots figurent dans le
 * nom. En cas de plusieurs correspondances, on garde la plus spécifique
 * (le plus de mots, puis la plus longue) : « huile olive » l'emporte sur « huile ».
 */
function lookupFacts(name: string): NutritionFacts | null {
  const exact = INGREDIENT_NUTRITION[name]
  if (exact) return exact

  const nameWords = new Set<string>()
  for (const word of toWords(name)) {
    nameWords.add(word)
    nameWords.add(singular(word))
  }

  let best: NutritionFacts | null = null
  let bestScore = 0

  for (const key of Object.keys(INGREDIENT_NUTRITION)) {
    const keyWords = toWords(key)
    const allPresent = keyWords.every(
      (keyWord) => nameWords.has(keyWord) || nameWords.has(singular(keyWord)),
    )
    if (!allPresent) continue

    // Plus la clé a de mots, plus elle est spécifique.
    const score = keyWords.length * 1000 + key.length
    if (score > bestScore) {
      bestScore = score
      best = INGREDIENT_NUTRITION[key]
    }
  }

  return best
}

/** Convertit une quantité analysée en grammes (ou null si non estimable). */
function toGrams(quantity: QuantityInfo, facts: NutritionFacts): number | null {
  switch (quantity.unitKind) {
    case 'weight':
      return quantity.baseValue // déjà en grammes
    case 'volume':
      return quantity.baseValue // ml ≈ g (densité ~1)
    case 'piece':
      return quantity.baseValue * (facts.gramsPerPiece ?? DEFAULT_PIECE_GRAMS)
    case 'container': {
      const grams = CONTAINER_GRAMS[quantity.baseUnit]
      return grams ? quantity.baseValue * grams : null
    }
    default:
      return null
  }
}

export function getRecipeNutrition(recipe: Recipe): RecipeNutrition {
  const ingredients = recipe.ingredients.filter(
    (ingredient) => ingredient.trim().length > 0,
  )

  let kcal = 0
  let prot = 0
  let carb = 0
  let fat = 0
  let cost = 0
  let recognized = 0

  for (const ingredient of ingredients) {
    const quantity = parseQuantityInfo(ingredient, '')
    if (!quantity || !quantity.name) continue

    const facts = lookupFacts(quantity.name)
    if (!facts) continue

    const grams = toGrams(quantity, facts)
    if (grams === null || grams <= 0) continue

    kcal += (facts.kcal * grams) / 100
    prot += (facts.prot * grams) / 100
    carb += (facts.carb * grams) / 100
    fat += (facts.fat * grams) / 100
    cost += (facts.eurPerKg * grams) / 1000
    recognized += 1
  }

  const servings = Math.max(1, recipe.servings || 1)

  return {
    perServing: {
      kcal: Math.round(kcal / servings),
      prot: Math.round(prot / servings),
      carb: Math.round(carb / servings),
      fat: Math.round(fat / servings),
    },
    totalCost: Math.round(cost * 100) / 100,
    costPerServing: Math.round((cost / servings) * 100) / 100,
    recognized,
    totalIngredients: ingredients.length,
    coverage: ingredients.length > 0 ? recognized / ingredients.length : 0,
  }
}

/** Formatte un prix en euros (« 3,20 € »). */
export function formatEuro(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} €`
}
