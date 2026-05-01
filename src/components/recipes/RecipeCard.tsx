import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { isRecipeFavorite, toggleFavorite } from '../../services/favorites'
import { getAverageRating, getRecipeReviews } from '../../services/reviews'
import type { Recipe } from '../../types/recipe'

type RecipeCardProps = {
  recipe: Recipe
  onFavoriteChange?: () => void
}

export default function RecipeCard({
  recipe,
  onFavoriteChange,
}: RecipeCardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [favorite, setFavorite] = useState(false)
  const [loadingFavorite, setLoadingFavorite] = useState(false)

  const [averageRating, setAverageRating] = useState(0)
  const [reviewsCount, setReviewsCount] = useState(0)

  const totalTime = recipe.prepTime + recipe.cookTime
  const visibleTags = recipe.tags.slice(0, 3)
  const hiddenTagsCount = recipe.tags.length - visibleTags.length

  const displayedFavorite = user ? favorite : false

  useEffect(() => {
    let ignore = false

    if (!user) return

    isRecipeFavorite(recipe.id)
      .then((result) => {
        if (!ignore) {
          setFavorite(result)
        }
      })
      .catch((error) => {
        console.error(error)
      })

    return () => {
      ignore = true
    }
  }, [recipe.id, user])

  useEffect(() => {
    let ignore = false

    getRecipeReviews(recipe.id)
      .then((reviews) => {
        if (!ignore) {
          setReviewsCount(reviews.length)
          setAverageRating(getAverageRating(reviews))
        }
      })
      .catch((error) => {
        console.error(error)

        if (!ignore) {
          setReviewsCount(0)
          setAverageRating(0)
        }
      })

    return () => {
      ignore = true
    }
  }, [recipe.id])

  async function handleFavoriteClick() {
    if (!user) {
      navigate('/auth')
      return
    }

    try {
      setLoadingFavorite(true)

      const newValue = await toggleFavorite(recipe.id)

      setFavorite(newValue)
      onFavoriteChange?.()
    } catch (error) {
      console.error(error)
      alert('Impossible de modifier le favori.')
    } finally {
      setLoadingFavorite(false)
    }
  }

  return (
    <article className="group relative overflow-hidden rounded-[2rem] bg-[#fffaf3] shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-md">
      <button
        type="button"
        onClick={handleFavoriteClick}
        disabled={loadingFavorite}
        className={`absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full text-xl shadow-sm transition ${
          displayedFavorite
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-white/95 text-stone-500 hover:bg-white hover:text-red-500'
        } disabled:cursor-not-allowed disabled:opacity-60`}
        aria-label={
          displayedFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'
        }
      >
        {displayedFavorite ? '♥' : '♡'}
      </button>

      <Link to={`/recipes/${recipe.id}`} className="block">
        <div className="relative overflow-hidden bg-[#fff1e6]">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-56 items-center justify-center text-7xl">
              {recipe.image || '🍽️'}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/35 to-transparent px-4 pb-4 pt-12">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-black text-orange-700 shadow-sm">
                {recipe.category}
              </span>

              <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-stone-700 shadow-sm">
                {recipe.difficulty}
              </span>

              {reviewsCount > 0 && (
                <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-black text-amber-600 shadow-sm">
                  ★ {averageRating}/5
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-orange-600">
                Recette maison
              </p>

              <h3 className="text-xl font-black leading-tight text-stone-950 transition group-hover:text-orange-700">
                {recipe.title}
              </h3>
            </div>

            {reviewsCount > 0 && (
              <div className="shrink-0 rounded-full bg-[#f4e8dc] px-3 py-1 text-sm font-black text-orange-700">
                ★ {averageRating}
              </div>
            )}
          </div>

          {reviewsCount > 0 ? (
            <p className="mt-2 text-sm font-medium text-stone-500">
              {reviewsCount} avis
            </p>
          ) : (
            <p className="mt-2 text-sm font-medium text-stone-400">
              Aucun avis pour le moment
            </p>
          )}

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">
            {recipe.description || 'Une recette à retrouver dans le carnet.'}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[1.25rem] bg-white px-4 py-3 shadow-sm ring-1 ring-orange-100">
              <p className="text-xs font-medium text-stone-500">
                Temps total
              </p>
              <p className="mt-1 font-black text-stone-950">
                ⏱️ {totalTime} min
              </p>
            </div>

            <div className="rounded-[1.25rem] bg-white px-4 py-3 shadow-sm ring-1 ring-orange-100">
              <p className="text-xs font-medium text-stone-500">Portions</p>
              <p className="mt-1 font-black text-stone-950">
                🍽️ {recipe.servings} pers.
              </p>
            </div>
          </div>

          {recipe.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#f4e8dc] px-3 py-1 text-xs font-semibold text-stone-600"
                >
                  #{tag}
                </span>
              ))}

              {hiddenTagsCount > 0 && (
                <span className="rounded-full bg-[#f4e8dc] px-3 py-1 text-xs font-semibold text-stone-600">
                  +{hiddenTagsCount}
                </span>
              )}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-orange-100 pt-4">
            <span className="text-sm font-black text-orange-700">
              Voir la recette
            </span>

            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-lg text-orange-700 transition group-hover:translate-x-1 group-hover:bg-orange-500 group-hover:text-white">
              →
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}