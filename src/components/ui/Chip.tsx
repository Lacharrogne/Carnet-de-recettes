import type { ReactNode } from 'react'

type ChipProps = {
  emoji?: string
  children: ReactNode
  className?: string
}

// Pastille « œil-de-bœuf » utilisée en tête de héros (ex : « 📖 Le carnet »).
export default function Chip({ emoji, children, className = '' }: ChipProps) {
  return (
    <div
      className={`flex w-fit items-center gap-2 rounded-full bg-cream-300 px-4 py-2 text-xs font-bold text-orange-700 sm:gap-3 sm:text-sm ${className}`}
    >
      {emoji && <span>{emoji}</span>}
      <span>{children}</span>
    </div>
  )
}
