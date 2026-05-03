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

type UnitKind = 'weight' | 'volume' | 'container' | 'piece'

type QuantityInfo = {
  baseValue: number
  baseUnit: string
  unitKind: UnitKind
  singularUnit: string
  pluralUnit: string
  name: string
}

type ParsedShoppingItem = ShoppingListItem & {
  category: string
  categoryEmoji: string
  normalizedName: string
  displayName: string
  quantityInfo: QuantityInfo | null
}

type ShoppingLine = {
  key: string
  category: string
  categoryEmoji: string
  displayText: string
  checked: boolean
  items: ParsedShoppingItem[]
}

type ShoppingSection = {
  category: string
  categoryEmoji: string
  lines: ShoppingLine[]
}

type UnitDefinition = {
  variants: string[]
  baseUnit: string
  multiplier: number
  singular: string
  plural: string
  kind: Exclude<UnitKind, 'piece'>
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
      'pomme terre',
      'patate',
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
    terms: ['surgele', 'glace'],
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

const UNIT_DEFINITIONS: UnitDefinition[] = [
  {
    variants: ['kg', 'kilo', 'kilos'],
    baseUnit: 'g',
    multiplier: 1000,
    singular: 'kg',
    plural: 'kg',
    kind: 'weight',
  },
  {
    variants: ['g', 'gr', 'gramme', 'grammes'],
    baseUnit: 'g',
    multiplier: 1,
    singular: 'g',
    plural: 'g',
    kind: 'weight',
  },
  {
    variants: ['l', 'litre', 'litres'],
    baseUnit: 'ml',
    multiplier: 1000,
    singular: 'l',
    plural: 'l',
    kind: 'volume',
  },
  {
    variants: ['cl'],
    baseUnit: 'ml',
    multiplier: 10,
    singular: 'cl',
    plural: 'cl',
    kind: 'volume',
  },
  {
    variants: ['ml'],
    baseUnit: 'ml',
    multiplier: 1,
    singular: 'ml',
    plural: 'ml',
    kind: 'volume',
  },
  {
    variants: ['cuillere a soupe', 'cuillere soupe', 'cas'],
    baseUnit: 'cuillere-a-soupe',
    multiplier: 1,
    singular: 'cuillère à soupe',
    plural: 'cuillères à soupe',
    kind: 'container',
  },
  {
    variants: ['cuillere a cafe', 'cuillere cafe', 'cac'],
    baseUnit: 'cuillere-a-cafe',
    multiplier: 1,
    singular: 'cuillère à café',
    plural: 'cuillères à café',
    kind: 'container',
  },
  {
    variants: ['tranche', 'tranches'],
    baseUnit: 'tranche',
    multiplier: 1,
    singular: 'tranche',
    plural: 'tranches',
    kind: 'container',
  },
  {
    variants: ['boite', 'boites'],
    baseUnit: 'boite',
    multiplier: 1,
    singular: 'boîte',
    plural: 'boîtes',
    kind: 'container',
  },
  {
    variants: ['sachet', 'sachets'],
    baseUnit: 'sachet',
    multiplier: 1,
    singular: 'sachet',
    plural: 'sachets',
    kind: 'container',
  },
  {
    variants: ['verre', 'verres'],
    baseUnit: 'verre',
    multiplier: 1,
    singular: 'verre',
    plural: 'verres',
    kind: 'container',
  },
  {
    variants: ['pincee', 'pincees'],
    baseUnit: 'pincee',
    multiplier: 1,
    singular: 'pincée',
    plural: 'pincées',
    kind: 'container',
  },
  {
    variants: ['gousse', 'gousses'],
    baseUnit: 'gousse',
    multiplier: 1,
    singular: 'gousse',
    plural: 'gousses',
    kind: 'container',
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
  'en',
  'avec',
  'pour',
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
  'gousse',
  'gousses',
  'boule',
  'boules',
]

const PRETTY_NAMES: Record<string, { singular: string; plural: string }> = {
  ail: { singular: 'ail', plural: 'ail' },
  boeuf: { singular: 'bœuf', plural: 'bœuf' },
  cafe: { singular: 'café', plural: 'cafés' },
  creme: { singular: 'crème', plural: 'crèmes' },
  echalote: { singular: 'échalote', plural: 'échalotes' },
  gruyere: { singular: 'gruyère', plural: 'gruyères' },
  mais: { singular: 'maïs', plural: 'maïs' },
  oeuf: { singular: 'œuf', plural: 'œufs' },
  pate: { singular: 'pâtes', plural: 'pâtes' },
  surgele: { singular: 'surgelé', plural: 'surgelés' },
  the: { singular: 'thé', plural: 'thés' },
  tomate: { singular: 'tomate', plural: 'tomates' },
  oignon: { singular: 'oignon', plural: 'oignons' },
  pomme: { singular: 'pomme', plural: 'pommes' },
  'pomme terre': {
    singular: 'pomme de terre',
    plural: 'pommes de terre',
  },
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

function normalizeForQuantity(value: string) {
  return value
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9\s,./-]/g, ' ')
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

  const words = normalizedValue.split(' ').filter((word) => {
    if (!word) return false
    if (/^\d+([.,]\d+)?$/.test(word)) return false
    if (UNIT_WORDS.includes(word)) return false
    if (STOP_WORDS.includes(word)) return false

    return true
  })

  return singularizeText(words.join(' '))
}

function capitalize(value: string) {
  if (!value) return value

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getIngredientLabel(normalizedName: string, quantity = 1) {
  const cleanedName = cleanIngredientName(normalizedName) || normalizedName
  const prettyName = PRETTY_NAMES[cleanedName]

  if (prettyName) {
    return quantity > 1 ? prettyName.plural : prettyName.singular
  }

  if (quantity > 1 && cleanedName.length > 3 && !cleanedName.endsWith('s')) {
    return `${cleanedName}s`
  }

  return cleanedName
}

function formatDisplayName(value: string) {
  const cleanedName = cleanIngredientName(value)

  if (!cleanedName) {
    return value.trim()
  }

  return capitalize(getIngredientLabel(cleanedName, 1))
}

function getCategoryForItem(value: string) {
  const normalizedValue = cleanIngredientName(value)

  const category =
    CATEGORIES.find((currentCategory) =>
      currentCategory.terms.some((term) => normalizedValue.includes(term)),
    ) ?? CATEGORIES[CATEGORIES.length - 1]

  return category
}

function parseQuantityValue(value: string) {
  if (value.includes('/')) {
    const [topValue, bottomValue] = value.split('/').map(Number)

    if (!topValue || !bottomValue) {
      return null
    }

    return topValue / bottomValue
  }

  const parsedValue = Number(value.replace(',', '.'))

  if (Number.isNaN(parsedValue)) {
    return null
  }

  return parsedValue
}

function parseQuantityInfo(
  value: string,
  fallbackName: string,
): QuantityInfo | null {
  const normalizedValue = normalizeForQuantity(value)
  const quantityMatch = normalizedValue.match(
    /^(\d+\/\d+|\d+(?:[.,]\d+)?)(?:\s+)?(.*)$/,
  )

  if (!quantityMatch) {
    return null
  }

  const quantity = parseQuantityValue(quantityMatch[1])
  const rest = quantityMatch[2]?.trim() ?? ''

  if (!quantity || quantity <= 0) {
    return null
  }

  const sortedUnits = [...UNIT_DEFINITIONS].sort(
    (firstUnit, secondUnit) =>
      Math.max(...secondUnit.variants.map((variant) => variant.length)) -
      Math.max(...firstUnit.variants.map((variant) => variant.length)),
  )

  for (const unit of sortedUnits) {
    const matchedVariant = unit.variants.find(
      (variant) => rest === variant || rest.startsWith(`${variant} `),
    )

    if (!matchedVariant) {
      continue
    }

    const restAfterUnit = rest.slice(matchedVariant.length).trim()
    const cleanedName = cleanIngredientName(restAfterUnit) || fallbackName

    return {
      baseValue: quantity * unit.multiplier,
      baseUnit: unit.baseUnit,
      unitKind: unit.kind,
      singularUnit: unit.singular,
      pluralUnit: unit.plural,
      name: cleanedName,
    }
  }

  const cleanedName = cleanIngredientName(rest) || fallbackName

  return {
    baseValue: quantity,
    baseUnit: 'piece',
    unitKind: 'piece',
    singularUnit: '',
    pluralUnit: '',
    name: cleanedName,
  }
}

function parseShoppingItem(item: ShoppingListItem): ParsedShoppingItem {
  const category = getCategoryForItem(item.text)
  const normalizedName = cleanIngredientName(item.text) || normalizeText(item.text)
  const quantityInfo = parseQuantityInfo(item.text, normalizedName)

  return {
    ...item,
    category: category.label,
    categoryEmoji: category.emoji,
    normalizedName: quantityInfo?.name ?? normalizedName,
    displayName: formatDisplayName(quantityInfo?.name ?? item.text),
    quantityInfo,
  }
}

function formatNumber(value: number) {
  const roundedValue = Math.round(value * 100) / 100

  return String(roundedValue).replace('.', ',')
}

function formatQuantityLabel(totalBaseValue: number, quantityInfo: QuantityInfo) {
  if (quantityInfo.unitKind === 'weight') {
    if (totalBaseValue >= 1000) {
      return `${formatNumber(totalBaseValue / 1000)} kg`
    }

    return `${formatNumber(totalBaseValue)} g`
  }

  if (quantityInfo.unitKind === 'volume') {
    if (totalBaseValue >= 1000) {
      return `${formatNumber(totalBaseValue / 1000)} l`
    }

    return `${formatNumber(totalBaseValue)} ml`
  }

  if (quantityInfo.unitKind === 'container') {
    const unit =
      totalBaseValue > 1 ? quantityInfo.pluralUnit : quantityInfo.singularUnit

    return `${formatNumber(totalBaseValue)} ${unit}`
  }

  return formatNumber(totalBaseValue)
}

function getLineDisplayText(items: ParsedShoppingItem[]) {
  const quantityInfos = items
    .map((item) => item.quantityInfo)
    .filter(Boolean) as QuantityInfo[]

  if (quantityInfos.length === items.length && quantityInfos.length > 0) {
    const firstQuantity = quantityInfos[0]
    const totalBaseValue = quantityInfos.reduce(
      (sum, quantityInfo) => sum + quantityInfo.baseValue,
      0,
    )

    const quantityLabel = formatQuantityLabel(totalBaseValue, firstQuantity)

    if (firstQuantity.unitKind === 'piece') {
      const ingredientName = getIngredientLabel(
        firstQuantity.name,
        totalBaseValue,
      )

      return capitalize(`${quantityLabel} ${ingredientName}`)
    }

    const ingredientName = getIngredientLabel(firstQuantity.name, 1)

    return capitalize(`${quantityLabel} de ${ingredientName}`)
  }

  const displayName = items[0]?.displayName ?? 'Ingrédient'

  if (items.length > 1) {
    return `${displayName} ×${items.length}`
  }

  return displayName
}

function getLineKey(item: ParsedShoppingItem) {
  const checkedKey = item.checked ? 'checked' : 'active'
  const quantityKey = item.quantityInfo?.baseUnit ?? 'simple'

  return `${checkedKey}-${item.category}-${item.normalizedName}-${quantityKey}`
}

function buildShoppingLines(items: ShoppingListItem[]) {
  const linesByKey = new Map<string, ParsedShoppingItem[]>()

  items.map(parseShoppingItem).forEach((parsedItem) => {
    const key = getLineKey(parsedItem)
    const currentItems = linesByKey.get(key) ?? []

    linesByKey.set(key, [...currentItems, parsedItem])
  })

  return Array.from(linesByKey.entries())
    .map(([key, parsedItems]) => {
      const firstItem = parsedItems[0]

      return {
        key,
        category: firstItem.category,
        categoryEmoji: firstItem.categoryEmoji,
        displayText: getLineDisplayText(parsedItems),
        checked: firstItem.checked,
        items: parsedItems,
      }
    })
    .sort((firstLine, secondLine) => {
      const firstCategoryIndex = CATEGORIES.findIndex(
        (category) => category.label === firstLine.category,
      )

      const secondCategoryIndex = CATEGORIES.findIndex(
        (category) => category.label === secondLine.category,
      )

      if (firstCategoryIndex !== secondCategoryIndex) {
        return firstCategoryIndex - secondCategoryIndex
      }

      return firstLine.displayText.localeCompare(secondLine.displayText, 'fr')
    })
}

function groupLinesByCategory(lines: ShoppingLine[]) {
  const sectionsByCategory = new Map<string, ShoppingSection>()

  lines.forEach((line) => {
    const currentSection = sectionsByCategory.get(line.category)

    if (currentSection) {
      currentSection.lines.push(line)
      return
    }

    sectionsByCategory.set(line.category, {
      category: line.category,
      categoryEmoji: line.categoryEmoji,
      lines: [line],
    })
  })

  return Array.from(sectionsByCategory.values())
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

  const activeLines = useMemo(() => {
    return buildShoppingLines(activeItems)
  }, [activeItems])

  const checkedLines = useMemo(() => {
    return buildShoppingLines(checkedItems)
  }, [checkedItems])

  const activeSections = useMemo(() => {
    return groupLinesByCategory(activeLines)
  }, [activeLines])

  const checkedSections = useMemo(() => {
    return groupLinesByCategory(checkedLines)
  }, [checkedLines])

  const activeCategoryCount = useMemo(() => {
    return activeSections.length
  }, [activeSections])

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

  async function handleToggleLine(line: ShoppingLine) {
    try {
      setBulkActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      const nextCheckedValue = !line.checked

      const updatedItems = await Promise.all(
        line.items.map((item) =>
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
      setErrorMessage('Impossible de modifier cet ingrédient.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  async function handleToggleSection(section: ShoppingSection, checked: boolean) {
    try {
      setBulkActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      const sectionItems = section.lines.flatMap((line) => line.items)

      const updatedItems = await Promise.all(
        sectionItems.map((item) =>
          updateShoppingListItemChecked(item.id, checked),
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
      setErrorMessage('Impossible de modifier ce rayon.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  async function handleDeleteLine(line: ShoppingLine) {
    const confirmDelete = window.confirm(
      `Supprimer "${line.displayText}" de la liste de courses ?`,
    )

    if (!confirmDelete) {
      return
    }

    try {
      setBulkActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      await Promise.all(line.items.map((item) => deleteShoppingListItem(item.id)))

      const deletedIds = new Set(line.items.map((item) => item.id))

      setItems((currentItems) =>
        currentItems.filter((item) => !deletedIds.has(item.id)),
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer cet ingrédient.')
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
              regroupent ici par rayon. Les doublons sont fusionnés pour garder
              une liste simple à lire.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
                <p className="text-3xl font-black text-orange-600">
                  {activeLines.length}
                </p>

                <p className="mt-1 text-sm font-bold text-stone-700">lignes</p>
              </div>

              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
                <p className="text-3xl font-black text-green-700">
                  {checkedLines.length}
                </p>

                <p className="mt-1 text-sm font-bold text-stone-700">
                  cochées
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
                <p className="text-3xl font-black text-stone-900">
                  {activeCategoryCount}
                </p>

                <p className="mt-1 text-sm font-bold text-stone-700">rayons</p>
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
                placeholder="Exemple : 6 œufs, 500 g pâtes, lait..."
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
                Si tu ajoutes plusieurs fois la même recette dans le planning,
                les quantités se regroupent ici automatiquement.
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
                  {activeLines.length} ligne{activeLines.length > 1 ? 's' : ''}
                </p>
              </div>

              {activeSections.length === 0 ? (
                <div className="rounded-[1.5rem] bg-green-50 p-6 text-green-800">
                  <p className="font-black">Tout est coché.</p>

                  <p className="mt-1 text-sm">
                    Tu peux supprimer les ingrédients cochés ou garder
                    l’historique pour le moment.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {activeSections.map((section) => (
                    <article
                      key={section.category}
                      className="rounded-[2rem] bg-[#fffaf3] p-5 shadow-sm ring-1 ring-orange-100"
                    >
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-2xl">{section.categoryEmoji}</p>

                          <h3 className="mt-1 text-xl font-black text-stone-950">
                            {section.category}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleSection(section, true)}
                          disabled={bulkActionLoading}
                          className="rounded-full bg-white px-4 py-2 text-sm font-black text-green-700 shadow-sm ring-1 ring-green-100 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cocher le rayon
                        </button>
                      </div>

                      <div className="space-y-2">
                        {section.lines.map((line) => (
                          <div
                            key={line.key}
                            className="flex items-center gap-3 rounded-[1.25rem] bg-white px-4 py-3 shadow-sm ring-1 ring-orange-50"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleLine(line)}
                              disabled={bulkActionLoading}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-200 text-sm font-black text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Cocher ${line.displayText}`}
                            >
                              ✓
                            </button>

                            <div className="min-w-0 flex-1">
                              <p className="font-black text-stone-900">
                                {line.displayText}
                              </p>

                              {line.items.length > 1 && (
                                <p className="mt-0.5 text-xs font-semibold text-stone-500">
                                  {line.items.length} ajouts regroupés
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteLine(line)}
                              disabled={bulkActionLoading}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-black text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Supprimer ${line.displayText}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {showCheckedItems && checkedSections.length > 0 && (
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
                    {checkedLines.length} ligne
                    {checkedLines.length > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  {checkedSections.map((section) => (
                    <article
                      key={section.category}
                      className="rounded-[2rem] bg-green-50 p-5 ring-1 ring-green-100"
                    >
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-2xl">{section.categoryEmoji}</p>

                          <h3 className="mt-1 text-xl font-black text-stone-950">
                            {section.category}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleSection(section, false)}
                          disabled={bulkActionLoading}
                          className="rounded-full bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remettre le rayon
                        </button>
                      </div>

                      <div className="space-y-2">
                        {section.lines.map((line) => (
                          <div
                            key={line.key}
                            className="flex items-center gap-3 rounded-[1.25rem] bg-white px-4 py-3 text-sm shadow-sm"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleLine(line)}
                              disabled={bulkActionLoading}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-black text-green-700 transition hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Remettre ${line.displayText}`}
                            >
                              ↩
                            </button>

                            <div className="min-w-0 flex-1">
                              <p className="font-black text-stone-500 line-through decoration-green-600/60">
                                {line.displayText}
                              </p>

                              {line.items.length > 1 && (
                                <p className="mt-0.5 text-xs font-semibold text-stone-400">
                                  {line.items.length} ajouts regroupés
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteLine(line)}
                              disabled={bulkActionLoading}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-black text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Supprimer ${line.displayText}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </article>
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
              {activeLines.length}
            </p>

            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700 }}>
              lignes à acheter
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
              {checkedLines.length}
            </p>

            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700 }}>
              lignes cochées
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

          {activeSections.length === 0 ? (
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
              {activeSections.map((section) => (
                <div
                  key={section.category}
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
                    {section.categoryEmoji} {section.category}
                  </p>

                  <ul
                    style={{
                      margin: '10px 0 0',
                      paddingLeft: 18,
                      color: '#1c1917',
                      fontSize: 14,
                      lineHeight: 1.8,
                      fontWeight: 700,
                    }}
                  >
                    {section.lines.map((line) => (
                      <li key={line.key}>□ {line.displayText}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {checkedSections.length > 0 && (
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
              {checkedSections.map((section) => (
                <div
                  key={section.category}
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
                    {section.categoryEmoji} {section.category}
                  </p>

                  <ul
                    style={{
                      margin: '10px 0 0',
                      paddingLeft: 18,
                      color: '#57534e',
                      fontSize: 13,
                      lineHeight: 1.7,
                      fontWeight: 700,
                      textDecoration: 'line-through',
                    }}
                  >
                    {section.lines.map((line) => (
                      <li key={line.key}>☑ {line.displayText}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  )
}