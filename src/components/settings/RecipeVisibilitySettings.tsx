import { useEffect, useMemo, useState } from 'react'

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
  const [fetchedFriends, setFetchedFriends] = useState<SocialProfile[]>([])
  // Un visiteur déconnecté n'a pas d'amis : on le déduit, plutôt que de vider
  // l'état depuis un effet.
  const friends = useMemo(
    () => (user ? fetchedFriends : []),
    [user, fetchedFriends],
  )

  useEffect(() => {
    if (!user) return

    let ignore = false

    getFriends(user.id)
      .then((data) => {
        if (!ignore) {
          setFetchedFriends(data)
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
