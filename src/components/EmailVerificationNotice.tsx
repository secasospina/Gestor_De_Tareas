/**
 * Aviso para activar los resúmenes por email.
 *
 * Se muestra mientras el correo del usuario no esté verificado en AWS SES.
 * Explica que debe confirmar el correo de verificación de Amazon Web Services
 * y ofrece reenviarlo o comprobar de nuevo después de confirmar.
 */
import { MailIcon } from './icons'
import type { EmailVerificationStatus } from '../types/email'

interface EmailVerificationNoticeProps {
  status: EmailVerificationStatus | null
  email: string | null
  loading: boolean
  error: string | null
  onResend: () => void
  onRefresh: () => void
}

export function EmailVerificationNotice({
  status,
  email,
  loading,
  error,
  onResend,
  onRefresh,
}: EmailVerificationNoticeProps) {
  // Si ya está verificado (o aún no sabemos nada y no hay error), no mostramos nada.
  if (status === 'verified' || (!status && !error)) return null

  return (
    <section className="notice" aria-live="polite">
      <span className="notice-icon">
        <MailIcon size={20} />
      </span>

      <div className="notice-body">
        {error ? (
          <>
            <strong>No pudimos comprobar tu correo</strong>
            <p>{error}</p>
          </>
        ) : (
          <>
            <strong>
              {status === 'sent' ? 'Revisa tu correo para activar los resúmenes' : 'Falta confirmar tu correo'}
            </strong>
            <p>
              {status === 'sent' ? 'Te enviamos' : 'Te enviamos antes'} un correo de verificación de{' '}
              <b>Amazon Web Services</b> a <b>{email}</b>. Ábrelo y haz clic en el enlace para activar los
              resúmenes por email. Revisa también la carpeta de spam.
            </p>
          </>
        )}

        <div className="notice-actions">
          <button type="button" className="btn-sm" onClick={onRefresh} disabled={loading}>
            {loading ? 'Comprobando...' : 'Ya confirmé'}
          </button>
          {!error && (
            <button type="button" className="btn-ghost" onClick={onResend} disabled={loading}>
              Reenviar correo
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
