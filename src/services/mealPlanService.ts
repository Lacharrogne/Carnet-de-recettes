import { supabase } from '../lib/supabase'
import {
  DAYS,
  MEALS,
  createEmptyPlanner,
  type DayKey,
  type MealKey,
  type MealPlannerState,
} from '../lib/weeklyPlanner'

/**
 * Planning de repas rattaché au compte (table `meal_plan_entries`).
 *
 * Une ligne par créneau **rempli** : poser une recette = un upsert d'une ligne,
 * vider un créneau = supprimer cette ligne. On ne réécrit jamais tout le
 * planning, donc deux appareils qui modifient des repas différents ne
 * s'écrasent pas.
 */

type Row = { day_key: string; meal_key: string; recipe_id: number }

/** Lit le planning du compte. `null` = lecture impossible (à ne pas confondre
 *  avec « planning vide »). */
export async function fetchMealPlan(
  userId: string,
): Promise<MealPlannerState | null> {
  const { data, error } = await supabase
    .from('meal_plan_entries')
    .select('day_key, meal_key, recipe_id')
    .eq('user_id', userId)

  if (error) {
    console.error('fetchMealPlan', error)
    return null
  }

  const planner = createEmptyPlanner()
  const days = new Set<string>(DAYS.map((day) => day.key))
  const meals = new Set<string>(MEALS.map((meal) => meal.key))

  for (const row of (data ?? []) as Row[]) {
    // On ignore une éventuelle valeur inconnue plutôt que de casser l'écran.
    if (!days.has(row.day_key) || !meals.has(row.meal_key)) continue
    planner[row.day_key as DayKey][row.meal_key as MealKey] = String(row.recipe_id)
  }

  return planner
}

/** Pose (ou remplace) la recette d'un créneau. */
export async function upsertMealSlot(
  userId: string,
  day: DayKey,
  meal: MealKey,
  recipeId: string,
): Promise<boolean> {
  const numericId = Number(recipeId)
  if (!Number.isFinite(numericId)) return false

  const { error } = await supabase.from('meal_plan_entries').upsert(
    {
      user_id: userId,
      day_key: day,
      meal_key: meal,
      recipe_id: numericId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,day_key,meal_key' },
  )

  if (error) {
    console.error('upsertMealSlot', error)
    return false
  }
  return true
}

/** Vide un créneau (supprime sa ligne, sans toucher au reste). */
export async function clearMealSlot(
  userId: string,
  day: DayKey,
  meal: MealKey,
): Promise<boolean> {
  const { error } = await supabase
    .from('meal_plan_entries')
    .delete()
    .eq('user_id', userId)
    .eq('day_key', day)
    .eq('meal_key', meal)

  if (error) {
    console.error('clearMealSlot', error)
    return false
  }
  return true
}
