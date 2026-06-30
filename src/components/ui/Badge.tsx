import type { ReactNode } from 'react'

export type BadgeTone =
  | 'neutral'
  | 'terracotta'
  | 'honey'
  | 'sage'
  | 'plum'
  | 'frost'

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: 'bg-linen text-cacao',
  terracotta: 'bg-terracotta-soft text-terracotta-deep',
  honey: 'bg-honey-soft text-honey-deep',
  sage: 'bg-sage-soft text-sage-deep',
  plum: 'bg-berry-soft text-berry',
  frost: 'bg-ocean-soft text-ocean',
}

type BadgeProps = {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}

// Petite pastille d'information (catégorie, difficulté, statut...).
export default function Badge({
  tone = 'neutral',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${TONE_CLASS[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
