import { describe, expect, it } from 'vitest'

import { decideEntitlement, type EntitlementInput } from './entitlementDecision'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = new Date('2026-09-04T12:00:00Z').getTime()

/** Compte créé il y a `days` jours. */
const createdDaysAgo = (days: number) => new Date(NOW - days * DAY_MS)

const base: EntitlementInput = {
  subscriptionActive: false,
  loadFailed: false,
  lastKnownPremium: false,
  accountCreatedAt: createdDaysAgo(1),
  now: NOW,
  enforceTrial: true,
  trialDurationDays: 14,
}

const decide = (patch: Partial<EntitlementInput> = {}) =>
  decideEntitlement({ ...base, ...patch })

describe('decideEntitlement — cas nominaux', () => {
  it('donne accès à un abonné', () => {
    const d = decide({ subscriptionActive: true })
    expect(d.isPremium).toBe(true)
    expect(d.hasAccess).toBe(true)
    expect(d.status).toBe('premium')
  })

  it('donne accès pendant l’essai et décompte les jours', () => {
    const d = decide({ accountCreatedAt: createdDaysAgo(4) })
    expect(d.status).toBe('trialing')
    expect(d.hasAccess).toBe(true)
    expect(d.daysLeft).toBe(10)
  })

  it('refuse l’accès une fois l’essai terminé, sans abonnement', () => {
    const d = decide({ accountCreatedAt: createdDaysAgo(20) })
    expect(d.status).toBe('expired')
    expect(d.hasAccess).toBe(false)
    expect(d.daysLeft).toBe(0)
  })

  it('laisse tout le monde entrer quand le verrou est désactivé', () => {
    const d = decide({ accountCreatedAt: createdDaysAgo(20), enforceTrial: false })
    expect(d.status).toBe('expired')
    expect(d.hasAccess).toBe(true)
  })

  it('considère l’essai terminé dès qu’on est abonné', () => {
    const d = decide({ subscriptionActive: true, accountCreatedAt: createdDaysAgo(2) })
    expect(d.daysLeft).toBe(0)
  })
})

describe('decideEntitlement — échec de lecture (le bug corrigé)', () => {
  it('n’enferme PAS un abonné dont la lecture d’abonnement a échoué', () => {
    // Le cas historique : essai terminé + lecture en erreur → la personne
    // était considérée comme non abonnée et se retrouvait dehors.
    const d = decide({
      accountCreatedAt: createdDaysAgo(60),
      loadFailed: true,
      lastKnownPremium: true,
    })
    expect(d.hasAccess).toBe(true)
    expect(d.isPremium).toBe(true)
    expect(d.status).toBe('premium')
    expect(d.degraded).toBe(true)
  })

  it('laisse entrer même sans dernier état connu (on ne verrouille pas sur un doute)', () => {
    const d = decide({
      accountCreatedAt: createdDaysAgo(60),
      loadFailed: true,
      lastKnownPremium: false,
    })
    expect(d.hasAccess).toBe(true)
    expect(d.degraded).toBe(true)
  })

  it('signale le mode dégradé uniquement en cas d’échec', () => {
    expect(decide().degraded).toBe(false)
    expect(decide({ loadFailed: true }).degraded).toBe(true)
  })

  it('ne fabrique pas un abonnement : lecture réussie sans ligne = non abonné', () => {
    const d = decide({
      accountCreatedAt: createdDaysAgo(60),
      subscriptionActive: false,
      lastKnownPremium: true, // un ancien état ne doit pas primer sur une lecture réussie
    })
    expect(d.isPremium).toBe(false)
    expect(d.hasAccess).toBe(false)
  })
})

describe('decideEntitlement — bords', () => {
  it('accorde l’essai complet si la date de création est inconnue', () => {
    const d = decide({ accountCreatedAt: null })
    expect(d.status).toBe('trialing')
    expect(d.daysLeft).toBe(14)
    expect(d.trialEndsAt).toBeNull()
  })

  it('bascule en expiré à l’instant exact de la fin d’essai', () => {
    const d = decide({ accountCreatedAt: new Date(NOW - 14 * DAY_MS) })
    expect(d.status).toBe('expired')
    expect(d.hasAccess).toBe(false)
  })
})
