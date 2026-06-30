import type { ReactNode } from 'react'

export type IconTileTone = 'terracotta' | 'honey' | 'sage' | 'linen' | 'plum'
export type IconTileSize = 'sm' | 'md' | 'lg'

const TONE_CLASS: Record<IconTileTone, string> = {
  terracotta: 'bg-terracotta-soft',
  honey: 'bg-honey-soft',
  sage: 'bg-sage-soft',
  linen: 'bg-linen',
  plum: 'bg-berry-soft',
}

const SIZE_CLASS: Record<IconTileSize, string> = {
  sm: 'h-10 w-10 rounded-xl text-xl',
  md: 'h-12 w-12 rounded-2xl text-2xl',
  lg: 'h-16 w-16 rounded-[1.35rem] text-3xl',
}

type IconTileProps = {
  tone?: IconTileTone
  size?: IconTileSize
  children: ReactNode
  className?: string
}

// Tuile arrondie qui accueille un emoji ou une icône.
export default function IconTile({
  tone = 'terracotta',
  size = 'md',
  children,
  className = '',
}: IconTileProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center shadow-soft ${TONE_CLASS[tone]} ${SIZE_CLASS[size]} ${className}`}
    >
      {children}
    </span>
  )
}
