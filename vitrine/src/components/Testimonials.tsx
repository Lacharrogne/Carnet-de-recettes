import { Quote, Star } from 'lucide-react'

import SectionHeader from './SectionHeader'

/**
 * ⚠️ Témoignages d'exemple, à remplacer par de vrais avis.
 *    Garde la même structure pour ajouter/retirer des cartes.
 */
const TESTIMONIALS = [
  {
    name: 'Sophie M.',
    role: 'Maman de 3 enfants',
    quote:
      "Je ne cherche plus mes recettes partout. Tout est réuni, organisé, et la liste de courses se remplit toute seule. Un vrai gain de temps chaque semaine.",
    initial: 'S',
    color: 'bg-terracotta text-white',
  },
  {
    name: 'Marc D.',
    role: 'Passionné de cuisine',
    quote:
      "Le mode frigo est génial : je rentre ce que j'ai et le carnet me propose des recettes adaptées. Fini les légumes oubliés.",
    initial: 'M',
    color: 'bg-honey text-espresso',
  },
  {
    name: 'Julie T.',
    role: 'Cuisinière du quotidien',
    quote:
      "L'interface est douce et claire, on s'y retrouve tout de suite. J'ai enfin un endroit où garder toutes mes recettes de famille.",
    initial: 'J',
    color: 'bg-sage-deep text-white',
  },
]

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <SectionHeader
        centered
        eyebrowClassName="text-honey"
        eyebrow="Ils cuisinent avec le carnet"
        title="Ce qu'en disent nos utilisateurs"
      />

      <div className="mt-9 grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="flex flex-col gap-4 rounded-card bg-card p-6 shadow-soft ring-1 ring-bark"
          >
            <Quote className="h-5 w-5 text-bark" />

            <p className="flex-1 text-sm italic leading-6 text-cacao/80">
              &laquo;&nbsp;{t.quote}&nbsp;&raquo;
            </p>

            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-black ${t.color}`}
              >
                {t.initial}
              </div>

              <div>
                <p className="font-bold text-espresso">{t.name}</p>
                <p className="text-xs text-hazel">{t.role}</p>
              </div>

              <div className="ml-auto flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-honey text-honey" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
