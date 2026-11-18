/**
 * Utilidades HTTP compartidas por las Vercel Functions.
 */

/** Respuesta JSON con el código HTTP indicado. */
export function json(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status })
}

/** Lee una variable de entorno obligatoria; si falta, es un error de configuración. */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable de entorno ${name}`)
  return value
}

/** Extrae el token del header "Authorization: Bearer <token>", o null si no viene. */
export function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7) : null
}
