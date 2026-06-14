import { Skeleton } from './Skeleton'

export default function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] bg-cream-50/95 p-5 shadow-sm ring-1 ring-orange-100 sm:rounded-[2.5rem] sm:p-8 md:p-10">
        <Skeleton className="mb-4 h-5 w-24" />
        <Skeleton className="mb-4 h-10 w-2/3 sm:h-14" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>

      <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-card bg-card shadow-card ring-1 ring-bark"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-3 p-4 sm:p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <Skeleton className="h-14 rounded-[1.15rem]" />
                <Skeleton className="h-14 rounded-[1.15rem]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
