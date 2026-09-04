/**
 * Décision d'accès : à partir de l'abonnement lu et de l'ancienneté du compte,
 * dit si la personne a accès à l'application, et dans quel état elle se trouve.
 *
 * Logique volontairement **pure** (aucune entrée/sortie) : c'est elle qui
 * décide si un client payant entre ou reste dehors, elle doit donc rester
 * testable et lisible.
 *
 * Principe directeur — **on ne verrouille jamais sur un doute.** Si la lecture
 * de l'abonnement a échoué (réseau coupé, Supabase indisponible, jeton expiré),
 * on laisse entrer : mieux vaut accorder quelques minutes d'accès de trop que
 * fermer la porte à quelqu'un qui paie.
 */

const DAY_MS = 24 * 60 * 60 * 1000

export type EntitlementStatus = 'premium' | 'trialing' | 'expired'

export type EntitlementInput = {
  /** L'abonnement lu donne-t-il accès à ce carnet ? (`isSubscriptionActive`) */
  subscriptionActive: boolean
  /** La lecture de l'abonnement a-t-elle échoué ? */
  loadFailed: boolean
  /** Dernier statut premium connu, mémorisé localement (repli en cas d'échec). */
  lastKnownPremium: boolean
  /** Date de création du compte, base de l'essai gratuit. */
  accountCreatedAt: Date | null
  /** Instant courant, en millisecondes. */
  now: number
  enforceTrial: boolean
  trialDurationDays: number
}

export type EntitlementDecision = {
  status: EntitlementStatus
  isPremium: boolean
  hasAccess: boolean
  daysLeft: number
  trialEndsAt: Date | null
  /** Vrai quand la décision repose sur un repli, faute d'avoir pu lire l'abonnement. */
  degraded: boolean
}

export function decideEntitlement(input: EntitlementInput): EntitlementDecision {
  const {
    subscriptionActive,
    loadFailed,
    lastKnownPremium,
    accountCreatedAt,
    now,
    enforceTrial,
    trialDurationDays,
  } = input

  // Lecture impossible : on repart du dernier état connu plutôt que de
  // considérer la personne comme non abonnée.
  const isPremium = loadFailed ? lastKnownPremium : subscriptionActive

  const trialEndsAt = accountCreatedAt
    ? new Date(accountCreatedAt.getTime() + trialDurationDays * DAY_MS)
    : null

  const msLeft = trialEndsAt
    ? trialEndsAt.getTime() - now
    : trialDurationDays * DAY_MS

  // Dès qu'on est abonné, l'essai est considéré terminé (il ne « reste » plus).
  const isTrialing = !isPremium && msLeft > 0
  const daysLeft = isPremium ? 0 : Math.max(0, Math.ceil(msLeft / DAY_MS))

  const status: EntitlementStatus = isPremium
    ? 'premium'
    : isTrialing
      ? 'trialing'
      : 'expired'

  // Fail-open : tant qu'on n'a pas pu lire l'abonnement, on n'enferme personne.
  const hasAccess = !enforceTrial || isPremium || isTrialing || loadFailed

  return { status, isPremium, hasAccess, daysLeft, trialEndsAt, degraded: loadFailed }
}

/* ------------------------------------------------------------------------ */
/*  Mémoire du dernier état connu (non pure : localStorage, par appareil).    */
/* ------------------------------------------------------------------------ */

const STORAGE_PREFIX = 'entitlement:lastKnownPremium:'

/** Retient si la personne était abonnée, pour servir de repli hors-ligne. */
export function rememberPremium(userId: string, premium: boolean): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, premium ? '1' : '0')
  } catch {
    /* stockage indisponible : on s'en passe */
  }
}

/** Dernier statut premium connu pour ce compte (`false` si inconnu). */
export function readLastKnownPremium(userId: string): boolean {
  try {
    return localStorage.getItem(STORAGE_PREFIX + userId) === '1'
  } catch {
    return false
  }
}
