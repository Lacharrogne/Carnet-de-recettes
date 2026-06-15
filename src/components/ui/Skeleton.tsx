type SkeletonProps = {
  className?: string
}

// Bloc fantôme animé générique.
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-xl bg-sand/60 ${className}`} />
  )
}

// Carte fantôme reprenant la silhouette d'une RecipeCard.
export function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-card shadow-card ring-1 ring-bark">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />

      <div className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />

        <div className="grid grid-cols-2 gap-2.5 pt-2 sm:gap-3">
          <Skeleton className="h-14 rounded-[1.15rem]" />
          <Skeleton className="h-14 rounded-[1.15rem]" />
        </div>
      </div>
    </div>
  )
}

type GridSkeletonProps = {
  count?: number
}

// Grille de cartes fantômes, alignée sur les grilles de recettes/catégories.
export function RecipeCardGridSkeleton({ count = 3 }: GridSkeletonProps) {
  return (
    <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <RecipeCardSkeleton key={index} />
      ))}
    </div>
  )
}

// Lignes fantômes avec avatar (listes sociales, avis, idées).
export function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4 rounded-[2rem] bg-card p-5 shadow-card ring-1 ring-bark sm:p-6">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Silhouette d'une fiche recette : image, titre, méta puis deux colonnes.
export function RecipeDetailSkeleton() {
  return (
    <section className="space-y-6">
      <Skeleton className="aspect-[16/9] w-full rounded-[2rem] sm:aspect-[2.4/1]" />

      <div className="space-y-4 rounded-[2rem] bg-card p-6 shadow-card ring-1 ring-bark sm:p-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />

        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Skeleton className="h-64 rounded-[2rem]" />
        <Skeleton className="h-64 rounded-[2rem]" />
      </div>
    </section>
  )
}

// Silhouette d'une page profil : en-tête (avatar + nom) puis grille de recettes.
export function ProfileSkeleton() {
  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] bg-card p-6 shadow-card ring-1 ring-bark sm:p-8">
        <div className="flex items-center gap-5">
          <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>

      <RecipeCardGridSkeleton count={3} />
    </section>
  )
}
