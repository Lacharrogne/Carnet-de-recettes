import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type FollowButtonProps = {
  targetUserId: string
  onChanged?: () => void | Promise<void>
}

export default function FollowButton({
  targetUserId,
  onChanged,
}: FollowButtonProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let ignore = false

    supabase.auth.getUser().then(async ({ data }) => {
      if (ignore) return

      const connectedUserId = data.user?.id ?? null
      setCurrentUserId(connectedUserId)

      if (!connectedUserId || connectedUserId === targetUserId) {
        setLoading(false)
        return
      }

      const { data: followData, error } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('follower_id', connectedUserId)
        .eq('following_id', targetUserId)
        .maybeSingle()

      if (ignore) return

      if (error) {
        console.error(error)
        setErrorMessage('Impossible de vérifier l’abonnement.')
      } else {
        setIsFollowing(Boolean(followData))
      }

      setLoading(false)
    })

    return () => {
      ignore = true
    }
  }, [targetUserId])

  async function handleFollowToggle() {
    if (!currentUserId) {
      setErrorMessage('Connecte-toi pour t’abonner à ce profil.')
      return
    }

    if (currentUserId === targetUserId) {
      return
    }

    try {
      setUpdating(true)
      setErrorMessage('')

      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId)

        if (error) {
          throw error
        }

        setIsFollowing(false)
      } else {
        const { error } = await supabase.from('user_follows').insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        })

        if (error) {
          throw error
        }

        setIsFollowing(true)
      }

      await onChanged?.()
    } catch (error) {
      console.error(error)

      setErrorMessage(
        isFollowing
          ? 'Impossible de se désabonner pour le moment.'
          : 'Impossible de s’abonner pour le moment.',
      )
    } finally {
      setUpdating(false)
    }
  }

  if (currentUserId === targetUserId) {
    return null
  }

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className="rounded-full bg-stone-200 px-7 py-4 font-black text-stone-500"
      >
        Chargement...
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleFollowToggle}
        disabled={updating}
        className={`rounded-full px-7 py-4 font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isFollowing
            ? 'bg-black text-white hover:bg-stone-800'
            : 'bg-orange-500 text-white hover:bg-orange-600'
        }`}
      >
        {updating
          ? 'Modification...'
          : isFollowing
            ? 'Abonné'
            : 'S’abonner'}
      </button>

      {errorMessage && (
        <p className="text-center text-sm font-bold text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  )
}