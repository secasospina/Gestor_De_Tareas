/**
 * Tipos compartidos del dominio "tareas".
 * Definirlos en un solo lugar evita inconsistencias entre servicios y componentes.
 */

/** Prioridad de una tarea. */
export type TaskPriority = 'low' | 'medium' | 'high'

/** Una tarea tal como la usa la aplicación. */
export interface Task {
  /** ID del documento en Firestore. */
  id: string
  /** UID del usuario dueño de la tarea (sirve para filtrar y para las reglas de seguridad). */
  userId: string
  title: string
  description: string
  completed: boolean
  priority: TaskPriority
  /** Fecha de vencimiento en formato "AAAA-MM-DD", o null si no tiene. */
  dueDate: string | null
  /** Fecha de creación; puede ser null un instante mientras el servidor la asigna. */
  createdAt: Date | null
}

/** Datos que el usuario escribe en el formulario (crear o editar). */
export interface TaskInput {
  title: string
  description: string
  priority: TaskPriority
  /** "AAAA-MM-DD" o null si no tiene fecha de vencimiento. */
  dueDate: string | null
}

/** Errores de validación por campo del formulario. */
export type TaskInputErrors = Partial<Record<keyof TaskInput, string>>

/** Filtro de la lista de tareas. */
export type TaskFilter = 'all' | 'pending' | 'completed'

/** Criterio de orden de la lista de tareas. */
export type TaskSort = 'priority' | 'dueDate' | 'newest'
