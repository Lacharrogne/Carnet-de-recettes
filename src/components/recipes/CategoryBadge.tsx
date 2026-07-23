import { useState } from 'react'

type CategoryBadgeProps = {
  /** Chemin du badge illustré (ex. `/categories/healthy.png`). */
  image?: string | null
  /** Emoji de repli si l'image est absente ou ne charge pas. */
  emoji: string
  /** Libellé de la catégorie, utilisé pour l'attribut `alt`. */
  label: string
  /** Classes appliquées au conteneur (taille, coins, etc.). */
  className?: string
  /** Classes appliquées à l'emoji de repli (taille du texte). */
  emojiClassName?: string
}

/**
 * Affiche le badge illustré d'une catégorie de recette. Si aucune image n'est
 * fournie — ou si elle échoue à charger — on retombe proprement sur l'emoji,
 * pour ne jamais casser la mise en page.
 */
export default function CategoryBadge({
  image,
  emoji,
  label,
  className = '',
  emojiClassName = '',
}: CategoryBadgeProps) {
  const [failed, setFailed] = useState(false)

  if (image && !failed) {
    return (
      <img
        src={image}
        alt={label}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`object-contain ${className}`}
      />
    )
  }

  return (
    <span aria-hidden="true" className={`${className} ${emojiClassName}`}>
      {emoji}
    </span>
  )
}
