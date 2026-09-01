import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import RecipeCard from '../components/recipes/RecipeCard'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import { useDialogs } from '../context/dialogContext'
import EmptyState from '../components/ui/EmptyState'
import { RecipeCardGridSkeleton } from '../components/ui/Skeleton'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import {
  deleteCollection,
  getCollection,
  getCollectionRecipes,
  removeRecipeFromCollection,
  renameCollection,
  type RecipeCollection,
} from '../services/collections'
import type { Recipe } from '../types/recipe'

export default function CollectionDetailPage() {
  const { confirm, prompt } = useDialogs()
  const { id } = useParams()
  const navigate = useNavigate()

  const [collection, setCollection] = useState<RecipeCollection | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useDocumentTitle(collection ? collection.name : 'Collection')

  useEffect(() => {
    if (!id) return

    let ignore = false

    Promise.all([getCollection(id), getCollectionRecipes(id)])
      .then(([info, list]) => {
        if (ignore) return
        setCollection(info)
        setRecipes(list)
      })
      .catch((error) => {
        console.error(error)
        if (!ignore) setErrorMessage('Impossible de charger la collection.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [id])

  async function handleRemove(recipeId: number) {
    if (!id) return

    try {
      await removeRecipeFromCollection(id, recipeId)
      setRecipes((current) => current.filter((r) => r.id !== recipeId))
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de retirer la recette.')
    }
  }

  async function handleRename() {
    if (!id || !collection) return

    const name = await prompt({
      title: 'Renommer la collection',
      message: 'Choisis un nouveau nom pour cette collection.',
      defaultValue: collection.name,
      placeholder: 'Nom de la collection',
      confirmLabel: 'Renommer',
    })
    if (!name || !name.trim()) return

    try {
      await renameCollection(id, name, collection.emoji)
      setCollection({ ...collection, name: name.trim() })
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de renommer la collection.')
    }
  }

  async function handleDeleteCollection() {
    if (!id || !collection) return
    const confirmed = await confirm({
      title: 'Supprimer la collection',
      message: `Voulez-vous vraiment supprimer la collection « ${collection.name} » ?`,
      confirmLabel: 'Supprimer',
      tone: 'danger',
    })
    if (!confirmed) return

    try {
      await deleteCollection(id)
      navigate('/collections')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer la collection.')
    }
  }

  if (loading) {
    return (
      <section className="space-y-8">
        <RecipeCardGridSkeleton count={3} />
      </section>
    )
  }

  if (!collection) {
    return (
      <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-bark">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl">
          🗂️
        </div>

        <h2 className="mt-5 text-2xl font-black text-stone-950">
          Collection introuvable
        </h2>

        <Button to="/collections" className="mt-6">
          Retour aux collections
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] bg-cream-100 p-8 shadow-sm ring-1 ring-bark">
        <Link
          to="/collections"
          className="font-bold text-orange-700 transition hover:text-orange-800"
        >
          ← Toutes mes collections
        </Link>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-white text-3xl shadow-sm ring-1 ring-bark">
              {collection.emoji}
            </div>

            <div>
              <h1 className="text-4xl font-black leading-tight text-stone-950">
                {collection.name}
              </h1>

              <p className="mt-2 font-semibold text-stone-600">
                {recipes.length} recette{recipes.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRename}
              className="rounded-2xl bg-card ring-1 ring-bark px-5 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
            >
              ✏️ Renommer
            </button>

            <button
              type="button"
              onClick={handleDeleteCollection}
              className="rounded-2xl border border-red-200 bg-white px-5 py-3 font-bold text-red-600 transition hover:bg-red-50"
            >
              🗑️ Supprimer
            </button>
          </div>
        </div>
      </div>

      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

      {recipes.length === 0 ? (
        <EmptyState
          emoji="🍽️"
          title="Collection vide"
          description="Ajoutez des recettes à cette collection depuis la page d'une recette (bouton « Ajouter à une collection »)."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="flex flex-col gap-2">
              <RecipeCard recipe={recipe} />

              <button
                type="button"
                onClick={() => handleRemove(recipe.id)}
                className="rounded-2xl ring-1 ring-bark bg-white px-4 py-2.5 text-sm font-bold text-stone-600 transition hover:border-bark hover:bg-orange-50 hover:text-orange-700"
              >
                Retirer de la collection
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
