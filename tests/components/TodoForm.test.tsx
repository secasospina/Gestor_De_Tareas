/**
 * Tests del componente TodoForm.
 * Se prueba como lo usaría una persona: escribiendo en los campos y haciendo clic.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodoForm } from '../../src/components/TodoForm'

describe('TodoForm', () => {
  it('muestra un error y no envía si el título está vacío', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TodoForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    expect(screen.getByText('El título es obligatorio.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envía los datos escritos y limpia el formulario al crear', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TodoForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Título'), 'Comprar pan')
    await user.type(screen.getByLabelText('Descripción'), 'En la tienda')
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Comprar pan',
      description: 'En la tienda',
      priority: 'medium',
      dueDate: null,
    })
    expect(screen.getByLabelText('Título')).toHaveValue('')
  })

  it('en modo edición muestra los valores iniciales y permite cancelar', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <TodoForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        initialValues={{ title: 'Tarea vieja', description: 'Detalle', priority: 'low', dueDate: null }}
        submitLabel="Guardar cambios"
        onCancel={onCancel}
      />,
    )

    expect(screen.getByLabelText('Título')).toHaveValue('Tarea vieja')

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('conserva lo escrito si falla el guardado', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('Firestore caído'))
    render(<TodoForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Título'), 'No perder esto')
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    expect(screen.getByLabelText('Título')).toHaveValue('No perder esto')
  })

  it('evita el doble envío mientras se está guardando', async () => {
    const user = userEvent.setup()
    // Promesa que no se resuelve hasta que lo decidimos: simula un guardado lento.
    let finishSave: () => void = () => {}
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finishSave = resolve)))
    render(<TodoForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Título'), 'Tarea lenta')
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    // Mientras guarda, el botón queda deshabilitado y no se puede enviar otra vez.
    const savingButton = screen.getByRole('button', { name: 'Guardando...' })
    expect(savingButton).toBeDisabled()
    await user.click(savingButton)
    expect(onSubmit).toHaveBeenCalledOnce()

    finishSave()
  })

  it('envía la prioridad y la fecha de vencimiento elegidas', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TodoForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Título'), 'Entregar proyecto')
    await user.selectOptions(screen.getByLabelText('Prioridad'), 'high')
    await user.type(screen.getByLabelText('Fecha de vencimiento (opcional)'), '2026-11-19')
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Entregar proyecto',
      description: '',
      priority: 'high',
      dueDate: '2026-11-19',
    })
  })
})
