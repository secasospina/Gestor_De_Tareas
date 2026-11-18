/**
 * Construye el contenido del email con el resumen de tareas.
 *
 * Es una función pura (no envía nada, solo arma texto), por eso se puede
 * probar con tests unitarios sin depender de AWS.
 * La carpeta empieza con "_" para que Vercel NO la publique como un endpoint.
 */

/** Datos mínimos de una tarea que necesita el email. */
export interface SummaryTask {
  title: string
  completed: boolean
}

export interface SummaryEmail {
  subject: string
  html: string
  text: string
}

/**
 * Escapa caracteres especiales de HTML.
 * Evita que un título como "<script>" se interprete como código dentro del email.
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/** Arma asunto, versión HTML y versión de texto plano del resumen. */
export function buildSummaryEmail(userName: string, tasks: SummaryTask[]): SummaryEmail {
  const pending = tasks.filter((task) => !task.completed)
  const completed = tasks.filter((task) => task.completed)

  const subject = `Resumen de tus tareas: ${pending.length} pendientes, ${completed.length} completadas`

  // Lista HTML de una sección; si está vacía mostramos un mensaje.
  const htmlList = (items: SummaryTask[]) =>
    items.length === 0
      ? '<p style="color:#656d76">Ninguna.</p>'
      : `<ul>${items.map((task) => `<li>${escapeHtml(task.title)}</li>`).join('')}</ul>`

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#1f2328;max-width:560px">
      <h2>Hola, ${escapeHtml(userName)}</h2>
      <p>Este es el estado actual de tus tareas (${tasks.length} en total):</p>
      <h3>Pendientes (${pending.length})</h3>
      ${htmlList(pending)}
      <h3>Completadas (${completed.length})</h3>
      ${htmlList(completed)}
      <p style="color:#656d76;font-size:13px">Enviado desde Gestor de Tareas.</p>
    </div>`

  // Versión de texto plano para clientes de correo que no muestran HTML.
  const textList = (items: SummaryTask[]) =>
    items.length === 0 ? '- Ninguna' : items.map((task) => `- ${task.title}`).join('\n')

  const text = [
    `Hola, ${userName}`,
    `Estado de tus tareas (${tasks.length} en total):`,
    '',
    `Pendientes (${pending.length}):`,
    textList(pending),
    '',
    `Completadas (${completed.length}):`,
    textList(completed),
  ].join('\n')

  return { subject, html, text }
}
