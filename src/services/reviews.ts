import { supabase } from '../lib/supabase'

export type RecipeReview = {
  id: number
  recipeId: number
  userId: string
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
}

type RecipeReviewRow = {
  id: number
  recipe_id: number
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

function mapRecipeReview(row: RecipeReviewRow): RecipeReview {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  if (!user) {
    throw new Error('Utilisateur non connecté.')
  }

  return user.id
}

export async function getRecipeReviews(recipeId: number) {
  const { data, error } = await supabase
    .from('recipe_reviews')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapRecipeReview(row as RecipeReviewRow))
}

export async function getMyReviewForRecipe(recipeId: number) {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('recipe_reviews')
    .select('*')
    .eq('recipe_id', recipeId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return mapRecipeReview(data as RecipeReviewRow)
}

export async function saveRecipeReview({
  recipeId,
  rating,
  comment,
}: {
  recipeId: number
  rating: number
  comment: string
}) {
  const userId = await getCurrentUserId()

  const cleanedComment = comment.trim()

  const { data, error } = await supabase
    .from('recipe_reviews')
    .upsert(
      {
        recipe_id: recipeId,
        user_id: userId,
        rating,
        comment: cleanedComment,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'recipe_id,user_id',
      },
    )
    .select()
    .single()

  if (error) {
    throw error
  }

  return mapRecipeReview(data as RecipeReviewRow)
}

export async function deleteRecipeReview(reviewId: number) {
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('recipe_reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

export function getAverageRating(reviews: RecipeReview[]) {
  if (reviews.length === 0) {
    return 0
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0)

  return Math.round((total / reviews.length) * 10) / 10
}