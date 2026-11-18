/**
 * Configuración común de los tests.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Después de cada test: desmontamos lo renderizado y reiniciamos los mocks,
// para que ningún test afecte al siguiente.
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
