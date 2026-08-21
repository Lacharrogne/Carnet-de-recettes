import { useState, type FormEvent } from 'react'

import { importRecipeFromUrl, type ImportedRecipe } from '../../services/recipeImport'
import Button from '../ui/Button'
import Input from '../ui/Input'

/**
 * Barre « Importer depuis un lien » : colle l'URL d'un site de cuisine, on
 * récupère la recette (via la fonction serveur) et on préremplit le formulaire.
 */
export default function RecipeImportBar({
  onImported,
}: {
  onImported: (recipe: ImportedRecipe) => void
}) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const trimmed = url.trim()
    if (!trimmed) return

    setLoading(true)
    setError('')

    try {
      const recipe = await importRecipeFromUrl(trimmed)
      onImported(recipe)
      setUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import impossible.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[1.75rem] bg-gradient-to-br from-terracotta-soft/70 to-honey-soft/50 p-5 ring-1 ring-bark sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-bark">
          🪄
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black text-cacao">
            Importer depuis un lien
          </h2>
          <p className="mt-1 text-sm leading-6 text-hazel">
            Colle l'adresse d'une recette trouvée sur un site de cuisine : on
            remplit le formulaire pour toi (ingrédients, étapes, temps, photo).
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-4 flex flex-col gap-2.5 sm:flex-row"
          >
            <Input
              type="url"
              inputMode="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://exemple.com/ma-recette"
              aria-label="Lien de la recette à importer"
              wrapperClassName="min-w-0 flex-1"
              disabled={loading}
            />

            <Button type="submit" disabled={loading || !url.trim()}>
              {loading ? 'Import…' : 'Importer'}
            </Button>
          </form>

          {error && (
            <p className="mt-3 rounded-xl bg-[#f7e3de] px-3 py-2 text-sm font-bold text-[#b23b2e]">
              {error}
            </p>
          )}

          <p className="mt-3 text-xs leading-5 text-hazel">
            Fonctionne avec la plupart des grands sites de cuisine. Tu peux tout
            ajuster ensuite avant d'enregistrer.
          </p>
        </div>
      </div>
    </div>
  )
}
