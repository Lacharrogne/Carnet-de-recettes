import { getRecipeDiets } from './dietFilters'
import type { Recipe } from '../types/recipe'

/**
 * Recommandations « Pour toi » — 100 % local et gratuit.
 *
 * On construit un « profil de goûts » à partir des recettes que la personne
 * aime (favoris) et cuisine (historique), puis on note les autres recettes
 * selon leur ressemblance (catégorie, tags, régime) pour proposer des idées
 * qu'elle n'a pas encore essayées.
 */

export type TasteProfile = {
  categories: Record<string, number>
  tags: Record<string, number>
  diets: Record<string, number>
  liked: number
}

/**
 * Construit le profil depuis des recettes « aimées ». Chaque recette peut être
 * pondérée (ex. cuisinée plusieurs fois) via `weight`.
 */
export function buildTasteProfile(
  likedRecipes: { recipe: Recipe; weight: number }[],
): TasteProfile {
  const categories: Record<string, number> = {}
  const tags: Record<string, number> = {}
  const diets: Record<string, number> = {}
  let liked = 0

  for (const { recipe, weight } of likedRecipes) {
    if (weight <= 0) continue
    liked += weight

    categories[recipe.category] = (categories[recipe.category] ?? 0) + weight

    for (const tag of recipe.tags) {
      tags[tag] = (tags[tag] ?? 0) + weight
    }

    const recipeDiets = getRecipeDiets(recipe)
    for (const [diet, active] of Object.entries(recipeDiets)) {
      if (active) diets[diet] = (diets[diet] ?? 0) + weight
    }
  }

  return { categories, tags, diets, liked }
}

/** Note une recette selon sa proximité au profil de goûts. */
export function scoreRecipe(recipe: Recipe, profile: TasteProfile): number {
  let score = 2 * (profile.categories[recipe.category] ?? 0)

  for (const tag of recipe.tags) {
    score += profile.tags[tag] ?? 0
  }

  const recipeDiets = getRecipeDiets(recipe)
  for (const [diet, active] of Object.entries(recipeDiets)) {
    if (active) score += 0.5 * (profile.diets[diet] ?? 0)
  }

  return score
}

/**
 * Propose des recettes proches des goûts, en excluant celles déjà aimées /
 * cuisinées (pour suggérer du nouveau). Renvoie [] si le profil est vide.
 */
export function recommendRecipes(
  allRecipes: Recipe[],
  profile: TasteProfile,
  excludeIds: Set<number>,
  limit = 6,
): Recipe[] {
  if (profile.liked === 0) return []

  return allRecipes
    .filter((recipe) => !excludeIds.has(recipe.id))
    .map((recipe) => ({ recipe, score: scoreRecipe(recipe, profile) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.recipe.id - a.recipe.id)
    .slice(0, limit)
    .map((entry) => entry.recipe)
}
