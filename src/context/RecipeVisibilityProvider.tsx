import { useCallback, useState, type ReactNode } from 'react'

import {
  getStoredVisibility,
  storeVisibility,
  type RecipeVisibility,
} from '../lib/recipeVisibility'
import { RecipeVisibilityContext } from './recipe-visibility-context'

/**
 * Partage la préférence de visibilité des recettes entre la page Recettes
 * (filtre rapide) et le profil (réglage par défaut), avec persistance locale.
 */
export default function RecipeVisibilityProvider({
  children,
}: {
  children: ReactNode
}) {
  const [visibility, setVisibilityState] =
    useState<RecipeVisibility>(getStoredVisibility)

  const setVisibility = useCallback((next: RecipeVisibility) => {
    setVisibilityState(next)
    storeVisibility(next)
  }, [])

  return (
    <RecipeVisibilityContext.Provider value={{ visibility, setVisibility }}>
      {children}
    </RecipeVisibilityContext.Provider>
  )
}
