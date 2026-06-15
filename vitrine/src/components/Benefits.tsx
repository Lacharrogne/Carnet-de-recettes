import { Clock, Leaf, Smile, Wallet } from 'lucide-react'

const BENEFITS = [
  {
    icon: Clock,
    title: 'Gagnez du temps',
    description:
      'Plus de recherche dans dix applications. Tout est réuni, prêt à l’emploi, en quelques secondes.',
  },
  {
    icon: Leaf,
    title: 'Moins de gaspillage',
    description:
      'Cuisinez avec ce que vous avez déjà et planifiez juste : votre frigo ne déborde plus.',
  },
  {
    icon: Wallet,
    title: 'Des courses maîtrisées',
    description:
      'Une liste claire et complète évite les achats en double et les allers-retours au magasin.',
  },
  {
    icon: Smile,
    title: 'Le plaisir de cuisiner',
    description:
      'Une cuisine mieux organisée, c’est plus de sérénité et plus d’envie de se mettre aux fourneaux.',
  },
]

export default function Benefits() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-espresso px-6 py-10 shadow-lift sm:rounded-[2.5rem] sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-terracotta/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-honey/15 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-honey">
              Les bénéfices au quotidien
            </p>
            <h2 className="mt-2 max-w-2xl font-display text-3xl font-black leading-tight text-white sm:text-4xl">
              Plus qu’une appli, une cuisine plus simple
            </h2>

            <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map((benefit) => {
                const Icon = benefit.icon

                return (
                  <div key={benefit.title}>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                      <Icon className="h-5 w-5 text-honey" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-bold text-white">
                      {benefit.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-cream-100/80">
                      {benefit.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
