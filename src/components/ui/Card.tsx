import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  // Survol "soulevé" pour les cartes cliquables.
  interactive?: boolean
  // Ajoute un padding intérieur standard (cartes de contenu simple).
  padded?: boolean
}

// Socle de carte de l'écosystème : surface crème, hairline bois, ombre chaude.
export default function Card({
  interactive = false,
  padded = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  const classes = [
    'rounded-card bg-card ring-1 ring-bark shadow-card',
    interactive
      ? 'transition duration-300 hover:-translate-y-1 hover:shadow-lift'
      : '',
    padded ? 'p-5 sm:p-6' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
