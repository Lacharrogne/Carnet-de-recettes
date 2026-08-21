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
import {
  clearRecipeDraftSnapshot,
  loadRecipeDraftSnapshot,
  saveRecipeDraftSnapshot,
  snapshotHasContent,
} from '../../lib/recipeDraftAutosave'
import Alert from '../ui/Alert'
import { EmojiPicker } from '../ui/EmojiPicker'
import Select from '../ui/Select'
import ImageCropper from './ImageCropper'

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
  relatedRecipeIds: number[]
  imageFile: File | null
}

type RecipeFormProps = {
  initialValues?: Recipe
  submitLabel: string
  isSubmitting: boolean
  errorMessage: string
  // Autres recettes proposées pour créer des liens manuels.
  availableRecipes?: Recipe[]
  onSubmit: (values: RecipeFormValues) => Promise<void>
  // Enregistrement en brouillon (facultatif) : n'exige qu'un titre.
  onSaveDraft?: (values: RecipeFormValues) => Promise<void>
  isSavingDraft?: boolean
  draftLabel?: string
  // Sauvegarde automatique locale du formulaire (création uniquement).
  autosave?: boolean
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
  availableRecipes = [],
  onSubmit,
  onSaveDraft,
  isSavingDraft = false,
  draftLabel = 'Enregistrer le brouillon',
  autosave = false,
}: RecipeFormProps) {
  const ingredientInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const stepTextareaRefs = useRef<Array<HTMLTextAreaElement | null>>([])
  const ingredientFocusIndexRef = useRef<number | null>(null)
  const stepFocusIndexRef = useRef<number | null>(null)

  // Sauvegarde auto (locale) : uniquement en création (pas en édition).
  const autosaveEnabled = autosave && !initialValues
  const restoredSnapshot = useMemo(
    () => (autosaveEnabled ? loadRecipeDraftSnapshot() : null),
    [autosaveEnabled],
  )

  const [title, setTitle] = useState(
    initialValues?.title ?? restoredSnapshot?.title ?? '',
  )
  const [draftError, setDraftError] = useState('')
  const [restoredNotice, setRestoredNotice] = useState(() =>
    snapshotHasContent(restoredSnapshot),
  )

  const [category, setCategory] = useState<RecipeCategory>(
    initialValues?.category ??
      (restoredSnapshot?.category as RecipeCategory) ??
      DEFAULT_RECIPE_CATEGORY,
  )

  const [difficulty, setDifficulty] = useState<Difficulty>(
    initialValues?.difficulty ??
      (restoredSnapshot?.difficulty as Difficulty) ??
      'Facile',
  )

  const [prepTime, setPrepTime] = useState(
    initialValues ? String(initialValues.prepTime) : restoredSnapshot?.prepTime ?? '',
  )

  const [cookTime, setCookTime] = useState(
    initialValues ? String(initialValues.cookTime) : restoredSnapshot?.cookTime ?? '',
  )

  const [servings, setServings] = useState(
    initialValues
      ? String(initialValues.servings)
      : restoredSnapshot?.servings ?? '1',
  )

  const [description, setDescription] = useState(
    initialValues?.description ?? restoredSnapshot?.description ?? '',
  )

  const [image, setImage] = useState(
    initialValues?.image ?? restoredSnapshot?.image ?? '🍽️',
  )

  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialValues?.tags ?? restoredSnapshot?.tags ?? [],
  )

  const [ingredients, setIngredients] = useState<string[]>(
    initialValues?.ingredients?.length
      ? initialValues.ingredients
      : restoredSnapshot?.ingredients?.length
        ? restoredSnapshot.ingredients
        : [''],
  )

  const [steps, setSteps] = useState<string[]>(
    initialValues?.steps?.length
      ? initialValues.steps
      : restoredSnapshot?.steps?.length
        ? restoredSnapshot.steps
        : [''],
  )

  const [relatedRecipeIds, setRelatedRecipeIds] = useState<number[]>(
    initialValues?.relatedRecipeIds ?? restoredSnapshot?.relatedRecipeIds ?? [],
  )

  const [relatedSearch, setRelatedSearch] = useState('')

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

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

  // Recettes pouvant être liées (toutes sauf celle en cours d'édition).
  const linkableRecipes = useMemo(
    () =>
      availableRecipes.filter((recipe) => recipe.id !== initialValues?.id),
    [availableRecipes, initialValues?.id],
  )

  const selectedRelatedRecipes = useMemo(
    () =>
      relatedRecipeIds
        .map((id) => linkableRecipes.find((recipe) => recipe.id === id))
        .filter((recipe): recipe is Recipe => Boolean(recipe)),
    [relatedRecipeIds, linkableRecipes],
  )

  const relatedSearchResults = useMemo(() => {
    const query = relatedSearch.trim().toLowerCase()
    if (!query) return []

    return linkableRecipes
      .filter((recipe) => !relatedRecipeIds.includes(recipe.id))
      .filter((recipe) => recipe.title.toLowerCase().includes(query))
      .slice(0, 6)
  }, [relatedSearch, linkableRecipes, relatedRecipeIds])

  function addRelatedRecipe(id: number) {
    setRelatedRecipeIds((current) =>
      current.includes(id) ? current : [...current, id],
    )
    setRelatedSearch('')
  }

  function removeRelatedRecipe(id: number) {
    setRelatedRecipeIds((current) =>
      current.filter((relatedId) => relatedId !== id),
    )
  }

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

  // Sauvegarde automatique (débounce) du formulaire tant qu'on saisit.
  useEffect(() => {
    if (!autosaveEnabled) return

    const timeoutId = setTimeout(() => {
      saveRecipeDraftSnapshot({
        title,
        category,
        difficulty,
        prepTime,
        cookTime,
        servings,
        description,
        image,
        tags: selectedTags,
        ingredients,
        steps,
        relatedRecipeIds,
      })
    }, 600)

    return () => clearTimeout(timeoutId)
  }, [
    autosaveEnabled,
    title,
    category,
    difficulty,
    prepTime,
    cookTime,
    servings,
    description,
    image,
    selectedTags,
    ingredients,
    steps,
    relatedRecipeIds,
  ])

  function handleDiscardAutosave() {
    clearRecipeDraftSnapshot()
    setRestoredNotice(false)
    setTitle('')
    setCategory(DEFAULT_RECIPE_CATEGORY)
    setDifficulty('Facile')
    setPrepTime('')
    setCookTime('')
    setServings('1')
    setDescription('')
    setImage('🍽️')
    setSelectedTags([])
    setIngredients([''])
    setSteps([''])
    setRelatedRecipeIds([])
    setImageFile(null)
    setDraftError('')
  }

  function collectValues(): RecipeFormValues {
    return {
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
      relatedRecipeIds,
      imageFile,
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(collectValues())
  }

  async function handleSaveDraft() {
    if (!onSaveDraft) return

    // Un brouillon n'exige qu'un titre (le reste est facultatif).
    if (!title.trim()) {
      setDraftError('Donne au moins un titre à ton brouillon pour l’enregistrer.')
      return
    }

    setDraftError('')
    await onSaveDraft(collectValues())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-7">
      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

      {restoredNotice && (
        <div className="flex flex-col gap-2 rounded-2xl bg-honey-soft px-4 py-3 text-sm ring-1 ring-honey/40 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-stone-700">
            ✎ On a récupéré votre saisie en cours, vous pouvez continuer.
          </p>

          <button
            type="button"
            onClick={handleDiscardAutosave}
            className="shrink-0 self-start rounded-full bg-card px-3 py-1.5 text-xs font-bold text-cacao ring-1 ring-bark transition hover:bg-linen sm:self-auto"
          >
            Repartir de zéro
          </button>
        </div>
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

            <Select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as RecipeCategory)
              }
              aria-label="Catégorie principale"
            >
              {RECIPE_CATEGORIES.map((recipeCategory) => (
                <option key={recipeCategory.value} value={recipeCategory.value}>
                  {recipeCategory.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className={labelClass}>Difficulté</label>

            <Select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as Difficulty)
              }
              aria-label="Difficulté"
            >
              {RECIPE_DIFFICULTIES.map((difficultyValue) => (
                <option key={difficultyValue} value={difficultyValue}>
                  {difficultyValue}
                </option>
              ))}
            </Select>
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

        <div className="mt-5 rounded-[1.5rem] bg-linen px-5 py-4 ring-1 ring-bark">
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

            <EmojiPicker
              value={image}
              onChange={(emoji) => setImage(emoji)}
              placeholder="🍽️"
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
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null
                if (selected) {
                  setPendingFile(selected)
                }
                // Réinitialise pour permettre de re-choisir le même fichier.
                event.target.value = ''
              }}
              className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-orange-100 file:px-4 file:py-2 file:text-sm file:font-bold file:text-orange-700`}
            />

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Vous pourrez recadrer et redimensionner la photo avant
              l’enregistrement.
            </p>

            {initialValues?.imageUrl && !previewUrl && (
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Tu peux laisser vide pour garder l’image actuelle.
              </p>
            )}
          </div>
        </div>

        {previewUrl && (
          <div className="mt-5">
            <img
              src={previewUrl}
              alt="Aperçu de la recette"
              className="h-44 w-full rounded-[1.5rem] object-cover ring-1 ring-bark sm:h-56"
            />

            {imageFile && (
              <button
                type="button"
                onClick={() => setPendingFile(imageFile)}
                className={`${smallButtonClass} mt-3`}
              >
                Recadrer la photo
              </button>
            )}
          </div>
        )}
      </div>

      {pendingFile && (
        <ImageCropper
          file={pendingFile}
          onCancel={() => setPendingFile(null)}
          onConfirm={(croppedFile) => {
            setImageFile(croppedFile)
            setPendingFile(null)
          }}
        />
      )}

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

      {linkableRecipes.length > 0 && (
        <div className={sectionClass}>
          <p className="text-sm font-bold text-terracotta sm:text-base">
            Recettes liées
          </p>

          <h2 className="mt-2 text-2xl font-black text-stone-950 sm:text-3xl">
            Relier des recettes-composants
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base sm:leading-7">
            Pointe vers une autre recette utilisée ici (par exemple une pâte
            brisée maison). Les liens s'affichent sur la fiche de la recette.
          </p>

          {selectedRelatedRecipes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedRelatedRecipes.map((recipe) => (
                <span
                  key={recipe.id}
                  className="inline-flex items-center gap-2 rounded-full bg-terracotta-soft px-3 py-1.5 text-sm font-bold text-terracotta-deep"
                >
                  {recipe.title}
                  <button
                    type="button"
                    onClick={() => removeRelatedRecipe(recipe.id)}
                    aria-label={`Retirer le lien vers ${recipe.title}`}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-card/70 text-xs font-black text-hazel transition hover:bg-card hover:text-[#b23b2e]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative mt-4">
            <input
              type="text"
              value={relatedSearch}
              onChange={(event) => setRelatedSearch(event.target.value)}
              aria-label="Rechercher une recette à lier"
              placeholder="Rechercher une recette à lier..."
              className={inputClass}
            />

            {relatedSearchResults.length > 0 && (
              <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl bg-card shadow-lift ring-1 ring-bark">
                {relatedSearchResults.map((recipe) => (
                  <li key={recipe.id}>
                    <button
                      type="button"
                      onClick={() => addRelatedRecipe(recipe.id)}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-cacao transition hover:bg-cream-50"
                    >
                      <span>{recipe.image || '🍽️'}</span>
                      <span className="min-w-0 flex-1 truncate">
                        {recipe.title}
                      </span>
                      <span className="text-xs font-bold text-terracotta">
                        + Lier
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="z-20 space-y-2 rounded-[1.75rem] bg-cream-50/90 p-2 shadow-lift ring-1 ring-bark backdrop-blur print:static">
        {draftError && <Alert tone="error">{draftError}</Alert>}

        <button
          type="submit"
          disabled={isSubmitting || isSavingDraft}
          className="w-full rounded-[1.5rem] bg-terracotta px-6 py-4 text-lg font-bold text-white shadow-soft transition hover:bg-terracotta-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Enregistrement...' : submitLabel}
        </button>

        {onSaveDraft && (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting || isSavingDraft}
            className="w-full rounded-[1.5rem] bg-card px-6 py-3.5 text-base font-bold text-cacao ring-1 ring-bark transition hover:bg-linen disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingDraft ? 'Enregistrement...' : draftLabel}
          </button>
        )}
      </div>
    </form>
  )
}