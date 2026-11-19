/**
 * Servicio de tareas: todas las operaciones con Firestore.
 *
 * Estructura en la base de datos:
 *   colección "tasks" → un documento por tarea, con el campo userId del dueño.
 * Las reglas de seguridad (firestore.rules) garantizan en el servidor que
 * cada usuario solo pueda leer y modificar sus propias tareas.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { Timestamp, Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import type { Task, TaskInput } from '../types/task'
import { isValidPriority } from '../utils/tasks'

const TASKS_COLLECTION = 'tasks'
const tasksRef = collection(db, TASKS_COLLECTION)

/**
 * Se suscribe en tiempo real a las tareas de un usuario.
 *
 * onSnapshot vuelve a llamar a onData cada vez que algo cambia (crear,
 * editar, borrar), así la interfaz se actualiza sola tras cada operación.
 * Devuelve una función para cancelar la suscripción.
 */
export function subscribeToUserTasks(
  userId: string,
  onData: (tasks: Task[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  // Filtramos por userId: es obligatorio para que las reglas de seguridad permitan la consulta.
  const userTasksQuery = query(tasksRef, where('userId', '==', userId))

  return onSnapshot(
    userTasksQuery,
    (snapshot) => {
      const tasks = snapshot.docs.map((document) => {
        // 'estimate' usa la hora local mientras el servidor confirma la fecha real.
        const data = document.data({ serverTimestamps: 'estimate' })
        return {
          id: document.id,
          userId: data.userId as string,
          title: data.title as string,
          description: (data.description as string) ?? '',
          completed: Boolean(data.completed),
          // Las tareas creadas antes de existir estos campos no los tienen:
          // les damos valores por defecto para que sigan funcionando.
          priority: isValidPriority(data.priority) ? data.priority : 'medium',
          dueDate: typeof data.dueDate === 'string' ? data.dueDate : null,
          createdAt: (data.createdAt as Timestamp | null)?.toDate() ?? null,
        }
      })
      onData(tasks)
    },
    onError,
  )
}

/** Crea una tarea nueva, pendiente por defecto. */
export async function createTask(userId: string, input: TaskInput): Promise<void> {
  await addDoc(tasksRef, {
    userId,
    title: input.title,
    description: input.description,
    priority: input.priority,
    dueDate: input.dueDate,
    completed: false,
    // serverTimestamp usa la hora del servidor, no la del computador del usuario.
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/** Actualiza los datos editables de una tarea (título, descripción, prioridad y fecha). */
export async function updateTask(taskId: string, input: TaskInput): Promise<void> {
  await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
    title: input.title,
    description: input.description,
    priority: input.priority,
    dueDate: input.dueDate,
    updatedAt: serverTimestamp(),
  })
}

/** Marca una tarea como completada o pendiente. */
export async function setTaskCompleted(taskId: string, completed: boolean): Promise<void> {
  await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
    completed,
    updatedAt: serverTimestamp(),
  })
}

/** Elimina una tarea de forma permanente. */
export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, TASKS_COLLECTION, taskId))
}
