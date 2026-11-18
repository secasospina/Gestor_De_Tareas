/**
 * Vercel Function: POST /api/email-verification
 *
 * Se asegura de que el correo del usuario pueda recibir emails de AWS SES.
 *
 * ¿Por qué existe? La cuenta de SES está en modo sandbox: solo puede enviar
 * a correos verificados. Esta función revisa el estado del correo del usuario
 * y, si hace falta, le pide a AWS que le envíe el correo de verificación.
 *
 * Body opcional: { resend: true } para volver a enviar el correo de verificación.
 *
 * Respuesta: { status, email } donde status es:
 * - "verified": el correo ya puede recibir resúmenes.
 * - "pending":  ya se envió la verificación y falta que el usuario confirme.
 * - "sent":     acabamos de enviar (o reenviar) el correo de verificación.
 *
 * Seguridad: el correo sale del token verificado de Firebase, así que cada
 * usuario solo puede verificar SU PROPIO correo.
 */
import {
  CreateEmailIdentityCommand,
  DeleteEmailIdentityCommand,
  GetEmailIdentityCommand,
} from '@aws-sdk/client-sesv2'
import type { SESv2Client } from '@aws-sdk/client-sesv2'
// Imports locales con extensión .js (Node.js en modo ES Modules).
import { verifyFirebaseToken } from './_lib/firebaseAuth.js'
import { getBearerToken, json } from './_lib/http.js'
import { createSesClient } from './_lib/ses.js'

type IdentityState = 'verified' | 'pending' | 'failed' | 'not_found'

/** Consulta en SES el estado de verificación de un correo. */
async function getIdentityState(ses: SESv2Client, email: string): Promise<IdentityState> {
  try {
    const identity = await ses.send(new GetEmailIdentityCommand({ EmailIdentity: email }))
    if (identity.VerifiedForSendingStatus) return 'verified'
    // PENDING = esperando el clic; FAILED / TEMPORARY_FAILURE = el enlace expiró o falló.
    return identity.VerificationStatus === 'PENDING' ? 'pending' : 'failed'
  } catch (error) {
    // Comparamos por nombre del error: es más robusto que instanceof tras el empaquetado.
    if (error instanceof Error && error.name === 'NotFoundException') return 'not_found'
    throw error
  }
}

/** Pide a AWS que envíe el correo de verificación (crea la identidad en SES). */
async function sendVerification(ses: SESv2Client, email: string): Promise<void> {
  await ses.send(new CreateEmailIdentityCommand({ EmailIdentity: email }))
}

/** Reenvía la verificación: AWS solo la reenvía si borramos y volvemos a crear la identidad. */
async function resendVerification(ses: SESv2Client, email: string): Promise<void> {
  await ses.send(new DeleteEmailIdentityCommand({ EmailIdentity: email }))
  await sendVerification(ses, email)
}

export async function POST(request: Request): Promise<Response> {
  const token = getBearerToken(request)
  if (!token) return json(401, { error: 'No autenticado.' })

  try {
    const user = await verifyFirebaseToken(token)
    if (!user) return json(401, { error: 'Sesión inválida o expirada. Vuelve a iniciar sesión.' })

    // El body es opcional; si no viene o no es JSON, asumimos que no se pide reenvío.
    const body = (await request.json().catch(() => ({}))) as { resend?: unknown }
    const wantsResend = body.resend === true

    const ses = createSesClient()
    const state = await getIdentityState(ses, user.email)

    if (state === 'verified') {
      return json(200, { status: 'verified', email: user.email })
    }

    if (state === 'not_found') {
      // Primera vez: enviamos el correo de verificación.
      await sendVerification(ses, user.email)
      return json(200, { status: 'sent', email: user.email })
    }

    if (state === 'failed' || wantsResend) {
      // El enlace anterior expiró/falló, o el usuario pidió reenviarlo.
      await resendVerification(ses, user.email)
      return json(200, { status: 'sent', email: user.email })
    }

    // Ya se envió antes y falta que el usuario confirme.
    return json(200, { status: 'pending', email: user.email })
  } catch (error) {
    console.error('Error en la verificación de correo:', error)
    return json(500, { error: 'No se pudo comprobar tu correo. Intenta más tarde.' })
  }
}
