import type { Recipe } from '../types/recipe'

/**
 * Déduit les « régimes » d'une recette à partir de ses ingrédients (heuristique
 * par mots-clés). C'est une ESTIMATION — pratique pour filtrer, mais à ne pas
 * prendre pour une garantie (surtout en cas d'allergie).
 *
 * - vegan       : aucun produit animal (viande, poisson, œuf, laitage, miel…).
 * - glutenFree  : aucun ingrédient à gluten évident (blé, pâtes, pain…).
 * - lactoseFree : aucun produit laitier.
 */
export type DietKey = 'vegan' | 'glutenFree' | 'lactoseFree'

export type RecipeDiets = Record<DietKey, boolean>

// Qualificatifs « végétal » : « lait de coco », « beurre de cacahuète »… ne
// comptent pas comme produits laitiers/animaux.
const PLANT_QUALIFIERS = [
  'coco',
  'amande',
  'soja',
  'avoine',
  'vegetal',
  'noisette',
  'cajou',
  'cacahuete',
  'chanvre',
]

// Produits animaux toujours disqualifiants pour le vegan.
const STRICT_ANIMAL = [
  'viande', 'boeuf', 'veau', 'porc', 'poulet', 'poule', 'dinde', 'canard',
  'lapin', 'agneau', 'jambon', 'lardon', 'bacon', 'merguez', 'saucisse',
  'chorizo', 'poisson', 'saumon', 'thon', 'cabillaud', 'crevette', 'moule',
  'gambas', 'calamar', 'anchois', 'sardine', 'foie', 'oeuf', 'miel',
  'gelatine', 'fromage', 'yaourt', 'mozzarella', 'parmesan', 'gruyere',
  'emmental', 'comte', 'cheddar', 'mascarpone', 'ricotta', 'feta',
]

// Produits laitiers stricts (toujours = lactose).
const STRICT_DAIRY = [
  'fromage', 'yaourt', 'mozzarella', 'parmesan', 'gruyere', 'emmental',
  'comte', 'cheddar', 'mascarpone', 'ricotta', 'feta', 'bechamel',
]

// Laitiers ambigus : comptent sauf version végétale (lait de coco…).
const AMBIG_DAIRY = ['lait', 'beurre', 'creme']

// Ingrédients à gluten évidents.
const STRICT_GLUTEN = [
  'ble', 'pain', 'baguette', 'semoule', 'chapelure', 'biscuit', 'orge',
  'seigle', 'boulgour', 'couscous', 'crouton', 'brioche', 'biscotte',
  'pates', 'pate', 'pizza', 'raviole', 'gnocchi', 'epeautre', 'vermicelle',
]

// « farine de riz/maïs… » est sans gluten.
const GF_FLOUR_QUALIFIERS = [
  'riz', 'mais', 'chataigne', 'sarrasin', 'pois chiche', 'coco', 'amande',
  'soja',
]

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isPlantVersion(text: string): boolean {
  return PLANT_QUALIFIERS.some((qualifier) => text.includes(qualifier))
}

function hasWord(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word))
}

export function getRecipeDiets(recipe: Recipe): RecipeDiets {
  let animal = false
  let dairy = false
  let gluten = false

  for (const raw of recipe.ingredients) {
    const text = normalize(raw)
    if (!text) continue

    const plant = isPlantVersion(text)

    // Animal (→ non vegan)
    if (hasWord(text, STRICT_ANIMAL)) {
      animal = true
    } else if (!plant && hasWord(text, AMBIG_DAIRY)) {
      animal = true
    }

    // Laitier (→ lactose)
    if (hasWord(text, STRICT_DAIRY)) {
      dairy = true
    } else if (!plant && hasWord(text, AMBIG_DAIRY)) {
      dairy = true
    }

    // Gluten
    if (hasWord(text, STRICT_GLUTEN)) {
      gluten = true
    } else if (text.includes('farine') && !hasWord(text, GF_FLOUR_QUALIFIERS)) {
      gluten = true
    }
  }

  return {
    vegan: !animal,
    glutenFree: !gluten,
    lactoseFree: !dairy,
  }
}

export const DIET_OPTIONS: { key: DietKey; label: string; emoji: string }[] = [
  { key: 'vegan', label: 'Vegan', emoji: '🌱' },
  { key: 'glutenFree', label: 'Sans gluten', emoji: '🌾' },
  { key: 'lactoseFree', label: 'Sans lactose', emoji: '🥛' },
]
