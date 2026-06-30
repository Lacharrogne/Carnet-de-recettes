import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import type { Recipe } from '../../types/recipe'

type RecipeMiniCardProps = {
  recipe: Recipe
  getRecipeImage: (recipe: Recipe) => string
  actions?: ReactNode
}

// Carte compacte d'une recette (planning), avec emplacement d'actions optionnel.
export default function RecipeMiniCard({
  recipe,
  getRecipeImage,
  actions,
}: RecipeMiniCardProps) {
  const image = getRecipeImage(recipe)
  const isImageUrl = typeof image === 'string' && image.startsWith('http')

  return (
    <div className="group/card flex items-center gap-4 rounded-[1.6rem] bg-card p-4 shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:shadow-md">
      <Link
        to={`/recipes/${recipe.id}`}
        className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] bg-cream-200 text-3xl"
      >
        {isImageUrl ? (
          <img
            src={image}
            alt={recipe.title}
            className="h-full w-full object-cover transition group-hover/card:scale-105"
          />
        ) : (
          image
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to={`/recipes/${recipe.id}`}
          className="block truncate text-lg font-black text-stone-950 transition hover:text-orange-700"
        >
          {recipe.title}
        </Link>

        <p className="mt-1 text-sm font-bold text-stone-500">
          {recipe.prepTime + recipe.cookTime} min · {recipe.servings} pers.
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
            {recipe.category}
          </span>

          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
            {recipe.difficulty}
          </span>
        </div>

        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
