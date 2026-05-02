import { useEffect, useMemo, useState } from 'react'
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

type AisleCategoryKey =
  | 'fruits-legumes'
  | 'produits-frais'
  | 'epicerie'
  | 'viande-poisson'
  | 'boissons'
  | 'surgeles'
  | 'autres'

type AisleCategory = {
  key: AisleCategoryKey
  label: string
  emoji: string
  keywords: string[]
}

type ParsedShoppingItem = {
  item: ShoppingListItem
  checked: boolean
  quantity: number | null
  unit: string
  displayName: string
  normalizedName: string
  category: AisleCategory
}

type GroupedShoppingItem = {
  key: string
  ids: number[]
  checked: boolean
  category: AisleCategory
  displayText: string
  items: ParsedShoppingItem[]
}

const AISLE_CATEGORIES: AisleCategory[] = [
  {
    key: 'fruits-legumes',
    label: 'Fruits et légumes',
    emoji: '🥦',
    keywords: [
      'tomate',
      'tomates',
      'courgette',
      'courgettes',
      'carotte',
      'carottes',
      'oignon',
      'oignons',
      'ail',
      'pomme',
      'pommes',
      'banane',
      'bananes',
      'salade',
      'citron',
      'citrons',
      'fraise',
      'fraises',
      'poireau',
      'poireaux',
      'champignon',
      'champignons',
      'pomme de terre',
      'pommes de terre',
      'patate',
      'patates',
    ],
  },
  {
    key: 'produits-frais',
    label: 'Produits frais',
    emoji: '🧀',
    keywords: [
      'lait',
      'beurre',
      'creme',
      'crème',
      'fromage',
      'mozzarella',
      'yaourt',
      'yaourts',
      'oeuf',
      'oeufs',
      'œuf',
      'œufs',
      'jambon',
      'lardons',
      'parmesan',
      'emmental',
      'gruyere',
      'gruyère',
    ],
  },
  {
    key: 'epicerie',
    label: 'Épicerie',
    emoji: '🥫',
    keywords: [
      'pate',
      'pates',
      'pâtes',
      'riz',
      'farine',
      'sucre',
      'sel',
      'poivre',
      'huile',
      'huile olive',
      "huile d'olive",
      'vinaigre',
      'chocolat',
      'levure',
      'conserve',
      'sauce',
      'moutarde',
      'basilic',
      'herbe',
      'herbes',
      'epice',
      'épice',
      'epices',
      'épices',
    ],
  },
  {
    key: 'viande-poisson',
    label: 'Viande / poisson',
    emoji: '🍗',
    keywords: [
      'poulet',
      'boeuf',
      'bœuf',
      'viande',
      'steak',
      'poisson',
      'saumon',
      'thon',
      'crevette',
      'crevettes',
      'porc',
      'dinde',
      'canard',
    ],
  },
  {
    key: 'boissons',
    label: 'Boissons',
    emoji: '🥤',
    keywords: [
      'eau',
      'jus',
      'coca',
      'soda',
      'lait',
      'sirop',
      'the',
      'thé',
      'cafe',
      'café',
      'boisson',
    ],
  },
  {
    key: 'surgeles',
    label: 'Surgelés',
    emoji: '❄️',
    keywords: ['surgele', 'surgelé', 'surgeles', 'surgelés', 'glace', 'glaces'],
  },
  {
    key: 'autres',
    label: 'Autres',
    emoji: '🛒',
    keywords: [],
  },
]

const UNITS = [
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
  'cuillère',
  'cuillères',
  'cuillere',
  'cuilleres',
  'càs',
  'cas',
  'c.à.s',
  'café',
  'cafe',
  'càc',
  'cac',
  'tranche',
  'tranches',
  'boîte',
  'boîtes',
  'boite',
  'boites',
  'sachet',
  'sachets',
  'verre',
  'verres',
  'pincée',
  'pincées',
  'pincee',
  'pincees',
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

function formatNumber(value: number) {
  if (Number.isInteger(value)) {
    return String(value)
  }

  return String(Math.round(value * 10) / 10).replace('.', ',')
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

function getCategoryForItem(value: string) {
  const normalizedValue = normalizeText(value)

  return (
    AISLE_CATEGORIES.find((category) =>
      category.keywords.some((keyword) =>
        normalizedValue.includes(normalizeText(keyword)),
      ),
    ) ?? AISLE_CATEGORIES[AISLE_CATEGORIES.length - 1]
  )
}

function cleanIngredientName(value: string) {
  return normalizeText(value)
    .replace(/\b(de|du|des|d|la|le|les|un|une|a|au|aux|et|ou)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseShoppingItem(item: ShoppingListItem): ParsedShoppingItem {
  const cleanedText = item.text.trim()
  const unitPattern = UNITS.join('|')

  const match = cleanedText.match(
    new RegExp(
      `^(\\d+(?:[,.]\\d+)?)\\s*(${unitPattern})?\\s*(?:de|d’|d'|du|des)?\\s*(.+)$`,
      'i',
    ),
  )

  const quantity = match ? Number(match[1].replace(',', '.')) : null
  const unit = match?.[2] ?? ''
  const displayName = match?.[3]?.trim() || cleanedText
  const normalizedName = singularizeText(cleanIngredientName(displayName))
  const category = getCategoryForItem(cleanedText)

  return {
    item,
    checked: item.checked,
    quantity: Number.isNaN(quantity) ? null : quantity,
    unit,
    displayName,
    normalizedName,
    category,
  }
}

function buildGroupDisplayText(parsedItems: ParsedShoppingItem[]) {
  const firstItem = parsedItems[0]

  if (!firstItem) {
    return ''
  }

  const sameUnit = parsedItems.every(
    (parsedItem) =>
      normalizeText(parsedItem.unit) === normalizeText(firstItem.unit),
  )

  const canAddQuantities =
    sameUnit && parsedItems.every((parsedItem) => parsedItem.quantity !== null)

  if (canAddQuantities) {
    const totalQuantity = parsedItems.reduce(
      (sum, parsedItem) => sum + (parsedItem.quantity ?? 0),
      0,
    )

    return `${formatNumber(totalQuantity)} ${
      firstItem.unit ? `${firstItem.unit} ` : ''
    }${firstItem.displayName}`.trim()
  }

  if (parsedItems.length > 1) {
    return `${parsedItems.length} × ${firstItem.displayName}`
  }

  return firstItem.item.text
}

function groupShoppingListItems(items: ShoppingListItem[]) {
  const parsedItems = items.map(parseShoppingItem)
  const groupsByKey = new Map<string, ParsedShoppingItem[]>()

  parsedItems.forEach((parsedItem) => {
    const key = `${parsedItem.checked ? 'checked' : 'unchecked'}-${
      parsedItem.category.key
    }-${parsedItem.normalizedName}`

    const currentGroup = groupsByKey.get(key) ?? []
    groupsByKey.set(key, [...currentGroup, parsedItem])
  })

  return Array.from(groupsByKey.entries())
    .map(([key, groupItems]) => {
      const firstParsedItem = groupItems[0]

      return {
        key,
        ids: groupItems.map((groupItem) => groupItem.item.id),
        checked: firstParsedItem.checked,
        category: firstParsedItem.category,
        displayText: buildGroupDisplayText(groupItems),
        items: groupItems,
      }
    })
    .sort((firstGroup, secondGroup) => {
      if (firstGroup.checked !== secondGroup.checked) {
        return firstGroup.checked ? 1 : -1
      }

      return firstGroup.category.label.localeCompare(secondGroup.category.label)
    })
}

function getGroupedItemsByCategory(groups: GroupedShoppingItem[]) {
  return AISLE_CATEGORIES.map((category) => ({
    category,
    groups: groups.filter((group) => group.category.key === category.key),
  })).filter((section) => section.groups.length > 0)
}

export default function ShoppingListPage() {
  const { user } = useAuth()

  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [newItemText, setNewItemText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [user])

  const groupedItems = useMemo(() => {
    return groupShoppingListItems(items)
  }, [items])

  const groupedItemsByCategory = useMemo(() => {
    return getGroupedItemsByCategory(groupedItems)
  }, [groupedItems])

  const checkedItemsCount = items.filter((item) => item.checked).length
  const uncheckedItemsCount = items.length - checkedItemsCount
  const progress =
    items.length > 0 ? Math.round((checkedItemsCount / items.length) * 100) : 0

  async function handleAddItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanedText = newItemText.trim()

    if (!cleanedText) {
      return
    }

    try {
      setSaving(true)
      setErrorMessage('')
      setSuccessMessage('')

      const createdItem = await addShoppingListItem(cleanedText)

      setItems((currentItems) => [createdItem, ...currentItems])
      setNewItemText('')
      setSuccessMessage('Ingrédient ajouté à la liste.')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible d’ajouter cet ingrédient.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleGroup(group: GroupedShoppingItem) {
    try {
      setErrorMessage('')
      setSuccessMessage('')

      const nextCheckedValue = !group.checked

      await Promise.all(
        group.ids.map((id) => updateShoppingListItemChecked(id, nextCheckedValue)),
      )

      setItems((currentItems) =>
        currentItems.map((item) =>
          group.ids.includes(item.id)
            ? { ...item, checked: nextCheckedValue }
            : item,
        ),
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de modifier cet ingrédient.')
    }
  }

  async function handleDeleteGroup(group: GroupedShoppingItem) {
    try {
      setErrorMessage('')
      setSuccessMessage('')

      await Promise.all(group.ids.map((id) => deleteShoppingListItem(id)))

      setItems((currentItems) =>
        currentItems.filter((item) => !group.ids.includes(item.id)),
      )

      setSuccessMessage('Ingrédient supprimé de la liste.')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer cet ingrédient.')
    }
  }

  async function handleDeleteCheckedItems() {
    if (checkedItemsCount === 0) {
      return
    }

    const confirmDelete = window.confirm(
      'Supprimer tous les ingrédients déjà cochés ?',
    )

    if (!confirmDelete) {
      return
    }

    try {
      setErrorMessage('')
      setSuccessMessage('')

      await deleteCheckedShoppingListItems()

      setItems((currentItems) => currentItems.filter((item) => !item.checked))
      setSuccessMessage('Les ingrédients cochés ont été supprimés.')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer les ingrédients cochés.')
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
      setErrorMessage('')
      setSuccessMessage('')

      await deleteAllShoppingListItems()

      setItems([])
      setSuccessMessage('La liste de courses a été vidée.')
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de vider la liste de courses.')
    }
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-3xl rounded-[2.5rem] bg-[#fffaf3] px-6 py-10 text-center shadow-sm ring-1 ring-orange-100">
        <p className="text-sm font-black uppercase tracking-wide text-orange-600">
          Liste de courses
        </p>

        <h1 className="mt-3 text-4xl font-black text-stone-950">
          Connecte-toi pour accéder à ta liste.
        </h1>

        <p className="mt-4 text-lg leading-8 text-stone-600">
          Ta liste de courses est personnelle. Elle se remplit avec les recettes
          que tu ajoutes depuis le site.
        </p>

        <Link
          to="/auth"
          className="mt-8 inline-flex rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600"
        >
          Aller à la connexion
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-10">
      <div className="overflow-hidden rounded-[2.5rem] bg-[#fffaf3] shadow-sm ring-1 ring-orange-100">
        <div className="grid gap-10 px-6 py-10 lg:grid-cols-[1fr_0.8fr] lg:px-12 lg:py-14">
          <div>
            <div className="mb-6 flex w-fit items-center gap-3 rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-orange-700">
              <span>🛒</span>
              <span>Liste de courses</span>
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight text-stone-950 md:text-6xl">
              Tout ce qu’il te faut pour cuisiner.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
              Ajoute des ingrédients à la main ou laisse le planning et les
              recettes remplir automatiquement ta liste. Les ingrédients sont
              regroupés par rayon pour faire les courses plus vite.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDeleteCheckedItems}
                disabled={checkedItemsCount === 0}
                className="rounded-full border border-orange-200 bg-white px-6 py-3 font-bold text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Supprimer les cochés
              </button>

              <button
                type="button"
                onClick={handleDeleteAllItems}
                disabled={items.length === 0}
                className="rounded-full border border-red-100 bg-white px-6 py-3 font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Vider la liste
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
              Progression
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-[1.4rem] bg-[#fffaf3] p-4 ring-1 ring-orange-100">
                <p className="text-3xl font-black text-orange-600">
                  {items.length}
                </p>
                <p className="text-sm font-bold text-stone-600">ingrédients</p>
              </div>

              <div className="rounded-[1.4rem] bg-[#fffaf3] p-4 ring-1 ring-orange-100">
                <p className="text-3xl font-black text-green-700">
                  {checkedItemsCount}
                </p>
                <p className="text-sm font-bold text-stone-600">achetés</p>
              </div>

              <div className="rounded-[1.4rem] bg-[#fffaf3] p-4 ring-1 ring-orange-100">
                <p className="text-3xl font-black text-stone-950">
                  {uncheckedItemsCount}
                </p>
                <p className="text-sm font-bold text-stone-600">restants</p>
              </div>
            </div>

            <div className="mt-6 rounded-full bg-[#fff1e6] p-2">
              <div
                className="h-4 rounded-full bg-orange-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-3 text-sm font-bold text-stone-500">
              {progress} % de la liste est déjà cochée.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleAddItem}
        className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100"
      >
        <p className="font-bold text-orange-600">Ajout manuel</p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={newItemText}
            onChange={(event) => {
              setNewItemText(event.target.value)
              setErrorMessage('')
              setSuccessMessage('')
            }}
            placeholder="Exemple : 3 tomates, 500 g de farine, lait..."
            className="rounded-2xl border border-orange-100 bg-[#fffaf3] px-5 py-4 font-semibold text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          />

          <button
            type="submit"
            disabled={saving || !newItemText.trim()}
            className="rounded-2xl bg-orange-500 px-6 py-4 font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
      </form>

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
        <div className="rounded-[2rem] bg-white p-10 text-center shadow-sm ring-1 ring-orange-100">
          <p className="text-5xl">🛒</p>

          <h2 className="mt-4 text-3xl font-black text-stone-950">
            Ta liste est vide.
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-stone-600">
            Ajoute un ingrédient à la main, ajoute une recette à ton planning ou
            clique sur les ingrédients d’une fiche recette.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/recipes"
              className="rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600"
            >
              Parcourir les recettes
            </Link>

            <Link
              to="/planning"
              className="rounded-full border border-orange-200 bg-white px-6 py-3 font-black text-orange-700 transition hover:bg-orange-50"
            >
              Voir le planning
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedItemsByCategory.map(({ category, groups }) => (
            <section
              key={category.key}
              className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                    Rayon
                  </p>

                  <h2 className="text-2xl font-black text-stone-950">
                    {category.emoji} {category.label}
                  </h2>
                </div>

                <span className="rounded-full bg-[#fffaf3] px-4 py-2 text-sm font-black text-stone-700 ring-1 ring-orange-100">
                  {groups.length} élément{groups.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid gap-3">
                {groups.map((group) => (
                  <div
                    key={group.key}
                    className={`flex flex-wrap items-center gap-3 rounded-[1.5rem] px-4 py-4 ring-1 transition ${
                      group.checked
                        ? 'bg-green-50 text-green-800 ring-green-100'
                        : 'bg-[#fffaf3] text-stone-800 ring-orange-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleGroup(group)}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-black transition ${
                        group.checked
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-orange-600 ring-1 ring-orange-100 hover:bg-orange-50'
                      }`}
                      aria-label={
                        group.checked
                          ? 'Marquer comme non acheté'
                          : 'Marquer comme acheté'
                      }
                    >
                      {group.checked ? '✓' : ''}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-black ${
                          group.checked ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {group.displayText}
                      </p>

                      {group.items.length > 1 && (
                        <p className="mt-1 text-sm font-semibold text-stone-500">
                          Regroupe {group.items.length} lignes similaires.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group)}
                      className="rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-600 transition hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}