/**
 * Servicio de email del frontend.
 *
 * No habla con AWS directamente (eso expondría las credenciales): llama a
 * nuestras Vercel Functions en /api, que son las que usan SES.
 */
import { auth } from './firebase'
import type { Task } from '../types/task'
import type { EmailVerificationResult, EmailVerificationStatus } from '../types/email'

const VALID_STATUSES: EmailVerificationStatus[] = ['verified', 'pending', 'sent']

/**
 * Hace un POST autenticado a una función de /api y devuelve el JSON de respuesta.
 * Centraliza: obtener el token, manejar errores de red y leer el mensaje de error
 * del servidor. Lanza un Error con un mensaje legible si algo falla.
 */
async function postWithAuth<T>(path: string, body: unknown, fallbackError: string): Promise<T> {
  const user = auth.currentUser
  if (!user) throw new Error('Debes iniciar sesión.')

  // Token firmado por Firebase que prueba ante el servidor quién es el usuario.
  const token = await user.getIdToken()

  let response: Response
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Error de conexión. Revisa tu internet.')
  }

  // 404 = la función no existe en este entorno. Pasa con `npm run dev`, porque
  // Vite solo sirve el frontend; las funciones de api/ corren en Vercel (o con `vercel dev`).
  if (response.status === 404) {
    throw new Error('El servicio de email no está disponible en este entorno. Funciona en la versión publicada en Vercel.')
  }

  const data = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) throw new Error(data.error ?? fallbackError)
  return data
}

/**
 * Pide al servidor que envíe el resumen de tareas al correo del usuario.
 * Devuelve el mensaje de éxito.
 */
export async function sendTasksSummary(tasks: Task[]): Promise<string> {
  // Solo enviamos lo necesario para el resumen (no IDs ni fechas).
  const payload = { tasks: tasks.map(({ title, completed }) => ({ title, completed })) }
  const data = await postWithAuth<{ message?: string }>(
    '/api/send-summary',
    payload,
    'No se pudo enviar el email.',
  )
  return data.message ?? 'Resumen enviado.'
}

/**
 * Consulta (y si hace falta, solicita) la verificación del correo en AWS SES.
 * Con resend = true vuelve a enviar el correo de verificación.
 */
export async function checkEmailVerification(resend = false): Promise<EmailVerificationResult> {
  const data = await postWithAuth<Partial<EmailVerificationResult>>(
    '/api/email-verification',
    { resend },
    'No se pudo comprobar tu correo.',
  )

  // Validamos la respuesta antes de usarla: no confiamos ciegamente en datos externos.
  if (!data.status || !VALID_STATUSES.includes(data.status) || typeof data.email !== 'string') {
    throw new Error('Respuesta inesperada del servidor.')
  }
  return { status: data.status, email: data.email }
}
