import { Link } from 'react-router-dom'

import { APP_NAME, LOGO_SRC } from '../../data/brand'
import { VITRINE_URL, VITRINE_PRICING_URL } from '../../config/site'

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
      { label: 'Boîte à idées', to: '/ideas' },
      { label: 'Mon frigo', to: '/frigo' },
      { label: 'Découvrir', to: '/social' },
    ],
  },
  {
    title: 'Mon carnet',
    links: [
      { label: 'Mes recettes', to: '/my-recipes' },
      { label: 'Mes favoris', to: '/favorites' },
      { label: 'Planning', to: '/planning' },
      { label: 'Liste de courses', to: '/shopping-list' },
      { label: 'Mon profil', to: '/profile' },
    ],
  },
  {
    title: 'Les Carnets',
    links: [
      { label: 'La suite', to: VITRINE_URL },
      { label: 'Tarifs', to: VITRINE_PRICING_URL },
      { label: 'Mon abonnement', to: `${VITRINE_URL}/#hub` },
    ],
  },
]

const TRUST_SIGNALS: { icon: string; label: string }[] = [
  { icon: '❤️', label: 'Fait avec soin' },
  { icon: '🛡️', label: 'Sans publicité' },
  { icon: '✨', label: '14 jours d’essai gratuit' },
]

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-bark bg-cream-50 print:hidden">
      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.2fr_2fr]">
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
            Le carnet de famille qui réunit vos recettes, vos courses et vos
            idées de repas au même endroit. Simple, chaleureux, toujours prêt
            quand vous cuisinez.
          </p>

          <ul className="mt-6 space-y-2">
            {TRUST_SIGNALS.map((signal) => (
              <li
                key={signal.label}
                className="flex items-center gap-2 text-sm font-semibold text-stone-600"
              >
                <span aria-hidden className="text-base">
                  {signal.icon}
                </span>
                {signal.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title}>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-600">
                {section.title}
              </p>

              <ul className="mt-4 space-y-2.5">
                {section.links.map((link, index) =>
                  isExternalLink(link.to) ? (
                    <li key={`${link.label}-${index}`}>
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
                    <li key={`${link.label}-${index}`}>
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

      <div className="border-t border-bark/70">
        <p className="mx-auto max-w-6xl px-6 py-4 text-sm text-stone-500">
          © 2026 — {APP_NAME}
        </p>
      </div>
    </footer>
  )
}
