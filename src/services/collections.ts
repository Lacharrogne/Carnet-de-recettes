import { supabase } from '../lib/supabase'
import {
  mapRecipe,
  RECIPE_LIST_COLUMNS,
  type RecipeRow,
} from './recipes'
import type { Recipe } from '../types/recipe'

/**
 * Collections (dossiers) de recettes, propres à chaque personne. Une recette
 * (la sienne ou une autre) peut être rangée dans plusieurs collections.
 * Tables : `recipe_collections` et `recipe_collection_items` (RLS
 * propriétaire). Voir la migration 0016.
 */
export type RecipeCollection = {
  id: string
  name: string
  emoji: string
  recipeCount: number
}

type CollectionRow = {
  id: string
  name: string
  emoji: string | null
  recipe_collection_items?: { count: number }[] | null
}

function mapCollection(row: CollectionRow): RecipeCollection {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji || '📁',
    recipeCount: row.recipe_collection_items?.[0]?.count ?? 0,
  }
}

async function currentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  if (!user) throw new Error('Utilisateur non connecté')

  return user.id
}

export async function getCollections(): Promise<RecipeCollection[]> {
  const userId = await currentUserId()

  const { data, error } = await supabase
    .from('recipe_collections')
    .select('id, name, emoji, recipe_collection_items(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => mapCollection(row as CollectionRow))
}

export async function createCollection(
  name: string,
  emoji = '📁',
): Promise<RecipeCollection> {
  const userId = await currentUserId()

  const { data, error } = await supabase
    .from('recipe_collections')
    .insert({ user_id: userId, name: name.trim(), emoji })
    .select('id, name, emoji')
    .single()

  if (error) throw error

  return mapCollection(data as CollectionRow)
}

export async function renameCollection(
  id: string,
  name: string,
  emoji: string,
): Promise<void> {
  const { error } = await supabase
    .from('recipe_collections')
    .update({ name: name.trim(), emoji })
    .eq('id', id)

  if (error) throw error
}

export async function deleteCollection(id: string): Promise<void> {
  const { error } = await supabase
    .from('recipe_collections')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getCollection(
  id: string,
): Promise<RecipeCollection | null> {
  const { data, error } = await supabase
    .from('recipe_collections')
    .select('id, name, emoji, recipe_collection_items(count)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error

  return data ? mapCollection(data as CollectionRow) : null
}

export async function getCollectionRecipes(
  collectionId: string,
): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipe_collection_items')
    .select(`recipe:recipes(${RECIPE_LIST_COLUMNS})`)
    .eq('collection_id', collectionId)
    .order('added_at', { ascending: false })

  if (error) throw error

  return (data ?? [])
    .map((row) => {
      // Supabase type la relation comme un tableau ; à l'exécution c'est un
      // objet unique (FK vers une seule recette). On gère les deux cas.
      const rel = (row as unknown as {
        recipe: RecipeRow | RecipeRow[] | null
      }).recipe
      return Array.isArray(rel) ? rel[0] ?? null : rel
    })
    .filter((recipe): recipe is RecipeRow => Boolean(recipe))
    .map((recipe) => mapRecipe(recipe))
}

/** Ids des collections qui contiennent déjà cette recette. */
export async function getCollectionIdsForRecipe(
  recipeId: number,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('recipe_collection_items')
    .select('collection_id')
    .eq('recipe_id', recipeId)

  if (error) throw error

  return (data ?? []).map((row) => (row as { collection_id: string }).collection_id)
}

export async function addRecipeToCollection(
  collectionId: string,
  recipeId: number,
): Promise<void> {
  const { error } = await supabase
    .from('recipe_collection_items')
    .upsert(
      { collection_id: collectionId, recipe_id: recipeId },
      { onConflict: 'collection_id,recipe_id' },
    )

  if (error) throw error
}

export async function removeRecipeFromCollection(
  collectionId: string,
  recipeId: number,
): Promise<void> {
  const { error } = await supabase
    .from('recipe_collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('recipe_id', recipeId)

  if (error) throw error
}
