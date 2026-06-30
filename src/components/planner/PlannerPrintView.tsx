import { LOGO_SRC } from '../../data/brand'
import type {
  DayKey,
  ExtraMealKey,
  MealKey,
  MealPlannerState,
} from '../../lib/weeklyPlanner'
import type { Recipe } from '../../types/recipe'

type PlannerPrintViewProps = {
  weekCompletion: number
  plannedMealsCount: number
  plannedDaysCount: number
  estimatedIngredientsCount: number
  planner: MealPlannerState
  recipesById: Map<string, Recipe>
  days: { key: DayKey; label: string; shortLabel: string; emoji: string }[]
  mainMeals: { key: MealKey; label: string; emoji: string }[]
  extraMeals: {
    key: ExtraMealKey
    label: string
    emoji: string
    description: string
    emptyText: string
  }[]
}

// Vue dédiée à l'impression du planning (masquée à l'écran, visible à l'impression).
export default function PlannerPrintView({
  weekCompletion,
  plannedMealsCount,
  plannedDaysCount,
  estimatedIngredientsCount,
  planner,
  recipesById,
  days,
  mainMeals,
  extraMeals,
}: PlannerPrintViewProps) {
  return (
    <>
      <style>
        {`
          .print-planning {
            display: none;
          }

          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }

            body {
              background: white !important;
            }

            body * {
              visibility: hidden !important;
            }

            .print-planning,
            .print-planning * {
              visibility: visible !important;
            }

            .print-planning {
              display: block !important;
              position: absolute;
              inset: 0;
              width: 100%;
              padding: 0;
              color: #1c1917;
              background: white;
              font-family: Arial, sans-serif;
            }

            .print-card {
              border: 1px solid #eadfd3;
              border-radius: 14px;
              padding: 12px;
              break-inside: avoid;
              background: #fffaf3;
            }

            .print-day-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }

            .print-section-title {
              margin-top: 18px;
              margin-bottom: 8px;
              color: #ea580c;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }

            .print-muted {
              color: #78716c;
            }
          }
        `}
      </style>

      <div className="print-planning">
        <div className="mb-5 flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
              Carnet de recettes
            </p>

            <h1 className="mt-1 text-3xl font-black">
              Planning de la semaine
            </h1>

            <p className="mt-1 text-sm text-stone-500">
              Imprimé le {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-cream-50 px-4 py-3">
            <img
              src={LOGO_SRC}
              alt="Carnet de recettes"
              className="h-14 w-14 object-contain"
            />

            <div>
              <p className="text-lg font-black">Carnet de recettes</p>
              <p className="text-xs font-bold text-stone-500">
                Cuisine maison & petits plats
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="print-card">
            <p className="text-2xl font-black text-orange-600">
              {weekCompletion} %
            </p>
            <p className="text-xs font-bold">semaine remplie</p>
          </div>

          <div className="print-card">
            <p className="text-2xl font-black text-orange-600">
              {plannedMealsCount}
            </p>
            <p className="text-xs font-bold">repas prévus</p>
          </div>

          <div className="print-card">
            <p className="text-2xl font-black text-green-700">
              {plannedDaysCount}
            </p>
            <p className="text-xs font-bold">jours organisés</p>
          </div>

          <div className="print-card">
            <p className="text-2xl font-black">{estimatedIngredientsCount}</p>
            <p className="text-xs font-bold">ingrédients estimés</p>
          </div>
        </div>

        <p className="print-section-title">Habitudes et envies</p>

        <div className="grid grid-cols-3 gap-3">
          {extraMeals.map((extraMeal) => {
            const recipeIds = planner.weeklyExtras[extraMeal.key]
            const extraRecipes = recipeIds
              .map((recipeId) => recipesById.get(recipeId))
              .filter((recipe): recipe is Recipe => Boolean(recipe))

            return (
              <div key={extraMeal.key} className="print-card">
                <p className="mb-2 font-black">
                  {extraMeal.emoji} {extraMeal.label}
                </p>

                {extraRecipes.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {extraRecipes.map((recipe) => (
                      <li key={recipe.id}>• {recipe.title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm print-muted">Aucun prévu.</p>
                )}
              </div>
            )
          })}
        </div>

        <p className="print-section-title">Semaine détaillée</p>

        <div className="print-day-grid">
          {days.map((day) => {
            const dayMealsCount = mainMeals.filter(
              (meal) => planner[day.key][meal.key],
            ).length

            return (
              <div key={day.key} className="print-card">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-orange-600">
                      {day.shortLabel}
                    </p>

                    <h2 className="text-xl font-black">{day.label}</h2>
                  </div>

                  <p className="rounded-full border border-orange-100 bg-card px-3 py-1 text-xs font-black">
                    {dayMealsCount}/2
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {mainMeals.map((meal) => {
                    const recipeId = planner[day.key][meal.key]
                    const recipe = recipeId ? recipesById.get(recipeId) : null

                    return (
                      <div key={meal.key}>
                        <p className="mb-1 font-black text-orange-600">
                          {meal.emoji} {meal.label}
                        </p>

                        {recipe ? (
                          <div>
                            <p className="font-extrabold">{recipe.title}</p>

                            <p className="text-xs print-muted">
                              {recipe.prepTime + recipe.cookTime} min ·{' '}
                              {recipe.servings} pers.
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm print-muted">
                            Aucun repas prévu.
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
