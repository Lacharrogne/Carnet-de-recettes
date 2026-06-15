import { describe, expect, it } from 'vitest'

import { scaleIngredientText } from './ingredientScaling'

describe('scaleIngredientText', () => {
  it('réduit une quantité décimale au prorata des portions', () => {
    expect(scaleIngredientText('200 g de farine', 4, 2)).toBe('100 g de farine')
  })

  it('augmente une quantité et garde le pluriel', () => {
    expect(scaleIngredientText('2 oeufs', 2, 4)).toBe('4 œufs')
  })

  it('accorde au singulier quand la quantité retombe à 1', () => {
    expect(scaleIngredientText('2 tomates', 2, 1)).toBe('1 tomate')
  })

  it('gère les fractions', () => {
    expect(scaleIngredientText('1/2 citron', 2, 4)).toBe('1 citron')
  })

  it('utilise la virgule pour les décimales et accorde au pluriel', () => {
    expect(scaleIngredientText('1 pomme', 2, 3)).toBe('1,5 pommes')
  })

  it('laisse inchangé un ingrédient sans quantité', () => {
    expect(scaleIngredientText('sel', 4, 2)).toBe('sel')
  })

  it('laisse inchangé si le nombre de portions est invalide', () => {
    expect(scaleIngredientText('200 g de farine', 0, 2)).toBe('200 g de farine')
  })
})
