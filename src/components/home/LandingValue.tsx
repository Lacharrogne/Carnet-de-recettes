import {
  BookOpen,
  CalendarDays,
  Heart,
  Lightbulb,
  Refrigerator,
  ShoppingCart,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import Button from '../ui/Button'
import IconTile, { type IconTileTone } from '../ui/IconTile'
import SectionHeader from '../ui/SectionHeader'

type Benefit = {
  icon: typeof BookOpen
  tone: IconTileTone
  title: string
  description: string
}

const BENEFITS: Benefit[] = [
  {
    icon: BookOpen,
    tone: 'terracotta',
    title: 'Toutes tes recettes au même endroit',
    description:
      'Ajoute les plats de la maison, retrouve-les en un instant et garde la main même sans réseau dans la cuisine.',
  },
  {
    icon: ShoppingCart,
    tone: 'sage',
    title: 'Une liste de courses qui se remplit seule',
    description:
      'Les ingrédients d’une recette filent dans ta liste, regroupés par rayon, prêts pour le marché.',
  },
  {
    icon: CalendarDays,
    tone: 'honey',
    title: 'Un planning de la semaine sans prise de tête',
    description:
      'Glisse tes repas sur la semaine et sache toujours quoi préparer ce soir.',
  },
  {
    icon: Refrigerator,
    tone: 'sage',
    title: 'Cuisine avec ce que tu as déjà',
    description:
      'Dis ce qu’il reste dans le frigo, le carnet te propose les recettes possibles. Anti-gaspi.',
  },
  {
    icon: Heart,
    tone: 'terracotta',
    title: 'Tes favoris toujours sous la main',
    description:
      'Mets de côté les recettes que la famille réclame et reviens-y en un geste.',
  },
  {
    icon: Lightbulb,
    tone: 'honey',
    title: 'Ne manque jamais d’inspiration',
    description:
      'Un bouton « Inspire-moi » et un fil d’idées pour les soirs où l’on ne sait pas quoi faire.',
  },
]

const STEPS = [
  {
    number: '1',
    title: 'Crée ton carnet',
    description: 'Inscris-toi en quelques secondes et ajoute tes premières recettes.',
  },
  {
    number: '2',
    title: 'Planifie & fais tes courses',
    description: 'Organise la semaine et laisse la liste de courses se construire toute seule.',
  },
  {
    number: '3',
    title: 'Cuisine sereinement',
    description: 'Suis les étapes, ajuste les portions, et régale la maisonnée.',
  },
]

// Bloc « proposition de valeur » réservé au visiteur déconnecté :
// bénéfices concrets, fonctionnement en 3 étapes, puis appel à l'inscription.
export default function LandingValue() {
  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Bénéfices */}
      <div className="rounded-[2rem] bg-card/95 p-5 shadow-card ring-1 ring-bark sm:rounded-[2.5rem] sm:p-8 md:p-10">
        <SectionHeader
          className="mb-7 sm:mb-9"
          eyebrowClassName="text-terracotta"
          eyebrow="Pourquoi Carnet de recettes"
          title="Tout ce qu’il faut pour la cuisine de tous les jours"
          subtitle="Pensé comme un vrai carnet de famille : chaleureux, simple, et toujours prêt quand tu cuisines."
        />

        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon

            return (
              <div
                key={benefit.title}
                className="flex flex-col gap-3 rounded-card bg-paper p-5 ring-1 ring-bark transition duration-300 hover:-translate-y-1 hover:shadow-card sm:p-6"
              >
                <IconTile tone={benefit.tone} size="md">
                  <Icon className="h-5 w-5 text-espresso" />
                </IconTile>

                <h3 className="font-display text-lg font-bold leading-snug text-espresso">
                  {benefit.title}
                </h3>

                <p className="text-sm leading-6 text-cacao/80">
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Comment ça marche */}
      <div className="rounded-[2rem] bg-card/95 p-5 shadow-card ring-1 ring-bark sm:rounded-[2.5rem] sm:p-8 md:p-10">
        <SectionHeader
          className="mb-7 sm:mb-9"
          eyebrowClassName="text-sage-deep"
          eyebrow="En trois temps"
          title="Comment ça marche"
        />

        <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="relative rounded-card bg-paper p-5 ring-1 ring-bark sm:p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-terracotta font-display text-xl font-black text-white shadow-soft">
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

      {/* Appel à l'inscription */}
      <div className="relative overflow-hidden rounded-[2rem] bg-espresso px-6 py-10 text-center shadow-lift sm:rounded-[2.5rem] sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-terracotta/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-honey/20 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-cream-100">
            <Sparkles className="h-4 w-4" />
            Gratuit · sans engagement
          </span>

          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-black leading-tight text-white sm:text-4xl">
            Commence ton carnet de cuisine aujourd’hui
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-cream-100/85">
            Rejoins le carnet et garde enfin toutes tes recettes, tes courses et
            tes idées de repas réunies au même endroit.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button to="/auth" size="lg" className="w-full sm:w-auto">
              Créer mon carnet
            </Button>

            <Button
              to="/recipes"
              variant="ghost"
              size="lg"
              className="w-full text-cream-100 hover:bg-white/10 sm:w-auto"
            >
              Explorer les recettes
            </Button>
          </div>

          <Link
            to="/pricing"
            className="mt-6 inline-block text-sm font-bold text-cream-100/80 underline-offset-4 transition hover:text-white hover:underline"
          >
            Voir le détail des offres →
          </Link>
        </div>
      </div>
    </div>
  )
}
