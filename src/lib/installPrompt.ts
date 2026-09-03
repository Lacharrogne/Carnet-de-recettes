/**
 * Capture de l'événement `beforeinstallprompt` AU CHARGEMENT de la page.
 *
 * Chrome/Edge (desktop comme Android) déclenchent cet événement très tôt,
 * souvent avant que React n'ait monté la bannière d'installation. Si on
 * n'écoute qu'au montage du composant, l'événement est raté et rien ne
 * propose l'installation (typiquement sur PC). On l'écoute donc dès le
 * chargement du module (importé tôt dans main.tsx) et on mémorise l'événement.
 */

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Émis quand l'installation devient disponible (ou après installation). */
export const INSTALL_AVAILABILITY_EVENT = 'pwa-install-availability'

let deferredPrompt: BeforeInstallPromptEvent | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Empêche la mini-infobar par défaut : on gère l'invite nous-mêmes.
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    window.dispatchEvent(new Event(INSTALL_AVAILABILITY_EVENT))
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    window.dispatchEvent(new Event(INSTALL_AVAILABILITY_EVENT))
  })
}

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt
}

export function clearDeferredPrompt(): void {
  deferredPrompt = null
}
