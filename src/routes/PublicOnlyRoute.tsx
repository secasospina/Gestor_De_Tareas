/**
 * Ruta solo para visitantes.
 *
 * Login y registro no tienen sentido si el usuario ya inició sesión,
 * así que en ese caso lo enviamos directamente a sus tareas.
 */
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LoadingScreen } from '../components/LoadingScreen'

export function PublicOnlyRoute() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/tasks" replace />

  return <Outlet />
}
