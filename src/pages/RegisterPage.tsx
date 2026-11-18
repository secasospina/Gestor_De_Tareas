/**
 * Página de registro.
 *
 * Crea una cuenta con nombre, correo y contraseña. Valida en el cliente
 * que las contraseñas coincidan antes de llamar a Firebase.
 */
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getAuthErrorMessage, registerWithEmail } from '../services/auth.service'
import { AuthLayout } from '../components/AuthLayout'

/** Mínimo de caracteres que exige Firebase para una contraseña. */
const MIN_PASSWORD_LENGTH = 6

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  /** Revisa el formulario y devuelve un mensaje de error, o null si todo está bien. */
  function validate(): string | null {
    if (!name.trim()) return 'Escribe tu nombre.'
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    }
    if (password !== confirmPassword) return 'Las contraseñas no coinciden.'
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      // Al crearse la cuenta, Firebase inicia sesión y PublicOnlyRoute redirige a /tasks.
      await registerWithEmail(email.trim(), password, name.trim())
    } catch (err) {
      setError(getAuthErrorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Crear cuenta" subtitle="Regístrate gratis y empieza a organizarte.">
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="name">Nombre</label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label htmlFor="confirmPassword">Confirmar contraseña</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>

      <p className="auth-switch">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </AuthLayout>
  )
}
