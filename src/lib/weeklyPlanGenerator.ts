import {
  DAYS,
  MEALS,
  createEmptyPlanner,
  type MealPlannerState,
} from './weeklyPlanner'
import { getRecipeDiets, type DietKey } from './dietFilters'
import { getRecipeNutrition } from './recipeNutrition'
import type { Recipe } from '../types/recipe'

/**
 * Génère une semaine de repas « équilibrée » à partir d'un pool de recettes :
 * - privilégie les plats principaux pour déjeuner/dîner,
 * - évite de répéter une même recette sur la semaine (tant que le pool suffit),
 * - évite deux fois la même catégorie dans une journée,
 * - garnit quelques petits-déjeuners et desserts dans les extras.
 *
 * Options « intelligentes » (toutes facultatives) :
 * - `diets` : ne garder que les recettes compatibles avec ces régimes,
 * - `economical` : privilégier les recettes les moins chères (mode éco),
 * - `avoidRecipeIds` : éviter ces recettes (ex. celles de la semaine passée).
 *
 * Aléatoire (mélange) → « Surprends-moi » propose une variante à chaque clic.
 */

export type GenerateOptions = {
  diets?: DietKey[]
  economical?: boolean
  avoidRecipeIds?: Set<number>
}

// Catégories peu adaptées à un déjeuner/dîner principal.
const NON_MAIN_CATEGORIES = ['Petit-déjeuner', 'Sucré', 'Boisson']

function shuffle<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Filtre un pool sur les régimes demandés (garde ceux qui les respectent tous). */
function filterByDiets(pool: Recipe[], diets: DietKey[]): Recipe[] {
  if (diets.length === 0) return pool
  const filtered = pool.filter((recipe) => {
    const recipeDiets = getRecipeDiets(recipe)
    return diets.every((diet) => recipeDiets[diet])
  })
  // Si le filtre ne laisse rien, on préfère générer quelque chose plutôt que rien.
  return filtered.length > 0 ? filtered : pool
}

/**
 * Ordonne le pool : mélange aléatoire, ou tri par coût croissant (avec un peu
 * d'aléa pour garder de la variété) en mode économique.
 */
function orderPool(pool: Recipe[], economical: boolean): Recipe[] {
  if (!economical) return shuffle(pool)

  return [...pool]
    .map((recipe) => {
      const cost = getRecipeNutrition(recipe).costPerServing || 99
      // Jitter ±20 % pour ne pas produire toujours la même semaine.
      return { recipe, score: cost * (0.8 + Math.random() * 0.4) }
    })
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.recipe)
}

export function generateWeeklyPlan(
  pool: Recipe[],
  options: GenerateOptions = {},
): MealPlannerState {
  const planner = createEmptyPlanner()

  if (pool.length === 0) {
    return planner
  }

  const { diets = [], economical = false, avoidRecipeIds } = options

  const dietPool = filterByDiets(pool, diets)

  const mains = dietPool.filter(
    (recipe) => !NON_MAIN_CATEGORIES.includes(recipe.category),
  )
  const primary = mains.length > 0 ? mains : dietPool

  let bag = orderPool(primary, economical)
  const usedThisWeek = new Set<number>()

  function pickFrom(predicate: (recipe: Recipe) => boolean): Recipe | undefined {
    return bag.find(predicate)
  }

  function pickRecipe(dayCategories: Set<string>): Recipe {
    // Idéal : pas déjà pris cette semaine, catégorie du jour libre, non évité.
    let candidate =
      pickFrom(
        (recipe) =>
          !usedThisWeek.has(recipe.id) &&
          !dayCategories.has(recipe.category) &&
          !avoidRecipeIds?.has(recipe.id),
      ) ??
      // On relâche l'évitement « semaine passée » avant tout.
      pickFrom(
        (recipe) =>
          !usedThisWeek.has(recipe.id) && !dayCategories.has(recipe.category),
      ) ??
      pickFrom((recipe) => !usedThisWeek.has(recipe.id))

    // Pool épuisé : on repart sur un nouvel ordre (répétitions autorisées).
    if (!candidate) {
      bag = orderPool(primary, economical)
      usedThisWeek.clear()
      candidate =
        pickFrom((recipe) => !dayCategories.has(recipe.category)) ?? bag[0]
    }

    usedThisWeek.add(candidate.id)
    return candidate
  }

  for (const day of DAYS) {
    const dayCategories = new Set<string>()

    for (const meal of MEALS) {
      const recipe = pickRecipe(dayCategories)
      dayCategories.add(recipe.category)
      planner[day.key][meal.key] = String(recipe.id)
    }
  }

  // Extras : quelques petits-déjeuners et desserts, si le pool en contient.
  const breakfasts = shuffle(
    dietPool.filter((recipe) => recipe.category === 'Petit-déjeuner'),
  )
    .slice(0, 3)
    .map((recipe) => String(recipe.id))

  const desserts = shuffle(
    dietPool.filter((recipe) => recipe.category === 'Sucré'),
  )
    .slice(0, 3)
    .map((recipe) => String(recipe.id))

  planner.weeklyExtras.breakfast = breakfasts
  planner.weeklyExtras.dessert = desserts

  return planner
}

/** IDs des recettes principales d'un planning (pour l'évitement « semaine passée »). */
export function getMainRecipeIds(planner: MealPlannerState): number[] {
  const ids = new Set<number>()
  for (const day of DAYS) {
    for (const meal of MEALS) {
      const value = planner[day.key][meal.key]
      if (value) ids.add(Number(value))
    }
  }
  return [...ids]
}
