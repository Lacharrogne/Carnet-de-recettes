import {
  BookOpen,
  CalendarDays,
  Heart,
  Lightbulb,
  Refrigerator,
  Search,
  ShoppingCart,
  Sparkles,
  Users,
} from 'lucide-react'

import SectionHeader from './SectionHeader'

type Tone = 'terracotta' | 'honey' | 'sage'

const TONE_BG: Record<Tone, string> = {
  terracotta: 'bg-terracotta-soft',
  honey: 'bg-honey-soft',
  sage: 'bg-sage-soft',
}

type Feature = {
  icon: typeof BookOpen
  tone: Tone
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: BookOpen,
    tone: 'terracotta',
    title: 'Toutes vos recettes réunies',
    description:
      'Ajoutez vos plats préférés avec ingrédients, étapes et photos. Retrouvez-les en un instant, organisés par catégories.',
  },
  {
    icon: ShoppingCart,
    tone: 'sage',
    title: 'Liste de courses intelligente',
    description:
      "Les ingrédients d'une recette filent directement dans votre liste, regroupés par rayon pour des courses sans oubli.",
  },
  {
    icon: CalendarDays,
    tone: 'honey',
    title: 'Planning de la semaine',
    description:
      'Glissez vos repas sur la semaine et sachez toujours quoi préparer ce soir, sans y penser à la dernière minute.',
  },
  {
    icon: Refrigerator,
    tone: 'sage',
    title: 'Mode frigo & anti-gaspi',
    description:
      "Indiquez ce qu'il reste dans votre frigo : le carnet vous propose les recettes possibles. Fini le gaspillage.",
  },
  {
    icon: Lightbulb,
    tone: 'honey',
    title: 'Idées repas',
    description:
      "Un bouton « Inspire-moi » et un fil d'idées pour les soirs où l'on ne sait vraiment pas quoi cuisiner.",
  },
  {
    icon: Sparkles,
    tone: 'terracotta',
    title: 'Adaptation des portions',
    description:
      'Cuisinez pour 2 ou pour 8 : les quantités se recalculent automatiquement selon le nombre de convives.',
  },
  {
    icon: Heart,
    tone: 'terracotta',
    title: 'Favoris & collections',
    description:
      'Mettez de côté les recettes que la famille réclame et retrouvez-les en un seul geste.',
  },
  {
    icon: Search,
    tone: 'sage',
    title: 'Recherche rapide',
    description:
      'Une recherche claire pour filtrer par nom, catégorie ou ingrédient et tomber pile sur la bonne recette.',
  },
  {
    icon: Users,
    tone: 'honey',
    title: 'Carnet partagé en famille',
    description:
      'Avec Premium, partagez un même carnet entre plusieurs membres de la famille et cuisinez à plusieurs.',
  },
]

export default function Features() {
  return (
    <section id="fonctionnalites" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <SectionHeader
          centered
          eyebrow="Fonctionnalités"
          title="Tout ce qu'il faut pour cuisiner sereinement"
          subtitle="Pensé comme un vrai carnet de famille : chaleureux, simple et toujours prêt quand vous cuisinez."
        />

        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon

            return (
              <div
                key={feature.title}
                className="flex flex-col gap-3 rounded-card bg-card p-6 shadow-soft ring-1 ring-bark transition duration-300 hover:-translate-y-1 hover:shadow-card"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${TONE_BG[feature.tone]}`}
                >
                  <Icon className="h-5 w-5 text-espresso" />
                </span>

                <h3 className="font-display text-lg font-bold leading-snug text-espresso">
                  {feature.title}
                </h3>

                <p className="text-sm leading-6 text-cacao/80">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
