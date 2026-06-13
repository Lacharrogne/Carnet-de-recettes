import type { ReactNode } from 'react'

import IconTile from './IconTile'
import type { IconTileTone } from './IconTile'

type EmptyStateProps = {
  emoji: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  tone?: IconTileTone
  className?: string
}

// État vide chaleureux : tuile + titre serif + texte qui guide + action.
export default function EmptyState({
  emoji,
  title,
  description,
  action,
  tone = 'terracotta',
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-card bg-linen px-6 py-10 text-center ring-1 ring-bark sm:py-12 ${className}`}
    >
      <IconTile tone={tone} size="lg" className="text-4xl">
        {emoji}
      </IconTile>

      <h3 className="mt-5 text-xl font-bold text-espresso sm:text-2xl">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-md leading-7 text-cacao/80">{description}</p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
