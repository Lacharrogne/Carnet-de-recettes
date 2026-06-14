import { describe, expect, it } from 'vitest'

import {
  analyzeRecipe,
  getUniqueIngredients,
  ingredientMatches,
  normalizeText,
  parseFridgeIngredients,
  recipeUsesIngredient,
  removeIngredientDetails,
  singularizeText,
} from './fridgeMatching'
import type { Recipe } from '../types/recipe'

function makeRecipe(ingredients: string[]): Recipe {
  return {
    id: 1,
    userId: null,
    title: 'Test',
    category: 'Plat',
    difficulty: 'Facile',
    prepTime: 0,
    cookTime: 0,
    servings: 1,
    description: '',
    image: '',
    imageUrl: null,
    tags: [],
    ingredients,
    steps: [],
    relatedRecipeIds: [],
  }
}

describe('normalizeText', () => {
  it('retire accents, casse et ligature œ', () => {
    expect(normalizeText('Œufs Frais')).toBe('oeufs frais')
    expect(normalizeText('Crème Fraîche')).toBe('creme fraiche')
  })
})

describe('removeIngredientDetails', () => {
  it('retire quantités, unités et mots-outils', () => {
    expect(removeIngredientDetails('250 g de lentilles')).toBe('lentilles')
    expect(removeIngredientDetails('2 cuillères à soupe d’huile')).toContain(
      'huile',
    )
  })
})

describe('singularizeText', () => {
  it('retire le pluriel des mots longs', () => {
    expect(singularizeText('tomates oeufs')).toBe('tomate oeuf')
  })

  it('épargne les mots courts', () => {
    expect(singularizeText('ris')).toBe('ris')
  })
})

describe('parseFridgeIngredients', () => {
  it('découpe sur virgules, points-virgules et retours ligne', () => {
    expect(parseFridgeIngredients('tomates, oignon\nail; riz')).toEqual([
      'tomates',
      'oignon',
      'ail',
      'riz',
    ])
  })

  it('déduplique et ignore le vide', () => {
    expect(parseFridgeIngredients('riz,,riz, ')).toEqual(['riz'])
  })
})

describe('getUniqueIngredients', () => {
  it('déduplique sur la forme normalisée en gardant le libellé', () => {
    expect(getUniqueIngredients(['Tomates', 'tomates', 'Oignon'])).toEqual([
      'tomates',
      'Oignon',
    ])
  })
})

describe('ingredientMatches', () => {
  it('rapproche via les synonymes de famille (mozzarella ~ fromage)', () => {
    expect(ingredientMatches('mozzarella râpée', ['fromage'])).toBe(true)
  })

  it('gère pluriel et accents', () => {
    expect(ingredientMatches('2 Œufs', ['oeuf'])).toBe(true)
  })

  it('ne matche pas un ingrédient absent', () => {
    expect(ingredientMatches('saucisses de Toulouse', ['chocolat'])).toBe(false)
  })
})

describe('recipeUsesIngredient', () => {
  it('détecte l’usage d’un ingrédient', () => {
    const recipe = makeRecipe(['2 courgettes', '150 g truite fumée'])
    expect(recipeUsesIngredient(recipe, 'courgette')).toBe(true)
    expect(recipeUsesIngredient(recipe, 'poulet')).toBe(false)
  })

  it('renvoie false pour une saisie vide', () => {
    expect(recipeUsesIngredient(makeRecipe(['riz']), '   ')).toBe(false)
  })
})

describe('analyzeRecipe', () => {
  it('calcule présents, manquants et score', () => {
    const recipe = makeRecipe(['tomates', 'oignon', 'riz', 'poulet'])
    const result = analyzeRecipe(recipe, ['tomates', 'oignon'])

    expect(result.matchedIngredients).toEqual(['tomates', 'oignon'])
    expect(result.missingCount).toBe(2)
    expect(result.score).toBe(50)
  })

  it('score 0 sans ingrédients', () => {
    expect(analyzeRecipe(makeRecipe([]), ['riz']).score).toBe(0)
  })
})
