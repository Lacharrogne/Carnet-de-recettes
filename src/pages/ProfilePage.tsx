import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getFavoriteRecipes } from '../services/favorites'
import { getRecipes } from '../services/recipes'
import {
  getProfile,
  saveProfile,
  uploadProfileAvatar,
  type UserProfile,
} from '../services/profiles'
import { supabase } from '../lib/supabase'
import type { Recipe } from '../types/recipe'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [myRecipes, setMyRecipes] = useState<Recipe[]>([])
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const userId = user?.id
  const loading = Boolean(userId) && loadedUserId !== userId

  const avatarPreviewUrl = useMemo(() => {
    if (!avatarFile) return null
    return URL.createObjectURL(avatarFile)
  }, [avatarFile])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  useEffect(() => {
    let ignore = false

    if (!userId) return

    Promise.all([getRecipes(), getFavoriteRecipes(), getProfile(userId)])
      .then(([allRecipes, favorites, userProfile]) => {
        if (ignore) return

        const userRecipes = allRecipes.filter(
          (recipe) => recipe.userId === userId,
        )

        const defaultUsername = user?.email?.split('@')[0] ?? ''

        setMyRecipes(userRecipes)
        setFavoriteRecipes(favorites)

        if (userProfile) {
          setProfile(userProfile)
          setUsername(userProfile.username)
          setBio(userProfile.bio)
        } else {
          setUsername(defaultUsername)
          setBio('')
        }
      })
      .catch((error) => {
        if (ignore) return

        console.error(error)
        setErrorMessage('Impossible de charger les informations du profil.')
      })
      .finally(() => {
        if (!ignore) {
          setLoadedUserId(userId)
        }
      })

    return () => {
      ignore = true
    }
  }, [userId, user?.email])

  const latestRecipes = useMemo(() => {
    return myRecipes.slice(0, 3)
  }, [myRecipes])

  const usedCategories = useMemo(() => {
    return new Set(myRecipes.map((recipe) => recipe.category)).size
  }, [myRecipes])

  const displayedName = profile?.username || username || user?.email || 'Profil'
  const displayedAvatarUrl = avatarPreviewUrl ?? profile?.avatarUrl ?? ''
  const avatarLetter = displayedName.charAt(0).toUpperCase()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  function cancelEdit() {
    setIsEditing(false)
    setSuccessMessage('')
    setErrorMessage('')
    setAvatarFile(null)

    if (profile) {
      setUsername(profile.username)
      setBio(profile.bio)
    } else {
      setUsername(user?.email?.split('@')[0] ?? '')
      setBio('')
    }
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!userId) return

    try {
      setSaving(true)
      setErrorMessage('')
      setSuccessMessage('')

      let avatarUrl = profile?.avatarUrl ?? ''

      if (avatarFile) {
        avatarUrl = await uploadProfileAvatar(userId, avatarFile)
      }

      const savedProfile = await saveProfile({
        userId,
        username: username.trim(),
        bio: bio.trim(),
        avatarUrl,
      })

      setProfile(savedProfile)
      setUsername(savedProfile.username)
      setBio(savedProfile.bio)
      setAvatarFile(null)
      setSuccessMessage('Profil mis à jour avec succès.')
      setIsEditing(false)
    } catch (error) {
      console.error(error)

      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Impossible de sauvegarder le profil.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-orange-100">
        <p className="font-medium text-stone-600">Chargement du profil...</p>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl">
          👤
        </div>

        <p className="mt-5 text-xl font-black text-stone-950">
          Vous n’êtes pas connecté.
        </p>

        <p className="mt-2 text-stone-600">
          Connecte-toi pour retrouver ton carnet de recettes.
        </p>

        <Link
          to="/auth"
          className="mt-6 inline-block rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700"
        >
          Se connecter
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] bg-[#fff5ec] shadow-sm ring-1 ring-orange-100">
        <div className="grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-orange-600 text-4xl font-black text-white shadow-sm ring-4 ring-white">
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

              <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-orange-100">
                🍳
              </div>
            </div>

            <div>
              <p className="font-bold text-orange-700">Espace personnel</p>

              <h1 className="mt-2 text-4xl font-black leading-tight text-stone-950">
                {displayedName}
              </h1>

              <p className="mt-3 text-stone-600">
                Connecté avec :{' '}
                <span className="font-bold text-stone-900">{user.email}</span>
              </p>

              {profile?.bio ? (
                <p className="mt-4 max-w-2xl leading-7 text-stone-600">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-4 max-w-2xl leading-7 text-stone-500">
                  Ajoute une petite bio pour personnaliser ton profil.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <button
              type="button"
              onClick={() => {
                setIsEditing((current) => !current)
                setSuccessMessage('')
                setErrorMessage('')
              }}
              className="rounded-2xl bg-orange-600 px-5 py-3 font-bold text-white transition hover:bg-orange-700"
            >
              {isEditing ? 'Fermer' : 'Modifier le profil'}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-orange-200 bg-white px-5 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 font-medium text-red-700 ring-1 ring-red-100">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="rounded-2xl bg-green-50 px-4 py-3 font-medium text-green-700 ring-1 ring-green-100">
          {successMessage}
        </p>
      )}

      {isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100"
        >
          <div className="mb-6">
            <p className="font-bold text-orange-700">Profil public</p>

            <h2 className="mt-1 text-2xl font-black text-stone-950">
              Modifier mes informations
            </h2>

            <p className="mt-2 text-stone-600">
              Ajoute un pseudo, une bio et une photo de profil pour rendre ton
              espace plus personnel.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-[0.35fr_0.65fr]">
            <div>
              <label className="mb-3 block font-bold text-stone-900">
                Photo de profil
              </label>

              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-orange-600 text-5xl font-black text-white ring-4 ring-orange-50">
                {displayedAvatarUrl ? (
                  <img
                    src={displayedAvatarUrl}
                    alt="Aperçu du profil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  avatarLetter
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setAvatarFile(event.target.files?.[0] ?? null)
                }
                className="mt-5 w-full rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3 text-sm outline-none transition focus:border-orange-500"
              />

              <p className="mt-2 text-sm text-stone-500">
                Format image, 2 Mo maximum.
              </p>
            </div>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block font-bold text-stone-900">
                  Pseudo
                </label>

                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Exemple : Chloé, Maxime, Studio C&M..."
                  className="w-full rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3 outline-none transition focus:border-orange-500"
                />
              </div>

              <div>
                <label className="mb-2 block font-bold text-stone-900">
                  Bio
                </label>

                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={5}
                  placeholder="Une petite description de ton profil..."
                  className="w-full rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3 outline-none transition focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Sauvegarde...' : 'Enregistrer le profil'}
            </button>

            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="rounded-2xl border border-orange-100 bg-white px-6 py-3 font-bold text-stone-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
            📖
          </div>

          <p className="mt-5 text-sm font-bold text-stone-500">
            Recettes créées
          </p>

          <p className="mt-2 text-4xl font-black text-stone-950">
            {myRecipes.length}
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
            ♥
          </div>

          <p className="mt-5 text-sm font-bold text-stone-500">Favoris</p>

          <p className="mt-2 text-4xl font-black text-stone-950">
            {favoriteRecipes.length}
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
            🏷️
          </div>

          <p className="mt-5 text-sm font-bold text-stone-500">
            Catégories utilisées
          </p>

          <p className="mt-2 text-4xl font-black text-stone-950">
            {usedCategories}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/add-recipe"
          className="rounded-[2rem] bg-orange-600 p-6 text-white shadow-sm transition hover:-translate-y-1 hover:bg-orange-700 hover:shadow-md"
        >
          <p className="text-3xl">➕</p>

          <h2 className="mt-4 text-xl font-black">Ajouter une recette</h2>

          <p className="mt-2 text-orange-50">
            Créer une nouvelle recette dans le carnet.
          </p>
        </Link>

        <Link
          to="/my-recipes"
          className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-1 hover:bg-[#fffaf5] hover:shadow-md"
        >
          <p className="text-3xl">📖</p>

          <h2 className="mt-4 text-xl font-black text-stone-950">
            Mes recettes
          </h2>

          <p className="mt-2 text-stone-600">
            Voir et modifier les recettes que tu as créées.
          </p>
        </Link>

        <Link
          to="/favorites"
          className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-1 hover:bg-[#fffaf5] hover:shadow-md"
        >
          <p className="text-3xl">♥</p>

          <h2 className="mt-4 text-xl font-black text-stone-950">Favoris</h2>

          <p className="mt-2 text-stone-600">
            Retrouver les recettes enregistrées en favoris.
          </p>
        </Link>

        <Link
          to="/shopping-list"
          className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-1 hover:bg-[#fffaf5] hover:shadow-md"
        >
          <p className="text-3xl">🛒</p>

          <h2 className="mt-4 text-xl font-black text-stone-950">
            Liste de courses
          </h2>

          <p className="mt-2 text-stone-600">
            Préparer les ingrédients à acheter.
          </p>
        </Link>
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="font-bold text-orange-700">Activité récente</p>

            <h2 className="mt-1 text-2xl font-black text-stone-950">
              Mes dernières recettes
            </h2>
          </div>

          <Link
            to="/my-recipes"
            className="hidden font-bold text-orange-700 transition hover:text-orange-800 md:block"
          >
            Tout voir →
          </Link>
        </div>

        {latestRecipes.length === 0 ? (
          <div className="rounded-[2rem] bg-[#fff5ec] p-6 text-center">
            <p className="font-bold text-stone-900">
              Aucune recette créée pour le moment.
            </p>

            <p className="mt-2 text-stone-600">
              Ajoute ta première recette pour commencer ton carnet.
            </p>

            <Link
              to="/add-recipe"
              className="mt-4 inline-block rounded-2xl bg-orange-600 px-5 py-3 font-bold text-white transition hover:bg-orange-700"
            >
              Ajouter ma première recette
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {latestRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="overflow-hidden rounded-[2rem] bg-[#fffaf5] transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-36 items-center justify-center bg-orange-50">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">{recipe.image || '🍽️'}</span>
                  )}
                </div>

                <div className="p-4">
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                    {recipe.category}
                  </span>

                  <h3 className="mt-3 font-black text-stone-950">
                    {recipe.title}
                  </h3>

                  <p className="mt-2 text-sm text-stone-500">
                    {recipe.prepTime + recipe.cookTime} min · {recipe.servings}{' '}
                    pers.
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}