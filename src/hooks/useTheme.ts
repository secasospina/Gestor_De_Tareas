/**
 * Hook para leer y cambiar el tema (claro / oscuro).
 * Uso: const { theme, toggleTheme } = useTheme()
 */
import { useCallback, useEffect, useState } from 'react'
import { getInitialTheme, saveTheme, setThemeAttribute } from '../utils/theme'
import type { Theme } from '../utils/theme'

export function useTheme() {
  // La función dentro de useState solo se ejecuta la primera vez (inicialización perezosa).
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // Cada vez que cambia el tema, lo aplicamos en el <html>.
  useEffect(() => {
    setThemeAttribute(theme)
  }, [theme])

  // Solo guardamos cuando el usuario elige a mano; si nunca elige,
  // se sigue respetando la preferencia de su sistema.
  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      saveTheme(next)
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
