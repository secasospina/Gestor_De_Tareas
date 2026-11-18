/**
 * Hook para leer la sesión actual desde cualquier componente.
 *
 * Uso: const { user, loading } = useAuth()
 */
import { useContext } from 'react'
import { AuthContext } from '../context/authContext'
import type { AuthContextValue } from '../context/authContext'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  // Si se usa fuera del AuthProvider es un error de programación: lo avisamos claro.
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }

  return context
}
