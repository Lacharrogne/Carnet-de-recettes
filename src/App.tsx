import { Route, Routes, useLocation } from 'react-router-dom'

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
import MealPlannerPage from './pages/MealPlannerPage'
import SocialPage from './pages/SocialPage'
import AdminPage from './pages/AdminPage'
import IdeasPage from './pages/IdeasPage'

function getPageBackgroundClass(pathname: string) {
  if (pathname === '/') {
    return 'page-background-home'
  }

  if (pathname.startsWith('/frigo')) {
    return 'page-background-fridge'
  }

  if (pathname.startsWith('/shopping-list')) {
    return 'page-background-shopping'
  }

  if (pathname.startsWith('/planning')) {
    return 'page-background-planning'
  }

  if (pathname.startsWith('/favorites')) {
    return 'page-background-favorites'
  }

  if (pathname.startsWith('/my-recipes')) {
    return 'page-background-my-recipes'
  }

  if (pathname.startsWith('/add-recipe')) {
    return 'page-background-add-recipe'
  }

  if (pathname.startsWith('/recipes')) {
    return 'page-background-recipes'
  }

  if (pathname.startsWith('/profile') || pathname.startsWith('/users')) {
    return 'page-background-profile'
  }

  if (pathname.startsWith('/auth')) {
    return 'page-background-auth'
  }

  return 'page-background-default'
}

export default function App() {
  const location = useLocation()
  const pageBackgroundClass = getPageBackgroundClass(location.pathname)

  return (
    <div
      className={`min-h-screen text-slate-900 transition-colors duration-500 ${pageBackgroundClass}`}
    >
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailsPage />} />
          <Route path="/frigo" element={<FridgePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/shopping-list" element={<ShoppingListPage />} />
          <Route path="/users/:userId" element={<PublicProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/ideas" element={<IdeasPage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

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
            path="/planning"
            element={
              <ProtectedRoute>
                <MealPlannerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/social"
            element={
              <ProtectedRoute>
                <SocialPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}