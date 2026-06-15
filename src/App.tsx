import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import BottomNav from './components/layout/BottomNav'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import PageSkeleton from './components/ui/PageSkeleton'

const HomePage = lazy(() => import('./pages/HomePage'))
const RecipesPage = lazy(() => import('./pages/RecipesPage'))
const RecipeDetailsPage = lazy(() => import('./pages/RecipeDetailsPage'))
const AddRecipePage = lazy(() => import('./pages/AddRecipePage'))
const EditRecipePage = lazy(() => import('./pages/EditRecipePage'))
const MyRecipesPage = lazy(() => import('./pages/MyRecipesPage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const ShoppingListPage = lazy(() => import('./pages/ShoppingListPage'))
const FridgePage = lazy(() => import('./pages/FridgePage'))
const MealPlannerPage = lazy(() => import('./pages/MealPlannerPage'))
const SocialPage = lazy(() => import('./pages/SocialPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const IdeasPage = lazy(() => import('./pages/IdeasPage'))
const ToolsPage = lazy(() => import('./pages/ToolsPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'))
const PaymentCancelPage = lazy(() => import('./pages/PaymentCancelPage'))

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

  if (pathname.startsWith('/pricing') || pathname.startsWith('/payment')) {
    return 'page-background-profile'
  }

  return 'page-background-default'
}

const PAPER_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export default function App() {
  const location = useLocation()
  const pageBackgroundClass = getPageBackgroundClass(location.pathname)

  return (
    <div
      className={`min-h-screen text-slate-900 transition-colors duration-500 ${pageBackgroundClass}`}
    >
      <ScrollToTop />

      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Suspense fallback={<PageSkeleton />}>
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
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/cancel" element={<PaymentCancelPage />} />

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
        </Suspense>
      </main>

      <Footer />

      <div className="pb-[calc(env(safe-area-inset-bottom)+4.5rem)] lg:hidden" />

      <BottomNav />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.04] mix-blend-multiply print:hidden"
        style={{ backgroundImage: PAPER_GRAIN, backgroundSize: '140px 140px' }}
      />
    </div>
  )
}