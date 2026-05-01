import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RecipeForm from '../components/recipes/RecipeForm'
import type { RecipeFormValues } from '../components/recipes/RecipeForm'
import { createRecipe, uploadRecipeImage } from '../services/recipes'

export default function AddRecipePage() {
  const navigate = useNavigate()

  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(values: RecipeFormValues) {
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const { imageFile, ...recipeValues } = values

      let imageUrl: string | null = null

      if (imageFile) {
        imageUrl = await uploadRecipeImage(imageFile)
      }

      const newRecipe = await createRecipe({
        ...recipeValues,
        imageUrl,
      })

      navigate(`/recipes/${newRecipe.id}`)
    } catch (error) {
      console.error(error)
      setErrorMessage("Impossible d'ajouter la recette.")
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2.5rem] bg-[#fffaf3] shadow-sm ring-1 ring-orange-100">
        <div className="grid gap-8 p-6 md:grid-cols-[1fr_0.7fr] md:p-10">
          <div className="flex flex-col justify-center">
            <p className="font-bold text-orange-600">Nouvelle recette</p>

            <h1 className="mt-3 max-w-2xl text-4xl font-black leading-tight text-stone-950 md:text-5xl">
              Ajouter une recette au carnet familial.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              Note les ingrédients, les étapes, le temps de préparation et les
              petites astuces pour retrouver facilement cette recette plus tard.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <div className="flex h-full flex-col justify-between gap-6">
              <div>
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-orange-50 text-4xl">
                  🍲
                </div>

                <h2 className="mt-5 text-2xl font-black text-stone-950">
                  Une recette bien rangée
                </h2>

                <p className="mt-3 leading-7 text-stone-600">
                  Ajoute une belle photo, choisis une catégorie et utilise les
                  tags pour la retrouver rapidement.
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-[#fff5ec] p-4 ring-1 ring-orange-100">
                <p className="font-bold text-stone-900">Petit conseil</p>

                <p className="mt-1 text-sm leading-6 text-stone-600">
                  Pour les ingrédients, écris-les un par ligne : quantité +
                  ingrédient, par exemple “200 g de farine”.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 md:p-8">
        <div className="mb-8 border-b border-orange-100 pb-6">
          <p className="font-bold text-orange-600">Formulaire</p>

          <h2 className="mt-2 text-3xl font-black text-stone-950">
            Informations de la recette
          </h2>

          <p className="mt-2 text-stone-600">
            Remplis le formulaire pour enregistrer une nouvelle recette dans le
            carnet.
          </p>
        </div>

        <RecipeForm
          submitLabel="Ajouter la recette"
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  )
}