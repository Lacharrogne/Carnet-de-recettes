import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import {
  addShoppingListItem,
  deleteAllShoppingListItems,
  deleteCheckedShoppingListItems,
  deleteShoppingListItem,
  getShoppingListItems,
  type ShoppingListItem,
  updateShoppingListItemChecked,
} from '../services/shoppingList'

type ShoppingCategory = {
  label: string
  emoji: string
  terms: string[]
}

type ParsedShoppingItem = ShoppingListItem & {
  category: string
  categoryEmoji: string
  normalizedName: string
  displayName: string
}

type ShoppingGroup = {
  key: string
  category: string
  categoryEmoji: string
  displayName: string
  checked: boolean
  items: ParsedShoppingItem[]
}

const CATEGORIES: ShoppingCategory[] = [
  {
    label: 'Fruits et légumes',
    emoji: '🥦',
    terms: [
      'ail',
      'aubergine',
      'avocat',
      'banane',
      'carotte',
      'champignon',
      'citron',
      'concombre',
      'courgette',
      'echalote',
      'fraise',
      'framboise',
      'legume',
      'melon',
      'oignon',
      'orange',
      'poire',
      'poireau',
      'poivron',
      'pomme',
      'pomme de terre',
      'salade',
      'tomate',
    ],
  },
  {
    label: 'Viandes et poissons',
    emoji: '🥩',
    terms: [
      'bacon',
      'boeuf',
      'canard',
      'dinde',
      'jambon',
      'lardon',
      'merguez',
      'poisson',
      'porc',
      'poulet',
      'saumon',
      'thon',
      'viande',
    ],
  },
  {
    label: 'Crèmerie',
    emoji: '🥛',
    terms: [
      'beurre',
      'cheddar',
      'comte',
      'creme',
      'emmental',
      'fromage',
      'gruyere',
      'lait',
      'mozzarella',
      'oeuf',
      'parmesan',
      'yaourt',
    ],
  },
  {
    label: 'Épicerie salée',
    emoji: '🧂',
    terms: [
      'bouillon',
      'farine',
      'huile',
      'lentille',
      'mais',
      'moutarde',
      'olive',
      'pate',
      'pates',
      'poivre',
      'quinoa',
      'riz',
      'sel',
      'semoule',
      'sauce',
      'vinaigre',
    ],
  },
  {
    label: 'Épicerie sucrée',
    emoji: '🍫',
    terms: [
      'amande',
      'biscuit',
      'cacao',
      'caramel',
      'chocolat',
      'levure',
      'miel',
      'noisette',
      'sucre',
      'vanille',
    ],
  },
  {
    label: 'Surgelés',
    emoji: '❄️',
    terms: ['surgele', 'surgeles', 'glace'],
  },
  {
    label: 'Boissons',
    emoji: '🥤',
    terms: ['cafe', 'coca', 'eau', 'jus', 'limonade', 'sirop', 'the'],
  },
  {
    label: 'Autres',
    emoji: '🛒',
    terms: [],
  },
]

const STOP_WORDS = [
  'de',
  'du',
  'des',
  'd',
  'la',
  'le',
  'les',
  'un',
  'une',
  'a',
  'au',
  'aux',
  'et',
]

const UNIT_WORDS = [
  'g',
  'gr',
  'gramme',
  'grammes',
  'kg',
  'kilo',
  'kilos',
  'ml',
  'cl',
  'l',
  'litre',
  'litres',
  'cuillere',
  'cuilleres',
  'cafe',
  'soupe',
  'cas',
  'cac',
  'pincee',
  'pincees',
  'tranche',
  'tranches',
  'boite',
  'boites',
  'sachet',
  'sachets',
  'verre',
  'verres',
  'boule',
  'boules',
]

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function singularizeText(value: string) {
  return value
    .split(' ')
    .map((word) => {
      if (word.length > 3 && word.endsWith('s')) {
        return word.slice(0, -1)
      }

      return word
    })
    .join(' ')
}

function cleanIngredientName(value: string) {
  const normalizedValue = normalizeText(value)
  const words = normalizedValue
    .split(' ')
    .filter((word) => {
      if (!word) return false
      if (/^\d+([.,]\d+)?$/.test(word)) return false
      if (UNIT_WORDS.includes(word)) return false
      if (STOP_WORDS.includes(word)) return false

      return true
    })

  return singularizeText(words.join(' '))
}

function formatDisplayName(value: string) {
  const cleanedName = cleanIngredientName(value)

  if (!cleanedName) {
    return value.trim()
  }

  return cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1)
}

function getCategoryForItem(value: string) {
  const normalizedValue = cleanIngredientName(value)

  const category =
    CATEGORIES.find((currentCategory) =>
      currentCategory.terms.some((term) => normalizedValue.includes(term)),
    ) ?? CATEGORIES[CATEGORIES.length - 1]

  return category
}

function parseShoppingItem(item: ShoppingListItem): ParsedShoppingItem {
  const category = getCategoryForItem(item.text)
  const normalizedName = cleanIngredientName(item.text) || normalizeText(item.text)

  return {
    ...item,
    category: category.label,
    categoryEmoji: category.emoji,
    normalizedName,
    displayName: formatDisplayName(item.text),
  }
}

function groupShoppingListItems(items: ShoppingListItem[]) {
  const groupsByKey = new Map<string, ShoppingGroup>()

  items.map(parseShoppingItem).forEach((parsedItem) => {
    const key = `${parsedItem.checked ? 'checked' : 'unchecked'}-${
      parsedItem.category
    }-${parsedItem.normalizedName}`

    const currentGroup = groupsByKey.get(key)

    if (currentGroup) {
      currentGroup.items.push(parsedItem)
      return
    }

    groupsByKey.set(key, {
      key,
      category: parsedItem.category,
      categoryEmoji: parsedItem.categoryEmoji,
      displayName: parsedItem.displayName,
      checked: parsedItem.checked,
      items: [parsedItem],
    })
  })

  return Array.from(groupsByKey.values()).sort((firstGroup, secondGroup) => {
    const firstCategoryIndex = CATEGORIES.findIndex(
      (category) => category.label === firstGroup.category,
    )

    const secondCategoryIndex = CATEGORIES.findIndex(
      (category) => category.label === secondGroup.category,
    )

    if (firstCategoryIndex !== secondCategoryIndex) {
      return firstCategoryIndex - secondCategoryIndex
    }

    return firstGroup.displayName.localeCompare(secondGroup.displayName, 'fr')
  })
}

function getCurrentDateLabel() {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

export default function ShoppingListPage() {
  const { user } = useAuth()

  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [newItemText, setNewItemText] = useState('')
  const [hasLoaded, setHasLoaded] = useState(false)

  const [adding, setAdding] = useState(false)
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showCheckedItems, setShowCheckedItems] = useState(true)

  useEffect(() => {
    let ignore = false

    if (!user) {
      return
    }

    getShoppingListItems()
      .then((data) => {
        if (!ignore) {
          setItems(data)
          setErrorMessage('')
        }
      })
      .catch((error) => {
        console.error(error)

        if (!ignore) {
          setErrorMessage('Impossible de charger la liste de courses.')
        }
      })
      .finally(() => {
        if (!ignore) {
          setHasLoaded(true)
        }
      })

    return () => {
      ignore = true
    }
  }, [user])

  const activeItems = useMemo(() => {
    return items.filter((item) => !item.checked)
  }, [items])

  const checkedItems = useMemo(() => {
    return items.filter((item) => item.checked)
  }, [items])

  const activeGroups = useMemo(() => {
    return groupShoppingListItems(activeItems)
  }, [activeItems])

  const checkedGroups = useMemo(() => {
    return groupShoppingListItems(checkedItems)
  }, [checkedItems])

  const activeCategoryCount = useMemo(() => {
    return new Set(activeGroups.map((group) => group.category)).size
  }, [activeGroups])

  const loading = !!user && !hasLoaded

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanedText = newItemText.trim()

    if (!cleanedText) {
      setErrorMessage('Écris un ingrédient avant de l’ajouter.')
      return
    }

    try {
      setAdding(true)
      setErrorMessage('')
      setSuccessMessage('')

      const createdItem = await addShoppingListItem(cleanedText)

      setItems((currentItems) => [createdItem, ...currentItems])
      setNewItemText('')
      setSuccessMessage('Ingrédient ajouté à ta liste de courses.')
    } catch (error) {
      console.error(error)
      setSuccessMessage('')
      setErrorMessage('Impossible d’ajouter cet ingrédient.')
    } finally {
      setAdding(false)
    }
  }

  async function handleToggleItem(item: ShoppingListItem) {
    try {
      setUpdatingItemId(item.id)
      setErrorMessage('')
      setSuccessMessage('')

      const updatedItem = await updateShoppingListItemChecked(
        item.id,
        !item.checked,
      )

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id ? updatedItem : currentItem,
        ),
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de modifier cet ingrédient.')
    } finally {
      setUpdatingItemId(null)
    }
  }

  async function handleToggleGroup(group: ShoppingGroup) {
    try {
      setBulkActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      const nextCheckedValue = !group.checked

      const updatedItems = await Promise.all(
        group.items.map((item) =>
          updateShoppingListItemChecked(item.id, nextCheckedValue),
        ),
      )

      setItems((currentItems) =>
        currentItems.map((currentItem) => {
          const updatedItem = updatedItems.find(
            (item) => item.id === currentItem.id,
          )

          return updatedItem ?? currentItem
        }),
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de modifier ce groupe d’ingrédients.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  async function handleDeleteItem(itemId: number) {
    try {
      setDeletingItemId(itemId)
      setErrorMessage('')
      setSuccessMessage('')

      await deleteShoppingListItem(itemId)

      setItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.id !== itemId),
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer cet ingrédient.')
    } finally {
      setDeletingItemId(null)
    }
  }

  async function handleDeleteGroup(group: ShoppingGroup) {
    const confirmDelete = window.confirm(
      `Supprimer "${group.displayName}" de la liste de courses ?`,
    )

    if (!confirmDelete) {
      return
    }

    try {
      setBulkActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      await Promise.all(group.items.map((item) => deleteShoppingListItem(item.id)))

      const deletedIds = new Set(group.items.map((item) => item.id))

      setItems((currentItems) =>
        currentItems.filter((item) => !deletedIds.has(item.id)),
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer ce groupe d’ingrédients.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  async function handleDeleteCheckedItems() {
    if (checkedItems.length === 0) {
      return
    }

    const confirmDelete = window.confirm(
      'Supprimer tous les ingrédients cochés ?',
    )

    if (!confirmDelete) {
      return
    }

    try {
      setBulkActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      await deleteCheckedShoppingListItems()

      setItems((currentItems) =>
        currentItems.filter((currentItem) => !currentItem.checked),
      )

      setSuccessMessage('Les ingrédients cochés ont été supprimés.')
    } catch (error) {
      console.error(error)
      setSuccessMessage('')
      setErrorMessage('Impossible de supprimer les ingrédients cochés.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  async function handleDeleteAllItems() {
    if (items.length === 0) {
      return
    }

    const confirmDelete = window.confirm(
      'Voulez-vous vraiment vider toute la liste de courses ?',
    )

    if (!confirmDelete) {
      return
    }

    try {
      setBulkActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      await deleteAllShoppingListItems()

      setItems([])
      setSuccessMessage('La liste de courses a été vidée.')
    } catch (error) {
      console.error(error)
      setSuccessMessage('')
      setErrorMessage('Impossible de vider la liste de courses.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  if (!user) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 text-center shadow-sm ring-1 ring-orange-100">
        <p className="text-2xl font-black text-stone-950">
          Connecte-toi pour voir ta liste de courses.
        </p>

        <p className="mx-auto mt-3 max-w-xl text-stone-600">
          Ta liste de courses est liée à ton compte pour pouvoir la retrouver
          plus tard.
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

  return (
    <>
      <style>
        {`
          .print-shopping-list {
            display: none;
          }

          @media print {
            @page {
              size: A4;
              margin: 12mm;
            }

            html,
            body {
              background: white !important;
            }

            header,
            footer,
            .screen-shopping-list {
              display: none !important;
            }

            .print-shopping-list {
              display: block !important;
              color: #1c1917 !important;
              font-family: Arial, sans-serif !important;
            }

            .print-shopping-list * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .print-no-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      <section className="screen-shopping-list space-y-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2.5rem] bg-[#fffaf3] p-8 shadow-sm ring-1 ring-orange-100">
            <div className="mb-6 flex w-fit items-center gap-3 rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-orange-700">
              <span>🛒</span>
              <span>Liste de courses</span>
            </div>

            <h1 className="text-4xl font-black leading-tight text-stone-950 md:text-6xl">
              Fais tes courses sans rien oublier.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
              Les ingrédients ajoutés depuis les recettes et le planning se
              regroupent ici. Tu peux cocher ce que tu as déjà mis dans ton
              panier.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
                <p className="text-3xl font-black text-orange-600">
                  {activeItems.length}
                </p>

                <p className="mt-1 text-sm font-bold text-stone-700">
                  à acheter
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
                <p className="text-3xl font-black text-green-700">
                  {checkedItems.length}
                </p>

                <p className="mt-1 text-sm font-bold text-stone-700">
                  cochés
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
                <p className="text-3xl font-black text-stone-900">
                  {activeCategoryCount}
                </p>

                <p className="mt-1 text-sm font-bold text-stone-700">
                  rayons
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handlePrint}
                disabled={items.length === 0}
                className="rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Imprimer la liste
              </button>

              <button
                type="button"
                onClick={() => setShowCheckedItems((current) => !current)}
                className="rounded-full border border-orange-200 bg-white px-6 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
              >
                {showCheckedItems ? 'Masquer les cochés' : 'Afficher les cochés'}
              </button>

              <button
                type="button"
                onClick={handleDeleteCheckedItems}
                disabled={checkedItems.length === 0 || bulkActionLoading}
                className="rounded-full border border-orange-100 bg-white px-6 py-3 font-bold text-stone-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Supprimer les cochés
              </button>

              <button
                type="button"
                onClick={handleDeleteAllItems}
                disabled={items.length === 0 || bulkActionLoading}
                className="rounded-full border border-red-100 bg-white px-6 py-3 font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Vider la liste
              </button>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <p className="text-sm font-black uppercase tracking-wide text-orange-600">
              Ajouter rapidement
            </p>

            <h2 className="mt-2 text-3xl font-black text-stone-950">
              Ajouter un ingrédient
            </h2>

            <p className="mt-2 text-stone-600">
              Pratique pour ajouter ce qui ne vient pas directement d’une
              recette.
            </p>

            <form onSubmit={handleAddItem} className="mt-6 flex flex-col gap-3">
              <input
                value={newItemText}
                onChange={(event) => {
                  setNewItemText(event.target.value)
                  setErrorMessage('')
                  setSuccessMessage('')
                }}
                placeholder="Exemple : 6 œufs, lait, tomates..."
                className="rounded-[1.5rem] border border-orange-100 bg-[#fffaf3] px-5 py-4 font-semibold text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              />

              <button
                type="submit"
                disabled={adding}
                className="rounded-full bg-orange-500 px-6 py-4 font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adding ? 'Ajout en cours...' : 'Ajouter à la liste'}
              </button>
            </form>

            <div className="mt-6 rounded-[1.5rem] bg-orange-50 p-5 text-sm leading-7 text-orange-900">
              <p className="font-black">Astuce</p>

              <p>
                Tu peux aussi ajouter les ingrédients depuis une recette ou
                depuis le planning. La liste se mettra à jour automatiquement.
              </p>
            </div>
          </div>
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

        {loading ? (
          <div className="rounded-[2rem] bg-white p-8 text-stone-600 shadow-sm ring-1 ring-orange-100">
            Chargement de la liste de courses...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[2.5rem] bg-white p-10 text-center shadow-sm ring-1 ring-orange-100">
            <p className="text-5xl">🧺</p>

            <h2 className="mt-4 text-3xl font-black text-stone-950">
              Ta liste est vide.
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-stone-600">
              Ajoute un ingrédient manuellement, ou ajoute une recette depuis le
              planning pour générer automatiquement les courses.
            </p>

            <Link
              to="/recipes"
              className="mt-6 inline-flex rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600"
            >
              Parcourir les recettes
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                    À acheter
                  </p>

                  <h2 className="text-3xl font-black text-stone-950">
                    Courses restantes
                  </h2>
                </div>

                <p className="rounded-full bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
                  {activeItems.length} ingrédient
                  {activeItems.length > 1 ? 's' : ''}
                </p>
              </div>

              {activeGroups.length === 0 ? (
                <div className="rounded-[1.5rem] bg-green-50 p-6 text-green-800">
                  <p className="font-black">Tout est coché.</p>

                  <p className="mt-1 text-sm">
                    Tu peux supprimer les ingrédients cochés ou garder
                    l’historique pour le moment.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {activeGroups.map((group) => (
                    <div
                      key={group.key}
                      className="rounded-[2rem] bg-[#fffaf3] p-5 shadow-sm ring-1 ring-orange-100"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-black text-orange-600">
                            {group.categoryEmoji} {group.category}
                          </p>

                          <h3 className="mt-1 text-xl font-black text-stone-950">
                            {group.displayName}
                          </h3>

                          {group.items.length > 1 && (
                            <p className="mt-1 text-sm font-semibold text-stone-500">
                              {group.items.length} lignes regroupées
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleGroup(group)}
                          disabled={bulkActionLoading}
                          className="rounded-full bg-white px-4 py-2 text-sm font-black text-green-700 shadow-sm ring-1 ring-green-100 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cocher
                        </button>
                      </div>

                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-[1.25rem] bg-white px-4 py-3 shadow-sm ring-1 ring-orange-50"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleItem(item)}
                              disabled={updatingItemId === item.id}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-200 text-sm font-black text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Cocher ${item.text}`}
                            >
                              ✓
                            </button>

                            <span className="flex-1 font-semibold text-stone-800">
                              {item.text}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={deletingItemId === item.id}
                              className="text-sm font-black text-red-500 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Supprimer
                            </button>
                          </div>
                        ))}
                      </div>

                      {group.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(group)}
                          disabled={bulkActionLoading}
                          className="mt-4 text-sm font-black text-red-500 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Supprimer tout le groupe
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {showCheckedItems && checkedGroups.length > 0 && (
              <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-green-100">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-green-700">
                      Déjà pris
                    </p>

                    <h2 className="text-3xl font-black text-stone-950">
                      Ingrédients cochés
                    </h2>
                  </div>

                  <p className="rounded-full bg-green-50 px-4 py-2 text-sm font-black text-green-700">
                    {checkedItems.length} coché
                    {checkedItems.length > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {checkedGroups.map((group) => (
                    <div
                      key={group.key}
                      className="rounded-[1.5rem] bg-green-50 p-4 ring-1 ring-green-100"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-green-700">
                            {group.categoryEmoji} {group.category}
                          </p>

                          <h3 className="text-lg font-black text-stone-700 line-through decoration-green-600/60">
                            {group.displayName}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleGroup(group)}
                          disabled={bulkActionLoading}
                          className="rounded-full bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remettre
                        </button>
                      </div>

                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm"
                          >
                            <span className="font-semibold text-stone-500 line-through">
                              {item.text}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={deletingItemId === item.id}
                              className="font-black text-red-500 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Supprimer
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </section>

      <section className="print-shopping-list">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src="/ChatGPT Image 1 mai 2026, 04_35_16.png"
            alt="Carnet de recettes"
            style={{
              width: 58,
              height: 58,
              objectFit: 'contain',
              borderRadius: 18,
            }}
          />

          <div>
            <p
              style={{
                margin: 0,
                color: '#ea580c',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Carnet de recettes
            </p>

            <h1
              style={{
                margin: '4px 0 0',
                fontSize: 30,
                lineHeight: 1.1,
                fontWeight: 900,
              }}
            >
              Liste de courses
            </h1>

            <p style={{ margin: '6px 0 0', color: '#57534e', fontSize: 12 }}>
              Imprimée le {getCurrentDateLabel()}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginTop: 22,
            paddingTop: 16,
            borderTop: '1px solid #fed7aa',
          }}
        >
          <div
            style={{
              border: '1px solid #fed7aa',
              borderRadius: 14,
              padding: 12,
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#ea580c',
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              {activeItems.length}
            </p>

            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700 }}>
              ingrédients à acheter
            </p>
          </div>

          <div
            style={{
              border: '1px solid #fed7aa',
              borderRadius: 14,
              padding: 12,
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#166534',
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              {checkedItems.length}
            </p>

            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700 }}>
              déjà cochés
            </p>
          </div>

          <div
            style={{
              border: '1px solid #fed7aa',
              borderRadius: 14,
              padding: 12,
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#1c1917',
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              {activeCategoryCount}
            </p>

            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700 }}>
              rayons
            </p>
          </div>
        </div>

        <div style={{ marginTop: 26 }}>
          <p
            style={{
              margin: 0,
              color: '#ea580c',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            À acheter
          </p>

          <h2
            style={{
              margin: '4px 0 14px',
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            Liste organisée par rayon
          </h2>

          {activeGroups.length === 0 ? (
            <div
              style={{
                border: '1px solid #bbf7d0',
                borderRadius: 14,
                padding: 16,
                color: '#166534',
                fontWeight: 800,
              }}
            >
              Tout est déjà coché.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              {activeGroups.map((group) => (
                <div
                  key={group.key}
                  className="print-no-break"
                  style={{
                    border: '1px solid #fed7aa',
                    borderRadius: 16,
                    padding: 14,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: '#ea580c',
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {group.categoryEmoji} {group.category}
                  </p>

                  <h3
                    style={{
                      margin: '6px 0 10px',
                      fontSize: 17,
                      fontWeight: 900,
                    }}
                  >
                    □ {group.displayName}
                  </h3>

                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      color: '#44403c',
                      fontSize: 12,
                      lineHeight: 1.7,
                    }}
                  >
                    {group.items.map((item) => (
                      <li key={item.id}>{item.text}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {checkedGroups.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <p
              style={{
                margin: 0,
                color: '#166534',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Déjà pris
            </p>

            <h2
              style={{
                margin: '4px 0 14px',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              Ingrédients cochés
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              {checkedGroups.map((group) => (
                <div
                  key={group.key}
                  className="print-no-break"
                  style={{
                    border: '1px solid #bbf7d0',
                    borderRadius: 14,
                    padding: 12,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: '#166534',
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {group.categoryEmoji} {group.category}
                  </p>

                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: 14,
                      fontWeight: 800,
                      textDecoration: 'line-through',
                      color: '#57534e',
                    }}
                  >
                    ☑ {group.displayName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  )
}