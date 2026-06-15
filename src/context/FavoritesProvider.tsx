import { useCallback, useEffect, useState, type ReactNode } from 'react'

import {
  addFavorite,
  getFavoriteRecipeIds,
  removeFavorite,
} from '../services/favorites'
import { FavoritesContext } from './favorites-context'
import { useAuth } from './useAuth'

export default function FavoritesProvider({
  children,
}: {
  children: ReactNode
}) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)

  // Charge la liste complète des favoris une seule fois par session utilisateur.
  useEffect(() => {
    let ignore = false

    if (!userId) {
      // Reset légitime à la déconnexion (changement de dépendance userId).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFavoriteIds(new Set())
      return
    }

    setLoading(true)

    getFavoriteRecipeIds()
      .then((ids) => {
        if (!ignore) {
          setFavoriteIds(new Set(ids))
        }
      })
      .catch((error) => {
        console.error(error)
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [userId])

  const isFavorite = useCallback(
    (recipeId: number) => favoriteIds.has(recipeId),
    [favoriteIds],
  )

  const toggleFavorite = useCallback(
    async (recipeId: number) => {
      const wasFavorite = favoriteIds.has(recipeId)
      const nextValue = !wasFavorite

      // Mise à jour optimiste pour un retour instantané.
      setFavoriteIds((current) => {
        const next = new Set(current)
        if (nextValue) {
          next.add(recipeId)
        } else {
          next.delete(recipeId)
        }
        return next
      })

      try {
        if (nextValue) {
          await addFavorite(recipeId)
        } else {
          await removeFavorite(recipeId)
        }

        return nextValue
      } catch (error) {
        // Rollback en cas d'échec.
        setFavoriteIds((current) => {
          const next = new Set(current)
          if (wasFavorite) {
            next.add(recipeId)
          } else {
            next.delete(recipeId)
          }
          return next
        })

        throw error
      }
    },
    [favoriteIds],
  )

  return (
    <FavoritesContext.Provider value={{ loading, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}
