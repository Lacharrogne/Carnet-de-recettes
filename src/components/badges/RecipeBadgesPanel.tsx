import {
  getRecipePublicationBadge,
  getRecipePublicationProgress,
  RECIPE_PUBLICATION_BADGES,
} from '../../data/recipeBadges'

type RecipeBadgesPanelProps = {
  recipeCount: number
}

type RecipeBadgePillProps = {
  recipeCount: number
}

export function RecipeBadgePill({ recipeCount }: RecipeBadgePillProps) {
  const badge = getRecipePublicationBadge(recipeCount)

  if (!badge) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-600">
        🔒 Aucun badge
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-700">
      <span>{badge.emoji}</span>
      <span>{badge.name}</span>
    </span>
  )
}

export default function RecipeBadgesPanel({
  recipeCount,
}: RecipeBadgesPanelProps) {
  const progress = getRecipePublicationProgress(recipeCount)
  const currentBadge = progress.currentBadge
  const nextBadge = progress.nextBadge

  return (
    <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-orange-600">
            Succès de cuisine
          </p>

          <h2 className="mt-2 text-3xl font-black text-stone-950">
            Badges de publication
          </h2>

          <p className="mt-2 max-w-2xl leading-7 text-stone-600">
            Plus vous publiez de recettes, plus vous débloquez de badges dans le
            carnet.
          </p>
        </div>

        <div className="rounded-[1.5rem] bg-cream-50 px-5 py-4 text-center shadow-sm ring-1 ring-orange-100">
          <p className="text-3xl font-black text-orange-600">{recipeCount}</p>
          <p className="text-sm font-bold text-stone-600">
            recette{recipeCount > 1 ? 's' : ''} publiée
            {recipeCount > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] bg-cream-50 p-5 ring-1 ring-orange-100">
        {currentBadge ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.7rem] bg-orange-500 text-5xl shadow-sm">
              {currentBadge.emoji}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                Badge actuel
              </p>

              <h3 className="mt-1 text-2xl font-black text-stone-950">
                {currentBadge.name}
              </h3>

              <p className="mt-2 leading-7 text-stone-600">
                {currentBadge.unlockedText}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.7rem] bg-stone-100 text-5xl shadow-sm">
              🔒
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                Aucun badge pour le moment
              </p>

              <h3 className="mt-1 text-2xl font-black text-stone-950">
                Publiez votre première recette
              </h3>

              <p className="mt-2 leading-7 text-stone-600">
                Le premier badge est débloqué dès la première recette publiée.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6">
          {nextBadge ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-stone-700">
                  Prochain badge : {nextBadge.emoji} {nextBadge.name}
                </p>

                <p className="text-sm font-black text-orange-700">
                  Encore {progress.remainingRecipes} recette
                  {progress.remainingRecipes > 1 ? 's' : ''}
                </p>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-orange-100">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <p className="mt-2 text-sm font-semibold text-stone-500">
                {recipeCount} / {nextBadge.minRecipes} recettes publiées
              </p>
            </>
          ) : (
            <div className="rounded-[1.5rem] bg-orange-500 px-5 py-4 text-white">
              <p className="font-black">
                Tous les badges sont débloqués. Niveau légendaire atteint.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {RECIPE_PUBLICATION_BADGES.map((badge) => {
          const unlocked = recipeCount >= badge.minRecipes

          return (
            <article
              key={badge.id}
              className={`rounded-[1.7rem] p-5 shadow-sm ring-1 transition ${
                unlocked
                  ? 'bg-white ring-orange-100'
                  : 'bg-stone-50 opacity-70 ring-stone-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${
                    unlocked ? 'bg-orange-100' : 'bg-stone-200 grayscale'
                  }`}
                >
                  {badge.emoji}
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    unlocked
                      ? 'bg-green-100 text-green-700'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {unlocked ? 'Débloqué' : 'Bloqué'}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-black text-stone-950">
                {badge.name}
              </h3>

              <p className="mt-2 text-sm font-semibold leading-6 text-stone-500">
                {badge.description}
              </p>

              <p className="mt-4 rounded-full bg-cream-50 px-4 py-2 text-sm font-black text-orange-700 ring-1 ring-orange-100">
                {badge.minRecipes} recette{badge.minRecipes > 1 ? 's' : ''}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}