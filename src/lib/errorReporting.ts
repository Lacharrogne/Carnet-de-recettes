import { supabase } from './supabase'

import {
  createThrottleState,
  shouldReport,
} from './errorThrottle'

/**
 * Remonte les erreurs rencontrées par les utilisateurs vers la table
 * `client_errors`, pour qu'un incident cesse d'être invisible.
 *
 * Trois règles de conduite :
 *
 *  1. **Ne jamais nuire.** Toute défaillance de la remontée est avalée : un
 *     problème de journalisation ne doit pas devenir un problème d'application.
 *  2. **Ne jamais inonder.** Doublons ignorés, débit plafonné par session — un
 *     composant qui plante en boucle ne remplira pas la base.
 *  3. **Ne pas divulguer.** Seul le chemin de la page est envoyé, jamais les
 *     paramètres d'URL, qui peuvent contenir des jetons.
 *
 * Actif en production uniquement : en développement, la console suffit.
 */

const APP = 'recettes'

const MAX_MESSAGE = 2000
const MAX_STACK = 8000

const throttle = createThrottleState()
let currentUserId: string | null = null

const enabled = typeof window !== 'undefined' && import.meta.env.PROD

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value
}

/** Chemin seul : les paramètres d'URL peuvent contenir des jetons. */
function currentPath(): string {
  try {
    return truncate(window.location.pathname, 300)
  } catch {
    return ''
  }
}

function shouldSend(message: string): boolean {
  if (!enabled) return false
  return shouldReport(throttle, message, Date.now())
}

/**
 * Signale une erreur. Utilisable directement depuis un `ErrorBoundary` ou un
 * bloc `catch` dont l'échec mérite d'être connu.
 */
export function reportError(error: unknown, context?: string): void {
  try {
    const raw =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Erreur inconnue'

    const message = truncate(context ? `${context} — ${raw}` : raw, MAX_MESSAGE)
    if (!message || !shouldSend(message)) return

    const stack =
      error instanceof Error && error.stack
        ? truncate(error.stack, MAX_STACK)
        : null

    // Volontairement sans `await` : la remontée ne doit rien ralentir, et son
    // échec ne doit jamais remonter jusqu'à l'application.
    void supabase
      .from('client_errors')
      .insert({
        user_id: currentUserId,
        app: APP,
        message,
        stack,
        path: currentPath(),
        user_agent: truncate(navigator.userAgent ?? '', 500),
      })
      .then(() => undefined, () => undefined)
  } catch {
    /* on n'aggrave jamais une erreur en tentant de la signaler */
  }
}

if (enabled) {
  window.addEventListener('error', (event) => {
    reportError(event.error ?? event.message)
  })

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, 'Promesse rejetée')
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUserId = session?.user?.id ?? null
  })
}
