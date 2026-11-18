/**
 * Tests unitarios de las funciones puras de tareas (src/utils/tasks.ts).
 */
import { describe, expect, it } from 'vitest'
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  getTaskSummary,
  normalizeTaskInput,
  sortTasksByNewest,
  validateTaskInput,
} from '../../src/utils/tasks'
import type { Task } from '../../src/types/task'

/** Crea una tarea de prueba; solo hay que indicar los campos que importan en cada test. */
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'id-1',
    userId: 'user-1',
    title: 'Tarea',
    description: '',
    completed: false,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }
}

describe('validateTaskInput', () => {
  it('acepta una tarea con título válido', () => {
    expect(validateTaskInput({ title: 'Comprar pan', description: '' })).toEqual({})
  })

  it('exige el título (los espacios solos no cuentan)', () => {
    expect(validateTaskInput({ title: '   ', description: '' }).title).toBe('El título es obligatorio.')
  })

  it('rechaza un título demasiado largo', () => {
    const errors = validateTaskInput({ title: 'a'.repeat(TITLE_MAX_LENGTH + 1), description: '' })
    expect(errors.title).toMatch(/no puede superar/)
  })

  it('rechaza una descripción demasiado larga', () => {
    const errors = validateTaskInput({ title: 'Ok', description: 'a'.repeat(DESCRIPTION_MAX_LENGTH + 1) })
    expect(errors.description).toMatch(/no puede superar/)
  })
})

describe('normalizeTaskInput', () => {
  it('quita espacios al inicio y al final', () => {
    expect(normalizeTaskInput({ title: '  Hola  ', description: ' mundo ' })).toEqual({
      title: 'Hola',
      description: 'mundo',
    })
  })
})

describe('sortTasksByNewest', () => {
  it('ordena de la más reciente a la más antigua sin modificar el arreglo original', () => {
    const vieja = makeTask({ id: 'vieja', createdAt: new Date('2026-01-01') })
    const nueva = makeTask({ id: 'nueva', createdAt: new Date('2026-06-01') })
    const original = [vieja, nueva]

    const sorted = sortTasksByNewest(original)

    expect(sorted.map((t) => t.id)).toEqual(['nueva', 'vieja'])
    expect(original.map((t) => t.id)).toEqual(['vieja', 'nueva'])
  })

  it('deja primero las tareas sin fecha (recién creadas)', () => {
    const conFecha = makeTask({ id: 'con-fecha' })
    const sinFecha = makeTask({ id: 'sin-fecha', createdAt: null })

    expect(sortTasksByNewest([conFecha, sinFecha])[0].id).toBe('sin-fecha')
  })
})

describe('getTaskSummary', () => {
  it('cuenta total, completadas y pendientes', () => {
    const tasks = [makeTask({ completed: true }), makeTask(), makeTask()]
    expect(getTaskSummary(tasks)).toEqual({ total: 3, completed: 1, pending: 2 })
  })

  it('funciona con una lista vacía', () => {
    expect(getTaskSummary([])).toEqual({ total: 0, completed: 0, pending: 0 })
  })
})
