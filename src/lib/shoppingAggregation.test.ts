import { describe, expect, it } from 'vitest'

import type { ShoppingListItem } from '../services/shoppingList'
import {
  buildShoppingLines,
  getCurrentDateLabel,
  groupLinesByCategory,
} from './shoppingAggregation'

function makeItem(
  id: number,
  text: string,
  checked = false,
): ShoppingListItem {
  return {
    id,
    userId: 'user-1',
    recipeId: null,
    text,
    checked,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('buildShoppingLines', () => {
  it('renvoie une liste vide pour aucune entrée', () => {
    expect(buildShoppingLines([])).toEqual([])
  })

  it('regroupe deux fois le même ingrédient en une seule ligne', () => {
    const lines = buildShoppingLines([
      makeItem(1, '200 g de farine'),
      makeItem(2, '100 g de farine'),
    ])

    expect(lines).toHaveLength(1)
    expect(lines[0].items).toHaveLength(2)
    expect(lines[0].displayText.toLowerCase()).toContain('farine')
    expect(lines[0].displayText).toContain('300')
  })

  it('sépare des ingrédients différents sur des lignes distinctes', () => {
    const lines = buildShoppingLines([
      makeItem(1, '200 g de farine'),
      makeItem(2, '3 oeufs'),
    ])

    expect(lines).toHaveLength(2)
  })

  it('sépare les articles cochés des non cochés', () => {
    const lines = buildShoppingLines([
      makeItem(1, '200 g de farine', false),
      makeItem(2, '100 g de farine', true),
    ])

    expect(lines).toHaveLength(2)
  })
})

describe('groupLinesByCategory', () => {
  it('regroupe les lignes par catégorie', () => {
    const lines = buildShoppingLines([
      makeItem(1, '200 g de farine'),
      makeItem(2, '3 oeufs'),
    ])
    const sections = groupLinesByCategory(lines)

    expect(sections.length).toBeGreaterThan(0)
    const totalLines = sections.reduce(
      (total, section) => total + section.lines.length,
      0,
    )
    expect(totalLines).toBe(lines.length)
  })
})

describe('getCurrentDateLabel', () => {
  it('renvoie une date lisible contenant une année', () => {
    expect(getCurrentDateLabel()).toMatch(/\d{4}/)
  })
})
