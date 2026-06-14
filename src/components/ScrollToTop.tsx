import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Remet la vue tout en haut à chaque changement de page (hors ancres internes).
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}
