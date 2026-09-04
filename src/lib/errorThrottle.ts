/**
 * Décide si une erreur mérite d'être remontée : anti-doublon et plafond par
 * session. Logique **pure** (l'horloge est passée en paramètre) pour rester
 * testable — c'est elle qui empêche un composant en boucle de remplir la base.
 */

export type ThrottleState = {
  sent: number
  lastSentAt: Map<string, number>
}

export const MAX_PER_SESSION = 10
export const DEDUPE_WINDOW_MS = 60_000

export function createThrottleState(): ThrottleState {
  return { sent: 0, lastSentAt: new Map() }
}

/**
 * `true` si l'erreur doit partir. Met l'état à jour au passage.
 *
 * - un même message n'est pas renvoyé avant `DEDUPE_WINDOW_MS` ;
 * - au-delà de `MAX_PER_SESSION` envois, on se tait : le problème est signalé.
 */
export function shouldReport(
  state: ThrottleState,
  message: string,
  now: number,
): boolean {
  if (state.sent >= MAX_PER_SESSION) return false

  const previous = state.lastSentAt.get(message)
  if (previous !== undefined && now - previous < DEDUPE_WINDOW_MS) return false

  state.lastSentAt.set(message, now)
  state.sent += 1
  return true
}
