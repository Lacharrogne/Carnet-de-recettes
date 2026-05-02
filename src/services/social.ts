import { supabase } from '../lib/supabase'

export type SocialProfile = {
  user_id: string
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  created_at?: string | null
}

export type FollowStatus = {
  isFollowing: boolean
  isFollowedBy: boolean
  isFriend: boolean
}

export type FollowStats = {
  followersCount: number
  followingCount: number
  friendsCount: number
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  if (!data.user) {
    throw new Error('Utilisateur non connecté')
  }

  return data.user.id
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

async function getProfilesByUserIds(userIds: string[]) {
  const uniqueUserIds = uniqueValues(userIds)

  if (uniqueUserIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', uniqueUserIds)

  if (error) {
    throw error
  }

  const profiles = (data ?? []) as SocialProfile[]

  return uniqueUserIds
    .map((userId) => profiles.find((profile) => profile.user_id === userId))
    .filter(Boolean) as SocialProfile[]
}

export async function followUser(targetUserId: string) {
  const currentUserId = await getCurrentUserId()

  if (currentUserId === targetUserId) {
    throw new Error('Tu ne peux pas t’abonner à toi-même.')
  }

  const { error } = await supabase.from('user_follows').insert({
    follower_id: currentUserId,
    following_id: targetUserId,
  })

  if (error) {
    if (error.code === '23505') {
      return
    }

    throw error
  }
}

export async function unfollowUser(targetUserId: string) {
  const currentUserId = await getCurrentUserId()

  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', currentUserId)
    .eq('following_id', targetUserId)

  if (error) {
    throw error
  }
}

export async function getFollowStatus(targetUserId: string): Promise<FollowStatus> {
  const currentUserId = await getCurrentUserId()

  if (currentUserId === targetUserId) {
    return {
      isFollowing: false,
      isFollowedBy: false,
      isFriend: false,
    }
  }

  const [followingResponse, followedByResponse] = await Promise.all([
    supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .maybeSingle(),

    supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', targetUserId)
      .eq('following_id', currentUserId)
      .maybeSingle(),
  ])

  if (followingResponse.error) {
    throw followingResponse.error
  }

  if (followedByResponse.error) {
    throw followedByResponse.error
  }

  const isFollowing = Boolean(followingResponse.data)
  const isFollowedBy = Boolean(followedByResponse.data)

  return {
    isFollowing,
    isFollowedBy,
    isFriend: isFollowing && isFollowedBy,
  }
}

export async function getFollowStats(userId: string): Promise<FollowStats> {
  const [followersCountResponse, followingCountResponse] = await Promise.all([
    supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId),

    supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ])

  if (followersCountResponse.error) {
    throw followersCountResponse.error
  }

  if (followingCountResponse.error) {
    throw followingCountResponse.error
  }

  const [followersResponse, followingResponse] = await Promise.all([
    supabase
      .from('user_follows')
      .select('follower_id')
      .eq('following_id', userId),

    supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId),
  ])

  if (followersResponse.error) {
    throw followersResponse.error
  }

  if (followingResponse.error) {
    throw followingResponse.error
  }

  const followersIds = (followersResponse.data ?? []).map(
    (follow) => follow.follower_id,
  )

  const followingIds = (followingResponse.data ?? []).map(
    (follow) => follow.following_id,
  )

  const friendsCount = followersIds.filter((followerId) =>
    followingIds.includes(followerId),
  ).length

  return {
    followersCount: followersCountResponse.count ?? 0,
    followingCount: followingCountResponse.count ?? 0,
    friendsCount,
  }
}

export async function getFollowers(userId: string) {
  const { data, error } = await supabase
    .from('user_follows')
    .select('follower_id, created_at')
    .eq('following_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const followerIds = (data ?? []).map((follow) => follow.follower_id)

  return getProfilesByUserIds(followerIds)
}

export async function getFollowing(userId: string) {
  const { data, error } = await supabase
    .from('user_follows')
    .select('following_id, created_at')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const followingIds = (data ?? []).map((follow) => follow.following_id)

  return getProfilesByUserIds(followingIds)
}

export async function getFriends(userId: string) {
  const [followersResponse, followingResponse] = await Promise.all([
    supabase
      .from('user_follows')
      .select('follower_id')
      .eq('following_id', userId),

    supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId),
  ])

  if (followersResponse.error) {
    throw followersResponse.error
  }

  if (followingResponse.error) {
    throw followingResponse.error
  }

  const followersIds = (followersResponse.data ?? []).map(
    (follow) => follow.follower_id,
  )

  const followingIds = (followingResponse.data ?? []).map(
    (follow) => follow.following_id,
  )

  const friendIds = followersIds.filter((followerId) =>
    followingIds.includes(followerId),
  )

  return getProfilesByUserIds(friendIds)
}