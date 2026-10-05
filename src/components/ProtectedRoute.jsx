import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <main className="auth-loading">Cargando tu sesión…</main>
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />
}
