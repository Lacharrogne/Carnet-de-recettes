import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabase'
import {
  deleteAdminProfile,
  deleteAdminRecipe,
  deleteAdminReview,
  getAdminStats,
  getRecentAdminProfiles,
  getRecentAdminRecipes,
  getRecentAdminReviews,
  type AdminProfilePreview,
  type AdminRecipePreview,
  type AdminReviewPreview,
  type AdminStats,
} from '../services/admin'

function formatDate(value: string | null) {
  if (!value) return 'Date inconnue'

  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function AdminPage() {
  const { user } = useAuth()

  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [loadingData, setLoadingData] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [profiles, setProfiles] = useState<AdminProfilePreview[]>([])
  const [recipes, setRecipes] = useState<AdminRecipePreview[]>([])
  const [reviews, setReviews] = useState<AdminReviewPreview[]>([])

  const [actionLoading, setActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let ignore = false

    async function checkAdminRole() {
      if (!user) {
        if (!ignore) {
          setCheckingAdmin(false)
          setIsAdmin(false)
        }

        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        if (!ignore) {
          setIsAdmin(data?.role === 'admin')
        }
      } catch (error) {
        console.error(error)

        if (!ignore) {
          setIsAdmin(false)
          setErrorMessage('Impossible de vérifier les droits administrateur.')
        }
      } finally {
        if (!ignore) {
          setCheckingAdmin(false)
        }
      }
    }

    void checkAdminRole()

    return () => {
      ignore = true
    }
  }, [user])

  async function loadAdminData() {
    const [loadedStats, loadedProfiles, loadedRecipes, loadedReviews] =
      await Promise.all([
        getAdminStats(),
        getRecentAdminProfiles(),
        getRecentAdminRecipes(),
        getRecentAdminReviews(),
      ])

    setStats(loadedStats)
    setProfiles(loadedProfiles)
    setRecipes(loadedRecipes)
    setReviews(loadedReviews)
  }

  useEffect(() => {
    let ignore = false

    async function fetchAdminData() {
      if (!isAdmin) {
        return
      }

      try {
        setLoadingData(true)

        const [loadedStats, loadedProfiles, loadedRecipes, loadedReviews] =
          await Promise.all([
            getAdminStats(),
            getRecentAdminProfiles(),
            getRecentAdminRecipes(),
            getRecentAdminReviews(),
          ])

        if (!ignore) {
          setStats(loadedStats)
          setProfiles(loadedProfiles)
          setRecipes(loadedRecipes)
          setReviews(loadedReviews)
          setErrorMessage('')
        }
      } catch (error) {
        console.error(error)

        if (!ignore) {
          setErrorMessage('Impossible de charger les données administrateur.')
        }
      } finally {
        if (!ignore) {
          setLoadingData(false)
        }
      }
    }

    void fetchAdminData()

    return () => {
      ignore = true
    }
  }, [isAdmin])

  async function refreshAfterAction(message: string) {
    try {
      await loadAdminData()
      setSuccessMessage(message)

      window.setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de recharger les données administrateur.')
    }
  }

  async function handleDeleteReview(review: AdminReviewPreview) {
    const confirmDelete = window.confirm(
      `Supprimer ce commentaire ?\n\n"${review.comment}"`,
    )

    if (!confirmDelete) return

    try {
      setActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      await deleteAdminReview(review.id)
      await refreshAfterAction('Commentaire supprimé.')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer ce commentaire.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeleteRecipe(recipe: AdminRecipePreview) {
    const confirmDelete = window.confirm(
      `Supprimer la recette "${recipe.title}" ?\n\nCette action supprimera aussi les éléments liés à cette recette.`,
    )

    if (!confirmDelete) return

    try {
      setActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      await deleteAdminRecipe(recipe.id)
      await refreshAfterAction('Recette supprimée.')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer cette recette.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeleteProfile(profile: AdminProfilePreview) {
    const confirmDelete = window.confirm(
      `Supprimer le profil "${profile.username}" ?\n\nAttention : cela supprime le profil et ses données liées, mais pas encore le compte Auth Supabase.`,
    )

    if (!confirmDelete) return

    try {
      setActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      await deleteAdminProfile(profile.userId)
      await refreshAfterAction('Profil supprimé.')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer ce profil.')
    } finally {
      setActionLoading(false)
    }
  }

  if (!user) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 text-center shadow-sm ring-1 ring-orange-100">
        <p className="text-2xl font-black text-stone-950">
          Connecte-toi pour accéder à l’administration.
        </p>

        <Link
          to="/auth"
          className="mt-6 inline-flex rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600"
        >
          Aller à la connexion
        </Link>
      </section>
    )
  }

  if (checkingAdmin) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 shadow-sm ring-1 ring-orange-100">
        <p className="font-bold text-stone-600">
          Vérification des droits administrateur...
        </p>
      </section>
    )
  }

  if (!isAdmin) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 text-center shadow-sm ring-1 ring-orange-100">
        <p className="text-3xl font-black text-stone-950">Accès refusé</p>

        <p className="mx-auto mt-3 max-w-xl text-stone-600">
          Cette page est réservée aux administrateurs du carnet de recettes.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600"
        >
          Retour à l’accueil
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="rounded-[2.5rem] bg-[#fffaf3] p-8 shadow-sm ring-1 ring-orange-100">
        <div className="mb-6 flex w-fit items-center gap-3 rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-orange-700">
          <span>🛡️</span>
          <span>Mode administrateur</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black leading-tight text-stone-950 md:text-6xl">
              Tableau de bord admin
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              Ici tu peux surveiller le carnet de recettes et supprimer les
              contenus problématiques.
            </p>
          </div>

          <Link
            to="/"
            className="rounded-full border border-orange-200 bg-white px-5 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
          >
            Retour au site
          </Link>
        </div>

        {stats && (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-orange-100">
              <p className="text-4xl font-black text-orange-600">
                {stats.profilesCount}
              </p>
              <p className="mt-1 font-bold text-stone-700">profils</p>
            </div>

            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-orange-100">
              <p className="text-4xl font-black text-orange-600">
                {stats.recipesCount}
              </p>
              <p className="mt-1 font-bold text-stone-700">recettes</p>
            </div>

            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-orange-100">
              <p className="text-4xl font-black text-orange-600">
                {stats.reviewsCount}
              </p>
              <p className="mt-1 font-bold text-stone-700">commentaires</p>
            </div>
          </div>
        )}
      </div>

      {successMessage && (
        <p className="rounded-2xl bg-green-50 px-5 py-4 font-bold text-green-700">
          {successMessage}
        </p>
      )}

      {errorMessage && (
        <p className="rounded-2xl bg-red-50 px-5 py-4 font-bold text-red-700">
          {errorMessage}
        </p>
      )}

      {loadingData ? (
        <div className="rounded-[2rem] bg-white p-8 text-stone-600 shadow-sm ring-1 ring-orange-100">
          Chargement du tableau de bord...
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-3">
          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <p className="text-sm font-black uppercase tracking-wide text-orange-600">
              Utilisateurs
            </p>

            <h2 className="mt-2 text-2xl font-black text-stone-950">
              Profils récents
            </h2>

            <div className="mt-6 space-y-3">
              {profiles.length === 0 ? (
                <p className="text-stone-500">Aucun profil trouvé.</p>
              ) : (
                profiles.map((profile) => (
                  <div
                    key={profile.userId}
                    className="rounded-[1.5rem] bg-[#fffaf3] p-4 ring-1 ring-orange-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-500 font-black text-white">
                        {profile.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt={profile.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          profile.username.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black text-stone-950">
                          {profile.username}
                        </p>

                        <p className="text-xs font-semibold text-stone-500">
                          {formatDate(profile.createdAt)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(profile)}
                      disabled={actionLoading}
                      className="mt-4 w-full rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Supprimer le profil
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <p className="text-sm font-black uppercase tracking-wide text-orange-600">
              Recettes
            </p>

            <h2 className="mt-2 text-2xl font-black text-stone-950">
              Recettes récentes
            </h2>

            <div className="mt-6 space-y-3">
              {recipes.length === 0 ? (
                <p className="text-stone-500">Aucune recette trouvée.</p>
              ) : (
                recipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="rounded-[1.5rem] bg-[#fffaf3] p-4 ring-1 ring-orange-100"
                  >
                    <p className="font-black text-stone-950">{recipe.title}</p>

                    <p className="mt-1 text-sm font-semibold text-orange-700">
                      {recipe.category}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-stone-500">
                      {formatDate(recipe.createdAt)}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <Link
                        to={`/recipes/${recipe.id}`}
                        className="flex-1 rounded-full border border-orange-200 bg-white px-4 py-2 text-center text-sm font-black text-orange-700 transition hover:bg-orange-50"
                      >
                        Voir
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteRecipe(recipe)}
                        disabled={actionLoading}
                        className="flex-1 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <p className="text-sm font-black uppercase tracking-wide text-orange-600">
              Commentaires
            </p>

            <h2 className="mt-2 text-2xl font-black text-stone-950">
              Avis récents
            </h2>

            <div className="mt-6 space-y-3">
              {reviews.length === 0 ? (
                <p className="text-stone-500">Aucun commentaire trouvé.</p>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-[1.5rem] bg-[#fffaf3] p-4 ring-1 ring-orange-100"
                  >
                    <p className="font-black text-orange-600">
                      Note : {review.rating}/5
                    </p>

                    <p className="mt-2 text-sm leading-6 text-stone-700">
                      {review.comment || 'Aucun commentaire écrit.'}
                    </p>

                    <p className="mt-2 text-xs font-semibold text-stone-500">
                      Recette #{review.recipeId} — {formatDate(review.createdAt)}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <Link
                        to={`/recipes/${review.recipeId}`}
                        className="flex-1 rounded-full border border-orange-200 bg-white px-4 py-2 text-center text-sm font-black text-orange-700 transition hover:bg-orange-50"
                      >
                        Voir
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteReview(review)}
                        disabled={actionLoading}
                        className="flex-1 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  )
}