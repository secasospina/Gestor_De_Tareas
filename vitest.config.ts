/**
 * Configuración de Vitest (tests).
 * Reutiliza la configuración de Vite (plugin de React) y le agrega la de testing.
 */
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // jsdom simula un navegador (document, window) para poder renderizar componentes.
      environment: 'jsdom',
      // Archivo que se ejecuta antes de cada archivo de tests.
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.{ts,tsx}'],
    },
  }),
)
