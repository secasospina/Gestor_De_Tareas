/**
 * Tests del componente TodoList (incluye el comportamiento de TodoItem).
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodoList } from '../../src/components/TodoList'
import type { Task } from '../../src/types/task'

const tasks: Task[] = [
  {
    id: '1',
    userId: 'u1',
    title: 'Pagar factura',
    description: 'Internet',
    completed: false,
    priority: 'high',
    dueDate: '2020-01-01',
    createdAt: new Date('2026-01-02'),
  },
  {
    id: '2',
    userId: 'u1',
    title: 'Lavar loza',
    description: '',
    completed: true,
    priority: 'low',
    dueDate: null,
    createdAt: new Date('2026-01-01'),
  },
]

/** Renderiza la lista con acciones simuladas (mocks) y devuelve esos mocks para revisarlos. */
function renderList(list: Task[] = tasks) {
  const handlers = {
    onToggle: vi.fn().mockResolvedValue(undefined),
    onEdit: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
  }
  render(<TodoList tasks={list} {...handlers} />)
  return handlers
}

describe('TodoList', () => {
  it('muestra un mensaje cuando no hay tareas', () => {
    renderList([])
    expect(screen.getByText(/No tienes tareas todavía/)).toBeInTheDocument()
  })

  it('muestra todas las tareas con su estado', () => {
    renderList()
    expect(screen.getByText('Pagar factura')).toBeInTheDocument()
    expect(screen.getByText('Lavar loza')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Lavar loza/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Pagar factura/ })).not.toBeChecked()
  })

  it('llama a onToggle al marcar una tarea', async () => {
    const user = userEvent.setup()
    const { onToggle } = renderList()

    await user.click(screen.getByRole('checkbox', { name: /Pagar factura/ }))

    expect(onToggle).toHaveBeenCalledWith(tasks[0])
  })

  it('pide confirmación antes de eliminar', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderList([tasks[0]])

    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByText('¿Eliminar?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sí' }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('permite editar una tarea', async () => {
    const user = userEvent.setup()
    const { onEdit } = renderList([tasks[0]])

    await user.click(screen.getByRole('button', { name: 'Editar' }))
    const titleInput = screen.getByLabelText('Título')
    await user.clear(titleInput)
    await user.type(titleInput, 'Pagar factura de luz')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(onEdit).toHaveBeenCalledWith('1', {
      title: 'Pagar factura de luz',
      description: 'Internet',
      priority: 'high',
      dueDate: '2020-01-01',
    })
  })

  it('muestra la prioridad y marca como vencida una tarea con fecha pasada', () => {
    renderList([tasks[0]])
    expect(screen.getByText('Prioridad Alta')).toBeInTheDocument()
    expect(screen.getByText(/Vencida/)).toBeInTheDocument()
  })
})
