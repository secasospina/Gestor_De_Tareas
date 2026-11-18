/**
 * Hook que conecta la interfaz con el servicio de tareas.
 *
 * Expone: la lista de tareas, el estado de carga, el último error y las
 * acciones del CRUD. Los componentes no necesitan saber nada de Firestore.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  createTask,
  deleteTask,
  setTaskCompleted,
  subscribeToUserTasks,
  updateTask,
} from '../services/tasks.service'
import { normalizeTaskInput, sortTasksByNewest } from '../utils/tasks'
import type { Task, TaskInput } from '../types/task'

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Suscripción en tiempo real: se activa cuando hay usuario y se cancela al salir.
  useEffect(() => {
    if (!userId) return

    const unsubscribe = subscribeToUserTasks(
      userId,
      (data) => {
        setTasks(sortTasksByNewest(data))
        setLoading(false)
      },
      () => {
        setError('No se pudieron cargar las tareas. Revisa tu conexión.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [userId])

  /**
   * Ejecuta una operación y, si falla, guarda un mensaje de error.
   * Relanza el error para que el componente que la llamó también pueda reaccionar.
   */
  const run = useCallback(async (operation: () => Promise<void>, message: string) => {
    setError(null)
    try {
      await operation()
    } catch (err) {
      setError(message)
      throw err
    }
  }, [])

  const addTask = useCallback(
    (input: TaskInput) => {
      if (!userId) return Promise.reject(new Error('No hay usuario autenticado'))
      return run(() => createTask(userId, normalizeTaskInput(input)), 'No se pudo crear la tarea.')
    },
    [userId, run],
  )

  const editTask = useCallback(
    (taskId: string, input: TaskInput) =>
      run(() => updateTask(taskId, normalizeTaskInput(input)), 'No se pudo editar la tarea.'),
    [run],
  )

  const toggleTask = useCallback(
    (task: Task) =>
      run(() => setTaskCompleted(task.id, !task.completed), 'No se pudo actualizar la tarea.'),
    [run],
  )

  const removeTask = useCallback(
    (taskId: string) => run(() => deleteTask(taskId), 'No se pudo eliminar la tarea.'),
    [run],
  )

  return { tasks, loading, error, addTask, editTask, toggleTask, removeTask }
}
