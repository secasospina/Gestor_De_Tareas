/**
 * Definición del contexto de autenticación.
 *
 * Se separa del Provider (AuthProvider.tsx) para que el archivo del
 * componente solo exporte componentes; esto mantiene funcionando el
 * recargado en caliente (Fast Refresh) de Vite.
 */
import { createContext } from 'react'
import type { User } from 'firebase/auth'

/** Información de sesión que se comparte con toda la aplicación. */
export interface AuthContextValue {
  /** Usuario autenticado, o null si no hay sesión. */
  user: User | null
  /** true mientras Firebase verifica si existe una sesión guardada. */
  loading: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
