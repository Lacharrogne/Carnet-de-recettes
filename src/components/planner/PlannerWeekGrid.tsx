import { Skeleton } from '../ui/Skeleton'
import type { DayKey, MealKey, MealPlannerState } from '../../lib/weeklyPlanner'
import type { Recipe } from '../../types/recipe'

type PlannerWeekGridProps = {
  loading: boolean
  days: { key: DayKey; label: string; shortLabel: string; emoji: string }[]
  meals: { key: MealKey; label: string; emoji: string }[]
  planner: MealPlannerState
  recipesById: Map<string, Recipe>
  getRecipeImage: (recipe: Recipe) => string
  onPick: (day: DayKey, meal: MealKey) => void
  onRemove: (day: DayKey, meal: MealKey) => void
}

function isImageUrl(value: string) {
  return value.startsWith('http') || value.startsWith('/')
}

// Grille interactive de la semaine : pour chaque jour, ses 5 repas à part
// entière (petit déjeuner, déjeuner, goûter, dîner, dessert).
export default function PlannerWeekGrid({
  loading,
  days,
  meals,
  planner,
  recipesById,
  getRecipeImage,
  onPick,
  onRemove,
}: PlannerWeekGridProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-bark"
          >
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {days.map((day) => {
        const filledCount = meals.filter(
          (meal) => planner[day.key][meal.key],
        ).length

        return (
          <section
            key={day.key}
            className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-bark"
          >
            <div className="flex items-center justify-between gap-3 border-b border-bark bg-cream-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{day.emoji}</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-orange-600">
                    {day.shortLabel}
                  </p>
                  <h2 className="text-2xl font-black leading-tight text-stone-950">
                    {day.label}
                  </h2>
                </div>
              </div>

              <span className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-black text-stone-700 ring-1 ring-bark">
                {filledCount}/{meals.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {meals.map((meal) => {
                const recipeId = planner[day.key][meal.key]
                const recipe = recipeId ? recipesById.get(recipeId) : null

                return (
                  <div
                    key={meal.key}
                    className="flex flex-col rounded-[1.4rem] bg-cream-50 p-3 ring-1 ring-bark"
                  >
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-black text-stone-800">
                      <span>{meal.emoji}</span>
                      <span className="truncate">{meal.label}</span>
                    </p>

                    {recipe ? (
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start gap-2">
                          {isImageUrl(getRecipeImage(recipe)) ? (
                            <img
                              src={getRecipeImage(recipe)}
                              alt=""
                              className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-bark"
                            />
                          ) : (
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl ring-1 ring-bark">
                              {getRecipeImage(recipe)}
                            </span>
                          )}

                          <p className="line-clamp-3 text-sm font-bold leading-tight text-stone-900">
                            {recipe.title}
                          </p>
                        </div>

                        <div className="mt-auto flex gap-1.5 pt-3">
                          <button
                            type="button"
                            onClick={() => onPick(day.key, meal.key)}
                            className="flex-1 rounded-full bg-orange-100 px-2 py-1.5 text-xs font-black text-orange-700 transition hover:bg-orange-200"
                          >
                            Changer
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemove(day.key, meal.key)}
                            aria-label={`Retirer ${meal.label}`}
                            className="rounded-full border border-red-100 bg-white px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onPick(day.key, meal.key)}
                        className="flex min-h-24 flex-1 flex-col items-center justify-center gap-2 rounded-[1.1rem] border border-dashed border-bark bg-white/70 px-2 py-4 text-center transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-sm"
                      >
                        <span className="text-2xl text-hazel">+</span>
                        <span className="text-xs font-bold text-stone-500">
                          Ajouter
                        </span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
