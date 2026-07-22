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
  listResource,
  updateResourceRow,
  type AdminField,
  type AdminResource,
  type AdminRow,
} from '../../services/adminResources'

const PAGE_SIZE = 20

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
    <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
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
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const [rows, setRows] = useState<AdminRow[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
      !window.confirm(
        `Supprimer définitivement cette ligne ?\n\n${label}\n\nLes données liées sont aussi supprimées.`,
      )
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
      !window.confirm(
        `SUPPRIMER LE COMPTE de « ${label} » ?\n\nCela efface son contenu ET son compte de connexion (auth). Action irréversible.`,
      )
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
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          aria-label="Rechercher dans cette table"
          placeholder={
            searchable ? 'Rechercher…' : 'Recherche indisponible pour cette table'
          }
          disabled={!searchable}
          className="min-w-0 flex-1 rounded-2xl border border-orange-100 bg-cream-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || !searchable}
          className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '...' : 'OK'}
        </button>
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
            <tr className="border-b border-orange-100 text-xs font-black uppercase tracking-wide text-stone-500">
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
                  {resource.listColumns.map((column) => {
                    const field = resource.fields.find(
                      (item) => item.name === column,
                    )
                    return (
                      <td
                        key={column}
                        className="px-3 py-2 font-semibold text-stone-800"
                      >
                        {formatValue(field, row[column])}
                      </td>
                    )
                  })}

                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(row)}
                        disabled={busy}
                        className="rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-black text-orange-700 transition hover:bg-orange-50 disabled:opacity-50"
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
            className="rounded-full border border-orange-200 bg-white px-4 py-2 text-orange-700 transition hover:bg-orange-50 disabled:opacity-40"
          >
            ← Précédent
          </button>

          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={page + 1 >= totalPages || loading}
            className="rounded-full border border-orange-200 bg-white px-4 py-2 text-orange-700 transition hover:bg-orange-50 disabled:opacity-40"
          >
            Suivant →
          </button>
        </div>
      </div>

      {editing && (
        <RowEditor
          resource={resource}
          row={editing}
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
  onClose,
  onSaved,
  onError,
}: {
  resource: AdminResource
  row: AdminRow
  onClose: () => void
  onSaved: () => Promise<void>
  onError: (message: string) => void
}) {
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
      <div className="my-8 w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-orange-100">
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
                <p className="break-all rounded-2xl bg-cream-50 px-4 py-3 text-sm font-semibold text-stone-500 ring-1 ring-orange-50">
                  {formatValue(field, row[field.name])}
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
                <select
                  value={String(form[field.name])}
                  onChange={(event) => setField(field.name, event.target.value)}
                  className="w-full rounded-2xl border border-orange-100 bg-cream-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                >
                  {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === 'longtext' || field.type === 'json' ? (
                <textarea
                  value={String(form[field.name])}
                  onChange={(event) => setField(field.name, event.target.value)}
                  rows={field.type === 'json' ? 5 : 3}
                  className="w-full rounded-2xl border border-orange-100 bg-cream-50 px-4 py-3 font-mono text-sm text-stone-800 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={String(form[field.name])}
                  onChange={(event) => setField(field.name, event.target.value)}
                  className="w-full rounded-2xl border border-orange-100 bg-cream-50 px-4 py-3 text-sm font-semibold text-stone-800 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-orange-200 bg-white px-5 py-3 font-black text-stone-700 transition hover:bg-orange-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-orange-500 px-6 py-3 font-black text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
