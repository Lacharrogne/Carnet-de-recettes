export type RecipePublicationBadge = {
  id: string
  minRecipes: number
  name: string
  emoji: string
  description: string
  unlockedText: string
}

export const RECIPE_PUBLICATION_BADGES: RecipePublicationBadge[] = [
  {
    id: 'petite-toque',
    minRecipes: 1,
    name: 'Petite toque',
    emoji: '👨‍🍳',
    description: 'Publier sa première recette.',
    unlockedText: 'Première recette publiée.',
  },
  {
    id: 'chef-casserole',
    minRecipes: 5,
    name: 'Chef de la casserole',
    emoji: '🍲',
    description: 'Publier 5 recettes.',
    unlockedText: 'Commence à bien remplir le carnet.',
  },
  {
    id: 'maitre-tablier',
    minRecipes: 10,
    name: 'Maître du tablier',
    emoji: '🥘',
    description: 'Publier 10 recettes.',
    unlockedText: 'Un vrai habitué de la cuisine maison.',
  },
  {
    id: 'roi-spatule',
    minRecipes: 20,
    name: 'Roi de la spatule',
    emoji: '🥄',
    description: 'Publier 20 recettes.',
    unlockedText: 'Manie les recettes avec autorité.',
  },
  {
    id: 'gourou-gratin',
    minRecipes: 30,
    name: 'Grand gourou du gratin',
    emoji: '🧀',
    description: 'Publier 30 recettes.',
    unlockedText: 'Une référence du plat réconfortant.',
  },
  {
    id: 'legende-frigo',
    minRecipes: 50,
    name: 'Légende du frigo',
    emoji: '🥶',
    description: 'Publier 50 recettes.',
    unlockedText: 'Transforme n’importe quel ingrédient en recette.',
  },
  {
    id: 'dieu-tambouille',
    minRecipes: 100,
    name: 'Dieu de la tambouille',
    emoji: '⚡',
    description: 'Publier 100 recettes.',
    unlockedText: 'A atteint le sommet sacré du carnet.',
  },
]

export function getRecipePublicationBadge(recipeCount: number) {
  return [...RECIPE_PUBLICATION_BADGES]
    .reverse()
    .find((badge) => recipeCount >= badge.minRecipes)
}

export function getNextRecipePublicationBadge(recipeCount: number) {
  return RECIPE_PUBLICATION_BADGES.find(
    (badge) => recipeCount < badge.minRecipes,
  )
}

export function getRecipePublicationProgress(recipeCount: number) {
  const currentBadge = getRecipePublicationBadge(recipeCount)
  const nextBadge = getNextRecipePublicationBadge(recipeCount)

  if (!nextBadge) {
    return {
      currentBadge,
      nextBadge: null,
      percent: 100,
      remainingRecipes: 0,
      currentMinRecipes: currentBadge?.minRecipes ?? 0,
      nextMinRecipes: currentBadge?.minRecipes ?? 0,
    }
  }

  const currentMinRecipes = currentBadge?.minRecipes ?? 0
  const nextMinRecipes = nextBadge.minRecipes
  const totalNeeded = nextMinRecipes - currentMinRecipes
  const currentProgress = Math.max(0, recipeCount - currentMinRecipes)

  return {
    currentBadge,
    nextBadge,
    percent: Math.min(100, Math.round((currentProgress / totalNeeded) * 100)),
    remainingRecipes: Math.max(0, nextMinRecipes - recipeCount),
    currentMinRecipes,
    nextMinRecipes,
  }
}