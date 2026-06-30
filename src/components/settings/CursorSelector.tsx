import {
  CURSOR_OPTIONS,
  useCursorPreference,
} from '../../lib/cursorPreference'

/**
 * Sélecteur du curseur de l'application : permet de revenir au curseur
 * normal ou de garder le curseur personnalisé « gant de cuisine ». Le choix
 * est enregistré localement et appliqué immédiatement.
 */
export default function CursorSelector() {
  const { cursor, setCursor } = useCursorPreference()

  return (
    <section
      aria-labelledby="cursor-selector-title"
      className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100"
    >
      <div className="mb-5">
        <p className="font-bold text-orange-700">Apparence</p>

        <h2
          id="cursor-selector-title"
          className="mt-1 text-2xl font-black text-stone-950"
        >
          Curseur de la souris
        </h2>

        <p className="mt-2 text-stone-600">
          Gardez le curseur « gant de cuisine » ou revenez au curseur normal.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Choix du curseur"
        className="grid gap-4 sm:grid-cols-2"
      >
        {CURSOR_OPTIONS.map((option) => {
          const selected = cursor === option.id

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setCursor(option.id)}
              className={`flex items-center gap-4 rounded-[1.5rem] border p-4 text-left transition ${
                selected
                  ? 'border-orange-300 bg-orange-50 ring-2 ring-orange-200'
                  : 'border-orange-100 bg-[#fffaf5] hover:border-orange-200 hover:bg-orange-50'
              }`}
            >
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-orange-100"
              >
                {option.preview}
              </span>

              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-black text-stone-950">
                    {option.label}
                  </span>

                  {selected && (
                    <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs font-bold text-white">
                      Actif
                    </span>
                  )}
                </span>

                <span className="mt-1 block text-sm text-stone-600">
                  {option.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
