/**
 * Página principal de tareas (ruta protegida).
 *
 * Une todas las piezas: obtiene el usuario (useAuth), sus tareas (useTasks)
 * y se las pasa a los componentes de formulario y lista.
 */
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { logout } from '../services/auth.service'
import { getTaskSummary } from '../utils/tasks'
import { TodoForm } from '../components/TodoForm'
import { TodoList } from '../components/TodoList'

export function TasksPage() {
  const { user } = useAuth()
  const { tasks, loading, error, addTask, editTask, toggleTask, removeTask } = useTasks(user?.uid)
  const [loggingOut, setLoggingOut] = useState(false)

  const summary = getTaskSummary(tasks)

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
          {/* Mostramos el nombre si existe; si no (login sin nombre), el correo. */}
          <span>{user?.displayName ?? user?.email}</span>
          <button type="button" className="btn-secondary" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
          </button>
        </div>
      </header>

      <section className="card" aria-labelledby="new-task-title">
        <h2 id="new-task-title">Nueva tarea</h2>
        <TodoForm onSubmit={addTask} />
      </section>

      {error && (
        <p className="form-error banner" role="alert">
          {error}
        </p>
      )}

      <section className="card" aria-labelledby="list-title">
        <div className="list-header">
          <h2 id="list-title">Lista</h2>
          {!loading && (
            <span className="summary">
              {summary.pending} pendientes · {summary.completed} completadas
            </span>
          )}
        </div>

        {loading ? (
          <p role="status">Cargando tareas...</p>
        ) : (
          <TodoList tasks={tasks} onToggle={toggleTask} onEdit={editTask} onDelete={removeTask} />
        )}
      </section>
    </main>
  )
}
