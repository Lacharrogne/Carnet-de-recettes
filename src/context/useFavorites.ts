import { useContext } from 'react'
import { FavoritesContext } from './favorites-context'

export function useFavorites() {
  return useContext(FavoritesContext)
}
