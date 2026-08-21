/**
 * Stockage de session Supabase partagé entre les sous-domaines de la suite
 * (vitrine + recettes/budget/sport sur `*.lescarnets.app`).
 *
 * Par défaut, Supabase stocke la session dans `localStorage`, isolé par
 * origine → pas de partage entre sous-domaines. Ici, on la stocke dans des
 * cookies posés sur le domaine racine `.lescarnets.app`, donc lisibles par
 * tous les sous-domaines : un seul login = connecté partout (SSO).
 *
 * ⚠️ Ne s'active QUE sur `lescarnets.app` (et sous-domaines). En local ou sur
 * `*.vercel.app`, on retombe sur le comportement par défaut (localStorage) :
 * aucun risque de casse tant que les apps ne sont pas sur le domaine racine.
 */

const ROOT_DOMAIN = 'lescarnets.app'
const COOKIE_DOMAIN = '.lescarnets.app'
// Marge sous la limite ~4096 octets d'un cookie (nom + attributs compris).
const MAX_CHUNK = 3000
const MAX_AGE = 400 * 24 * 60 * 60 // ~400 jours (plafond navigateur)

/** L'app est-elle servie depuis le domaine racine de la suite ? */
export function isSharedDomain(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === ROOT_DOMAIN || host.endsWith('.' + ROOT_DOMAIN)
}

function readCookie(name: string): string | null {
  const prefix = name + '='
  const found = document.cookie
    .split('; ')
    .find((part) => part.startsWith(prefix))
  return found ? found.slice(prefix.length) : null
}

function writeCookie(name: string, value: string): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${value}; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=0; SameSite=Lax`
}

function removeItem(key: string): void {
  const meta = readCookie(key)
  const count = meta ? parseInt(meta, 10) : 0
  const total = Number.isNaN(count) ? 0 : count
  // On efface un peu au-delà par sécurité (au cas où un ancien état plus long).
  for (let i = 0; i < Math.max(total, 8); i += 1) {
    clearCookie(`${key}.${i}`)
  }
  clearCookie(key)
}

function getItem(key: string): string | null {
  const meta = readCookie(key)
  if (meta === null) return null

  const count = parseInt(meta, 10)
  if (Number.isNaN(count)) return null

  let encoded = ''
  for (let i = 0; i < count; i += 1) {
    const part = readCookie(`${key}.${i}`)
    if (part === null) return null
    encoded += part
  }

  try {
    return decodeURIComponent(encoded)
  } catch {
    return null
  }
}

function setItem(key: string, value: string): void {
  removeItem(key)

  const encoded = encodeURIComponent(value)
  const chunks: string[] = []
  for (let i = 0; i < encoded.length; i += MAX_CHUNK) {
    chunks.push(encoded.slice(i, i + MAX_CHUNK))
  }
  if (chunks.length === 0) chunks.push('')

  writeCookie(key, String(chunks.length))
  chunks.forEach((chunk, i) => writeCookie(`${key}.${i}`, chunk))
}

/** Adaptateur de stockage compatible avec l'option `auth.storage` de Supabase. */
export const sharedAuthStorage = { getItem, setItem, removeItem }
