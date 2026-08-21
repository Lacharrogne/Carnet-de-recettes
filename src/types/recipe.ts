export type RecipeCategory =
  | 'Entrée'
  | 'Plat'
  | 'Boisson'
  | 'Sucré'
  | 'Petit-déjeuner'
  | 'Végétarien'

export type Difficulty = 'Facile' | 'Moyen' | 'Difficile'

/** Brouillon (visible du seul auteur) ou recette publiée (visible de tous). */
export type RecipeStatus = 'draft' | 'published'

export type Recipe = {
  id: number
  userId: string | null
  title: string
  category: RecipeCategory
  difficulty: Difficulty
  prepTime: number
  cookTime: number
  servings: number
  description: string
  image: string
  imageUrl: string | null
  tags: string[]
  ingredients: string[]
  steps: string[]
  relatedRecipeIds: number[]
  status: RecipeStatus
}