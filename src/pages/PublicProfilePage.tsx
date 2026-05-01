import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import RecipeCard from '../components/recipes/RecipeCard'
import { getProfile, type UserProfile } from '../services/profiles'
import { getRecipes } from '../services/recipes'
import type { Recipe } from '../types/recipe'

export default function PublicProfilePage() {
  const { userId } = useParams()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let ignore = false

    if (!userId) return

    Promise.all([getProfile(userId), getRecipes()])
      .then(([userProfile, allRecipes]) => {
        if (ignore) return

        const userRecipes = allRecipes.filter(
          (recipe) => recipe.userId === userId,
        )

        setProfile(userProfile)
        setRecipes(userRecipes)
      })
      .catch((error) => {
        if (ignore) return

        console.error(error)
        setErrorMessage('Impossible de charger ce profil.')
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [userId])

  const usedCategories = useMemo(() => {
    return new Set(recipes.map((recipe) => recipe.category)).size
  }, [recipes])

  const displayedName = profile?.username || 'Utilisateur'
  const displayedAvatarUrl = profile?.avatarUrl ?? ''
  const avatarLetter = displayedName.charAt(0).toUpperCase() || 'U'

  if (!userId) {
    return (
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-orange-100">
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">
          Profil introuvable.
        </p>

        <Link
          to="/recipes"
          className="mt-6 inline-block font-semibold text-orange-600 hover:text-orange-700"
        >
          ← Retour aux recettes
        </Link>
      </section>
    )
  }

  if (loading) {
    return <p>Chargement du profil...</p>
  }

  if (errorMessage) {
    return (
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-orange-100">
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </p>

        <Link
          to="/recipes"
          className="mt-6 inline-block font-semibold text-orange-600 hover:text-orange-700"
        >
          ← Retour aux recettes
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <Link
        to="/recipes"
        className="inline-flex items-center font-semibold text-orange-600 hover:text-orange-700"
      >
        ← Retour aux recettes
      </Link>

      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-50 via-white to-amber-50 p-8 shadow-sm ring-1 ring-orange-100">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-orange-500 text-5xl font-black text-white shadow-sm ring-4 ring-white">
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

          <div>
            <p className="font-medium text-orange-500">Profil public</p>

            <h1 className="mt-2 text-4xl font-black text-slate-950">
              {displayedName}
            </h1>

            {profile?.bio ? (
              <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-4 text-slate-600">
                Cet utilisateur n’a pas encore ajouté de bio.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <p className="text-sm font-medium text-slate-500">
            Recettes publiées
          </p>

          <p className="mt-3 text-4xl font-black text-slate-950">
            {recipes.length}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <p className="text-sm font-medium text-slate-500">
            Catégories utilisées
          </p>

          <p className="mt-3 text-4xl font-black text-slate-950">
            {usedCategories}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-6">
          <p className="font-medium text-orange-500">Recettes</p>

          <h2 className="text-3xl font-black text-slate-950">
            Les recettes de {displayedName}
          </h2>
        </div>

        {recipes.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
            <p className="text-lg font-semibold text-slate-900">
              Aucune recette pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}