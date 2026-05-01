export type RecipeCategory =
  | 'Entrée'
  | 'Plat'
  | 'Boisson'
  | 'Sucré'
  | 'Petit-déjeuner'
  | 'Healthy'

export type Difficulty = 'Facile' | 'Moyen' | 'Difficile'

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
}