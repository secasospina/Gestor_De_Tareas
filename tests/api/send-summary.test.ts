// @vitest-environment node
/**
 * Tests de la Vercel Function POST /api/send-summary.
 *
 * Se simulan (mock) la verificación del token y el cliente de SES:
 * no se llama a AWS ni a los servidores de Google.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

// vi.hoisted: estas variables deben existir antes de que se ejecuten los vi.mock.
const { verifyMock, sendMock } = vi.hoisted(() => ({
  verifyMock: vi.fn(),
  sendMock: vi.fn(),
}))

vi.mock('../../api/_lib/firebaseAuth', () => ({ verifyFirebaseToken: verifyMock }))
vi.mock('../../api/_lib/ses', () => ({ createSesClient: () => ({ send: sendMock }) }))

import { POST } from '../../api/send-summary'

/** Crea una petición como la que enviaría el frontend. */
function makeRequest(body: unknown, token: string | null = 'token-valido'): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return new Request('http://localhost/api/send-summary', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

const validBody = { tasks: [{ title: 'Pagar factura', completed: false }] }

describe('POST /api/send-summary', () => {
  beforeEach(() => {
    process.env.SES_FROM_EMAIL = 'remitente@correo.com'
    verifyMock.mockReset().mockResolvedValue({ email: 'ana@correo.com', name: 'Ana' })
    sendMock.mockReset().mockResolvedValue({})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('responde 401 si no viene el token', async () => {
    const response = await POST(makeRequest(validBody, null))
    expect(response.status).toBe(401)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('responde 401 si el token no es válido', async () => {
    verifyMock.mockResolvedValue(null)
    const response = await POST(makeRequest(validBody))
    expect(response.status).toBe(401)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('responde 400 si el payload no tiene la forma esperada', async () => {
    const response = await POST(makeRequest({ tasks: [{ title: 123 }] }))
    expect(response.status).toBe(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('envía el email al correo del token (no a uno elegido por el cliente)', async () => {
    const response = await POST(makeRequest({ ...validBody, to: 'otra@persona.com' }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ message: 'Resumen enviado a ana@correo.com.' })
    const command = sendMock.mock.calls[0][0]
    expect(command.input.Destination.ToAddresses).toEqual(['ana@correo.com'])
    expect(command.input.FromEmailAddress).toBe('remitente@correo.com')
  })

  it('responde 403 con un mensaje claro si SES rechaza un correo no verificado', async () => {
    const rejected = Object.assign(new Error('Email address is not verified'), { name: 'MessageRejected' })
    sendMock.mockRejectedValue(rejected)

    const response = await POST(makeRequest(validBody))

    expect(response.status).toBe(403)
    expect((await response.json()).error).toMatch(/no está verificado/)
  })
})
