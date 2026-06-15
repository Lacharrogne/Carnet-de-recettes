import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import RecipeCard from '../components/recipes/RecipeCard'
import FollowButton from '../components/social/FollowButton'
import Alert from '../components/ui/Alert'
import { ProfileSkeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/useAuth'
import { getProfile, type UserProfile } from '../services/profiles'
import { getRecipes } from '../services/recipes'
import { getFollowStats, type FollowStats } from '../services/social'
import type { Recipe } from '../types/recipe'

type RecipeBadge = {
  minRecipes: number
  name: string
  emoji: string
  description: string
}

const RECIPE_BADGES: RecipeBadge[] = [
  {
    minRecipes: 1,
    name: 'Petite toque',
    emoji: '👩‍🍳',
    description: 'A publié sa première recette.',
  },
  {
    minRecipes: 5,
    name: 'Chef de la casserole',
    emoji: '🍲',
    description: 'Commence à remplir sérieusement son carnet.',
  },
  {
    minRecipes: 10,
    name: 'Maître du tablier',
    emoji: '🥘',
    description: 'Un vrai habitué des fourneaux.',
  },
  {
    minRecipes: 20,
    name: 'Roi de la spatule',
    emoji: '🍳',
    description: 'Ses recettes commencent à peser dans le carnet.',
  },
  {
    minRecipes: 30,
    name: 'Grand gourou du gratin',
    emoji: '🧀',
    description: 'Un profil qui sent bon la cuisine maison.',
  },
  {
    minRecipes: 50,
    name: 'Légende du frigo',
    emoji: '🧊',
    description: 'Toujours une idée de recette sous la main.',
  },
  {
    minRecipes: 100,
    name: 'Dieu de la tambouille',
    emoji: '🔥',
    description: 'Le sommet absolu du carnet de recettes.',
  },
]

function getCurrentRecipeBadge(recipeCount: number) {
  let currentBadge: RecipeBadge | null = null

  for (const badge of RECIPE_BADGES) {
    if (recipeCount >= badge.minRecipes) {
      currentBadge = badge
    }
  }

  return currentBadge
}

function getNextRecipeBadge(recipeCount: number) {
  return RECIPE_BADGES.find((badge) => recipeCount < badge.minRecipes) ?? null
}

function getRecipeBadgeProgress(recipeCount: number) {
  const currentBadge = getCurrentRecipeBadge(recipeCount)
  const nextBadge = getNextRecipeBadge(recipeCount)

  if (!nextBadge) {
    return {
      currentBadge,
      nextBadge: null,
      remainingRecipes: 0,
      progressPercent: 100,
    }
  }

  const previousThreshold = currentBadge?.minRecipes ?? 0
  const totalNeeded = nextBadge.minRecipes - previousThreshold
  const currentProgress = recipeCount - previousThreshold

  const progressPercent =
    totalNeeded > 0
      ? Math.min(100, Math.round((currentProgress / totalNeeded) * 100))
      : 0

  return {
    currentBadge,
    nextBadge,
    remainingRecipes: nextBadge.minRecipes - recipeCount,
    progressPercent,
  }
}

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

  const badgeProgress = useMemo(() => {
    return getRecipeBadgeProgress(recipes.length)
  }, [recipes.length])

  const unlockedBadges = useMemo(() => {
    return RECIPE_BADGES.filter((badge) => recipes.length >= badge.minRecipes)
  }, [recipes.length])

  const lockedBadges = useMemo(() => {
    return RECIPE_BADGES.filter((badge) => recipes.length < badge.minRecipes)
  }, [recipes.length])

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
        <Alert tone="error" className="mb-6">
          Profil introuvable.
        </Alert>

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
    return <ProfileSkeleton />
  }

  if (errorMessage) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 shadow-sm ring-1 ring-orange-100">
        <Alert tone="error" className="mb-6">
          {errorMessage}
        </Alert>

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

  const currentBadge = badgeProgress.currentBadge
  const nextBadge = badgeProgress.nextBadge

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

      <article className="overflow-hidden rounded-[2.5rem] bg-cream-50 shadow-sm ring-1 ring-orange-100">
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[0.75fr_1.25fr] lg:px-10 lg:py-10">
          <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
            <div className="relative">
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

              <div className="absolute -bottom-3 -right-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl shadow-sm ring-1 ring-orange-100">
                {currentBadge?.emoji ?? '🔒'}
              </div>
            </div>

            <p className="mt-6 rounded-full bg-orange-100 px-4 py-2 text-sm font-black uppercase tracking-wide text-orange-700">
              Profil public
            </p>

            <h1 className="mt-4 text-4xl font-black text-stone-950">
              {displayedName}
            </h1>

            <div className="mt-4 rounded-[1.5rem] bg-cream-50 px-5 py-4 ring-1 ring-orange-100">
              {currentBadge ? (
                <>
                  <p className="text-sm font-bold text-stone-500">
                    Badge actuel
                  </p>

                  <p className="mt-1 text-xl font-black text-stone-950">
                    {currentBadge.emoji} {currentBadge.name}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {currentBadge.description}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-stone-500">
                    Aucun badge pour le moment
                  </p>

                  <p className="mt-1 text-xl font-black text-stone-950">
                    🔒 Première recette à publier
                  </p>

                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Publie une recette pour débloquer le badge Petite toque.
                  </p>
                </>
              )}
            </div>

            {profile?.bio ? (
              <p className="mt-5 max-w-sm leading-7 text-stone-600">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-5 max-w-sm leading-7 text-stone-500">
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
                  {followStats.followersCount > 1
                    ? 'personnes suivent'
                    : 'personne suit'}{' '}
                  ce carnet
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

            <div className="mt-5 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                    Succès de publication
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-stone-950">
                    {currentBadge
                      ? `${currentBadge.emoji} ${currentBadge.name}`
                      : '🔒 Aucun badge débloqué'}
                  </h2>

                  <p className="mt-2 leading-7 text-stone-600">
                    {nextBadge
                      ? `Encore ${badgeProgress.remainingRecipes} recette${
                          badgeProgress.remainingRecipes > 1 ? 's' : ''
                        } à publier pour débloquer : ${nextBadge.name}.`
                      : 'Tous les badges de publication ont été débloqués.'}
                  </p>
                </div>

                <div className="shrink-0 rounded-[1.5rem] bg-cream-50 px-5 py-4 text-center ring-1 ring-orange-100">
                  <p className="text-4xl font-black text-orange-700">
                    {badgeProgress.progressPercent}%
                  </p>

                  <p className="mt-1 text-sm font-bold text-stone-500">
                    progression
                  </p>
                </div>
              </div>

              <div className="mt-5 h-4 overflow-hidden rounded-full bg-orange-100">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all"
                  style={{ width: `${badgeProgress.progressPercent}%` }}
                />
              </div>

              {nextBadge && (
                <p className="mt-3 text-sm font-semibold text-stone-500">
                  Prochain objectif : {nextBadge.minRecipes} recettes publiées.
                </p>
              )}
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

      <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
        <div className="mb-6">
          <p className="font-bold text-orange-600">Badges</p>

          <h2 className="text-3xl font-black text-stone-950">
            Succès débloqués
          </h2>

          <p className="mt-2 text-stone-600">
            Les badges récompensent les utilisateurs qui publient des recettes.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {unlockedBadges.map((badge) => (
            <div
              key={badge.name}
              className="rounded-[2rem] bg-cream-50 p-5 shadow-sm ring-1 ring-orange-100"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
                  {badge.emoji}
                </div>

                <div>
                  <p className="font-black text-stone-950">{badge.name}</p>

                  <p className="mt-1 text-sm font-bold text-orange-700">
                    {badge.minRecipes} recette
                    {badge.minRecipes > 1 ? 's' : ''}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {badge.description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {lockedBadges.map((badge) => (
            <div
              key={badge.name}
              className="rounded-[2rem] bg-stone-50 p-5 opacity-70 ring-1 ring-stone-200"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl ring-1 ring-stone-200">
                  🔒
                </div>

                <div>
                  <p className="font-black text-stone-800">{badge.name}</p>

                  <p className="mt-1 text-sm font-bold text-stone-500">
                    À {badge.minRecipes} recette
                    {badge.minRecipes > 1 ? 's' : ''}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    {badge.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

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