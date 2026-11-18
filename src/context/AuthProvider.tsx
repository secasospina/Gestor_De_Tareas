/**
 * Proveedor de autenticación.
 *
 * Escucha los cambios de sesión de Firebase (login, logout, recarga de la
 * página) y los comparte con todos los componentes a través del contexto.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '../services/firebase'
import { AuthContext } from './authContext'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  // Empieza en true: al cargar la página aún no sabemos si hay sesión.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // onAuthStateChanged se ejecuta al iniciar y cada vez que la sesión cambia.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    // Al desmontar el componente dejamos de escuchar, para evitar fugas de memoria.
    return unsubscribe
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
