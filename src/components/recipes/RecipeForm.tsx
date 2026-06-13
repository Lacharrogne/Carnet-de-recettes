import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'

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
  'w-full rounded-2xl bg-linen px-4 py-3.5 text-base text-cacao outline-none ring-1 ring-bark transition placeholder:text-hazel focus:bg-card focus:ring-2 focus:ring-terracotta/40 sm:px-4 sm:py-3'

const labelClass = 'mb-2 block text-sm font-semibold text-hazel sm:text-base'

const sectionClass =
  'rounded-[1.75rem] bg-card p-5 shadow-card ring-1 ring-bark sm:rounded-[2rem] md:p-6'

const smallButtonClass =
  'inline-flex items-center justify-center rounded-full bg-terracotta-soft px-4 py-2 text-sm font-bold text-terracotta-deep transition hover:bg-[#eecbb4]'

export default function RecipeForm({
  initialValues,
  submitLabel,
  isSubmitting,
  errorMessage,
  onSubmit,
}: RecipeFormProps) {
  const ingredientInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const stepTextareaRefs = useRef<Array<HTMLTextAreaElement | null>>([])
  const ingredientFocusIndexRef = useRef<number | null>(null)
  const stepFocusIndexRef = useRef<number | null>(null)

  const [title, setTitle] = useState(initialValues?.title ?? '')

  const [category, setCategory] = useState<RecipeCategory>(
    initialValues?.category ?? DEFAULT_RECIPE_CATEGORY,
  )

  const [difficulty, setDifficulty] = useState<Difficulty>(
    initialValues?.difficulty ?? 'Facile',
  )

  const [prepTime, setPrepTime] = useState(
    initialValues ? String(initialValues.prepTime) : '',
  )

  const [cookTime, setCookTime] = useState(
    initialValues ? String(initialValues.cookTime) : '',
  )

  const [servings, setServings] = useState(
    initialValues ? String(initialValues.servings) : '1',
  )

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

  useEffect(() => {
    const indexToFocus = ingredientFocusIndexRef.current

    if (indexToFocus === null) return

    const inputToFocus = ingredientInputRefs.current[indexToFocus]

    if (inputToFocus) {
      inputToFocus.focus()
      inputToFocus.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      ingredientFocusIndexRef.current = null
    }
  }, [ingredients.length])

  useEffect(() => {
    const indexToFocus = stepFocusIndexRef.current

    if (indexToFocus === null) return

    const textareaToFocus = stepTextareaRefs.current[indexToFocus]

    if (textareaToFocus) {
      textareaToFocus.focus()
      textareaToFocus.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      stepFocusIndexRef.current = null
    }
  }, [steps.length])

  const totalTime = useMemo(() => {
    const prepTimeNumber = Number(prepTime) || 0
    const cookTimeNumber = Number(cookTime) || 0

    return prepTimeNumber + cookTimeNumber
  }, [prepTime, cookTime])

  function focusIngredientInput(index: number) {
    const inputToFocus = ingredientInputRefs.current[index]

    if (inputToFocus) {
      inputToFocus.focus()
      inputToFocus.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return
    }

    ingredientFocusIndexRef.current = index
  }

  function focusStepTextarea(index: number) {
    const textareaToFocus = stepTextareaRefs.current[index]

    if (textareaToFocus) {
      textareaToFocus.focus()
      textareaToFocus.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return
    }

    stepFocusIndexRef.current = index
  }

  function handleIngredientKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (event.key !== 'Enter') return

    event.preventDefault()

    const nextIndex = index + 1

    if (nextIndex < ingredients.length) {
      focusIngredientInput(nextIndex)
      return
    }

    ingredientFocusIndexRef.current = nextIndex
    setIngredients((currentIngredients) => [...currentIngredients, ''])
  }

  function handleStepKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
    index: number,
  ) {
    if (event.key !== 'Enter') return

    if (event.shiftKey) {
      return
    }

    event.preventDefault()

    const nextIndex = index + 1

    if (nextIndex < steps.length) {
      focusStepTextarea(nextIndex)
      return
    }

    stepFocusIndexRef.current = nextIndex
    setSteps((currentSteps) => [...currentSteps, ''])
  }

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
    setIngredients((currentIngredients) => {
      ingredientFocusIndexRef.current = currentIngredients.length
      return [...currentIngredients, '']
    })
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
    setSteps((currentSteps) => {
      stepFocusIndexRef.current = currentSteps.length
      return [...currentSteps, '']
    })
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
      prepTime: Math.max(0, Number(prepTime) || 0),
      cookTime: Math.max(0, Number(cookTime) || 0),
      servings: Math.max(1, Number(servings) || 1),
      description: description.trim(),
      image: image.trim() || '🍽️',
      tags: selectedTags,
      ingredients: cleanList(ingredients),
      steps: cleanList(steps),
      imageFile,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-7">
      {errorMessage && (
        <p className="rounded-2xl bg-[#f7e3de] px-4 py-3 text-sm font-medium leading-6 text-[#b23b2e] ring-1 ring-[#e9c4bc] sm:text-base">
          {errorMessage}
        </p>
      )}

      <div className="rounded-[1.75rem] bg-honey-soft/60 p-5 ring-1 ring-honey/30 sm:rounded-[2rem] sm:p-6">
        <p className="text-sm font-bold text-terracotta sm:text-base">
          Carnet familial
        </p>

        <h2 className="mt-2 text-2xl font-black text-stone-950 sm:text-3xl">
          Informations principales
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base sm:leading-7">
          Ajoute les détails essentiels de la recette pour pouvoir la retrouver,
          la refaire et la partager facilement.
        </p>
      </div>

      <div className={sectionClass}>
        <div className="mb-5 sm:mb-6">
          <p className="text-sm font-bold text-terracotta sm:text-base">
            Base de la recette
          </p>

          <h3 className="mt-1 text-xl font-black text-stone-950 sm:text-2xl">
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
        <div className="mb-5 sm:mb-6">
          <p className="text-sm font-bold text-terracotta sm:text-base">
            Temps et portions
          </p>

          <h3 className="mt-1 text-xl font-black text-stone-950 sm:text-2xl">
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
                onChange={(event) => setPrepTime(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                placeholder="0"
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
                onChange={(event) => setCookTime(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                placeholder="0"
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
                onChange={(event) => setServings(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                placeholder="1"
                className={inputClass}
              />

            <p className="mt-2 text-sm text-stone-500">Nombre de personnes</p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.5rem] bg-linen px-5 py-4 ring-1 ring-orange-100">
          <p className="text-sm font-bold text-stone-600">Temps total</p>

          <p className="mt-1 text-3xl font-black text-stone-950">
            {totalTime} min
          </p>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="mb-5 sm:mb-6">
          <p className="text-sm font-bold text-terracotta sm:text-base">
            Image
          </p>

          <h3 className="mt-1 text-xl font-black text-stone-950 sm:text-2xl">
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

            <p className="mt-2 text-sm leading-6 text-stone-500">
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
              className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-orange-100 file:px-4 file:py-2 file:text-sm file:font-bold file:text-orange-700`}
            />

            {initialValues?.imageUrl && !previewUrl && (
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Tu peux laisser vide pour garder l’image actuelle.
              </p>
            )}
          </div>
        </div>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Aperçu de la recette"
            className="mt-5 h-44 w-full rounded-[1.5rem] object-cover ring-1 ring-bark sm:h-56"
          />
        )}
      </div>

      <div className={sectionClass}>
        <div className="mb-5 sm:mb-6">
          <p className="text-sm font-bold text-terracotta sm:text-base">
            Présentation
          </p>

          <h3 className="mt-1 text-xl font-black text-stone-950 sm:text-2xl">
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
        <div className="mb-5 sm:mb-6">
          <p className="text-sm font-bold text-terracotta sm:text-base">
            Classement
          </p>

          <h3 className="mt-1 text-xl font-black text-stone-950 sm:text-2xl">
            Tags
          </h3>

          <p className="mt-2 text-sm leading-6 text-stone-600 sm:text-base sm:leading-7">
            Les tags permettent de retrouver rapidement une recette selon
            l’envie, le moment ou le type de plat.
          </p>
        </div>

        <div className="space-y-5 sm:space-y-6">
          {RECIPE_TAG_GROUPS.map((group) => (
            <div
              key={group.title}
              className="rounded-[1.5rem] bg-cream-50 p-4 ring-1 ring-bark/50"
            >
              <p className="mb-3 font-black text-espresso">{group.title}</p>

              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => {
                  const isSelected = isTagSelected(tag.value)

                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => toggleTag(tag.value)}
                      className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
                        isSelected
                          ? 'bg-terracotta text-white shadow-sm'
                          : 'bg-card text-cacao ring-1 ring-bark hover:bg-linen hover:text-terracotta'
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
        <div className="mb-5 sm:mb-6">
          <p className="text-sm font-bold text-terracotta sm:text-base">
            Liste de courses
          </p>

          <h3 className="mt-1 text-xl font-black text-stone-950 sm:text-2xl">
            Ingrédients
          </h3>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            Appuie sur Entrée pour passer à l’ingrédient suivant.
          </p>
        </div>

        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-[1.5rem] bg-cream-50 p-3 ring-1 ring-bark/50 sm:flex-row sm:items-center"
            >
              <input
                ref={(element) => {
                  ingredientInputRefs.current[index] = element
                }}
                value={ingredient}
                onChange={(event) =>
                  updateIngredient(index, event.target.value)
                }
                onKeyDown={(event) => handleIngredientKeyDown(event, index)}
                placeholder={`Ingrédient ${index + 1}`}
                className={inputClass}
              />

              <button
                type="button"
                onClick={() => removeIngredient(index)}
                disabled={ingredients.length === 1}
                className="w-full rounded-2xl border border-[#e9c4bc] bg-card px-4 py-3 font-bold text-hazel transition hover:bg-[#f7e3de] hover:text-[#b23b2e] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addIngredient}
          className={`${smallButtonClass} mt-4 w-full rounded-[1.25rem] py-3 text-base`}
        >
          + Ajouter un ingrédient
        </button>
      </div>

      <div className={sectionClass}>
        <div className="mb-5 sm:mb-6">
          <p className="text-sm font-bold text-terracotta sm:text-base">
            Préparation
          </p>

          <h3 className="mt-1 text-xl font-black text-stone-950 sm:text-2xl">
            Étapes de la recette
          </h3>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            Appuie sur Entrée pour passer à l’étape suivante. Utilise Shift +
            Entrée pour faire un retour à la ligne dans une étape.
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-[1.5rem] bg-cream-50 p-3 ring-1 ring-bark/50 sm:flex-row"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-terracotta font-black text-white">
                {index + 1}
              </div>

              <textarea
                ref={(element) => {
                  stepTextareaRefs.current[index] = element
                }}
                value={step}
                onChange={(event) => updateStep(index, event.target.value)}
                onKeyDown={(event) => handleStepKeyDown(event, index)}
                placeholder={`Étape ${index + 1}`}
                rows={3}
                className={inputClass}
              />

              <button
                type="button"
                onClick={() => removeStep(index)}
                disabled={steps.length === 1}
                className="h-fit w-full rounded-2xl border border-[#e9c4bc] bg-card px-4 py-3 font-bold text-hazel transition hover:bg-[#f7e3de] hover:text-[#b23b2e] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addStep}
          className={`${smallButtonClass} mt-4 w-full rounded-[1.25rem] py-3 text-base`}
        >
          + Ajouter une étape
        </button>
      </div>

      <div className="z-20 rounded-[1.75rem] bg-cream-50/90 p-2 shadow-lift ring-1 ring-bark backdrop-blur print:static">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-[1.5rem] bg-terracotta px-6 py-4 text-lg font-bold text-white shadow-soft transition hover:bg-terracotta-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Enregistrement...' : submitLabel}
        </button>
      </div>
    </form>
  )
}