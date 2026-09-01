import { useCallback, useEffect, useState, type FormEvent } from 'react'

import ResourceManager from '../components/admin/ResourceManager'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useDialogs } from '../context/dialogContext'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabase'
import { getAdminStats, type AdminStats } from '../services/admin'

type CompAccess = {
  user_id: string
  email: string | null
  username: string | null
  granted_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return 'Date inconnue'

  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function AdminPage() {
  const { confirm } = useDialogs()
  const { user } = useAuth()

  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [compEmail, setCompEmail] = useState('')
  const [compList, setCompList] = useState<CompAccess[]>([])
  const [compBusy, setCompBusy] = useState(false)

  useEffect(() => {
    let ignore = false

    async function checkAdminRole() {
      if (!user) {
        if (!ignore) {
          setCheckingAdmin(false)
          setIsAdmin(false)
        }
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        if (!ignore) {
          setIsAdmin(data?.role === 'admin')
        }
      } catch (error) {
        console.error(error)
        if (!ignore) {
          setIsAdmin(false)
          setErrorMessage('Impossible de vérifier les droits administrateur.')
        }
      } finally {
        if (!ignore) {
          setCheckingAdmin(false)
        }
      }
    }

    void checkAdminRole()

    return () => {
      ignore = true
    }
  }, [user])

  const refreshCompList = useCallback(async () => {
    const { data, error } = await supabase.rpc('list_comp_access')

    if (error) {
      console.error(error)
      return
    }

    setCompList((data ?? []) as CompAccess[])
  }, [])

  useEffect(() => {
    if (!isAdmin) {
      return
    }

    async function loadAdmin() {
      try {
        const loadedStats = await getAdminStats()
        setStats(loadedStats)
      } catch (error) {
        console.error(error)
      }

      await refreshCompList()
    }

    void loadAdmin()
  }, [isAdmin, refreshCompList])

  async function handleGrantComp(event: FormEvent) {
    event.preventDefault()

    const email = compEmail.trim()
    if (!email) return

    try {
      setCompBusy(true)
      setErrorMessage('')
      setSuccessMessage('')

      const { error } = await supabase.rpc('grant_comp_access', {
        target_email: email,
      })

      if (error) throw error

      setCompEmail('')
      await refreshCompList()
      setSuccessMessage(`Accès offert à ${email}.`)

      window.setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error(error)
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "Impossible d'offrir l'accès.",
      )
    } finally {
      setCompBusy(false)
    }
  }

  async function handleRevokeComp(access: CompAccess) {
    const label = access.email ?? access.username ?? 'ce compte'

    const confirmed = await confirm({
      title: 'Retirer l’accès',
      message: `Retirer l'accès offert à ${label} ?`,
      confirmLabel: 'Retirer',
      tone: 'danger',
    })
    if (!confirmed) {
      return
    }

    if (!access.email) {
      setErrorMessage('Email manquant pour ce compte, retrait impossible.')
      return
    }

    try {
      setCompBusy(true)
      setErrorMessage('')
      setSuccessMessage('')

      const { error } = await supabase.rpc('revoke_comp_access', {
        target_email: access.email,
      })

      if (error) throw error

      await refreshCompList()
      setSuccessMessage(`Accès retiré à ${label}.`)

      window.setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error(error)
      setErrorMessage("Impossible de retirer l'accès.")
    } finally {
      setCompBusy(false)
    }
  }

  if (!user) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 text-center shadow-sm ring-1 ring-bark">
        <p className="text-2xl font-black text-stone-950">
          Connectez-vous pour accéder à l’administration.
        </p>

        <Button to="/auth" className="mt-6">
          Aller à la connexion
        </Button>
      </section>
    )
  }

  if (checkingAdmin) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 shadow-sm ring-1 ring-bark">
        <p className="font-bold text-stone-600">
          Vérification des droits administrateur...
        </p>
      </section>
    )
  }

  if (!isAdmin) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 text-center shadow-sm ring-1 ring-bark">
        <p className="text-3xl font-black text-stone-950">Accès refusé</p>

        <p className="mx-auto mt-3 max-w-xl text-stone-600">
          Cette page est réservée aux administrateurs du carnet de recettes.
        </p>

        <Button to="/" className="mt-6">
          Retour à l’accueil
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="rounded-[2.5rem] bg-cream-50 p-8 shadow-sm ring-1 ring-bark">
        <div className="mb-6 flex w-fit items-center gap-3 rounded-full bg-cream-300 px-4 py-2 text-sm font-bold text-orange-700">
          <span>🛡️</span>
          <span>Mode administrateur</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black leading-tight text-stone-950 md:text-6xl">
              Tableau de bord admin
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              Vous pouvez tout consulter, modifier et supprimer dans le carnet
              de recettes.
            </p>
          </div>

          <Button to="/" variant="secondary">
            Retour au site
          </Button>
        </div>

        {stats && (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-bark">
              <p className="text-4xl font-black text-orange-600">
                {stats.profilesCount}
              </p>
              <p className="mt-1 font-bold text-stone-700">profils</p>
            </div>

            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-bark">
              <p className="text-4xl font-black text-orange-600">
                {stats.recipesCount}
              </p>
              <p className="mt-1 font-bold text-stone-700">recettes</p>
            </div>

            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-bark">
              <p className="text-4xl font-black text-orange-600">
                {stats.reviewsCount}
              </p>
              <p className="mt-1 font-bold text-stone-700">commentaires</p>
            </div>
          </div>
        )}
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

      <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-bark">
        <p className="text-sm font-black uppercase tracking-wide text-orange-600">
          Accès offerts
        </p>

        <h2 className="mt-2 text-2xl font-black text-stone-950">
          Offrir un accès premium
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Débloquez l’accès complet pour un compte, sans paiement (proches,
          testeurs…). La personne doit d’abord avoir créé son compte avec
          l’email indiqué.
        </p>

        <form
          onSubmit={handleGrantComp}
          className="mt-5 flex flex-col gap-2 sm:flex-row"
        >
          <Input
            type="email"
            value={compEmail}
            onChange={(event) => setCompEmail(event.target.value)}
            aria-label="Email du compte"
            placeholder="email@exemple.com"
            wrapperClassName="min-w-0 flex-1"
            className="text-sm"
          />

          <Button type="submit" size="sm" disabled={compBusy}>
            {compBusy ? '...' : "Offrir l'accès"}
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          {compList.length === 0 ? (
            <p className="text-stone-500">Aucun accès offert pour le moment.</p>
          ) : (
            compList.map((access) => (
              <div
                key={access.user_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-cream-50 p-4 ring-1 ring-bark"
              >
                <div className="min-w-0">
                  <p className="truncate font-black text-stone-950">
                    {access.email ?? '(email inconnu)'}
                  </p>

                  <p className="text-xs font-semibold text-stone-500">
                    {access.username ? `${access.username} — ` : ''}
                    Depuis le {formatDate(access.granted_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRevokeComp(access)}
                  disabled={compBusy}
                  className="shrink-0 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Retirer
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <ResourceManager />
    </section>
  )
}
