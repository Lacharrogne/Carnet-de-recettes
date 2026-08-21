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

  it('recalcule les deux bornes d’une fourchette « à »', () => {
    expect(scaleIngredientText('2 à 3 cuillères', 2, 4)).toBe(
      '4 à 6 cuillères',
    )
  })

  it('recalcule les deux bornes d’une fourchette avec tiret', () => {
    expect(scaleIngredientText('2-3 tomates', 2, 4)).toBe('4-6 tomates')
  })

  it('ne confond pas « cuillère à soupe » avec une fourchette', () => {
    expect(scaleIngredientText('1 cuillère à soupe de sucre', 1, 2)).toBe(
      '2 cuillères à soupe de sucre',
    )
  })

  it('gère une fraction unicode', () => {
    expect(scaleIngredientText('½ citron', 2, 4)).toBe('1 citron')
  })

  it('gère un nombre entier suivi d’une fraction unicode', () => {
    expect(scaleIngredientText('1 ½ pomme', 1, 2)).toBe('3 pommes')
  })
})
