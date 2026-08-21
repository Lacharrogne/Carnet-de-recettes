import {
  DAYS,
  MAIN_MEALS,
  createEmptyPlanner,
  type MealPlannerState,
} from './weeklyPlanner'
import { getRecipeDiets, type DietKey } from './dietFilters'
import { getRecipeNutrition } from './recipeNutrition'
import type { Recipe } from '../types/recipe'

/**
 * Génère une semaine de repas « équilibrée » à partir d'un pool de recettes.
 * Chaque jour reçoit ses 5 repas à part entière : petit déjeuner, déjeuner,
 * goûter, dîner, dessert — remplis depuis les catégories adaptées quand elles
 * existent (les repas sans candidat restent vides).
 *
 * Options « intelligentes » (toutes facultatives) :
 * - `diets` : ne garder que les recettes compatibles avec ces régimes,
 * - `economical` : privilégier les recettes les moins chères (mode éco),
 * - `avoidRecipeIds` : éviter ces recettes (ex. celles de la semaine passée).
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
  return filtered.length > 0 ? filtered : pool
}

/** Mélange aléatoire, ou tri par coût croissant (avec aléa) en mode éco. */
function orderPool(pool: Recipe[], economical: boolean): Recipe[] {
  if (!economical) return shuffle(pool)

  return [...pool]
    .map((recipe) => {
      const cost = getRecipeNutrition(recipe).costPerServing || 99
      return { recipe, score: cost * (0.8 + Math.random() * 0.4) }
    })
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.recipe)
}

/**
 * Pioche tournante sur un pool : évite les répétitions dans la semaine, tente
 * d'éviter les recettes de la semaine passée et (optionnellement) une catégorie
 * déjà prise dans la journée. Renvoie null si le pool est vide.
 */
function createPicker(
  items: Recipe[],
  economical: boolean,
  avoid?: Set<number>,
) {
  let bag = orderPool(items, economical)
  const used = new Set<number>()

  return function pick(excludeCategories?: Set<string>): Recipe | null {
    if (items.length === 0) return null

    let candidate =
      bag.find(
        (recipe) =>
          !used.has(recipe.id) &&
          !avoid?.has(recipe.id) &&
          !excludeCategories?.has(recipe.category),
      ) ??
      bag.find(
        (recipe) =>
          !used.has(recipe.id) && !excludeCategories?.has(recipe.category),
      ) ??
      bag.find((recipe) => !used.has(recipe.id))

    if (!candidate) {
      bag = orderPool(items, economical)
      used.clear()
      candidate =
        bag.find((recipe) => !excludeCategories?.has(recipe.category)) ?? bag[0]
    }

    if (!candidate) return null
    used.add(candidate.id)
    return candidate
  }
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
  const mainPool = mains.length > 0 ? mains : dietPool
  const breakfastPool = dietPool.filter(
    (recipe) => recipe.category === 'Petit-déjeuner',
  )
  const sweetPool = dietPool.filter((recipe) => recipe.category === 'Sucré')

  const pickMain = createPicker(mainPool, economical, avoidRecipeIds)
  const pickBreakfast = createPicker(breakfastPool, economical, avoidRecipeIds)
  const pickSweet = createPicker(sweetPool, economical, avoidRecipeIds)

  const set = (recipe: Recipe | null) => (recipe ? String(recipe.id) : '')

  for (const day of DAYS) {
    const dayCategories = new Set<string>()

    const breakfast = pickBreakfast()
    const lunch = pickMain(dayCategories)
    if (lunch) dayCategories.add(lunch.category)
    const snack = pickSweet()
    const dinner = pickMain(dayCategories)
    if (dinner) dayCategories.add(dinner.category)
    const dessert = pickSweet()

    planner[day.key] = {
      breakfast: set(breakfast),
      lunch: set(lunch),
      snack: set(snack),
      dinner: set(dinner),
      dessert: set(dessert),
    }
  }

  return planner
}

/** IDs des recettes principales (déjeuner/dîner) — pour l'évitement inter-semaines. */
export function getMainRecipeIds(planner: MealPlannerState): number[] {
  const ids = new Set<number>()
  for (const day of DAYS) {
    for (const meal of MAIN_MEALS) {
      const value = planner[day.key][meal.key]
      if (value) ids.add(Number(value))
    }
  }
  return [...ids]
}
