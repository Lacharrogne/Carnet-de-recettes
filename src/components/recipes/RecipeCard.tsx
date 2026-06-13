import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/useAuth'
import { getRecipeCardStyle } from '../../data/categoryStyles'
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
  const visualStyle = getRecipeCardStyle(recipe.category)

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
    <article
      className={`group relative h-full overflow-hidden rounded-[1.75rem] ${visualStyle.cardBg} shadow-sm ring-1 ${visualStyle.ring} transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(28,25,23,0.1)] sm:rounded-[2rem] sm:hover:-translate-y-1.5`}
    >
      <div
        className={`pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full blur-3xl sm:h-36 sm:w-36 ${visualStyle.blob}`}
      />

      <button
        type="button"
        onClick={handleFavoriteClick}
        disabled={loadingFavorite}
        className={`absolute right-3 top-3 z-20 flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-sm transition sm:right-4 sm:top-4 sm:h-11 sm:w-11 sm:text-xl ${
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

      <Link to={`/recipes/${recipe.id}`} className="relative z-10 block h-full">
        <div className={`relative overflow-hidden ${visualStyle.imageBg}`}>
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="h-44 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-56"
            />
          ) : (
            <div className="relative flex h-44 items-center justify-center overflow-hidden sm:h-56">
              <div
                className={`absolute h-28 w-28 rounded-full blur-2xl sm:h-32 sm:w-32 ${visualStyle.blob}`}
              />

              <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white/65 text-5xl shadow-sm ring-1 ring-white/80 backdrop-blur-sm transition duration-300 group-hover:scale-105 sm:h-28 sm:w-28 sm:rounded-[2rem] sm:text-7xl">
                {recipe.image || '🍽️'}
              </div>

              <div className="absolute bottom-3 right-3 flex gap-1.5 sm:bottom-4 sm:right-4 sm:gap-2">
                {visualStyle.decorations.map((decoration) => (
                  <span
                    key={decoration}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-base shadow-sm ring-1 ring-white/70 backdrop-blur sm:h-10 sm:w-10 sm:rounded-2xl sm:text-lg"
                  >
                    {decoration}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/45 to-transparent px-3 pb-3 pt-12 sm:px-4 sm:pb-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <span
                className={`max-w-[180px] truncate rounded-full ${visualStyle.badgeBg} px-3 py-1 text-xs font-black ${visualStyle.badgeText} shadow-sm sm:max-w-none`}
              >
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

        <div className="flex h-full flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={`mb-1 text-[0.7rem] font-black uppercase tracking-wide sm:text-xs ${visualStyle.accentText}`}
              >
                Recette maison
              </p>

              <h3 className="line-clamp-2 text-lg font-black leading-tight text-stone-950 transition group-hover:text-orange-700 sm:text-xl">
                {recipe.title}
              </h3>
            </div>

            {reviewsCount > 0 && (
              <div
                className={`shrink-0 rounded-full ${visualStyle.badgeBg} px-3 py-1 text-sm font-black ${visualStyle.badgeText}`}
              >
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

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="rounded-[1.15rem] bg-white/80 px-3 py-3 shadow-sm ring-1 ring-white/80 backdrop-blur sm:rounded-[1.25rem] sm:px-4">
              <p className="text-xs font-medium text-stone-500">
                Temps total
              </p>

              <p className="mt-1 text-sm font-black text-stone-950 sm:text-base">
                ⏱️ {totalTime} min
              </p>
            </div>

            <div className="rounded-[1.15rem] bg-white/80 px-3 py-3 shadow-sm ring-1 ring-white/80 backdrop-blur sm:rounded-[1.25rem] sm:px-4">
              <p className="text-xs font-medium text-stone-500">Portions</p>

              <p className="mt-1 text-sm font-black text-stone-950 sm:text-base">
                🍽️ {recipe.servings} pers.
              </p>
            </div>
          </div>

          {recipe.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="max-w-full truncate rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-white/80"
                >
                  #{tag}
                </span>
              ))}

              {hiddenTagsCount > 0 && (
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-white/80">
                  +{hiddenTagsCount}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-white/80 pt-4">
            <span className={`text-sm font-black ${visualStyle.accentText}`}>
              Voir la recette
            </span>

            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition group-hover:translate-x-1 ${visualStyle.arrowBg}`}
            >
              →
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}