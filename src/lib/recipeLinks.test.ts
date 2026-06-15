import { describe, expect, it } from 'vitest'

import { findLinkedRecipe, normalizeForMatch } from './recipeLinks'
import type { Recipe } from '../types/recipe'

function makeRecipe(id: number, title: string): Recipe {
  return {
    id,
    userId: null,
    title,
    category: 'Plat',
    difficulty: 'Facile',
    prepTime: 0,
    cookTime: 0,
    servings: 1,
    description: '',
    image: '',
    imageUrl: null,
    tags: [],
    ingredients: [],
    steps: [],
    relatedRecipeIds: [],
  }
}

describe('normalizeForMatch', () => {
  it('retire les accents et la casse', () => {
    expect(normalizeForMatch('Pâte Brisée')).toBe('pate brisee')
  })

  it('transforme la ponctuation en espaces', () => {
    expect(normalizeForMatch("1 pâte brisée,")).toBe('1 pate brisee')
  })
})

describe('findLinkedRecipe', () => {
  const recipes = [
    makeRecipe(1, 'Quiche truite courgette'),
    makeRecipe(2, 'Pâte brisée'),
    makeRecipe(3, 'Riz'),
  ]

  it('détecte un titre présent dans un ingrédient (avec accents/casse)', () => {
    const match = findLinkedRecipe('1 pate brisée', recipes, 1)
    expect(match?.id).toBe(2)
  })

  it('ne se lie pas à la recette courante', () => {
    const match = findLinkedRecipe('1 pâte brisée', recipes, 2)
    expect(match).toBeNull()
  })

  it('ignore les titres trop courts (faux positifs)', () => {
    // "Riz" fait 3 caractères : sous le seuil minimal.
    const match = findLinkedRecipe('250 g de riz', recipes, 1)
    expect(match).toBeNull()
  })

  it('renvoie null quand aucun titre ne correspond', () => {
    const match = findLinkedRecipe('4 saucisses de Toulouse', recipes, 1)
    expect(match).toBeNull()
  })

  it('exige une correspondance sur des mots entiers', () => {
    const local = [makeRecipe(10, 'Pain')]
    // "pains" ne doit pas matcher "pain" comme sous-chaîne partielle.
    expect(findLinkedRecipe('des pains au lait', local, 1)?.id).toBe(undefined)
    expect(findLinkedRecipe('un pain de campagne', local, 1)?.id).toBe(10)
  })

  it('préfère le titre le plus spécifique (le plus long)', () => {
    const local = [
      makeRecipe(20, 'Tarte'),
      makeRecipe(21, 'Tarte aux pommes'),
    ]
    const match = findLinkedRecipe('1 tarte aux pommes maison', local, 1)
    expect(match?.id).toBe(21)
  })
})
