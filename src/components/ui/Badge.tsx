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
  honey: 'bg-honey-soft text-[#8a5a1e]',
  sage: 'bg-sage-soft text-sage-deep',
  plum: 'bg-[#f4e2e8] text-[#8e5a6b]',
  frost: 'bg-[#e3f0f6] text-[#3f6f8c]',
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
