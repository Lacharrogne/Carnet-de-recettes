import { BookOpenText, CalendarDays, ChefHat, Refrigerator, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const DISCOVERIES = [
  {
    to: '/recipes',
    emoji: '📖',
    Icon: BookOpenText,
    title: 'Explorer le carnet',
    description: 'Parcourez les recettes déjà partagées pour vous inspirer.',
  },
  {
    to: '/planning',
    emoji: '📅',
    Icon: CalendarDays,
    title: 'Composer la semaine',
    description: 'Glissez des repas sur le planning, sans prise de tête.',
  },
  {
    to: '/frigo',
    emoji: '🥕',
    Icon: Refrigerator,
    title: 'Tester le mode frigo',
    description: 'Dites ce qu’il vous reste, on vous propose quoi cuisiner.',
  },
]

/**
 * Accueil du nouvel utilisateur : tant qu'il n'a pas créé sa première
 * recette, on l'oriente clairement (au lieu de le laisser devant un carnet
 * qui n'est pas encore le sien).
 */
export default function OnboardingCard({
  userName,
  onDismiss,
}: {
  userName: string
  onDismiss: () => void
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-espresso px-6 py-8 text-cream-100 shadow-lift sm:rounded-[2.5rem] sm:px-10 sm:py-10">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-terracotta/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-honey/20 blur-3xl" />

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Masquer le guide de démarrage"
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-cream-100/80 transition hover:bg-white/20 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold">
          <ChefHat className="h-4 w-4" />
          Premiers pas
        </span>

        <h2 className="mt-4 font-display text-2xl font-black leading-tight text-white sm:text-3xl">
          Bienvenue {userName} ! Créons votre première recette.
        </h2>

        <p className="mt-3 max-w-2xl leading-7 text-cream-100/85">
          Votre carnet est prêt. Ajoutez un premier plat de la maison — avec ses
          ingrédients et ses étapes — et tout le reste (courses, planning,
          favoris) se mettra en place autour.
        </p>

        <div className="mt-6">
          <Link
            to="/add-recipe"
            className="inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-sm font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-terracotta-deep"
          >
            <ChefHat className="h-4 w-4" />
            Ajouter ma première recette
          </Link>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {DISCOVERIES.map((item) => {
            const Icon = item.Icon

            return (
              <Link
                key={item.to}
                to={item.to}
                className="group flex flex-col gap-2 rounded-2xl bg-white/10 p-4 transition hover:bg-white/15"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="h-5 w-5 text-honey" />
                </span>

                <p className="font-bold text-white">{item.title}</p>
                <p className="text-sm leading-5 text-cream-100/75">
                  {item.description}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
