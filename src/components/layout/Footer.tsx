import { Link } from 'react-router-dom'

import { LOGO_SRC } from '../../data/brand'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-orange-100 bg-cream-50 print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <img
            src={LOGO_SRC}
            alt="Carnet de recettes"
            className="h-10 w-10 object-contain"
          />

          <div>
            <p className="font-black text-stone-950">Carnet de recettes</p>
            <p className="text-sm font-semibold text-stone-500">
              Cuisine maison &amp; petits plats
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-stone-600">
          <Link to="/recipes" className="transition hover:text-orange-600">
            Recettes
          </Link>
          <Link to="/tools" className="transition hover:text-orange-600">
            Outils
          </Link>
          <Link to="/ideas" className="transition hover:text-orange-600">
            Boîte à idées
          </Link>
        </nav>
      </div>

      <div className="border-t border-orange-100/70">
        <p className="mx-auto max-w-6xl px-6 py-4 text-sm text-stone-500">
          © 2026 — Recettes de Chloé &amp; Maxime
        </p>
      </div>
    </footer>
  )
}
