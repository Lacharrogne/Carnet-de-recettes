import type { Recipe } from '../types/recipe'

// Planning de repas de la semaine, persisté en localStorage.
// Source de vérité partagée (détail recette, planning, accueil).

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type MealKey = 'lunch' | 'dinner'
export type ExtraMealKey = 'breakfast' | 'snack' | 'dessert'

type DayPlannerState = Record<DayKey, Record<MealKey, string>>
type WeeklyExtrasState = Record<ExtraMealKey, string[]>

export type MealPlannerState = DayPlannerState & {
  weeklyExtras: WeeklyExtrasState
}

export const PLANNER_STORAGE_KEY = 'carnet-recettes-weekly-planner'

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
  { key: 'lunch', label: 'Déjeuner', emoji: '☀️' },
  { key: 'dinner', label: 'Dîner', emoji: '🌙' },
]

export function createEmptyPlanner(): MealPlannerState {
  return {
    monday: { lunch: '', dinner: '' },
    tuesday: { lunch: '', dinner: '' },
    wednesday: { lunch: '', dinner: '' },
    thursday: { lunch: '', dinner: '' },
    friday: { lunch: '', dinner: '' },
    saturday: { lunch: '', dinner: '' },
    sunday: { lunch: '', dinner: '' },
    weeklyExtras: {
      breakfast: [],
      snack: [],
      dessert: [],
    },
  }
}

function cleanRecipeIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => String(item))
    .filter((item) => item.trim().length > 0)
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

    const parsedPlanner = JSON.parse(savedPlanner) as Partial<MealPlannerState>

    return {
      monday: { ...emptyPlanner.monday, ...parsedPlanner.monday },
      tuesday: { ...emptyPlanner.tuesday, ...parsedPlanner.tuesday },
      wednesday: { ...emptyPlanner.wednesday, ...parsedPlanner.wednesday },
      thursday: { ...emptyPlanner.thursday, ...parsedPlanner.thursday },
      friday: { ...emptyPlanner.friday, ...parsedPlanner.friday },
      saturday: { ...emptyPlanner.saturday, ...parsedPlanner.saturday },
      sunday: { ...emptyPlanner.sunday, ...parsedPlanner.sunday },
      weeklyExtras: {
        breakfast: cleanRecipeIds(parsedPlanner.weeklyExtras?.breakfast),
        snack: cleanRecipeIds(parsedPlanner.weeklyExtras?.snack),
        dessert: cleanRecipeIds(parsedPlanner.weeklyExtras?.dessert),
      },
    }
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

  window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(nextPlanner))
}

export function getDayLabel(day: DayKey) {
  return DAYS.find((currentDay) => currentDay.key === day)?.label ?? day
}

export function getMealLabel(meal: MealKey) {
  return MEALS.find((currentMeal) => currentMeal.key === meal)?.label ?? meal
}
