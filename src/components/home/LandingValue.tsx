import { useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Heart,
  Lightbulb,
  Quote,
  Refrigerator,
  ShoppingCart,
  Sparkles,
  Star,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import Button from '../ui/Button'
import IconTile, { type IconTileTone } from '../ui/IconTile'
import SectionHeader from '../ui/SectionHeader'

// ─── Problèmes ────────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  {
    emoji: '😤',
    title: 'Vos recettes sont éparpillées',
    description:
      "Entre les Post-it, les photos sur le téléphone et les messages envoyés à vous-même…",
  },
  {
    emoji: '🛒',
    title: 'La liste de courses est toujours incomplète',
    description:
      "Vous arrivez au supermarché et il manque toujours un ingrédient clé.",
  },
  {
    emoji: '🤔',
    title: 'Vous ne savez plus quoi cuisiner',
    description:
      "Le soir venu, la question « qu’est-ce qu’on mange ? » revient inlassablement.",
  },
  {
    emoji: '🗑️',
    title: 'Du gaspillage alimentaire',
    description:
      "Des légumes frais finissent à la poubelle faute de planification.",
  },
]

// ─── Fonctionnalités ──────────────────────────────────────────────────────────

type Feature = {
  icon: typeof BookOpen
  tone: IconTileTone
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: BookOpen,
    tone: 'terracotta',
    title: 'Toutes vos recettes au même endroit',
    description:
      "Ajoutez vos plats préférés, retrouvez-les en un instant et gardez la main même sans réseau.",
  },
  {
    icon: ShoppingCart,
    tone: 'sage',
    title: 'Liste de courses automatique',
    description:
      "Les ingrédients d’une recette filent directement dans votre liste, regroupés par rayon.",
  },
  {
    icon: CalendarDays,
    tone: 'honey',
    title: 'Planning de la semaine',
    description:
      "Glissez vos repas sur la semaine et sachez toujours quoi préparer ce soir.",
  },
  {
    icon: Refrigerator,
    tone: 'sage',
    title: 'Mode frigo & anti-gaspi',
    description:
      "Indiquez ce qu’il reste dans votre frigo, le carnet propose les recettes possibles.",
  },
  {
    icon: Heart,
    tone: 'terracotta',
    title: 'Favoris et collections',
    description:
      "Mettez de côté les recettes que la famille réclame et retrouvez-les en un geste.",
  },
  {
    icon: Lightbulb,
    tone: 'honey',
    title: 'Inspiration repas',
    description:
      "Un bouton « Inspire-moi » pour les soirs où l’on ne sait vraiment pas quoi cuisiner.",
  },
]

// ─── Étapes ───────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '1',
    title: 'Créez votre carnet',
    description:
      "Inscrivez-vous en quelques secondes et ajoutez vos premières recettes.",
  },
  {
    number: '2',
    title: 'Planifiez & faites vos courses',
    description:
      "Organisez la semaine et laissez la liste de courses se construire toute seule.",
  },
  {
    number: '3',
    title: 'Cuisinez sereinement',
    description:
      "Suivez les étapes, ajustez les portions et régalez la maisonnée.",
  },
]

// ─── Témoignages (placeholder — à remplacer par de vrais avis) ───────────────

const TESTIMONIALS = [
  {
    name: 'Sophie M.',
    role: 'Maman de 3 enfants',
    quote:
      "Je ne cherche plus mes recettes dans dix applications différentes. Tout est là, organisé, et la liste de courses se remplit toute seule. Un vrai gain de temps.",
    initial: 'S',
    color: 'bg-terracotta text-white',
  },
  {
    name: 'Marc D.',
    role: 'Passionné de cuisine',
    quote:
      "Le mode frigo est génial. Je rentre ce que j’ai dans le réfrigérateur et le carnet me propose des recettes adaptées. Fini le gaspillage.",
    initial: 'M',
    color: 'bg-honey text-espresso',
  },
  {
    name: 'Julie T.',
    role: 'Cuisinière du quotidien',
    quote:
      "L’interface est très agréable et on s’y retrouve facilement. J’ai enfin un endroit où garder toutes mes recettes de famille.",
    initial: 'J',
    color: 'bg-sage-deep text-white',
  },
]

// ─── Tarifs ───────────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  'Recettes illimitées',
  'Liste de courses',
  'Planning de repas',
  'Mode frigo & anti-gaspi',
  'Favoris et collections',
]

const PREMIUM_FEATURES = [
  'Tout le plan Gratuit',
  'Carnet partagé en famille',
  'Synchronisation multi-appareils',
  'Export & impression PDF soignés',
  'Sauvegarde automatique',
  'Support prioritaire',
]

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: 'À quoi sert Carnet de recettes ?',
    answer:
      "Carnet de recettes est une application web qui centralise vos recettes de cuisine, génère vos listes de courses automatiquement, vous aide à planifier vos repas de la semaine et à cuisiner avec ce que vous avez déjà dans votre frigo.",
  },
  {
    question: 'Est-ce adapté à une famille ?',
    answer:
      "Absolument. Carnet de recettes est pensé pour la cuisine du quotidien en famille. L’offre Premium permet même de partager un carnet entre plusieurs membres de la famille.",
  },
  {
    question: 'Puis-je ajouter mes propres recettes ?',
    answer:
      "Oui, c’est même l’une des fonctionnalités principales. Vous pouvez ajouter autant de recettes que vous voulez : ingrédients, étapes, photos, notes personnelles, tout y est.",
  },
  {
    question: 'La liste de courses est-elle automatique ?',
    answer:
      "Oui. Quand vous planifiez un repas, les ingrédients de la recette s’ajoutent automatiquement à votre liste, regroupés par rayon pour faciliter les courses.",
  },
  {
    question: 'Puis-je annuler mon abonnement ?',
    answer:
      "Oui, à tout moment et sans engagement. L’abonnement Premium est mensuel et résiliable sans frais ni délai de préavis.",
  },
  {
    question: 'Mes données sont-elles privées ?',
    answer:
      "Vos recettes et vos données restent privées et accessibles uniquement à vous. Aucune donnée n’est revendue à des tiers.",
  },
  {
    question: 'Est-ce utilisable sur mobile ?',
    answer:
      "Oui, Carnet de recettes est entièrement responsive et fonctionne sur smartphone, tablette et ordinateur, directement depuis votre navigateur web.",
  },
  {
    question: 'De nouvelles fonctionnalités seront-elles ajoutées ?',
    answer:
      "Oui, régulièrement. Le carnet évolue en fonction des retours utilisateurs. L’offre Premium inclut d’emblée toutes les futures fonctionnalités sans coût supplémentaire.",
  },
]

// ─── Composant principal ──────────────────────────────────────────────────────

export default function LandingValue() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* ── Problèmes ── */}
      <div className="rounded-[2rem] bg-card/95 p-5 shadow-card ring-1 ring-bark sm:rounded-[2.5rem] sm:p-8 md:p-10">
        <SectionHeader
          className="mb-7 sm:mb-9"
          eyebrowClassName="text-terracotta"
          eyebrow="Vous vous reconnaissez ?"
          title="La cuisine du quotidien mérite mieux"
          subtitle="Ces petits problèmes du quotidien, Carnet de recettes les résout tous."
        />

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          {PAIN_POINTS.map((point) => (
            <div
              key={point.title}
              className="flex gap-4 rounded-card bg-paper p-5 ring-1 ring-bark"
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

        <div className="mt-6 rounded-card bg-terracotta-soft p-5 ring-1 ring-terracotta/20 sm:mt-7">
          <p className="font-display text-lg font-bold text-terracotta-deep sm:text-xl">
            ✨ Carnet de recettes résout tout ça.
          </p>
          <p className="mt-2 text-sm leading-6 text-cacao/80">
            Un seul endroit pour vos recettes, vos courses, votre planning et
            vos idées. Simple, chaleureux et pensé pour la cuisine de tous les
            jours.
          </p>
        </div>
      </div>

      {/* ── Fonctionnalités ── */}
      <div className="rounded-[2rem] bg-card/95 p-5 shadow-card ring-1 ring-bark sm:rounded-[2.5rem] sm:p-8 md:p-10">
        <SectionHeader
          className="mb-7 sm:mb-9"
          eyebrowClassName="text-terracotta"
          eyebrow="Fonctionnalités"
          title="Tout ce qu'il faut pour la cuisine de tous les jours"
          subtitle="Pensé comme un vrai carnet de famille : chaleureux, simple et toujours prêt quand vous cuisinez."
        />

        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon

            return (
              <div
                key={feature.title}
                className="flex flex-col gap-3 rounded-card bg-paper p-5 ring-1 ring-bark transition duration-300 hover:-translate-y-1 hover:shadow-card sm:p-6"
              >
                <IconTile tone={feature.tone} size="md">
                  <Icon className="h-5 w-5 text-espresso" />
                </IconTile>

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

      {/* ── Comment ça marche ── */}
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

      {/* ── Témoignages ── */}
      <div className="rounded-[2rem] bg-card/95 p-5 shadow-card ring-1 ring-bark sm:rounded-[2.5rem] sm:p-8 md:p-10">
        <SectionHeader
          className="mb-7 sm:mb-9"
          eyebrowClassName="text-honey"
          eyebrow="Ils cuisinent avec le carnet"
          title="Ce qu'en disent nos utilisateurs"
        />

        <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col gap-4 rounded-card bg-paper p-5 ring-1 ring-bark sm:p-6"
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
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-honey text-honey"
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tarifs (teaser) ── */}
      <div className="rounded-[2rem] bg-card/95 p-5 shadow-card ring-1 ring-bark sm:rounded-[2.5rem] sm:p-8 md:p-10">
        <SectionHeader
          className="mb-7 sm:mb-9"
          eyebrowClassName="text-terracotta"
          eyebrow="Offres & tarifs"
          title="Commencez gratuitement"
          subtitle="Un carnet gratuit pour toujours. Passez à Premium quand vous voulez cuisiner en famille."
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Gratuit */}
          <div className="flex flex-col rounded-[1.75rem] bg-paper p-6 ring-1 ring-bark">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-soft text-xl">
                🌱
              </span>
              <div>
                <p className="font-display font-bold text-espresso">Gratuit</p>
                <p className="text-xs text-hazel">Pour démarrer</p>
              </div>
            </div>

            <p className="mt-4 font-display text-4xl font-black text-espresso">
              0 €
              <span className="ml-2 text-base font-semibold text-hazel">
                / pour toujours
              </span>
            </p>

            <ul className="mt-5 flex-1 space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2.5 text-sm text-cacao"
                >
                  <Check className="h-4 w-4 shrink-0 text-sage-deep" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button to="/auth" variant="secondary" size="lg" fullWidth>
                Commencer gratuitement
              </Button>
            </div>
          </div>

          {/* Premium */}
          <div className="relative flex flex-col overflow-hidden rounded-[1.75rem] bg-espresso p-6 text-white ring-1 ring-espresso">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-terracotta/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-honey/15 blur-3xl" />

            <div className="relative flex flex-1 flex-col">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-xl">
                    🧡
                  </span>
                  <div>
                    <p className="font-display font-bold text-white">
                      Famille Premium
                    </p>
                    <p className="text-xs text-cream-100/70">
                      Pour cuisiner à plusieurs
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-honey px-2.5 py-1 text-xs font-black text-espresso">
                  <Sparkles className="h-3 w-3" />
                  Populaire
                </span>
              </div>

              <p className="mt-4 font-display text-4xl font-black text-white">
                3,99 €
                <span className="ml-2 text-base font-semibold text-cream-100/70">
                  / mois
                </span>
              </p>

              <ul className="mt-5 flex-1 space-y-2.5">
                {PREMIUM_FEATURES.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 text-sm text-cream-100"
                  >
                    <Check className="h-4 w-4 shrink-0 text-honey" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-full bg-honey/40 px-7 py-4 text-center font-bold text-white/50"
                >
                  Bientôt disponible
                </button>
                <p className="mt-3 text-center text-xs text-cream-100/50">
                  Paiement bientôt disponible · sans engagement
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Réassurance */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
          {[
            '🔒 Paiement sécurisé',
            '↩️ Sans engagement',
            '🔐 Données privées',
          ].map((item) => (
            <span key={item} className="text-sm font-semibold text-hazel">
              {item}
            </span>
          ))}
        </div>

        <div className="mt-5 text-center">
          <Link
            to="/pricing"
            className="text-sm font-bold text-terracotta underline-offset-4 hover:underline"
          >
            Voir tous les détails de l&rsquo;offre &rarr;
          </Link>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="rounded-[2rem] bg-card/95 p-5 shadow-card ring-1 ring-bark sm:rounded-[2.5rem] sm:p-8 md:p-10">
        <SectionHeader
          className="mb-7 sm:mb-9"
          eyebrowClassName="text-terracotta"
          eyebrow="Questions fréquentes"
          title="Tout ce que vous voulez savoir"
        />

        <div className="divide-y divide-bark">
          {FAQ_ITEMS.map((item, index) => (
            <div key={index}>
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-terracotta/40"
                aria-expanded={openFaq === index}
              >
                <span className="font-display font-bold text-espresso">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-hazel transition-transform duration-200 ${
                    openFaq === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openFaq === index && (
                <p className="pb-4 text-sm leading-6 text-cacao/80">
                  {item.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Appel à l'inscription ── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-espresso px-6 py-10 text-center shadow-lift sm:rounded-[2.5rem] sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-terracotta/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-honey/20 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-cream-100">
            <Sparkles className="h-4 w-4" />
            Gratuit · sans engagement
          </span>

          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-black leading-tight text-white sm:text-4xl">
            Commencez votre carnet de cuisine aujourd&rsquo;hui
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-cream-100/85">
            Rejoignez le carnet et gardez enfin toutes vos recettes, vos
            courses et vos idées de repas réunies au même endroit.
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
            Voir le détail des offres &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
