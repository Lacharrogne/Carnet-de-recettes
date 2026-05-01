import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  addShoppingListItem,
  deleteAllShoppingListItems,
  deleteCheckedShoppingListItems,
  deleteShoppingListItem,
  getShoppingListItems,
  updateShoppingListItemChecked,
  type ShoppingListItem,
} from '../services/shoppingList'

function sortShoppingListItems(items: ShoppingListItem[]) {
  return [...items].sort((a, b) => {
    if (a.checked !== b.checked) {
      return Number(a.checked) - Number(b.checked)
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [newItemText, setNewItemText] = useState('')

  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [deletingChecked, setDeletingChecked] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let ignore = false

    getShoppingListItems()
      .then((data) => {
        if (!ignore) {
          setItems(sortShoppingListItems(data))
        }
      })
      .catch((error) => {
        if (!ignore) {
          console.error(error)
          setErrorMessage('Impossible de charger la liste de courses.')
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  const checkedItems = useMemo(() => {
    return items.filter((item) => item.checked)
  }, [items])

  const uncheckedItems = useMemo(() => {
    return items.filter((item) => !item.checked)
  }, [items])

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanedText = newItemText.trim()

    if (!cleanedText) return

    try {
      setAdding(true)
      setErrorMessage('')
      setSuccessMessage('')

      const createdItem = await addShoppingListItem(cleanedText)

      setItems((currentItems) =>
        sortShoppingListItems([createdItem, ...currentItems]),
      )

      setNewItemText('')
      setSuccessMessage('Ingrédient ajouté à la liste.')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible d’ajouter cet ingrédient.')
    } finally {
      setAdding(false)
    }
  }

  async function handleToggleItem(item: ShoppingListItem) {
    try {
      setErrorMessage('')
      setSuccessMessage('')

      const updatedItem = await updateShoppingListItemChecked(
        item.id,
        !item.checked,
      )

      setItems((currentItems) =>
        sortShoppingListItems(
          currentItems.map((currentItem) =>
            currentItem.id === item.id ? updatedItem : currentItem,
          ),
        ),
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de modifier cet ingrédient.')
    }
  }

  async function handleDeleteItem(itemId: number) {
    try {
      setErrorMessage('')
      setSuccessMessage('')

      await deleteShoppingListItem(itemId)

      setItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.id !== itemId),
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer cet ingrédient.')
    }
  }

  async function handleDeleteCheckedItems() {
    if (checkedItems.length === 0) return

    const confirmDelete = window.confirm(
      'Voulez-vous supprimer tous les ingrédients cochés ?',
    )

    if (!confirmDelete) return

    try {
      setDeletingChecked(true)
      setErrorMessage('')
      setSuccessMessage('')

      await deleteCheckedShoppingListItems()

      setItems((currentItems) =>
        currentItems.filter((currentItem) => !currentItem.checked),
      )

      setSuccessMessage('Les ingrédients cochés ont été supprimés.')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer les ingrédients cochés.')
    } finally {
      setDeletingChecked(false)
    }
  }

  async function handleDeleteAllItems() {
    if (items.length === 0) return

    const confirmDelete = window.confirm(
      'Voulez-vous vraiment vider toute la liste de courses ?',
    )

    if (!confirmDelete) return

    try {
      setDeletingAll(true)
      setErrorMessage('')
      setSuccessMessage('')

      await deleteAllShoppingListItems()

      setItems([])
      setSuccessMessage('La liste de courses a été vidée.')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de vider la liste de courses.')
    } finally {
      setDeletingAll(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-orange-100">
        <p className="font-medium text-stone-600">
          Chargement de la liste de courses...
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] bg-[#fff5ec] p-8 shadow-sm ring-1 ring-orange-100">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-white text-3xl shadow-sm ring-1 ring-orange-100">
              🛒
            </div>

            <div>
              <p className="font-bold text-orange-700">Organisation</p>

              <h1 className="mt-2 text-4xl font-black leading-tight text-stone-950">
                Liste de courses
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                Prépare tes achats simplement et garde sous les yeux les
                ingrédients qu’il te reste à prendre.
              </p>
            </div>
          </div>

          <Link
            to="/recipes"
            className="w-fit rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700"
          >
            Explorer les recettes
          </Link>
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

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
            🧺
          </div>

          <p className="mt-5 text-sm font-bold text-stone-500">Total</p>

          <p className="mt-2 text-4xl font-black text-stone-950">
            {items.length}
          </p>

          <p className="mt-1 text-sm text-stone-500">
            ingrédient{items.length > 1 ? 's' : ''} dans la liste
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
            📝
          </div>

          <p className="mt-5 text-sm font-bold text-stone-500">À acheter</p>

          <p className="mt-2 text-4xl font-black text-stone-950">
            {uncheckedItems.length}
          </p>

          <p className="mt-1 text-sm text-stone-500">
            ingrédient{uncheckedItems.length > 1 ? 's' : ''} restant
            {uncheckedItems.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
            ✅
          </div>

          <p className="mt-5 text-sm font-bold text-stone-500">Pris</p>

          <p className="mt-2 text-4xl font-black text-stone-950">
            {checkedItems.length}
          </p>

          <p className="mt-1 text-sm text-stone-500">
            ingrédient{checkedItems.length > 1 ? 's' : ''} coché
            {checkedItems.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleAddItem}
        className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100"
      >
        <div className="mb-5">
          <p className="font-bold text-orange-700">Ajout rapide</p>

          <h2 className="mt-1 text-2xl font-black text-stone-950">
            Ajouter un ingrédient
          </h2>

          <p className="mt-2 text-stone-600">
            Tu peux ajouter un ingrédient à la main, ou depuis une recette avec
            le petit bouton +.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={newItemText}
            onChange={(event) => setNewItemText(event.target.value)}
            placeholder="Exemple : 6 œufs, farine, tomates..."
            className="w-full rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3 outline-none transition focus:border-orange-500"
          />

          <button
            type="submit"
            disabled={adding || !newItemText.trim()}
            className="rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adding ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl">
            🧺
          </div>

          <p className="mt-5 text-lg font-black text-stone-950">
            Ta liste de courses est vide
          </p>

          <p className="mt-2 text-stone-600">
            Ajoute un ingrédient manuellement ou ajoute les ingrédients depuis
            une recette.
          </p>

          <Link
            to="/recipes"
            className="mt-6 inline-block rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700"
          >
            Trouver une recette
          </Link>
        </div>
      ) : (
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-bold text-orange-700">Ma liste</p>

              <h2 className="mt-1 text-2xl font-black text-stone-950">
                Ingrédients à acheter
              </h2>

              <p className="mt-2 text-stone-600">
                Coche les ingrédients au fur et à mesure de tes achats.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {checkedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteCheckedItems}
                  disabled={deletingChecked}
                  className="w-fit rounded-2xl border border-red-200 bg-white px-5 py-3 font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingChecked ? 'Suppression...' : 'Supprimer les cochés'}
                </button>
              )}

              <button
                type="button"
                onClick={handleDeleteAllItems}
                disabled={deletingAll}
                className="w-fit rounded-2xl border border-orange-100 bg-[#fffaf5] px-5 py-3 font-bold text-stone-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingAll ? 'Suppression...' : 'Vider la liste'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition ${
                  item.checked
                    ? 'bg-stone-50 text-stone-400'
                    : 'bg-[#fff5ec] text-stone-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleItem(item)}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-black transition ${
                    item.checked
                      ? 'border-orange-600 bg-orange-600 text-white'
                      : 'border-orange-200 bg-white text-transparent hover:border-orange-500'
                  }`}
                  aria-label={
                    item.checked
                      ? 'Marquer comme non acheté'
                      : 'Marquer comme acheté'
                  }
                >
                  ✓
                </button>

                <p
                  className={`flex-1 font-bold ${
                    item.checked
                      ? 'text-stone-400 line-through'
                      : 'text-stone-800'
                  }`}
                >
                  {item.text}
                </p>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="rounded-xl px-3 py-2 text-sm font-bold text-stone-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}