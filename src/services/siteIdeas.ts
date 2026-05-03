import { supabase } from '../lib/supabase'

export type SiteIdea = {
  id: number
  userId: string
  title: string
  message: string
  category: string
  status: string
  createdAt: string
  updatedAt: string
}

type SiteIdeaRow = {
  id: number
  user_id: string
  title: string
  message: string
  category: string
  status: string
  created_at: string
  updated_at: string
}

function mapSiteIdea(row: SiteIdeaRow): SiteIdea {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    category: row.category,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error

  if (!user) {
    throw new Error('Utilisateur non connecté.')
  }

  return user.id
}

export async function getSiteIdeas() {
  const { data, error } = await supabase
    .from('site_ideas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => mapSiteIdea(row as SiteIdeaRow))
}

export async function createSiteIdea({
  title,
  message,
  category,
}: {
  title: string
  message: string
  category: string
}) {
  const userId = await getCurrentUserId()

  const cleanedTitle = title.trim()
  const cleanedMessage = message.trim()

  if (!cleanedTitle) {
    throw new Error('Le titre est obligatoire.')
  }

  if (!cleanedMessage) {
    throw new Error('Le message est obligatoire.')
  }

  const { data, error } = await supabase
    .from('site_ideas')
    .insert({
      user_id: userId,
      title: cleanedTitle,
      message: cleanedMessage,
      category,
      status: 'nouvelle',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  return mapSiteIdea(data as SiteIdeaRow)
}

export async function deleteSiteIdea(ideaId: number) {
  const { error } = await supabase.from('site_ideas').delete().eq('id', ideaId)

  if (error) throw error
}