import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Skeleton } from '../components/ui/Skeleton'
import { LOGO_SRC } from '../data/brand'
import {
  buildShoppingLines,
  getCurrentDateLabel,
  groupLinesByCategory,
  type ShoppingLine,
  type ShoppingSection,
} from '../lib/shoppingAggregation'
import { useAuth } from '../context/useAuth'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import {
  addShoppingListItem,
  deleteAllShoppingListItems,
  deleteCheckedShoppingListItems,
  deleteShoppingListItem,
  getShoppingListItems,
  type ShoppingListItem,
  updateShoppingListItemChecked,
} from '../services/shoppingList'

export default function ShoppingListPage() {
  useDocumentTitle('Liste de courses')
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [newItemText, setNewItemText] = useState('')
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)

  const [adding, setAdding] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showCheckedItems, setShowCheckedItems] = useState(true)

  useEffect(() => {
    let ignore = false

    if (!userId) {
      return () => {
        ignore = true
      }
    }

    getShoppingListItems()
      .then((data) => {
        if (!ignore) {
          setItems(data)
          setLoadedUserId(userId)
          setErrorMessage('')
        }
      })
      .catch((error) => {
        console.error(error)

        if (!ignore) {
          setItems([])
          setLoadedUserId(userId)
          setErrorMessage('Impossible de charger la liste de courses.')
        }
      })

    return () => {
      ignore = true
    }
  }, [userId])

  const visibleItems = useMemo(
    () => (userId && loadedUserId === userId ? items : []),
    [userId, loadedUserId, items],
  )

  const activeItems = useMemo(() => {
    return visibleItems.filter((item) => !item.checked)
  }, [visibleItems])

  const checkedItems = useMemo(() => {
    return visibleItems.filter((item) => item.checked)
  }, [visibleItems])

  const activeLines = useMemo(() => {
    return buildShoppingLines(activeItems)
  }, [activeItems])

  const checkedLines = useMemo(() => {
    return buildShoppingLines(checkedItems)
  }, [checkedItems])

  const activeSections = useMemo(() => {
    return groupLinesByCategory(activeLines)
  }, [activeLines])

  const checkedSections = useMemo(() => {
    return groupLinesByCategory(checkedLines)
  }, [checkedLines])

  const activeCategoryCount = useMemo(() => {
    return activeSections.length
  }, [activeSections])

  const loading = !!userId && loadedUserId !== userId

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanedText = newItemText.trim()

    if (!cleanedText) {
      setErrorMessage('Écris un ingrédient avant de l’ajouter.')
      return
    }

    try {
      setAdding(true)
      setErrorMessage('')
      setSuccessMessage('')

      const createdItem = await addShoppingListItem(cleanedText)

      setItems((currentItems) => [createdItem, ...currentItems])
      setNewItemText('')
      setSuccessMessage('Ingrédient ajouté à ta liste de courses.')
    } catch (error) {
      console.error(error)
      setSuccessMessage('')
      setErrorMessage('Impossible d’ajouter cet ingrédient.')
    } finally {
      setAdding(false)
    }
  }

  async function handleToggleLine(line: ShoppingLine) {
    try {
      setBulkActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      const nextCheckedValue = !line.checked

      const updatedItems = await Promise.all(
        line.items.map((item) =>
          updateShoppingListItemChecked(item.id, nextCheckedValue),
        ),
      )

      setItems((currentItems) =>
        currentItems.map((currentItem) => {
          const updatedItem = updatedItems.find(
            (item) => item.id === currentItem.id,
          )

          return updatedItem ?? currentItem
        }),
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de modifier cet ingrédient.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  async function handleToggleSection(section: ShoppingSection, checked: boolean) {
    try {
      setBulkActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      const sectionItems = section.lines.flatMap((line) => line.items)

      const updatedItems = await Promise.all(
        sectionItems.map((item) =>
          updateShoppingListItemChecked(item.id, checked),
        ),
      )

      setItems((currentItems) =>
        currentItems.map((currentItem) => {
          const updatedItem = updatedItems.find(
            (item) => item.id === currentItem.id,
          )

          return updatedItem ?? currentItem
        }),
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de modifier ce rayon.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  async function handleDeleteLine(line: ShoppingLine) {
    const confirmDelete = window.confirm(
      `Supprimer "${line.displayText}" de la liste de courses ?`,
    )

    if (!confirmDelete) {
      return
    }

    try {
      setBulkActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      await Promise.all(line.items.map((item) => deleteShoppingListItem(item.id)))

      const deletedIds = new Set(line.items.map((item) => item.id))

      setItems((currentItems) =>
        currentItems.filter((item) => !deletedIds.has(item.id)),
      )
    } catch (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer cet ingrédient.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  async function handleDeleteCheckedItems() {
    if (checkedItems.length === 0) {
      return
    }

    const confirmDelete = window.confirm(
      'Supprimer tous les ingrédients cochés ?',
    )

    if (!confirmDelete) {
      return
    }

    try {
      setBulkActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      await deleteCheckedShoppingListItems()

      setItems((currentItems) =>
        currentItems.filter((currentItem) => !currentItem.checked),
      )

      setSuccessMessage('Les ingrédients cochés ont été supprimés.')
    } catch (error) {
      console.error(error)
      setSuccessMessage('')
      setErrorMessage('Impossible de supprimer les ingrédients cochés.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  async function handleDeleteAllItems() {
    if (visibleItems.length === 0) {
      return
    }

    const confirmDelete = window.confirm(
      'Voulez-vous vraiment vider toute la liste de courses ?',
    )

    if (!confirmDelete) {
      return
    }

    try {
      setBulkActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      await deleteAllShoppingListItems()

      setItems([])
      setSuccessMessage('La liste de courses a été vidée.')
    } catch (error) {
      console.error(error)
      setSuccessMessage('')
      setErrorMessage('Impossible de vider la liste de courses.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  if (!user) {
    return (
      <section className="rounded-[2rem] bg-white px-6 py-10 text-center shadow-sm ring-1 ring-orange-100">
        <p className="text-2xl font-black text-stone-950">
          Connecte-toi pour voir ta liste de courses.
        </p>

        <p className="mx-auto mt-3 max-w-xl text-stone-600">
          Ta liste de courses est liée à ton compte pour pouvoir la retrouver
          plus tard.
        </p>

        <Link
          to="/auth"
          className="mt-6 inline-flex rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600"
        >
          Aller à la connexion
        </Link>
      </section>
    )
  }

  return (
    <>
      <style>
        {`
          .print-shopping-list {
            display: none;
          }

          @media print {
            @page {
              size: A4;
              margin: 12mm;
            }

            html,
            body {
              background: white !important;
            }

            header,
            footer,
            .screen-shopping-list {
              display: none !important;
            }

            .print-shopping-list {
              display: block !important;
              color: #1c1917 !important;
              font-family: Arial, sans-serif !important;
            }

            .print-shopping-list * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .print-no-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      <section className="screen-shopping-list space-y-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2.5rem] bg-cream-50 p-8 shadow-sm ring-1 ring-orange-100">
            <div className="mb-6 flex w-fit items-center gap-3 rounded-full bg-cream-300 px-4 py-2 text-sm font-bold text-orange-700">
              <span>🛒</span>
              <span>Liste de courses</span>
            </div>

            <h1 className="text-4xl font-black leading-tight text-stone-950 md:text-6xl">
              Fais tes courses sans rien oublier.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
              Les ingrédients ajoutés depuis les recettes et le planning se
              regroupent ici par rayon. Les doublons sont fusionnés pour garder
              une liste simple à lire.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
                <p className="text-3xl font-black text-orange-600">
                  {activeLines.length}
                </p>

                <p className="mt-1 text-sm font-bold text-stone-700">lignes</p>
              </div>

              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
                <p className="text-3xl font-black text-green-700">
                  {checkedLines.length}
                </p>

                <p className="mt-1 text-sm font-bold text-stone-700">
                  cochées
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100">
                <p className="text-3xl font-black text-stone-900">
                  {activeCategoryCount}
                </p>

                <p className="mt-1 text-sm font-bold text-stone-700">rayons</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handlePrint}
                disabled={visibleItems.length === 0}
                className="rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Imprimer la liste
              </button>

              <button
                type="button"
                onClick={() => setShowCheckedItems((current) => !current)}
                className="rounded-full border border-orange-200 bg-white px-6 py-3 font-bold text-orange-700 transition hover:bg-orange-50"
              >
                {showCheckedItems ? 'Masquer les cochés' : 'Afficher les cochés'}
              </button>

              <button
                type="button"
                onClick={handleDeleteCheckedItems}
                disabled={checkedItems.length === 0 || bulkActionLoading}
                className="rounded-full border border-orange-100 bg-white px-6 py-3 font-bold text-stone-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Supprimer les cochés
              </button>

              <button
                type="button"
                onClick={handleDeleteAllItems}
                disabled={visibleItems.length === 0 || bulkActionLoading}
                className="rounded-full border border-red-100 bg-white px-6 py-3 font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Vider la liste
              </button>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
            <p className="text-sm font-black uppercase tracking-wide text-orange-600">
              Ajouter rapidement
            </p>

            <h2 className="mt-2 text-3xl font-black text-stone-950">
              Ajouter un ingrédient
            </h2>

            <p className="mt-2 text-stone-600">
              Pratique pour ajouter ce qui ne vient pas directement d’une
              recette.
            </p>

            <form onSubmit={handleAddItem} className="mt-6 flex flex-col gap-3">
              <input
                value={newItemText}
                onChange={(event) => {
                  setNewItemText(event.target.value)
                  setErrorMessage('')
                  setSuccessMessage('')
                }}
                placeholder="Exemple : 6 œufs, 500 g pâtes, lait..."
                className="rounded-[1.5rem] border border-orange-100 bg-cream-50 px-5 py-4 font-semibold text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              />

              <button
                type="submit"
                disabled={adding}
                className="rounded-full bg-orange-500 px-6 py-4 font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adding ? 'Ajout en cours...' : 'Ajouter à la liste'}
              </button>
            </form>

            <div className="mt-6 rounded-[1.5rem] bg-orange-50 p-5 text-sm leading-7 text-orange-900">
              <p className="font-black">Astuce</p>

              <p>
                Si tu ajoutes plusieurs fois la même recette dans le planning,
                les quantités se regroupent ici automatiquement.
              </p>
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

        {loading ? (
          <div className="space-y-3 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100 sm:p-8">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-[2.5rem] bg-white p-10 text-center shadow-sm ring-1 ring-orange-100">
            <p className="text-5xl">🧺</p>

            <h2 className="mt-4 text-3xl font-black text-stone-950">
              Ta liste est vide.
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-stone-600">
              Ajoute un ingrédient manuellement, ou ajoute une recette depuis le
              planning pour générer automatiquement les courses.
            </p>

            <Link
              to="/recipes"
              className="mt-6 inline-flex rounded-full bg-orange-500 px-6 py-3 font-black text-white shadow-sm transition hover:bg-orange-600"
            >
              Parcourir les recettes
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-orange-100">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                    À acheter
                  </p>

                  <h2 className="text-3xl font-black text-stone-950">
                    Courses restantes
                  </h2>
                </div>

                <p className="rounded-full bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
                  {activeLines.length} ligne{activeLines.length > 1 ? 's' : ''}
                </p>
              </div>

              {activeSections.length === 0 ? (
                <div className="rounded-[1.5rem] bg-green-50 p-6 text-green-800">
                  <p className="font-black">Tout est coché.</p>

                  <p className="mt-1 text-sm">
                    Tu peux supprimer les ingrédients cochés ou garder
                    l’historique pour le moment.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {activeSections.map((section) => (
                    <article
                      key={section.category}
                      className="rounded-[2rem] bg-cream-50 p-5 shadow-sm ring-1 ring-orange-100"
                    >
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-2xl">{section.categoryEmoji}</p>

                          <h3 className="mt-1 text-xl font-black text-stone-950">
                            {section.category}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleSection(section, true)}
                          disabled={bulkActionLoading}
                          className="rounded-full bg-white px-4 py-2 text-sm font-black text-green-700 shadow-sm ring-1 ring-green-100 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cocher le rayon
                        </button>
                      </div>

                      <div className="space-y-2">
                        {section.lines.map((line) => (
                          <div
                            key={line.key}
                            className="flex items-center gap-3 rounded-[1.25rem] bg-white px-4 py-3 shadow-sm ring-1 ring-orange-50"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleLine(line)}
                              disabled={bulkActionLoading}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-200 text-sm font-black text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Cocher ${line.displayText}`}
                            >
                              ✓
                            </button>

                            <div className="min-w-0 flex-1">
                              <p className="font-black text-stone-900">
                                {line.displayText}
                              </p>

                              {line.items.length > 1 && (
                                <p className="mt-0.5 text-xs font-semibold text-stone-500">
                                  {line.items.length} ajouts regroupés
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteLine(line)}
                              disabled={bulkActionLoading}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-black text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Supprimer ${line.displayText}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {showCheckedItems && checkedSections.length > 0 && (
              <section className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-green-100">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-green-700">
                      Déjà pris
                    </p>

                    <h2 className="text-3xl font-black text-stone-950">
                      Ingrédients cochés
                    </h2>
                  </div>

                  <p className="rounded-full bg-green-50 px-4 py-2 text-sm font-black text-green-700">
                    {checkedLines.length} ligne
                    {checkedLines.length > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  {checkedSections.map((section) => (
                    <article
                      key={section.category}
                      className="rounded-[2rem] bg-green-50 p-5 ring-1 ring-green-100"
                    >
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-2xl">{section.categoryEmoji}</p>

                          <h3 className="mt-1 text-xl font-black text-stone-950">
                            {section.category}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleSection(section, false)}
                          disabled={bulkActionLoading}
                          className="rounded-full bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remettre le rayon
                        </button>
                      </div>

                      <div className="space-y-2">
                        {section.lines.map((line) => (
                          <div
                            key={line.key}
                            className="flex items-center gap-3 rounded-[1.25rem] bg-white px-4 py-3 text-sm shadow-sm"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleLine(line)}
                              disabled={bulkActionLoading}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-black text-green-700 transition hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Remettre ${line.displayText}`}
                            >
                              ↩
                            </button>

                            <div className="min-w-0 flex-1">
                              <p className="font-black text-stone-500 line-through decoration-green-600/60">
                                {line.displayText}
                              </p>

                              {line.items.length > 1 && (
                                <p className="mt-0.5 text-xs font-semibold text-stone-400">
                                  {line.items.length} ajouts regroupés
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteLine(line)}
                              disabled={bulkActionLoading}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-black text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Supprimer ${line.displayText}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </section>

      <section className="print-shopping-list">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src={LOGO_SRC}
            alt="Carnet de recettes"
            style={{
              width: 58,
              height: 58,
              objectFit: 'contain',
              borderRadius: 18,
            }}
          />

          <div>
            <p
              style={{
                margin: 0,
                color: '#ea580c',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Carnet de recettes
            </p>

            <h1
              style={{
                margin: '4px 0 0',
                fontSize: 30,
                lineHeight: 1.1,
                fontWeight: 900,
              }}
            >
              Liste de courses
            </h1>

            <p style={{ margin: '6px 0 0', color: '#57534e', fontSize: 12 }}>
              Imprimée le {getCurrentDateLabel()}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginTop: 22,
            paddingTop: 16,
            borderTop: '1px solid #fed7aa',
          }}
        >
          <div
            style={{
              border: '1px solid #fed7aa',
              borderRadius: 14,
              padding: 12,
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#ea580c',
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              {activeLines.length}
            </p>

            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700 }}>
              lignes à acheter
            </p>
          </div>

          <div
            style={{
              border: '1px solid #fed7aa',
              borderRadius: 14,
              padding: 12,
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#166534',
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              {checkedLines.length}
            </p>

            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700 }}>
              lignes cochées
            </p>
          </div>

          <div
            style={{
              border: '1px solid #fed7aa',
              borderRadius: 14,
              padding: 12,
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#1c1917',
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              {activeCategoryCount}
            </p>

            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700 }}>
              rayons
            </p>
          </div>
        </div>

        <div style={{ marginTop: 26 }}>
          <p
            style={{
              margin: 0,
              color: '#ea580c',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            À acheter
          </p>

          <h2
            style={{
              margin: '4px 0 14px',
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            Liste organisée par rayon
          </h2>

          {activeSections.length === 0 ? (
            <div
              style={{
                border: '1px solid #bbf7d0',
                borderRadius: 14,
                padding: 16,
                color: '#166534',
                fontWeight: 800,
              }}
            >
              Tout est déjà coché.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              {activeSections.map((section) => (
                <div
                  key={section.category}
                  className="print-no-break"
                  style={{
                    border: '1px solid #fed7aa',
                    borderRadius: 16,
                    padding: 14,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: '#ea580c',
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {section.categoryEmoji} {section.category}
                  </p>

                  <ul
                    style={{
                      margin: '10px 0 0',
                      paddingLeft: 18,
                      color: '#1c1917',
                      fontSize: 14,
                      lineHeight: 1.8,
                      fontWeight: 700,
                    }}
                  >
                    {section.lines.map((line) => (
                      <li key={line.key}>□ {line.displayText}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {checkedSections.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <p
              style={{
                margin: 0,
                color: '#166534',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Déjà pris
            </p>

            <h2
              style={{
                margin: '4px 0 14px',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              Ingrédients cochés
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              {checkedSections.map((section) => (
                <div
                  key={section.category}
                  className="print-no-break"
                  style={{
                    border: '1px solid #bbf7d0',
                    borderRadius: 14,
                    padding: 12,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: '#166534',
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {section.categoryEmoji} {section.category}
                  </p>

                  <ul
                    style={{
                      margin: '10px 0 0',
                      paddingLeft: 18,
                      color: '#57534e',
                      fontSize: 13,
                      lineHeight: 1.7,
                      fontWeight: 700,
                      textDecoration: 'line-through',
                    }}
                  >
                    {section.lines.map((line) => (
                      <li key={line.key}>☑ {line.displayText}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  )
}
