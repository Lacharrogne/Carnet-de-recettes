import { RECIPE_CATEGORIES } from '../../data/recipeOptions'
import type { Recipe } from '../../types/recipe'

type RecipePickerModalProps = {
  // Titre déjà formaté par la page (ex : « Lundi — Déjeuner »).
  title: string
  searchValue: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  allCategoriesValue: string
  filteredRecipes: Recipe[]
  syncingRecipeId: Recipe['id'] | null
  getRecipeImage: (recipe: Recipe) => string
  onClose: () => void
  onChooseRecipe: (recipe: Recipe) => void
}

// Modale de sélection d'une recette à ajouter au planning (présentationnel).
export default function RecipePickerModal({
  title,
  searchValue,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  allCategoriesValue,
  filteredRecipes,
  syncingRecipeId,
  getRecipeImage,
  onClose,
  onChooseRecipe,
}: RecipePickerModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/40 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col rounded-[2rem] bg-cream-50 p-6 shadow-2xl ring-1 ring-orange-100 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-orange-600">
              Ajouter une recette
            </p>

            <h2 className="mt-2 text-3xl font-black text-stone-950">{title}</h2>

            <p className="mt-2 max-w-2xl font-semibold leading-7 text-stone-500">
              Recherche une recette, filtre par catégorie, puis ajoute-la au
              planning.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-orange-200 bg-card px-5 py-3 font-black text-orange-700 transition hover:bg-orange-50"
          >
            Fermer
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_0.45fr]">
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Rechercher une recette" placeholder="Rechercher : pâtes, gâteau, poulet..."
            autoFocus
            className="w-full rounded-[1.5rem] border border-orange-200 bg-card px-5 py-4 text-lg font-semibold text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          />

          <select
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full rounded-[1.5rem] border border-orange-200 bg-card px-5 py-4 text-lg font-semibold text-stone-800 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          >
            <option value={allCategoriesValue}>Toutes les catégories</option>

            {RECIPE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.emoji} {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCategoryChange(allCategoriesValue)}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${
              selectedCategory === allCategoriesValue
                ? 'bg-orange-500 text-white'
                : 'bg-card text-orange-700 ring-1 ring-orange-100 hover:bg-orange-50'
            }`}
          >
            Toutes
          </button>

          {RECIPE_CATEGORIES.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => onCategoryChange(category.value)}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                selectedCategory === category.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-card text-stone-700 ring-1 ring-orange-100 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              {category.emoji} {category.label}
            </button>
          ))}
        </div>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-2">
          {filteredRecipes.length === 0 ? (
            <div className="rounded-[1.5rem] bg-card p-6 text-center text-stone-500 shadow-sm ring-1 ring-orange-100">
              Aucune recette trouvée.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {filteredRecipes.map((recipe) => {
                const image = getRecipeImage(recipe)
                const isImageUrl =
                  typeof image === 'string' && image.startsWith('http')
                const isSyncing = syncingRecipeId === recipe.id

                return (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => onChooseRecipe(recipe)}
                    disabled={isSyncing}
                    className="group flex w-full items-center gap-4 rounded-[1.5rem] bg-card p-4 text-left shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] bg-cream-200 text-3xl">
                      {isImageUrl ? (
                        <img
                          src={image}
                          alt={recipe.title}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        image
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xl font-black text-stone-950">
                        {recipe.title}
                      </p>

                      <p className="mt-1 line-clamp-1 font-semibold text-stone-500">
                        {recipe.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                          {recipe.category}
                        </span>

                        <span className="rounded-full bg-card px-3 py-1 text-xs font-bold text-stone-600 ring-1 ring-orange-100">
                          {recipe.prepTime + recipe.cookTime} min
                        </span>

                        <span className="rounded-full bg-card px-3 py-1 text-xs font-bold text-stone-600 ring-1 ring-orange-100">
                          {recipe.servings} pers.
                        </span>
                      </div>
                    </div>

                    <span className="hidden rounded-full bg-orange-500 px-5 py-3 font-black text-white md:block">
                      Ajouter
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
