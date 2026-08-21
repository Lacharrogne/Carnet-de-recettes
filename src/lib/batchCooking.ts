import type { Recipe } from '../types/recipe'

/**
 * Repère les recettes planifiées qui partagent des ingrédients marquants, pour
 * suggérer de les préparer ensemble (batch cooking) et gagner du temps /
 * limiter le gaspillage.
 */

// Unités et mots de liaison à retirer pour isoler le nom de l'ingrédient.
const NOISE = new Set([
  'de', 'des', 'du', 'la', 'le', 'les', 'un', 'une', 'aux', 'au', 'et', 'a',
  'en', 'd', 'l', 'g', 'kg', 'mg', 'ml', 'cl', 'dl', 'l', 'litre', 'litres',
  'cuillere', 'cuilleres', 'cuillère', 'cuillères', 'soupe', 'cafe', 'café',
  'cas', 'cac', 'c', 'tasse', 'tasses', 'pincee', 'pincée', 'sachet', 'sachets',
  'boite', 'boîte', 'tranche', 'tranches', 'gousse', 'gousses', 'brin', 'brins',
  'morceau', 'morceaux', 'verre', 'verres', 'bouquet', 'poignee', 'poignée',
  'quelques', 'peu', 'gros', 'grosse', 'petit', 'petite', 'grand', 'grande',
])

// Ingrédients trop banals pour signaler un vrai partage (présents partout).
const TOO_COMMON = new Set(['sel', 'poivre', 'eau', 'huile', 'sucre'])

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Mots « marquants » d'un ingrédient (nom, sans quantités/unités/liaisons). */
function ingredientWords(ingredient: string): string[] {
  return normalize(ingredient)
    .split(' ')
    .filter((word) => word.length > 2 && !NOISE.has(word) && !TOO_COMMON.has(word))
}

function distinctiveSet(recipe: Recipe): Set<string> {
  const words = new Set<string>()
  for (const ingredient of recipe.ingredients) {
    for (const word of ingredientWords(ingredient)) {
      words.add(word)
    }
  }
  return words
}

export type BatchGroup = {
  recipes: Recipe[]
  shared: string[]
}

/**
 * Renvoie les paires de recettes qui partagent au moins 2 ingrédients
 * marquants, triées par nombre d'ingrédients communs (les plus utiles d'abord).
 */
export function findBatchCookingGroups(recipes: Recipe[]): BatchGroup[] {
  const unique = Array.from(new Map(recipes.map((r) => [r.id, r])).values())
  const sets = unique.map((recipe) => ({ recipe, words: distinctiveSet(recipe) }))

  const groups: BatchGroup[] = []

  for (let i = 0; i < sets.length; i += 1) {
    for (let j = i + 1; j < sets.length; j += 1) {
      const shared: string[] = []
      for (const word of sets[i].words) {
        if (sets[j].words.has(word)) shared.push(word)
      }
      if (shared.length >= 2) {
        groups.push({
          recipes: [sets[i].recipe, sets[j].recipe],
          shared,
        })
      }
    }
  }

  return groups.sort((a, b) => b.shared.length - a.shared.length).slice(0, 4)
}
