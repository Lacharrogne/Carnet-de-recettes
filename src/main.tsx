import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { initCursor } from './lib/cursorPreference'
import { initTheme } from './lib/themePreference'
import { AuthProvider } from './context/AuthContext'
import FavoritesProvider from './context/FavoritesProvider'
import ToastProvider from './context/ToastProvider'
import { Analytics } from '@vercel/analytics/react'

// Applique les préférences enregistrées (curseur, thème) avant le 1er rendu.
initCursor()
initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <ToastProvider>
            <Analytics />
            <App />
          </ToastProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)