import type { Recipe } from '../types/recipe'

// Planning de repas de la semaine, persisté en localStorage.
// Source de vérité partagée (détail recette, planning, accueil).
//
// Depuis la refonte : chaque jour a ses 5 repas à part entière
// (petit déjeuner, déjeuner, goûter, dîner, dessert).

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type MealKey = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'dessert'

export type MealPlannerState = Record<DayKey, Record<MealKey, string>>

export const PLANNER_STORAGE_KEY = 'carnet-recettes-weekly-planner'

/**
 * Émis à chaque écriture du planning, avec le nouvel état complet en `detail`.
 * La couche de synchronisation (`lib/cloudSync.ts`) l'écoute pour répercuter
 * les changements sur le compte.
 */
export const PLANNER_CHANGE_EVENT = 'cr-planner-change'

/**
 * **Le** point de passage pour écrire le planning.
 *
 * Tout passe par ici — écran de planning, ajout depuis une recette, génération
 * automatique — afin qu'aucune modification n'échappe à la synchronisation.
 */
export function persistPlanner(planner: MealPlannerState): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(planner))
  } catch {
    // Stockage indisponible : on continue, la synchronisation prendra le relais.
  }

  window.dispatchEvent(
    new CustomEvent<MealPlannerState>(PLANNER_CHANGE_EVENT, { detail: planner }),
  )
}

export const DAYS: { key: DayKey; label: string }[] = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
]

export const MEALS: { key: MealKey; label: string; emoji: string }[] = [
  { key: 'breakfast', label: 'Petit déjeuner', emoji: '☕' },
  { key: 'lunch', label: 'Déjeuner', emoji: '☀️' },
  { key: 'snack', label: 'Goûter', emoji: '🍎' },
  { key: 'dinner', label: 'Dîner', emoji: '🌙' },
  { key: 'dessert', label: 'Dessert', emoji: '🍰' },
]

/** Repas « principaux » (utilisés pour la barre de progression de la semaine). */
export const MAIN_MEALS = MEALS.filter(
  (meal) => meal.key === 'lunch' || meal.key === 'dinner',
)

function createEmptyDay(): Record<MealKey, string> {
  return { breakfast: '', lunch: '', snack: '', dinner: '', dessert: '' }
}

export function createEmptyPlanner(): MealPlannerState {
  return {
    monday: createEmptyDay(),
    tuesday: createEmptyDay(),
    wednesday: createEmptyDay(),
    thursday: createEmptyDay(),
    friday: createEmptyDay(),
    saturday: createEmptyDay(),
    sunday: createEmptyDay(),
  }
}

export function getSavedPlanner(): MealPlannerState {
  if (typeof window === 'undefined') {
    return createEmptyPlanner()
  }

  try {
    const savedPlanner = window.localStorage.getItem(PLANNER_STORAGE_KEY)
    const emptyPlanner = createEmptyPlanner()

    if (!savedPlanner) {
      return emptyPlanner
    }

    // On fusionne chaque jour sur un jour vide : les anciens plannings
    // (déjeuner/dîner seulement) sont conservés, les nouveaux repas passent à ''.
    const parsed = JSON.parse(savedPlanner) as Record<
      string,
      Partial<Record<MealKey, string>> | undefined
    >

    const result = createEmptyPlanner()
    for (const day of DAYS) {
      result[day.key] = { ...emptyPlanner[day.key], ...(parsed[day.key] ?? {}) }
    }
    return result
  } catch {
    return createEmptyPlanner()
  }
}

export function saveRecipeToPlanner(
  day: DayKey,
  meal: MealKey,
  recipeId: Recipe['id'],
) {
  const currentPlanner = getSavedPlanner()

  const nextPlanner: MealPlannerState = {
    ...currentPlanner,
    [day]: {
      ...currentPlanner[day],
      [meal]: String(recipeId),
    },
  }

  persistPlanner(nextPlanner)
}

/** Tous les IDs de recettes planifiées (tous jours, tous repas). */
export function getAllPlannedRecipeIds(planner: MealPlannerState): string[] {
  const ids: string[] = []
  for (const day of DAYS) {
    for (const meal of MEALS) {
      const value = planner[day.key][meal.key]
      if (value) ids.push(value)
    }
  }
  return ids
}

export function isRecipeInPlanner(
  planner: MealPlannerState,
  recipeId: Recipe['id'],
): boolean {
  return getAllPlannedRecipeIds(planner).includes(String(recipeId))
}

export function getDayLabel(day: DayKey) {
  return DAYS.find((currentDay) => currentDay.key === day)?.label ?? day
}

export function getMealLabel(meal: MealKey) {
  return MEALS.find((currentMeal) => currentMeal.key === meal)?.label ?? meal
}
