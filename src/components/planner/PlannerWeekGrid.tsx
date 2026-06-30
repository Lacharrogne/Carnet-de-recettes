import { Skeleton } from '../ui/Skeleton'
import type { DayKey, MealKey, MealPlannerState } from '../../lib/weeklyPlanner'
import type { Recipe } from '../../types/recipe'
import RecipeMiniCard from './RecipeMiniCard'

type PlannerWeekGridProps = {
  loading: boolean
  days: { key: DayKey; label: string; shortLabel: string; emoji: string }[]
  mainMeals: { key: MealKey; label: string; emoji: string }[]
  planner: MealPlannerState
  recipesById: Map<string, Recipe>
  getRecipeImage: (recipe: Recipe) => string
  onPickMain: (day: DayKey, meal: MealKey) => void
  onRemoveMain: (day: DayKey, meal: MealKey) => void
}

// Grille interactive de la semaine : pour chaque jour, les deux repas
// principaux avec ajout / changement / retrait de recette.
export default function PlannerWeekGrid({
  loading,
  days,
  mainMeals,
  planner,
  recipesById,
  getRecipeImage,
  onPickMain,
  onRemoveMain,
}: PlannerWeekGridProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100"
          >
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {days.map((day) => {
        const dayMealsCount = mainMeals.filter(
          (meal) => planner[day.key][meal.key],
        ).length

        return (
          <section
            key={day.key}
            className="rounded-[2.5rem] bg-white shadow-sm ring-1 ring-orange-100"
          >
            <div className="grid gap-6 p-6 xl:grid-cols-[260px_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="relative overflow-hidden rounded-[1.8rem] bg-cream-50 p-6 ring-1 ring-orange-100">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-100 blur-3xl" />

                <div className="relative z-10">
                  <p className="text-3xl">{day.emoji}</p>

                  <p className="mt-4 text-sm font-black uppercase tracking-wide text-orange-600">
                    {day.shortLabel}
                  </p>

                  <h2 className="mt-2 break-words text-3xl font-black text-stone-950 2xl:text-4xl">
                    {day.label}
                  </h2>

                  <p className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-black text-stone-700 shadow-sm ring-1 ring-orange-100">
                    {dayMealsCount}/2 repas
                  </p>
                </div>
              </div>

              {mainMeals.map((meal) => {
                const recipeId = planner[day.key][meal.key]
                const recipe = recipeId ? recipesById.get(recipeId) : null
                const mealDescription =
                  meal.key === 'lunch' ? 'Repas du midi' : 'Repas du soir'

                return (
                  <div
                    key={meal.key}
                    className="rounded-[1.8rem] bg-cream-50 p-5 ring-1 ring-orange-100"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black text-stone-950">
                          {meal.emoji} {meal.label}
                        </h3>

                        <p className="mt-1 font-semibold text-stone-500">
                          {mealDescription}
                        </p>
                      </div>

                      {recipe && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-orange-700 ring-1 ring-orange-100">
                          Prévu
                        </span>
                      )}
                    </div>

                    {recipe ? (
                      <RecipeMiniCard
                        recipe={recipe}
                        getRecipeImage={getRecipeImage}
                        actions={
                          <>
                            <button
                              type="button"
                              onClick={() => onPickMain(day.key, meal.key)}
                              className="rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700 transition hover:bg-orange-200"
                            >
                              Changer
                            </button>

                            <button
                              type="button"
                              onClick={() => onRemoveMain(day.key, meal.key)}
                              className="rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                            >
                              Retirer
                            </button>
                          </>
                        }
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => onPickMain(day.key, meal.key)}
                        className="flex min-h-40 w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-orange-200 bg-white/70 px-5 py-6 text-center transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-sm"
                      >
                        <span className="text-lg font-black text-stone-500">
                          Aucun repas prévu.
                        </span>

                        <span className="mt-4 rounded-full bg-orange-100 px-5 py-3 font-black text-orange-700">
                          + Ajouter une recette
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
