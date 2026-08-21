import { Link, NavLink } from 'react-router-dom'

import { useAuth } from '../../context/useAuth'
import { useEntitlement } from '../../lib/useEntitlement'

type Tab = {
  to: string
  emoji: string
  label: string
  end?: boolean
  premium?: boolean
}

/** Petit cadenas d'angle sur une entrée premium verrouillée. */
function LockDot() {
  return (
    <span
      aria-hidden="true"
      className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-espresso text-[0.55rem] text-white shadow-soft"
    >
      🔒
    </span>
  )
}

function tabClass({ isActive }: { isActive: boolean }) {
  return `flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] font-bold transition ${
    isActive ? 'text-terracotta' : 'text-hazel hover:text-cacao'
  }`
}

// Barre d'onglets fixe, mobile uniquement : l'accès rapide "vraie app".
export default function BottomNav() {
  const { user } = useAuth()
  const { hasAccess } = useEntitlement()
  const locked = !hasAccess

  const leftTabs: Tab[] = [
    { to: '/', emoji: '🏠', label: 'Accueil', end: true },
    { to: '/recipes', emoji: '📖', label: 'Recettes' },
  ]

  const rightTabs: Tab[] = [
    { to: '/shopping-list', emoji: '🛒', label: 'Courses', premium: true },
    { to: user ? '/profile' : '/auth', emoji: '👤', label: 'Profil' },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-bark bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden print:hidden">
      <div className="mx-auto flex max-w-md items-end justify-around px-2">
        {leftTabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={tabClass}>
            <span className="relative text-xl">
              {tab.emoji}
              {locked && tab.premium && <LockDot />}
            </span>
            <span>{tab.label}</span>
          </NavLink>
        ))}

        <Link
          to="/add-recipe"
          className="flex flex-1 flex-col items-center"
          aria-label="Ajouter une recette"
        >
          <span className="relative -mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta text-3xl font-light leading-none text-white shadow-lift ring-4 ring-card transition hover:bg-terracotta-deep">
            +
            {locked && <LockDot />}
          </span>
          <span className="mt-1 text-[0.65rem] font-bold text-hazel">
            Ajouter
          </span>
        </Link>

        {rightTabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={tabClass}>
            <span className="relative text-xl">
              {tab.emoji}
              {locked && tab.premium && <LockDot />}
            </span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
