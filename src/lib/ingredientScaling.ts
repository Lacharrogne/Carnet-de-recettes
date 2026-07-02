// Mise à l'échelle d'un ingrédient texte selon le nombre de portions :
// ajuste la quantité (entiers, décimales, fractions) et l'accord
// singulier/pluriel des unités et aliments courants.

function formatScaledQuantity(value: number) {
  if (Number.isInteger(value)) {
    return String(value)
  }

  const roundedValue = Math.round(value * 100) / 100

  return String(roundedValue).replace('.', ',')
}

function parseFraction(value: string) {
  const [topValue, bottomValue] = value.split('/').map(Number)

  if (!topValue || !bottomValue) {
    return null
  }

  return topValue / bottomValue
}

/** Valeur numérique des fractions unicode courantes (« ½ », « ¾ », « ⅓ »...). */
const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 1 / 2,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 1 / 4,
  '¾': 3 / 4,
  '⅕': 1 / 5,
  '⅖': 2 / 5,
  '⅗': 3 / 5,
  '⅘': 4 / 5,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 1 / 8,
  '⅜': 3 / 8,
  '⅝': 5 / 8,
  '⅞': 7 / 8,
}

const UNICODE_FRACTION_CLASS = Object.keys(UNICODE_FRACTIONS).join('')

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const INGREDIENT_AGREEMENTS = [
  {
    singular: 'œuf',
    plural: 'œufs',
    variants: ['œuf', 'œufs', 'oeuf', 'oeufs'],
  },
  {
    singular: 'tomate',
    plural: 'tomates',
    variants: ['tomate', 'tomates'],
  },
  {
    singular: 'oignon',
    plural: 'oignons',
    variants: ['oignon', 'oignons'],
  },
  {
    singular: 'courgette',
    plural: 'courgettes',
    variants: ['courgette', 'courgettes'],
  },
  {
    singular: 'carotte',
    plural: 'carottes',
    variants: ['carotte', 'carottes'],
  },
  {
    singular: 'pomme',
    plural: 'pommes',
    variants: ['pomme', 'pommes'],
  },
  {
    singular: 'pomme de terre',
    plural: 'pommes de terre',
    variants: ['pomme de terre', 'pommes de terre', 'patate', 'patates'],
  },
  {
    singular: 'citron',
    plural: 'citrons',
    variants: ['citron', 'citrons'],
  },
  {
    singular: 'banane',
    plural: 'bananes',
    variants: ['banane', 'bananes'],
  },
  {
    singular: 'gousse',
    plural: 'gousses',
    variants: ['gousse', 'gousses'],
  },
  {
    singular: 'tranche',
    plural: 'tranches',
    variants: ['tranche', 'tranches'],
  },
  {
    singular: 'boîte',
    plural: 'boîtes',
    variants: ['boîte', 'boîtes', 'boite', 'boites'],
  },
  {
    singular: 'sachet',
    plural: 'sachets',
    variants: ['sachet', 'sachets'],
  },
  {
    singular: 'verre',
    plural: 'verres',
    variants: ['verre', 'verres'],
  },
  {
    singular: 'cuillère',
    plural: 'cuillères',
    variants: ['cuillère', 'cuillères', 'cuillere', 'cuilleres'],
  },
  {
    singular: 'pincée',
    plural: 'pincées',
    variants: ['pincée', 'pincées', 'pincee', 'pincees'],
  },
  {
    singular: 'filet',
    plural: 'filets',
    variants: ['filet', 'filets'],
  },
  {
    singular: 'escalope',
    plural: 'escalopes',
    variants: ['escalope', 'escalopes'],
  },
  {
    singular: 'boule',
    plural: 'boules',
    variants: ['boule', 'boules'],
  },
  {
    singular: 'dé',
    plural: 'dés',
    variants: ['dé', 'dés', 'de', 'des'],
  },
  {
    singular: 'gramme',
    plural: 'grammes',
    variants: ['gramme', 'grammes'],
  },
  {
    singular: 'litre',
    plural: 'litres',
    variants: ['litre', 'litres'],
  },
]

function adjustIngredientAgreement(quantity: number, ingredientRest: string) {
  const shouldUsePlural = quantity > 1

  for (const agreement of INGREDIENT_AGREEMENTS) {
    const variants = [...agreement.variants].sort(
      (firstVariant, secondVariant) =>
        secondVariant.length - firstVariant.length,
    )

    const variantPattern = variants.map(escapeRegExp).join('|')

    const pattern = new RegExp(
      `^(\\s*)(${variantPattern})(?=\\s|$|,|\\.|-)`,
      'iu',
    )

    if (pattern.test(ingredientRest)) {
      return ingredientRest.replace(
        pattern,
        `$1${shouldUsePlural ? agreement.plural : agreement.singular}`,
      )
    }
  }

  return ingredientRest
}

/** Assemble le résultat : quantité recalculée + reste accordé (pluriel). */
function buildScaledResult(scaledQuantity: number, restOfIngredient: string) {
  const adjustedRest = adjustIngredientAgreement(
    scaledQuantity,
    restOfIngredient,
  )

  return `${formatScaledQuantity(scaledQuantity)}${adjustedRest}`
}

export function scaleIngredientText(
  ingredient: string,
  originalServings: number,
  selectedServings: number,
) {
  if (originalServings <= 0 || selectedServings <= 0) {
    return ingredient
  }

  const multiplier = selectedServings / originalServings
  const trimmedIngredient = ingredient.trim()

  // Fourchette de quantités (« 2 à 3 », « 2-3 ») : on recalcule les deux bornes
  // en conservant le séparateur d'origine.
  const rangeMatch = trimmedIngredient.match(
    /^(\d+(?:[.,]\d+)?)(\s*(?:-|–|—|à|to)\s*)(\d+(?:[.,]\d+)?)(.*)$/iu,
  )

  if (rangeMatch) {
    const low = Number(rangeMatch[1].replace(',', '.')) * multiplier
    const high = Number(rangeMatch[3].replace(',', '.')) * multiplier
    const restOfIngredient = rangeMatch[4] ?? ''
    const adjustedRest = adjustIngredientAgreement(high, restOfIngredient)

    return `${formatScaledQuantity(low)}${rangeMatch[2]}${formatScaledQuantity(
      high,
    )}${adjustedRest}`
  }

  // Fraction unicode, éventuellement précédée d'un entier (« ½ », « 1 ½ »).
  const unicodeMatch = trimmedIngredient.match(
    new RegExp(`^(\\d+\\s*)?([${UNICODE_FRACTION_CLASS}])(.*)$`, 'u'),
  )

  if (unicodeMatch) {
    const wholePart = unicodeMatch[1] ? Number(unicodeMatch[1].trim()) : 0
    const quantity = wholePart + (UNICODE_FRACTIONS[unicodeMatch[2]] ?? 0)

    return buildScaledResult(quantity * multiplier, unicodeMatch[3] ?? '')
  }

  const fractionMatch = trimmedIngredient.match(/^(\d+)\/(\d+)(.*)$/)

  if (fractionMatch) {
    const quantity = parseFraction(`${fractionMatch[1]}/${fractionMatch[2]}`)

    if (!quantity) {
      return ingredient
    }

    return buildScaledResult(quantity * multiplier, fractionMatch[3] ?? '')
  }

  const decimalMatch = trimmedIngredient.match(/^(\d+(?:[.,]\d+)?)(.*)$/)

  if (!decimalMatch) {
    return ingredient
  }

  const quantity = Number(decimalMatch[1].replace(',', '.'))

  if (Number.isNaN(quantity)) {
    return ingredient
  }

  return buildScaledResult(quantity * multiplier, decimalMatch[2] ?? '')
}
