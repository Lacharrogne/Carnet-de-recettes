import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Alert from '../components/ui/Alert'
import { RowsSkeleton } from '../components/ui/Skeleton'
import {
  getFollowers,
  getFollowing,
  getFriends,
  type SocialProfile,
} from '../services/social'
import { supabase } from '../lib/supabase'

type SocialTab = 'friends' | 'followers' | 'following'

function getProfileName(profile: SocialProfile) {
  return profile.username || profile.full_name || 'Utilisateur'
}

function getProfileInitial(profile: SocialProfile) {
  return getProfileName(profile).charAt(0).toUpperCase()
}

function ProfileCard({ profile }: { profile: SocialProfile }) {
  return (
    <Link
      to={`/users/${profile.user_id}`}
      className="group rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-500 text-xl font-black text-white shadow-sm">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={getProfileName(profile)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{getProfileInitial(profile)}</span>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-stone-950">
            {getProfileName(profile)}
          </h3>

          <p className="mt-1 line-clamp-2 text-sm text-stone-600">
            {profile.bio || 'Aucune bio pour le moment.'}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm font-black text-orange-700">
        Voir le profil →
      </p>
    </Link>
  )
}

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState<SocialTab>('friends')
  const [friends, setFriends] = useState<SocialProfile[]>([])
  const [followers, setFollowers] = useState<SocialProfile[]>([])
  const [following, setFollowing] = useState<SocialProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadSocialData() {
      try {
        setLoading(true)
        setErrorMessage('')

        const { data, error } = await supabase.auth.getUser()

        if (error) {
          throw error
        }

        if (!data.user) {
          setErrorMessage('Connectez-vous pour voir vos relations.')
          return
        }

        const [friendsData, followersData, followingData] = await Promise.all([
          getFriends(data.user.id),
          getFollowers(data.user.id),
          getFollowing(data.user.id),
        ])

        if (!ignore) {
          setFriends(friendsData)
          setFollowers(followersData)
          setFollowing(followingData)
        }
      } catch (error) {
        console.error(error)

        if (!ignore) {
          setErrorMessage('Impossible de charger vos relations.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadSocialData()

    return () => {
      ignore = true
    }
  }, [])

  const displayedProfiles = useMemo(() => {
    if (activeTab === 'friends') return friends
    if (activeTab === 'followers') return followers
    return following
  }, [activeTab, friends, followers, following])

  const emptyMessage = useMemo(() => {
    if (activeTab === 'friends') {
      return 'Vous n’avez pas encore d’ami. Une amitié apparaît quand deux utilisateurs se suivent mutuellement.'
    }

    if (activeTab === 'followers') {
      return 'Personne ne suit encore votre carnet.'
    }

    return 'Vous ne suivez encore aucun carnet.'
  }, [activeTab])

  return (
    <section className="space-y-10">
      <div className="overflow-hidden rounded-[2.5rem] bg-cream-50/95 p-8 shadow-sm ring-1 ring-orange-100 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex w-fit items-center gap-2 rounded-full bg-cream-300 px-4 py-2 text-sm font-bold text-orange-700">
              <span>👥</span>
              <span>Réseau</span>
            </div>

            <h1 className="text-4xl font-black leading-tight text-stone-950 md:text-6xl">
              Mes relations
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
              Retrouvez vos amis, les personnes qui suivent votre carnet et les
              carnets que vous suivez.
            </p>
          </div>

          <Link
            to="/profile"
            className="w-fit rounded-full border border-orange-200 bg-white px-6 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
          >
            Retour au profil
          </Link>
        </div>
      </div>

      {errorMessage && (
        <Alert tone="error">
          <p className="font-bold">{errorMessage}</p>
        </Alert>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <button
          type="button"
          onClick={() => setActiveTab('friends')}
          className={`rounded-[2rem] p-6 text-left shadow-sm ring-1 transition ${
            activeTab === 'friends'
              ? 'bg-orange-500 text-white ring-orange-500'
              : 'bg-white text-stone-950 ring-orange-100 hover:bg-orange-50'
          }`}
        >
          <p className="text-sm font-bold opacity-80">Amis</p>
          <p className="mt-3 text-4xl font-black">{friends.length}</p>
          <p className="mt-1 text-sm font-medium opacity-80">
            relation{friends.length > 1 ? 's' : ''} mutuelle
            {friends.length > 1 ? 's' : ''}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('followers')}
          className={`rounded-[2rem] p-6 text-left shadow-sm ring-1 transition ${
            activeTab === 'followers'
              ? 'bg-orange-500 text-white ring-orange-500'
              : 'bg-white text-stone-950 ring-orange-100 hover:bg-orange-50'
          }`}
        >
          <p className="text-sm font-bold opacity-80">Abonnés</p>
          <p className="mt-3 text-4xl font-black">{followers.length}</p>
          <p className="mt-1 text-sm font-medium opacity-80">
            personne{followers.length > 1 ? 's' : ''} suit
            {followers.length > 1 ? 'vent' : ''} votre carnet
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('following')}
          className={`rounded-[2rem] p-6 text-left shadow-sm ring-1 transition ${
            activeTab === 'following'
              ? 'bg-orange-500 text-white ring-orange-500'
              : 'bg-white text-stone-950 ring-orange-100 hover:bg-orange-50'
          }`}
        >
          <p className="text-sm font-bold opacity-80">Abonnements</p>
          <p className="mt-3 text-4xl font-black">{following.length}</p>
          <p className="mt-1 text-sm font-medium opacity-80">
            carnet{following.length > 1 ? 's' : ''} suivi
            {following.length > 1 ? 's' : ''}
          </p>
        </button>
      </div>

      <div className="rounded-[2.5rem] bg-white/95 p-8 shadow-sm ring-1 ring-orange-100 md:p-10">
        <div className="mb-8">
          <p className="font-bold text-orange-600">
            {activeTab === 'friends'
              ? 'Amis'
              : activeTab === 'followers'
                ? 'Abonnés'
                : 'Abonnements'}
          </p>

          <h2 className="text-3xl font-black text-stone-950">
            {activeTab === 'friends'
              ? 'Vos amis'
              : activeTab === 'followers'
                ? 'Ils suivent votre carnet'
                : 'Les carnets que vous suivez'}
          </h2>
        </div>

        {loading ? (
          <RowsSkeleton rows={4} />
        ) : displayedProfiles.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
            <p className="text-lg font-black text-stone-950">
              Rien à afficher pour le moment.
            </p>

            <p className="mt-2 text-stone-600">{emptyMessage}</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {displayedProfiles.map((profile) => (
              <ProfileCard key={profile.user_id} profile={profile} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}