import { Heart, Leaf, ShieldCheck } from 'lucide-react'

import { BRAND, LINKS } from '../config'

const TRUST_SIGNALS = [
  { icon: Heart, label: 'Fait maison, avec amour' },
  { icon: ShieldCheck, label: 'Sans publicité' },
  { icon: Leaf, label: 'Gratuit pour démarrer' },
]

const NAV_COLUMNS = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalités', href: '#fonctionnalites' },
      { label: 'Comment ça marche', href: '#comment-ca-marche' },
      { label: 'Tarifs', href: '#tarifs' },
      { label: 'Questions', href: '#faq' },
    ],
  },
  {
    title: 'Application',
    links: [
      { label: "Ouvrir l'application", href: LINKS.APP_URL },
      { label: 'Créer un compte', href: LINKS.SIGNUP_URL },
      { label: 'Connexion', href: LINKS.LOGIN_URL },
    ],
  },
  {
    title: 'Informations',
    links: [
      { label: 'Confidentialité', href: LINKS.PRIVACY_URL },
      { label: "Conditions d'utilisation", href: LINKS.TERMS_URL },
      { label: 'Mentions légales', href: LINKS.LEGAL_URL },
      { label: 'Contact', href: `mailto:${LINKS.CONTACT_EMAIL}` },
    ],
  },
]

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="border-t border-bark bg-cream-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={BRAND.logo}
              alt={BRAND.name}
              className="h-11 w-11 object-contain"
            />
            <div>
              <p className="font-display font-black text-espresso">
                {BRAND.name}
              </p>
              <p className="text-sm font-semibold text-hazel">
                {BRAND.tagline}
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-sm text-sm leading-6 text-cacao/80">
            Le carnet de famille qui réunit vos recettes, vos courses et vos
            idées de repas au même endroit. Simple, chaleureux, toujours prêt
            quand vous cuisinez.
          </p>

          <ul className="mt-6 space-y-2">
            {TRUST_SIGNALS.map((signal) => {
              const Icon = signal.icon

              return (
                <li
                  key={signal.label}
                  className="flex items-center gap-2 text-sm font-semibold text-cacao/80"
                >
                  <Icon className="h-4 w-4 text-terracotta" />
                  {signal.label}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {NAV_COLUMNS.map((column) => (
            <nav key={column.title}>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-terracotta">
                {column.title}
              </p>

              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm font-bold text-cacao/80 transition hover:text-terracotta"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-bark/70">
        <p className="mx-auto max-w-6xl px-6 py-4 text-sm text-hazel">
          © {YEAR} — {BRAND.name}
        </p>
      </div>
    </footer>
  )
}
