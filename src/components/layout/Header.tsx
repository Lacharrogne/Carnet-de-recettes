import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/useAuth'
import { supabase } from '../../lib/supabase'
import { getProfile, type UserProfile } from '../../services/profiles'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-full px-4 py-3 text-sm font-bold transition ${
    isActive
      ? 'bg-orange-500 text-white shadow-sm'
      : 'text-stone-800 hover:bg-orange-50 hover:text-orange-600'
  }`

export default function Header() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const userId = user?.id

  useEffect(() => {
    let ignore = false

    if (!userId) {
      return
    }

    getProfile(userId)
      .then((data) => {
        if (!ignore) {
          setProfile(data)
        }
      })
      .catch((error) => {
        console.error(error)
      })

    return () => {
      ignore = true
    }
  }, [userId])

  const activeProfile = userId ? profile : null

  const displayedName =
    activeProfile?.username || user?.email?.split('@')[0] || 'Profil'

  const displayedAvatarUrl = activeProfile?.avatarUrl ?? ''
  const avatarLetter = displayedName.charAt(0).toUpperCase()

  function closeMenu() {
    setMenuOpen(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setProfile(null)
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-orange-100/80 bg-[#fffaf3]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[100rem] items-center justify-between gap-4 px-5 py-2">
        <Link
          to="/"
          onClick={closeMenu}
          className="group flex shrink-0 items-center gap-4"
        >
          <div className="relative h-12 w-20 shrink-0 overflow-visible">
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

        <nav className="hidden items-center gap-1 rounded-full bg-white/70 px-2 py-2 shadow-sm ring-1 ring-orange-100 lg:flex">
          <NavLink to="/" className={navLinkClass}>
            Accueil
          </NavLink>

          <NavLink to="/recipes" className={navLinkClass}>
            Recettes
          </NavLink>

          <NavLink to="/frigo" className={navLinkClass}>
            Mode frigo
          </NavLink>

          {user && (
            <>
              <NavLink to="/my-recipes" className={navLinkClass}>
                Mes recettes
              </NavLink>

              <NavLink to="/favorites" className={navLinkClass}>
                Favoris
              </NavLink>

              <NavLink to="/shopping-list" className={navLinkClass}>
                Liste de courses
              </NavLink>
            </>
          )}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-full bg-[#f4e8dc] px-3 py-2 font-bold text-stone-900 shadow-sm transition hover:bg-orange-50 hover:text-orange-600"
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

                <span className="max-w-28 truncate">{displayedName}</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="whitespace-nowrap rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-bold text-orange-600 transition hover:bg-orange-50"
              >
                Déconnexion
              </button>
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

            <NavLink
              to="/recipes"
              onClick={closeMenu}
              className={navLinkClass}
            >
              Recettes
            </NavLink>

            <NavLink to="/frigo" onClick={closeMenu} className={navLinkClass}>
              Mode frigo
            </NavLink>

            {user && (
              <>
                <NavLink
                  to="/my-recipes"
                  onClick={closeMenu}
                  className={navLinkClass}
                >
                  Mes recettes
                </NavLink>

                <NavLink
                  to="/favorites"
                  onClick={closeMenu}
                  className={navLinkClass}
                >
                  Favoris
                </NavLink>

                <NavLink
                  to="/shopping-list"
                  onClick={closeMenu}
                  className={navLinkClass}
                >
                  Liste de courses
                </NavLink>

                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-2xl bg-[#f4e8dc] px-5 py-3 font-bold text-stone-900 transition hover:bg-orange-50 hover:text-orange-600"
                >
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-orange-500 text-sm font-black text-white ring-2 ring-white">
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

                  <span>{displayedName}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl border border-orange-200 bg-white px-5 py-3 text-left font-bold text-orange-600 transition hover:bg-orange-50"
                >
                  Déconnexion
                </button>
              </>
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