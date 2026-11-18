/**
 * Diseño compartido de las páginas de login y registro.
 *
 * - En escritorio: panel de bienvenida a la izquierda y formulario a la derecha.
 * - En celular: el panel se reduce al logo y el saludo, encima del formulario.
 * Así Login y Register no repiten la misma estructura.
 */
import type { ReactNode } from 'react'
import { CheckCircleIcon, CloudIcon, LogoIcon, ShieldIcon } from './icons'
import { ThemeToggle } from './ThemeToggle'

interface AuthLayoutProps {
  /** Título de la tarjeta del formulario (ej. "Iniciar sesión"). */
  title: string
  /** Texto corto debajo del título. */
  subtitle: string
  children: ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>

      <section className="auth-hero" aria-label="Bienvenida">
        <div className="brand-mark">
          <LogoIcon size={30} />
        </div>
        <h1 className="hero-title">Bienvenido al Gestor de Tareas</h1>
        <p className="hero-text">Organiza tu día, enfócate en lo importante y no olvides nada.</p>

        {/* Lista de beneficios: solo se muestra en pantallas grandes. */}
        <ul className="hero-features">
          <li>
            <CheckCircleIcon /> Crea, edita y completa tus tareas
          </li>
          <li>
            <CloudIcon /> Guardadas en la nube, en cualquier dispositivo
          </li>
          <li>
            <ShieldIcon /> Privadas: solo tú ves tus tareas
          </li>
        </ul>
      </section>

      <section className="auth-card">
        <h2>{title}</h2>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
      </section>
    </main>
  )
}
