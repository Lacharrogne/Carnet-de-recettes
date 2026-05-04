import { Link } from 'react-router-dom'

const tools = [
  {
    label: 'Mode frigo',
    description:
      'Trouve une recette à partir des ingrédients que tu as déjà chez toi.',
    to: '/frigo',
    emoji: '🥕',
    buttonLabel: 'Ouvrir le mode frigo',
  },
  {
    label: 'Liste de courses',
    description:
      'Regroupe automatiquement les ingrédients des recettes et du planning.',
    to: '/shopping-list',
    emoji: '🛒',
    buttonLabel: 'Voir ma liste',
  },
  {
    label: 'Planning',
    description:
      'Organise tes repas de la semaine et prépare tes courses plus facilement.',
    to: '/planning',
    emoji: '📅',
    buttonLabel: 'Planifier mes repas',
  },
  {
    label: 'Boîte à idées',
    description:
      'Propose une amélioration, une idée de fonctionnalité ou un retour sur le site.',
    to: '/ideas',
    emoji: '💡',
    buttonLabel: 'Donner une idée',
  },
]

export default function ToolsPage() {
  return (
    <section className="space-y-10">
      <div className="rounded-[2.5rem] bg-[#fffaf3] p-8 shadow-sm ring-1 ring-orange-100">
        <div className="mb-6 flex w-fit items-center gap-3 rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-orange-700">
          <span>🧰</span>
          <span>Outils du carnet</span>
        </div>

        <h1 className="max-w-4xl text-4xl font-black leading-tight text-stone-950 md:text-6xl">
          Tous les outils pour mieux cuisiner au quotidien.
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
          Retrouve ici les fonctions pratiques du carnet : trouver une recette
          avec ce que tu as, préparer tes courses, organiser la semaine et
          proposer tes idées.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className="group rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] bg-orange-50 text-5xl transition group-hover:scale-105">
                {tool.emoji}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-3xl font-black text-stone-950">
                  {tool.label}
                </h2>

                <p className="mt-3 leading-7 text-stone-600">
                  {tool.description}
                </p>

                <span className="mt-6 inline-flex rounded-full bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-sm transition group-hover:bg-orange-600">
                  {tool.buttonLabel}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}