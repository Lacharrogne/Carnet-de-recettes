/*
 * Service worker « maison » (sans dépendance).
 * Objectifs : app installable + chargement hors-ligne de la coquille, mise en
 * cache des assets statiques et des images, sans jamais mettre en cache les
 * réponses de données/authentification (Supabase).
 */
const VERSION = 'v1'
const SHELL_CACHE = `carnet-shell-${VERSION}`
const ASSET_CACHE = `carnet-assets-${VERSION}`
const IMAGE_CACHE = `carnet-images-${VERSION}`

// Coquille minimale mise en cache dès l'installation.
const SHELL_URLS = ['/', '/index.html', '/favicon.svg', '/logo.png', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL_CACHE, ASSET_CACHE, IMAGE_CACHE])
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

function isImageRequest(request, url) {
  return (
    request.destination === 'image' ||
    /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  // On ne gère que les GET ; le reste (POST/PATCH auth Supabase) passe au réseau.
  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)
  const sameOrigin = url.origin === self.location.origin

  // Navigations (SPA) : réseau d'abord, repli sur la coquille en cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then((cached) => cached || caches.match('/')),
      ),
    )
    return
  }

  // Données Supabase (REST/Realtime/Auth) : toujours réseau, jamais de cache.
  if (!sameOrigin && /supabase\.(co|in)/.test(url.hostname) && !isImageRequest(request, url)) {
    return
  }

  // Images (y compris le stockage Supabase) : cache d'abord, sinon réseau.
  if (isImageRequest(request, url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone())
              return response
            })
            .catch(() => cached)
          return cached || network
        }),
      ),
    )
    return
  }

  // Assets statiques du build (hachés) : stale-while-revalidate.
  if (sameOrigin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone())
              return response
            })
            .catch(() => cached)
          return cached || network
        }),
      ),
    )
  }
})
