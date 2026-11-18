/**
 * Tipos del dominio "email".
 */

/**
 * Estado del correo del usuario en AWS SES:
 * - verified: ya puede recibir resúmenes.
 * - pending:  se envió la verificación y falta confirmar.
 * - sent:     se acaba de enviar (o reenviar) el correo de verificación.
 */
export type EmailVerificationStatus = 'verified' | 'pending' | 'sent'

export interface EmailVerificationResult {
  status: EmailVerificationStatus
  email: string
}
