import { Route, Routes } from 'react-router-dom'
import Header from './components/layout/Header'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import RecipesPage from './pages/RecipesPage'
import RecipeDetailsPage from './pages/RecipeDetailsPage'
import AddRecipePage from './pages/AddRecipePage'
import EditRecipePage from './pages/EditRecipePage'
import MyRecipesPage from './pages/MyRecipesPage'
import FavoritesPage from './pages/FavoritesPage'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import PublicProfilePage from './pages/PublicProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import ShoppingListPage from './pages/ShoppingListPage'
import FridgePage from './pages/FridgePage'

export default function App() {
  return (
    <div className="min-h-screen bg-orange-50/40 text-slate-900">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/recipes" element={<RecipesPage />} />

          <Route path="/recipes/:id" element={<RecipeDetailsPage />} />

          <Route path="/frigo" element={<FridgePage />} />

          <Route path="/auth" element={<AuthPage />} />

          <Route path="/shopping-list" element={<ShoppingListPage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="/users/:userId" element={<PublicProfilePage />} />

          <Route
            path="/add-recipe"
            element={
              <ProtectedRoute>
                <AddRecipePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recipes/:id/edit"
            element={
              <ProtectedRoute>
                <EditRecipePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-recipes"
            element={
              <ProtectedRoute>
                <MyRecipesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <section className="rounded-3xl bg-white p-8 text-center shadow-sm">
                <p className="text-2xl font-bold text-slate-900">
                  Page introuvable
                </p>
                <p className="mt-2 text-slate-600">
                  Cette page n’existe pas ou a été déplacée.
                </p>
              </section>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}