import { supabase } from '../lib/supabase'

export type AdminStats = {
  profilesCount: number
  recipesCount: number
  reviewsCount: number
}

export type AdminProfilePreview = {
  userId: string
  username: string
  avatarUrl: string
  createdAt: string | null
}

export type AdminRecipePreview = {
  id: number
  title: string
  category: string
  userId: string | null
  createdAt: string | null
}

export type AdminReviewPreview = {
  id: number
  recipeId: number
  userId: string
  rating: number
  comment: string
  createdAt: string | null
}

type ProfileRow = {
  user_id: string
  username: string | null
  avatar_url: string | null
  created_at?: string | null
}

type RecipeRow = {
  id: number
  title: string
  category: string
  user_id: string | null
  created_at?: string | null
}

type ReviewRow = {
  id: number
  recipe_id: number
  user_id: string
  rating: number
  comment: string | null
  created_at: string | null
}

function mapProfile(row: ProfileRow): AdminProfilePreview {
  return {
    userId: row.user_id,
    username: row.username || 'Utilisateur',
    avatarUrl: row.avatar_url ?? '',
    createdAt: row.created_at ?? null,
  }
}

function mapRecipe(row: RecipeRow): AdminRecipePreview {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    userId: row.user_id,
    createdAt: row.created_at ?? null,
  }
}

function mapReview(row: ReviewRow): AdminReviewPreview {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment ?? '',
    createdAt: row.created_at,
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  const [profilesResponse, recipesResponse, reviewsResponse] =
    await Promise.all([
      supabase.from('profiles').select('user_id', {
        count: 'exact',
        head: true,
      }),

      supabase.from('recipes').select('id', {
        count: 'exact',
        head: true,
      }),

      supabase.from('recipe_reviews').select('id', {
        count: 'exact',
        head: true,
      }),
    ])

  if (profilesResponse.error) throw profilesResponse.error
  if (recipesResponse.error) throw recipesResponse.error
  if (reviewsResponse.error) throw reviewsResponse.error

  return {
    profilesCount: profilesResponse.count ?? 0,
    recipesCount: recipesResponse.count ?? 0,
    reviewsCount: reviewsResponse.count ?? 0,
  }
}

export async function getRecentAdminProfiles(): Promise<
  AdminProfilePreview[]
> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, avatar_url, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error

  return (data ?? []).map((row) => mapProfile(row as ProfileRow))
}

export async function getRecentAdminRecipes(): Promise<AdminRecipePreview[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, title, category, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error

  return (data ?? []).map((row) => mapRecipe(row as RecipeRow))
}

export async function getRecentAdminReviews(): Promise<AdminReviewPreview[]> {
  const { data, error } = await supabase
    .from('recipe_reviews')
    .select('id, recipe_id, user_id, rating, comment, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error

  return (data ?? []).map((row) => mapReview(row as ReviewRow))
}

export async function deleteAdminReview(reviewId: number) {
  const { error } = await supabase
    .from('recipe_reviews')
    .delete()
    .eq('id', reviewId)

  if (error) throw error
}

export async function deleteAdminRecipe(recipeId: number) {
  const { error: reviewsError } = await supabase
    .from('recipe_reviews')
    .delete()
    .eq('recipe_id', recipeId)

  if (reviewsError) throw reviewsError

  const { error: shoppingListError } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('recipe_id', recipeId)

  if (shoppingListError) throw shoppingListError

  const { error } = await supabase.from('recipes').delete().eq('id', recipeId)

  if (error) throw error
}

export async function deleteAdminProfile(userId: string) {
  const { error: reviewsError } = await supabase
    .from('recipe_reviews')
    .delete()
    .eq('user_id', userId)

  if (reviewsError) throw reviewsError

  const { error: shoppingListError } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('user_id', userId)

  if (shoppingListError) throw shoppingListError

  const { error: recipesError } = await supabase
    .from('recipes')
    .delete()
    .eq('user_id', userId)

  if (recipesError) throw recipesError

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('user_id', userId)

  if (error) throw error
}