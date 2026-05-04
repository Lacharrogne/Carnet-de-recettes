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

type RecipeVisualStyle = {
  cardBg: string
  imageBg: string
  ring: string
  badgeBg: string
  badgeText: string
  accentText: string
  arrowBg: string
  blob: string
  decorations: string[]
}

const DEFAULT_RECIPE_STYLE: RecipeVisualStyle = {
  cardBg: 'bg-[#fffaf3]',
  imageBg: 'bg-[#fff1e6]',
  ring: 'ring-orange-100',
  badgeBg: 'bg-white/95',
  badgeText: 'text-orange-700',
  accentText: 'text-orange-700',
  arrowBg: 'bg-orange-100 text-orange-700 group-hover:bg-orange-500 group-hover:text-white',
  blob: 'bg-orange-200/50',
  decorations: ['🍽️', '✨'],
}

const RECIPE_CATEGORY_STYLES: Record<string, RecipeVisualStyle> = {
  'Apéritifs & entrées': {
    cardBg: 'bg-gradient-to-br from-[#f7fff5] via-[#fffdf9] to-[#fff3eb]',
    imageBg: 'bg-[#edf8e9]',
    ring: 'ring-[#d9ecd3]',
    badgeBg: 'bg-[#f0faec]/95',
    badgeText: 'text-[#4d7b45]',
    accentText: 'text-[#4d8a45]',
    arrowBg: 'bg-[#e6f5e1] text-[#4d8a45] group-hover:bg-[#69a85f] group-hover:text-white',
    blob: 'bg-[#bde5b3]/50',
    decorations: ['🫒', '🍅'],
  },

  'Plats & accompagnements': {
    cardBg: 'bg-gradient-to-br from-[#fff6ec] via-[#fffdf9] to-[#fff1df]',
    imageBg: 'bg-[#fff0df]',
    ring: 'ring-[#ffd9b8]',
    badgeBg: 'bg-[#fff0df]/95',
    badgeText: 'text-[#a85c24]',
    accentText: 'text-[#d96d1e]',
    arrowBg: 'bg-[#ffe3c7] text-[#d96d1e] group-hover:bg-[#ff6b00] group-hover:text-white',
    blob: 'bg-[#ffc38c]/50',
    decorations: ['🍝', '🥘'],
  },

  'Desserts & goûters': {
    cardBg: 'bg-gradient-to-br from-[#fff4f7] via-[#fffdfc] to-[#fff2ed]',
    imageBg: 'bg-[#ffedf2]',
    ring: 'ring-[#ffd8e3]',
    badgeBg: 'bg-[#ffedf3]/95',
    badgeText: 'text-[#a8566b]',
    accentText: 'text-[#d86f8f]',
    arrowBg: 'bg-[#ffe0e9] text-[#d86f8f] group-hover:bg-[#ef7e9e] group-hover:text-white',
    blob: 'bg-[#ffbdd0]/50',
    decorations: ['🍓', '🧁'],
  },

  'Petit-déjeuner & brunch': {
    cardBg: 'bg-gradient-to-br from-[#fff9ec] via-[#fffdf8] to-[#fff2d5]',
    imageBg: 'bg-[#fff3cf]',
    ring: 'ring-[#f4dda4]',
    badgeBg: 'bg-[#fff0c8]/95',
    badgeText: 'text-[#876619]',
    accentText: 'text-[#c28a0c]',
    arrowBg: 'bg-[#ffe8a8] text-[#b77f08] group-hover:bg-[#d99a13] group-hover:text-white',
    blob: 'bg-[#ffe08c]/50',
    decorations: ['☕', '🥐'],
  },

  Boissons: {
    cardBg: 'bg-gradient-to-br from-[#eef8ff] via-[#fbfeff] to-[#edfdf7]',
    imageBg: 'bg-[#e8f5ff]',
    ring: 'ring-[#cde8f8]',
    badgeBg: 'bg-[#e8f5ff]/95',
    badgeText: 'text-[#3f6f8c]',
    accentText: 'text-[#3f8cbb]',
    arrowBg: 'bg-[#d9efff] text-[#3f8cbb] group-hover:bg-[#4b9ac9] group-hover:text-white',
    blob: 'bg-[#b8dcf7]/50',
    decorations: ['🍋', '🧊'],
  },

  Healthy: {
    cardBg: 'bg-gradient-to-br from-[#f1fbef] via-[#fffefb] to-[#eef9ec]',
    imageBg: 'bg-[#e7f6e3]',
    ring: 'ring-[#d6ecd1]',
    badgeBg: 'bg-[#eaf7e7]/95',
    badgeText: 'text-[#4d7548]',
    accentText: 'text-[#4d934d]',
    arrowBg: 'bg-[#ddf2d8] text-[#4d934d] group-hover:bg-[#63a85f] group-hover:text-white',
    blob: 'bg-[#bfe2b8]/50',
    decorations: ['🥑', '🌿'],
  },
}

function getRecipeVisualStyle(category: string) {
  return RECIPE_CATEGORY_STYLES[category] ?? DEFAULT_RECIPE_STYLE
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
  const visualStyle = getRecipeVisualStyle(recipe.category)

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
      className={`group relative overflow-hidden rounded-[2rem] ${visualStyle.cardBg} shadow-sm ring-1 ${visualStyle.ring} transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgba(28,25,23,0.1)]`}
    >
      <div
        className={`pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full blur-3xl ${visualStyle.blob}`}
      />

      <button
        type="button"
        onClick={handleFavoriteClick}
        disabled={loadingFavorite}
        className={`absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full text-xl shadow-sm transition ${
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

      <Link to={`/recipes/${recipe.id}`} className="relative z-10 block">
        <div className={`relative overflow-hidden ${visualStyle.imageBg}`}>
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="relative flex h-56 items-center justify-center overflow-hidden">
              <div
                className={`absolute h-32 w-32 rounded-full blur-2xl ${visualStyle.blob}`}
              />

              <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white/65 text-7xl shadow-sm ring-1 ring-white/80 backdrop-blur-sm transition duration-300 group-hover:scale-105">
                {recipe.image || '🍽️'}
              </div>

              <div className="absolute bottom-4 right-4 flex gap-2">
                {visualStyle.decorations.map((decoration) => (
                  <span
                    key={decoration}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-lg shadow-sm ring-1 ring-white/70 backdrop-blur"
                  >
                    {decoration}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/40 to-transparent px-4 pb-4 pt-12">
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full ${visualStyle.badgeBg} px-3 py-1 text-xs font-black ${visualStyle.badgeText} shadow-sm`}
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

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className={`mb-1 text-xs font-black uppercase tracking-wide ${visualStyle.accentText}`}
              >
                Recette maison
              </p>

              <h3 className="text-xl font-black leading-tight text-stone-950 transition group-hover:text-orange-700">
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

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[1.25rem] bg-white/80 px-4 py-3 shadow-sm ring-1 ring-white/80 backdrop-blur">
              <p className="text-xs font-medium text-stone-500">
                Temps total
              </p>

              <p className="mt-1 font-black text-stone-950">
                ⏱️ {totalTime} min
              </p>
            </div>

            <div className="rounded-[1.25rem] bg-white/80 px-4 py-3 shadow-sm ring-1 ring-white/80 backdrop-blur">
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
                  className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-white/80"
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

          <div className="mt-5 flex items-center justify-between border-t border-white/80 pt-4">
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