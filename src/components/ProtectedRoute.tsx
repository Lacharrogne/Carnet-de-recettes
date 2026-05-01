import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function ProtectedRoute({
  children,
}: {
  children: ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) return <p>Chargement...</p>

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}