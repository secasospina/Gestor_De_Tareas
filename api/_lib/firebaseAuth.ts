/**
 * Verificación del ID token de Firebase en el servidor.
 *
 * El navegador envía el token que Firebase le dio al usuario al iniciar sesión.
 * Aquí comprobamos con las llaves públicas de Google que el token es auténtico,
 * que es de NUESTRO proyecto y que no ha expirado. Solo así confiamos en el
 * correo que trae dentro.
 */
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { requireEnv } from './http.js'

// Llaves públicas con las que Google firma los tokens de Firebase.
// jose las descarga y las guarda en caché automáticamente.
const firebaseKeys = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)

/** Datos del usuario que obtenemos de un token válido. */
export interface VerifiedUser {
  email: string
  name: string
}

/**
 * Verifica el token y devuelve el usuario, o null si el token no es válido
 * (firma falsa, otro proyecto, expirado) o la cuenta no tiene correo.
 */
export async function verifyFirebaseToken(token: string): Promise<VerifiedUser | null> {
  const projectId = requireEnv('VITE_FIREBASE_PROJECT_ID')

  try {
    const { payload } = await jwtVerify(token, firebaseKeys, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    })
    if (typeof payload.email !== 'string') return null

    return {
      email: payload.email,
      name: typeof payload.name === 'string' ? payload.name : payload.email,
    }
  } catch {
    return null
  }
}
