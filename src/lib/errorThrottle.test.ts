import { describe, expect, it } from 'vitest'

import {
  DEDUPE_WINDOW_MS,
  MAX_PER_SESSION,
  createThrottleState,
  shouldReport,
} from './errorThrottle'

const T0 = 1_000_000

describe('shouldReport — anti-doublon', () => {
  it('laisse passer une première erreur', () => {
    expect(shouldReport(createThrottleState(), 'Boom', T0)).toBe(true)
  })

  it('bloque le même message dans la minute', () => {
    const state = createThrottleState()
    shouldReport(state, 'Boom', T0)
    expect(shouldReport(state, 'Boom', T0 + 1000)).toBe(false)
    expect(shouldReport(state, 'Boom', T0 + DEDUPE_WINDOW_MS - 1)).toBe(false)
  })

  it('laisse repasser le même message après la fenêtre', () => {
    const state = createThrottleState()
    shouldReport(state, 'Boom', T0)
    expect(shouldReport(state, 'Boom', T0 + DEDUPE_WINDOW_MS)).toBe(true)
  })

  it('ne confond pas deux messages différents', () => {
    const state = createThrottleState()
    shouldReport(state, 'Boom', T0)
    expect(shouldReport(state, 'Patatras', T0)).toBe(true)
  })
})

describe('shouldReport — plafond par session', () => {
  it('se tait au-delà du plafond', () => {
    const state = createThrottleState()
    for (let i = 0; i < MAX_PER_SESSION; i += 1) {
      expect(shouldReport(state, `Erreur ${i}`, T0)).toBe(true)
    }
    expect(shouldReport(state, 'Une de trop', T0)).toBe(false)
  })

  it('résiste à un composant qui plante en boucle', () => {
    // Le cas qui remplirait la base : la même erreur, mille fois, très vite.
    const state = createThrottleState()
    let envoyees = 0
    for (let i = 0; i < 1000; i += 1) {
      if (shouldReport(state, 'Boucle infernale', T0 + i)) envoyees += 1
    }
    expect(envoyees).toBe(1)
  })

  it('reste borné même avec mille messages tous différents', () => {
    const state = createThrottleState()
    let envoyees = 0
    for (let i = 0; i < 1000; i += 1) {
      if (shouldReport(state, `Erreur ${i}`, T0)) envoyees += 1
    }
    expect(envoyees).toBe(MAX_PER_SESSION)
  })
})
