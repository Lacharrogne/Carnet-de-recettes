type MagicRecipeButtonProps = {
  onClick: () => void
  disabled?: boolean
  /** Texte d'accroche (tutoiement par défaut ; vouvoiement sur la page d'accueil publique). */
  description?: string
}

/**
 * Le « bouton magique » — grande carte terracotta qui propose une recette au
 * hasard. Visuel partagé entre l'accueil connecté et l'accueil public.
 */
export default function MagicRecipeButton({
  onClick,
  disabled = false,
  description = 'Clique ici et le carnet te propose une recette au hasard.',
}: MagicRecipeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group w-full rounded-[1.75rem] bg-orange-500 p-5 text-left text-white shadow-sm transition hover:-translate-y-1 hover:bg-orange-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 sm:rounded-[2rem] sm:p-7"
    >
      <div className="flex items-center justify-between gap-4 sm:gap-5">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-orange-100 sm:text-sm">
            Bouton magique
          </p>

          <p className="mt-3 text-2xl font-black leading-tight sm:mt-4 sm:text-3xl">
            Me proposer une recette
          </p>

          <p className="mt-3 max-w-sm text-sm font-bold leading-6 text-orange-50 sm:mt-4 sm:text-base sm:leading-7">
            {description}
          </p>
        </div>

        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-white/20 text-3xl transition group-hover:rotate-12 group-hover:scale-105 sm:h-20 sm:w-20 sm:rounded-[1.5rem] sm:text-4xl">
          🎲
        </div>
      </div>
    </button>
  )
}
