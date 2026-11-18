/**
 * Tests del aviso de verificación de correo.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmailVerificationNotice } from '../../src/components/EmailVerificationNotice'

/** Props por defecto; cada test cambia solo lo que necesita. */
function renderNotice(overrides: Partial<Parameters<typeof EmailVerificationNotice>[0]> = {}) {
  const props = {
    status: 'sent' as const,
    email: 'ana@correo.com',
    loading: false,
    error: null,
    onResend: vi.fn(),
    onRefresh: vi.fn(),
    ...overrides,
  }
  render(<EmailVerificationNotice {...props} />)
  return props
}

describe('EmailVerificationNotice', () => {
  it('no muestra nada si el correo ya está verificado', () => {
    const { container } = render(
      <EmailVerificationNotice
        status="verified"
        email="ana@correo.com"
        loading={false}
        error={null}
        onResend={vi.fn()}
        onRefresh={vi.fn()}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('pide revisar el correo cuando se acaba de enviar la verificación', () => {
    renderNotice()
    expect(screen.getByText('Revisa tu correo para activar los resúmenes')).toBeInTheDocument()
    expect(screen.getByText('ana@correo.com')).toBeInTheDocument()
  })

  it('permite reenviar el correo y comprobar de nuevo', async () => {
    const user = userEvent.setup()
    const { onResend, onRefresh } = renderNotice({ status: 'pending' })

    await user.click(screen.getByRole('button', { name: 'Reenviar correo' }))
    await user.click(screen.getByRole('button', { name: 'Ya confirmé' }))

    expect(onResend).toHaveBeenCalledOnce()
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('muestra el error si no se pudo comprobar el correo', () => {
    renderNotice({ status: null, error: 'Error de conexión. Revisa tu internet.' })
    expect(screen.getByText('No pudimos comprobar tu correo')).toBeInTheDocument()
    expect(screen.getByText('Error de conexión. Revisa tu internet.')).toBeInTheDocument()
  })
})
