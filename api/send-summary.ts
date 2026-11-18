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
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { buildSummaryEmail } from './_lib/buildSummaryEmail'
import type { SummaryTask } from './_lib/buildSummaryEmail'

/** Límite de tareas por email, para evitar abusos y correos gigantes. */
const MAX_TASKS = 200

// Llaves públicas con las que Google firma los tokens de Firebase.
// jose las descarga y las guarda en caché automáticamente.
const firebaseKeys = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)

/** Respuesta JSON con el código HTTP indicado. */
function json(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status })
}

/** Lee una variable de entorno obligatoria; si falta, es un error de configuración. */
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable de entorno ${name}`)
  return value
}

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
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return json(401, { error: 'No autenticado.' })

  try {
    const projectId = requireEnv('VITE_FIREBASE_PROJECT_ID')

    // 2. Verificar el token: firma, emisor, audiencia y fecha de expiración.
    let email: string
    let userName: string
    try {
      const { payload } = await jwtVerify(token, firebaseKeys, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      })
      if (typeof payload.email !== 'string') return json(400, { error: 'Tu cuenta no tiene correo.' })
      email = payload.email
      userName = typeof payload.name === 'string' ? payload.name : email
    } catch {
      return json(401, { error: 'Sesión inválida o expirada. Vuelve a iniciar sesión.' })
    }

    // 3. Validar los datos recibidos.
    const tasks = parseTasks(await request.json().catch(() => null))
    if (!tasks) return json(400, { error: 'Datos de tareas inválidos.' })

    // 4. Enviar el email con SES.
    const ses = new SESv2Client({
      region: requireEnv('SES_REGION'),
      credentials: {
        accessKeyId: requireEnv('SES_ACCESS_KEY_ID'),
        secretAccessKey: requireEnv('SES_SECRET_ACCESS_KEY'),
      },
    })

    const { subject, html, text } = buildSummaryEmail(userName, tasks)

    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: requireEnv('SES_FROM_EMAIL'),
        Destination: { ToAddresses: [email] },
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

    return json(200, { message: `Resumen enviado a ${email}.` })
  } catch (error) {
    // El detalle técnico va a los logs de Vercel; al usuario le damos un mensaje genérico.
    console.error('Error enviando el resumen:', error)
    return json(500, { error: 'No se pudo enviar el email. Intenta más tarde.' })
  }
}
