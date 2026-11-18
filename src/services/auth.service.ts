/**
 * Servicio de autenticación.
 *
 * Centraliza todas las llamadas a Firebase Auth. Los componentes nunca
 * hablan directamente con Firebase: usan estas funciones. Así, si algún
 * día cambia el proveedor de autenticación, solo se modifica este archivo.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { auth, googleProvider } from './firebase'

/**
 * Registra un usuario nuevo con correo y contraseña.
 * Si se envía un nombre, lo guarda en el perfil del usuario (displayName).
 */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password)

  if (displayName) {
    await updateProfile(credential.user, { displayName })
  }

  return credential.user
}

/** Inicia sesión con correo y contraseña. */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

/** Inicia sesión con una cuenta de Google mediante una ventana emergente. */
export async function loginWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider)
  return credential.user
}

/** Cierra la sesión del usuario actual. */
export async function logout(): Promise<void> {
  await signOut(auth)
}

/**
 * Traduce los códigos de error de Firebase a mensajes en español
 * que el usuario pueda entender. Nunca mostramos el error técnico crudo.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return 'Ocurrió un error inesperado. Intenta de nuevo.'
  }

  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.'
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo.'
    case 'auth/invalid-email':
      return 'El correo no tiene un formato válido.'
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
    case 'auth/network-request-failed':
      return 'Error de conexión. Revisa tu internet.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Cerraste la ventana de Google antes de terminar.'
    default:
      return 'No se pudo completar la operación. Intenta de nuevo.'
  }
}
