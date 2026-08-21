import { supabase } from '../lib/supabase'

/** Recette normalisée renvoyée par la fonction serveur `import-recipe`. */
export type ImportedRecipe = {
  title: string
  description: string
  ingredients: string[]
  steps: string[]
  prepTime: number
  cookTime: number
  servings: number
  imageUrl: string | null
  sourceUrl: string
}

/**
 * Importe une recette depuis l'URL d'un site de cuisine. Le travail (récupérer
 * la page, lire les données structurées schema.org) est fait par une Edge
 * Function côté serveur — le navigateur ne peut pas récupérer une page tierce
 * (CORS).
 */
export async function importRecipeFromUrl(url: string): Promise<ImportedRecipe> {
  const { data, error } = await supabase.functions.invoke('import-recipe', {
    body: { url },
  })

  if (error) {
    // Erreur réseau / fonction non déployée : message générique.
    throw new Error(
      "L'import n'a pas pu aboutir. Réessaie dans un instant, ou saisis la recette à la main.",
    )
  }

  if (!data?.ok) {
    throw new Error(data?.error ?? "Impossible d'importer cette recette.")
  }

  return data.recipe as ImportedRecipe
}
