import { Link } from 'react-router-dom'
import { Heart, Leaf, ShieldCheck } from 'lucide-react'

import { APP_NAME, LOGO_SRC } from '../../data/brand'
import { VITRINE_PRICING_URL } from '../../config/site'

type FooterLink = { label: string; to: string }

function isExternalLink(to: string) {
  return to.startsWith('http')
}

const FOOTER_SECTIONS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Explorer',
    links: [
      { label: 'Recettes', to: '/recipes' },
      { label: 'Outils', to: '/tools' },
      { label: 'Tarifs', to: VITRINE_PRICING_URL },
      { label: 'Boîte à idées', to: '/ideas' },
      { label: 'Mon frigo', to: '/frigo' },
    ],
  },
  {
    title: 'Mon carnet',
    links: [
      { label: 'Mes recettes', to: '/my-recipes' },
      { label: 'Mes favoris', to: '/favorites' },
      { label: 'Planning', to: '/planning' },
      { label: 'Liste de courses', to: '/shopping-list' },
    ],
  },
  {
    title: 'La communauté',
    links: [
      { label: 'Découvrir', to: '/social' },
      { label: 'Mon profil', to: '/profile' },
    ],
  },
]

const TRUST_SIGNALS: { icon: typeof Heart; label: string }[] = [
  { icon: Heart, label: 'Fait maison, avec amour' },
  { icon: ShieldCheck, label: 'Sans publicité' },
  { icon: Leaf, label: 'Gratuit, sans engagement' },
]

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-orange-100 bg-cream-50 print:hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={LOGO_SRC}
              alt="Carnet de recettes"
              className="h-11 w-11 object-contain"
            />

            <div>
              <p className="font-black text-stone-950">Carnet de recettes</p>
              <p className="text-sm font-semibold text-stone-500">
                Cuisine maison &amp; petits plats
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-sm text-sm leading-6 text-stone-600">
            Le carnet de famille qui réunit tes recettes, tes courses et tes
            idées de repas au même endroit. Simple, chaleureux, toujours prêt
            quand tu cuisines.
          </p>

          <ul className="mt-6 space-y-2">
            {TRUST_SIGNALS.map((signal) => {
              const Icon = signal.icon

              return (
                <li
                  key={signal.label}
                  className="flex items-center gap-2 text-sm font-semibold text-stone-600"
                >
                  <Icon className="h-4 w-4 text-orange-500" />
                  {signal.label}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title}>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-600">
                {section.title}
              </p>

              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) =>
                  isExternalLink(link.to) ? (
                    <li key={link.to}>
                      <a
                        href={link.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-stone-600 transition hover:text-orange-600"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm font-bold text-stone-600 transition hover:text-orange-600"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-orange-100/70">
        <p className="mx-auto max-w-6xl px-6 py-4 text-sm text-stone-500">
          © 2026 — {APP_NAME}
        </p>
      </div>
    </footer>
  )
}
