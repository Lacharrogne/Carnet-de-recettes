import { useEffect, useState } from 'react'

/**
 * Maintient l'écran allumé tant que `active` est vrai (utile en mode cuisine).
 *
 * S'appuie sur l'API Wake Lock quand elle est disponible. Le verrou est
 * automatiquement redemandé lorsque l'onglet redevient visible (le navigateur
 * le relâche quand la page passe en arrière-plan), et libéré quand `active`
 * repasse à faux ou au démontage.
 *
 * Renvoie `true` tant qu'un verrou est effectivement tenu (pour un éventuel
 * indicateur d'interface).
 */
export function useWakeLock(active: boolean): boolean {
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    if (!active) {
      return
    }

    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return
    }

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const request = async () => {
      try {
        const nextSentinel = await navigator.wakeLock.request('screen')

        if (cancelled) {
          void nextSentinel.release()
          return
        }

        sentinel = nextSentinel
        setIsLocked(true)
        // Le navigateur relâche le verrou en arrière-plan : on suit l'état.
        nextSentinel.addEventListener('release', () => setIsLocked(false))
      } catch {
        // Refus (batterie faible, permission...) : on reste silencieux.
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void request()
      }
    }

    void request()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (sentinel) {
        // Déclenche l'événement « release » qui remettra isLocked à faux.
        void sentinel.release()
        sentinel = null
      }
    }
  }, [active])

  return isLocked
}
