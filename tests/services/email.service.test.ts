/**
 * Tests del servicio de email del frontend.
 * Simulamos (mock) Firebase y fetch: no se envían correos reales ni se llama a internet.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Usuario falso de Firebase con un token de prueba.
// vi.hoisted es necesario porque vi.mock se ejecuta antes que el resto del archivo.
const { fakeUser, fakeAuth } = vi.hoisted(() => {
  const user = { getIdToken: () => Promise.resolve('token-de-prueba') }
  const auth: { currentUser: typeof user | null } = { currentUser: user }
  return { fakeUser: user, fakeAuth: auth }
})

vi.mock('../../src/services/firebase', () => ({ auth: fakeAuth }))

import { checkEmailVerification, sendTasksSummary } from '../../src/services/email.service'
import type { Task } from '../../src/types/task'

const tasks: Task[] = [
  { id: '1', userId: 'u1', title: 'Tarea', description: 'secreta', completed: false, createdAt: null },
]

describe('sendTasksSummary', () => {
  beforeEach(() => {
    fakeAuth.currentUser = fakeUser
  })

  it('llama a /api/send-summary con el token y solo título/estado de las tareas', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ message: 'Resumen enviado a a@b.com.' }))

    const message = await sendTasksSummary(tasks)

    expect(message).toBe('Resumen enviado a a@b.com.')
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/send-summary')
    expect(options?.headers).toMatchObject({ Authorization: 'Bearer token-de-prueba' })
    expect(JSON.parse(options?.body as string)).toEqual({ tasks: [{ title: 'Tarea', completed: false }] })
  })

  it('lanza el mensaje de error que devuelve el servidor', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ error: 'Sesión inválida o expirada.' }, { status: 401 }),
    )

    await expect(sendTasksSummary(tasks)).rejects.toThrow('Sesión inválida o expirada.')
  })

  it('falla si no hay usuario autenticado', async () => {
    fakeAuth.currentUser = null
    await expect(sendTasksSummary(tasks)).rejects.toThrow('Debes iniciar sesión.')
  })
})

describe('checkEmailVerification', () => {
  beforeEach(() => {
    fakeAuth.currentUser = fakeUser
  })

  it('devuelve el estado que responde el servidor', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ status: 'sent', email: 'a@b.com' }))

    await expect(checkEmailVerification()).resolves.toEqual({ status: 'sent', email: 'a@b.com' })
  })

  it('envía resend: true cuando se pide reenviar', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ status: 'sent', email: 'a@b.com' }))

    await checkEmailVerification(true)

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/email-verification')
    expect(JSON.parse(options?.body as string)).toEqual({ resend: true })
  })

  it('rechaza una respuesta con un estado desconocido', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ status: 'raro', email: 'a@b.com' }))

    await expect(checkEmailVerification()).rejects.toThrow('Respuesta inesperada del servidor.')
  })

  it('muestra un mensaje claro si falla la red', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(checkEmailVerification()).rejects.toThrow('Error de conexión. Revisa tu internet.')
  })
})
