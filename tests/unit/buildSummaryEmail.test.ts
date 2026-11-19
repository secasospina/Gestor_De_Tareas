/**
 * Tests unitarios del armado del email (api/_lib/buildSummaryEmail.ts).
 */
import { describe, expect, it } from 'vitest'
import { buildSummaryEmail, escapeHtml } from '../../api/_lib/buildSummaryEmail'

describe('escapeHtml', () => {
  it('convierte caracteres especiales para que no se interpreten como HTML', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    )
  })
})

describe('escapeHtml con &', () => {
  it('escapa el & primero, sin escapar dos veces las entidades', () => {
    expect(escapeHtml('<b>&amp;</b>')).toBe('&lt;b&gt;&amp;amp;&lt;/b&gt;')
  })
})

describe('buildSummaryEmail', () => {
  const tasks = [
    { title: 'Pagar factura', completed: false },
    { title: 'Lavar loza', completed: true },
  ]

  it('incluye los conteos en el asunto', () => {
    const email = buildSummaryEmail('Sebastián', tasks)
    expect(email.subject).toBe('Resumen de tus tareas: 1 pendientes, 1 completadas')
  })

  it('lista las tareas en las versiones HTML y texto', () => {
    const email = buildSummaryEmail('Sebastián', tasks)
    expect(email.html).toContain('Pagar factura')
    expect(email.text).toContain('- Lavar loza')
    expect(email.text).toContain('Hola, Sebastián')
  })

  it('escapa los títulos dentro del HTML', () => {
    const email = buildSummaryEmail('Ana', [{ title: '<b>hack</b>', completed: false }])
    expect(email.html).not.toContain('<b>hack</b>')
    expect(email.html).toContain('&lt;b&gt;hack&lt;/b&gt;')
  })

  it('indica "Ninguna" cuando una sección está vacía', () => {
    const email = buildSummaryEmail('Ana', [])
    expect(email.text).toContain('- Ninguna')
  })
})
