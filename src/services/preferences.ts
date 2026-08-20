import { supabase } from '../lib/supabase'
import type { RecipeVisibility } from '../lib/recipeVisibility'

/**
 * Préférences suivant le compte (synchronisées entre appareils via Supabase) :
 * la visibilité des recettes et le curseur. Le stockage local reste la source
 * instantanée ; ce module ajoute la couche « compte ».
 *
 * Tolérant : si la table `user_preferences` n'existe pas encore (migration non
 * lancée) ou en cas d'erreur, on renvoie/ignore silencieusement et l'app
 * continue sur la préférence locale.
 */
export type AccountPreferences = {
  recipeVisibility: RecipeVisibility | null
  cursor: string | null
}

export async function getAccountPreferences(
  userId: string,
): Promise<AccountPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('recipe_visibility, cursor')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('Préférences compte indisponibles :', error.message)
    return null
  }

  if (!data) {
    return null
  }

  let recipeVisibility: RecipeVisibility | null = null
  if (data.recipe_visibility) {
    try {
      recipeVisibility = JSON.parse(data.recipe_visibility) as RecipeVisibility
    } catch {
      recipeVisibility = null
    }
  }

  return {
    recipeVisibility,
    cursor: data.cursor ?? null,
  }
}

export async function saveAccountPreference(
  userId: string,
  patch: { recipeVisibility?: RecipeVisibility; cursor?: string },
): Promise<void> {
  const row: Record<string, unknown> = { user_id: userId }

  if (patch.recipeVisibility !== undefined) {
    row.recipe_visibility = JSON.stringify(patch.recipeVisibility)
  }

  if (patch.cursor !== undefined) {
    row.cursor = patch.cursor
  }

  const { error } = await supabase
    .from('user_preferences')
    .upsert(row, { onConflict: 'user_id' })

  if (error) {
    console.warn(
      'Impossible d’enregistrer la préférence compte :',
      error.message,
    )
  }
}
