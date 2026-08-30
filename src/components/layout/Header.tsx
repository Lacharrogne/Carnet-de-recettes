import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { LOGO_SRC } from '../../data/brand'
import { useAuth } from '../../context/useAuth'
import { useEntitlement } from '../../lib/useEntitlement'
import { SUBSCRIPTION_HUB_URL } from '../../config/subscription'
import { VITRINE_URL } from '../../config/site'
import { RECIPE_CATEGORIES } from '../../data/recipeOptions'
import { supabase } from '../../lib/supabase'
import { getProfile, type UserProfile } from '../../services/profiles'

function PlusIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

type DropdownName = 'recipes' | 'tools' | 'profile' | null

type NavLinkItem = {
  label: string
  description: string
  to: string
  emoji: string
  /** Réservé à l'abonnement (affiche un cadenas une fois l'essai terminé). */
  premium?: boolean
}

const personalLinks: NavLinkItem[] = [
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
    description: 'Voir et modifier vos recettes',
    to: '/my-recipes',
    emoji: '📖',
    premium: true,
  },
  {
    label: 'Mes collections',
    description: 'Vos dossiers de recettes par thème',
    to: '/collections',
    emoji: '🗂️',
    premium: true,
  },
  {
    label: 'Favoris',
    description: 'Retrouver vos recettes préférées',
    to: '/favorites',
    emoji: '❤️',
    premium: true,
  },
]

const toolLinks: NavLinkItem[] = [
  {
    label: 'Mode frigo',
    description: 'Trouver une recette avec ce que vous avez',
    to: '/frigo',
    emoji: '🥕',
    premium: true,
  },
  {
    label: 'Liste de courses',
    description: 'Regrouper les ingrédients à acheter',
    to: '/shopping-list',
    emoji: '🛒',
    premium: true,
  },
  {
    label: 'Planning',
    description: 'Organiser les repas de la semaine',
    to: '/planning',
    emoji: '📅',
    premium: true,
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
      ? 'bg-terracotta-soft text-terracotta-deep'
      : 'text-cacao hover:bg-linen hover:text-terracotta'
  }`
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  navPillClass(isActive)

function mobileNavClass(isActive: boolean) {
  return `flex items-center justify-between rounded-2xl px-4 py-4 text-base font-bold shadow-soft ring-1 transition ${
    isActive
      ? 'bg-terracotta-soft text-terracotta-deep ring-terracotta-soft'
      : 'bg-card text-espresso ring-bark hover:bg-linen'
  }`
}

const mobileLinkClass =
  'rounded-2xl bg-cream-50 px-4 py-3.5 font-bold text-cacao transition hover:bg-linen'

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
  const { hasAccess } = useEntitlement()
  const locked = !hasAccess

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
    <header className="sticky top-0 z-50 border-b border-bark/80 bg-cream-50/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-5">
        <Link
          to="/"
          onClick={closeMenu}
          className="group flex min-w-0 items-center gap-3 sm:gap-5"
        >
          <div className="relative h-12 w-12 shrink-0 overflow-visible sm:h-14 sm:w-14">
            <img
              src={LOGO_SRC}
              alt="Logo Carnet de recettes"
              className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-lg transition group-hover:-rotate-2 group-hover:scale-105 sm:h-[4.5rem] sm:w-[4.5rem]"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate font-display text-xl font-black leading-tight text-espresso sm:text-2xl">
              Carnet de recettes
            </p>

            <p className="hidden truncate text-sm font-semibold text-hazel sm:block">
              Cuisine maison & petits plats
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full bg-white/70 px-2 py-2 shadow-sm ring-1 ring-bark lg:flex">
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
              <div className="rounded-[2rem] bg-white p-4 shadow-xl ring-1 ring-bark">
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
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream-200 text-2xl transition group-hover/item:scale-105">
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
              <div className="rounded-[2rem] bg-white p-4 shadow-xl ring-1 ring-bark">
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
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream-200 text-2xl transition group-hover/item:scale-105">
                          {link.emoji}
                        </span>

                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate font-black text-stone-950">
                            {link.label}
                            {locked && link.premium && (
                              <span aria-hidden="true" className="text-xs">
                                🔒
                              </span>
                            )}
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
          <a
            href={VITRINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Découvrir toute la suite Les Carnets"
            className="inline-flex items-center gap-2 rounded-full bg-cream-300 px-4 py-2.5 text-sm font-bold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 hover:text-orange-600"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
              <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
              <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
              <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
            </svg>
            Les Carnets
          </a>

          {user ? (
            <>
              <Link
                to="/add-recipe"
                onClick={closeDropdowns}
                aria-label="Ajouter une recette"
                className={`group inline-flex items-center gap-2.5 rounded-full py-2.5 pl-2.5 pr-5 font-black text-white transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 ${
                  isAddRecipeActive
                    ? 'bg-orange-600 shadow-md shadow-orange-600/30 ring-2 ring-orange-300'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-sm shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700 hover:shadow-md hover:shadow-orange-500/30'
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition duration-200 group-hover:rotate-90">
                  <PlusIcon />
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
                  className="flex items-center gap-3 rounded-full bg-cream-300 px-4 py-2 font-bold text-stone-900 shadow-sm transition hover:bg-orange-50 hover:text-orange-600"
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
                  <div className="rounded-[2rem] bg-white p-4 shadow-xl ring-1 ring-bark">
                    <div className="mb-3 rounded-[1.5rem] bg-cream-50 p-3 ring-1 ring-bark">
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
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cream-200 text-xl transition group-hover/item:scale-105">
                              {link.emoji}
                            </span>

                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 truncate font-black text-stone-950">
                                {link.label}
                                {locked && link.premium && (
                                  <span aria-hidden="true" className="text-xs">
                                    🔒
                                  </span>
                                )}
                              </p>

                              <p className="truncate text-xs font-semibold text-stone-500">
                                {link.description}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}

                      <a
                        href={SUBSCRIPTION_HUB_URL}
                        onClick={closeDropdowns}
                        className="group/item rounded-2xl p-2.5 transition hover:bg-orange-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cream-200 text-xl transition group-hover/item:scale-105">
                            💎
                          </span>

                          <div className="min-w-0">
                            <p className="truncate font-black text-stone-950">
                              Abonnement
                            </p>

                            <p className="truncate text-xs font-semibold text-stone-500">
                              S'abonner ou gérer sur Les Carnets
                            </p>
                          </div>
                        </div>
                      </a>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-2 rounded-2xl bg-card ring-1 ring-bark p-2.5 text-left transition hover:bg-orange-50"
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
                              Quitter votre compte
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
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-bark bg-white text-2xl font-black text-stone-900 shadow-sm transition hover:bg-orange-50 lg:hidden"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="min-h-[calc(100dvh-68px)] max-h-[calc(100dvh-68px)] overflow-y-auto border-t border-bark bg-cream-50 px-4 py-5 shadow-xl lg:hidden">
          {/* Fondu épinglé en haut : le contenu qui défile se fond dans le
              crème au lieu d'être coupé net sous l'en-tête. */}
          <div
            aria-hidden="true"
            className="pointer-events-none sticky top-0 z-10 -mx-4 -mt-5 h-6 bg-gradient-to-b from-cream-50 to-transparent"
          />
          <nav className="mx-auto grid grid-cols-1 max-w-7xl gap-3 pb-4">
            <NavLink
              to="/"
              onClick={closeMenu}
              className={({ isActive }) => mobileNavClass(isActive)}
            >
              <span>🏠 Accueil</span>
              <span>→</span>
            </NavLink>

            {user && (
              <Link
                to="/add-recipe"
                onClick={closeMenu}
                className={`flex items-center justify-between rounded-2xl px-4 py-4 font-black text-white shadow-sm transition ${
                  isAddRecipeActive
                    ? 'bg-orange-600 ring-2 ring-orange-300'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <PlusIcon className="h-5 w-5" />
                  </span>
                  Ajouter une recette
                </span>

                <span aria-hidden="true">→</span>
              </Link>
            )}

            <details
              open={isRecipesActive}
              className="rounded-[1.5rem] bg-white p-3 shadow-sm ring-1 ring-bark [&>summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between rounded-2xl px-2 py-2 font-black text-stone-900">
                <span>📖 Recettes</span>
                <span className="text-stone-400">▾</span>
              </summary>

              <div className="mt-3 grid grid-cols-1 gap-2">
                <Link
                  to="/recipes"
                  onClick={closeMenu}
                  className="rounded-2xl bg-orange-500 px-4 py-3.5 font-black text-white shadow-sm"
                >
                  Toutes les catégories
                </Link>

                {RECIPE_CATEGORIES.map((category) => (
                  <Link
                    key={category.value}
                    to={`/recipes?category=${encodeURIComponent(
                      category.value,
                    )}`}
                    onClick={closeMenu}
                    className={mobileLinkClass}
                  >
                    <span className="mr-2">{category.emoji}</span>
                    {category.label}
                  </Link>
                ))}
              </div>
            </details>

            <details
              open={isToolsActive}
              className="rounded-[1.5rem] bg-white p-3 shadow-sm ring-1 ring-bark [&>summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between rounded-2xl px-2 py-2 font-black text-stone-900">
                <span>🧰 Outils</span>
                <span className="text-stone-400">▾</span>
              </summary>

              <div className="mt-3 grid grid-cols-1 gap-2">
                <Link
                  to="/tools"
                  onClick={closeMenu}
                  className="rounded-2xl bg-orange-500 px-4 py-3.5 font-black text-white shadow-sm"
                >
                  Tous les outils
                </Link>

                {toolLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={closeMenu}
                    className="rounded-2xl bg-cream-50 px-4 py-3.5 transition hover:bg-orange-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cream-200 text-xl">
                        {link.emoji}
                      </span>

                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-black text-stone-900">
                          {link.label}
                          {locked && link.premium && (
                            <span aria-hidden="true" className="text-xs">
                              🔒
                            </span>
                          )}
                        </p>

                        <p className="truncate text-sm font-semibold text-stone-500">
                          {link.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </details>

            {user ? (
              <details className="rounded-[1.5rem] bg-white p-3 shadow-sm ring-1 ring-bark [&>summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between rounded-2xl px-2 py-2 font-black text-stone-900">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-500 text-sm font-black text-white ring-2 ring-white">
                      {displayedAvatarUrl ? (
                        <img
                          src={displayedAvatarUrl}
                          alt={displayedName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        avatarLetter
                      )}
                    </span>

                    <span className="min-w-0 truncate">{displayedName}</span>
                  </span>

                  <span className="text-stone-400">▾</span>
                </summary>

                <div className="mt-3 grid grid-cols-1 gap-2">
                  {personalLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={closeMenu}
                      className="rounded-2xl bg-cream-50 px-4 py-3.5 transition hover:bg-orange-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cream-200 text-xl">
                          {link.emoji}
                        </span>

                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-black text-stone-900">
                            {link.label}
                            {locked && link.premium && (
                              <span aria-hidden="true" className="text-xs">
                                🔒
                              </span>
                            )}
                          </p>

                          <p className="truncate text-sm font-semibold text-stone-500">
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}

                  <a
                    href={SUBSCRIPTION_HUB_URL}
                    onClick={closeMenu}
                    className="rounded-2xl bg-cream-50 px-4 py-3.5 transition hover:bg-orange-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cream-200 text-xl">
                        💎
                      </span>

                      <div className="min-w-0">
                        <p className="font-black text-stone-900">Abonnement</p>

                        <p className="truncate text-sm font-semibold text-stone-500">
                          S'abonner ou gérer sur Les Carnets
                        </p>
                      </div>
                    </div>
                  </a>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-left font-black text-red-700 transition hover:bg-red-100"
                  >
                    🚪 Déconnexion
                  </button>
                </div>
              </details>
            ) : (
              <NavLink
                to="/auth"
                onClick={closeMenu}
                className={({ isActive }) => mobileNavClass(isActive)}
              >
                <span>👤 Connexion</span>
                <span>→</span>
              </NavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}