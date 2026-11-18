/**
 * Página principal de tareas (ruta protegida).
 *
 * Une todas las piezas: obtiene el usuario (useAuth), sus tareas (useTasks)
 * y se las pasa a los componentes de formulario, progreso y lista.
 */
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTasks } from '../hooks/useTasks'
import { useEmailVerification } from '../hooks/useEmailVerification'
import { logout } from '../services/auth.service'
import { sendTasksSummary } from '../services/email.service'
import { getTaskSummary } from '../utils/tasks'
import { TodoForm } from '../components/TodoForm'
import { TodoList } from '../components/TodoList'
import { ProgressBar } from '../components/ProgressBar'
import { ThemeToggle } from '../components/ThemeToggle'
import { EmailVerificationNotice } from '../components/EmailVerificationNotice'
import { LogOutIcon, LogoIcon, MailIcon } from '../components/icons'

export function TasksPage() {
  const { user } = useAuth()
  const { tasks, loading, error, addTask, editTask, toggleTask, removeTask } = useTasks(user?.uid)
  // Estado del correo en AWS SES (si ya puede recibir resúmenes).
  const verification = useEmailVerification(user?.uid)
  const [loggingOut, setLoggingOut] = useState(false)
  // Estado del envío del resumen por email: si está enviando y el último resultado.
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ ok: boolean; text: string } | null>(null)

  const summary = getTaskSummary(tasks)
  // Nombre visible: el del perfil si existe; si no, el correo.
  const displayName = user?.displayName ?? user?.email ?? ''
  // Primer nombre para el saludo y la inicial para el avatar.
  const firstName = displayName.split(' ')[0]
  const initial = displayName.charAt(0).toUpperCase()

  async function handleLogout() {
    setLoggingOut(true)
    try {
      // Al cerrar sesión, ProtectedRoute detecta que no hay usuario y redirige a /login.
      await logout()
    } catch {
      setLoggingOut(false)
    }
  }

  /** Envía el resumen de tareas al correo del usuario (vía /api/send-summary). */
  async function handleSendSummary() {
    setSendingEmail(true)
    setEmailStatus(null)
    try {
      const message = await sendTasksSummary(tasks)
      setEmailStatus({ ok: true, text: message })
    } catch (err) {
      setEmailStatus({ ok: false, text: err instanceof Error ? err.message : 'No se pudo enviar el email.' })
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark small">
            <LogoIcon size={20} />
          </span>
          <span className="brand-name">Gestor de Tareas</span>
        </div>

        <div className="user-box">
          <ThemeToggle />
          {/* Avatar con la inicial; el nombre completo se ve en pantallas medianas en adelante. */}
          <span className="avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="user-name">{displayName}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOutIcon />
          </button>
        </div>
      </header>

      <main className="tasks-page">
        <section className="welcome">
          <h1>Hola, {firstName} 👋</h1>
          <p>
            {summary.total === 0
              ? 'Empieza creando tu primera tarea.'
              : `Tienes ${summary.pending} ${summary.pending === 1 ? 'tarea pendiente' : 'tareas pendientes'}.`}
          </p>
        </section>

        {/* Aviso para confirmar el correo (solo si aún no está verificado en SES). */}
        <EmailVerificationNotice
          status={verification.status}
          email={verification.email}
          loading={verification.loading}
          error={verification.error}
          onResend={verification.resend}
          onRefresh={verification.refresh}
        />

        {/* Tarjetas de resumen + barra de progreso. */}
        <section className="card stats" aria-label="Resumen de tareas">
          <div className="stat">
            <span className="stat-value">{summary.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat">
            <span className="stat-value pending">{summary.pending}</span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat">
            <span className="stat-value done">{summary.completed}</span>
            <span className="stat-label">Completadas</span>
          </div>
          <ProgressBar completed={summary.completed} total={summary.total} />
        </section>

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
            <h2 id="list-title">Mis tareas</h2>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={handleSendSummary}
              // Solo se habilita con el correo verificado y al menos una tarea.
              disabled={sendingEmail || loading || tasks.length === 0 || !verification.isVerified}
              title={verification.isVerified ? undefined : 'Confirma tu correo para activar los resúmenes'}
            >
              <MailIcon size={16} />
              {sendingEmail ? 'Enviando...' : 'Enviarme resumen por email'}
            </button>
          </div>

          {/* Explicación de por qué el botón está deshabilitado. */}
          {!verification.isVerified && !verification.loading && (
            <p className="email-status hint">Confirma tu correo (ver aviso de arriba) para activar los resúmenes.</p>
          )}

          {/* role="status" anuncia el resultado a los lectores de pantalla. */}
          {emailStatus && (
            <p role="status" className={`email-status ${emailStatus.ok ? 'email-ok' : 'form-error'}`}>
              {emailStatus.text}
            </p>
          )}

          {loading ? (
            <p role="status" className="empty-state">
              Cargando tareas...
            </p>
          ) : (
            <TodoList tasks={tasks} onToggle={toggleTask} onEdit={editTask} onDelete={removeTask} />
          )}
        </section>
      </main>
    </div>
  )
}
