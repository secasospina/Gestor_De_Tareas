/**
 * Tests unitarios de la traducción de errores de autenticación.
 */
import { describe, expect, it, vi } from 'vitest'
import { FirebaseError } from 'firebase/app'

// Mock del módulo de Firebase: evitamos inicializar Firebase real en los tests.
vi.mock('../../src/services/firebase', () => ({ auth: {}, googleProvider: {} }))

import { getAuthErrorMessage } from '../../src/services/auth.service'

describe('getAuthErrorMessage', () => {
  it('traduce credenciales inválidas', () => {
    const error = new FirebaseError('auth/invalid-credential', 'x')
    expect(getAuthErrorMessage(error)).toBe('Correo o contraseña incorrectos.')
  })

  it('traduce correo ya registrado', () => {
    const error = new FirebaseError('auth/email-already-in-use', 'x')
    expect(getAuthErrorMessage(error)).toBe('Ya existe una cuenta con este correo.')
  })

  it('usa un mensaje genérico para códigos desconocidos', () => {
    const error = new FirebaseError('auth/algo-raro', 'x')
    expect(getAuthErrorMessage(error)).toBe('No se pudo completar la operación. Intenta de nuevo.')
  })

  it('maneja errores que no son de Firebase', () => {
    expect(getAuthErrorMessage(new Error('boom'))).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
  })
})
