import { useCallback, useState } from 'react'

/**
 * Préférence de thème (clair / sombre) du Carnet de recettes.
 *
 * Le choix est stocké en local (par appareil) et appliqué via l'attribut
 * `data-theme` sur <html> : le CSS (index.css) redéfinit alors les variables
 * de couleur en sombre. Sans choix enregistré, on suit la préférence système.
 */

export type ThemeId = 'light' | 'dark'

const STORAGE_KEY = 'cr-theme'

function isThemeId(value: string | null): value is ThemeId {
  return value === 'light' || value === 'dark'
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

/** Lit la préférence enregistrée, sinon suit le thème du système. */
export function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)

  if (isThemeId(stored)) {
    return stored
  }

  return systemPrefersDark() ? 'dark' : 'light'
}

/** Applique le thème en posant l'attribut `data-theme` sur <html>. */
export function applyTheme(id: ThemeId): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = id
  }
}

/** Applique la préférence enregistrée — à appeler au démarrage de l'app. */
export function initTheme(): void {
  applyTheme(getStoredTheme())
}

/**
 * Hook du sélecteur de thème : expose le thème courant, un setter et une
 * bascule, qui persistent et appliquent immédiatement le choix.
 */
export function useThemePreference() {
  const [theme, setThemeState] = useState<ThemeId>(getStoredTheme)

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id)
    applyTheme(id)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, id)
    }
  }, [])

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggle }
}
