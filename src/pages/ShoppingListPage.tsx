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

type ShoppingCategory =
  | 'Fruits & légumes'
  | 'Produits frais'
  | 'Viande / poisson'
  | 'Épicerie'
  | 'Boissons'
  | 'Autres'

type ParsedShoppingItem = {
  item: ShoppingListItem
  quantity: number | null
  unit: string
  name: string
  normalizedName: string
  category: ShoppingCategory
}

type ShoppingListGroup = {
  key: string
  name: string
  displayText: string
  category: ShoppingCategory
  items: ShoppingListItem[]
  checked: boolean
  createdAt: string
}

const CATEGORY_ORDER: ShoppingCategory[] = [
  'Fruits & légumes',
  'Produits frais',
  'Viande / poisson',
  'Épicerie',
  'Boissons',
  'Autres',
]

const CATEGORY_EMOJIS: Record<ShoppingCategory, string> = {
  'Fruits & légumes': '🥦',
  'Produits frais': '🧀',
  'Viande / poisson': '🥩',
  Épicerie: '🛒',
  Boissons: '🥤',
  Autres: '🧺',
}

const UNIT_VARIANTS: Record<string, string[]> = {
  g: ['g', 'gr', 'gramme', 'grammes'],
  kg: ['kg', 'kilo', 'kilos'],
  ml: ['ml'],
  cl: ['cl'],
  l: ['l', 'litre', 'litres'],
  tranche: ['tranche', 'tranches'],
  boîte: ['boite', 'boites', 'boîte', 'boîtes'],
  sachet: ['sachet', 'sachets'],
  pot: ['pot', 'pots'],
  paquet: ['paquet', 'paquets'],
  boule: ['boule', 'boules'],
  gousse: ['gousse', 'gousses'],
  tablette: ['tablette', 'tablettes'],
  bouteille: ['bouteille', 'bouteilles'],
}

const CATEGORY_KEYWORDS: Record<ShoppingCategory, string[]> = {
  'Fruits & légumes': [
    'tomate',
    'tomates',
    'courgette',
    'courgettes',
    'carotte',
    'carottes',
    'oignon',
    'oignons',
    'ail',
    'salade',
    'pomme',
    'pommes',
    'banane',
    'bananes',
    'citron',
    'citrons',
    'poivron',
    'poivrons',
    'champignon',
    'champignons',
    'pomme de terre',
    'pommes de terre',
    'patate',
    'patates',
    'basilic',
    'persil',
    'menthe',
  ],
  'Produits frais': [
    'oeuf',
    'oeufs',
    'œuf',
    'œufs',
    'lait',
    'beurre',
    'creme',
    'crème',
    'yaourt',
    'fromage',
    'mozzarella',
    'mozza',
    'emmental',
    'gruyere',
    'gruyère',
    'parmesan',
    'cheddar',
    'mascarpone',
    'jambon',
  ],
  'Viande / poisson': [
    'poulet',
    'boeuf',
    'bœuf',
    'steak',
    'viande',
    'saumon',
    'thon',
    'poisson',
    'crevette',
    'crevettes',
    'lardon',
    'lardons',
    'dinde',
  ],
  Épicerie: [
    'pate',
    'pates',
    'pâtes',
    'riz',
    'farine',
    'sucre',
    'sel',
    'poivre',
    'huile',
    'olive',
    'vinaigre',
    'chocolat',
    'levure',
    'moutarde',
    'mayonnaise',
    'basilic',
    'herbes',
    'épice',
    'epice',
    'paprika',
    'curry',
    'conserve',
  ],
  Boissons: [
    'eau',
    'jus',
    'soda',
    'coca',
    'limonade',
    'lait',
    'sirop',
    'the',
    'thé',
    'café',
    'cafe',
  ],
  Autres: [],
}

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

function capitalizeFirstLetter(value: string) {
  if (!value) return value

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : String(value).replace('.', ',')
}

function getCategory(name: string): ShoppingCategory {
  const normalizedName = normalizeText(name)

  const category = CATEGORY_ORDER.find((currentCategory) => {
    return CATEGORY_KEYWORDS[currentCategory].some((keyword) => {
      const normalizedKeyword = normalizeText(keyword)

      return (
        normalizedName === normalizedKeyword ||
        normalizedName.includes(normalizedKeyword) ||
        normalizedKeyword.includes(normalizedName)
      )
    })
  })

  return category ?? 'Autres'
}

function getCanonicalUnit(value: string) {
  const normalizedValue = normalizeText(value)

  const unitEntry = Object.entries(UNIT_VARIANTS).find(([, variants]) =>
    variants.some((variant) => normalizeText(variant) === normalizedValue),
  )

  return unitEntry?.[0] ?? ''
}

function removeSmallWords(value: string) {
  return normalizeText(value)
    .replace(/\b(de|du|des|d|la|le|les|un|une|a|au|aux|et|ou)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseShoppingItem(item: ShoppingListItem): ParsedShoppingItem {
  const cleanedText = item.text.trim()
  const quantityMatch = cleanedText.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/)

  let quantity: number | null = null
  let remainingText = cleanedText

  if (quantityMatch) {
    quantity = Number(quantityMatch[1].replace(',', '.'))
    remainingText = quantityMatch[2].trim()
  }

  const remainingWords = remainingText.split(/\s+/)
  const firstWord = remainingWords[0] ?? ''
  const canonicalUnit = getCanonicalUnit(firstWord)

  let unit = ''
  let name = remainingText

  if (canonicalUnit) {
    unit = canonicalUnit
    name = remainingWords.slice(1).join(' ')
  }

  name = removeSmallWords(name)

  if (!name) {
    name = removeSmallWords(cleanedText)
  }

  const normalizedName = singularizeText(normalizeText(name))

  return {
    item,
    quantity,
    unit,
    name,
    normalizedName,
    category: getCategory(name),
  }
}

function buildGroupDisplayText(parsedItems: ParsedShoppingItem[]) {
  const firstParsedItem = parsedItems[0]
  const displayName = capitalizeFirstLetter(firstParsedItem.name)
  const quantitiesByUnit = new Map<string, number>()
  let hasItemWithoutQuantity = false

  parsedItems.forEach((parsedItem) => {
    if (parsedItem.quantity === null) {
      hasItemWithoutQuantity = true
      return
    }

    const currentQuantity = quantitiesByUnit.get(parsedItem.unit) ?? 0
    quantitiesByUnit.set(parsedItem.unit, currentQuantity + parsedItem.quantity)
  })

  if (quantitiesByUnit.size === 1 && !hasItemWithoutQuantity) {
    const [[unit, quantity]] = Array.from(quantitiesByUnit.entries())
    const formattedQuantity = formatQuantity(quantity)

    if (!unit) {
      return `${formattedQuantity} ${firstParsedItem.name}`
    }

    return `${formattedQuantity} ${unit} de ${firstParsedItem.name}`
  }

  if (quantitiesByUnit.size === 0 && parsedItems.length > 1) {
    return `${displayName} ×${parsedItems.length}`
  }

  return displayName
}

function groupShoppingListItems(items: ShoppingListItem[]) {
  const parsedItems = items.map(parseShoppingItem)
  const groupsByKey = new Map<string, ParsedShoppingItem[]>()

  parsedItems.forEach((parsedItem) => {
    const key = `${parsedItem.item.checked ? 'checked' : 'unchecked'}-${
      parsedItem.category
    }-${parsedItem.normalizedName}`

    const currentGroup = groupsByKey.get(key) ?? []
    groupsByKey.set(key, [...currentGroup, parsedItem])
  })

  return Array.from(groupsByKey.entries())
    .map(([key, groupItems]) => {
      const firstParsedItem = groupItems[0]

      return {
        key,
        name: firstParsedItem.name,
        displayText: buildGroupDisplayText(groupItems),
        category: firstParsedItem.category,
        items: groupItems.map((parsedItem) => parsedItem.item),
        checked: firstParsedItem.item.checked,
        createdAt: groupItems
          .map((parsedItem) => parsedItem.item.createdAt)
          .sort()
          .at(-1) as string,
      }
    })
    .sort((firstGroup, secondGroup) => {
      const firstCategoryIndex = CATEGORY_ORDER.indexOf(firstGroup.category)
      const secondCategoryIndex = CATEGORY_ORDER.indexOf(secondGroup.category)

      if (firstCategoryIndex !== secondCategoryIndex) {
        return firstCategoryIndex - secondCategoryIndex
      }

      return firstGroup.name.localeCompare(secondGroup.name)
    })
}

function sortShoppingListItems(items: ShoppingListItem[]) {
  return [...items].sort((a, b) => {
    if (a.checked !== b.checked) {
      return Number(a.checked) - Number(b.checked)
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

function ShoppingGroupCard({
  group,
  onToggleGroup,
  onDeleteGroup,
}: {
  group: ShoppingListGroup
  onToggleGroup: (group: ShoppingListGroup) => void
  onDeleteGroup: (group: ShoppingListGroup) => void
}) {
  return (
    <div
      className={`rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 transition ${
        group.checked
          ? 'opacity-70 ring-green-100'
          : 'ring-orange-100 hover:-translate-y-0.5 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => onToggleGroup(group)}
          className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-black transition ${
            group.checked
              ? 'border-green-600 bg-green-600 text-white'
              : 'border-orange-200 bg-white text-transparent hover:border-orange-500'
          }`}
          aria-label={
            group.checked ? 'Marquer comme non acheté' : 'Marquer comme acheté'
          }
        >
          ✓
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`text-lg font-black ${
                group.checked
                  ? 'text-stone-400 line-through'
                  : 'text-stone-950'
              }`}
            >
              {group.displayText}
            </p>

            {group.items.length > 1 && (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
                {group.items.length} lignes regroupées
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {group.items.slice(0, 3).map((item) => (
              <span
                key={item.id}
                className="rounded-full bg-[#f4e8dc] px-3 py-1 text-xs font-bold text-stone-600"
              >
                {item.text}
              </span>
            ))}

            {group.items.length > 3 && (
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
                +{group.items.length - 3}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDeleteGroup(group)}
          className="rounded-xl px-3 py-2 text-sm font-bold text-stone-500 transition hover:bg-red-50 hover:text-red-600"
        >
          Supprimer
        </button>
      </div>
    </div>
  )
}

function ShoppingCategorySection({
  category,
  groups,
  onToggleGroup,
  onDeleteGroup,
}: {
  category: ShoppingCategory
  groups: ShoppingListGroup[]
  onToggleGroup: (group: ShoppingListGroup) => void
  onDeleteGroup: (group: ShoppingListGroup) => void
}) {
  if (groups.length === 0) {
    return null
  }

  return (
    <section className="rounded-[2rem] bg-[#fffaf3] p-5 shadow-sm ring-1 ring-orange-100">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="flex items-center gap-3 text-xl font-black text-stone-950">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
            {CATEGORY_EMOJIS[category]}
          </span>

          {category}
        </h3>

        <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-orange-700 shadow-sm">
          {groups.length}
        </span>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <ShoppingGroupCard
            key={group.key}
            group={group}
            onToggleGroup={onToggleGroup}
            onDeleteGroup={onDeleteGroup}
          />
        ))}
      </div>
    </section>
  )
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

  const uncheckedGroups = useMemo(() => {
    return groupShoppingListItems(uncheckedItems)
  }, [uncheckedItems])

  const checkedGroups = useMemo(() => {
    return groupShoppingListItems(checkedItems)
  }, [checkedItems])

  async function handleAddItem(event: FormEvent) {
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

  async function handleToggleGroup(group: ShoppingListGroup) {
    try {
      setErrorMessage('')
      setSuccessMessage('')

      const updatedItems = await Promise.all(
        group.items.map((item) =>
          updateShoppingListItemChecked(item.id, !group.checked),
        ),
      )

      setItems((currentItems) =>
        sortShoppingListItems(
          currentItems.map((currentItem) => {
            const updatedItem = updatedItems.find(
              (item) => item.id === currentItem.id,
            )

            return updatedItem ?? currentItem
          }),
        ),
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de modifier ce groupe d’ingrédients.')
    }
  }

  async function handleDeleteGroup(group: ShoppingListGroup) {
    try {
      setErrorMessage('')
      setSuccessMessage('')

      await Promise.all(group.items.map((item) => deleteShoppingListItem(item.id)))

      setItems((currentItems) =>
        currentItems.filter(
          (currentItem) =>
            !group.items.some((groupItem) => groupItem.id === currentItem.id),
        ),
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer ce groupe d’ingrédients.')
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
      <div className="rounded-[2rem] bg-white p-8 text-stone-600 shadow-sm ring-1 ring-orange-100">
        Chargement de la liste de courses...
      </div>
    )
  }

  return (
    <section className="space-y-10">
      <div className="rounded-[2.5rem] bg-[#fffaf3] p-8 shadow-sm ring-1 ring-orange-100 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="mb-5 flex w-fit items-center gap-3 rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-orange-700">
              <span>🛒</span>
              <span>Organisation</span>
            </div>

            <h1 className="text-4xl font-black text-stone-950 md:text-6xl">
              Liste de courses
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
              Prépare tes achats simplement. Les ingrédients sont regroupés et
              rangés par rayons pour aller plus vite en magasin.
            </p>
          </div>

          <Link
            to="/recipes"
            className="rounded-full bg-orange-500 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-orange-600"
          >
            Explorer les recettes
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl bg-red-50 px-5 py-4 font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl bg-green-50 px-5 py-4 font-bold text-green-700">
          {successMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <p className="text-4xl font-black text-stone-950">{items.length}</p>

          <p className="mt-1 font-bold text-stone-700">
            ingrédient{items.length > 1 ? 's' : ''} dans la liste
          </p>
        </div>

        <div className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
          <p className="text-4xl font-black text-orange-700">
            {uncheckedGroups.length}
          </p>

          <p className="mt-1 font-bold text-stone-700">groupes à acheter</p>
        </div>

        <div className="rounded-[1.75rem] bg-green-50 p-6 shadow-sm ring-1 ring-green-100">
          <p className="text-4xl font-black text-green-800">
            {checkedItems.length}
          </p>

          <p className="mt-1 font-bold text-green-800">déjà pris</p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
        <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
          Ajout rapide
        </p>

        <h2 className="mt-2 text-2xl font-black text-stone-950">
          Ajouter un ingrédient
        </h2>

        <p className="mt-2 text-stone-600">
          Tu peux écrire une quantité, par exemple : 2 œufs, 500 g de farine ou
          1 boule de mozzarella.
        </p>

        <form onSubmit={handleAddItem} className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            value={newItemText}
            onChange={(event) => setNewItemText(event.target.value)}
            placeholder="Exemple : 6 œufs, farine, tomates..."
            className="w-full rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          />

          <button
            type="submit"
            disabled={adding}
            className="rounded-2xl bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adding ? 'Ajout...' : 'Ajouter'}
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
          <p className="text-2xl font-black text-stone-950">
            Ta liste de courses est vide
          </p>

          <p className="mt-3 text-stone-600">
            Ajoute un ingrédient manuellement ou ajoute les ingrédients depuis
            une recette.
          </p>

          <Link
            to="/recipes"
            className="mt-6 inline-flex rounded-full bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
          >
            Trouver une recette
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
                  Ma liste
                </p>

                <h2 className="mt-2 text-3xl font-black text-stone-950">
                  À acheter par rayons
                </h2>

                <p className="mt-2 text-stone-600">
                  Coche les groupes au fur et à mesure de tes achats.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {checkedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteCheckedItems}
                    disabled={deletingChecked}
                    className="rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-50 disabled:opacity-60"
                  >
                    {deletingChecked ? 'Suppression...' : 'Supprimer les cochés'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDeleteAllItems}
                  disabled={deletingAll}
                  className="rounded-full border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                >
                  {deletingAll ? 'Suppression...' : 'Vider la liste'}
                </button>
              </div>
            </div>

            {uncheckedGroups.length === 0 ? (
              <div className="rounded-[2rem] bg-green-50 p-6 text-green-800 ring-1 ring-green-100">
                Tous les ingrédients sont cochés. Tu peux supprimer les cochés
                ou garder ta liste pour plus tard.
              </div>
            ) : (
              <div className="space-y-5">
                {CATEGORY_ORDER.map((category) => (
                  <ShoppingCategorySection
                    key={category}
                    category={category}
                    groups={uncheckedGroups.filter(
                      (group) => group.category === category,
                    )}
                    onToggleGroup={handleToggleGroup}
                    onDeleteGroup={handleDeleteGroup}
                  />
                ))}
              </div>
            )}
          </div>

          {checkedGroups.length > 0 && (
            <div className="rounded-[2.5rem] bg-green-50 p-6 shadow-sm ring-1 ring-green-100 md:p-8">
              <h2 className="text-2xl font-black text-green-900">Déjà pris</h2>

              <p className="mt-2 text-green-700">
                Ces ingrédients sont cochés. Tu peux les décocher si besoin.
              </p>

              <div className="mt-6 space-y-5">
                {CATEGORY_ORDER.map((category) => (
                  <ShoppingCategorySection
                    key={category}
                    category={category}
                    groups={checkedGroups.filter(
                      (group) => group.category === category,
                    )}
                    onToggleGroup={handleToggleGroup}
                    onDeleteGroup={handleDeleteGroup}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}