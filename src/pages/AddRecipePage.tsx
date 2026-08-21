import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RecipeForm from '../components/recipes/RecipeForm'
import type { RecipeFormValues } from '../components/recipes/RecipeForm'
import RecipeImportBar from '../components/recipes/RecipeImportBar'
import { createRecipe, getRecipes, uploadRecipeImage } from '../services/recipes'
import type { ImportedRecipe } from '../services/recipeImport'
import { clearRecipeDraftSnapshot } from '../lib/recipeDraftAutosave'
import type { Recipe } from '../types/recipe'

export default function AddRecipePage() {
  const navigate = useNavigate()

  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)

  // Prise en charge de l'import depuis un lien : on préremplit le formulaire
  // (remonté via `key`) et on conserve l'URL de la photo importée.
  const [importedValues, setImportedValues] = useState<Recipe | undefined>()
  const [importedImageUrl, setImportedImageUrl] = useState<string | null>(null)
  const [importKey, setImportKey] = useState(0)
  const [importNotice, setImportNotice] = useState('')

  function handleImported(recipe: ImportedRecipe) {
    setImportedValues({
      id: 0,
      userId: null,
      title: recipe.title,
      category: 'Plat',
      difficulty: 'Facile',
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings || 2,
      description: recipe.description,
      image: '🍽️',
      imageUrl: recipe.imageUrl,
      tags: [],
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      relatedRecipeIds: [],
      status: 'published',
    })
    setImportedImageUrl(recipe.imageUrl)
    setImportKey((key) => key + 1)
    setImportNotice(
      'Recette importée ✨ Vérifie la catégorie, la difficulté et les détails, puis enregistre.',
    )
    // On amène l'utilisateur au formulaire prérempli.
    requestAnimationFrame(() => {
      document
        .getElementById('recipe-form-start')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  useEffect(() => {
    let ignore = false

    getRecipes()
      .then((recipes) => {
        if (!ignore) setAvailableRecipes(recipes)
      })
      .catch((error) => console.error(error))

    return () => {
      ignore = true
    }
  }, [])

  async function handleSubmit(values: RecipeFormValues) {
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const { imageFile, ...recipeValues } = values

      // Priorité à la photo téléversée ; sinon on garde celle de l'import.
      let imageUrl: string | null = importedImageUrl

      if (imageFile) {
        imageUrl = await uploadRecipeImage(imageFile)
      }

      const newRecipe = await createRecipe({
        ...recipeValues,
        imageUrl,
      })

      clearRecipeDraftSnapshot()
      navigate(`/recipes/${newRecipe.id}`)
    } catch (error) {
      console.error(error)
      setErrorMessage("Impossible d'ajouter la recette.")
      setIsSubmitting(false)
    }
  }

  async function handleSaveDraft(values: RecipeFormValues) {
    setErrorMessage('')
    setIsSavingDraft(true)

    try {
      const { imageFile, ...recipeValues } = values

      let imageUrl: string | null = importedImageUrl

      if (imageFile) {
        imageUrl = await uploadRecipeImage(imageFile)
      }

      await createRecipe({
        ...recipeValues,
        imageUrl,
        status: 'draft',
      })

      clearRecipeDraftSnapshot()
      // On retrouve le brouillon dans « Mes recettes ».
      navigate('/my-recipes')
    } catch (error) {
      console.error(error)
      setErrorMessage("Impossible d'enregistrer le brouillon.")
      setIsSavingDraft(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2.5rem] bg-cream-50 shadow-sm ring-1 ring-bark">
        <div className="grid gap-8 p-6 md:grid-cols-[1fr_0.7fr] md:p-10">
          <div className="flex flex-col justify-center">
            <p className="font-bold text-orange-600">Nouvelle recette</p>

            <h1 className="mt-3 max-w-2xl text-4xl font-black leading-tight text-stone-950 md:text-5xl">
              Ajouter une recette au carnet familial.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              Notez les ingrédients, les étapes, le temps de préparation et les
              petites astuces pour retrouver facilement cette recette plus tard.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-bark">
            <div className="flex h-full flex-col justify-between gap-6">
              <div>
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-terracotta-soft text-4xl">
                  🍲
                </div>

                <h2 className="mt-5 text-2xl font-black text-stone-950">
                  Une recette bien rangée
                </h2>

                <p className="mt-3 leading-7 text-stone-600">
                  Ajoutez une belle photo, choisissez une catégorie et utilisez les
                  tags pour la retrouver rapidement.
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-linen p-4 ring-1 ring-bark">
                <p className="font-bold text-stone-900">Petit conseil</p>

                <p className="mt-1 text-sm leading-6 text-stone-600">
                  Pour les ingrédients, écrivez-les un par ligne : quantité +
                  ingrédient, par exemple “200 g de farine”.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecipeImportBar onImported={handleImported} />

      <div
        id="recipe-form-start"
        className="scroll-mt-24 rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-bark md:p-8"
      >
        <div className="mb-8 border-b border-bark pb-6">
          <p className="font-bold text-orange-600">Formulaire</p>

          <h2 className="mt-2 text-3xl font-black text-stone-950">
            Informations de la recette
          </h2>

          <p className="mt-2 text-stone-600">
            Remplissez le formulaire pour enregistrer une nouvelle recette dans le
            carnet.
          </p>

          {importNotice && (
            <p className="mt-4 rounded-2xl bg-sage-soft px-4 py-3 text-sm font-bold text-sage-deep">
              {importNotice}
            </p>
          )}
        </div>

        <RecipeForm
          key={importKey}
          initialValues={importedValues}
          availableRecipes={availableRecipes}
          submitLabel="Ajouter la recette"
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          isSavingDraft={isSavingDraft}
          draftLabel="Enregistrer comme brouillon"
          autosave
        />
      </div>
    </section>
  )
}