/**
 * Funciones puras para trabajar con tareas.
 *
 * "Puras" significa que no dependen de Firebase ni de React: reciben datos
 * y devuelven datos. Por eso son fáciles de probar con tests unitarios.
 */
import type { Task, TaskFilter, TaskInput, TaskInputErrors, TaskPriority, TaskSort } from '../types/task'

/** Límites de longitud; deben coincidir con las reglas de Firestore (firestore.rules). */
export const TITLE_MAX_LENGTH = 100
export const DESCRIPTION_MAX_LENGTH = 500

/** Prioridades válidas, de mayor a menor (deben coincidir con firestore.rules). */
export const PRIORITIES: TaskPriority[] = ['high', 'medium', 'low']

/** Texto en español de cada prioridad, para mostrar en la interfaz. */
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

/** Peso numérico de cada prioridad, usado para ordenar (más alto = más importante). */
const PRIORITY_WEIGHT: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 }

/** Formato de fecha que guardamos: "AAAA-MM-DD" (el que usa <input type="date">). */
const DUE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Comprueba si un valor cualquiera es una prioridad válida. */
export function isValidPriority(value: unknown): value is TaskPriority {
  return typeof value === 'string' && (PRIORITIES as string[]).includes(value)
}

/**
 * Valida los datos del formulario.
 * Devuelve un objeto con un mensaje por cada campo inválido (vacío si todo está bien).
 */
export function validateTaskInput(input: TaskInput): TaskInputErrors {
  const errors: TaskInputErrors = {}
  const title = input.title.trim()

  if (!title) {
    errors.title = 'El título es obligatorio.'
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `El título no puede superar ${TITLE_MAX_LENGTH} caracteres.`
  }

  if (input.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `La descripción no puede superar ${DESCRIPTION_MAX_LENGTH} caracteres.`
  }

  if (!isValidPriority(input.priority)) {
    errors.priority = 'Elige una prioridad válida.'
  }

  if (input.dueDate && !DUE_DATE_PATTERN.test(input.dueDate)) {
    errors.dueDate = 'La fecha no tiene un formato válido.'
  }

  return errors
}

/** Quita espacios sobrantes al inicio y al final antes de guardar. */
export function normalizeTaskInput(input: TaskInput): TaskInput {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    priority: input.priority,
    // Una fecha vacía ("") se guarda como null: la tarea no tiene vencimiento.
    dueDate: input.dueDate || null,
  }
}

/**
 * Ordena las tareas de la más reciente a la más antigua.
 * Devuelve un arreglo nuevo (no modifica el original, como se recomienda en React).
 * Las tareas sin fecha (recién creadas) quedan primero.
 */
export function sortTasksByNewest(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const timeA = a.createdAt?.getTime() ?? Number.POSITIVE_INFINITY
    const timeB = b.createdAt?.getTime() ?? Number.POSITIVE_INFINITY
    return timeB - timeA
  })
}

/** Resumen numérico de las tareas; se usa en la pantalla y en el email. */
export interface TaskSummary {
  total: number
  completed: number
  pending: number
}

export function getTaskSummary(tasks: Task[]): TaskSummary {
  const completed = tasks.filter((task) => task.completed).length
  return { total: tasks.length, completed, pending: tasks.length - completed }
}

/** Devuelve solo las tareas que corresponden al filtro elegido. */
export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  if (filter === 'pending') return tasks.filter((task) => !task.completed)
  if (filter === 'completed') return tasks.filter((task) => task.completed)
  return tasks
}

/** Compara fechas "AAAA-MM-DD"; las tareas sin fecha van al final. */
function compareDueDates(a: string | null, b: string | null): number {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  // El formato AAAA-MM-DD permite comparar las fechas como texto.
  return a < b ? -1 : 1
}

/**
 * Ordena las tareas según el criterio elegido. Devuelve un arreglo nuevo.
 * - priority: alta → baja; a igual prioridad, la que vence antes.
 * - dueDate:  la que vence antes primero (sin fecha al final); luego por prioridad.
 * - newest:   la más reciente primero.
 * En "priority" y "dueDate" las completadas van al final, porque ya no requieren atención.
 */
export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  if (sort === 'newest') return sortTasksByNewest(tasks)

  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1

    const byPriority = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
    const byDueDate = compareDueDates(a.dueDate, b.dueDate)

    if (sort === 'priority') return byPriority || byDueDate
    return byDueDate || byPriority
  })
}

/** Fecha local de hoy en formato "AAAA-MM-DD". */
export function getTodayString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Una tarea está vencida si no está completada y su fecha ya pasó. */
export function isOverdue(task: Task, today: string = getTodayString()): boolean {
  return !task.completed && task.dueDate !== null && task.dueDate < today
}

/** Muestra una fecha "AAAA-MM-DD" de forma legible, por ejemplo "20 nov 2026". */
export function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split('-').map(Number)
  // Creamos la fecha con año, mes y día locales para evitar desfases por zona horaria.
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
