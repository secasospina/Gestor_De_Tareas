/**
 * Vercel Function: POST /api/send-summary
 *
 * Envía al usuario un email con el resumen de sus tareas usando AWS SES.
 *
 * Flujo:
 * 1. El frontend envía el token de Firebase del usuario (header Authorization)
 *    y la lista de tareas (body).
 * 2. Verificamos el token con las llaves públicas de Google: así sabemos
 *    quién es el usuario y que el token no fue falsificado.
 * 3. Enviamos el email SOLO al correo que viene dentro del token verificado
 *    (nadie puede usar este endpoint para enviar correos a otras personas).
 *
 * Las credenciales de AWS solo existen aquí, en el servidor. Nunca llegan al navegador.
 */
import { SendEmailCommand } from '@aws-sdk/client-sesv2'
// En las funciones de Vercel (Node.js con "type": "module") los imports locales
// deben llevar la extensión .js, aunque el archivo fuente sea .ts.
import { buildSummaryEmail } from './_lib/buildSummaryEmail.js'
import type { SummaryTask } from './_lib/buildSummaryEmail.js'
import { verifyFirebaseToken } from './_lib/firebaseAuth.js'
import { getBearerToken, json, requireEnv } from './_lib/http.js'
import { createSesClient } from './_lib/ses.js'

/** Límite de tareas por email, para evitar abusos y correos gigantes. */
const MAX_TASKS = 200

/** Comprueba que el body tenga la forma esperada: { tasks: [{ title, completed }] }. */
function parseTasks(body: unknown): SummaryTask[] | null {
  if (typeof body !== 'object' || body === null) return null
  const tasks = (body as { tasks?: unknown }).tasks
  if (!Array.isArray(tasks) || tasks.length > MAX_TASKS) return null

  const isValid = tasks.every(
    (task) =>
      typeof task === 'object' &&
      task !== null &&
      typeof task.title === 'string' &&
      typeof task.completed === 'boolean',
  )
  return isValid ? tasks.map((task) => ({ title: task.title, completed: task.completed })) : null
}

export async function POST(request: Request): Promise<Response> {
  // 1. Leer el token "Bearer <token>" del header.
  const token = getBearerToken(request)
  if (!token) return json(401, { error: 'No autenticado.' })

  try {
    // 2. Verificar el token: firma, emisor, audiencia y fecha de expiración.
    const user = await verifyFirebaseToken(token)
    if (!user) return json(401, { error: 'Sesión inválida o expirada. Vuelve a iniciar sesión.' })

    // 3. Validar los datos recibidos.
    const tasks = parseTasks(await request.json().catch(() => null))
    if (!tasks) return json(400, { error: 'Datos de tareas inválidos.' })

    // 4. Enviar el email con SES.
    const { subject, html, text } = buildSummaryEmail(user.name, tasks)

    await createSesClient().send(
      new SendEmailCommand({
        FromEmailAddress: requireEnv('SES_FROM_EMAIL'),
        Destination: { ToAddresses: [user.email] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: html, Charset: 'UTF-8' },
              Text: { Data: text, Charset: 'UTF-8' },
            },
          },
        },
      }),
    )

    return json(200, { message: `Resumen enviado a ${user.email}.` })
  } catch (error) {
    // El detalle técnico va a los logs de Vercel; al usuario le damos un mensaje claro.
    console.error('Error enviando el resumen:', error)

    // Caso conocido: SES está en modo sandbox y el correo aún no está verificado.
    if (error instanceof Error && error.name === 'MessageRejected') {
      return json(403, {
        error: 'Tu correo aún no está verificado. Confirma el correo de verificación de Amazon Web Services e intenta de nuevo.',
      })
    }

    return json(500, { error: 'No se pudo enviar el email. Intenta más tarde.' })
  }
}
