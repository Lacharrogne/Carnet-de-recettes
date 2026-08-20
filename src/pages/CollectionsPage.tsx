import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { RecipeCardGridSkeleton } from '../components/ui/Skeleton'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import {
  createCollection,
  deleteCollection,
  getCollections,
  type RecipeCollection,
} from '../services/collections'

export default function CollectionsPage() {
  useDocumentTitle('Mes collections')

  const [collections, setCollections] = useState<RecipeCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let ignore = false

    getCollections()
      .then((data) => {
        if (!ignore) setCollections(data)
      })
      .catch((error) => {
        console.error(error)
        if (!ignore) setErrorMessage('Impossible de charger vos collections.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()

    const name = newName.trim()
    if (!name) return

    try {
      setCreating(true)
      setErrorMessage('')

      const collection = await createCollection(name)
      setCollections((current) => [...current, collection])
      setNewName('')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de créer la collection.')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Supprimer la collection « ${name} » ?`)) return

    try {
      await deleteCollection(id)
      setCollections((current) => current.filter((c) => c.id !== id))
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer la collection.')
    }
  }

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] bg-cream-100 p-8 shadow-sm ring-1 ring-orange-100">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-white text-3xl shadow-sm ring-1 ring-orange-100">
            🗂️
          </div>

          <div>
            <p className="font-bold text-orange-700">Espace personnel</p>

            <h1 className="mt-2 text-4xl font-black leading-tight text-stone-950">
              Mes collections
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-stone-600">
              Rangez vos recettes dans des dossiers thématiques — « Desserts »,
              « Rapide le midi », « Repas de fête »… Une recette peut être dans
              plusieurs collections.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-2 block text-sm font-semibold text-stone-600">
            Nouvelle collection
          </label>
          <input
            type="text"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Ex. Desserts gourmands"
            className="w-full rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3 outline-none transition focus:border-orange-500"
          />
        </div>

        <Button type="submit" disabled={creating || !newName.trim()}>
          {creating ? 'Création...' : '+ Créer'}
        </Button>
      </form>

      {loading ? (
        <RecipeCardGridSkeleton count={3} />
      ) : collections.length === 0 ? (
        <EmptyState
          emoji="🗂️"
          title="Aucune collection pour le moment"
          description="Créez votre première collection pour organiser vos recettes."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="group relative flex flex-col rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => handleDelete(collection.id, collection.name)}
                aria-label={`Supprimer ${collection.name}`}
                className="absolute right-4 top-4 rounded-full px-2 py-1 text-stone-400 opacity-0 transition hover:bg-orange-50 hover:text-orange-700 group-hover:opacity-100"
              >
                ✕
              </button>

              <Link to={`/collections/${collection.id}`} className="flex-1">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                  {collection.emoji}
                </span>

                <h2 className="mt-4 text-xl font-black text-stone-950 transition group-hover:text-orange-700">
                  {collection.name}
                </h2>

                <p className="mt-1 text-sm font-semibold text-stone-500">
                  {collection.recipeCount} recette
                  {collection.recipeCount > 1 ? 's' : ''}
                </p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
