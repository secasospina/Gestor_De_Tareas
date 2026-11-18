/**
 * Botón para alternar entre modo claro y oscuro.
 * Muestra la luna en modo claro (para pasar a oscuro) y el sol en modo oscuro.
 */
import { useTheme } from '../hooks/useTheme'
import { MoonIcon, SunIcon } from './icons'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Activar modo claro' : 'Activar modo oscuro'

  return (
    // aria-label describe la acción, porque el botón solo muestra un ícono.
    <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={label} title={label}>
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
