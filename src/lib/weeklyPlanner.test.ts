import { describe, expect, it } from 'vitest'

import {
  DAYS,
  MEALS,
  PLANNER_STORAGE_KEY,
  createEmptyPlanner,
  getDayLabel,
  getMealLabel,
  getSavedPlanner,
} from './weeklyPlanner'

describe('weeklyPlanner', () => {
  it('expose la clé de stockage partagée', () => {
    expect(PLANNER_STORAGE_KEY).toBe('carnet-recettes-weekly-planner')
  })

  it('définit 7 jours et 5 repas par jour', () => {
    expect(DAYS).toHaveLength(7)
    expect(MEALS).toHaveLength(5)
  })

  it('crée un planning vide complet (5 repas par jour)', () => {
    const planner = createEmptyPlanner()

    const emptyDay = {
      breakfast: '',
      lunch: '',
      snack: '',
      dinner: '',
      dessert: '',
    }
    expect(planner.monday).toEqual(emptyDay)
    expect(planner.sunday).toEqual(emptyDay)
  })

  it('traduit les clés de jour et de repas', () => {
    expect(getDayLabel('monday')).toBe('Lundi')
    expect(getMealLabel('lunch')).toBe('Déjeuner')
    expect(getMealLabel('dinner')).toBe('Dîner')
  })

  it('retombe sur la clé brute pour une valeur inconnue', () => {
    // @ts-expect-error volontaire : clé hors union pour tester le repli
    expect(getDayLabel('funday')).toBe('funday')
  })

  it('renvoie un planning vide hors environnement navigateur', () => {
    expect(getSavedPlanner()).toEqual(createEmptyPlanner())
  })
})
