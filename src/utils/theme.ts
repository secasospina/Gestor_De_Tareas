/**
 * Utilidades del tema visual (claro / oscuro).
 *
 * El tema se aplica con el atributo data-theme en la etiqueta <html>;
 * el CSS cambia los colores según ese atributo.
 */
export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'gestor-tareas-theme'

/**
 * Tema inicial: el que el usuario eligió antes (si existe) o,
 * si nunca eligió, la preferencia de su sistema operativo.
 */
export function getInitialTheme(): Theme {
  // localStorage puede fallar (modo privado, bloqueos): por eso el try/catch.
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Si no se puede leer, seguimos con la preferencia del sistema.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Aplica el tema en la página (cambia los colores vía CSS). */
export function setThemeAttribute(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

/** Recuerda el tema elegido por el usuario para la próxima visita. */
export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Si no se puede guardar, el tema funciona igual durante esta visita.
  }
}
