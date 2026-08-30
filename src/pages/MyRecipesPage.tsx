import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import RecipeCard from '../components/recipes/RecipeCard'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Select from '../components/ui/Select'
import { RecipeCardGridSkeleton } from '../components/ui/Skeleton'
import { RECIPE_CATEGORIES } from '../data/recipeOptions'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { getMyRecipes, deleteRecipe } from '../services/recipes'
import type { Recipe, RecipeCategory } from '../types/recipe'

type SortOption = 'recent' | 'name' | 'time' | 'difficulty'

/** Nombre de recettes affichées par page (pagination « Voir plus »). */
const PAGE_SIZE = 12

export default function MyRecipesPage() {
  useDocumentTitle('Mes recettes')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | ''>(
    '',
  )
  const [sort, setSort] = useState<SortOption>('recent')

  useEffect(() => {
    let ignore = false

    getMyRecipes()
      .then((data) => {
        if (!ignore) {
          setRecipes(data)
        }
      })
      .catch((error) => {
        if (!ignore) {
          console.error(error)
          setErrorMessage('Impossible de charger vos recettes.')
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  async function handleDeleteDraft(draft: Recipe) {
    const label = draft.title || 'Sans titre'
    if (
      !window.confirm(
        `Supprimer le brouillon « ${label} » ? Cette action est définitive.`,
      )
    ) {
      return
    }

    try {
      await deleteRecipe(draft.id)
      setRecipes((current) => current.filter((r) => r.id !== draft.id))
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer le brouillon.')
    }
  }

  // Brouillons (visibles de l'auteur seul) séparés des recettes publiées.
  const drafts = useMemo(
    () => recipes.filter((recipe) => recipe.status === 'draft'),
    [recipes],
  )

  const publishedRecipes = useMemo(
    () => recipes.filter((recipe) => recipe.status !== 'draft'),
    [recipes],
  )

  const filteredRecipes = useMemo(() => {
    let result = [...publishedRecipes]

    if (selectedCategory) {
      result = result.filter((recipe) => recipe.category === selectedCategory)
    }

    if (search.trim()) {
      const normalizedSearch = search.toLowerCase().trim()

      result = result.filter((recipe) => {
        const titleMatch = recipe.title.toLowerCase().includes(normalizedSearch)

        const descriptionMatch = recipe.description
          .toLowerCase()
          .includes(normalizedSearch)

        const categoryMatch = recipe.category
          .toLowerCase()
          .includes(normalizedSearch)

        const tagMatch = recipe.tags.some((tag) =>
          tag.toLowerCase().includes(normalizedSearch),
        )

        const ingredientMatch = recipe.ingredients.some((ingredient) =>
          ingredient.toLowerCase().includes(normalizedSearch),
        )

        return (
          titleMatch ||
          descriptionMatch ||
          categoryMatch ||
          tagMatch ||
          ingredientMatch
        )
      })
    }

    if (sort === 'recent') {
      result.sort((a, b) => b.id - a.id)
    }

    if (sort === 'name') {
      result.sort((a, b) => a.title.localeCompare(b.title))
    }

    if (sort === 'time') {
      result.sort(
        (a, b) => a.prepTime + a.cookTime - (b.prepTime + b.cookTime),
      )
    }

    if (sort === 'difficulty') {
      const difficultyOrder = {
        Facile: 1,
        Moyen: 2,
        Difficile: 3,
      }

      result.sort(
        (a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty],
      )
    }

    return result
  }, [publishedRecipes, search, selectedCategory, sort])

  const usedCategoriesCount = useMemo(() => {
    return new Set(recipes.map((recipe) => recipe.category)).size
  }, [recipes])

  const hasActiveFilters = search.trim().length > 0 || selectedCategory !== ''

  // Pagination : on réinitialise le nombre visible dès qu'un filtre change
  // (ajustement d'état pendant le rendu, sans effet).
  const filtersKey = `${search.trim().toLowerCase()}|${selectedCategory}|${sort}`
  const [paginationKey, setPaginationKey] = useState(filtersKey)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  if (paginationKey !== filtersKey) {
    setPaginationKey(filtersKey)
    setVisibleCount(PAGE_SIZE)
  }

  const visibleRecipes = filteredRecipes.slice(0, visibleCount)
  const remainingCount = filteredRecipes.length - visibleRecipes.length

  function resetFilters() {
    setSearch('')
    setSelectedCategory('')
    setSort('recent')
  }

  if (loading) {
    return (
      <section className="space-y-8">
        <RecipeCardGridSkeleton count={3} />
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] bg-cream-100 p-8 shadow-sm ring-1 ring-bark">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-white text-3xl shadow-sm ring-1 ring-bark">
              📖
            </div>

            <div>
              <p className="font-bold text-orange-700">Espace personnel</p>

              <h1 className="mt-2 text-4xl font-black leading-tight text-stone-950">
                Mes recettes
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-stone-600">
                Retrouvez toutes les recettes que vous avez ajoutées dans votre carnet,
                pour les modifier, les compléter ou les refaire facilement.
              </p>
            </div>
          </div>

          <Button to="/add-recipe" className="w-fit">
            + Ajouter une recette
          </Button>
        </div>
      </div>

      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

      {drafts.length > 0 && (
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-honey/40">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-honey-soft text-2xl">
              📝
            </span>

            <div>
              <h2 className="text-2xl font-black text-stone-950">Brouillons</h2>
              <p className="text-sm text-stone-600">
                {drafts.length} recette{drafts.length > 1 ? 's' : ''} à terminer
                — visible{drafts.length > 1 ? 's' : ''} de vous seul.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="group flex items-center gap-3 rounded-2xl bg-honey-soft/40 p-4 ring-1 ring-honey/40 transition hover:bg-honey-soft"
              >
                <Link
                  to={`/recipes/${draft.id}/edit`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="text-2xl">{draft.image || '🍽️'}</span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-stone-950">
                      {draft.title || 'Sans titre'}
                    </p>

                    <span className="mt-0.5 inline-block rounded-full bg-honey/20 px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wide text-stone-700">
                      Continuer →
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => handleDeleteDraft(draft)}
                  aria-label={`Supprimer le brouillon ${draft.title || 'Sans titre'}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base text-red-600 ring-1 ring-red-100 transition hover:bg-red-50"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-bark">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
            🍲
          </div>

          <p className="mt-5 text-sm font-bold text-stone-500">Total</p>

          <p className="mt-2 text-4xl font-black text-stone-950">
            {recipes.length}
          </p>

          <p className="mt-1 text-sm text-stone-500">
            recette{recipes.length > 1 ? 's' : ''} créée
            {recipes.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-bark">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
            🔎
          </div>

          <p className="mt-5 text-sm font-bold text-stone-500">Résultats</p>

          <p className="mt-2 text-4xl font-black text-stone-950">
            {filteredRecipes.length}
          </p>

          <p className="mt-1 text-sm text-stone-500">
            recette{filteredRecipes.length > 1 ? 's' : ''} affichée
            {filteredRecipes.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-bark">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
            🧺
          </div>

          <p className="mt-5 text-sm font-bold text-stone-500">
            Catégories utilisées
          </p>

          <p className="mt-2 text-4xl font-black text-stone-950">
            {usedCategoriesCount}
          </p>

          <p className="mt-1 text-sm text-stone-500">
            sur {RECIPE_CATEGORIES.length} catégories
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-bark">
        <div className="mb-5">
          <p className="font-bold text-orange-700">Recherche</p>

          <h2 className="mt-1 text-2xl font-black text-stone-950">
            Filtrer mes recettes
          </h2>

          <p className="mt-2 text-stone-600">
            Cherchez une recette par nom, ingrédient, tag ou catégorie.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Rechercher dans mes recettes"
            placeholder="Rechercher dans mes recettes..."
            className="w-full rounded-2xl bg-linen px-4 py-3 text-cacao ring-1 ring-bark outline-none transition placeholder:text-hazel focus:bg-card focus:ring-2 focus:ring-terracotta/40"
          />

          <Select
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(event.target.value as RecipeCategory | '')
            }
            aria-label="Filtrer par catégorie"
          >
            <option value="">Toutes les catégories</option>

            {RECIPE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </Select>

          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            aria-label="Trier mes recettes"
          >
            <option value="recent">Plus récentes</option>
            <option value="name">Trier par nom</option>
            <option value="time">Temps le plus court</option>
            <option value="difficulty">Difficulté</option>
          </Select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-2xl bg-card ring-1 ring-bark px-5 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {publishedRecipes.length === 0 ? (
        drafts.length === 0 ? (
          <EmptyState
            emoji="📖"
            title="Aucune recette pour le moment"
            description="Ajoutez votre première recette pour commencer votre carnet."
            action={
              <Button to="/add-recipe">Ajouter ma première recette</Button>
            }
          />
        ) : null
      ) : filteredRecipes.length === 0 ? (
        <EmptyState
          emoji="🔎"
          title="Aucune recette trouvée"
          description="Essayez une autre recherche ou une autre catégorie."
          action={
            <Button type="button" onClick={resetFilters}>
              Voir toutes mes recettes
            </Button>
          }
        />
      ) : (
        <div>
          <div className="mb-6">
            <p className="font-bold text-orange-700">Carnet personnel</p>

            <h2 className="mt-1 text-3xl font-black text-stone-950">
              Recettes ajoutées
            </h2>

            <p className="mt-2 text-stone-600">
              {filteredRecipes.length} recette
              {filteredRecipes.length > 1 ? 's' : ''} affichée
              {filteredRecipes.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          {remainingCount > 0 && (
            <div className="mt-8 flex justify-center">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              >
                Voir plus de recettes ({remainingCount} restante
                {remainingCount > 1 ? 's' : ''})
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}