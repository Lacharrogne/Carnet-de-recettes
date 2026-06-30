import { LOGO_SRC } from '../../data/brand'
import type { Recipe } from '../../types/recipe'

type PrintableRecipeSheetProps = {
  recipe: Recipe
  imageToDisplay: string | undefined
  scaledIngredients: string[]
  selectedServings: number
  totalTime: number
}

// Version « fiche imprimable » de la recette (visible uniquement à l'impression).
export default function PrintableRecipeSheet({
  recipe,
  imageToDisplay,
  scaledIngredients,
  selectedServings,
  totalTime,
}: PrintableRecipeSheetProps) {
  const hasImage =
    typeof imageToDisplay === 'string' && imageToDisplay.startsWith('http')

  return (
    <div className="hidden print:block print:bg-white print:p-0 print:text-black">
      <article className="mx-auto max-w-[760px] text-[10.5pt] leading-relaxed">
        <header className="mb-5 border-b border-stone-200 pb-4">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-50">
                <img
                  src={LOGO_SRC}
                  alt="Carnet de recettes"
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <p className="text-base font-black leading-tight text-stone-950">
                  Carnet de recettes
                </p>

                <p className="text-xs font-medium text-stone-500">
                  Cuisine maison & petits plats
                </p>
              </div>
            </div>

            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
              Fiche recette
            </p>
          </div>

          <div className="flex items-start gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-50 text-4xl">
              {hasImage ? (
                <img
                  src={imageToDisplay}
                  alt={recipe.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{recipe.image || '🍽️'}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap gap-2 text-[10pt] font-bold">
                <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">
                  {recipe.category}
                </span>

                <span className="rounded-full bg-stone-50 px-3 py-1 text-stone-700">
                  {recipe.difficulty}
                </span>

                <span className="rounded-full bg-stone-50 px-3 py-1 text-stone-700">
                  {selectedServings} pers.
                </span>
              </div>

              <h1 className="text-3xl font-black leading-tight text-stone-950">
                {recipe.title}
              </h1>

              {recipe.description && (
                <p className="mt-2 max-w-[580px] text-sm leading-6 text-stone-700">
                  {recipe.description}
                </p>
              )}
            </div>
          </div>
        </header>

        <section className="mb-5 grid grid-cols-4 gap-3 break-inside-avoid">
          <div className="rounded-xl border border-stone-200 p-3">
            <p className="text-xs font-medium text-stone-500">Préparation</p>
            <p className="mt-1 font-black text-stone-950">
              {recipe.prepTime} min
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 p-3">
            <p className="text-xs font-medium text-stone-500">Cuisson</p>
            <p className="mt-1 font-black text-stone-950">
              {recipe.cookTime} min
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 p-3">
            <p className="text-xs font-medium text-stone-500">Total</p>
            <p className="mt-1 font-black text-stone-950">{totalTime} min</p>
          </div>

          <div className="rounded-xl border border-stone-200 p-3">
            <p className="text-xs font-medium text-stone-500">Portions</p>
            <p className="mt-1 font-black text-stone-950">
              {selectedServings}
            </p>
          </div>
        </section>

        <section className="mb-5 break-inside-avoid">
          <h2 className="mb-3 text-xl font-black text-stone-950">
            Ingrédients
          </h2>

          {scaledIngredients.length > 0 ? (
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2">
              {scaledIngredients.map((ingredient, index) => (
                <li key={`${ingredient}-${index}`} className="flex gap-2">
                  <span className="font-black text-orange-700">•</span>
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-stone-600">Aucun ingrédient renseigné.</p>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-xl font-black text-stone-950">
            Préparation
          </h2>

          {recipe.steps.length > 0 ? (
            <ol className="space-y-2">
              {recipe.steps.map((step, index) => (
                <li
                  key={`${step}-${index}`}
                  className="break-inside-avoid rounded-xl border border-stone-200 p-3"
                >
                  <span className="mr-2 font-black text-orange-700">
                    {index + 1}.
                  </span>

                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-stone-600">Aucune étape renseignée.</p>
          )}
        </section>
      </article>
    </div>
  )
}
