import { useNutritionPreference } from '../../lib/nutritionPreference'

type Option = {
  value: boolean
  label: string
  description: string
  preview: string
}

const OPTIONS: Option[] = [
  {
    value: false,
    label: 'Visible',
    description: 'Affiche les calories, macros et coût par portion.',
    preview: '📊',
  },
  {
    value: true,
    label: 'Masquée (floutée)',
    description:
      'La carte reste floutée. Vous pourrez toujours l’afficher au cas par cas.',
    preview: '🫥',
  },
]

/**
 * Préférence de confort : afficher ou flouter la carte « Nutrition & coût »
 * des recettes. Enregistrée localement, appliquée immédiatement.
 */
export default function NutritionPreference() {
  const { blurNutrition, setBlur } = useNutritionPreference()

  return (
    <section
      aria-labelledby="nutrition-preference-title"
      className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-bark"
    >
      <div className="mb-5">
        <p className="font-bold text-orange-700">Confort</p>

        <h2
          id="nutrition-preference-title"
          className="mt-1 text-2xl font-black text-stone-950"
        >
          Infos nutritionnelles
        </h2>

        <p className="mt-2 text-stone-600">
          Vous préférez ne pas voir les calories ? Choisissez de flouter la
          carte « Nutrition &amp; coût » des recettes.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Affichage des infos nutritionnelles"
        className="grid gap-4 sm:grid-cols-2"
      >
        {OPTIONS.map((option) => {
          const selected = blurNutrition === option.value

          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setBlur(option.value)}
              className={`flex items-center gap-4 rounded-[1.5rem] border p-4 text-left transition ${
                selected
                  ? 'border-orange-300 bg-orange-50 ring-2 ring-orange-200'
                  : 'border-bark bg-[#fffaf5] hover:border-bark hover:bg-orange-50'
              }`}
            >
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-bark"
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
