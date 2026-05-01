import { supabase } from '../lib/supabase'
import type { RecipeCategory, Difficulty, Recipe } from '../types/recipe'

type RecipeRow = {
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
}

function mapRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    category: row.category as RecipeCategory,
    difficulty: row.difficulty as Difficulty,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servings: row.servings,
    description: row.description,
    image: row.image,
    imageUrl: row.image_url,
    tags: row.tags ?? [],
    ingredients: row.ingredients ?? [],
    steps: row.steps ?? [],
  }
}

export async function getRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => mapRecipe(row as RecipeRow))
}

export async function getRecipeById(id: number): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .limit(1)

  if (error) throw error

  const row = data?.[0]
  return row ? mapRecipe(row as RecipeRow) : null
}

export async function uploadRecipeImage(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `public/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from('recipe-images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (error) throw error

  const { data } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(path)

  return data.publicUrl
}

function getStoragePathFromPublicUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url)
    const marker = '/storage/v1/object/public/recipe-images/'

    const index = parsedUrl.pathname.indexOf(marker)
    if (index === -1) return null

    const path = parsedUrl.pathname.slice(index + marker.length)
    return decodeURIComponent(path)
  } catch {
    return null
  }
}

export async function deleteRecipeImageByUrl(
  imageUrl: string | null
): Promise<void> {
  if (!imageUrl) return

  const path = getStoragePathFromPublicUrl(imageUrl)
  if (!path) return

  const { error } = await supabase.storage
    .from('recipe-images')
    .remove([path])

  if (error) throw error
}

export async function createRecipe(recipe: {
  title: string
  category: string
  difficulty: string
  prepTime: number
  cookTime: number
  servings: number
  description: string
  image: string
  imageUrl: string | null
  tags: string[]
  ingredients: string[]
  steps: string[]
}): Promise<Recipe> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('Utilisateur non connecté')

  const { data, error } = await supabase
    .from('recipes')
    .insert([
      {
        user_id: user.id,
        title: recipe.title,
        category: recipe.category,
        difficulty: recipe.difficulty,
        prep_time: recipe.prepTime,
        cook_time: recipe.cookTime,
        servings: recipe.servings,
        description: recipe.description,
        image: recipe.image,
        image_url: recipe.imageUrl,
        tags: recipe.tags,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
      },
    ])
    .select()
    .single()

  if (error) throw error

  return mapRecipe(data as RecipeRow)
}

export async function updateRecipe(
  id: number,
  recipe: {
    title: string
    category: string
    difficulty: string
    prepTime: number
    cookTime: number
    servings: number
    description: string
    image: string
    imageUrl: string | null
    tags: string[]
    ingredients: string[]
    steps: string[]
  }
): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .update({
      title: recipe.title,
      category: recipe.category,
      difficulty: recipe.difficulty,
      prep_time: recipe.prepTime,
      cook_time: recipe.cookTime,
      servings: recipe.servings,
      description: recipe.description,
      image: recipe.image,
      image_url: recipe.imageUrl,
      tags: recipe.tags,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return mapRecipe(data as RecipeRow)
}

export async function deleteRecipe(id: number): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getMyRecipes(): Promise<Recipe[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('Utilisateur non connecté')

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => mapRecipe(row as RecipeRow))
}