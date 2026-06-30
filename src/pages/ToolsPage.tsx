import { Link } from 'react-router-dom'

type ToolCard = {
  label: string
  subtitle: string
  description: string
  to: string
  emoji: string
  buttonLabel: string
  badge: string
  cardBg: string
  iconBg: string
  badgeBg: string
  badgeText: string
  accentText: string
  glow: string
  points: string[]
}

const tools: ToolCard[] = [
  {
    label: 'Mode frigo',
    subtitle: 'Cuisiner avec ce que vous avez déjà',
    description:
      'Indiquez les ingrédients disponibles chez vous et le carnet vous propose les recettes les plus adaptées.',
    to: '/frigo',
    emoji: '🥕',
    buttonLabel: 'Ouvrir le mode frigo',
    badge: 'Anti-gaspi',
    cardBg: 'bg-gradient-to-br from-[#f2fbef] via-white to-[#fff4ea]',
    iconBg: 'bg-[#e8f7df]',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-800',
    accentText: 'text-green-700',
    glow: 'bg-green-200/60',
    points: [
      'Recettes selon votre frigo',
      'Ingrédients manquants visibles',
      'Priorité anti-gaspillage',
    ],
  },
  {
    label: 'Liste de courses',
    subtitle: 'Ne plus rien oublier',
    description:
      'Les ingrédients ajoutés depuis les recettes et le planning se regroupent automatiquement par rayon.',
    to: '/shopping-list',
    emoji: '🛒',
    buttonLabel: 'Voir ma liste',
    badge: 'Pratique',
    cardBg: 'bg-gradient-to-br from-[#fff8f0] via-white to-[#fff2df]',
    iconBg: 'bg-cream-200',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    accentText: 'text-orange-700',
    glow: 'bg-orange-200/60',
    points: [
      'Ingrédients fusionnés',
      'Classement par rayon',
      'Version imprimable',
    ],
  },
  {
    label: 'Planning',
    subtitle: 'Organiser les repas de la semaine',
    description:
      'Prévoyez les déjeuners et les dîners de la semaine pour mieux anticiper les courses.',
    to: '/planning',
    emoji: '📅',
    buttonLabel: 'Planifier mes repas',
    badge: 'Organisation',
    cardBg: 'bg-gradient-to-br from-[#eef7ff] via-white to-[#fff8eb]',
    iconBg: 'bg-[#e8f4ff]',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    accentText: 'text-blue-700',
    glow: 'bg-blue-200/60',
    points: [
      'Planning hebdomadaire',
      'Déjeuner et dîner',
      'Ajout aux courses',
    ],
  },
  {
    label: 'Boîte à idées',
    subtitle: 'Faire évoluer le carnet',
    description:
      'Proposez une amélioration, une nouvelle fonctionnalité ou un retour pour rendre le site encore plus utile.',
    to: '/ideas',
    emoji: '💡',
    buttonLabel: 'Donner une idée',
    badge: 'Évolution',
    cardBg: 'bg-gradient-to-br from-[#fff9df] via-white to-[#fff2f6]',
    iconBg: 'bg-[#fff4c7]',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-800',
    accentText: 'text-yellow-700',
    glow: 'bg-yellow-200/60',
    points: [
      'Proposer une idée',
      'Améliorer le site',
      'Préparer les futures fonctions',
    ],
  },
]

export default function ToolsPage() {
  return (
    <section className="space-y-10">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-cream-50 p-8 shadow-sm ring-1 ring-orange-100 md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-100/80 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-amber-100/80 blur-3xl" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-center">
          <div>
            <div className="mb-6 flex w-fit items-center gap-3 rounded-full bg-cream-300 px-4 py-2 text-sm font-bold text-orange-700">
              <span>🧰</span>
              <span>Outils du carnet</span>
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-tight text-stone-950 md:text-6xl">
              Tous les outils pour mieux cuisiner au quotidien.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              Retrouvez ici les fonctions pratiques du carnet : trouver une
              recette avec ce que vous avez, préparer vos courses, organiser la
              semaine et proposer vos idées.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/frigo"
                className="rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md"
              >
                Commencer avec le frigo
              </Link>

              <Link
                to="/shopping-list"
                className="rounded-full border border-orange-200 bg-card px-6 py-3 font-black text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-50"
              >
                Voir les courses
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-card/85 p-5 shadow-sm ring-1 ring-orange-100 backdrop-blur">
            <p className="text-sm font-black uppercase tracking-wide text-orange-600">
              Le carnet intelligent
            </p>

            <h2 className="mt-2 text-2xl font-black text-stone-950">
              Un espace pour gagner du temps.
            </h2>

            <div className="mt-5 grid gap-3">
              <div className="rounded-[1.5rem] bg-cream-50 p-4 ring-1 ring-orange-100">
                <p className="text-2xl">🥕</p>
                <p className="mt-2 font-black text-stone-950">
                  Vous partez de ce que vous avez déjà.
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-cream-50 p-4 ring-1 ring-orange-100">
                <p className="text-2xl">🛒</p>
                <p className="mt-2 font-black text-stone-950">
                  Les courses se préparent toutes seules.
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-cream-50 p-4 ring-1 ring-orange-100">
                <p className="text-2xl">📅</p>
                <p className="mt-2 font-black text-stone-950">
                  Vous organisez vos repas sans prise de tête.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className={`group relative overflow-hidden rounded-[2.5rem] ${tool.cardBg} p-6 shadow-sm ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(28,25,23,0.1)]`}
          >
            <div
              className={`pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full ${tool.glow} blur-3xl`}
            />

            <div className="relative z-10">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div
                  className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] ${tool.iconBg} text-5xl shadow-sm transition group-hover:scale-105 group-hover:rotate-3`}
                >
                  {tool.emoji}
                </div>

                <span
                  className={`rounded-full ${tool.badgeBg} px-4 py-2 text-sm font-black ${tool.badgeText}`}
                >
                  {tool.badge}
                </span>
              </div>

              <p
                className={`text-sm font-black uppercase tracking-wide ${tool.accentText}`}
              >
                {tool.subtitle}
              </p>

              <h2 className="mt-2 text-3xl font-black text-stone-950">
                {tool.label}
              </h2>

              <p className="mt-4 max-w-xl leading-7 text-stone-600">
                {tool.description}
              </p>

              <div className="mt-6 grid gap-2">
                {tool.points.map((point) => (
                  <div
                    key={point}
                    className="flex items-center gap-3 rounded-2xl bg-card/75 px-4 py-3 text-sm font-bold text-stone-700 shadow-sm ring-1 ring-white/80"
                  >
                    <span className={tool.accentText}>✓</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex items-center justify-between border-t border-black/5 pt-5">
                <span className="rounded-full bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-sm transition group-hover:bg-orange-600">
                  {tool.buttonLabel}
                </span>

                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full bg-card text-xl font-black ${tool.accentText} shadow-sm transition group-hover:translate-x-1`}
                >
                  →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-[2.5rem] bg-card p-8 shadow-sm ring-1 ring-orange-100 md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-bold text-orange-600">Par quoi commencer ?</p>

            <h2 className="mt-2 text-3xl font-black text-stone-950">
              Le plus utile au quotidien : Mode frigo + Liste de courses.
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-stone-600">
              Le mode frigo aide à choisir une recette. La liste de courses
              transforme ensuite les ingrédients manquants en vraie liste
              organisée.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/frigo"
              className="rounded-full bg-orange-500 px-6 py-3 text-center font-black text-white shadow-sm transition hover:bg-orange-600"
            >
              Tester le frigo
            </Link>

            <Link
              to="/recipes"
              className="rounded-full border border-orange-200 bg-cream-50 px-6 py-3 text-center font-black text-orange-700 transition hover:bg-orange-50"
            >
              Parcourir les catégories
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}