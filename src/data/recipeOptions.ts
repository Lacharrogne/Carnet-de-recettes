import type { Difficulty, RecipeCategory } from '../types/recipe'

export const RECIPE_CATEGORIES: {
  label: string
  value: RecipeCategory
  emoji: string
  description: string
}[] = [
  {
    label: 'Apéritifs & entrées',
    value: 'Entrée',
    emoji: '🥗',
    description:
      'Des petites recettes pour commencer le repas ou partager un apéritif.',
  },
  {
    label: 'Plats & accompagnements',
    value: 'Plat',
    emoji: '🍝',
    description:
      'Les recettes complètes du quotidien, avec leurs accompagnements.',
  },
  {
    label: 'Desserts & goûters',
    value: 'Sucré',
    emoji: '🍰',
    description:
      'Des recettes sucrées pour finir le repas ou se faire plaisir.',
  },
  {
    label: 'Petit-déjeuner & brunch',
    value: 'Petit-déjeuner',
    emoji: '🥞',
    description:
      'Des idées pour le matin, le brunch ou les petits-déjeuners gourmands.',
  },
  {
    label: 'Boissons',
    value: 'Boisson',
    emoji: '🥤',
    description:
      'Des boissons fraîches, chaudes ou originales à préparer à la maison.',
  },
  {
    label: 'Healthy',
    value: 'Healthy',
    emoji: '🥦',
    description:
      'Des recettes plus équilibrées, légères ou riches en bons ingrédients.',
  },
]

export const DEFAULT_RECIPE_CATEGORY: RecipeCategory = 'Plat'

export const RECIPE_DIFFICULTIES: Difficulty[] = [
  'Facile',
  'Moyen',
  'Difficile',
]

export const RECIPE_TAG_GROUPS = [
  {
    title: 'Type de recette',
    tags: [
      {
        label: 'Sucré',
        value: 'Sucré',
      },
      {
        label: 'Salé',
        value: 'Salé',
      },
      {
        label: 'Healthy',
        value: 'Healthy',
      },
      {
        label: 'Rapide',
        value: 'Rapide',
      },
      {
        label: 'Familial',
        value: 'Familial',
      },
    ],
  },
  {
    title: 'Moment du repas',
    tags: [
      {
        label: 'Apéritif',
        value: 'Apéritif',
      },
      {
        label: 'Entrée',
        value: 'Entrée',
      },
      {
        label: 'Déjeuner',
        value: 'Déjeuner',
      },
      {
        label: 'Dîner',
        value: 'Dîner',
      },
      {
        label: 'Goûter',
        value: 'Goûter',
      },
      {
        label: 'Brunch',
        value: 'Brunch',
      },
    ],
  },
  {
    title: 'Occasion',
    tags: [
      {
        label: 'Quotidien',
        value: 'Quotidien',
      },
      {
        label: 'Week-end',
        value: 'Week-end',
      },
      {
        label: 'Repas de famille',
        value: 'Repas de famille',
      },
      {
        label: 'Invités',
        value: 'Invités',
      },
      {
        label: 'Fête',
        value: 'Fête',
      },
      {
        label: 'Été',
        value: 'Été',
      },
    ],
  },
  {
    title: 'Préparation',
    tags: [
      {
        label: 'Sans cuisson',
        value: 'Sans cuisson',
      },
      {
        label: 'Four',
        value: 'Four',
      },
      {
        label: 'Poêle',
        value: 'Poêle',
      },
      {
        label: 'Air fryer',
        value: 'Air fryer',
      },
      {
        label: 'Batch cooking',
        value: 'Batch cooking',
      },
      {
        label: 'Économique',
        value: 'Économique',
      },
    ],
  },
]