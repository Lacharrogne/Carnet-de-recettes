import { useCallback, useEffect, useState, type ReactNode } from 'react'

import { useAuth } from './useAuth'
import {
  getStoredVisibility,
  storeVisibility,
  type RecipeVisibility,
} from '../lib/recipeVisibility'
import { applyCursor, storeCursor, toCursorId } from '../lib/cursorPreference'
import {
  getAccountPreferences,
  saveAccountPreference,
} from '../services/preferences'
import { RecipeVisibilityContext } from './recipe-visibility-context'

/**
 * Fournit la préférence de visibilité des recettes (contexte partagé
 * profil ⇄ page Recettes) et synchronise les préférences « qui suivent le
 * compte » (visibilité + curseur) via Supabase, en plus du stockage local
 * instantané. Tolérant : sans compte ou sans table, on reste sur le local.
 */
export default function RecipeVisibilityProvider({
  children,
}: {
  children: ReactNode
}) {
  const { user } = useAuth()
  const [visibility, setVisibilityState] =
    useState<RecipeVisibility>(getStoredVisibility)

  // À la connexion : on récupère les préférences du compte (elles priment sur
  // le local, pour suivre l'utilisateur d'un appareil à l'autre).
  useEffect(() => {
    if (!user) {
      return
    }

    let ignore = false

    getAccountPreferences(user.id)
      .then((prefs) => {
        if (ignore || !prefs) {
          return
        }

        if (prefs.recipeVisibility) {
          setVisibilityState(prefs.recipeVisibility)
          storeVisibility(prefs.recipeVisibility)
        }

        const cursor = toCursorId(prefs.cursor)
        if (cursor) {
          applyCursor(cursor)
          storeCursor(cursor)
        }
      })
      .catch(() => {
        // Compte/table indisponible : on garde la préférence locale.
      })

    return () => {
      ignore = true
    }
  }, [user])

  const setVisibility = useCallback(
    (next: RecipeVisibility) => {
      setVisibilityState(next)
      storeVisibility(next)

      if (user) {
        void saveAccountPreference(user.id, { recipeVisibility: next })
      }
    },
    [user],
  )

  return (
    <RecipeVisibilityContext.Provider value={{ visibility, setVisibility }}>
      {children}
    </RecipeVisibilityContext.Provider>
  )
}
