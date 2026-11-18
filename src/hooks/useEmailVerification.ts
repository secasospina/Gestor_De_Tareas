/**
 * Hook que maneja la verificación del correo para recibir resúmenes.
 *
 * Al montarse (cuando el usuario entra a sus tareas) consulta el estado en el
 * servidor. Si el correo nunca se había verificado, el servidor envía en ese
 * momento el correo de verificación de AWS: así, quien se acaba de registrar
 * recibe el aviso de "revisa tu correo" de inmediato.
 */
import { useCallback, useEffect, useState } from 'react'
import { checkEmailVerification } from '../services/email.service'
import type { EmailVerificationResult } from '../types/email'

export function useEmailVerification(userId: string | undefined) {
  const [result, setResult] = useState<EmailVerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /** Consulta el estado; con resend = true reenvía el correo de verificación. */
  const check = useCallback(async (resend = false) => {
    setLoading(true)
    setError(null)
    try {
      setResult(await checkEmailVerification(resend))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo comprobar tu correo.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Consulta automática al entrar (y si cambia el usuario).
  useEffect(() => {
    if (!userId) return
    void check()
  }, [userId, check])

  return {
    /** Estado actual, o null mientras no se conoce. */
    status: result?.status ?? null,
    email: result?.email ?? null,
    isVerified: result?.status === 'verified',
    loading,
    error,
    /** Vuelve a consultar (ej. después de que el usuario confirmó). */
    refresh: () => check(false),
    /** Reenvía el correo de verificación. */
    resend: () => check(true),
  }
}
