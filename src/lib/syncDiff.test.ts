import { describe, expect, it } from 'vitest'

import { diffHistory, diffPlanner } from './syncDiff'
import { createEmptyPlanner } from './weeklyPlanner'
import type { CookingHistory } from './cookingHistory'

const plannerWith = (slots: Record<string, string>) => {
  const planner = createEmptyPlanner()
  for (const [path, recipeId] of Object.entries(slots)) {
    const [day, meal] = path.split('.')
    // @ts-expect-error chemin construit dans le test
    planner[day][meal] = recipeId
  }
  return planner
}

describe('diffPlanner', () => {
  it('ne produit rien quand rien ne change', () => {
    const p = plannerWith({ 'monday.lunch': '1' })
    expect(diffPlanner(p, p)).toEqual([])
  })

  it('écrit un créneau nouvellement rempli', () => {
    const ops = diffPlanner(createEmptyPlanner(), plannerWith({ 'monday.lunch': '7' }))
    expect(ops).toEqual([
      { type: 'set', day: 'monday', meal: 'lunch', recipeId: '7' },
    ])
  })

  it('vide un créneau qu’on efface', () => {
    const ops = diffPlanner(plannerWith({ 'friday.dinner': '3' }), createEmptyPlanner())
    expect(ops).toEqual([{ type: 'clear', day: 'friday', meal: 'dinner' }])
  })

  it('ne touche pas aux créneaux voisins (deux appareils, repas différents)', () => {
    const ops = diffPlanner(
      plannerWith({ 'monday.lunch': '1', 'thursday.dinner': '2' }),
      plannerWith({ 'monday.lunch': '9', 'thursday.dinner': '2' }),
    )
    expect(ops).toEqual([
      { type: 'set', day: 'monday', meal: 'lunch', recipeId: '9' },
    ])
  })

  it('n’envoie AUCUNE suppression sans état de référence', () => {
    // Le cas dangereux : sans savoir ce que contient le compte, vider des
    // créneaux effacerait le planning d'un autre appareil.
    expect(diffPlanner(null, createEmptyPlanner())).toEqual([])
  })

  it('remplit sans rien supprimer quand la référence est inconnue', () => {
    const ops = diffPlanner(null, plannerWith({ 'sunday.dessert': '5' }))
    expect(ops).toEqual([
      { type: 'set', day: 'sunday', meal: 'dessert', recipeId: '5' },
    ])
  })
})

describe('diffHistory', () => {
  const entry = (count: number, at = '2026-09-01T10:00:00.000Z') => ({
    count,
    lastCookedAt: at,
  })

  it('ne produit rien quand rien ne change', () => {
    const h: CookingHistory = { '1': entry(2) }
    expect(diffHistory(h, h)).toEqual([])
  })

  it('écrit un compteur qui augmente', () => {
    const ops = diffHistory({ '1': entry(1) }, { '1': entry(2) })
    expect(ops).toEqual([
      { type: 'set', recipeId: '1', count: 2, lastCookedAt: '2026-09-01T10:00:00.000Z' },
    ])
  })

  it('retire une recette sortie de l’historique', () => {
    const ops = diffHistory({ '1': entry(1) }, {})
    expect(ops).toEqual([{ type: 'delete', recipeId: '1' }])
  })

  it('n’envoie AUCUNE suppression sans état de référence', () => {
    expect(diffHistory(null, {})).toEqual([])
  })
})
