import SectionHeader from './SectionHeader'

const PAIN_POINTS = [
  {
    emoji: '😤',
    title: 'Des recettes éparpillées',
    description:
      "Entre les captures d'écran, les Post-it et les liens envoyés à soi-même, impossible de retrouver ce bon petit plat.",
  },
  {
    emoji: '🛒',
    title: 'Des courses mal organisées',
    description:
      "On arrive au magasin et il manque toujours l'ingrédient clé de la recette du soir.",
  },
  {
    emoji: '🤔',
    title: 'La question du soir',
    description:
      "« Qu'est-ce qu'on mange ? » revient chaque jour, et l'inspiration n'est pas toujours au rendez-vous.",
  },
  {
    emoji: '🗑️',
    title: 'Du gaspillage alimentaire',
    description:
      'Des légumes oubliés au fond du frigo finissent à la poubelle, faute de planification.',
  },
]

export default function ProblemSolution() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <SectionHeader
        centered
        eyebrow="Vous vous reconnaissez ?"
        title="La cuisine du quotidien mérite mieux"
        subtitle="Ces petits tracas du quotidien, Carnet de recettes les résout en douceur."
      />

      <div className="mt-9 grid gap-4 sm:grid-cols-2 sm:gap-5">
        {PAIN_POINTS.map((point) => (
          <div
            key={point.title}
            className="flex gap-4 rounded-card bg-card p-5 shadow-soft ring-1 ring-bark"
          >
            <span className="mt-0.5 shrink-0 text-3xl">{point.emoji}</span>
            <div>
              <h3 className="font-display text-base font-bold text-espresso">
                {point.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-cacao/80">
                {point.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-card bg-terracotta-soft p-6 ring-1 ring-terracotta/20">
        <p className="font-display text-xl font-bold text-terracotta-deep">
          ✨ Un seul carnet pour tout réunir.
        </p>
        <p className="mt-2 max-w-3xl leading-7 text-cacao/80">
          Vos recettes, vos courses, votre planning et vos idées au même
          endroit. Simple, chaleureux et toujours prêt quand vous cuisinez —
          comme un vrai carnet de famille, en mieux.
        </p>
      </div>
    </section>
  )
}
