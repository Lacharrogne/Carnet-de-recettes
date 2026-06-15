import SectionHeader from './SectionHeader'

const STEPS = [
  {
    number: '1',
    title: 'Créez votre carnet',
    description:
      'Inscrivez-vous en quelques secondes et ajoutez vos premières recettes de famille.',
  },
  {
    number: '2',
    title: 'Planifiez & faites vos courses',
    description:
      'Organisez la semaine et laissez la liste de courses se construire toute seule.',
  },
  {
    number: '3',
    title: 'Cuisinez sereinement',
    description:
      'Suivez les étapes, ajustez les portions et régalez toute la maisonnée.',
  },
]

export default function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <SectionHeader
          centered
          eyebrowClassName="text-sage-deep"
          eyebrow="En trois temps"
          title="Comment ça marche"
        />

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="relative rounded-card bg-card p-6 shadow-soft ring-1 ring-bark"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta font-display text-xl font-black text-white shadow-soft">
                {step.number}
              </span>

              <h3 className="mt-4 font-display text-lg font-bold text-espresso">
                {step.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-cacao/80">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
