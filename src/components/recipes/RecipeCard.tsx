import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/useAuth'
import { useFavorites } from '../../context/useFavorites'
import { useToast } from '../../context/useToast'
import { getRecipeCardStyle } from '../../data/categoryStyles'
import {
  getAverageRating,
  getRecipeReviews,
  type RecipeRating,
} from '../../services/reviews'
import type { Recipe } from '../../types/recipe'

type RecipeCardProps = {
  recipe: Recipe
  // Note agrégée fournie par la page (évite une requête par carte).
  rating?: RecipeRating
  onFavoriteChange?: () => void
}

export default function RecipeCard({
  recipe,
  rating,
  onFavoriteChange,
}: RecipeCardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { showToast } = useToast()

  const [loadingFavorite, setLoadingFavorite] = useState(false)
  const [fetchedRating, setFetchedRating] = useState<RecipeRating | null>(null)

  const totalTime = recipe.prepTime + recipe.cookTime
  const visibleTags = recipe.tags.slice(0, 3)
  const hiddenTagsCount = recipe.tags.length - visibleTags.length

  const displayedFavorite = user ? isFavorite(recipe.id) : false
  const visualStyle = getRecipeCardStyle(recipe.category)

  const effectiveRating = rating ?? fetchedRating
  const averageRating = effectiveRating?.average ?? 0
  const reviewsCount = effectiveRating?.count ?? 0

  // Repli : si la page ne fournit pas la note, on la charge pour cette carte.
  useEffect(() => {
    let ignore = false

    if (rating) return

    getRecipeReviews(recipe.id)
      .then((reviews) => {
        if (!ignore) {
          setFetchedRating({
            average: getAverageRating(reviews),
            count: reviews.length,
          })
        }
      })
      .catch((error) => {
        console.error(error)
      })

    return () => {
      ignore = true
    }
  }, [recipe.id, rating])

  async function handleFavoriteClick() {
    if (!user) {
      navigate('/auth')
      return
    }

    try {
      setLoadingFavorite(true)

      const newValue = await toggleFavorite(recipe.id)

      onFavoriteChange?.()
      showToast({
        message: newValue
          ? 'Recette ajoutée à tes favoris ❤️'
          : 'Recette retirée de tes favoris',
        tone: 'success',
      })
    } catch (error) {
      console.error(error)
      showToast({ message: 'Impossible de modifier le favori.', tone: 'error' })
    } finally {
      setLoadingFavorite(false)
    }
  }

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-card ${visualStyle.cardBg} shadow-card ring-1 ${visualStyle.ring} transition duration-300 hover:-translate-y-1 hover:shadow-lift`}
    >
      <button
        type="button"
        onClick={handleFavoriteClick}
        disabled={loadingFavorite}
        className={`absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full text-xl shadow-soft backdrop-blur transition sm:right-4 sm:top-4 ${
          displayedFavorite
            ? 'bg-[#d8617a] text-white hover:bg-[#c4506a]'
            : 'bg-card/90 text-hazel hover:bg-card hover:text-[#d8617a]'
        } disabled:cursor-not-allowed disabled:opacity-60`}
        aria-label={
          displayedFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'
        }
      >
        {displayedFavorite ? '♥' : '♡'}
      </button>

      <Link
        to={`/recipes/${recipe.id}`}
        className="relative z-10 flex h-full flex-col"
      >
        <div
          className={`relative aspect-[4/3] overflow-hidden ${visualStyle.imageBg}`}
        >
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="relative flex h-full items-center justify-center overflow-hidden">
              <div
                className={`absolute h-28 w-28 rounded-full blur-2xl sm:h-32 sm:w-32 ${visualStyle.blob}`}
              />

              <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-card/70 text-5xl shadow-soft ring-1 ring-white/70 backdrop-blur-sm transition duration-300 group-hover:scale-105 sm:h-28 sm:w-28 sm:rounded-[2rem] sm:text-7xl">
                {recipe.image || '🍽️'}
              </div>

              <div className="absolute bottom-3 right-3 flex gap-1.5 sm:bottom-4 sm:right-4 sm:gap-2">
                {visualStyle.decorations.map((decoration) => (
                  <span
                    key={decoration}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-card/70 text-base shadow-soft ring-1 ring-white/60 backdrop-blur sm:h-10 sm:w-10 sm:rounded-2xl sm:text-lg"
                  >
                    {decoration}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1.5 bg-gradient-to-t from-espresso/55 to-transparent px-3 pb-3 pt-12 sm:gap-2 sm:px-4 sm:pb-4">
            <span
              className={`max-w-[180px] truncate rounded-full ${visualStyle.badgeBg} px-3 py-1 text-xs font-bold ${visualStyle.badgeText} shadow-soft sm:max-w-none`}
            >
              {recipe.category}
            </span>

            <span className="rounded-full bg-card/95 px-3 py-1 text-xs font-bold text-cacao shadow-soft">
              {recipe.difficulty}
            </span>

            {reviewsCount > 0 && (
              <span className="rounded-full bg-card/95 px-3 py-1 text-xs font-bold text-honey shadow-soft">
                ★ {averageRating}/5
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <p
            className={`mb-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] sm:text-xs ${visualStyle.accentText}`}
          >
            Recette maison
          </p>

          <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug text-espresso transition group-hover:text-terracotta sm:text-xl">
            {recipe.title}
          </h3>

          <p className="mt-2 text-sm font-medium text-hazel">
            {reviewsCount > 0
              ? `★ ${averageRating} · ${reviewsCount} avis`
              : 'Aucun avis pour le moment'}
          </p>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-cacao/80">
            {recipe.description || 'Une recette à retrouver dans le carnet.'}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="rounded-[1.15rem] bg-card/70 px-3 py-3 ring-1 ring-bark/50 backdrop-blur sm:rounded-[1.25rem] sm:px-4">
              <p className="text-xs font-medium text-hazel">Temps total</p>

              <p className="mt-1 text-sm font-bold text-espresso sm:text-base">
                ⏱️ {totalTime} min
              </p>
            </div>

            <div className="rounded-[1.15rem] bg-card/70 px-3 py-3 ring-1 ring-bark/50 backdrop-blur sm:rounded-[1.25rem] sm:px-4">
              <p className="text-xs font-medium text-hazel">Portions</p>

              <p className="mt-1 text-sm font-bold text-espresso sm:text-base">
                🍽️ {recipe.servings} pers.
              </p>
            </div>
          </div>

          {recipe.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="max-w-full truncate rounded-full bg-card/70 px-3 py-1 text-xs font-semibold text-cacao ring-1 ring-bark/50"
                >
                  #{tag}
                </span>
              ))}

              {hiddenTagsCount > 0 && (
                <span className="rounded-full bg-card/70 px-3 py-1 text-xs font-semibold text-cacao ring-1 ring-bark/50">
                  +{hiddenTagsCount}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-bark/60 pt-4">
            <span className={`text-sm font-bold ${visualStyle.accentText}`}>
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