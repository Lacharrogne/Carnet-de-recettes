import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { getProfile, type UserProfile } from '../../services/profiles'
import {
  deleteRecipeReview,
  getAverageRating,
  getMyReviewForRecipe,
  getRecipeReviews,
  saveRecipeReview,
  type RecipeReview,
} from '../../services/reviews'

type RecipeReviewsProps = {
  recipeId: number
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1
    return starValue <= rating ? '★' : '☆'
  }).join('')
}

export default function RecipeReviews({ recipeId }: RecipeReviewsProps) {
  const { user } = useAuth()
  const userId = user?.id

  const [reviews, setReviews] = useState<RecipeReview[]>([])
  const [myReview, setMyReview] = useState<RecipeReview | null>(null)
  const [reviewProfiles, setReviewProfiles] = useState<
    Record<string, UserProfile | null>
  >({})

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const averageRating = useMemo(() => {
    return getAverageRating(reviews)
  }, [reviews])

  useEffect(() => {
    let ignore = false

    async function loadReviews() {
      try {
        setLoading(true)
        setErrorMessage('')

        const loadedReviews = await getRecipeReviews(recipeId)

        const uniqueUserIds = Array.from(
          new Set(loadedReviews.map((review) => review.userId)),
        )

        const profilesByUserId: Record<string, UserProfile | null> = {}

        await Promise.all(
          uniqueUserIds.map(async (reviewUserId) => {
            try {
              profilesByUserId[reviewUserId] = await getProfile(reviewUserId)
            } catch (error) {
              console.error(error)
              profilesByUserId[reviewUserId] = null
            }
          }),
        )

        let loadedMyReview: RecipeReview | null = null

        if (userId) {
          loadedMyReview = await getMyReviewForRecipe(recipeId)

          if (loadedMyReview) {
            setRating(loadedMyReview.rating)
            setComment(loadedMyReview.comment)
          }
        }

        if (!ignore) {
          setReviews(loadedReviews)
          setMyReview(loadedMyReview)
          setReviewProfiles(profilesByUserId)
        }
      } catch (error) {
        if (!ignore) {
          console.error(error)
          setErrorMessage('Impossible de charger les avis.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadReviews()

    return () => {
      ignore = true
    }
  }, [recipeId, userId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!userId) return

    try {
      setSaving(true)
      setErrorMessage('')
      setSuccessMessage('')

      const savedReview = await saveRecipeReview({
        recipeId,
        rating,
        comment,
      })

      const currentUserProfile = await getProfile(userId).catch((error) => {
        console.error(error)
        return null
      })

      setReviewProfiles((currentProfiles) => ({
        ...currentProfiles,
        [userId]: currentUserProfile,
      }))

      setMyReview(savedReview)

      setReviews((currentReviews) => {
        const reviewAlreadyExists = currentReviews.some(
          (review) => review.id === savedReview.id,
        )

        if (reviewAlreadyExists) {
          return currentReviews.map((review) =>
            review.id === savedReview.id ? savedReview : review,
          )
        }

        return [savedReview, ...currentReviews]
      })

      setSuccessMessage(
        myReview ? 'Ton avis a été modifié.' : 'Ton avis a été ajouté.',
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible d’enregistrer ton avis.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteReview() {
    if (!myReview) return

    const confirmDelete = window.confirm(
      'Voulez-vous vraiment supprimer votre avis ?',
    )

    if (!confirmDelete) return

    try {
      setDeleting(true)
      setErrorMessage('')
      setSuccessMessage('')

      await deleteRecipeReview(myReview.id)

      setReviews((currentReviews) =>
        currentReviews.filter((review) => review.id !== myReview.id),
      )

      setMyReview(null)
      setRating(5)
      setComment('')
      setSuccessMessage('Ton avis a été supprimé.')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer ton avis.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 print:hidden">
        <p className="font-medium text-stone-600">Chargement des avis...</p>
      </section>
    )
  }

  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 print:hidden">
      <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-bold text-orange-600">Avis de la famille</p>

          <h2 className="text-2xl font-black text-stone-950">
            Notes et commentaires
          </h2>

          <p className="mt-2 text-stone-600">
            {reviews.length === 0
              ? 'Aucun avis pour le moment.'
              : `${reviews.length} avis · moyenne ${averageRating}/5`}
          </p>
        </div>

        {reviews.length > 0 && (
          <div className="rounded-[1.5rem] bg-[#fff5ec] px-5 py-4 text-right ring-1 ring-orange-100">
            <p className="text-2xl font-black text-orange-500">
              {renderStars(Math.round(averageRating))}
            </p>

            <p className="mt-1 text-sm font-bold text-stone-600">
              {averageRating}/5
            </p>
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 font-medium text-red-700">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="mb-4 rounded-2xl bg-green-50 px-4 py-3 font-medium text-green-700">
          {successMessage}
        </p>
      )}

      {user ? (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-[2rem] bg-[#fffaf3] p-5 ring-1 ring-orange-100"
        >
          <div className="mb-5">
            <p className="text-lg font-black text-stone-950">
              {myReview ? 'Modifier mon avis' : 'Donner mon avis'}
            </p>

            <p className="mt-1 text-sm text-stone-600">
              Laisse une note et un petit commentaire sur cette recette.
            </p>
          </div>

          <div className="mb-5">
            <label className="mb-3 block font-bold text-stone-800">Note</label>

            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`rounded-2xl px-4 py-3 text-xl font-black shadow-sm transition ${
                    value <= rating
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-white text-stone-300 ring-1 ring-orange-100 hover:bg-orange-50 hover:text-orange-400'
                  }`}
                  aria-label={`Mettre ${value} étoile${value > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-bold text-stone-800">
              Commentaire
            </label>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              placeholder="Exemple : recette facile, très bonne, parfaite pour le soir..."
              className="w-full rounded-[1.4rem] border border-orange-100 bg-white px-4 py-3 text-stone-700 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-orange-500 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? 'Enregistrement...'
                : myReview
                  ? 'Modifier mon avis'
                  : 'Publier mon avis'}
            </button>

            {myReview && (
              <button
                type="button"
                onClick={handleDeleteReview}
                disabled={deleting}
                className="rounded-full border border-red-200 bg-white px-6 py-3 font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? 'Suppression...' : 'Supprimer mon avis'}
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-[2rem] bg-[#fffaf3] p-5 ring-1 ring-orange-100">
          <p className="font-bold text-stone-900">
            Connecte-toi pour donner ton avis.
          </p>

          <p className="mt-1 text-sm text-stone-600">
            Tu pourras noter la recette et laisser un commentaire.
          </p>

          <Link
            to="/auth"
            className="mt-4 inline-block rounded-full bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600"
          >
            Se connecter
          </Link>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-[2rem] bg-[#fffaf3] p-6 text-center ring-1 ring-orange-100">
          <p className="font-bold text-stone-900">
            Aucun commentaire pour le moment.
          </p>

          <p className="mt-2 text-stone-600">
            Sois le premier à donner ton avis sur cette recette.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isMine = userId === review.userId
            const profile = reviewProfiles[review.userId]

            const authorName = isMine
              ? profile?.username
                ? `${profile.username} · toi`
                : 'Toi'
              : profile?.username || 'Utilisateur'

            const authorAvatarUrl = profile?.avatarUrl ?? ''
            const authorLetter = authorName.charAt(0).toUpperCase() || 'U'

            return (
              <article
                key={review.id}
                className="rounded-[2rem] bg-[#fffaf3] p-5 ring-1 ring-orange-100"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-500 text-lg font-black text-white ring-2 ring-white">
                    {authorAvatarUrl ? (
                      <img
                        src={authorAvatarUrl}
                        alt={authorName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      authorLetter
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-stone-950">
                      {authorName}
                    </p>

                    <p className="text-sm text-stone-500">
                      {new Date(review.updatedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-lg font-black text-orange-500">
                    {renderStars(review.rating)}
                  </p>
                </div>

                {review.comment ? (
                  <p className="leading-7 text-stone-700">{review.comment}</p>
                ) : (
                  <p className="italic text-stone-400">
                    Aucun commentaire écrit.
                  </p>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}