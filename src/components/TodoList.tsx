/**
 * Lista de tareas.
 *
 * Solo se encarga de mostrar: recibe las tareas y las acciones por props
 * (no sabe de dónde vienen los datos). Así es fácil de reutilizar y de testear.
 */
import { TodoItem } from './TodoItem'
import { LogoIcon } from './icons'
import type { Task, TaskInput } from '../types/task'

interface TodoListProps {
  tasks: Task[]
  onToggle: (task: Task) => Promise<void>
  onEdit: (taskId: string, input: TaskInput) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  /** Mensaje cuando no hay tareas que mostrar (cambia según el filtro). */
  emptyMessage?: string
}

export function TodoList({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  emptyMessage = 'No tienes tareas todavía. ¡Crea la primera!',
}: TodoListProps) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <LogoIcon size={40} />
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul className="todo-list">
      {tasks.map((task) => (
        // key ayuda a React a saber qué elemento cambió; usamos el ID único de Firestore.
        <TodoItem key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  )
}
