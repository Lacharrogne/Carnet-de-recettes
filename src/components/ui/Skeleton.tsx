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
