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

  const fractionMatch = trimmedIngredient.match(/^(\d+)\/(\d+)(.*)$/)

  if (fractionMatch) {
    const quantity = parseFraction(`${fractionMatch[1]}/${fractionMatch[2]}`)

    if (!quantity) {
      return ingredient
    }

    const scaledQuantity = quantity * multiplier
    const restOfIngredient = fractionMatch[3] ?? ''
    const adjustedRest = adjustIngredientAgreement(
      scaledQuantity,
      restOfIngredient,
    )

    return `${formatScaledQuantity(scaledQuantity)}${adjustedRest}`
  }

  const decimalMatch = trimmedIngredient.match(/^(\d+(?:[.,]\d+)?)(.*)$/)

  if (!decimalMatch) {
    return ingredient
  }

  const quantity = Number(decimalMatch[1].replace(',', '.'))

  if (Number.isNaN(quantity)) {
    return ingredient
  }

  const scaledQuantity = quantity * multiplier
  const restOfIngredient = decimalMatch[2] ?? ''
  const adjustedRest = adjustIngredientAgreement(
    scaledQuantity,
    restOfIngredient,
  )

  return `${formatScaledQuantity(scaledQuantity)}${adjustedRest}`
}
