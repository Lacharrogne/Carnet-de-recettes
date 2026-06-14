import { describe, expect, it } from 'vitest'

import { formatTimerTime, getStepTimers } from './stepTimers'

describe('formatTimerTime', () => {
  it('formate en MM:SS sous une heure', () => {
    expect(formatTimerTime(0)).toBe('00:00')
    expect(formatTimerTime(65)).toBe('01:05')
    expect(formatTimerTime(600)).toBe('10:00')
  })

  it('formate en HH:MM:SS à partir d’une heure', () => {
    expect(formatTimerTime(3600)).toBe('01:00:00')
    expect(formatTimerTime(3661)).toBe('01:01:01')
  })
})

describe('getStepTimers', () => {
  it('détecte les minutes', () => {
    const timers = getStepTimers('Cuire 10 minutes à feu doux')
    expect(timers).toEqual([{ label: '10 minutes', seconds: 600 }])
  })

  it('détecte les abréviations min', () => {
    expect(getStepTimers('Reposer 5 min')[0].seconds).toBe(300)
  })

  it('détecte les heures composées (1h30)', () => {
    expect(getStepTimers('Laisser 1h30 au four')[0].seconds).toBe(5400)
  })

  it('détecte les heures simples', () => {
    expect(getStepTimers('Mariner 2 heures')[0].seconds).toBe(7200)
  })

  it('détecte les secondes', () => {
    expect(getStepTimers('Mixer 30 secondes')[0].seconds).toBe(30)
  })

  it('prend la borne haute d’une fourchette de minutes', () => {
    expect(getStepTimers('Cuire 10 à 15 minutes')[0].seconds).toBe(900)
  })

  it('gère la virgule décimale comme séparateur neutre', () => {
    // "1,5" devient "1.5" puis le \b(\d+) capte "5 min" -> 300 s.
    expect(getStepTimers('Ajouter 1,5 litre puis cuire 5 min').at(-1)?.seconds).toBe(300)
  })

  it('élimine les doublons (même libellé et durée)', () => {
    const timers = getStepTimers('Cuire 10 minutes, puis encore 10 minutes')
    expect(timers).toHaveLength(1)
  })

  it('renvoie un tableau vide sans durée', () => {
    expect(getStepTimers('Mélanger les ingrédients')).toEqual([])
  })
})
