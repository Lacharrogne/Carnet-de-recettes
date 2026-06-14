import { createContext } from 'react'

export type FavoritesContextValue = {
  // true tant que la liste initiale des favoris n'est pas chargée.
  loading: boolean
  isFavorite: (recipeId: number) => boolean
  // Bascule le favori et renvoie le nouvel état (true = ajouté).
  toggleFavorite: (recipeId: number) => Promise<boolean>
}

export const FavoritesContext = createContext<FavoritesContextValue>({
  loading: false,
  isFavorite: () => false,
  toggleFavorite: async () => false,
})
