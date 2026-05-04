import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/useAuth'
import { RECIPE_CATEGORIES } from '../../data/recipeOptions'
import { supabase } from '../../lib/supabase'
import { getProfile, type UserProfile } from '../../services/profiles'

type DropdownName = 'recipes' | 'tools' | 'profile' | null

const personalLinks = [
  {
    label: 'Mon profil',
    description: 'Avatar, pseudo et présentation',
    to: '/profile',
    emoji: '👤',
  },
  {
    label: 'Mes relations',
    description: 'Amis, abonnés et abonnements',
    to: '/social',
    emoji: '👥',
  },
  {
    label: 'Mes recettes',
    description: 'Voir et modifier tes recettes',
    to: '/my-recipes',
    emoji: '📖',
  },
  {
    label: 'Favoris',
    description: 'Retrouver tes recettes préférées',
    to: '/favorites',
    emoji: '❤️',
  },
]

const toolLinks = [
  {
    label: 'Mode frigo',
    description: 'Trouver une recette avec ce que tu as',
    to: '/frigo',
    emoji: '🥕',
  },
  {
    label: 'Liste de courses',
    description: 'Regrouper les ingrédients à acheter',
    to: '/shopping-list',
    emoji: '🛒',
  },
  {
    label: 'Planning',
    description: 'Organiser les repas de la semaine',
    to: '/planning',
    emoji: '📅',
  },
  {
    label: 'Boîte à idées',
    description: 'Proposer une amélioration pour le site',
    to: '/ideas',
    emoji: '💡',
  },
]

function navPillClass(isActive: boolean) {
  return `rounded-full px-5 py-3 text-sm font-bold transition ${
    isActive
      ? 'bg-orange-500 text-white shadow-sm'
      : 'text-stone-800 hover:bg-orange-50 hover:text-orange-600'
  }`
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  navPillClass(isActive)

function dropdownPanelClass(
  isOpen: boolean,
  width = 'w-[420px]',
  align = 'left-1/2 -translate-x-1/2',
) {
  return `absolute ${align} top-full z-50 pt-3 ${width} transition duration-150 ${
    isOpen
      ? 'pointer-events-auto translate-y-0 opacity-100'
      : 'pointer-events-none -translate-y-1 opacity-0'
  }`
}

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<DropdownName>(null)

  const [profileState, setProfileState] = useState<{
    userId: string
    profile: UserProfile | null
  } | null>(null)

  const userId = user?.id ?? null

  const profile =
    userId && profileState?.userId === userId ? profileState.profile : null

  const isRecipesActive = location.pathname.startsWith('/recipes')

  const isToolsActive =
    location.pathname.startsWith('/tools') ||
    location.pathname.startsWith('/frigo') ||
    location.pathname.startsWith('/shopping-list') ||
    location.pathname.startsWith('/planning') ||
    location.pathname.startsWith('/ideas')

  const isAddRecipeActive = location.pathname.startsWith('/add-recipe')

  useEffect(() => {
    let ignore = false

    if (!userId) {
      return () => {
        ignore = true
      }
    }

    getProfile(userId)
      .then((data) => {
        if (!ignore) {
          setProfileState({
            userId,
            profile: data,
          })
        }
      })
      .catch((error) => {
        console.error(error)
      })

    return () => {
      ignore = true
    }
  }, [userId])

  const displayedName =
    profile?.username || user?.email?.split('@')[0] || 'Profil'

  const displayedAvatarUrl = profile?.avatarUrl ?? ''
  const avatarLetter = displayedName.charAt(0).toUpperCase()

  function closeDropdowns() {
    setOpenDropdown(null)
  }

  function closeMenu() {
    setMenuOpen(false)
    setOpenDropdown(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setProfileState(null)
    setMenuOpen(false)
    setOpenDropdown(null)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-orange-100/80 bg-[#fffaf3]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2">
        <Link
          to="/"
          onClick={closeMenu}
          className="group flex items-center gap-6"
        >
          <div className="relative h-12 w-24 shrink-0 overflow-visible">
            <img
              src="/ChatGPT Image 1 mai 2026, 04_35_16.png"
              alt="Logo Carnet de recettes"
              className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-lg transition group-hover:-rotate-2 group-hover:scale-105 lg:h-32 lg:w-32"
            />
          </div>

          <div>
            <p className="text-2xl font-black leading-tight text-stone-950">
              Carnet de recettes
            </p>

            <p className="text-sm font-semibold text-stone-500">
              Cuisine maison & petits plats
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full bg-white/70 px-2 py-2 shadow-sm ring-1 ring-orange-100 lg:flex">
          <NavLink to="/" onClick={closeDropdowns} className={navLinkClass}>
            Accueil
          </NavLink>

          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('recipes')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <NavLink
              to="/recipes"
              onClick={closeDropdowns}
              className={() => navPillClass(isRecipesActive)}
            >
              Recettes
            </NavLink>

            <div
              className={dropdownPanelClass(
                openDropdown === 'recipes',
                'w-[520px]',
              )}
            >
              <div className="rounded-[2rem] bg-white p-4 shadow-xl ring-1 ring-orange-100">
                <div className="mb-3 flex items-center justify-between gap-4 px-2">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                      Recettes
                    </p>

                    <p className="text-sm font-semibold text-stone-500">
                      Parcourir le carnet par catégorie
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {RECIPE_CATEGORIES.map((category) => (
                    <Link
                      key={category.value}
                      to={`/recipes?category=${encodeURIComponent(
                        category.value,
                      )}`}
                      onClick={closeDropdowns}
                      className="group/item rounded-2xl p-3 transition hover:bg-orange-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff1e6] text-2xl transition group-hover/item:scale-105">
                          {category.emoji}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate font-black text-stone-950">
                            {category.label}
                          </p>

                          <p className="truncate text-xs font-semibold text-stone-500">
                            Voir les recettes
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            className="relative"
            onMouseEnter={() => setOpenDropdown('tools')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <NavLink
              to="/tools"
              onClick={closeDropdowns}
              className={() => navPillClass(isToolsActive)}
            >
              Outils
            </NavLink>

            <div
              className={dropdownPanelClass(
                openDropdown === 'tools',
                'w-[430px]',
              )}
            >
              <div className="rounded-[2rem] bg-white p-4 shadow-xl ring-1 ring-orange-100">
                <div className="mb-3 px-2">
                  <p className="text-sm font-black uppercase tracking-wide text-orange-600">
                    Outils du carnet
                  </p>

                  <p className="text-sm font-semibold text-stone-500">
                    Frigo, courses, planning et idées
                  </p>
                </div>

                <div className="grid gap-1">
                  {toolLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={closeDropdowns}
                      className="group/item rounded-2xl p-3 transition hover:bg-orange-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff1e6] text-2xl transition group-hover/item:scale-105">
                          {link.emoji}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate font-black text-stone-950">
                            {link.label}
                          </p>

                          <p className="truncate text-xs font-semibold text-stone-500">
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link
                to="/add-recipe"
                onClick={closeDropdowns}
                className={`group flex items-center gap-3 rounded-full px-4 py-2 font-black shadow-sm ring-1 transition ${
                  isAddRecipeActive
                    ? 'bg-orange-500 text-white ring-orange-200'
                    : 'bg-[#f4e8dc] text-stone-900 ring-orange-100 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-xl font-black ring-2 ring-white transition group-hover:scale-105 ${
                    isAddRecipeActive
                      ? 'bg-white/20 text-white'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  +
                </span>

                <span className="whitespace-nowrap">Ajouter une recette</span>
              </Link>

              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown('profile')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  to="/profile"
                  onClick={closeDropdowns}
                  className="flex items-center gap-3 rounded-full bg-[#f4e8dc] px-4 py-2 font-bold text-stone-900 shadow-sm transition hover:bg-orange-50 hover:text-orange-600"
                >
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-orange-500 text-sm font-black text-white ring-2 ring-white">
                    {displayedAvatarUrl ? (
                      <img
                        src={displayedAvatarUrl}
                        alt={displayedName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      avatarLetter
                    )}
                  </div>

                  <span className="max-w-32 truncate">{displayedName}</span>
                  <span className="text-xs text-stone-500">▾</span>
                </Link>

                <div
                  className={dropdownPanelClass(
                    openDropdown === 'profile',
                    'w-[390px]',
                    'right-0',
                  )}
                >
                  <div className="rounded-[2rem] bg-white p-4 shadow-xl ring-1 ring-orange-100">
                    <div className="mb-3 rounded-[1.5rem] bg-[#fffaf3] p-3 ring-1 ring-orange-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-orange-500 text-lg font-black text-white ring-2 ring-white">
                          {displayedAvatarUrl ? (
                            <img
                              src={displayedAvatarUrl}
                              alt={displayedName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            avatarLetter
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-base font-black text-stone-950">
                            {displayedName}
                          </p>

                          <p className="truncate text-xs font-semibold text-stone-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-1">
                      {personalLinks.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={closeDropdowns}
                          className="group/item rounded-2xl p-2.5 transition hover:bg-orange-50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff1e6] text-xl transition group-hover/item:scale-105">
                              {link.emoji}
                            </span>

                            <div className="min-w-0">
                              <p className="truncate font-black text-stone-950">
                                {link.label}
                              </p>

                              <p className="truncate text-xs font-semibold text-stone-500">
                                {link.description}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-2 rounded-2xl border border-orange-200 bg-white p-2.5 text-left transition hover:bg-orange-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-xl">
                            🚪
                          </span>

                          <div>
                            <p className="font-black text-red-700">
                              Déconnexion
                            </p>

                            <p className="text-xs font-semibold text-stone-500">
                              Quitter ton compte
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <NavLink to="/auth" className={navLinkClass}>
              Connexion
            </NavLink>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-2xl font-bold text-stone-900 shadow-sm lg:hidden"
          aria-label="Ouvrir le menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-orange-100 bg-[#fffaf3] px-5 py-5 lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-3">
            <NavLink to="/" onClick={closeMenu} className={navLinkClass}>
              Accueil
            </NavLink>

            <details className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-orange-100 [&>summary::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer rounded-xl px-2 py-2 font-black text-stone-900">
                Recettes
              </summary>

              <div className="mt-2 grid gap-2">
                <Link
                  to="/recipes?view=all"
                  onClick={closeMenu}
                  className="rounded-2xl bg-orange-500 px-4 py-3 font-black text-white"
                >
                  📖 Toutes les recettes
                </Link>

                {RECIPE_CATEGORIES.map((category) => (
                  <Link
                    key={category.value}
                    to={`/recipes?category=${encodeURIComponent(
                      category.value,
                    )}`}
                    onClick={closeMenu}
                    className="rounded-2xl bg-[#fffaf3] px-4 py-3 font-bold text-stone-800"
                  >
                    {category.emoji} {category.label}
                  </Link>
                ))}
              </div>
            </details>

            <details className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-orange-100 [&>summary::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer rounded-xl px-2 py-2 font-black text-stone-900">
                Outils
              </summary>

              <div className="mt-2 grid gap-2">
                <Link
                  to="/tools"
                  onClick={closeMenu}
                  className="rounded-2xl bg-orange-500 px-4 py-3 font-black text-white"
                >
                  🧰 Tous les outils
                </Link>

                {toolLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={closeMenu}
                    className="rounded-2xl bg-[#fffaf3] px-4 py-3 font-bold text-stone-800"
                  >
                    {link.emoji} {link.label}
                  </Link>
                ))}
              </div>
            </details>

            {user && (
              <details className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-orange-100 [&>summary::-webkit-details-marker]:hidden">
                <summary className="cursor-pointer rounded-xl px-2 py-2 font-black text-stone-900">
                  {displayedName}
                </summary>

                <div className="mt-2 grid gap-2">
                  {personalLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={closeMenu}
                      className="rounded-2xl bg-[#fffaf3] px-4 py-3 font-bold text-stone-800"
                    >
                      {link.emoji} {link.label}
                    </Link>
                  ))}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-2xl border border-orange-200 bg-white px-4 py-3 text-left font-black text-orange-600"
                  >
                    🚪 Déconnexion
                  </button>
                </div>
              </details>
            )}

            {!user && (
              <NavLink
                to="/auth"
                onClick={closeMenu}
                className={navLinkClass}
              >
                Connexion
              </NavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}