import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/useAuth'
import { useEntitlement } from '../../lib/useEntitlement'
import Button from '../ui/Button'
import {
  addRecipeToCollection,
  createCollection,
  getCollectionIdsForRecipe,
  getCollections,
  removeRecipeFromCollection,
  type RecipeCollection,
} from '../../services/collections'

/**
 * Bouton + panneau repliable pour ranger une recette dans une (ou plusieurs)
 * collections, avec création à la volée. Réservé aux personnes connectées et
 * avec un accès valide (comme les autres actions perso).
 */
export default function AddToCollectionMenu({ recipeId }: { recipeId: number }) {
  const { user } = useAuth()
  const { hasAccess } = useEntitlement()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [collections, setCollections] = useState<RecipeCollection[]>([])
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set())
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleTogglePanel() {
    if (open) {
      setOpen(false)
      return
    }

    if (!user) {
      navigate('/auth')
      return
    }

    if (!hasAccess) {
      navigate('/premium')
      return
    }

    setOpen(true)
    setLoading(true)
    setError('')

    try {
      const [list, ids] = await Promise.all([
        getCollections(),
        getCollectionIdsForRecipe(recipeId),
      ])
      setCollections(list)
      setMemberIds(new Set(ids))
    } catch (err) {
      console.error(err)
      setError('Impossible de charger vos collections.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleMembership(collection: RecipeCollection) {
    const isMember = memberIds.has(collection.id)

    // Mise à jour optimiste.
    setMemberIds((current) => {
      const next = new Set(current)
      if (isMember) next.delete(collection.id)
      else next.add(collection.id)
      return next
    })

    try {
      if (isMember) {
        await removeRecipeFromCollection(collection.id, recipeId)
      } else {
        await addRecipeToCollection(collection.id, recipeId)
      }
    } catch (err) {
      console.error(err)
      setError('Modification impossible, réessayez.')
      // On annule la mise à jour optimiste.
      setMemberIds((current) => {
        const next = new Set(current)
        if (isMember) next.add(collection.id)
        else next.delete(collection.id)
        return next
      })
    }
  }

  async function handleCreateAndAdd(event: FormEvent) {
    event.preventDefault()

    const name = newName.trim()
    if (!name) return

    try {
      setBusy(true)
      setError('')

      const collection = await createCollection(name)
      await addRecipeToCollection(collection.id, recipeId)

      setCollections((current) => [...current, collection])
      setMemberIds((current) => new Set(current).add(collection.id))
      setNewName('')
    } catch (err) {
      console.error(err)
      setError('Impossible de créer la collection.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sm:col-span-2">
      <Button
        type="button"
        onClick={handleTogglePanel}
        variant="ghost"
        fullWidth
      >
        🗂️ {open ? 'Fermer' : 'Ajouter à une collection'}
      </Button>

      {open && (
        <div className="mt-3 rounded-[1.5rem] ring-1 ring-bark bg-[#fffaf5] p-4">
          {error && (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {error}
            </p>
          )}

          {loading ? (
            <p className="text-sm font-semibold text-stone-500">Chargement…</p>
          ) : (
            <>
              {collections.length > 0 ? (
                <ul className="space-y-1.5">
                  {collections.map((collection) => {
                    const isMember = memberIds.has(collection.id)

                    return (
                      <li key={collection.id}>
                        <button
                          type="button"
                          onClick={() => toggleMembership(collection)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                            isMember
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-white text-stone-700 ring-1 ring-bark hover:bg-orange-50'
                          }`}
                        >
                          <span className="text-lg">{collection.emoji}</span>
                          <span className="flex-1 truncate">
                            {collection.name}
                          </span>
                          <span aria-hidden="true">{isMember ? '✓' : '+'}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm font-semibold text-stone-500">
                  Vous n’avez pas encore de collection.
                </p>
              )}

              <form onSubmit={handleCreateAndAdd} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Nouvelle collection…"
                  className="min-w-0 flex-1 rounded-xl bg-linen px-3 py-2 text-sm text-cacao ring-1 ring-bark outline-none transition placeholder:text-hazel focus:bg-card focus:ring-2 focus:ring-terracotta/40"
                />
                <button
                  type="submit"
                  disabled={busy || !newName.trim()}
                  className="shrink-0 rounded-xl bg-terracotta px-4 py-2 text-sm font-bold text-white transition hover:bg-terracotta-deep disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? '…' : 'Créer'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
