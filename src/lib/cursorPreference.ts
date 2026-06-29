import { useCallback, useState } from 'react'

/**
 * Préférence de curseur du Carnet de recettes.
 *
 * Le curseur « gant de cuisine » fait partie de l'identité de l'app, mais
 * certains préfèrent le curseur système. La préférence est stockée en local
 * (par appareil) et appliquée via l'attribut `data-cursor` sur <html> : le
 * CSS (index.css) n'affiche le curseur personnalisé que pour
 * `html[data-cursor='kitchen']`.
 */

export type CursorId = 'kitchen' | 'default'

export interface CursorOption {
  id: CursorId
  label: string
  description: string
  /** Aperçu affiché dans le sélecteur. */
  preview: string
}

export const CURSOR_OPTIONS: CursorOption[] = [
  {
    id: 'kitchen',
    label: 'Gant de cuisine',
    description: 'Le curseur signature du carnet.',
    preview: '🧤',
  },
  {
    id: 'default',
    label: 'Normal',
    description: 'Le curseur classique de votre appareil.',
    preview: '🖱️',
  },
]

const STORAGE_KEY = 'cr-cursor'
const DEFAULT_CURSOR: CursorId = 'kitchen'

function isCursorId(value: string | null): value is CursorId {
  return value === 'kitchen' || value === 'default'
}

/** Lit la préférence enregistrée (gant de cuisine par défaut). */
export function getStoredCursor(): CursorId {
  if (typeof window === 'undefined') {
    return DEFAULT_CURSOR
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isCursorId(stored) ? stored : DEFAULT_CURSOR
}

/** Applique le curseur en posant l'attribut `data-cursor` sur <html>. */
export function applyCursor(id: CursorId): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.cursor = id
  }
}

/** Applique la préférence enregistrée — à appeler au démarrage de l'app. */
export function initCursor(): void {
  applyCursor(getStoredCursor())
}

/**
 * Hook du sélecteur de curseur : expose la valeur courante et un setter qui
 * persiste et applique immédiatement le choix.
 */
export function useCursorPreference() {
  const [cursor, setCursorState] = useState<CursorId>(getStoredCursor)

  const setCursor = useCallback((id: CursorId) => {
    setCursorState(id)
    applyCursor(id)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, id)
    }
  }, [])

  return { cursor, setCursor }
}
