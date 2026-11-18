/**
 * Página de inicio de sesión.
 *
 * Permite entrar con correo y contraseña o con Google.
 * Maneja el estado de carga (botones deshabilitados) y muestra los errores.
 */
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getAuthErrorMessage, loginWithEmail, loginWithGoogle } from '../services/auth.service'
import { AuthLayout } from '../components/AuthLayout'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  /**
   * Ejecuta una acción de login y maneja carga y errores en un solo lugar,
   * para no repetir el mismo try/catch en cada botón.
   * No hace falta redirigir aquí: al cambiar la sesión, PublicOnlyRoute
   * envía al usuario a /tasks automáticamente.
   */
  async function runLogin(action: () => Promise<unknown>) {
    setError(null)
    setSubmitting(true)
    try {
      await action()
    } catch (err) {
      setError(getAuthErrorMessage(err))
      setSubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Evita que el formulario recargue la página (comportamiento por defecto del HTML).
    event.preventDefault()
    void runLogin(() => loginWithEmail(email.trim(), password))
  }

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Ingresa para ver y organizar tus tareas.">
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* role="alert" hace que los lectores de pantalla anuncien el error. */}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting || !email || !password}>
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <div className="divider">o</div>

      <button
        type="button"
        className="btn-secondary"
        onClick={() => void runLogin(loginWithGoogle)}
        disabled={submitting}
      >
        Continuar con Google
      </button>

      <p className="auth-switch">
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </AuthLayout>
  )
}
