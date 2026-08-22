import { useEffect, useState } from 'react'

/**
 * Historique de cuisine « Déjà cuisiné » — combien de fois et quand une recette
 * a été cuisinée. Stocké localement (par appareil), gratuit et instantané.
 * Réactif : les composants montés se mettent à jour quand on enregistre.
 */

const STORAGE_KEY = 'cr-cooking-history'
const CHANGE_EVENT = 'cr-cooking-history-change'

export type CookingEntry = {
  count: number
  /** Date ISO du dernier « J'ai cuisiné ça ». */
  lastCookedAt: string
}

export type CookingHistory = Record<string, CookingEntry>

export function getCookingHistory(): CookingHistory {
  if (typeof window === 'undefined') {
    return {}
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CookingHistory) : {}
  } catch {
    return {}
  }
}

function writeHistory(history: CookingHistory) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
  } catch {
    // Stockage indisponible → on ignore.
  }
}

/** Marque une recette comme cuisinée (incrémente le compteur, date = maintenant). */
export function recordCooked(recipeId: number | string) {
  const history = getCookingHistory()
  const key = String(recipeId)
  const current = history[key]

  history[key] = {
    count: (current?.count ?? 0) + 1,
    lastCookedAt: new Date().toISOString(),
  }

  writeHistory(history)
}

/** Annule le dernier enregistrement (décrémente / supprime). */
export function undoCooked(recipeId: number | string) {
  const history = getCookingHistory()
  const key = String(recipeId)
  const current = history[key]
  if (!current) return

  if (current.count <= 1) {
    delete history[key]
  } else {
    history[key] = { ...current, count: current.count - 1 }
  }

  writeHistory(history)
}

export function getCookingEntry(
  history: CookingHistory,
  recipeId: number | string,
): CookingEntry | null {
  return history[String(recipeId)] ?? null
}

/** Hook réactif : historique courant + actions. */
export function useCookingHistory() {
  const [history, setHistory] = useState<CookingHistory>(getCookingHistory)

  useEffect(() => {
    const sync = () => setHistory(getCookingHistory())
    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return { history, recordCooked, undoCooked }
}

/** Formate une date ISO en « 12 août 2026 » (français). */
export function formatCookedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}
