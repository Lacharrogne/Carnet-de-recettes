import type { ExtraMealKey } from '../../lib/weeklyPlanner'
import type { Recipe } from '../../types/recipe'
import RecipeMiniCard from './RecipeMiniCard'

type PlannerExtrasPanelProps = {
  extraMeals: {
    key: ExtraMealKey
    label: string
    emoji: string
    description: string
    emptyText: string
  }[]
  weeklyExtras: Record<ExtraMealKey, string[]>
  recipesById: Map<string, Recipe>
  getRecipeImage: (recipe: Recipe) => string
  onAddExtra: (meal: ExtraMealKey) => void
  onRemoveExtra: (meal: ExtraMealKey, recipeId: string) => void
}

// Panneau des « petits plus » de la semaine (petit déjeuner, goûter, dessert),
// sans jour imposé.
export default function PlannerExtrasPanel({
  extraMeals,
  weeklyExtras,
  recipesById,
  getRecipeImage,
  onAddExtra,
  onRemoveExtra,
}: PlannerExtrasPanelProps) {
  return (
    <div className="rounded-[2rem] bg-card/90 p-6 shadow-sm ring-1 ring-orange-100 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-orange-600">
            Habitudes et envies
          </p>

          <h2 className="mt-2 text-3xl font-black text-stone-950">
            Petits plus de la semaine
          </h2>

          <p className="mt-2 font-semibold text-stone-500">
            Petit déjeuner, goûter et dessert sans jour imposé.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {extraMeals.map((extraMeal) => {
          const recipeIds = weeklyExtras[extraMeal.key]
          const extraRecipes = recipeIds
            .map((recipeId) => recipesById.get(recipeId))
            .filter((recipe): recipe is Recipe => Boolean(recipe))

          return (
            <div
              key={extraMeal.key}
              className="rounded-[1.8rem] bg-cream-50 p-5 ring-1 ring-orange-100"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-stone-950">
                    {extraMeal.emoji} {extraMeal.label}
                  </h3>

                  <p className="mt-1 font-semibold text-stone-500">
                    {extraMeal.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onAddExtra(extraMeal.key)}
                  className="rounded-full bg-orange-100 px-5 py-3 font-black text-orange-700 transition hover:bg-orange-200"
                >
                  + Ajouter
                </button>
              </div>

              <div className="mt-4 space-y-3 rounded-[1.4rem] border border-dashed border-orange-200 bg-card/70 p-4">
                {extraRecipes.length > 0 ? (
                  extraRecipes.map((recipe) => (
                    <div key={`${extraMeal.key}-${recipe.id}`}>
                      <RecipeMiniCard
                        recipe={recipe}
                        getRecipeImage={getRecipeImage}
                        actions={
                          <button
                            type="button"
                            onClick={() =>
                              onRemoveExtra(extraMeal.key, String(recipe.id))
                            }
                            className="rounded-full border border-red-100 bg-card px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                          >
                            Retirer
                          </button>
                        }
                      />
                    </div>
                  ))
                ) : (
                  <div>
                    <p className="font-bold text-stone-500">
                      {extraMeal.emptyText}
                    </p>

                    <button
                      type="button"
                      onClick={() => onAddExtra(extraMeal.key)}
                      className="mt-3 rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700 transition hover:bg-orange-200"
                    >
                      + Ajouter une idée
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
