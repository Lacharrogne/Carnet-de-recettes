import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import RecipeForm from '../components/recipes/RecipeForm'
import type { RecipeFormValues } from '../components/recipes/RecipeForm'
import {
  deleteRecipeImageByUrl,
  getRecipeById,
  updateRecipe,
  uploadRecipeImage,
} from '../services/recipes'
import type { Recipe } from '../types/recipe'

export default function EditRecipePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadRecipe() {
      try {
        if (!id) {
          setErrorMessage('Aucun identifiant trouvé.')
          return
        }

        const data = await getRecipeById(Number(id))

        if (!data) {
          setErrorMessage('Recette introuvable.')
          return
        }

        setRecipe(data)
      } catch (error) {
        console.error(error)
        setErrorMessage('Impossible de charger la recette.')
      } finally {
        setLoading(false)
      }
    }

    loadRecipe()
  }, [id])

  async function handleSubmit(values: RecipeFormValues) {
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      if (!id || !recipe) {
        throw new Error('Recette introuvable')
      }

      const { imageFile, ...recipeValues } = values

      const oldImageUrl = recipe.imageUrl
      let imageUrl = oldImageUrl

      if (imageFile) {
        imageUrl = await uploadRecipeImage(imageFile)
      }

      const updatedRecipe = await updateRecipe(Number(id), {
        ...recipeValues,
        imageUrl,
      })

      if (imageFile && oldImageUrl) {
        try {
          await deleteRecipeImageByUrl(oldImageUrl)
        } catch (error) {
          console.warn("L'ancienne image n'a pas pu être supprimée.", error)
        }
      }

      navigate(`/recipes/${updatedRecipe.id}`)
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de modifier la recette.')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-orange-100">
        <p className="font-medium text-stone-600">
          Chargement de la recette...
        </p>
      </section>
    )
  }

  if (!recipe) {
    return (
      <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-3xl">
          🍽️
        </div>

        <h2 className="mt-5 text-2xl font-black text-stone-950">
          Recette introuvable
        </h2>

        <p className="mt-2 text-stone-600">
          Cette recette n’existe pas ou n’est plus disponible.
        </p>

        {errorMessage && (
          <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 font-medium text-red-700 ring-1 ring-red-100">
            {errorMessage}
          </p>
        )}

        <Link
          to="/recipes"
          className="mt-6 inline-block rounded-2xl bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700"
        >
          Retour aux recettes
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] bg-[#fff5ec] p-8 shadow-sm ring-1 ring-orange-100">
        <Link
          to={`/recipes/${recipe.id}`}
          className="font-bold text-orange-700 transition hover:text-orange-800"
        >
          ← Retour à la recette
        </Link>

        <div className="mt-6">
          <p className="font-bold text-orange-600">Carnet familial</p>

          <h1 className="mt-2 text-4xl font-black leading-tight text-stone-950">
            Modifier la recette
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-stone-600">
            Mets à jour les informations de ta recette, puis enregistre les
            modifications pour les retrouver dans le carnet.
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100 md:p-8">
        <RecipeForm
          initialValues={recipe}
          submitLabel="Enregistrer les modifications"
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  )
}