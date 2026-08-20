import { supabase } from '../lib/supabase'

/**
 * Notes personnelles PRIVÉES sur une recette (« la prochaine fois, moins de
 * sel »). Une note par utilisateur et par recette. Visible du seul auteur de
 * la note (RLS propriétaire).
 *
 * Lecture tolérante : si la table n'existe pas encore (migration non lancée),
 * on renvoie une note vide plutôt que de casser la page.
 */
export async function getRecipeNote(recipeId: number): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return ''

  const { data, error } = await supabase
    .from('recipe_notes')
    .select('note')
    .eq('user_id', user.id)
    .eq('recipe_id', recipeId)
    .maybeSingle()

  if (error) {
    console.warn('Notes personnelles indisponibles :', error.message)
    return ''
  }

  return data?.note ?? ''
}

export async function saveRecipeNote(
  recipeId: number,
  note: string,
): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('Utilisateur non connecté')

  const trimmed = note.trim()

  // Note vidée → on supprime la ligne.
  if (!trimmed) {
    const { error } = await supabase
      .from('recipe_notes')
      .delete()
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)

    if (error) throw error
    return
  }

  const { error } = await supabase.from('recipe_notes').upsert(
    {
      user_id: user.id,
      recipe_id: recipeId,
      note: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,recipe_id' },
  )

  if (error) throw error
}
