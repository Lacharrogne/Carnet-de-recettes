import { supabase } from '../lib/supabase'

export type UserRole = 'user' | 'admin'

export type UserProfile = {
  userId: string
  username: string
  bio: string
  avatarUrl: string
  role: UserRole
}

type ProfileRow = {
  user_id: string
  username: string
  bio: string
  avatar_url: string | null
  role: UserRole | null
}

type EditableUserProfile = {
  userId: string
  username: string
  bio: string
  avatarUrl: string
  role?: UserRole
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    userId: row.user_id,
    username: row.username,
    bio: row.bio,
    avatarUrl: row.avatar_url ?? '',
    role: row.role === 'admin' ? 'admin' : 'user',
  }
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, bio, avatar_url, role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapProfile(data as ProfileRow)
}

export async function saveProfile(
  values: EditableUserProfile,
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: values.userId,
        username: values.username,
        bio: values.bio,
        avatar_url: values.avatarUrl,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      },
    )
    .select('user_id, username, bio, avatar_url, role')
    .single()

  if (error) throw error

  return mapProfile(data as ProfileRow)
}

export async function uploadProfileAvatar(
  userId: string,
  file: File,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image.')
  }

  const maxSize = 2 * 1024 * 1024

  if (file.size > maxSize) {
    throw new Error('La photo ne doit pas dépasser 2 Mo.')
  }

  const fileExtension = file.name.split('.').pop() ?? 'jpg'
  const filePath = `${userId}/avatar-${Date.now()}.${fileExtension}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file)

  if (error) throw error

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

  return data.publicUrl
}