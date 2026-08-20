import {
  DAYS,
  MEALS,
  createEmptyPlanner,
  type MealPlannerState,
} from './weeklyPlanner'
import type { Recipe } from '../types/recipe'

/**
 * Génère une semaine de repas « équilibrée » à partir d'un pool de recettes :
 * - privilégie les plats principaux pour déjeuner/dîner,
 * - évite de répéter une même recette sur la semaine (tant que le pool suffit),
 * - évite deux fois la même catégorie dans une journée,
 * - garnit quelques petits-déjeuners et desserts dans les extras.
 *
 * Aléatoire (mélange) → « Surprends-moi » propose une variante à chaque clic.
 */

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

export function generateWeeklyPlan(pool: Recipe[]): MealPlannerState {
  const planner = createEmptyPlanner()

  if (pool.length === 0) {
    return planner
  }

  const mains = pool.filter(
    (recipe) => !NON_MAIN_CATEGORIES.includes(recipe.category),
  )
  const primary = mains.length > 0 ? mains : pool

  let bag = shuffle(primary)
  const usedThisWeek = new Set<number>()

  function pickRecipe(dayCategories: Set<string>): Recipe {
    let candidate =
      bag.find(
        (recipe) =>
          !usedThisWeek.has(recipe.id) && !dayCategories.has(recipe.category),
      ) ?? bag.find((recipe) => !usedThisWeek.has(recipe.id))

    // Pool épuisé : on repart sur un nouveau mélange (répétitions autorisées).
    if (!candidate) {
      bag = shuffle(primary)
      usedThisWeek.clear()
      candidate =
        bag.find((recipe) => !dayCategories.has(recipe.category)) ?? bag[0]
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
    pool.filter((recipe) => recipe.category === 'Petit-déjeuner'),
  )
    .slice(0, 3)
    .map((recipe) => String(recipe.id))

  const desserts = shuffle(
    pool.filter((recipe) => recipe.category === 'Sucré'),
  )
    .slice(0, 3)
    .map((recipe) => String(recipe.id))

  planner.weeklyExtras.breakfast = breakfasts
  planner.weeklyExtras.dessert = desserts

  return planner
}
