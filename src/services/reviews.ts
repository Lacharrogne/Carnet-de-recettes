import { supabase } from '../lib/supabase'

export type RecipeReviewReply = {
  id: number
  reviewId: number
  userId: string
  content: string
  createdAt: string
  updatedAt: string
}

export type RecipeReview = {
  id: number
  recipeId: number
  userId: string
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
  likesCount: number
  likedByMe: boolean
  replies: RecipeReviewReply[]
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

type RecipeReviewLikeRow = {
  review_id: number
  user_id: string
}

type RecipeReviewReplyRow = {
  id: number
  review_id: number
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

function mapRecipeReviewReply(row: RecipeReviewReplyRow): RecipeReviewReply {
  return {
    id: row.id,
    reviewId: row.review_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapRecipeReview(
  row: RecipeReviewRow,
  {
    likesCount = 0,
    likedByMe = false,
    replies = [],
  }: {
    likesCount?: number
    likedByMe?: boolean
    replies?: RecipeReviewReply[]
  } = {},
): RecipeReview {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    likesCount,
    likedByMe,
    replies,
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

async function getMaybeCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    return null
  }

  return user?.id ?? null
}

export async function getRecipeReviews(recipeId: number) {
  const currentUserId = await getMaybeCurrentUserId()

  const { data: reviewsData, error: reviewsError } = await supabase
    .from('recipe_reviews')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: false })

  if (reviewsError) {
    throw reviewsError
  }

  const reviewRows = (reviewsData ?? []) as RecipeReviewRow[]
  const reviewIds = reviewRows.map((review) => review.id)

  if (reviewIds.length === 0) {
    return []
  }

  const [{ data: likesData, error: likesError }, { data: repliesData, error: repliesError }] =
    await Promise.all([
      supabase
        .from('recipe_review_likes')
        .select('review_id, user_id')
        .in('review_id', reviewIds),

      supabase
        .from('recipe_review_replies')
        .select('*')
        .in('review_id', reviewIds)
        .order('created_at', { ascending: true }),
    ])

  if (likesError) {
    throw likesError
  }

  if (repliesError) {
    throw repliesError
  }

  const likesRows = (likesData ?? []) as RecipeReviewLikeRow[]
  const replyRows = (repliesData ?? []) as RecipeReviewReplyRow[]

  const likesByReview = new Map<number, RecipeReviewLikeRow[]>()
  const repliesByReview = new Map<number, RecipeReviewReply[]>()

  likesRows.forEach((like) => {
    const currentLikes = likesByReview.get(like.review_id) ?? []
    currentLikes.push(like)
    likesByReview.set(like.review_id, currentLikes)
  })

  replyRows.forEach((reply) => {
    const currentReplies = repliesByReview.get(reply.review_id) ?? []
    currentReplies.push(mapRecipeReviewReply(reply))
    repliesByReview.set(reply.review_id, currentReplies)
  })

  return reviewRows.map((review) => {
    const likes = likesByReview.get(review.id) ?? []
    const replies = repliesByReview.get(review.id) ?? []

    return mapRecipeReview(review, {
      likesCount: likes.length,
      likedByMe: currentUserId
        ? likes.some((like) => like.user_id === currentUserId)
        : false,
      replies,
    })
  })
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

export async function toggleReviewLike(reviewId: number, likedByMe: boolean) {
  const userId = await getCurrentUserId()

  if (likedByMe) {
    const { error } = await supabase
      .from('recipe_review_likes')
      .delete()
      .eq('review_id', reviewId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    return
  }

  const { error } = await supabase.from('recipe_review_likes').insert({
    review_id: reviewId,
    user_id: userId,
  })

  if (error) {
    throw error
  }
}

export async function addReviewReply({
  reviewId,
  content,
}: {
  reviewId: number
  content: string
}) {
  const userId = await getCurrentUserId()
  const cleanedContent = content.trim()

  if (!cleanedContent) {
    throw new Error('La réponse ne peut pas être vide.')
  }

  const { data, error } = await supabase
    .from('recipe_review_replies')
    .insert({
      review_id: reviewId,
      user_id: userId,
      content: cleanedContent,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return mapRecipeReviewReply(data as RecipeReviewReplyRow)
}

export async function updateReviewReply({
  replyId,
  content,
}: {
  replyId: number
  content: string
}) {
  const userId = await getCurrentUserId()
  const cleanedContent = content.trim()

  if (!cleanedContent) {
    throw new Error('La réponse ne peut pas être vide.')
  }

  const { data, error } = await supabase
    .from('recipe_review_replies')
    .update({
      content: cleanedContent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', replyId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return mapRecipeReviewReply(data as RecipeReviewReplyRow)
}

export async function deleteReviewReply(replyId: number) {
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('recipe_review_replies')
    .delete()
    .eq('id', replyId)
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