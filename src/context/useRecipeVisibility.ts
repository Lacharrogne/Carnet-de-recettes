import { useContext } from 'react'

import { RecipeVisibilityContext } from './recipe-visibility-context'

export function useRecipeVisibility() {
  return useContext(RecipeVisibilityContext)
}
