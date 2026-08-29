import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

/**
 * Bannière discrète « Installer l'application » (PWA).
 *
 * - Android/Chrome : capte `beforeinstallprompt` et déclenche l'invite native.
 * - iOS/Safari : `beforeinstallprompt` n'existe pas → on affiche la marche à
 *   suivre manuelle (Partager → Sur l'écran d'accueil).
 * - Masquée si déjà installée (mode standalone) ou déjà refusée une fois.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'installPromptDismissed'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    try {
      if (localStorage.getItem(DISMISS_KEY)) return
    } catch {
      /* localStorage indisponible : on continue sans mémoire */
    }

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    if (isIos()) setVisible(true)

    const onInstalled = () => {
      setVisible(false)
      try {
        localStorage.setItem(DISMISS_KEY, '1')
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const install = async () => {
    if (isIos()) {
      setShowIosHelp((value) => !value)
      return
    }
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-3 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md lg:inset-x-auto lg:bottom-[calc(1rem+env(safe-area-inset-bottom))] lg:left-1/2 lg:w-[26rem] lg:-translate-x-1/2">
      <div className="rounded-2xl border border-terracotta/15 bg-white/95 p-4 shadow-2xl shadow-terracotta/15 backdrop-blur">
        <div className="flex items-start gap-3">
          <img
            src="/icon-192.png"
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-black text-cacao">
              Installer Carnet de recettes
            </p>
            <p className="mt-0.5 text-xs font-semibold text-cacao/60">
              Ajoute l'app à ton écran d'accueil pour un accès direct, en plein
              écran.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Masquer"
            className="shrink-0 rounded-full p-1 text-cacao/40 transition hover:bg-linen hover:text-cacao/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showIosHelp ? (
          <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-terracotta-soft px-3 py-2.5 text-xs font-semibold text-terracotta-deep">
            Appuie sur
            <Share className="mx-0.5 inline h-3.5 w-3.5" />
            puis « Sur l'écran d'accueil ».
          </p>
        ) : (
          <button
            type="button"
            onClick={install}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-terracotta px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-terracotta/25 transition hover:-translate-y-0.5 hover:bg-terracotta-deep"
          >
            <Download className="h-4 w-4" />
            {isIos() ? 'Comment installer' : "Installer l'application"}
          </button>
        )}
      </div>
    </div>
  )
}
