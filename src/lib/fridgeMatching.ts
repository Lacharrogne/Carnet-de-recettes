import type { Recipe } from '../types/recipe'

export type FridgeRecipeMatch = {
  recipe: Recipe
  matchedIngredients: string[]
  missingIngredients: string[]
  missingCount: number
  score: number
}

// Suggestions « anti-gaspi » proposées en accès rapide.
export const ANTI_WASTE_INGREDIENTS = [
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

// Familles d'ingrédients : permet de rapprocher des libellés voisins
// (ex: « mozzarella » compte comme « fromage »).
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

// Minuscules, sans accents ni ponctuation parasite.
export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Retire quantités, unités et mots-outils pour ne garder que l'aliment.
export function removeIngredientDetails(value: string) {
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

// Supprime le « s » du pluriel sur les mots assez longs.
export function singularizeText(value: string) {
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

// Génère l'ensemble des termes comparables pour un ingrédient,
// enrichi des synonymes de sa famille le cas échéant.
export function getIngredientTerms(value: string) {
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

// Découpe la saisie libre du frigo en ingrédients distincts.
export function parseFridgeIngredients(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,;]+/)
        .map((ingredient) => ingredient.trim())
        .filter(Boolean),
    ),
  )
}

// Déduplique en conservant le libellé d'origine.
export function getUniqueIngredients(ingredients: string[]) {
  const uniqueIngredients = new Map<string, string>()

  ingredients.forEach((ingredient) => {
    const normalizedIngredient = normalizeText(ingredient)

    if (normalizedIngredient) {
      uniqueIngredients.set(normalizedIngredient, ingredient)
    }
  })

  return Array.from(uniqueIngredients.values())
}

// Vrai si l'ingrédient d'une recette correspond à l'un des disponibles.
export function ingredientMatches(
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

// Vrai si la recette emploie l'ingrédient donné.
export function recipeUsesIngredient(recipe: Recipe, ingredient: string) {
  if (!ingredient.trim()) {
    return false
  }

  return recipe.ingredients.some((recipeIngredient) =>
    ingredientMatches(recipeIngredient, [ingredient]),
  )
}

// Compare une recette aux ingrédients disponibles : présents, manquants
// et score de couverture (0-100).
export function analyzeRecipe(
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
