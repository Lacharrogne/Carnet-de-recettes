import { useEffect, useState } from 'react'

import RecipeVisibilitySelector from '../recipes/RecipeVisibilitySelector'
import { useAuth } from '../../context/useAuth'
import { getFriends, type SocialProfile } from '../../services/social'

/**
 * Réglage « Recettes affichées » du profil : définit la vue par défaut
 * (communauté / mes recettes / amis). Charge la liste d'amis pour permettre
 * le choix d'un ami précis. Drop-in, à l'image de `CursorSelector`.
 */
export default function RecipeVisibilitySettings() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<SocialProfile[]>([])

  useEffect(() => {
    let ignore = false

    if (!user) {
      setFriends([])
      return
    }

    getFriends(user.id)
      .then((data) => {
        if (!ignore) {
          setFriends(data)
        }
      })
      .catch((error) => {
        console.error(error)
      })

    return () => {
      ignore = true
    }
  }, [user])

  return <RecipeVisibilitySelector friends={friends} variant="card" />
}
