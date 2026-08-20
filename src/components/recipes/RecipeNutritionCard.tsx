import { useMemo } from 'react'

import { getRecipeNutrition, formatEuro } from '../../lib/recipeNutrition'
import type { Recipe } from '../../types/recipe'

/**
 * Carte d'ESTIMATION nutrition + coût d'une recette (par portion). Purement
 * calculée à partir des ingrédients — aucune donnée à saisir. Ne s'affiche que
 * si au moins un ingrédient a pu être estimé.
 */
export default function RecipeNutritionCard({ recipe }: { recipe: Recipe }) {
  const nutrition = useMemo(() => getRecipeNutrition(recipe), [recipe])

  if (nutrition.recognized === 0) {
    return null
  }

  const { perServing, costPerServing, totalCost, recognized, totalIngredients } =
    nutrition
  const lowConfidence = nutrition.coverage < 0.5

  const macros = [
    { label: 'Protéines', value: `${perServing.prot} g`, emoji: '💪' },
    { label: 'Glucides', value: `${perServing.carb} g`, emoji: '🌾' },
    { label: 'Lipides', value: `${perServing.fat} g`, emoji: '🫒' },
  ]

  return (
    <div className="mt-7 rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-bark print:hidden sm:mt-8 sm:rounded-[2rem] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
            📊
          </span>

          <div>
            <h3 className="text-lg font-black text-stone-950">
              Nutrition &amp; coût
            </h3>
            <p className="text-sm text-stone-500">Estimation, par portion</p>
          </div>
        </div>

        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
          ≈ estimation
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[1.25rem] bg-cream-50 p-4 ring-1 ring-bark">
          <p className="text-3xl font-black text-orange-600">
            {perServing.kcal}
          </p>
          <p className="mt-1 text-sm font-bold text-stone-600">kcal / pers.</p>
        </div>

        <div className="rounded-[1.25rem] bg-cream-50 p-4 ring-1 ring-bark">
          <p className="text-3xl font-black text-green-700">
            {formatEuro(costPerServing)}
          </p>
          <p className="mt-1 text-sm font-bold text-stone-600">/ pers.</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {macros.map((macro) => (
          <div
            key={macro.label}
            className="rounded-[1rem] bg-cream-50 px-3 py-2.5 text-center ring-1 ring-bark/60"
          >
            <p className="text-base font-black text-stone-900">{macro.value}</p>
            <p className="mt-0.5 text-xs font-semibold text-stone-500">
              {macro.emoji} {macro.label}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm font-semibold text-stone-600">
        Coût total estimé :{' '}
        <span className="font-black text-stone-900">{formatEuro(totalCost)}</span>
      </p>

      <p className="mt-3 text-xs leading-5 text-stone-400">
        Estimation basée sur {recognized}/{totalIngredients} ingrédient
        {totalIngredients > 1 ? 's' : ''} reconnu
        {recognized > 1 ? 's' : ''}
        {lowConfidence
          ? ' — précisez les quantités pour affiner.'
          : '. Les valeurs restent indicatives.'}
      </p>

      <p className="mt-2 text-xs leading-5 text-stone-400">
        🏃 Ces calories peuvent nourrir votre suivi dans Carnet de sport · 🪙 le
        coût, votre budget repas.
      </p>
    </div>
  )
}
