/**
 * Página principal de tareas (ruta protegida).
 *
 * Por ahora muestra el usuario y el botón de cerrar sesión.
 * En el siguiente paso aquí irá el CRUD de tareas.
 */
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { logout } from '../services/auth.service'

export function TasksPage() {
  const { user } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      // Al cerrar sesión, ProtectedRoute detecta que no hay usuario y redirige a /login.
      await logout()
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <main className="tasks-page">
      <header className="app-header">
        <h1>Mis tareas</h1>
        <div className="user-box">
          {/* Mostramos el nombre si existe; si no (registro sin nombre), el correo. */}
          <span>{user?.displayName ?? user?.email}</span>
          <button type="button" className="btn-secondary" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>
      </header>

      <p>Aquí aparecerá tu lista de tareas.</p>
    </main>
  )
}
