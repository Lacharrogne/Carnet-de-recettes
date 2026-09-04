import { supabase } from '../lib/supabase'
import type { CookingHistory } from '../lib/cookingHistory'

/**
 * Historique « déjà cuisiné » rattaché au compte (table `cooking_history`).
 * Une ligne par recette cuisinée ; revenir à zéro supprime la ligne.
 */

type Row = { recipe_id: number; cooked_count: number; last_cooked_at: string }

/** Lit l'historique du compte. `null` = lecture impossible. */
export async function fetchCookingHistory(
  userId: string,
): Promise<CookingHistory | null> {
  const { data, error } = await supabase
    .from('cooking_history')
    .select('recipe_id, cooked_count, last_cooked_at')
    .eq('user_id', userId)

  if (error) {
    console.error('fetchCookingHistory', error)
    return null
  }

  const history: CookingHistory = {}
  for (const row of (data ?? []) as Row[]) {
    history[String(row.recipe_id)] = {
      count: row.cooked_count,
      lastCookedAt: row.last_cooked_at,
    }
  }
  return history
}

/** Enregistre le compteur d'une recette. */
export async function upsertCookingEntry(
  userId: string,
  recipeId: string,
  count: number,
  lastCookedAt: string,
): Promise<boolean> {
  const numericId = Number(recipeId)
  if (!Number.isFinite(numericId)) return false

  const { error } = await supabase.from('cooking_history').upsert(
    {
      user_id: userId,
      recipe_id: numericId,
      cooked_count: count,
      last_cooked_at: lastCookedAt,
    },
    { onConflict: 'user_id,recipe_id' },
  )

  if (error) {
    console.error('upsertCookingEntry', error)
    return false
  }
  return true
}

/** Retire une recette de l'historique (compteur revenu à zéro). */
export async function deleteCookingEntry(
  userId: string,
  recipeId: string,
): Promise<boolean> {
  const numericId = Number(recipeId)
  if (!Number.isFinite(numericId)) return false

  const { error } = await supabase
    .from('cooking_history')
    .delete()
    .eq('user_id', userId)
    .eq('recipe_id', numericId)

  if (error) {
    console.error('deleteCookingEntry', error)
    return false
  }
  return true
}
