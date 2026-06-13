import type { ReactNode } from 'react'

type SectionHeaderProps = {
  eyebrow: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  // Couleur de l'œil-de-bœuf (permet l'accent par ambiance de catégorie).
  eyebrowClassName?: string
  className?: string
}

// En-tête de section : œil-de-bœuf + titre + sous-titre, avec une action
// optionnelle alignée à droite sur grand écran.
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  eyebrowClassName = 'text-orange-600',
  className = '',
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`}
    >
      <div>
        <p className={`font-bold ${eyebrowClassName}`}>{eyebrow}</p>

        <h2 className="text-2xl font-black text-stone-950 sm:text-3xl md:text-4xl">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-2 text-sm leading-6 text-stone-600 sm:text-base">
            {subtitle}
          </p>
        )}
      </div>

      {action}
    </div>
  )
}
