import type { ShoppingListItem } from '../services/shoppingList'

// Agrégation de la liste de courses : normalisation des intitulés,
// parsing des quantités/unités, regroupement par rayon. Logique pure.

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

export type ShoppingLine = {
  key: string
  category: string
  categoryEmoji: string
  displayText: string
  checked: boolean
  items: ParsedShoppingItem[]
}

export type ShoppingSection = {
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

const FALLBACK_CATEGORY: ShoppingCategory = {
  label: 'Autres',
  emoji: '🛒',
  terms: [],
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
  FALLBACK_CATEGORY,
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

  return (
    CATEGORIES.find((currentCategory) =>
      currentCategory.terms.some((term) => normalizedValue.includes(term)),
    ) ?? FALLBACK_CATEGORY
  )
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

  const quantityValue = quantityMatch[1]
  const rest = quantityMatch[2]?.trim() ?? ''

  if (!quantityValue) {
    return null
  }

  const quantity = parseQuantityValue(quantityValue)

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

    if (!firstQuantity) {
      return items[0]?.displayName ?? 'Ingrédient'
    }

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

export function buildShoppingLines(items: ShoppingListItem[]) {
  const linesByKey = new Map<string, ParsedShoppingItem[]>()

  items.map(parseShoppingItem).forEach((parsedItem) => {
    const key = getLineKey(parsedItem)
    const currentItems = linesByKey.get(key) ?? []

    linesByKey.set(key, [...currentItems, parsedItem])
  })

  return Array.from(linesByKey.entries())
    .flatMap(([key, parsedItems]) => {
      const firstItem = parsedItems[0]

      if (!firstItem) {
        return []
      }

      return [
        {
          key,
          category: firstItem.category,
          categoryEmoji: firstItem.categoryEmoji,
          displayText: getLineDisplayText(parsedItems),
          checked: firstItem.checked,
          items: parsedItems,
        },
      ]
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

export function groupLinesByCategory(lines: ShoppingLine[]) {
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

export function getCurrentDateLabel() {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}
