import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import { getProfile, type UserProfile } from '../services/profiles'
import {
  createSiteIdea,
  deleteSiteIdea,
  getSiteIdeas,
  type SiteIdea,
} from '../services/siteIdeas'

const IDEA_CATEGORIES = [
  {
    value: 'amelioration',
    label: 'Amélioration',
    emoji: '✨',
  },
  {
    value: 'bug',
    label: 'Bug',
    emoji: '🐛',
  },
  {
    value: 'recette',
    label: 'Idée recette',
    emoji: '🍽️',
  },
  {
    value: 'fonctionnalite',
    label: 'Nouvelle fonctionnalité',
    emoji: '💡',
  },
  {
    value: 'autre',
    label: 'Autre',
    emoji: '📝',
  },
]

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  nouvelle: {
    label: 'Nouvelle idée',
    className: 'bg-orange-100 text-orange-700',
  },
  en_etude: {
    label: 'En étude',
    className: 'bg-blue-100 text-blue-700',
  },
  prevue: {
    label: 'Prévue',
    className: 'bg-purple-100 text-purple-700',
  },
  faite: {
    label: 'Réalisée',
    className: 'bg-green-100 text-green-700',
  },
}

function getCategory(value: string) {
  return (
    IDEA_CATEGORIES.find((category) => category.value === value) ??
    IDEA_CATEGORIES[IDEA_CATEGORIES.length - 1]
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function IdeasPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [ideas, setIdeas] = useState<SiteIdea[]>([])
  const [profiles, setProfiles] = useState<Record<string, UserProfile | null>>(
    {},
  )

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('amelioration')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingIdeaId, setDeletingIdeaId] = useState<number | null>(null)

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadIdeas() {
      try {
        setLoading(true)
        setErrorMessage('')

        const loadedIdeas = await getSiteIdeas()

        const uniqueUserIds = Array.from(
          new Set(loadedIdeas.map((idea) => idea.userId)),
        )

        const loadedProfiles: Record<string, UserProfile | null> = {}

        await Promise.all(
          uniqueUserIds.map(async (ideaUserId) => {
            try {
              loadedProfiles[ideaUserId] = await getProfile(ideaUserId)
            } catch (error) {
              console.error(error)
              loadedProfiles[ideaUserId] = null
            }
          }),
        )

        if (!ignore) {
          setIdeas(loadedIdeas)
          setProfiles(loadedProfiles)
        }
      } catch (error) {
        console.error(error)

        if (!ignore) {
          setErrorMessage('Impossible de charger la boîte à idées.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    void loadIdeas()

    return () => {
      ignore = true
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!userId) return

    const cleanedTitle = title.trim()
    const cleanedMessage = message.trim()

    if (!cleanedTitle || !cleanedMessage) {
      setErrorMessage('Ajoute un titre et un message avant de publier.')
      return
    }

    try {
      setSaving(true)
      setErrorMessage('')
      setSuccessMessage('')

      const createdIdea = await createSiteIdea({
        title: cleanedTitle,
        message: cleanedMessage,
        category,
      })

      const currentProfile = await getProfile(userId).catch((error) => {
        console.error(error)
        return null
      })

      setProfiles((currentProfiles) => ({
        ...currentProfiles,
        [userId]: currentProfile,
      }))

      setIdeas((currentIdeas) => [createdIdea, ...currentIdeas])
      setTitle('')
      setMessage('')
      setCategory('amelioration')
      setSuccessMessage('Ton idée a bien été publiée.')

      window.setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de publier ton idée.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteIdea(idea: SiteIdea) {
    const confirmDelete = window.confirm(
      `Supprimer cette idée ?\n\n"${idea.title}"`,
    )

    if (!confirmDelete) return

    try {
      setDeletingIdeaId(idea.id)
      setErrorMessage('')
      setSuccessMessage('')

      await deleteSiteIdea(idea.id)

      setIdeas((currentIdeas) =>
        currentIdeas.filter((currentIdea) => currentIdea.id !== idea.id),
      )

      setSuccessMessage('Idée supprimée.')

      window.setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer cette idée.')
    } finally {
      setDeletingIdeaId(null)
    }
  }

  return (
    <section className="space-y-8">
      <div className="rounded-[2.5rem] bg-[#fffaf3] p-8 shadow-sm ring-1 ring-orange-100">
        <div className="mb-6 flex w-fit items-center gap-3 rounded-full bg-[#f4e8dc] px-4 py-2 text-sm font-bold text-orange-700">
          <span>💡</span>
          <span>Boîte à idées</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div>
            <h1 className="text-4xl font-black leading-tight text-stone-950 md:text-6xl">
              Propose tes idées pour améliorer le site.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              Tu peux laisser une suggestion, signaler un bug ou proposer une
              nouvelle fonctionnalité pour faire évoluer le carnet de recettes.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <p className="text-sm font-black uppercase tracking-wide text-orange-600">
              Participer
            </p>

            <h2 className="mt-2 text-2xl font-black text-stone-950">
              Laisser une idée
            </h2>

            {user ? (
              <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-black text-stone-800">
                    Type d’idée
                  </label>

                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full rounded-2xl border border-orange-100 bg-[#fffaf3] px-4 py-3 font-semibold text-stone-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  >
                    {IDEA_CATEGORIES.map((currentCategory) => (
                      <option
                        key={currentCategory.value}
                        value={currentCategory.value}
                      >
                        {currentCategory.emoji} {currentCategory.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-stone-800">
                    Titre
                  </label>

                  <input
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value)
                      setErrorMessage('')
                    }}
                    placeholder="Exemple : Ajouter un mode anti-gaspillage"
                    className="w-full rounded-2xl border border-orange-100 bg-[#fffaf3] px-4 py-3 font-semibold text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-stone-800">
                    Message
                  </label>

                  <textarea
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value)
                      setErrorMessage('')
                    }}
                    rows={5}
                    placeholder="Explique ton idée en quelques phrases..."
                    className="w-full rounded-[1.4rem] border border-orange-100 bg-[#fffaf3] px-4 py-3 text-sm font-semibold leading-7 text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Publication...' : 'Publier mon idée'}
                </button>
              </form>
            ) : (
              <div className="mt-5 rounded-[1.5rem] bg-[#fffaf3] p-5 ring-1 ring-orange-100">
                <p className="font-bold text-stone-900">
                  Connecte-toi pour proposer une idée.
                </p>

                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Les idées sont liées à ton profil pour que les autres
                  utilisateurs voient qui les propose.
                </p>

                <Link
                  to="/auth"
                  className="mt-4 inline-flex rounded-full bg-orange-500 px-5 py-3 font-black text-white shadow-sm transition hover:bg-orange-600"
                >
                  Se connecter
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {successMessage && (
        <p className="rounded-2xl bg-green-50 px-5 py-4 font-bold text-green-700">
          {successMessage}
        </p>
      )}

      {errorMessage && (
        <p className="rounded-2xl bg-red-50 px-5 py-4 font-bold text-red-700">
          {errorMessage}
        </p>
      )}

      <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-orange-600">
              Suggestions
            </p>

            <h2 className="mt-2 text-3xl font-black text-stone-950">
              Idées proposées
            </h2>
          </div>

          <p className="rounded-full bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
            {ideas.length} idée{ideas.length > 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="rounded-[2rem] bg-[#fffaf3] p-6 text-stone-600 ring-1 ring-orange-100">
            Chargement des idées...
          </div>
        ) : ideas.length === 0 ? (
          <div className="rounded-[2rem] bg-[#fffaf3] p-8 text-center ring-1 ring-orange-100">
            <p className="text-5xl">💭</p>

            <h3 className="mt-4 text-2xl font-black text-stone-950">
              Aucune idée pour le moment.
            </h3>

            <p className="mt-2 text-stone-600">
              Sois le premier à proposer une amélioration pour le site.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {ideas.map((idea) => {
              const profile = profiles[idea.userId]
              const authorName = profile?.username || 'Utilisateur'
              const authorAvatarUrl = profile?.avatarUrl ?? ''
              const authorLetter = authorName.charAt(0).toUpperCase() || 'U'
              const categoryInfo = getCategory(idea.category)
              const statusInfo =
                STATUS_LABELS[idea.status] ?? STATUS_LABELS.nouvelle
              const isMine = userId === idea.userId

              return (
                <article
                  key={idea.id}
                  className="rounded-[2rem] bg-[#fffaf3] p-5 shadow-sm ring-1 ring-orange-100"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-500 font-black text-white ring-2 ring-white">
                        {authorAvatarUrl ? (
                          <img
                            src={authorAvatarUrl}
                            alt={authorName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          authorLetter
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-black text-stone-950">
                          {authorName}
                          {isMine ? ' · toi' : ''}
                        </p>

                        <p className="text-sm font-semibold text-stone-500">
                          {formatDate(idea.createdAt)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${statusInfo.className}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="mb-3 flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-black text-orange-700 ring-1 ring-orange-100">
                    <span>{categoryInfo.emoji}</span>
                    <span>{categoryInfo.label}</span>
                  </div>

                  <h3 className="text-xl font-black text-stone-950">
                    {idea.title}
                  </h3>

                  <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-stone-700 md:text-[15px]">
                    {idea.message}
                  </p>

                  {isMine && (
                    <button
                      type="button"
                      onClick={() => handleDeleteIdea(idea)}
                      disabled={deletingIdeaId === idea.id}
                      className="mt-5 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingIdeaId === idea.id
                        ? 'Suppression...'
                        : 'Supprimer mon idée'}
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </section>
  )
}