/**
 * Ruta protegida.
 *
 * Solo deja ver las rutas hijas si hay un usuario autenticado.
 * Si no hay sesión, redirige a /login.
 */
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LoadingScreen } from './LoadingScreen'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  // Mientras Firebase verifica la sesión no redirigimos, para no expulsar
  // a un usuario que sí tiene sesión guardada.
  if (loading) return <LoadingScreen />

  // replace evita que la ruta protegida quede en el historial del navegador.
  if (!user) return <Navigate to="/login" replace />

  // Outlet muestra la ruta hija que corresponda (por ejemplo, /tasks).
  return <Outlet />
}
