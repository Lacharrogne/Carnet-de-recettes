import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { initCursor } from './lib/cursorPreference'
import { AuthProvider } from './context/AuthContext'
import EntitlementProvider from './context/EntitlementProvider'
import RecipeVisibilityProvider from './context/RecipeVisibilityProvider'
import FavoritesProvider from './context/FavoritesProvider'
import ToastProvider from './context/ToastProvider'
import { Analytics } from '@vercel/analytics/react'

// Applique la préférence de curseur enregistrée avant le premier rendu.
initCursor()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <EntitlementProvider>
          <RecipeVisibilityProvider>
            <FavoritesProvider>
              <ToastProvider>
                <Analytics />
                <App />
              </ToastProvider>
            </FavoritesProvider>
          </RecipeVisibilityProvider>
        </EntitlementProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)