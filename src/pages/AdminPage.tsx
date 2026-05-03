import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
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

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) =>
    index + 1 <= rating ? '★' : '☆',
  ).join('')
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [profiles, setProfiles] = useState<AdminProfilePreview[]>([])
  const [recipes, setRecipes] = useState<AdminRecipePreview[]>([])
  const [reviews, setReviews] = useState<AdminReviewPreview[]>([])

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadAdminDashboard() {
      try {
        setLoading(true)
        setErrorMessage('')

        const [
          loadedStats,
          loadedProfiles,
          loadedRecipes,
          loadedReviews,
        ] = await Promise.all([
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
        }
      } catch (error) {
        console.error(error)

        if (!ignore) {
          setErrorMessage(
            "Impossible de charger le tableau de bord admin. Vérifie les droits Supabase si l'erreur continue.",
          )
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    void loadAdminDashboard()

    return () => {
      ignore = true
    }
  }, [])

  if (loading) {
    return (
      <section className="rounded-[2rem] bg-white p-8 text-stone-600 shadow-sm ring-1 ring-orange-100">
        Chargement du tableau de bord admin...
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="rounded-[2.5rem] bg-[#fffaf3] p-8 shadow-sm ring-1 ring-orange-100">
        <div className="mb-6 flex w-fit items-center gap-3 rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-orange-700">
          <span>🛡️</span>
          <span>Mode admin</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h1 className="text-4xl font-black leading-tight text-stone-950 md:text-6xl">
              Tableau de bord administrateur.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              Surveille l’activité du site, les nouvelles recettes, les comptes
              créés et les derniers commentaires publiés.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <p className="text-sm font-black uppercase tracking-wide text-orange-600">
              Prochaine étape
            </p>

            <h2 className="mt-2 text-2xl font-black text-stone-950">
              Gestion des commentaires
            </h2>

            <p className="mt-2 leading-7 text-stone-600">
              Après ce tableau de bord, on ajoutera des boutons pour supprimer
              les commentaires gênants directement depuis l’admin.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-2xl bg-red-50 px-5 py-4 font-bold text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <p className="text-4xl font-black text-orange-600">
            {stats?.profilesCount ?? 0}
          </p>

          <p className="mt-2 font-black text-stone-950">Utilisateurs</p>

          <p className="mt-1 text-sm font-medium text-stone-500">
            Profils créés sur le site.
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <p className="text-4xl font-black text-orange-600">
            {stats?.recipesCount ?? 0}
          </p>

          <p className="mt-2 font-black text-stone-950">Recettes</p>

          <p className="mt-1 text-sm font-medium text-stone-500">
            Recettes publiées dans le carnet.
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <p className="text-4xl font-black text-orange-600">
            {stats?.reviewsCount ?? 0}
          </p>

          <p className="mt-2 font-black text-stone-950">Commentaires</p>

          <p className="mt-1 text-sm font-medium text-stone-500">
            Avis laissés sur les recettes.
          </p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                Recettes
              </p>

              <h2 className="text-3xl font-black text-stone-950">
                Dernières recettes
              </h2>
            </div>

            <Link
              to="/recipes"
              className="rounded-full bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600"
            >
              Voir le site
            </Link>
          </div>

          {recipes.length === 0 ? (
            <div className="rounded-[1.5rem] bg-[#fffaf3] p-6 text-stone-600">
              Aucune recette pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {recipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  to={`/recipes/${recipe.id}`}
                  className="block rounded-[1.5rem] bg-[#fffaf3] p-4 ring-1 ring-orange-100 transition hover:bg-orange-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-stone-950">
                        {recipe.title}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-stone-500">
                        {recipe.category} · {formatDate(recipe.createdAt)}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-orange-700 ring-1 ring-orange-100">
                      Ouvrir →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <div className="mb-6">
            <p className="text-sm font-black uppercase tracking-wide text-orange-600">
              Commentaires
            </p>

            <h2 className="text-3xl font-black text-stone-950">
              Derniers avis publiés
            </h2>
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-[1.5rem] bg-[#fffaf3] p-6 text-stone-600">
              Aucun commentaire pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-[1.5rem] bg-[#fffaf3] p-4 ring-1 ring-orange-100"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-orange-500">
                        {renderStars(review.rating)}
                      </p>

                      <p className="mt-2 line-clamp-2 leading-7 text-stone-700">
                        {review.comment || 'Aucun commentaire écrit.'}
                      </p>

                      <p className="mt-2 text-sm font-semibold text-stone-500">
                        Recette #{review.recipeId} · {formatDate(review.createdAt)}
                      </p>
                    </div>

                    <Link
                      to={`/recipes/${review.recipeId}`}
                      className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-orange-700 ring-1 ring-orange-100 transition hover:bg-orange-50"
                    >
                      Ouvrir →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
        <div className="mb-6">
          <p className="text-sm font-black uppercase tracking-wide text-orange-600">
            Utilisateurs
          </p>

          <h2 className="text-3xl font-black text-stone-950">
            Derniers profils créés
          </h2>
        </div>

        {profiles.length === 0 ? (
          <div className="rounded-[1.5rem] bg-[#fffaf3] p-6 text-stone-600">
            Aucun profil pour le moment.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => {
              const avatarLetter = profile.username.charAt(0).toUpperCase()

              return (
                <Link
                  key={profile.userId}
                  to={`/users/${profile.userId}`}
                  className="rounded-[2rem] bg-[#fffaf3] p-5 ring-1 ring-orange-100 transition hover:bg-orange-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-500 text-xl font-black text-white ring-2 ring-white">
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={profile.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        avatarLetter
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-black text-stone-950">
                        {profile.username}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-stone-500">
                        {formatDate(profile.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </section>
  )
}