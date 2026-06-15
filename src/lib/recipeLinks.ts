import type { Recipe } from '../types/recipe'

// Plage Unicode des accents combinants (NFD) à retirer.
const COMBINING_MARKS = /[̀-ͯ]/g

// Normalise un texte pour la comparaison : minuscules, sans accents,
// ponctuation transformée en espaces et espaces compressés.
export function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// En dessous de cette longueur, un titre est trop générique pour
// servir de lien fiable (évite les faux positifs type "ail", "riz").
const MIN_TITLE_LENGTH = 4

// Cherche, parmi les autres recettes, celle dont le titre apparaît
// comme une suite de mots entière dans le texte de l'ingrédient.
// Renvoie le titre le plus long (le plus spécifique) en cas d'égalité.
export function findLinkedRecipe(
  ingredient: string,
  recipes: Recipe[],
  currentRecipeId: number,
): Recipe | null {
  const normalizedIngredient = ` ${normalizeForMatch(ingredient)} `

  let best: Recipe | null = null
  let bestLength = 0

  for (const recipe of recipes) {
    if (recipe.id === currentRecipeId) continue

    const normalizedTitle = normalizeForMatch(recipe.title)
    if (normalizedTitle.length < MIN_TITLE_LENGTH) continue

    if (normalizedIngredient.includes(` ${normalizedTitle} `)) {
      if (normalizedTitle.length > bestLength) {
        best = recipe
        bestLength = normalizedTitle.length
      }
    }
  }

  return best
}
