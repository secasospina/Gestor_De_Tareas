/**
 * Punto de entrada de la aplicación.
 *
 * Envuelve la app con:
 * - BrowserRouter: habilita la navegación entre páginas sin recargar.
 * - AuthProvider: comparte la sesión del usuario con toda la app.
 *
 * Antes de renderizar aplicamos el tema (claro/oscuro) para evitar
 * un parpadeo de colores al cargar la página.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthProvider'
import { getInitialTheme, setThemeAttribute } from './utils/theme'

setThemeAttribute(getInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
