import { useState } from 'react'
import { Menu, X } from 'lucide-react'

import { BRAND, LINKS } from '../config'
import Button from './Button'

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Comment ça marche', href: '#comment-ca-marche' },
  { label: 'Tarifs', href: '#tarifs' },
  { label: 'Questions', href: '#faq' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-bark/60 bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        {/* Marque */}
        <a href="#top" className="flex items-center gap-2.5">
          <img
            src={BRAND.logo}
            alt={BRAND.name}
            className="h-10 w-10 object-contain"
          />
          <span className="font-display text-lg font-black text-espresso">
            {BRAND.name}
          </span>
        </a>

        {/* Liens desktop */}
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-bold text-cacao/80 transition hover:text-terracotta"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA desktop */}
        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={LINKS.LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-cacao/80 transition hover:text-terracotta"
          >
            Connexion
          </a>
          <Button href={LINKS.SIGNUP_URL} size="md">
            Commencer
          </Button>
        </div>

        {/* Burger mobile */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-espresso ring-1 ring-bark lg:hidden"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="border-t border-bark/60 bg-card px-5 py-4 lg:hidden">
          <nav className="grid gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 font-bold text-cacao transition hover:bg-linen"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mt-3 grid gap-2">
            <Button href={LINKS.SIGNUP_URL} size="lg" fullWidth>
              Commencer gratuitement
            </Button>
            <Button
              href={LINKS.LOGIN_URL}
              variant="secondary"
              size="lg"
              fullWidth
            >
              Connexion
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
