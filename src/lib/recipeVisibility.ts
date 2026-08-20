import type { Recipe } from '../types/recipe'

/**
 * Visibilité des recettes affichées dans « Toutes les recettes ».
 *
 * - community : toute la communauté (par défaut).
 * - mine      : uniquement mes recettes.
 * - friends   : mes recettes + celles de tous mes amis.
 * - friend    : mes recettes + celles d'un ami précis (`friendId`).
 *
 * La préférence est stockée en local (par appareil), comme le curseur.
 */
export type RecipeVisibilityMode = 'community' | 'mine' | 'friends' | 'friend'

export type RecipeVisibility = {
  mode: RecipeVisibilityMode
  /** Ami sélectionné quand `mode === 'friend'`. */
  friendId: string | null
}

export const DEFAULT_RECIPE_VISIBILITY: RecipeVisibility = {
  mode: 'community',
  friendId: null,
}

const STORAGE_KEY = 'cr-recipe-visibility'

function isMode(value: unknown): value is RecipeVisibilityMode {
  return (
    value === 'community' ||
    value === 'mine' ||
    value === 'friends' ||
    value === 'friend'
  )
}

/** Lit la préférence enregistrée (communauté par défaut). */
export function getStoredVisibility(): RecipeVisibility {
  if (typeof window === 'undefined') {
    return DEFAULT_RECIPE_VISIBILITY
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_RECIPE_VISIBILITY
    }

    const parsed = JSON.parse(raw) as Partial<RecipeVisibility>
    if (isMode(parsed.mode)) {
      return {
        mode: parsed.mode,
        friendId:
          typeof parsed.friendId === 'string' ? parsed.friendId : null,
      }
    }
  } catch {
    // Valeur illisible : on repart sur le défaut.
  }

  return DEFAULT_RECIPE_VISIBILITY
}

/** Enregistre la préférence en local. */
export function storeVisibility(visibility: RecipeVisibility): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility))
  } catch {
    // localStorage indisponible : on ignore silencieusement.
  }
}

/**
 * Une recette passe-t-elle le filtre de visibilité courant ?
 * Mes recettes sont toujours incluses dans les modes « amis ».
 */
export function recipeMatchesVisibility(
  recipe: Recipe,
  visibility: RecipeVisibility,
  myId: string | null,
  friendIds: Set<string>,
): boolean {
  const author = recipe.userId ?? null
  const isMine = Boolean(myId) && author === myId

  switch (visibility.mode) {
    case 'mine':
      return isMine
    case 'friend':
      return (
        isMine ||
        (Boolean(visibility.friendId) && author === visibility.friendId)
      )
    case 'friends':
      return isMine || (author !== null && friendIds.has(author))
    case 'community':
    default:
      return true
  }
}
