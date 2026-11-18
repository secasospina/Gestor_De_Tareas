/**
 * Servicio de email del frontend.
 *
 * No habla con AWS directamente (eso expondría las credenciales): llama a
 * nuestra Vercel Function /api/send-summary, que es la que usa SES.
 */
import { auth } from './firebase'
import type { Task } from '../types/task'

/**
 * Pide al servidor que envíe el resumen de tareas al correo del usuario.
 * Devuelve el mensaje de éxito; lanza un Error con mensaje legible si falla.
 */
export async function sendTasksSummary(tasks: Task[]): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('Debes iniciar sesión.')

  // Token firmado por Firebase que prueba ante el servidor quién es el usuario.
  const token = await user.getIdToken()

  // Solo enviamos lo necesario para el resumen (no IDs ni fechas).
  const payload = { tasks: tasks.map(({ title, completed }) => ({ title, completed })) }

  let response: Response
  try {
    response = await fetch('/api/send-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Error de conexión. Revisa tu internet.')
  }

  const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string }

  if (!response.ok) throw new Error(data.error ?? 'No se pudo enviar el email.')
  return data.message ?? 'Resumen enviado.'
}
