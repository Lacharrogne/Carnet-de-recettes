import { useEffect, useId, useMemo, useRef, useState } from 'react'

import {
  EMOJI_CATEGORIES,
  EMOJI_KEYWORDS,
  type EmojiCategory,
} from '../../data/emojiCatalog'

interface EmojiPickerProps {
  /** Emoji actuellement sélectionné. */
  value: string
  /** Appelé avec le nouvel emoji choisi. */
  onChange: (emoji: string) => void
  /** Emoji affiché en filigrane quand aucun n'est choisi. */
  placeholder?: string
}

/** Normalise une chaîne pour la recherche (minuscule, sans accents). */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Filtre les catégories selon la recherche. */
function filterCategories(query: string): EmojiCategory[] {
  const needle = normalize(query.trim())

  if (!needle) {
    return EMOJI_CATEGORIES
  }

  return EMOJI_CATEGORIES.map((category) => {
    // Une catégorie dont le libellé correspond est gardée entièrement.
    if (normalize(category.label).includes(needle)) {
      return category
    }

    const emojis = category.emojis.filter((emoji) => {
      if (emoji === query.trim()) {
        return true
      }

      const keywords = EMOJI_KEYWORDS[emoji] ?? []
      return keywords.some((keyword) => normalize(keyword).includes(needle))
    })

    return { ...category, emojis }
  }).filter((category) => category.emojis.length > 0)
}

/**
 * Sélecteur d'emoji : un bouton affichant l'emoji courant qui ouvre un
 * popover avec recherche et grille cliquable — pour choisir directement un
 * emoji sans copier-coller.
 */
export function EmojiPicker({
  value,
  onChange,
  placeholder = '🍽️',
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const labelId = useId()

  const categories = useMemo(() => filterCategories(query), [query])

  // Fermeture au clic à l'extérieur et à la touche Échap. On capture Échap
  // en phase de capture et on stoppe sa propagation pour ne fermer que le
  // popover (et non une éventuelle modale parente qui écoute aussi Échap).
  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [open])

  const handleSelect = (emoji: string) => {
    onChange(emoji)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
        className="flex w-full items-center justify-center rounded-2xl bg-linen px-4 py-3.5 text-2xl outline-none ring-1 ring-bark transition hover:bg-card focus:bg-card focus:ring-2 focus:ring-terracotta/40 sm:py-3"
      >
        {value ? (
          <span>{value}</span>
        ) : (
          <span className="text-hazel">{placeholder}</span>
        )}
        <span id={labelId} className="sr-only">
          Choisir un emoji
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choisir un emoji"
          className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[80vw] rounded-2xl bg-card p-3 shadow-card ring-1 ring-bark"
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher (poulet, dessert, légume...)"
            aria-label="Rechercher un emoji"
            autoFocus
            className="mb-3 w-full rounded-xl bg-linen px-3 py-2.5 text-sm text-cacao outline-none ring-1 ring-bark transition placeholder:text-hazel focus:bg-card focus:ring-2 focus:ring-terracotta/40"
          />

          <div className="max-h-60 overflow-y-auto pr-1">
            {categories.length === 0 ? (
              <p className="py-6 text-center text-sm text-hazel">
                Aucun emoji trouvé.
              </p>
            ) : (
              categories.map((category) => (
                <div key={category.label} className="mb-3 last:mb-0">
                  <p className="mb-1 px-1 text-xs font-bold uppercase tracking-wide text-hazel">
                    {category.label}
                  </p>

                  <div className="grid grid-cols-6 gap-1">
                    {category.emojis.map((emoji) => {
                      const selected = emoji === value

                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleSelect(emoji)}
                          aria-label={`Choisir ${emoji}`}
                          aria-pressed={selected}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl transition hover:bg-terracotta-soft focus:bg-terracotta-soft focus:outline-none focus:ring-2 focus:ring-terracotta/40 ${
                            selected ? 'bg-terracotta-soft ring-2 ring-terracotta/50' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
