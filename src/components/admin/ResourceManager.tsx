import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import {
  ADMIN_RESOURCES,
  deleteAuthUser,
  deleteResourceRow,
  fetchRecipeLabels,
  fetchUserLabels,
  listResource,
  updateResourceRow,
  type AdminField,
  type AdminResource,
  type AdminRow,
} from '../../services/adminResources'
import Button from '../ui/Button'
import { useDialogs } from '../../context/dialogContext'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'

const PAGE_SIZE = 20

/** Colonnes qui référencent un utilisateur (résolues en pseudo). */
const USER_REF_COLUMNS = new Set(['user_id', 'follower_id', 'following_id'])
/** Colonnes qui référencent une recette (résolues en titre). */
const RECIPE_REF_COLUMNS = new Set(['recipe_id'])

function formatValue(field: AdminField | undefined, value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (Array.isArray(value)) return `[${value.length}]`
  if (typeof value === 'object') return JSON.stringify(value)

  const text = String(value)

  if (field?.type === 'readonly' && /\d{4}-\d{2}-\d{2}T/.test(text)) {
    return new Date(text).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  return text.length > 48 ? `${text.slice(0, 48)}…` : text
}

function toFormValue(field: AdminField, value: unknown): string | boolean {
  if (field.type === 'boolean') return Boolean(value)
  if (value === null || value === undefined) return ''
  if (field.type === 'json') return JSON.stringify(value, null, 2)
  return String(value)
}

type FormState = Record<string, string | boolean>

function buildForm(resource: AdminResource, row: AdminRow): FormState {
  const form: FormState = {}
  for (const field of resource.fields) {
    form[field.name] = toFormValue(field, row[field.name])
  }
  return form
}

export default function ResourceManager() {
  const [activeKey, setActiveKey] = useState(ADMIN_RESOURCES[0].key)

  const resource =
    ADMIN_RESOURCES.find((item) => item.key === activeKey) ?? ADMIN_RESOURCES[0]

  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-bark">
      <p className="text-sm font-black uppercase tracking-wide text-orange-600">
        Base de données
      </p>

      <h2 className="mt-2 text-2xl font-black text-stone-950">
        Tout voir, modifier, supprimer
      </h2>

      <div className="mt-5 flex flex-wrap gap-2">
        {ADMIN_RESOURCES.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveKey(item.key)}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${
              item.key === activeKey
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-cream-100 text-stone-700 hover:bg-orange-50'
            }`}
          >
            <span className="mr-1.5">{item.emoji}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* La `key` force un remontage complet à chaque changement d'onglet :
          aucun état (lignes, page, recherche) ne peut fuiter d'une table à l'autre. */}
      <ResourceTable key={resource.key} resource={resource} />
    </section>
  )
}

function ResourceTable({ resource }: { resource: AdminResource }) {
  const { confirm } = useDialogs()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const [rows, setRows] = useState<AdminRow[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [userLabels, setUserLabels] = useState<Record<string, string>>({})
  const [recipeLabels, setRecipeLabels] = useState<Record<number, string>>({})

  const [editing, setEditing] = useState<AdminRow | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listResource(resource, {
        search,
        page,
        pageSize: PAGE_SIZE,
      })
      setRows(result.rows)
      setCount(result.count)
      setError('')

      // Résout les identifiants affichés en pseudos / titres.
      const userIds: string[] = []
      const recipeIds: number[] = []
      for (const row of result.rows) {
        for (const column of resource.listColumns) {
          const value = row[column]
          if (USER_REF_COLUMNS.has(column) && typeof value === 'string') {
            userIds.push(value)
          }
          if (RECIPE_REF_COLUMNS.has(column) && value != null) {
            recipeIds.push(Number(value))
          }
        }
      }

      const [users, recipes] = await Promise.all([
        fetchUserLabels(userIds),
        fetchRecipeLabels(recipeIds),
      ])
      setUserLabels(users)
      setRecipeLabels(recipes)
    } catch (loadError) {
      console.error(loadError)
      setError('Impossible de charger cette table.')
    } finally {
      setLoading(false)
    }
  }, [resource, search, page])

  useEffect(() => {
    async function run() {
      await refresh()
    }

    void run()
  }, [refresh])

  function flash(message: string) {
    setSuccess(message)
    window.setTimeout(() => setSuccess(''), 3000)
  }

  async function handleDelete(row: AdminRow) {
    const label = resource.listColumns
      .map((column) => formatValue(undefined, row[column]))
      .join(' · ')

    if (
      !(await confirm({
        title: 'Supprimer définitivement',
        message: `Supprimer définitivement « ${label} » ? Les données liées sont aussi supprimées.`,
        confirmLabel: 'Supprimer',
        tone: 'danger',
      }))
    ) {
      return
    }

    try {
      setBusy(true)
      setError('')
      await deleteResourceRow(resource, row)
      flash('Ligne supprimée.')
      await refresh()
    } catch (deleteError) {
      console.error(deleteError)
      setError(
        deleteError instanceof Error && deleteError.message
          ? deleteError.message
          : 'Suppression impossible.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteAuth(row: AdminRow) {
    const label = String(row.username ?? row.user_id)

    if (
      !(await confirm({
        title: 'Supprimer le compte',
        message: `Supprimer le compte de « ${label} » ? Cela efface son contenu ET son compte de connexion. Action irréversible.`,
        confirmLabel: 'Supprimer le compte',
        tone: 'danger',
      }))
    ) {
      return
    }

    try {
      setBusy(true)
      setError('')
      await deleteAuthUser(String(row.user_id))
      flash('Compte supprimé.')
      await refresh()
    } catch (deleteError) {
      console.error(deleteError)
      setError(
        deleteError instanceof Error && deleteError.message
          ? deleteError.message
          : 'Suppression du compte impossible.',
      )
    } finally {
      setBusy(false)
    }
  }

  function renderCell(column: string, value: unknown) {
    if (
      USER_REF_COLUMNS.has(column) &&
      typeof value === 'string' &&
      userLabels[value]
    ) {
      return (
        <span title={value} className="text-orange-800">
          {userLabels[value]}
        </span>
      )
    }

    if (RECIPE_REF_COLUMNS.has(column) && value != null) {
      const title = recipeLabels[Number(value)]
      if (title) {
        return (
          <span title={String(value)} className="text-orange-800">
            {title}
          </span>
        )
      }
    }

    const field = resource.fields.find((item) => item.name === column)
    return formatValue(field, value)
  }

  const searchable = resource.searchColumns.length > 0 || Boolean(resource.numericSearch)
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setPage(0)
          setSearch(searchInput)
        }}
        className="mt-5 flex gap-2"
      >
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          aria-label="Rechercher dans cette table"
          placeholder={
            searchable ? 'Rechercher…' : 'Recherche indisponible pour cette table'
          }
          disabled={!searchable}
          wrapperClassName="min-w-0 flex-1"
          className="text-sm disabled:opacity-50"
        />

        <Button type="submit" size="sm" disabled={loading || !searchable}>
          {loading ? '...' : 'OK'}
        </Button>
      </form>

      {success && (
        <p className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          {success}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-bark text-xs font-black uppercase tracking-wide text-stone-500">
              {resource.listColumns.map((column) => (
                <th key={column} className="px-3 py-2">
                  {column}
                </th>
              ))}
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={resource.listColumns.length + 1}
                  className="px-3 py-8 text-center text-stone-500"
                >
                  Chargement…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={resource.listColumns.length + 1}
                  className="px-3 py-8 text-center text-stone-500"
                >
                  Aucune ligne.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-orange-50 hover:bg-cream-50"
                >
                  {resource.listColumns.map((column) => (
                    <td
                      key={column}
                      className="px-3 py-2 font-semibold text-stone-800"
                    >
                      {renderCell(column, row[column])}
                    </td>
                  ))}

                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(row)}
                        disabled={busy}
                        className="rounded-full bg-card ring-1 ring-bark px-3 py-1.5 text-xs font-black text-orange-700 transition hover:bg-orange-50 disabled:opacity-50"
                      >
                        Éditer
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        disabled={busy}
                        className="rounded-full border border-red-100 bg-white px-3 py-1.5 text-xs font-black text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Suppr.
                      </button>

                      {resource.authDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAuth(row)}
                          disabled={busy}
                          title="Supprimer aussi le compte de connexion (auth)"
                          className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                          Compte
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm font-bold text-stone-600">
        <span>
          {count} ligne{count > 1 ? 's' : ''} · page {page + 1} / {totalPages}
        </span>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0 || loading}
            className="rounded-full bg-card ring-1 ring-bark px-4 py-2 text-orange-700 transition hover:bg-orange-50 disabled:opacity-40"
          >
            ← Précédent
          </button>

          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={page + 1 >= totalPages || loading}
            className="rounded-full bg-card ring-1 ring-bark px-4 py-2 text-orange-700 transition hover:bg-orange-50 disabled:opacity-40"
          >
            Suivant →
          </button>
        </div>
      </div>

      {editing && (
        <RowEditor
          resource={resource}
          row={editing}
          userLabels={userLabels}
          recipeLabels={recipeLabels}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            flash('Ligne enregistrée.')
            await refresh()
          }}
          onError={(message) => setError(message)}
        />
      )}
    </>
  )
}

function RowEditor({
  resource,
  row,
  userLabels,
  recipeLabels,
  onClose,
  onSaved,
  onError,
}: {
  resource: AdminResource
  row: AdminRow
  userLabels: Record<string, string>
  recipeLabels: Record<number, string>
  onClose: () => void
  onSaved: () => Promise<void>
  onError: (message: string) => void
}) {
  function readonlyDisplay(field: AdminField): string {
    const value = row[field.name]

    if (
      USER_REF_COLUMNS.has(field.name) &&
      typeof value === 'string' &&
      userLabels[value]
    ) {
      return `${userLabels[value]} · ${value}`
    }

    if (RECIPE_REF_COLUMNS.has(field.name) && value != null) {
      const title = recipeLabels[Number(value)]
      if (title) {
        return `${title} · ${String(value)}`
      }
    }

    return formatValue(field, value)
  }

  const [form, setForm] = useState<FormState>(() => buildForm(resource, row))
  const [saving, setSaving] = useState(false)

  function setField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const patch: Record<string, unknown> = {}

    try {
      for (const field of resource.fields) {
        if (field.type === 'readonly') continue

        const raw = form[field.name]

        if (field.rpc === 'role') {
          if (raw !== toFormValue(field, row[field.name])) {
            patch[field.name] = raw
          }
          continue
        }

        if (field.type === 'boolean') {
          patch[field.name] = Boolean(raw)
        } else if (field.type === 'number') {
          const text = String(raw).trim()
          if (text !== '' && Number.isNaN(Number(text))) {
            throw new Error(`Nombre invalide pour « ${field.label} ».`)
          }
          patch[field.name] = text === '' ? null : Number(text)
        } else if (field.type === 'json') {
          const text = String(raw).trim()
          patch[field.name] = text === '' ? null : JSON.parse(text)
        } else {
          patch[field.name] = String(raw)
        }
      }
    } catch (parseError) {
      onError(
        parseError instanceof Error
          ? parseError.message
          : 'Valeur invalide dans le formulaire.',
      )
      return
    }

    try {
      setSaving(true)
      await updateResourceRow(resource, row, patch)
      await onSaved()
    } catch (saveError) {
      console.error(saveError)
      onError(
        saveError instanceof Error && saveError.message
          ? saveError.message
          : 'Enregistrement impossible.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-stone-900/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-bark">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-black text-stone-950">
            Éditer — {resource.label}
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full bg-cream-100 px-3 py-1 font-black text-stone-600 transition hover:bg-orange-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {resource.fields.map((field) => (
            <div key={field.name}>
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-stone-500">
                {field.label}
              </label>

              {field.type === 'readonly' ? (
                <p className="break-all rounded-2xl bg-cream-50 px-4 py-3 text-sm font-semibold text-stone-500 ring-1 ring-bark/60">
                  {readonlyDisplay(field)}
                </p>
              ) : field.type === 'boolean' ? (
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-stone-700">
                  <input
                    type="checkbox"
                    checked={Boolean(form[field.name])}
                    onChange={(event) => setField(field.name, event.target.checked)}
                    className="h-5 w-5 accent-orange-500"
                  />
                  {form[field.name] ? 'Oui' : 'Non'}
                </label>
              ) : field.type === 'select' ? (
                <Select
                  value={String(form[field.name])}
                  onChange={(event) => setField(field.name, event.target.value)}
                  aria-label={field.label}
                  className="text-sm"
                >
                  {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              ) : field.type === 'longtext' || field.type === 'json' ? (
                <Textarea
                  value={String(form[field.name])}
                  onChange={(event) => setField(field.name, event.target.value)}
                  rows={field.type === 'json' ? 5 : 3}
                  aria-label={field.label}
                  className="font-mono text-sm"
                />
              ) : (
                <Input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={String(form[field.name])}
                  onChange={(event) => setField(field.name, event.target.value)}
                  aria-label={field.label}
                  className="text-sm"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>

            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
