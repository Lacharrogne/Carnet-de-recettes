import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  DEFAULT_RECIPE_CATEGORY,
  RECIPE_CATEGORIES,
  RECIPE_DIFFICULTIES,
  RECIPE_TAG_GROUPS,
} from '../../data/recipeOptions'
import type { Difficulty, Recipe, RecipeCategory } from '../../types/recipe'

export type RecipeFormValues = {
  title: string
  category: RecipeCategory
  difficulty: Difficulty
  prepTime: number
  cookTime: number
  servings: number
  description: string
  image: string
  tags: string[]
  ingredients: string[]
  steps: string[]
  imageFile: File | null
}

type RecipeFormProps = {
  initialValues?: Recipe
  submitLabel: string
  isSubmitting: boolean
  errorMessage: string
  onSubmit: (values: RecipeFormValues) => Promise<void>
}

const inputClass =
  'w-full rounded-2xl border border-orange-100 bg-[#fffdf9] px-4 py-3 text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100'

const labelClass = 'mb-2 block font-bold text-stone-800'

const sectionClass =
  'rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100 md:p-6'

const smallButtonClass =
  'rounded-full bg-[#fff1e6] px-4 py-2 text-sm font-bold text-orange-700 transition hover:bg-orange-100'

export default function RecipeForm({
  initialValues,
  submitLabel,
  isSubmitting,
  errorMessage,
  onSubmit,
}: RecipeFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')

  const [category, setCategory] = useState<RecipeCategory>(
    initialValues?.category ?? DEFAULT_RECIPE_CATEGORY,
  )

  const [difficulty, setDifficulty] = useState<Difficulty>(
    initialValues?.difficulty ?? 'Facile',
  )

  const [prepTime, setPrepTime] = useState(initialValues?.prepTime ?? 0)
  const [cookTime, setCookTime] = useState(initialValues?.cookTime ?? 0)
  const [servings, setServings] = useState(initialValues?.servings ?? 1)

  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  )

  const [image, setImage] = useState(initialValues?.image ?? '🍽️')

  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialValues?.tags ?? [],
  )

  const [ingredients, setIngredients] = useState<string[]>(
    initialValues?.ingredients?.length ? initialValues.ingredients : [''],
  )

  const [steps, setSteps] = useState<string[]>(
    initialValues?.steps?.length ? initialValues.steps : [''],
  )

  const [imageFile, setImageFile] = useState<File | null>(null)

  const previewUrl = useMemo(() => {
    if (!imageFile) return null

    return URL.createObjectURL(imageFile)
  }, [imageFile])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const totalTime = useMemo(() => {
    return prepTime + cookTime
  }, [prepTime, cookTime])

  function isTagSelected(tagValue: string) {
    return selectedTags.some(
      (selectedTag) =>
        selectedTag.toLowerCase().trim() === tagValue.toLowerCase().trim(),
    )
  }

  function toggleTag(tagValue: string) {
    setSelectedTags((currentTags) => {
      const tagAlreadySelected = currentTags.some(
        (currentTag) =>
          currentTag.toLowerCase().trim() === tagValue.toLowerCase().trim(),
      )

      if (tagAlreadySelected) {
        return currentTags.filter(
          (currentTag) =>
            currentTag.toLowerCase().trim() !== tagValue.toLowerCase().trim(),
        )
      }

      return [...currentTags, tagValue]
    })
  }

  function updateIngredient(index: number, value: string) {
    setIngredients((currentIngredients) =>
      currentIngredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? value : ingredient,
      ),
    )
  }

  function addIngredient() {
    setIngredients((currentIngredients) => [...currentIngredients, ''])
  }

  function removeIngredient(index: number) {
    setIngredients((currentIngredients) => {
      if (currentIngredients.length === 1) return currentIngredients

      return currentIngredients.filter(
        (_, ingredientIndex) => ingredientIndex !== index,
      )
    })
  }

  function updateStep(index: number, value: string) {
    setSteps((currentSteps) =>
      currentSteps.map((step, stepIndex) =>
        stepIndex === index ? value : step,
      ),
    )
  }

  function addStep() {
    setSteps((currentSteps) => [...currentSteps, ''])
  }

  function removeStep(index: number) {
    setSteps((currentSteps) => {
      if (currentSteps.length === 1) return currentSteps

      return currentSteps.filter((_, stepIndex) => stepIndex !== index)
    })
  }

  function cleanList(values: string[]) {
    return values
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    await onSubmit({
      title: title.trim(),
      category,
      difficulty,
      prepTime,
      cookTime,
      servings,
      description: description.trim(),
      image: image.trim() || '🍽️',
      tags: selectedTags,
      ingredients: cleanList(ingredients),
      steps: cleanList(steps),
      imageFile,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {errorMessage && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 font-medium text-red-700 ring-1 ring-red-100">
          {errorMessage}
        </p>
      )}

      <div className="rounded-[2rem] bg-[#fff5ec] p-6 ring-1 ring-orange-100">
        <p className="font-bold text-orange-600">Carnet familial</p>

        <h2 className="mt-2 text-2xl font-black text-stone-950">
          Informations principales
        </h2>

        <p className="mt-2 max-w-2xl leading-7 text-stone-600">
          Ajoute les détails essentiels de la recette pour pouvoir la retrouver,
          la refaire et la partager facilement.
        </p>
      </div>

      <div className={sectionClass}>
        <div className="mb-6">
          <p className="font-bold text-orange-600">Base de la recette</p>

          <h3 className="mt-1 text-2xl font-black text-stone-950">
            Nom, catégorie et difficulté
          </h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className={labelClass}>Titre</label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              placeholder="Exemple : Lasagnes maison"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Catégorie principale</label>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as RecipeCategory)
              }
              className={inputClass}
            >
              {RECIPE_CATEGORIES.map((recipeCategory) => (
                <option key={recipeCategory.value} value={recipeCategory.value}>
                  {recipeCategory.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Difficulté</label>

            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as Difficulty)
              }
              className={inputClass}
            >
              {RECIPE_DIFFICULTIES.map((difficultyValue) => (
                <option key={difficultyValue} value={difficultyValue}>
                  {difficultyValue}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="mb-6">
          <p className="font-bold text-orange-600">Temps et portions</p>

          <h3 className="mt-1 text-2xl font-black text-stone-950">
            Organisation en cuisine
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className={labelClass}>Préparation</label>

            <input
              type="number"
              min="0"
              value={prepTime}
              onChange={(event) => setPrepTime(Number(event.target.value))}
              className={inputClass}
            />

            <p className="mt-2 text-sm text-stone-500">En minutes</p>
          </div>

          <div>
            <label className={labelClass}>Cuisson</label>

            <input
              type="number"
              min="0"
              value={cookTime}
              onChange={(event) => setCookTime(Number(event.target.value))}
              className={inputClass}
            />

            <p className="mt-2 text-sm text-stone-500">En minutes</p>
          </div>

          <div>
            <label className={labelClass}>Portions</label>

            <input
              type="number"
              min="1"
              value={servings}
              onChange={(event) => setServings(Number(event.target.value))}
              className={inputClass}
            />

            <p className="mt-2 text-sm text-stone-500">Nombre de personnes</p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.5rem] bg-[#fff5ec] px-5 py-4 ring-1 ring-orange-100">
          <p className="text-sm font-bold text-stone-600">Temps total</p>

          <p className="mt-1 text-3xl font-black text-stone-950">
            {totalTime} min
          </p>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="mb-6">
          <p className="font-bold text-orange-600">Image</p>

          <h3 className="mt-1 text-2xl font-black text-stone-950">
            Photo et emoji de secours
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-[0.45fr_0.55fr]">
          <div>
            <label className={labelClass}>Emoji de secours</label>

            <input
              value={image}
              onChange={(event) => setImage(event.target.value)}
              placeholder="🍽️"
              className={inputClass}
            />

            <p className="mt-2 text-sm text-stone-500">
              Il s’affiche quand aucune photo n’est ajoutée.
            </p>
          </div>

          <div>
            <label className={labelClass}>Photo</label>

            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setImageFile(event.target.files ? event.target.files[0] : null)
              }
              className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-orange-100 file:px-4 file:py-2 file:font-bold file:text-orange-700`}
            />

            {initialValues?.imageUrl && !previewUrl && (
              <p className="mt-2 text-sm text-stone-500">
                Tu peux laisser vide pour garder l’image actuelle.
              </p>
            )}
          </div>
        </div>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Aperçu de la recette"
            className="mt-5 h-56 w-full rounded-[1.5rem] object-cover ring-1 ring-orange-100"
          />
        )}
      </div>

      <div className={sectionClass}>
        <div className="mb-6">
          <p className="font-bold text-orange-600">Présentation</p>

          <h3 className="mt-1 text-2xl font-black text-stone-950">
            Petite description
          </h3>
        </div>

        <label className={labelClass}>Description</label>

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          required
          placeholder="Exemple : une recette simple, familiale, parfaite pour le dimanche soir..."
          className={inputClass}
        />
      </div>

      <div className={sectionClass}>
        <div className="mb-6">
          <p className="font-bold text-orange-600">Classement</p>

          <h3 className="mt-1 text-2xl font-black text-stone-950">Tags</h3>

          <p className="mt-2 leading-7 text-stone-600">
            Les tags permettent de retrouver rapidement une recette selon
            l’envie, le moment ou le type de plat.
          </p>
        </div>

        <div className="space-y-6">
          {RECIPE_TAG_GROUPS.map((group) => (
            <div key={group.title} className="rounded-[1.5rem] bg-[#fffaf3] p-4">
              <p className="mb-3 font-black text-stone-800">{group.title}</p>

              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => {
                  const isSelected = isTagSelected(tag.value)

                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => toggleTag(tag.value)}
                      className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'bg-white text-stone-600 ring-1 ring-orange-100 hover:bg-orange-50 hover:text-orange-700'
                      }`}
                    >
                      #{tag.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={sectionClass}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-bold text-orange-600">Liste de courses</p>

            <h3 className="mt-1 text-2xl font-black text-stone-950">
              Ingrédients
            </h3>
          </div>

          <button type="button" onClick={addIngredient} className={smallButtonClass}>
            + Ajouter un ingrédient
          </button>
        </div>

        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-[1.5rem] bg-[#fffaf3] p-3 sm:flex-row"
            >
              <input
                value={ingredient}
                onChange={(event) =>
                  updateIngredient(index, event.target.value)
                }
                placeholder={`Ingrédient ${index + 1}`}
                className={inputClass}
              />

              <button
                type="button"
                onClick={() => removeIngredient(index)}
                disabled={ingredients.length === 1}
                className="rounded-2xl border border-red-100 bg-white px-4 py-3 font-bold text-stone-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={sectionClass}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-bold text-orange-600">Préparation</p>

            <h3 className="mt-1 text-2xl font-black text-stone-950">
              Étapes de la recette
            </h3>
          </div>

          <button type="button" onClick={addStep} className={smallButtonClass}>
            + Ajouter une étape
          </button>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-[1.5rem] bg-[#fffaf3] p-3 sm:flex-row"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-600 font-black text-white">
                {index + 1}
              </div>

              <textarea
                value={step}
                onChange={(event) => updateStep(index, event.target.value)}
                placeholder={`Étape ${index + 1}`}
                rows={3}
                className={inputClass}
              />

              <button
                type="button"
                onClick={() => removeStep(index)}
                disabled={steps.length === 1}
                className="h-fit rounded-2xl border border-red-100 bg-white px-4 py-3 font-bold text-stone-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-[1.5rem] bg-orange-600 px-6 py-4 text-lg font-black text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Enregistrement...' : submitLabel}
      </button>
    </form>
  )
}