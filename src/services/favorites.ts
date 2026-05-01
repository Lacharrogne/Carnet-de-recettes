import { supabase } from '../lib/supabase'
import type { Recipe } from '../types/recipe'

type FavoriteRecipeRow = {
  recipes: {
    id: number
    user_id: string | null
    title: string
    category: string
    difficulty: string
    prep_time: number
    cook_time: number
    servings: number
    description: string
    image: string
    image_url: string | null
    tags: string[] | null
    ingredients: string[] | null
    steps: string[] | null
  } | null
}

function mapFavoriteRecipe(row: FavoriteRecipeRow): Recipe | null {
  if (!row.recipes) return null

  return {
    id: row.recipes.id,
    userId: row.recipes.user_id,
    title: row.recipes.title,
    category: row.recipes.category as Recipe['category'],
    difficulty: row.recipes.difficulty as Recipe['difficulty'],
    prepTime: row.recipes.prep_time,
    cookTime: row.recipes.cook_time,
    servings: row.recipes.servings,
    description: row.recipes.description,
    image: row.recipes.image,
    imageUrl: row.recipes.image_url,
    tags: row.recipes.tags ?? [],
    ingredients: row.recipes.ingredients ?? [],
    steps: row.recipes.steps ?? [],
  }
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  if (!user) throw new Error('Utilisateur non connecté')

  return user.id
}

export async function getFavoriteRecipeIds(): Promise<number[]> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('favorites')
    .select('recipe_id')
    .eq('user_id', userId)

  if (error) throw error

  return (data ?? []).map((favorite) => favorite.recipe_id)
}

export async function getFavoriteRecipes(): Promise<Recipe[]> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('favorites')
    .select(
      `
      recipes (
        id,
        user_id,
        title,
        category,
        difficulty,
        prep_time,
        cook_time,
        servings,
        description,
        image,
        image_url,
        tags,
        ingredients,
        steps
      )
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const favoriteRows = (data ?? []) as unknown as FavoriteRecipeRow[]

  return favoriteRows
    .map(mapFavoriteRecipe)
    .filter((recipe): recipe is Recipe => recipe !== null)
}

export async function isRecipeFavorite(recipeId: number): Promise<boolean> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('favorites')
    .select('recipe_id')
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)
    .maybeSingle()

  if (error) throw error

  return data !== null
}

export async function addFavorite(recipeId: number): Promise<void> {
  const userId = await getCurrentUserId()

  const { error } = await supabase.from('favorites').insert({
    user_id: userId,
    recipe_id: recipeId,
  })

  if (error) throw error
}

export async function removeFavorite(recipeId: number): Promise<void> {
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)

  if (error) throw error
}

export async function toggleFavorite(recipeId: number): Promise<boolean> {
  const alreadyFavorite = await isRecipeFavorite(recipeId)

  if (alreadyFavorite) {
    await removeFavorite(recipeId)
    return false
  }

  await addFavorite(recipeId)
  return true
}