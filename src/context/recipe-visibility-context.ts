import { createContext } from 'react'

import {
  DEFAULT_RECIPE_VISIBILITY,
  type RecipeVisibility,
} from '../lib/recipeVisibility'

export type RecipeVisibilityContextValue = {
  visibility: RecipeVisibility
  setVisibility: (visibility: RecipeVisibility) => void
}

export const RecipeVisibilityContext =
  createContext<RecipeVisibilityContextValue>({
    visibility: DEFAULT_RECIPE_VISIBILITY,
    setVisibility: () => {},
  })
