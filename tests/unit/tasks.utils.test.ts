/**
 * Tests unitarios de las funciones puras de tareas (src/utils/tasks.ts).
 */
import { describe, expect, it } from 'vitest'
import {
  DESCRIPTION_MAX_LENGTH,
  filterTasks,
  getTodayString,
  isOverdue,
  sortTasks,
  TITLE_MAX_LENGTH,
  getTaskSummary,
  normalizeTaskInput,
  sortTasksByNewest,
  validateTaskInput,
} from '../../src/utils/tasks'
import type { Task, TaskInput } from '../../src/types/task'

/** Crea una tarea de prueba; solo hay que indicar los campos que importan en cada test. */
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'id-1',
    userId: 'user-1',
    title: 'Tarea',
    description: '',
    completed: false,
    priority: 'medium',
    dueDate: null,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }
}

/** Crea datos de formulario de prueba con valores por defecto. */
function makeInput(overrides: Partial<TaskInput> = {}): TaskInput {
  return { title: 'Tarea', description: '', priority: 'medium', dueDate: null, ...overrides }
}

describe('validateTaskInput', () => {
  it('acepta una tarea con título válido', () => {
    expect(validateTaskInput(makeInput({ title: 'Comprar pan' }))).toEqual({})
  })

  it('exige el título (los espacios solos no cuentan)', () => {
    expect(validateTaskInput(makeInput({ title: '   ' })).title).toBe('El título es obligatorio.')
  })

  it('acepta los límites exactos de longitud (100 y 500 caracteres)', () => {
    const errors = validateTaskInput(
      makeInput({ title: 'a'.repeat(TITLE_MAX_LENGTH), description: 'a'.repeat(DESCRIPTION_MAX_LENGTH) }),
    )
    expect(errors).toEqual({})
  })

  it('rechaza un título demasiado largo', () => {
    const errors = validateTaskInput(makeInput({ title: 'a'.repeat(TITLE_MAX_LENGTH + 1) }))
    expect(errors.title).toMatch(/no puede superar/)
  })

  it('rechaza una descripción demasiado larga', () => {
    const errors = validateTaskInput(makeInput({ description: 'a'.repeat(DESCRIPTION_MAX_LENGTH + 1) }))
    expect(errors.description).toMatch(/no puede superar/)
  })

  it('rechaza una fecha con formato inválido', () => {
    expect(validateTaskInput(makeInput({ dueDate: '20/11/2026' })).dueDate).toMatch(/formato válido/)
  })

  it('acepta una tarea sin fecha de vencimiento', () => {
    expect(validateTaskInput(makeInput({ dueDate: null }))).toEqual({})
  })
})

describe('normalizeTaskInput', () => {
  it('quita espacios al inicio y al final', () => {
    expect(normalizeTaskInput(makeInput({ title: '  Hola  ', description: ' mundo ' }))).toEqual({
      title: 'Hola',
      description: 'mundo',
      priority: 'medium',
      dueDate: null,
    })
  })

  it('convierte una fecha vacía en null', () => {
    expect(normalizeTaskInput(makeInput({ dueDate: '' })).dueDate).toBeNull()
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

describe('filterTasks', () => {
  const pendiente = makeTask({ id: 'p', completed: false })
  const completada = makeTask({ id: 'c', completed: true })
  const tasks = [pendiente, completada]

  it('devuelve todas con el filtro "all"', () => {
    expect(filterTasks(tasks, 'all')).toEqual(tasks)
  })

  it('devuelve solo las pendientes', () => {
    expect(filterTasks(tasks, 'pending').map((t) => t.id)).toEqual(['p'])
  })

  it('devuelve solo las completadas', () => {
    expect(filterTasks(tasks, 'completed').map((t) => t.id)).toEqual(['c'])
  })
})

describe('sortTasks', () => {
  it('por prioridad: alta primero y, a igual prioridad, la que vence antes', () => {
    const baja = makeTask({ id: 'baja', priority: 'low' })
    const altaTarde = makeTask({ id: 'alta-tarde', priority: 'high', dueDate: '2026-12-31' })
    const altaPronto = makeTask({ id: 'alta-pronto', priority: 'high', dueDate: '2026-11-20' })

    expect(sortTasks([baja, altaTarde, altaPronto], 'priority').map((t) => t.id)).toEqual([
      'alta-pronto',
      'alta-tarde',
      'baja',
    ])
  })

  it('por fecha: la que vence antes primero y las que no tienen fecha al final', () => {
    const sinFecha = makeTask({ id: 'sin-fecha' })
    const tarde = makeTask({ id: 'tarde', dueDate: '2026-12-31' })
    const pronto = makeTask({ id: 'pronto', dueDate: '2026-11-20' })

    expect(sortTasks([sinFecha, tarde, pronto], 'dueDate').map((t) => t.id)).toEqual([
      'pronto',
      'tarde',
      'sin-fecha',
    ])
  })

  it('deja las completadas al final aunque tengan prioridad alta', () => {
    const completadaAlta = makeTask({ id: 'completada', priority: 'high', completed: true })
    const pendienteBaja = makeTask({ id: 'pendiente', priority: 'low' })

    expect(sortTasks([completadaAlta, pendienteBaja], 'priority').map((t) => t.id)).toEqual([
      'pendiente',
      'completada',
    ])
  })
})

describe('isOverdue', () => {
  const hoy = '2026-11-19'

  it('es vencida si no está completada y la fecha ya pasó', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-11-18' }), hoy)).toBe(true)
  })

  it('no es vencida si vence hoy o después', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-11-19' }), hoy)).toBe(false)
  })

  it('no es vencida si ya está completada o no tiene fecha', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-11-01', completed: true }), hoy)).toBe(false)
    expect(isOverdue(makeTask({ dueDate: null }), hoy)).toBe(false)
  })
})

describe('getTodayString', () => {
  it('devuelve la fecha en formato AAAA-MM-DD', () => {
    expect(getTodayString(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
