/**
 * Tests del componente TaskFilters.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskFilters } from '../../src/components/TaskFilters'

const summary = { total: 3, pending: 2, completed: 1 }

describe('TaskFilters', () => {
  it('marca como activo el filtro seleccionado', () => {
    render(<TaskFilters value="pending" onChange={vi.fn()} summary={summary} />)

    expect(screen.getByRole('button', { name: /Pendientes/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Todas/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('muestra cuántas tareas hay en cada grupo', () => {
    render(<TaskFilters value="all" onChange={vi.fn()} summary={summary} />)

    expect(screen.getByRole('button', { name: /Todas/ })).toHaveTextContent('3')
    expect(screen.getByRole('button', { name: /Completadas/ })).toHaveTextContent('1')
  })

  it('avisa el filtro elegido al hacer clic', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TaskFilters value="all" onChange={onChange} summary={summary} />)

    await user.click(screen.getByRole('button', { name: /Completadas/ }))

    expect(onChange).toHaveBeenCalledWith('completed')
  })
})
