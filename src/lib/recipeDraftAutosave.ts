/**
 * Sauvegarde automatique (locale) du formulaire d'ajout de recette en cours.
 * Protège contre la perte de travail si l'onglet est fermé, en complément du
 * bouton « Enregistrer le brouillon » (qui, lui, persiste sur le compte).
 *
 * On stocke l'instantané BRUT du formulaire (les champs numériques restent des
 * chaînes) pour restaurer exactement ce que la personne avait saisi.
 */
const STORAGE_KEY = 'recettes-add-autosave'

export type RecipeDraftSnapshot = {
  title: string
  category: string
  difficulty: string
  prepTime: string
  cookTime: string
  servings: string
  description: string
  image: string
  tags: string[]
  ingredients: string[]
  steps: string[]
  relatedRecipeIds: number[]
}

export function loadRecipeDraftSnapshot(): RecipeDraftSnapshot | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RecipeDraftSnapshot) : null
  } catch {
    return null
  }
}

export function saveRecipeDraftSnapshot(snapshot: RecipeDraftSnapshot): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Stockage indisponible (mode privé, quota) : on ignore silencieusement.
  }
}

export function clearRecipeDraftSnapshot(): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignoré.
  }
}

/** Un instantané contient-il quelque chose qui vaille la peine d'être restauré ? */
export function snapshotHasContent(snapshot: RecipeDraftSnapshot | null): boolean {
  if (!snapshot) return false

  return Boolean(
    snapshot.title.trim() ||
      snapshot.description.trim() ||
      snapshot.ingredients.some((value) => value.trim()) ||
      snapshot.steps.some((value) => value.trim()),
  )
}
