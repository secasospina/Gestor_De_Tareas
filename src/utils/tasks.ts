/**
 * Funciones puras para trabajar con tareas.
 *
 * "Puras" significa que no dependen de Firebase ni de React: reciben datos
 * y devuelven datos. Por eso son fáciles de probar con tests unitarios.
 */
import type { Task, TaskFilter, TaskInput, TaskInputErrors } from '../types/task'

/** Límites de longitud; deben coincidir con las reglas de Firestore (firestore.rules). */
export const TITLE_MAX_LENGTH = 100
export const DESCRIPTION_MAX_LENGTH = 500

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

  return errors
}

/** Quita espacios sobrantes al inicio y al final antes de guardar. */
export function normalizeTaskInput(input: TaskInput): TaskInput {
  return { title: input.title.trim(), description: input.description.trim() }
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
