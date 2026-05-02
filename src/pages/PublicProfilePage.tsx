import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import RecipeCard from '../components/recipes/RecipeCard'
import FollowButton from '../components/social/FollowButton'
import { useAuth } from '../context/useAuth'
import { getProfile, type UserProfile } from '../services/profiles'
import { getRecipes } from '../services/recipes'
import { getFollowStats, type FollowStats } from '../services/social'
import type { Recipe } from '../types/recipe'

export default function PublicProfilePage() {
  const { userId } = useParams()
  const { user } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [followStats, setFollowStats] = useState<FollowStats>({
    followersCount: 0,
    followingCount: 0,
    friendsCount: 0,
  })

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const isOwnProfile = !!user && !!userId && user.id === userId

  useEffect(() => {
    let ignore = false

    async function loadProfile() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setErrorMessage('')

        const [userProfile, allRecipes, stats] = await Promise.all([
          getProfile(userId),
          getRecipes(),
          getFollowStats(userId),
        ])

        if (ignore) {
          return
        }

        const userRecipes = allRecipes.filter(
          (recipe) => recipe.userId === userId,
        )

        setProfile(userProfile)
        setRecipes(userRecipes)
        setFollowStats(stats)
      } catch (error) {
        console.error(error)

        if (!ignore) {
          setErrorMessage('Impossible de charger ce profil.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      ignore = true
    }
  }, [userId])

  const usedCategories = useMemo(() => {
    return new Set(recipes.map((recipe) => recipe.category)).size
  }, [recipes])

  async function refreshFollowStats() {
    if (!userId) {
      return
    }

    try {
      const stats = await getFollowStats(userId)
      setFollowStats(stats)
    } catch (error) {
      console.error(error)
    }
  }

  if (!userId) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 shadow-sm ring-1 ring-orange-100">
        <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-red-700">
          Profil introuvable.
        </p>

        <Link
          to="/recipes"
          className="font-bold text-orange-700 hover:text-orange-800"
        >
          ← Retour aux recettes
        </Link>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 shadow-sm ring-1 ring-orange-100">
        <p className="text-stone-600">Chargement du profil...</p>
      </section>
    )
  }

  if (errorMessage) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 shadow-sm ring-1 ring-orange-100">
        <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </p>

        <Link
          to="/recipes"
          className="font-bold text-orange-700 hover:text-orange-800"
        >
          ← Retour aux recettes
        </Link>
      </section>
    )
  }

  const displayedName = profile?.username || 'Utilisateur'
  const displayedAvatarUrl = profile?.avatarUrl ?? ''
  const avatarLetter = displayedName.charAt(0).toUpperCase() || 'U'

  return (
    <section className="space-y-10">
      <div>
        <Link
          to="/recipes"
          className="inline-flex items-center rounded-full bg-white px-5 py-3 font-bold text-orange-700 shadow-sm ring-1 ring-orange-100 transition hover:bg-orange-50"
        >
          ← Retour aux recettes
        </Link>
      </div>

      <article className="overflow-hidden rounded-[2.5rem] bg-[#fffaf3] shadow-sm ring-1 ring-orange-100">
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[0.75fr_1.25fr] lg:px-10 lg:py-10">
          <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
            <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-orange-500 text-5xl font-black text-white ring-4 ring-white">
              {displayedAvatarUrl ? (
                <img
                  src={displayedAvatarUrl}
                  alt={displayedName}
                  className="h-full w-full object-cover"
                />
              ) : (
                avatarLetter
              )}
            </div>

            <p className="mt-6 rounded-full bg-orange-100 px-4 py-2 text-sm font-black uppercase tracking-wide text-orange-700">
              Profil public
            </p>

            <h1 className="mt-4 text-4xl font-black text-stone-950">
              {displayedName}
            </h1>

            {profile?.bio ? (
              <p className="mt-4 max-w-sm leading-7 text-stone-600">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-4 max-w-sm leading-7 text-stone-500">
                Cet utilisateur n’a pas encore ajouté de bio.
              </p>
            )}

            <div className="mt-7">
              {isOwnProfile ? (
                <Link
                  to="/profile"
                  className="inline-flex rounded-full bg-stone-950 px-6 py-3 font-black text-white shadow-sm transition hover:bg-stone-800"
                >
                  Modifier mon profil
                </Link>
              ) : (
                <FollowButton
                  targetUserId={userId}
                  onChanged={refreshFollowStats}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
                <p className="text-sm font-bold text-stone-500">
                  Recettes publiées
                </p>

                <p className="mt-3 text-4xl font-black text-stone-950">
                  {recipes.length}
                </p>

                <p className="mt-1 text-sm font-medium text-stone-500">
                  recette{recipes.length > 1 ? 's' : ''}
                </p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
                <p className="text-sm font-bold text-stone-500">
                  Catégories utilisées
                </p>

                <p className="mt-3 text-4xl font-black text-stone-950">
                  {usedCategories}
                </p>

                <p className="mt-1 text-sm font-medium text-stone-500">
                  famille{usedCategories > 1 ? 's' : ''}
                </p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
                <p className="text-sm font-bold text-stone-500">Amis</p>

                <p className="mt-3 text-4xl font-black text-stone-950">
                  {followStats.friendsCount}
                </p>

                <p className="mt-1 text-sm font-medium text-stone-500">
                  relation{followStats.friendsCount > 1 ? 's' : ''} mutuelle
                  {followStats.friendsCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
                <p className="text-sm font-bold text-stone-500">Abonnés</p>

                <p className="mt-3 text-4xl font-black text-orange-700">
                  {followStats.followersCount}
                </p>

                <p className="mt-1 text-sm font-medium text-stone-500">
                  personne{followStats.followersCount > 1 ? 's' : ''} sui
                  {followStats.followersCount > 1 ? 'vent' : 't'} ce carnet
                </p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
                <p className="text-sm font-bold text-stone-500">
                  Abonnements
                </p>

                <p className="mt-3 text-4xl font-black text-orange-700">
                  {followStats.followingCount}
                </p>

                <p className="mt-1 text-sm font-medium text-stone-500">
                  carnet{followStats.followingCount > 1 ? 's' : ''} suivi
                  {followStats.followingCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {!isOwnProfile && followStats.friendsCount > 0 && (
              <div className="mt-5 rounded-[2rem] bg-green-50 p-6 text-green-800 shadow-sm ring-1 ring-green-100">
                <p className="font-black">Relation de cuisine</p>

                <p className="mt-2 leading-7">
                  Quand deux utilisateurs se suivent mutuellement, ils deviennent
                  amis. Plus tard, cette relation permettra de partager des
                  recettes privées, des carnets et des plannings.
                </p>
              </div>
            )}
          </div>
        </div>
      </article>

      <section>
        <div className="mb-6">
          <p className="font-bold text-orange-600">Recettes</p>

          <h2 className="text-3xl font-black text-stone-950">
            Les recettes de {displayedName}
          </h2>

          <p className="mt-2 text-stone-600">
            Toutes les recettes publiées par cet utilisateur.
          </p>
        </div>

        {recipes.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
            <p className="text-lg font-bold text-stone-950">
              Aucune recette pour le moment.
            </p>

            <p className="mt-2 text-stone-600">
              Ce carnet est encore vide, mais de nouvelles recettes pourront
              bientôt apparaître ici.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>
    </section>
  )
}